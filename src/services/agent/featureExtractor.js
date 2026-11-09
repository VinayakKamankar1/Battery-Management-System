/**
 * Feature Extractor for Battery Telemetry Time-Series
 * Extracts electrochemical trend features from real telemetry without injecting mock values.
 */

import { normalizeBatteryHistory, normalizeBatteryReading } from './batteryDataSchema';

function getTimestampMs(ts, fallbackIndex = 0, intervalSec = 30) {
  if (typeof ts === 'number') {
    return ts > 1e11 ? ts : ts * 1000;
  }
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    if (!isNaN(parsed)) return parsed;
  }
  if (ts instanceof Date && !isNaN(ts.getTime())) {
    return ts.getTime();
  }
  return Date.now() - fallbackIndex * intervalSec * 1000;
}

export function extractBatteryFeatures(rawHistory = [], currentReading = null) {
  let history = normalizeBatteryHistory(rawHistory);

  if (currentReading) {
    const normCurrent = normalizeBatteryReading(currentReading);
    if (history.length === 0 || history[history.length - 1].timestamp !== normCurrent.timestamp) {
      history = [...history, normCurrent];
    }
  }

  if (history.length === 0) {
    const fallback = normalizeBatteryReading(currentReading || {});
    history = [fallback];
  }

  const latest = history[history.length - 1] || {};
  const count = history.length;

  // 1. TEMPERATURE RISE RATE (dT/dt)
  const validTemps = history.map(h => h.temperature).filter(t => typeof t === 'number');
  let effectiveRiseRate = 0;
  let tempRiseStatus = 'Normal';

  if (validTemps.length >= 2) {
    const tStart = getTimestampMs(history[0].timestamp, count - 1, 30);
    const tEnd = getTimestampMs(latest.timestamp, 0, 30);
    const totalMinutes = Math.max(0.5, (tEnd - tStart) / (1000 * 60));
    const tempDeltaTotal = validTemps[validTemps.length - 1] - validTemps[0];
    effectiveRiseRate = parseFloat((tempDeltaTotal / totalMinutes).toFixed(2));

    if (effectiveRiseRate > 1.5 || (typeof latest.temperature === 'number' && latest.temperature > 45)) {
      tempRiseStatus = 'Critical';
    } else if (effectiveRiseRate > 0.5 || (typeof latest.temperature === 'number' && latest.temperature > 38)) {
      tempRiseStatus = 'Warning';
    }
  } else if (typeof latest.temperature === 'number') {
    if (latest.temperature > 45) tempRiseStatus = 'Critical';
    else if (latest.temperature > 38) tempRiseStatus = 'Warning';
  }

  // 2. VOLTAGE SAG
  const validVoltages = history.map(h => h.voltage).filter(v => typeof v === 'number');
  let effectiveVoltageSag = 0;
  let voltageSagStatus = 'Normal';

  if (validVoltages.length >= 2) {
    const maxVoltage = Math.max(...validVoltages);
    const minVoltage = Math.min(...validVoltages);
    effectiveVoltageSag = parseFloat((maxVoltage - minVoltage).toFixed(2));

    if (typeof latest.voltage === 'number' && latest.voltage > 5.0) {
      if (effectiveVoltageSag > 2.2 || latest.voltage < 40.0 || latest.voltage > 54.0) {
        voltageSagStatus = 'Critical';
      } else if (effectiveVoltageSag > 1.2 || latest.voltage < 42.0 || latest.voltage > 53.2) {
        voltageSagStatus = 'Warning';
      }
    }
  } else if (typeof latest.voltage === 'number' && latest.voltage > 5.0) {
    if (latest.voltage < 40.0 || latest.voltage > 54.0) voltageSagStatus = 'Critical';
    else if (latest.voltage < 42.0 || latest.voltage > 53.2) voltageSagStatus = 'Warning';
  }

  // 3. CURRENT VARIATION
  const validCurrents = history.map(h => h.current).filter(c => typeof c === 'number');
  let currentStdDev = 0;
  let maxCurrent = 0;
  let currentVariationStatus = 'Normal';

  if (validCurrents.length >= 2) {
    const currentSum = validCurrents.reduce((acc, c) => acc + c, 0);
    const currentMean = currentSum / validCurrents.length;
    const currentVariance = validCurrents.reduce((acc, c) => acc + Math.pow(c - currentMean, 2), 0) / validCurrents.length;
    currentStdDev = parseFloat(Math.sqrt(currentVariance).toFixed(2));
    maxCurrent = Math.max(...validCurrents);

    if (maxCurrent > 40.0 || currentStdDev > 12.0) {
      currentVariationStatus = 'Critical';
    } else if (maxCurrent > 25.0 || currentStdDev > 6.0) {
      currentVariationStatus = 'Warning';
    }
  } else if (validCurrents.length === 1) {
    maxCurrent = validCurrents[0];
    if (Math.abs(maxCurrent) > 40.0) currentVariationStatus = 'Critical';
  }

  // 4. SOC BEHAVIOR
  const validSocs = history.map(h => h.soc).filter(s => typeof s === 'number');
  let socPerHour = 0;
  let socBehaviorStatus = 'Normal';
  if (validSocs.length >= 2) {
    const socDelta = validSocs[0] - validSocs[validSocs.length - 1];
    socPerHour = parseFloat((socDelta).toFixed(1));
    if (validSocs[validSocs.length - 1] < 10) socBehaviorStatus = 'Critical';
    else if (validSocs[validSocs.length - 1] < 20) socBehaviorStatus = 'Warning';
  }

  // 5. DEGRADATION TREND
  const currentSoh = typeof latest.soh === 'number' ? latest.soh : null;
  const cycleCount = typeof latest.cycleCount === 'number' ? latest.cycleCount : null;
  let degradationRatePerCycle = 0;
  let degradationPer100 = 0;
  let remainingCycles = null;
  let degradationStatus = 'Normal';

  if (currentSoh !== null && cycleCount !== null && cycleCount > 0) {
    const lost = 100 - currentSoh;
    degradationRatePerCycle = lost / cycleCount;
    degradationPer100 = parseFloat((degradationRatePerCycle * 100).toFixed(2));
    remainingCycles = Math.max(0, Math.round((currentSoh - 80) / Math.max(0.0001, degradationRatePerCycle)));
    if (degradationPer100 > 1.8) degradationStatus = 'Critical';
    else if (degradationPer100 > 1.3) degradationStatus = 'Warning';
  }

  return {
    rawMetrics: {
      voltage: latest.voltage,
      current: latest.current,
      temperature: latest.temperature,
      soc: latest.soc,
      soh: currentSoh,
      cycleCount,
      timestamp: latest.timestamp,
    },
    features: {
      temperatureRiseRate: effectiveRiseRate,
      maxTemperature: validTemps.length ? Math.max(...validTemps) : latest.temperature,
      voltageSag: effectiveVoltageSag,
      estimatedInternalResistanceMilliOhms: 0,
      currentStdDev,
      maxCurrentDraw: maxCurrent,
      socDischargeRatePerHour: socPerHour,
      degradationPer100Cycles: degradationPer100,
      projectedRemainingCycles: remainingCycles,
    },
    trends: {
      temperatureRise: {
        status: tempRiseStatus,
        value: `${effectiveRiseRate > 0 ? '+' : ''}${effectiveRiseRate} °C/min`,
      },
      voltageSag: {
        status: voltageSagStatus,
        value: typeof latest.voltage === 'number' ? `ΔV ${effectiveVoltageSag} V` : '--',
      },
      currentVariation: {
        status: currentVariationStatus,
        value: typeof latest.current === 'number' ? `σ = ${currentStdDev} A (Peak: ${maxCurrent} A)` : '--',
      },
      socDrain: {
        status: socBehaviorStatus,
        value: typeof latest.soc === 'number' ? `${latest.soc}%` : '--',
      },
      degradationTrend: {
        status: degradationStatus,
        value: currentSoh !== null ? `${degradationPer100}% / 100 cyc` : 'Uncalibrated',
        remainingCycles: remainingCycles || null,
        ratePer100: degradationPer100,
      },
    },
    hasData: validTemps.length > 0 || validVoltages.length > 0 || validCurrents.length > 0,
  };
}
