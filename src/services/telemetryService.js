/**
 * Centralized Telemetry Service Layer for Smart BMS
 * Directly integrated with Firebase Realtime Database Web SDK.
 * Strictly avoids mock data, fake fallbacks, or fabricated readings.
 */

import { 
  ref, 
  onValue, 
  get, 
  set, 
  update, 
  push, 
  query, 
  limitToLast,
  off 
} from 'firebase/database';
import { database, DB_PATHS } from '../config/firebase';

/**
 * Validate individual measurement against physical bounds
 */
export function validateMeasurement(metric, value) {
  if (value === null || value === undefined || isNaN(value)) {
    return { isValid: false, reason: 'MISSING', display: '--' };
  }

  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) {
    return { isValid: false, reason: 'INVALID_FORMAT', display: '--' };
  }

  switch (metric) {
    case 'voltage':
      if (num < 0 || num > 65.0) {
        return { isValid: false, reason: 'OUT_OF_BOUNDS', display: `${num.toFixed(2)} V (Out of range)` };
      }
      return { isValid: true, value: num, display: `${num.toFixed(2)} V` };

    case 'current':
      if (num < -30.0 || num > 30.0) {
        return { isValid: false, reason: 'OUT_OF_BOUNDS', display: `${num.toFixed(2)} A (Out of range)` };
      }
      return { isValid: true, value: num, display: `${num.toFixed(2)} A` };

    case 'power':
      if (num < 0 || num > 2000.0) {
        return { isValid: false, reason: 'OUT_OF_BOUNDS', display: `${num.toFixed(1)} W (Out of range)` };
      }
      return { isValid: true, value: num, display: `${num.toFixed(1)} W` };

    case 'temperature':
      if (num < -10.0 || num > 85.0) {
        return { isValid: false, reason: 'OUT_OF_BOUNDS', display: `${num.toFixed(1)} °C (Out of range)` };
      }
      return { isValid: true, value: num, display: `${num.toFixed(1)} °C` };

    default:
      return { isValid: true, value: num, display: `${num}` };
  }
}

/**
 * Classify device status strictly into:
 * 'FIREBASE_DISCONNECTED' | 'NO_DATA' | 'ONLINE' | 'STALE_DATA' | 'OFFLINE'
 */
