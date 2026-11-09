/**
 * AI Battery Assistant & Agent Explanation Layer
 * 
 * Translates technical outputs from the Machine Learning Prediction Engine,
 * rule-based threshold detectors, and statistical anomaly estimators into 
 * clear, grounded, plain-language engineering explanations.
 * 
 * STRICT ARCHITECTURAL CONSTRAINTS:
 * 1. Grounded in actual sensor readings, alert history, actuator events, and validated ML inferences.
 * 2. Never invents numerical values or declares the battery safe independently.
 * 3. Clearly distinguishes DHT11 ambient enclosure air temperature from internal cell core temperature.
 * 4. Explicitly maintains the 4-tier classification:
 *    - Rule-based threshold warnings
 *    - Statistical anomaly detection
 *    - Trained ML predictions
 *    - AI-generated explanations
 */

/**
 * Generates an executive summary explaining the ML prediction in simple language
 * @param {Object} prediction - Output from BatteryPredictionEngine
 * @returns {Object} { summary, plainExplanation, bulletPoints, actionSummary }
 */
export function explainPredictionInSimpleLanguage(prediction) {
  if (!prediction || prediction.riskLevel === 'Unavailable' || prediction.failureProbability === null) {
    return {
      levelTitle: 'ℹ️ AI Predictive Model Pending Integration',
      plainExplanation: 'Predictive ML failure models and RUL algorithms require multi-cycle trained weights. Active protection relies on real-time hardware threshold interlocks (OVP, UVP, OCP, OTP) running on the NodeMCU ESP8266 controller.',
      mainDetectedReason: prediction?.mainDetectedReason || 'Model integration pending. Telemetry is streaming live from Firebase RTDB (/smart_bms/latest).',
      recommendedAction: prediction?.recommendedAction || 'Hardware safety threshold registers provide direct live protection.',
    };
  }

  const { riskLevel, failureProbability, mainDetectedReason, recommendedAction } = prediction;

  let levelTitle = '';
  let plainExplanation = '';

  if (riskLevel === 'Critical') {
    levelTitle = '🚨 Critical Risk Detected by ML Engine';
    plainExplanation = `The prediction model estimates an **elevated failure probability of ${failureProbability}%**. Immediate operator review is recommended because one or more vital parameters (thermal slope, voltage sag, or current variance) have breached safety envelopes.`;
  } else if (riskLevel === 'Warning') {
    levelTitle = '⚠️ Advisory Stress Detected by ML Engine';
    plainExplanation = `The battery is operational, but the prediction model detected **developing stress indicators (${failureProbability}% failure probability)**. Without inspection, this condition will accelerate degradation or trigger hardware protection lockouts.`;
  } else {
    levelTitle = '✅ Nominal Health & Optimal Stability';
    plainExplanation = `The battery exhibits **low failure risk (${failureProbability}%)**. Monitored electrical and thermal parameters are operating within standard manufacturer design margins.`;
  }

  return {
    levelTitle,
    plainExplanation,
    mainDetectedReason: mainDetectedReason || 'All physical parameters are within normal envelopes.',
    recommendedAction: recommendedAction || 'Maintain standard operational procedures.',
  };
}

/**
 * Grounded Conversational AI Assistant responses for user queries
 * 
 * Evaluates the 5 mandatory queries:
 * 1. What caused the latest warning?
 * 2. Why did the fan activate?
 * 3. Summarize recent voltage and temperature trends.
 * 4. Explain the latest alert.
 * 5. What measurements should be checked next?
 * 
 * @param {string} userQuery
 * @param {Object} prediction - ML prediction output
 * @param {Object} context - { telemetry, alerts, actuatorEvents, history, deviceStatus }
 * @returns {Object} { answer, topic }
 */
