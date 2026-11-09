/**
 * Battery Calculations & Specification Profiles
 * Strictly adheres to BMS design rules:
 * 1. Do NOT guess voltage limits or display misleading charge percentages for unverified chemistries.
 * 2. Clearly distinguish estimated charge (SOC), battery condition score, and battery health (SOH).
 * 3. Never calculate SOH from voltage alone.
 */

export const DEFAULT_UNVERIFIED_PROFILE = {
  id: "unverified_12v",
  name: "Nominal 12V Lithium-Ion (Unverified Chemistry)",
  chemistry: "Unverified Lithium-Ion",
  cell_configuration: "Unverified (3S NMC or 4S LiFePO4)",
  nominal_voltage: 12.0,
  min_operating_voltage: null,
  warning_low_voltage: null,
  nominal_resting_voltage: null,
  warning_high_voltage: null,
  max_operating_voltage: null,
  verification_status: "UNVERIFIED",
  verification_notes: "Universal voltage limits cannot be assumed for unknown lithium-ion battery chemistry."
};

export const DEFAULT_CALIBRATED_12V_PROFILE = {
  id: "calibrated_12v",
  name: "12V Lithium-Ion Battery (Calibrated: >=12V Full, 9V Cutoff)",
  manufacturer: "Calibrated 12V Workbench",
  model: "12V Nominal Lithium-Ion Assembly",
  chemistry: "12V Lithium-Ion",
  cell_configuration: "3S Pack (9.0V - 12.0V)",
  nominal_voltage: 12.0,
  min_operating_voltage: 9.00,       // 0% empty safe discharge cutoff
  warning_low_voltage: 9.60,         // 20% low voltage advisory
  nominal_resting_voltage: 11.10,    // 50%-70% mid-range voltage
  warning_high_voltage: 12.00,       // Full charge voltage
  max_operating_voltage: 12.00,      // 100% fully charged (>=12.0V is 100%)
  min_charge_temp: 0.0,
  max_charge_temp: 45.0,
  min_discharge_temp: -20.0,
  max_discharge_temp: 60.0,
  ambient_fan_trigger_temp: 30.0,
  critical_overtemp_cutoff: 60.0,
  rated_capacity_ah: 2.6,
  max_continuous_discharge_current_a: 10.0,
  max_charge_current_a: 2.6,
  verification_status: "VERIFIED",
  verification_notes: "Calibrated 12V pack: >=12.0V is 100% (fully charged); below 12.0V is measured accurately based on voltage down to 9.00V safe cutoff (0%)."
};

/**
 * Calculate approximate State of Charge (SOC) based on voltage and verified chemistry profile.
 * Returns { isAvailable, socPercent, displayText, basis }
 * Display format: e.g. '~75%' or 'Unavailable'
 */