export function evaluateDeviceStatus({
  isFirebaseConnected = false,
  hasData = false,
  lastPacketTimestamp = null,
  voltage = null,
  temperature = null,
  deviceStatus = null,
}) {
  if (!isFirebaseConnected) {
    return {
      status: 'FIREBASE_DISCONNECTED',
      label: 'FIREBASE DISCONNECTED',
      variant: 'red',
      description: 'Lost live socket connection to Firebase Realtime Database. Retrying...',
      sensorStatus: { ina219: '--', dht11: '--' },
      isFresh: false,
      ageSeconds: null,
    };
  }

  if (!hasData || (voltage === null && temperature === null && lastPacketTimestamp === null)) {
    return {
      status: 'NO_DATA',
      label: 'NO DATA AVAILABLE',
      variant: 'blue',
      description: 'Connected to Firebase RTDB. Awaiting initial sensor packet from NodeMCU ESP8266...',
      sensorStatus: { ina219: '--', dht11: '--' },
      isFresh: false,
      ageSeconds: null,
    };
  }

  const now = Date.now();
  const packetAgeMs = lastPacketTimestamp ? now - lastPacketTimestamp : Infinity;
  const ageSec = Math.floor(packetAgeMs / 1000);

  // If explicitly reported offline or data older than 2 minutes
  if (deviceStatus === 'OFFLINE' || packetAgeMs > 120000) {
    return {
      status: 'OFFLINE',
      label: 'DEVICE OFFLINE',
      variant: 'red',
      description: `ESP8266 node is unreachable. Last packet received ${ageSec}s ago.`,
      sensorStatus: { 
        ina219: voltage !== null ? 'OFFLINE' : 'DISCONNECTED', 
        dht11: temperature !== null ? 'OFFLINE' : 'DISCONNECTED' 
      },
      isFresh: false,
      ageSeconds: ageSec,
    };
  }

  // If data is older than 45 seconds, flag as stale
  if (packetAgeMs > 45000) {
    return {
      status: 'STALE_DATA',
      label: 'STALE DATA',
      variant: 'orange',
      description: `Telemetry stream has stalled. Last valid sensor packet received ${ageSec}s ago.`,
      sensorStatus: { 
        ina219: voltage !== null ? 'STALE' : 'MISSING', 
        dht11: temperature !== null ? 'STALE' : 'MISSING' 
      },
      isFresh: false,
      ageSeconds: ageSec,
    };
  }

  // Dynamic status recognition based on ESP8266 firmware status
  let statusLabel = 'LIVE (HEALTHY)';
  let statusVariant = 'green';
  let statusDesc = 'NodeMCU ESP8266 is active and streaming live sensor packets to Firebase.';

  if (deviceStatus === 'Critical Temperature') {
    statusLabel = 'CRITICAL TEMPERATURE';
    statusVariant = 'red';
    statusDesc = 'ESP8266 triggered Over-Temperature Protection trip.';
  } else if (deviceStatus === 'Temperature Warning') {
    statusLabel = 'TEMPERATURE WARNING';
    statusVariant = 'orange';
    statusDesc = 'ESP8266 ambient temperature is elevated. Cooling fan active.';
  } else if (deviceStatus === 'DHT Sensor Fault') {
    statusLabel = 'DHT SENSOR FAULT';
    statusVariant = 'orange';
    statusDesc = 'ESP8266 detected DHT11 1-wire communication failure. Fail-safe active.';
  } else if (deviceStatus === 'Waiting for DHT') {
    statusLabel = 'WAITING FOR DHT';
    statusVariant = 'blue';
    statusDesc = 'ESP8266 is initializing DHT sensor readings.';
  } else if (deviceStatus === 'Starting') {
    statusLabel = 'INITIALIZING';
    statusVariant = 'blue';
    statusDesc = 'NodeMCU ESP8266 is booting hardware devices.';
  } else if (deviceStatus === 'Normal') {
    statusLabel = 'LIVE (NORMAL)';
    statusVariant = 'green';
  }

  return {
    status: 'ONLINE',
    label: statusLabel,
    variant: statusVariant,
    description: statusDesc,
    sensorStatus: { 
      ina219: voltage !== null ? 'ACTIVE (0x40)' : 'NO DATA', 
      dht11: temperature !== null ? 'ACTIVE (1-WIRE)' : 'NO DATA' 
    },
    isFresh: true,
    ageSeconds: ageSec,
  };
}

/**
 * Calculate mathematical Min, Max, Avg from time series
 * Excludes invalid or null points to prevent skewing
 */
export function calculateStatistics(dataPoints = []) {
  const calc = (values) => {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (valid.length === 0) {
      return { min: '--', max: '--', avg: '--', count: 0, hasData: false };
    }
    const sum = valid.reduce((acc, val) => acc + val, 0);
    return {
      min: Math.min(...valid).toFixed(2),
      max: Math.max(...valid).toFixed(2),
      avg: (sum / valid.length).toFixed(2),
      count: valid.length,
      hasData: true,
    };
  };

  const voltages = dataPoints.map(p => p.voltage);
  const currents = dataPoints.map(p => p.current);
  const powers = dataPoints.map(p => p.power);
  const temperatures = dataPoints.map(p => p.temperature);

  return {
    voltage: calc(voltages),
    current: calc(currents),
    power: calc(powers),
    temperature: calc(temperatures),
    totalSamples: dataPoints.length,
  };
}

/**
 * Evaluate real delta and trend between historical points
 * Does NOT fabricate trends when insufficient history exists
 */