export function getAssistantResponse(userQuery, prediction, context = {}) {
  const q = (userQuery || '').toLowerCase().trim();
  const {
    riskLevel = 'Normal',
    failureProbability = 0,
    mainDetectedReason = 'Parameters are nominal.',
    recommendedAction = 'Continue standard operation.',
    rawMetrics = {},
    trends = {},
    modelMetadata = {},
  } = prediction || {};

  const {
    telemetry = {},
    alerts = [],
    actuatorEvents = [],
    history = [],
  } = context;

  // Real measured readings (never invented)
  const v = telemetry.voltage ?? rawMetrics.voltage ?? null;
  const c = telemetry.current ?? rawMetrics.current ?? null;
  const p = telemetry.power ?? rawMetrics.power ?? null;
  const t = telemetry.temperature ?? rawMetrics.temperature ?? null;
  const fanState = telemetry.fanStatus || 'OFF';
  const buzzerState = telemetry.buzzerStatus || 'OFF';

  const vStr = v !== null ? `${v.toFixed(2)} V` : '-- V';
  const cStr = c !== null ? `${c.toFixed(2)} A` : '-- A';
  const pStr = p !== null ? `${p.toFixed(1)} W` : '-- W';
  const tStr = t !== null ? `${t.toFixed(1)} °C` : '-- °C';

  // Find latest active or unresolved alert
  const latestAlert = alerts.length > 0 ? alerts[0] : null;

  // -------------------------------------------------------------
  // Mandatory Question 1: What caused the latest warning?
  // -------------------------------------------------------------
  if (
    q.includes('what caused the latest warning') ||
    q.includes('caused the latest warning') ||
    q.includes('latest warning') ||
    q.includes('why warning')
  ) {
    if (!latestAlert) {
      return {
        topic: 'Latest Warning Diagnostic',
        answer: `There are currently **no active warnings or trip alarms** recorded in the system log.
        
**Current Measured Telemetry**:
- Pack Voltage: **${vStr}** (Nominal operating range: 42.0V – 54.0V)
- Pack Current: **${cStr}** (Continuous discharge limit: 15.0A)
- Enclosure Ambient Temperature: **${tStr}** (Auto-fan setpoint: 35.0°C, OTP cutoff: 45.0°C)

All parameters are currently operating below safety trip boundaries.`,
      };
    }

    return {
      topic: 'Root Cause of Latest Warning',
      answer: `The latest warning in the system log was triggered by **${latestAlert.type || 'Unknown Warning'}** (${latestAlert.timestamp || 'Recent'}).

**Specific Measured Data**:
- **Triggered Value**: \`${latestAlert.sensorValue || 'N/A'}\`
- **Safety Threshold**: \`${latestAlert.threshold || 'N/A'}\`
- **Severity**: \`${latestAlert.severity || 'Warning'}\`
- **System Message**: "${latestAlert.message || 'Threshold condition met'}"

**Electrochemical & Physical Cause**:
${latestAlert.aiExplanation || 'The measured sensor reading crossed the configured protection threshold. Review physical bus connections and ensure thermal ventilation is unobstructed.'}

*Note: Hardware protection logic runs locally on the NodeMCU ESP8266 controller independently of the web console.*`,
    };
  }

  // -------------------------------------------------------------
  // Mandatory Question 2: Why did the fan activate?
  // -------------------------------------------------------------
  if (
    q.includes('why did the fan activate') ||
    q.includes('fan activate') ||
    q.includes('cooling fan') ||
    q.includes('why fan')
  ) {
    const latestFanEvent = actuatorEvents.find(e => e.actuator === 'fan');

    if (fanState === 'ON') {
      const isThermal = t !== null && t >= 35.0;
      return {
        topic: 'Cooling Fan Activation Analysis',
        answer: `The 12V CPU cooling fan is currently **RUNNING (ON)** via the L298N Channel A driver.

**Reason for Engagement**:
${isThermal 
  ? `🌡️ **Automated Thermal Protection**: Enclosure ambient temperature reached **${tStr}**, which meets or exceeds the automated fan activation threshold (**35.0°C**).`
  : `⚙️ **Manual / Testbench Override**: The fan is running due to an operator test trigger or state command (Current temperature: **${tStr}**).`
}

**Important Sensor Distinction**:
The DHT11 sensor measures **ambient enclosure air temperature**, *not internal electrochemical cell core temperature*. Because ambient air warms up slower than internal cell windings, fan activation at 35.0°C provides proactive thermal dissipation before core overheating can develop.

${latestFanEvent ? `*Last recorded actuator transition: ${latestFanEvent.state} (${latestFanEvent.timestamp ? new Date(latestFanEvent.timestamp).toLocaleTimeString() : 'Recent'}) via ${latestFanEvent.triggeredBy}.*` : ''}`,
      };
    }

    return {
      topic: 'Cooling Fan Standby State',
      answer: `The cooling fan is currently in **STANDBY (OFF)**.

**Operating Status**:
- Measured Enclosure Ambient Temp: **${tStr}**
- Auto-Activation Threshold: **35.0°C**
- Thermal Headroom: ${t !== null ? `${(35.0 - t).toFixed(1)}°C below fan trigger point` : 'Nominal'}

The L298N driver channel remains ready to engage 12V PWM airflow automatically whenever ambient casing temperature reaches or exceeds 35.0°C.`,
    };
  }

  // -------------------------------------------------------------
  // Mandatory Question 3: Summarize recent voltage and temperature trends.
  // -------------------------------------------------------------
  if (
    q.includes('summarize recent voltage and temperature trends') ||
    q.includes('voltage and temperature trends') ||
    q.includes('summarize trends') ||
    q.includes('recent trends')
  ) {
    const validVoltages = history.map(h => h.voltage).filter(x => typeof x === 'number');
    const validTemps = history.map(h => h.temperature).filter(x => typeof x === 'number');

    const vMin = validVoltages.length ? Math.min(...validVoltages).toFixed(2) : '--';
    const vMax = validVoltages.length ? Math.max(...validVoltages).toFixed(2) : '--';
    const vAvg = validVoltages.length ? (validVoltages.reduce((a, b) => a + b, 0) / validVoltages.length).toFixed(2) : '--';

    const tMin = validTemps.length ? Math.min(...validTemps).toFixed(1) : '--';
    const tMax = validTemps.length ? Math.max(...validTemps).toFixed(1) : '--';
    const tAvg = validTemps.length ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1) : '--';

    const tRise = trends.temperatureRise?.rate || 0.0;
    const vSag = trends.voltageSag?.sag || 0.0;

    return {
      topic: 'Voltage and Temperature Trend Summary',
      answer: `Here is the mathematical summary of evaluated historical telemetry (${validVoltages.length} samples):

📊 **Pack Voltage Trend (INA219 0x40)**:
- Current Terminal Voltage: **${vStr}**
- Range: Min **${vMin} V** | Max **${vMax} V** | Average **${vAvg} V**
- Measured Sag under Load (ΔV): **${vSag > 0 ? vSag.toFixed(2) + ' V' : '0.00 V (Stable)'}**
- Evaluation: ${vSag > 2.0 ? '⚠️ Elevated impedance sag detected during load steps.' : '✅ Terminal voltage is stable within normal discharge margins.'}

🌡️ **Ambient Temperature Trend (DHT11 D4)**:
- Current Ambient Enclosure Temp: **${tStr}**
- Range: Min **${tMin} °C** | Max **${tMax} °C** | Average **${tAvg} °C**
- Rate of Change (dT/dt): **${tRise >= 0 ? '+' : ''}${tRise.toFixed(2)} °C/min** ${validTemps.length < 2 ? '*(Requires ≥ 2 timestamped samples)*' : ''}
- Evaluation: ${tRise > 1.2 ? '⚠️ Rapid heating slope detected. Continuous dissipation needed.' : '✅ Thermal gradient is within natural convection capacity.'}

*(Note: DHT11 measures air temperature within the battery housing, not internal core temperature).*`,
    };
  }

  // -------------------------------------------------------------
  // Mandatory Question 4: Explain the latest alert.
  // -------------------------------------------------------------
  if (
    q.includes('explain the latest alert') ||
    q.includes('explain latest alert') ||
    q.includes('latest alert')
  ) {
    if (!latestAlert) {
      return {
        topic: 'Latest Alert Explanation',
        answer: `There are **no active alerts** registered in the database.
        
Current readings: Voltage is **${vStr}**, Current is **${cStr}**, Ambient Temp is **${tStr}**. All hardware safety interlocks (OVP, UVP, OCP, OTP) are in the **NORMAL** state.`,
      };
    }

    return {
      topic: `Explanation: ${latestAlert.type}`,
      answer: `### Alert Diagnostic Breakdown: ${latestAlert.type}

- **Severity Level**: **${latestAlert.severity?.toUpperCase() || 'WARNING'}**
- **Triggered Reading**: \`${latestAlert.sensorValue || 'N/A'}\`
- **Monitored Threshold**: \`${latestAlert.threshold || 'N/A'}\`
- **Logged Timestamp**: \`${latestAlert.timestamp || 'Recent'}\`

**Root Cause Explanation**:
${latestAlert.message || 'A monitored parameter exceeded safe operational bounds.'}

**Technical Background**:
${latestAlert.aiExplanation || 'The microcontroller safety loop evaluated this reading against safety threshold registers. Check physical wiring and verify load parameters.'}

**Resolution Status**: This alert is currently marked as **${latestAlert.status || 'ACTIVE'}**.`,
    };
  }

  // -------------------------------------------------------------
  // Mandatory Question 5: What measurements should be checked next?
  // -------------------------------------------------------------
  if (
    q.includes('what measurements should be checked next') ||
    q.includes('measurements should be checked') ||
    q.includes('what to check') ||
    q.includes('check next') ||
    q.includes('inspection steps')
  ) {
    const isHighTemp = t !== null && t > 35.0;
    const isHighCurrent = c !== null && c > 10.0;
    const isVoltageDroop = v !== null && v < 42.0;

    return {
      topic: 'Recommended Physical Inspection Steps',
      answer: `Based on current telemetry (**${vStr}**, **${cStr}**, **${tStr}**) and system state, here are the prioritized physical inspection steps:

1. 🔍 **INA219 I²C Bus & Shunt Verification**:
   - Inspect the 0.1Ω current shunt resistor connections on the high-side rail.
   - Verify I²C SDA (D2/GPIO4) and SCL (D1/GPIO5) pull-up resistors (standard 4.7kΩ).
2. 🌡️ **DHT11 Thermal Sensor & Casing Airflow**:
   - Inspect the DHT11 probe position. Ensure it sits in representative ambient air inside the battery enclosure.
   - Verify that the cooling fan intake and exhaust vents are free of dust or physical obstructions.
   - ${isHighTemp ? '⚠️ Ambient temperature is elevated (>35°C). Verify that the cooling fan spins freely at 12V.' : 'Thermal dissipation is currently clear.'}
3. ⚡ **Individual Cell Balance Delta**:
   - Check cell balance voltage variance in the Monitoring tab. A healthy pack should maintain cell delta $< 0.05\\text{ V}$ (50 mV).
   - ${isVoltageDroop ? '⚠️ Pack voltage is near Under-Voltage cutoff (42.0V). Inspect individual series cells for premature depletion.' : 'Terminal voltage is within nominal boundaries.'}
4. 🔌 **L298N Actuator & Buzzer Wiring**:
   - Verify 12V supply connection to L298N motor driver terminal blocks and active buzzer ground return on D8.

*Safety Reminder: Never perform physical disassembly while the battery is actively under heavy charge or discharge.*`,
    };
  }

  // -------------------------------------------------------------
  // Anti-Hallucination & Safety Assurance Guardrail
  // -------------------------------------------------------------
  if (
    q.includes('is it safe') || 
    q.includes('is battery safe') || 
    q.includes('declare safe') ||
    q.includes('guarantee safe')
  ) {
    const probDisplay = failureProbability !== null ? `${failureProbability}%` : '--';
    const riskDisplay = riskLevel && riskLevel !== 'Unavailable' ? riskLevel.toUpperCase() : 'MODEL PENDING';

    return {
      topic: 'Safety Assurance Policy',
      answer: `⚠️ **Diagnostic Notice**: As an AI monitoring assistant, I cannot declare a physical battery pack unconditionally safe.

**Current Live Measurements**:
- Pack Voltage: **${vStr}**
- Pack Current: **${cStr}**
- Enclosure Ambient Temp: **${tStr}**
- Failure Probability Score: **${probDisplay}** (${riskDisplay})

While current sensor readings fall within monitored operating bounds, complete battery safety requires verified physical cell health, secure mechanical assembly, and functional hardware interlocks on the ESP8266 controller.`,
    };
  }

  // -------------------------------------------------------------
  // General / Fallback Response
  // -------------------------------------------------------------
  const probDisplay = failureProbability !== null ? `${failureProbability}%` : '--';
  const riskDisplay = riskLevel && riskLevel !== 'Unavailable' ? riskLevel.toUpperCase() : 'MODEL PENDING';

  return {
    topic: 'Smart BMS Grounded Assistant',
    answer: `Here is the telemetry status grounded in current hardware readings:

- **Telemetry**: Voltage **${vStr}** | Current **${cStr}** | Power **${pStr}** | Ambient Temp **${tStr}**
- **Cooling Fan**: **${fanState}** · **Alarm Buzzer**: **${buzzerState}**
- **ML Failure Risk**: **${riskDisplay}** (${probDisplay} failure probability)
- **Primary Finding**: ${mainDetectedReason}
- **Recommended Action**: ${recommendedAction}

You can ask me any of the following:
1. *"What caused the latest warning?"*
2. *"Why did the fan activate?"*
3. *"Summarize recent voltage and temperature trends."*
4. *"Explain the latest alert."*
5. *"What measurements should be checked next?"*`,
  };
}

/**
 * Returns the 5 mandatory suggested questions
 */
export function getSuggestedQuestionsForPrediction() {
  return [
    'What caused the latest warning?',
    'Why did the fan activate?',
    'Summarize recent voltage and temperature trends.',
    'Explain the latest alert.',
    'What measurements should be checked next?',
  ];
}