export function calculateApproximateSoc(voltage, spec = DEFAULT_CALIBRATED_12V_PROFILE) {
  if (voltage === null || voltage === undefined || isNaN(voltage)) {
    return {
      isAvailable: false,
      socPercent: null,
      displayText: 'Unavailable',
      basis: 'No voltage reading available from sensor.'
    };
  }

  const v = typeof voltage === 'number' ? voltage : parseFloat(voltage);
  if (isNaN(v)) {
    return {
      isAvailable: false,
      socPercent: null,
      displayText: 'Unavailable',
      basis: 'Invalid voltage format.'
    };
  }

  // Chemistry is unknown/unverified -> Do NOT guess!
  if (!spec || spec.verification_status !== 'VERIFIED') {
    return {
      isAvailable: false,
      socPercent: null,
      displayText: 'Unavailable',
      basis: 'Unavailable: Battery chemistry is unverified. Universal voltage limits cannot be assumed.'
    };
  }

  // Calibrated 12V Profile: >= 12.0V is fully charged (100%), below 12.0V measured accurately down to 9.00V safe cutoff (0%)
  if (spec.id === 'calibrated_12v') {
    if (v >= 12.0) {
      return {
        isAvailable: true,
        socPercent: 100,
        displayText: '~100%',
        basis: 'Voltage is 12.0V or above: Battery is fully charged (100%).'
      };
    } else if (v <= 9.0) {
      return {
        isAvailable: true,
        socPercent: 0,
        displayText: '~0%',
        basis: 'Voltage at or below 9.00V safe discharge cutoff (0%).'
      };
    } else {
      const soc = ((v - 9.0) / (12.0 - 9.0)) * 100;
      const rounded = Math.max(0, Math.min(100, Math.round(soc)));
      return {
        isAvailable: true,
        socPercent: rounded,
        displayText: `~${rounded}%`,
        basis: `Measured accurately from voltage (${v.toFixed(2)}V): >=12.0V is 100% full, 9.00V is 0% cutoff.`
      };
    }
  }

  let curve = null;

  if (spec.id === 'verified_3s_nmc') {
    // 3S NMC (nominal 11.1V, 9.0V - 12.6V pack)
    curve = [
      [9.00, 0],
      [9.60, 10],
      [10.80, 30],
      [11.10, 50],
      [11.55, 65],
      [12.00, 80],
      [12.45, 95],
      [12.60, 100]
    ];
  } else if (spec.id === 'verified_4s_lifepo4') {
    // 4S LiFePO4 (nominal 12.8V, 10.0V - 14.6V pack)
    curve = [
      [10.00, 0],
      [11.20, 5],
      [12.00, 15],
      [12.80, 40],
      [13.20, 70],
      [13.60, 90],
      [14.60, 100]
    ];
  } else if (spec.min_operating_voltage && spec.max_operating_voltage && spec.max_operating_voltage > spec.min_operating_voltage) {
    const minV = spec.min_operating_voltage;
    const maxV = spec.max_operating_voltage;
    if (v >= maxV) {
      return {
        isAvailable: true,
        socPercent: 100,
        displayText: '~100%',
        basis: `Voltage is >= ${maxV.toFixed(2)}V: Battery is fully charged (100%).`
      };
    }
    curve = [
      [minV, 0],
      [minV + (maxV - minV) * 0.5, 50],
      [maxV, 100]
    ];
  } else {
    return {
      isAvailable: false,
      socPercent: null,
      displayText: 'Unavailable',
      basis: 'Unavailable: Voltage limits not defined in profile.'
    };
  }

  // Piecewise linear interpolation
  let soc = 0;
  if (v <= curve[0][0]) {
    soc = 0;
  } else if (v >= curve[curve.length - 1][0]) {
    soc = 100;
  } else {
    for (let i = 0; i < curve.length - 1; i++) {
      const [v0, s0] = curve[i];
      const [v1, s1] = curve[i + 1];
      if (v >= v0 && v <= v1) {
        const fraction = (v - v0) / (v1 - v0);
        soc = s0 + fraction * (s1 - s0);
        break;
      }
    }
  }

  const rounded = Math.round(soc);
  return {
    isAvailable: true,
    socPercent: rounded,
    displayText: `~${rounded}%`,
    basis: `Calculated using ${spec.name} verified piecewise OCV reference curve.`
  };
}

/**
 * Calculates battery condition score (0-100%) and clear statuses:
 * 'Excellent' | 'Good' | 'Normal' | 'Warning' | 'Danger' | 'Insufficient Data'
 */