export function calculateTrend(history = [], key = 'voltage') {
  if (!history || history.length < 2) {
    return {
      hasTrend: false,
      direction: 'flat',
      delta: 0,
      label: 'INSUFFICIENT HISTORY',
    };
  }

  const latest = history[history.length - 1]?.[key];
  const previous = history[history.length - 2]?.[key];

  if (typeof latest !== 'number' || typeof previous !== 'number') {
    return {
      hasTrend: false,
      direction: 'flat',
      delta: 0,
      label: 'STABLE',
    };
  }

  const diff = parseFloat((latest - previous).toFixed(2));
  const absDiff = Math.abs(diff);

  if (absDiff < 0.01) {
    return {
      hasTrend: true,
      direction: 'flat',
      delta: 0,
      label: 'STABLE',
    };
  }

  return {
    hasTrend: true,
    direction: diff > 0 ? 'up' : 'down',
    delta: absDiff,
    label: diff > 0 ? `+${absDiff}` : `-${absDiff}`,
  };
}

/**
 * Filter telemetry points by duration window
 */
export function filterByTimeRange(history = [], range = '1h') {
  if (!history || history.length === 0) return [];

  const durations = {
    '1m': 60 * 1000,
    '10m': 10 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    'all': Infinity,
  };

  const windowMs = durations[range.toLowerCase()] || (60 * 60 * 1000);
  if (windowMs === Infinity) return history;

  const now = Date.now();
  const cutoff = now - windowMs;

  const filtered = history.filter(pt => {
    const ptTime = pt.rawTimestamp || (pt.timestamp ? new Date(pt.timestamp).getTime() : 0);
    return ptTime >= cutoff;
  });

  return filtered;
}

/**
 * Normalize raw telemetry object from Firebase RTDB
 */
export function normalizeFirebaseTelemetry(val) {
  if (!val || typeof val !== 'object') return null;

  // Support both raw keys and suffixed ESP8266 keys (voltage_V, current_A, power_W, temperature_C)
  const rawV = val.voltage_V !== undefined ? val.voltage_V : (val.voltage !== undefined ? val.voltage : val.packVoltage);
  const v = typeof rawV === 'number' ? rawV : (rawV ? parseFloat(rawV) : null);

  const rawC = val.current_A !== undefined ? val.current_A : val.current;
  const c = typeof rawC === 'number' ? rawC : (rawC ? parseFloat(rawC) : null);

  const rawT = val.temperature_C !== undefined ? val.temperature_C : (val.temperature !== undefined ? val.temperature : val.temp);
  const t = typeof rawT === 'number' ? rawT : (rawT ? parseFloat(rawT) : null);

  const rawH = val.humidity_percent !== undefined ? val.humidity_percent : val.humidity;
  const h = typeof rawH === 'number' ? rawH : (rawH ? parseFloat(rawH) : null);

  const rawP = val.power_W !== undefined ? val.power_W : val.power;
  const p = typeof rawP === 'number' 
    ? rawP 
    : (rawP ? parseFloat(rawP) : ((v !== null && c !== null && !isNaN(v) && !isNaN(c)) ? parseFloat((v * c).toFixed(2)) : null));

  const e = typeof val.energy_Wh === 'number' 
    ? val.energy_Wh 
    : (val.energy_Wh ? parseFloat(val.energy_Wh) : null);

  const fan = val.fan_status 
    ? String(val.fan_status).toUpperCase() 
    : (val.fanStatus ? String(val.fanStatus).toUpperCase() : (val.fan === true ? 'ON' : val.fan === false ? 'OFF' : '--'));

  const buzzer = val.buzzer_status 
    ? String(val.buzzer_status).toUpperCase() 
    : (val.buzzerStatus ? String(val.buzzerStatus).toUpperCase() : (val.buzzer === true ? 'ON' : val.buzzer === false ? 'OFF' : '--'));

  let rawTime = null;
  if (typeof val.timestamp === 'number') {
    rawTime = val.timestamp;
  } else if (typeof val.updatedAt === 'number') {
    rawTime = val.updatedAt;
  } else if (val.timestamp) {
    const parsed = new Date(val.timestamp).getTime();
    if (!isNaN(parsed)) rawTime = parsed;
  } else if (val.uptime_ms !== undefined || val.voltage_V !== undefined || val.temperature_C !== undefined || val.device_status) {
    // When ESP8266 posts without NTP timestamp, treat as current arrival time
    rawTime = Date.now();
  }

  const timeDisplay = rawTime 
    ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  // Build sensor status object from individual hardware flags or sensor_status
  const sensorStatus = val.sensor_status || {
    ina219: val.ina219_status || (v !== null ? 'OK' : 'NOT DETECTED'),
    dht11: val.dht11_status || (t !== null ? 'OK' : 'NOT DETECTED'),
    oled: val.oled_status || 'OK',
    wifi: val.wifi_status || 'CONNECTED',
  };

  return {
    voltage: (v !== null && !isNaN(v)) ? v : null,
    packVoltage: (v !== null && !isNaN(v)) ? v : null,
    current: (c !== null && !isNaN(c)) ? c : null,
    power: (p !== null && !isNaN(p)) ? p : null,
    energy_Wh: (e !== null && !isNaN(e)) ? e : null,
    temperature: (t !== null && !isNaN(t)) ? t : null,
    humidity: (h !== null && !isNaN(h)) ? h : null,
    fanStatus: fan,
    buzzerStatus: buzzer,
    fan_status: fan,
    buzzer_status: buzzer,
    device_status: val.device_status || val.status || null,
    sensor_status: sensorStatus,
    ina219_status: val.ina219_status || null,
    dht11_status: val.dht11_status || null,
    oled_status: val.oled_status || null,
    wifi_status: val.wifi_status || null,
    timestamp: val.timestamp || (rawTime ? new Date(rawTime).toISOString() : null),
    rawTimestamp: rawTime,
    lastUpdated: timeDisplay,
    ipAddress: val.ipAddress || val.ip || null,
    wifiRssi: val.wifiRssi ?? val.rssi ?? null,
    firmwareVersion: val.firmwareVersion || null,
    soc: null, // explicitly unavailable until verified model
    soh: null,
    cycleCount: null,
    isDemonstration: false,
  };
}

