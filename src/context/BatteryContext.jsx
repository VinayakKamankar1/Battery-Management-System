import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  INITIAL_DEMO_TELEMETRY, 
  PROTECTION_THRESHOLDS 
} from '../services/demoData';
import { 
  evaluateDeviceStatus, 
  calculateTrend, 
  validateMeasurement,
  subscribeToConnectionState,
  subscribeToLatestTelemetry,
  subscribeToReadings,
  subscribeToAlerts,
  pushRealAlert,
  acknowledgeAlertInFirebase,
  acknowledgeAllAlertsInFirebase,
  sendActuatorCommand as sendActuatorCommandFirebase,
  fetchCurrentTelemetry
} from '../services/telemetryService';
import {
  DEFAULT_UNVERIFIED_PROFILE,
  DEFAULT_CALIBRATED_12V_PROFILE,
  calculateApproximateSoc,
  calculateBatteryConditionScore,
  formatVoltageWithCharge
} from '../services/batteryCalculations';
import { getBatterySpecs, selectBatterySpecProfile } from '../services/ragService';

const BatteryContext = createContext(null);

export function BatteryProvider({ children }) {
  // Real sensor telemetry state (defaults strictly to nulls/placeholders, no mock data)
  const [telemetry, setTelemetry] = useState(INITIAL_DEMO_TELEMETRY);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Active battery specification profile (calibrated 12V pack: >=12V full, 9V cutoff)
  const [activeBatterySpec, setActiveBatterySpec] = useState(DEFAULT_CALIBRATED_12V_PROFILE);
  const [availableProfiles, setAvailableProfiles] = useState({});

  // Sync active battery specification profile from backend on mount
  useEffect(() => {
    let isMounted = true;
    getBatterySpecs()
      .then(res => {
        if (isMounted && res.success && res.active_specification) {
          setActiveBatterySpec(res.active_specification);
          if (res.available_profiles) setAvailableProfiles(res.available_profiles);
        }
      })
      .catch(() => {
        // Backend offline or starting up; retain DEFAULT_CALIBRATED_12V_PROFILE
      });
    return () => { isMounted = false; };
  }, []);

  // Connection & Health status
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'live' | 'stale' | 'offline' | 'disconnected' | 'nodata'
  const [lastPacketTimestamp, setLastPacketTimestamp] = useState(null);
  const [freshnessSeconds, setFreshnessSeconds] = useState(null);
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  const [toast, setToast] = useState(null);

  // Audio chime feedback for critical hardware trip events
  const playCriticalAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio autoplay policy catch
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Cooldown tracker for safety trip alerts to prevent duplicate writes
  const lastAlertTimesRef = useRef({
    OTP: 0,
    TEMP_WARN: 0,
    BATTERY_RISK: 0,
    OVP: 0,
    UVP: 0,
    OCP: 0,
  });

  // Evaluate thermal & electrical thresholds on incoming real telemetry
  const evaluateSafetyTrip = useCallback((data) => {
    if (!data) return;
    const now = Date.now();
    const cooldownMs = 60000; // Log at most once per minute per trip type

    const t = data.temperature;
    const v = data.voltage;
    const i = data.current;
    const status = (data.device_status || '').toLowerCase();

    // 1. Critical Over-Temperature Protection (>= 60.0°C or firmware Critical Temperature)
    const isCriticalTemp = (t !== null && t >= 60.0) || status.includes('critical');
    if (isCriticalTemp && (now - lastAlertTimesRef.current.OTP > cooldownMs)) {
      lastAlertTimesRef.current.OTP = now;
      playCriticalAlertSound();
      pushRealAlert({
        type: 'OVER-TEMPERATURE TRIP',
        code: 'OTP-01',
        message: `Critical high temperature detected: ${t !== null ? t.toFixed(1) + '°C' : 'Critical'}. Exceeds 60.0°C safety threshold. Immediate battery risk!`,
        severity: 'Critical',
        sensorValue: t !== null ? `${t.toFixed(1)} °C` : 'Critical',
        threshold: '60.0 °C',
        detectionSource: 'DHT11 Thermal Sensor & ESP8266 Interlock',
        recommendedAction: 'Emergency cooling engaged. Immediately disconnect battery pack load and inspect cell thermal condition.',
      });
    }

    // 2. High Temperature / Battery Risk Warning (> 30.0°C or firmware Temperature Warning)
    const isTempWarn = (t !== null && t > 30.0 && t < 60.0) || status.includes('warning');
    if (isTempWarn && !isCriticalTemp && (now - lastAlertTimesRef.current.TEMP_WARN > cooldownMs)) {
      lastAlertTimesRef.current.TEMP_WARN = now;
      pushRealAlert({
        type: 'BATTERY RISK WARNING',
        code: 'WARN-TEMP-01',
        message: `High temperature warning: battery pack ambient reached ${t !== null ? t.toFixed(1) + '°C' : 'Elevated'}. Cooling fan and alarm buzzer activated (> 30.0°C).`,
        severity: 'Warning',
        sensorValue: t !== null ? `${t.toFixed(1)} °C` : 'Elevated',
        threshold: '30.0 °C',
        detectionSource: 'DHT11 Ambient Temperature Monitor',
        recommendedAction: 'Ensure cooling fan airflow passage is clear and verify heat dissipation.',
      });
    }

    // 3. Over-Voltage Protection (OVP > 13.5V for nominal 12V pack)
    if (v !== null && v > 13.5 && (now - lastAlertTimesRef.current.OVP > cooldownMs)) {
      lastAlertTimesRef.current.OVP = now;
      playCriticalAlertSound();
      pushRealAlert({
        type: 'OVER-VOLTAGE PROTECTION (OVP)',
        code: 'OVP-01',
        message: `High pack voltage detected: ${v.toFixed(2)} V. Exceeds nominal 12V envelope cutoff (13.5V).`,
        severity: 'Critical',
        sensorValue: `${v.toFixed(2)} V`,
        threshold: '13.5 V',
        detectionSource: 'INA219 High-Side Power Monitor',
        recommendedAction: 'Disconnect charging source immediately to avoid cell overcharge degradation.',
      });
    }

    // 4. Under-Voltage Protection (UVP < 9.0V deep discharge)
    if (v !== null && v > 0 && v < 9.0 && (now - lastAlertTimesRef.current.UVP > cooldownMs)) {
      lastAlertTimesRef.current.UVP = now;
      playCriticalAlertSound();
      pushRealAlert({
        type: 'UNDER-VOLTAGE CUTOFF (UVP)',
        code: 'UVP-01',
        message: `Critically low pack voltage detected: ${v.toFixed(2)} V. Deep discharge cutoff (< 9.0V).`,
        severity: 'Critical',
        sensorValue: `${v.toFixed(2)} V`,
        threshold: '9.0 V',
        detectionSource: 'INA219 High-Side Power Monitor',
        recommendedAction: 'Disconnect all active loads immediately to prevent copper dissolution and irreversible cell damage.',
      });
    }

    // 5. Over-Current Protection (OCP > 3.0A)
    if (i !== null && Math.abs(i) > 3.0 && (now - lastAlertTimesRef.current.OCP > cooldownMs)) {
      lastAlertTimesRef.current.OCP = now;
      playCriticalAlertSound();
      pushRealAlert({
        type: 'OVER-CURRENT PROTECTION (OCP)',
        code: 'OCP-01',
        message: `Shunt current surpassed maximum rated continuous threshold: ${Math.abs(i).toFixed(2)} A (Limit: 3.0A).`,
        severity: 'Critical',
        sensorValue: `${Math.abs(i).toFixed(2)} A`,
        threshold: '3.0 A',
        detectionSource: 'INA219 0.1Ω Shunt Resistor',
        recommendedAction: 'Inspect load circuit for short circuits or excessive motor inrush.',
      });
    }
  }, [playCriticalAlertSound]);

  // Main Firebase Realtime Database Subscriptions
  useEffect(() => {
    let isSubscribed = true;

    // 1. Connection listener
    const unsubConnection = subscribeToConnectionState((connected) => {
      if (!isSubscribed) return;
      setIsFirebaseConnected(connected);
      if (!connected) {
        setConnectionStatus('disconnected');
      }
    });

    // 2. Latest telemetry listener (/smart_bms/latest)
    const unsubLatest = subscribeToLatestTelemetry(
      (data) => {
        if (!isSubscribed) return;
        if (data && (data.voltage !== null || data.temperature !== null || data.current !== null || data.rawTimestamp !== null)) {
          setHasReceivedData(true);
          const packetTime = data.rawTimestamp || Date.now();
          setLastPacketTimestamp(packetTime);
          setTelemetry(prev => {
            const next = {
              ...prev,
              ...data,
            };
            // Fan and buzzer ON when temp is above 30
            if (typeof data.temperature === 'number' && data.temperature > 30.0) {
              next.fanStatus = 'ON';
              next.fan_status = 'ON';
              next.buzzerStatus = 'ON';
              next.buzzer_status = 'ON';
            }
            return next;
          });
          if (typeof data.temperature === 'number' && data.temperature > 30.0) {
            if (data.fanStatus !== 'ON' && data.fan_status !== 'ON') {
              sendActuatorCommandFirebase('fan', 'ON');
            }
            if (data.buzzerStatus !== 'ON' && data.buzzer_status !== 'ON') {
              sendActuatorCommandFirebase('buzzer', 'ON');
            }
          }
          evaluateSafetyTrip(data);
        } else if (!hasReceivedData) {
          // No data at path yet
          setTelemetry(prev => ({
            ...prev,
            voltage: null,
            current: null,
            power: null,
            temperature: null,
            timestamp: null,
            lastUpdated: null,
          }));
        }
      },
      (err) => {
        if (!isSubscribed) return;
        console.warn('[Firebase RTDB] Latest telemetry error:', err.message);
        setFirebaseError(err.message);
      }
    );

    // 3. Historical readings listener (/smart_bms/readings)
    const unsubReadings = subscribeToReadings(
      (readingPoints) => {
        if (!isSubscribed) return;
        if (Array.isArray(readingPoints) && readingPoints.length > 0) {
          setHistory(readingPoints);
        } else {
          setHistory([]);
        }
      },
      (err) => {
        if (!isSubscribed) return;
        console.warn('[Firebase RTDB] Readings error:', err.message);
      },
      100
    );

    // 4. Alerts listener (/smart_bms/alerts) - filtered strictly to high temperature & battery risk warnings
    const unsubAlerts = subscribeToAlerts(
      (alertsList) => {
        if (!isSubscribed) return;
        if (Array.isArray(alertsList)) {
          const filtered = alertsList.filter((alert) => {
            const typeStr = (alert.type || '').toLowerCase();
            const codeStr = (alert.code || '').toLowerCase();
            const msgStr = (alert.message || '').toLowerCase();

            // Exclude voltage trips and current trips
            if (
              typeStr.includes('voltage') ||
              codeStr.includes('ovp') ||
              codeStr.includes('uvp') ||
              msgStr.includes('voltage') ||
              msgStr.includes('discharge lockout') ||
              typeStr.includes('current') ||
              codeStr.includes('ocp')
            ) {
              return false;
            }

            // Strictly include high temperature or battery risk warnings
            const isTemp =
              typeStr.includes('temp') ||
              typeStr.includes('thermal') ||
              typeStr.includes('otp') ||
              typeStr.includes('heat') ||
              msgStr.includes('temp') ||
              msgStr.includes('thermal') ||
              (alert.sensorValue || '').includes('°C');

            const isRisk =
              typeStr.includes('risk') ||
              typeStr.includes('warning') ||
              typeStr.includes('hazard') ||
              typeStr.includes('runaway') ||
              msgStr.includes('risk') ||
              msgStr.includes('hazard');

            return isTemp || isRisk;
          });
          setAlerts(filtered);
        }
      },
      (err) => {
        if (!isSubscribed) return;
        console.warn('[Firebase RTDB] Alerts error:', err.message);
      }
    );

    return () => {
      isSubscribed = false;
      unsubConnection();
      unsubLatest();
      unsubReadings();
      unsubAlerts();
    };
  }, [evaluateSafetyTrip, hasReceivedData]);

  // Freshness & connection status evaluation timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFirebaseConnected) {
        setConnectionStatus('disconnected');
        setFreshnessSeconds(null);
        return;
      }

      if (!hasReceivedData || !lastPacketTimestamp) {
        setConnectionStatus('nodata');
        setFreshnessSeconds(null);
        return;
      }

      const ageSec = Math.floor((Date.now() - lastPacketTimestamp) / 1000);
      setFreshnessSeconds(ageSec);

      if (telemetry.device_status === 'OFFLINE' || ageSec > 120) {
        setConnectionStatus('offline');
      } else if (ageSec > 45) {
        setConnectionStatus('stale');
      } else {
        setConnectionStatus('live');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isFirebaseConnected, hasReceivedData, lastPacketTimestamp, telemetry.device_status]);

  // Dynamic device status object
  const deviceStatusInfo = useMemo(() => {
    return evaluateDeviceStatus({
      isFirebaseConnected,
      hasData: hasReceivedData,
      lastPacketTimestamp,
      voltage: telemetry.voltage,
      temperature: telemetry.temperature,
      deviceStatus: telemetry.device_status,
    });
  }, [isFirebaseConnected, hasReceivedData, lastPacketTimestamp, telemetry.voltage, telemetry.temperature, telemetry.device_status]);

  // Calculate real trends from historical dataset
  const trends = useMemo(() => ({
    voltage: calculateTrend(history, 'voltage'),
    current: calculateTrend(history, 'current'),
    power: calculateTrend(history, 'power'),
    temperature: calculateTrend(history, 'temperature'),
  }), [history]);

  // Toggle cooling fan
  const toggleFan = useCallback(async (desiredState) => {
    const currentFan = telemetry.fanStatus === 'ON' ? 'ON' : 'OFF';
    const nextState = desiredState || (currentFan === 'ON' ? 'OFF' : 'ON');

    setTelemetry(prev => ({ ...prev, fanStatus: nextState, fan_status: nextState }));
    showToast(`Transmitted Cooling Fan command: ${nextState}`, 'info');

    const res = await sendActuatorCommandFirebase('fan', nextState);
    if (!res.success) {
      showToast('Firebase command failed: ' + (res.error || 'Network error'), 'warning');
    }
  }, [telemetry.fanStatus, showToast]);

  // Toggle alarm buzzer
  const toggleBuzzer = useCallback(async (desiredState) => {
    const currentBuzzer = telemetry.buzzerStatus === 'ON' ? 'ON' : 'OFF';
    const nextState = desiredState || (currentBuzzer === 'ON' ? 'OFF' : 'ON');

    setTelemetry(prev => ({ ...prev, buzzerStatus: nextState, buzzer_status: nextState }));
    if (nextState === 'ON') playCriticalAlertSound();
    showToast(`Transmitted Alarm Buzzer command: ${nextState}`, 'info');

    const res = await sendActuatorCommandFirebase('buzzer', nextState);
    if (!res.success) {
      showToast('Firebase command failed: ' + (res.error || 'Network error'), 'warning');
    }
  }, [telemetry.buzzerStatus, playCriticalAlertSound, showToast]);

  // Acknowledge single alert
  const acknowledgeSingleAlert = useCallback(async (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'RESOLVED', acknowledged: true } : a));
    showToast(`Alert #${alertId.slice(-6)} marked as reviewed`, 'info');
    await acknowledgeAlertInFirebase(alertId);
  }, [showToast]);

  // Acknowledge all alerts
  const acknowledgeAllAlerts = useCallback(async () => {
    const currentList = alerts;
    setAlerts(prev => prev.map(a => ({ ...a, status: 'RESOLVED', acknowledged: true })));
    showToast('All safety alerts marked as acknowledged', 'info');
    await acknowledgeAllAlertsInFirebase(currentList);
  }, [alerts, showToast]);

  // Manual refresh / sync action
  const refreshTelemetry = useCallback(async () => {
    showToast('Syncing latest state with Firebase RTDB...', 'info');
    const res = await fetchCurrentTelemetry();
    if (res.success && res.data) {
      setTelemetry(prev => ({ ...prev, ...res.data }));
      setLastPacketTimestamp(res.data.rawTimestamp || Date.now());
      setHasReceivedData(true);
      showToast('Fresh telemetry received from Firebase RTDB', 'info');
    } else {
      showToast('Firebase RTDB connected: awaiting new ESP8266 transmission', 'info');
    }
  }, [showToast]);

  // Switch active battery specification profile
  const switchBatteryProfile = useCallback(async (profileId) => {
    try {
      showToast(`Switching battery specification...`, 'info');
      const res = await selectBatterySpecProfile(profileId);
      if (res.success && res.active_specification) {
        setActiveBatterySpec(res.active_specification);
        showToast(`Battery specification active: ${res.active_specification.name}`, 'info');
        return res;
      }
    } catch (err) {
      showToast(`Failed to switch profile: ${err.message}`, 'warning');
    }
  }, [showToast]);

  // Approximate Charge Percentage (SOC) - Unavailable when chemistry is unverified
  const socInfo = useMemo(() => {
    return calculateApproximateSoc(telemetry.voltage, activeBatterySpec);
  }, [telemetry.voltage, activeBatterySpec]);

  // Combined charge and voltage display, e.g. '~75% | 12.40 V' or 'Unavailable | 11.15 V'
  const voltageWithSoc = useMemo(() => {
    return formatVoltageWithCharge(telemetry.voltage, activeBatterySpec);
  }, [telemetry.voltage, activeBatterySpec]);

  // Documented Battery Condition Score (0-100%) and clear statuses (Excellent, Good, Normal, Warning, Danger, Insufficient Data)
  const batteryCondition = useMemo(() => {
    return calculateBatteryConditionScore(telemetry, activeBatterySpec, deviceStatusInfo);
  }, [telemetry, activeBatterySpec, deviceStatusInfo]);

  // State of Health (SOH) - strictly NOT calculated from voltage alone
  const sohInfo = useMemo(() => ({
    soh: null,
    displayText: 'Unavailable',
    status: 'Uncalibrated',
    explanation: 'State of Health (SOH) requires multi-cycle capacity testing (Coulomb counting). SOH cannot be inferred from instantaneous voltage alone.'
  }), []);

  const value = {
    telemetry,
    history,
    alerts,
    connectionStatus,
    isFirebaseConnected,
    hasReceivedData,
    trends,
    lastPacketTimestamp,
    freshnessSeconds,
    deviceStatusInfo,
    activeBatterySpec,
    availableProfiles,
    switchBatteryProfile,
    socInfo,
    voltageWithSoc,
    batteryCondition,
    sohInfo,
    protectionThresholds: PROTECTION_THRESHOLDS,
    toggleFan,
    toggleBuzzer,
    refreshTelemetry,
    acknowledgeSingleAlert,
    acknowledgeAllAlerts,
    showToast,
    playCriticalAlertSound,
  };

  return (
    <BatteryContext.Provider value={value}>
      {children}
      {toast && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'critical' ? 'var(--color-crimson)' :
                             toast.type === 'warning' ? 'var(--color-coral)' : 'var(--color-zinc-900)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            fontFamily: 'var(--font-inter-variable)',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'pageFadeSlide 0.25s ease',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </BatteryContext.Provider>
  );
}

export function useBattery() {
  const ctx = useContext(BatteryContext);
  if (!ctx) throw new Error('useBattery must be used within a BatteryProvider');
  return ctx;
}