export function calculateBatteryConditionScore(telemetry, spec = DEFAULT_UNVERIFIED_PROFILE, validation = null) {
  if (!telemetry || (validation && !validation.isValid) || !spec || spec.verification_status !== 'VERIFIED') {
    return {
      status: 'Insufficient Data',
      score: null,
      displayText: 'Insufficient Data',
      scoreText: 'Unavailable',
      isVerified: false,
      deductions: [],
      reason: (!spec || spec.verification_status !== 'VERIFIED')
        ? 'Battery chemistry and operating specifications are unverified.'
        : 'Telemetry readings are incomplete, stale, or out of sensor bounds.'
    };
  }

  const t = typeof telemetry.temperature === 'number' ? telemetry.temperature : null;
  const v = typeof telemetry.voltage === 'number' ? telemetry.voltage : null;
  const c = typeof telemetry.current === 'number' ? Math.abs(telemetry.current) : null;

  let score = 100.0;
  const deductions = [];
  let isDanger = false;
  let isWarning = false;

  // 1. Thermal checks
  if (t !== null) {
    if (t >= (spec.critical_overtemp_cutoff || 60.0)) {
      deductions.push({ factor: 'Critical Over-Temperature', penalty: 60.0, details: `${t.toFixed(1)}°C >= ${spec.critical_overtemp_cutoff || 60.0}°C` });
      score -= 60.0;
      isDanger = true;
    } else if (t >= 45.0) {
      deductions.push({ factor: 'Elevated Alarm Temp', penalty: 40.0, details: `${t.toFixed(1)}°C >= 45.0°C` });
      score -= 40.0;
      isWarning = true;
    } else if (t > (spec.ambient_fan_trigger_temp || 30.0)) {
      deductions.push({ factor: 'Fan & Buzzer Thermal Trigger', penalty: 20.0, details: `${t.toFixed(1)}°C > ${spec.ambient_fan_trigger_temp || 30.0}°C` });
      score -= 20.0;
      isWarning = true;
    }
  }

  // 2. Voltage window checks
  if (v !== null) {
    if (spec.max_operating_voltage && v > spec.max_operating_voltage) {
      deductions.push({ factor: 'Over-Voltage Cutoff Breach', penalty: 50.0, details: `${v.toFixed(2)}V > ${spec.max_operating_voltage}V` });
      score -= 50.0;
      isDanger = true;
    } else if (spec.warning_high_voltage && v > spec.warning_high_voltage) {
      deductions.push({ factor: 'High Voltage Warning Reserve', penalty: 15.0, details: `${v.toFixed(2)}V > ${spec.warning_high_voltage}V` });
      score -= 15.0;
      isWarning = true;
    }

    if (spec.min_operating_voltage && v < spec.min_operating_voltage) {
      deductions.push({ factor: 'Under-Voltage Cutoff Breach', penalty: 50.0, details: `${v.toFixed(2)}V < ${spec.min_operating_voltage}V` });
      score -= 50.0;
      isDanger = true;
    } else if (spec.warning_low_voltage && v < spec.warning_low_voltage) {
      deductions.push({ factor: 'Low Voltage Warning Reserve', penalty: 15.0, details: `${v.toFixed(2)}V < ${spec.warning_low_voltage}V` });
      score -= 15.0;
      isWarning = true;
    }
  }

  // 3. Current check
  if (c !== null && spec.max_continuous_discharge_current_a && c > spec.max_continuous_discharge_current_a) {
    deductions.push({ factor: 'Continuous Current Exceeded', penalty: 25.0, details: `${c.toFixed(2)}A > ${spec.max_continuous_discharge_current_a}A` });
    score -= 25.0;
    isWarning = true;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let status = 'Normal';
  if (isDanger || finalScore < 40) {
    status = 'Danger';
  } else if (isWarning || finalScore < 60) {
    status = 'Warning';
  } else if (finalScore < 75) {
    status = 'Normal';
  } else if (finalScore < 90) {
    status = 'Good';
  } else {
    status = 'Excellent';
  }

  return {
    status,
    score: finalScore,
    displayText: status,
    scoreText: `${finalScore}%`,
    isVerified: true,
    deductions,
    reason: deductions.length > 0
      ? deductions[0].factor + ': ' + deductions[0].details
      : 'All monitored electrical and thermal parameters are nominal within verified specifications.'
  };
}

/**
 * Formats voltage with approximate charge percentage immediately preceding it:
 * e.g., '~75% | 12.40 V' or 'Unavailable | 11.15 V'
 */
export function formatVoltageWithCharge(voltage, spec = DEFAULT_CALIBRATED_12V_PROFILE) {
  const soc = calculateApproximateSoc(voltage, spec);
  const vText = (voltage !== null && voltage !== undefined && !isNaN(voltage))
    ? `${Number(voltage).toFixed(2)} V`
    : '-- V';

  return {
    combinedText: `${soc.displayText} | ${vText}`,
    socText: soc.displayText,
    voltageText: vText,
    socPercent: soc.socPercent,
    isAvailable: soc.isAvailable,
    basis: soc.basis
  };
}