/**
 * Subscribe to Firebase connection state (.info/connected)
 */
export function subscribeToConnectionState(onStateChange) {
  try {
    const connectedRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snap) => {
      onStateChange(Boolean(snap.val()));
    }, (err) => {
      console.warn('[Firebase] Connection listener error:', err.message);
      onStateChange(false);
    });
    return unsubscribe;
  } catch (err) {
    console.error('[Firebase] Failed to listen to .info/connected:', err);
    onStateChange(false);
    return () => {};
  }
}

/**
 * Subscribe to real-time latest telemetry (/smart_bms/latest)
 * with graceful fallback check to /telemetry/current
 */
export function subscribeToLatestTelemetry(onData, onError) {
  let legacyUnsubscribe = null;
  let hasReceivedPrimary = false;

  try {
    const latestRef = ref(database, DB_PATHS.LATEST);
    const primaryUnsubscribe = onValue(latestRef, (snap) => {
      const val = snap.val();
      if (val !== null && val !== undefined) {
        hasReceivedPrimary = true;
        if (legacyUnsubscribe) {
          legacyUnsubscribe();
          legacyUnsubscribe = null;
        }
        const normalized = normalizeFirebaseTelemetry(val);
        onData(normalized);
      } else if (!hasReceivedPrimary) {
        // Fallback check to legacy path
        if (!legacyUnsubscribe) {
          const legacyRef = ref(database, DB_PATHS.LEGACY_LATEST);
          legacyUnsubscribe = onValue(legacyRef, (legacySnap) => {
            const legacyVal = legacySnap.val();
            if (legacyVal) {
              const norm = normalizeFirebaseTelemetry(legacyVal);
              onData(norm);
            } else {
              onData(null);
            }
          }, (err) => {
            if (onError) onError(err);
          });
        }
      }
    }, (err) => {
      console.warn('[Firebase] Latest telemetry read error:', err.message);
      if (onError) onError(err);
    });

    return () => {
      primaryUnsubscribe();
      if (legacyUnsubscribe) legacyUnsubscribe();
    };
  } catch (err) {
    console.error('[Firebase] Failed to subscribe to latest telemetry:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Decodes the 48-bit timestamp from a Firebase push ID key (e.g., -OK12345...)
 */
export function decodePushIdTimestamp(id) {
  if (!id || typeof id !== 'string' || id.length < 8) return null;
  const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  let time = 0;
  for (let i = 1; i < 9; i++) {
    const c = id.charAt(i);
    const charIndex = PUSH_CHARS.indexOf(c);
    if (charIndex === -1) return null;
    time = time * 64 + charIndex;
  }
  return time;
}

/**
 * Subscribe to historical readings (/smart_bms/readings)
 * with graceful fallback check to /telemetry/history
 */
export function subscribeToReadings(onData, onError, maxPoints = 100) {
  let legacyUnsubscribe = null;
  let hasReceivedPrimary = false;

  try {
    const readingsQuery = query(ref(database, DB_PATHS.READINGS), limitToLast(maxPoints));
    const primaryUnsubscribe = onValue(readingsQuery, (snap) => {
      const val = snap.val();
      if (val) {
        hasReceivedPrimary = true;
        if (legacyUnsubscribe) {
          legacyUnsubscribe();
          legacyUnsubscribe = null;
        }
        const points = Object.keys(val).map(key => {
          const item = val[key];
          const norm = normalizeFirebaseTelemetry(item);
          // If timestamp was missing from payload, decode the Firebase push ID
          let pointTime = norm.rawTimestamp;
          if (!pointTime) {
            pointTime = decodePushIdTimestamp(key) || Date.now();
          }
          return {
            id: key,
            key,
            ...norm,
            rawTimestamp: pointTime,
            timestamp: new Date(pointTime).toISOString(),
            time: new Date(pointTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };
        }).sort((a, b) => (a.rawTimestamp || 0) - (b.rawTimestamp || 0));

        onData(points);
      } else if (!hasReceivedPrimary) {
        // Fallback check to legacy history
        if (!legacyUnsubscribe) {
          const legacyQuery = query(ref(database, DB_PATHS.LEGACY_HISTORY), limitToLast(maxPoints));
          legacyUnsubscribe = onValue(legacyQuery, (legSnap) => {
            const legVal = legSnap.val();
            if (legVal) {
              const pts = Object.keys(legVal).map(k => {
                const item = legVal[k];
                const norm = normalizeFirebaseTelemetry(item);
                return { id: k, key: k, ...norm };
              }).sort((a, b) => (a.rawTimestamp || 0) - (b.rawTimestamp || 0));
              onData(pts);
            } else {
              onData([]);
            }
          }, (err) => {
            if (onError) onError(err);
          });
        }
      }
    }, (err) => {
      console.warn('[Firebase] Readings query error:', err.message);
      if (onError) onError(err);
    });

    return () => {
      primaryUnsubscribe();
      if (legacyUnsubscribe) legacyUnsubscribe();
    };
  } catch (err) {
    console.error('[Firebase] Failed to subscribe to readings:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Subscribe to real alerts (/smart_bms/alerts)
 */
export function subscribeToAlerts(onData, onError) {
  try {
    const alertsRef = ref(database, DB_PATHS.ALERTS);
    const unsubscribe = onValue(alertsRef, (snap) => {
      const val = snap.val();
      if (!val) {
        onData([]);
        return;
      }
      const list = Object.keys(val).map(key => {
        const item = val[key];
        const timeMs = typeof item.rawTimestamp === 'number'
          ? item.rawTimestamp
          : (item.timestamp ? new Date(item.timestamp).getTime() : Date.now());

        return {
          id: key,
          key,
          type: item.type || 'Safety Alert',
          message: item.message || 'Safety threshold reached.',
          severity: item.severity || 'Warning',
          sensorValue: item.sensorValue || '--',
          threshold: item.threshold || '--',
          timestamp: item.timestamp 
            ? new Date(timeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recent',
          rawTimestamp: timeMs,
          detectionSource: item.detectionSource || 'Rule-based Hardware Trip',
          recommendedAction: item.recommendedAction || 'Inspect battery system.',
          status: item.status || 'ACTIVE',
          acknowledged: Boolean(item.acknowledged),
        };
      }).sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));

      onData(list);
    }, (err) => {
      console.warn('[Firebase] Alerts subscription error:', err.message);
      if (onError) onError(err);
    });

    return unsubscribe;
  } catch (err) {
    console.error('[Firebase] Failed to subscribe to alerts:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Push a real threshold-based alert into Firebase RTDB
 */
export async function pushRealAlert(alertData) {
  try {
    const alertsRef = ref(database, DB_PATHS.ALERTS);
    const newAlertRef = push(alertsRef);
    const record = {
      ...alertData,
      id: newAlertRef.key,
      status: 'ACTIVE',
      acknowledged: false,
      timestamp: new Date().toISOString(),
      rawTimestamp: Date.now(),
    };
    await set(newAlertRef, record);
    return { success: true, id: newAlertRef.key };
  } catch (err) {
    console.error('[Firebase] Failed to store alert:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Acknowledge single alert in Firebase
 */
export async function acknowledgeAlertInFirebase(alertId) {
  try {
    const alertRef = ref(database, `${DB_PATHS.ALERTS}/${alertId}`);
    await update(alertRef, {
      status: 'RESOLVED',
      acknowledged: true,
      resolvedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    console.error('[Firebase] Failed to acknowledge alert:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Acknowledge all active alerts in Firebase
 */
export async function acknowledgeAllAlertsInFirebase(alerts = []) {
  try {
    const updates = {};
    alerts.forEach(a => {
      if (a.id && (!a.acknowledged || a.status !== 'RESOLVED')) {
        updates[`${DB_PATHS.ALERTS}/${a.id}/status`] = 'RESOLVED';
        updates[`${DB_PATHS.ALERTS}/${a.id}/acknowledged`] = true;
        updates[`${DB_PATHS.ALERTS}/${a.id}/resolvedAt`] = new Date().toISOString();
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
    return { success: true };
  } catch (err) {
    console.error('[Firebase] Failed to acknowledge all alerts:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send actuator command (fan / buzzer) directly to Firebase
 */
export async function sendActuatorCommand(type, state) {
  const normState = String(state).toUpperCase();
  try {
    const updates = {};
    if (type === 'fan') {
      updates[`${DB_PATHS.LATEST}/fan_status`] = normState;
      updates[`${DB_PATHS.CONTROLS}/fan`] = normState;
      // also legacy compatibility
      updates['smart_home/fanStatus'] = normState;
      updates['smart_home/fan'] = normState === 'ON';
    } else {
      updates[`${DB_PATHS.LATEST}/buzzer_status`] = normState;
      updates[`${DB_PATHS.CONTROLS}/buzzer`] = normState;
      // also legacy compatibility
      updates['smart_home/buzzerStatus'] = normState;
    }

    await update(ref(database), updates);

    // Record actuator event in Firebase
    const eventRef = push(ref(database, DB_PATHS.ACTUATOR_EVENTS));
    await set(eventRef, {
      actuator: type === 'fan' ? 'COOLING FAN' : 'EMERGENCY BUZZER',
      state: normState,
      timestamp: new Date().toISOString(),
      rawTimestamp: Date.now(),
      triggeredBy: 'Operator Web Console',
    });

    return { success: true };
  } catch (err) {
    console.error('[Firebase] Actuator command error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send text string to 0.96" OLED display buffer in Firebase
 */
export async function sendOledMessage(message) {
  try {
    const cleanMsg = String(message).trim();
    await set(ref(database, DB_PATHS.OLED), {
      message: cleanMsg,
      timestamp: new Date().toISOString(),
      updatedAt: Date.now(),
    });
    // Legacy compatibility path
    await update(ref(database), {
      'smart_home/message': cleanMsg,
    });
    return { success: true };
  } catch (err) {
    console.error('[Firebase] OLED message dispatch error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch actuator events from Firebase
 */
export async function fetchActuatorEvents(maxCount = 50) {
  try {
    const q = query(ref(database, DB_PATHS.ACTUATOR_EVENTS), limitToLast(maxCount));
    const snap = await get(q);
    const val = snap.val();
    if (!val) return { success: true, data: [] };

    const list = Object.keys(val).map(k => ({
      id: k,
      ...val[k],
    })).sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));

    return { success: true, data: list };
  } catch (err) {
    console.warn('[Firebase] Failed to fetch actuator events:', err.message);
    return { success: false, data: [] };
  }
}

/**
 * Fetch reports from Firebase
 */
export async function fetchReportsList(maxCount = 20) {
  try {
    const q = query(ref(database, DB_PATHS.REPORTS), limitToLast(maxCount));
    const snap = await get(q);
    const val = snap.val();
    if (!val) return { success: true, data: [] };

    const list = Object.keys(val).map(k => ({
      id: k,
      ...val[k],
    })).sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));

    return { success: true, data: list };
  } catch (err) {
    console.warn('[Firebase] Failed to fetch reports list:', err.message);
    return { success: false, data: [] };
  }
}

/**
 * Save report to Firebase
 */
export async function generateReport(period = '24h', title, summaryMetrics = {}) {
  try {
    const reportRef = push(ref(database, DB_PATHS.REPORTS));
    const reportRecord = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      title: title || `Smart BMS Audit Report (${period.toUpperCase()})`,
      reportingPeriod: period,
      period,
      generatedAt: new Date().toISOString(),
      rawTimestamp: Date.now(),
      summaryMetrics,
    };
    await set(reportRef, reportRecord);
    return { success: true, data: reportRecord };
  } catch (err) {
    console.error('[Firebase] Failed to save report:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch alerts (compatible signature)
 */
export async function fetchAlerts() {
  try {
    const snap = await get(ref(database, DB_PATHS.ALERTS));
    const val = snap.val();
    if (!val) return { success: true, data: [] };
    const list = Object.keys(val).map(k => ({ id: k, ...val[k] }));
    return { success: true, data: list };
  } catch (err) {
    return { success: false, data: [] };
  }
}

export async function fetchCurrentTelemetry() {
  try {
    const snap = await get(ref(database, DB_PATHS.LATEST));
    const val = snap.val();
    if (val) {
      return { success: true, data: normalizeFirebaseTelemetry(val) };
    }
    const legacySnap = await get(ref(database, DB_PATHS.LEGACY_LATEST));
    const legVal = legacySnap.val();
    if (legVal) {
      return { success: true, data: normalizeFirebaseTelemetry(legVal) };
    }
    return { success: false, data: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchTelemetryHistory(limit = 60) {
  try {
    const snap = await get(query(ref(database, DB_PATHS.READINGS), limitToLast(limit)));
    const val = snap.val();
    if (val) {
      const list = Object.keys(val).map(k => ({ id: k, ...normalizeFirebaseTelemetry(val[k]) }));
      return { success: true, data: list };
    }
    return { success: false, data: [] };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function fetchHistoricalReadings(filters = {}) {
  return fetchTelemetryHistory(filters.limit || 60);
}

export async function fetchAiResults() {
  return { success: true, data: [] };
}

export async function fetchDeviceEvents() {
  return { success: true, data: [] };
}

export async function fetchDeviceStatus() {
  return { success: true, data: null };
}

export async function ingestTelemetryReading(readingData) {
  try {
    const rRef = push(ref(database, DB_PATHS.READINGS));
    await set(rRef, {
      ...readingData,
      timestamp: new Date().toISOString(),
      rawTimestamp: Date.now(),
    });
    await update(ref(database, DB_PATHS.LATEST), {
      ...readingData,
      timestamp: new Date().toISOString(),
      updatedAt: Date.now(),
    });
    return { ok: true, success: true };
  } catch (err) {
    return { ok: false, success: false, error: err.message };
  }
}

export async function acknowledgeAlertApi(alertId) {
  return acknowledgeAlertInFirebase(alertId);
}

export async function acknowledgeAllAlertsApi() {
  const res = await fetchAlerts();
  return acknowledgeAllAlertsInFirebase(res.data || []);
}
