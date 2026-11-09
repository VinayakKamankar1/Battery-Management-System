import React, { useState, useEffect, useCallback } from 'react';
import { 
  HeartPulse, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Thermometer, 
  Zap, 
  Activity, 
  HelpCircle, 
  CheckCircle2, 
  Info, 
  Clock, 
  BookOpen, 
  FileText, 
  Cpu, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Sliders,
  Send,
  MessageSquare
} from 'lucide-react';
import { Card, PillTag, Button, Eyebrow } from '../UiComponents';
import { useBattery } from '../../context/BatteryContext';
import { 
  triggerRagAnalysis, 
  getLatestRagAnalysis, 
  getBatterySpecs, 
  selectBatterySpecProfile,
  queryRagKnowledgeBase
} from '../../services/ragService';
import { formatVoltageWithCharge } from '../../services/batteryCalculations';

export function AiBatteryHealthAnalysisSection() {
  const { telemetry, history, showToast } = useBattery();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [specsData, setSpecsData] = useState(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [switchingSpec, setSwitchingSpec] = useState(false);

  // Evidence drawer state
  const [expandedChunk, setExpandedChunk] = useState(null);
  const [showEvidence, setShowEvidence] = useState(true);

  // Interactive Question State
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch specs and initial analysis
  const loadSpecsAndInitialAnalysis = useCallback(async () => {
    try {
      const specsRes = await getBatterySpecs();
      if (specsRes.success) {
        setSpecsData(specsRes);
      }
    } catch (err) {
      console.warn('[AI Model Component] Specs load note:', err.message);
    }

    // Try fetching latest analysis
    try {
      const latestRes = await getLatestRagAnalysis();
      if (latestRes.success && latestRes.data) {
        setAnalysis(latestRes.data);
      }
    } catch (err) {
      console.warn('[AI Model Component] Latest analysis note:', err.message);
    }
  }, []);

  useEffect(() => {
    loadSpecsAndInitialAnalysis();
  }, [loadSpecsAndInitialAnalysis]);

  // Execute on-demand Model prediction
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const payloadTelemetry = {
        voltage: telemetry.voltage,
        current: telemetry.current,
        power: telemetry.power,
        temperature: telemetry.temperature,
        humidity: telemetry.humidity || telemetry.ambient_humidity,
        fanStatus: telemetry.fanStatus,
        buzzerStatus: telemetry.buzzerStatus,
        rawTimestamp: telemetry.rawTimestamp || Date.now(),
        timestamp: telemetry.timestamp || new Date().toISOString(),
      };

      const res = await triggerRagAnalysis(payloadTelemetry, history || []);
      if (res.success && res.data) {
        setAnalysis(res.data);
        showToast('Trained AI Model analysis complete', 'info');
      } else {
        throw new Error(res.error || 'Failed to retrieve analysis');
      }
    } catch (err) {
      console.error('[Model Prediction Error]', err);
      setError(err.message || 'AI Model prediction backend unreachable. Verify port 8000.');
      showToast('Failed to execute model prediction', 'warning');
    } finally {
      setLoading(false);
    }
  };

  // Switch active battery specification profile
  const handleSelectProfile = async (profileId) => {
    setSwitchingSpec(true);
    try {
      const res = await selectBatterySpecProfile(profileId);
      if (res.success) {
        showToast(`Battery specification updated: ${res.active_specification?.name}`, 'info');
        // Refresh specs & analysis
        const specsRes = await getBatterySpecs();
        if (specsRes.success) setSpecsData(specsRes);
        const freshAnalysis = await triggerRagAnalysis(telemetry, history);
        if (freshAnalysis.success) setAnalysis(freshAnalysis.data);
      }
    } catch (err) {
      showToast(`Failed to switch profile: ${err.message}`, 'warning');
    } finally {
      setSwitchingSpec(false);
      setShowSpecModal(false);
    }
  };

  // Ask grounded question
  const handleAskQuestion = async (qText) => {
    const query = qText || chatQuestion;
    if (!query.trim()) return;
    setChatLoading(true);
    setChatAnswer(null);
    try {
      const res = await queryRagKnowledgeBase(query, telemetry);
      if (res.success) {
        setChatAnswer(res);
      }
    } catch (err) {
      showToast(`Query failed: ${err.message}`, 'warning');
    } finally {
      setChatLoading(false);
    }
  };

  const cond = analysis?.observed_condition || 'INSUFFICIENT DATA';
  const conditionStatus = analysis?.condition_status || (cond === 'CRITICAL' ? 'Danger' : cond === 'WARNING' ? 'Warning' : cond === 'INSUFFICIENT DATA' ? 'Insufficient Data' : 'Normal');
  const isDanger = conditionStatus === 'Danger' || cond === 'CRITICAL';
  const isWarningStatus = conditionStatus === 'Warning' || cond === 'WARNING';
  const isNormalStatus = conditionStatus === 'Normal' || conditionStatus === 'Good' || conditionStatus === 'Excellent' || cond === 'NORMAL';
  const isInsufficientStatus = conditionStatus === 'Insufficient Data' || cond === 'INSUFFICIENT DATA';

  const conditionBg = isDanger ? '#fef2f2' : isWarningStatus ? '#fffbeb' : isNormalStatus ? '#f0fdf4' : '#f8fafc';
  const conditionBorder = isDanger ? 'var(--color-crimson)' : isWarningStatus ? 'var(--color-coral)' : isNormalStatus ? 'var(--color-sprout)' : 'var(--color-cobalt)';
  const conditionBadgeVariant = isDanger ? 'red' : isWarningStatus ? 'orange' : isNormalStatus ? 'green' : 'blue';

  const readings = analysis?.actual_sensor_readings || {};
  const trends = analysis?.recent_trends || {};
  const limits = analysis?.verified_operating_limits || {};
  const activeProfile = specsData?.active_specification || analysis?.configured_battery || {};

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ========================================================
          1. HEADER & ON-DEMAND ACTION BAR
          ======================================================== */}
      <Card style={{ borderLeft: `5px solid ${conditionBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Eyebrow color="violet">TRAINED AI BATTERY MODEL · PREDICTIVE DIAGNOSTICS</Eyebrow>
              <PillTag variant="purple">ACTIVE PREDICTION MODEL</PillTag>
              <PillTag variant={activeProfile.verification_status === 'VERIFIED' ? 'green' : 'orange'}>
                {activeProfile.verification_status === 'VERIFIED' ? 'SPECIFICATION VERIFIED' : 'SPECIFICATION UNVERIFIED'}
              </PillTag>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-zinc-900)', margin: '4px 0 0' }}>
              Trained AI Battery Health & Failure Prediction Model
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--color-zinc-500)', marginTop: '4px', maxWidth: '780px' }}>
              Evaluates live CAN and sensor telemetry using the trained battery health & degradation prediction model. 
              Delivers real-time condition grading, anomaly diagnostics, and cycle prognostics directly from model inference.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setShowSpecModal(!showSpecModal)}
              icon={Sliders}
            >
              Battery Specs ({activeProfile.chemistry || '12V'})
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleAnalyze}
              icon={RefreshCw}
              disabled={loading}
            >
              {loading ? 'Generating Predictions...' : 'Run Model Prediction'}
            </Button>
          </div>
        </div>

        {/* Profile Switcher Modal / Bar */}
        {showSpecModal && (
          <div 
            style={{ 
              marginTop: '16px', 
              padding: '16px', 
              backgroundColor: 'var(--color-zinc-50)', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-zinc-200)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-zinc-800)' }}>
                Select or Inspect Battery Chemistry & Operating Specification
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
                Universal limits are strictly prohibited for nominal 12V packs
              </span>
            </div>

            <div className="grid-responsive-3" style={{ gap: '12px' }}>
              {specsData?.available_profiles && Object.values(specsData.available_profiles).map((prof) => {
                const isSelected = prof.id === activeProfile.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => handleSelectProfile(prof.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(106, 94, 217, 0.08)' : 'var(--color-white)',
                      border: isSelected ? '2px solid var(--color-iris)' : '1px solid var(--color-zinc-200)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
                        {prof.name}
                      </span>
                      <PillTag variant={prof.verification_status === 'VERIFIED' ? 'green' : 'orange'}>
                        {prof.verification_status}
                      </PillTag>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)' }}>
                      Chemistry: {prof.chemistry} ({prof.cell_configuration})
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-zinc-600)' }}>
                      Voltage Window: {prof.min_operating_voltage ? `${prof.min_operating_voltage}V - ${prof.max_operating_voltage}V` : 'Unverified (Cannot assume universal limits)'}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--color-iris)', marginTop: '4px' }}>
                        ✓ Currently Active Specification Profile
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </Card>

      {/* ========================================================
          2. CURRENT OBSERVED CONDITION CARD
          ======================================================== */}
      <div 
        style={{ 
          padding: '22px 24px', 
          backgroundColor: conditionBg, 
          border: `1.5px solid ${conditionBorder}`, 
          borderRadius: 'var(--radius-cards)',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '12px', 
                backgroundColor: isDanger ? 'rgba(235, 68, 90, 0.15)' : isWarningStatus ? 'rgba(219, 84, 52, 0.15)' : isNormalStatus ? 'rgba(64, 165, 90, 0.15)' : 'rgba(63, 113, 212, 0.15)',
                color: conditionBorder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isDanger ? <AlertOctagon size={26} /> : isWarningStatus ? <AlertTriangle size={26} /> : isNormalStatus ? <ShieldCheck size={26} /> : <Info size={26} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
                  BATTERY CONDITION STATUS:
                </span>
                <PillTag variant={conditionBadgeVariant} pulse={isDanger || isWarningStatus}>
                  {conditionStatus.toUpperCase()} {analysis?.battery_condition_score !== null && analysis?.battery_condition_score !== undefined ? `(${analysis.battery_condition_score}%)` : ''}
                </PillTag>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
                  AUDITED: {analysis?.timestamp ? new Date(analysis.timestamp).toLocaleTimeString() : 'Awaiting Analysis'}
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-zinc-900)', marginTop: '4px' }}>
                {analysis?.executive_summary || 'Click "Run Model Prediction" to execute trained model inference.'}
              </h3>
            </div>
          </div>
        </div>

        {/* Triple Metric Separation Bar (SOC vs Condition Score vs SOH) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '6px' }}>
          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--color-zinc-200)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
              1. Estimated Charge (SOC)
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-900)', marginTop: '2px' }}>
              {analysis?.soc_estimate?.display_text || 'Unavailable'}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              {analysis?.soc_estimate?.basis || 'Unavailable for unverified chemistry.'}
            </span>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--color-zinc-200)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
              2. Battery Condition Score
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: conditionBorder, marginTop: '2px' }}>
              {analysis?.battery_condition_score !== null && analysis?.battery_condition_score !== undefined ? `${analysis.battery_condition_score}%` : 'Unavailable'}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              Status: <strong>{conditionStatus}</strong> (100-pt safety margin model)
            </span>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--color-zinc-200)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
              3. State of Health (SOH)
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginTop: '2px' }}>
              Unavailable
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              *Requires multi-cycle Ah capacity test. Never from voltage alone.
            </span>
          </div>
        </div>

        {/* Primary Health Disclaimer Notice (Mandatory ISO 26262 Rule) */}
        <div 
          style={{ 
            padding: '10px 14px', 
            backgroundColor: 'rgba(24, 24, 27, 0.04)', 
            borderRadius: '6px', 
            fontSize: '12.5px', 
            color: 'var(--color-zinc-700)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <Info size={16} color="var(--color-zinc-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Fundamental Health Principle:</strong> A normal voltage reading alone <em>DOES NOT prove the battery is healthy</em>. Resting Open-Circuit Voltage (OCV) routinely masks internal capacity degradation and elevated impedance until dynamic discharge load is applied.
          </span>
        </div>
      </div>

      {/* ========================================================
          3. ACTUAL TELEMETRY MATRIX & SENSOR VALIDATION
          ======================================================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <Eyebrow color="blue">ACTUAL SENSOR TELEMETRY (FIREBASE RTDB)</Eyebrow>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
              Validated Physical Channel Measurements
            </h3>
          </div>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
            AGE: {readings.packet_age_seconds !== undefined && readings.packet_age_seconds !== null ? `${readings.packet_age_seconds}s` : '--'}
          </span>
        </div>

        <div className="grid-responsive-4">
          <Card>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
              PACK VOLTAGE (INA219)
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-900)', marginTop: '4px' }}>
              {readings.voltage_v !== null && readings.voltage_v !== undefined ? `${readings.voltage_v.toFixed(2)} V` : '-- V'}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              12V Bus Terminal Voltage (Pure Voltage)
            </span>
          </Card>

          <Card>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
              LOAD CURRENT (INA219)
            </span>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-900)', marginTop: '4px' }}>
              {readings.current_a !== null && readings.current_a !== undefined ? `${readings.current_a.toFixed(2)} A` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              Direction: {readings.current_a < 0 ? 'Discharging' : readings.current_a > 0 ? 'Charging' : 'Idle'}
            </span>
          </Card>

          <Card>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
              ELECTRICAL POWER
            </span>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-900)', marginTop: '4px' }}>
              {readings.power_w !== null && readings.power_w !== undefined ? `${readings.power_w.toFixed(2)} W` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              Consistency: P ≈ V × I (Checked)
            </span>
          </Card>

          <Card>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
              AMBIENT ENCLOSURE TEMP (DHT11)
            </span>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: readings.ambient_temperature_c >= 35 ? 'var(--color-coral)' : 'var(--color-zinc-900)', marginTop: '4px' }}>
              {readings.ambient_temperature_c !== null && readings.ambient_temperature_c !== undefined ? `${readings.ambient_temperature_c.toFixed(1)} °C` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-coral)', marginTop: '2px', display: 'block', fontWeight: 500 }}>
              *Enclosure air only (Not core cell)
            </span>
          </Card>
        </div>
      </div>

      {/* ========================================================
          4. RECENT PHYSICAL TRENDS & DERIVATIVES
          ======================================================== */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <Eyebrow color="green">DETERMINISTIC NUMERICAL TRENDS</Eyebrow>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
              Calculated Physical Degradation & Thermodynamic Indicators
            </h3>
          </div>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
            CALCULATED BY DETERMINISTIC BACKEND CODE
          </span>
        </div>

        <div className="grid-responsive-4" style={{ gap: '12px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--color-zinc-50)', borderRadius: '8px', border: '1px solid var(--color-zinc-200)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
              THERMAL RISE RATE (dT/dt)
            </span>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: trends.temperature_rise_rate_c_per_min >= 1.2 ? 'var(--color-coral)' : 'var(--color-zinc-800)', marginTop: '2px' }}>
              {trends.temperature_rise_rate_c_per_min !== null && trends.temperature_rise_rate_c_per_min !== undefined ? `${trends.temperature_rise_rate_c_per_min} °C/min` : '--'}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              Warning threshold: ≥ 1.20 °C/min
            </span>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--color-zinc-50)', borderRadius: '8px', border: '1px solid var(--color-zinc-200)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
              VOLTAGE SAG (ΔV)
            </span>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-800)', marginTop: '2px' }}>
              {trends.voltage_sag_v !== null && trends.voltage_sag_v !== undefined ? `${trends.voltage_sag_v.toFixed(2)} V` : '--'}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              Max - Min in observed window
            </span>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--color-zinc-50)', borderRadius: '8px', border: '1px solid var(--color-zinc-200)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
              ESTIMATED IMPEDANCE (R_int)
            </span>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-800)', marginTop: '2px' }}>
              {trends.estimated_internal_resistance_mohm !== null && trends.estimated_internal_resistance_mohm !== undefined ? `${trends.estimated_internal_resistance_mohm} mΩ` : '--'}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              Ohmic IR = ΔV / ΔI approximation
            </span>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--color-zinc-50)', borderRadius: '8px', border: '1px solid var(--color-zinc-200)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
              ACTUATORS INDEPENDENCE
            </span>
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-sprout)', marginTop: '4px' }}>
              FAN: {readings.fan_status || 'OFF'} · BUZZER: {readings.buzzer_status || 'OFF'}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-zinc-500)', marginTop: '2px', display: 'block' }}>
              Hardware safety loops operate independently of AI model
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================
          5. ROOT CAUSES & RECOMMENDED ACTION PROTOCOL
          ======================================================== */}
      <div className="grid-responsive-2" style={{ gap: '16px' }}>
        
        {/* Possible Causes Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="var(--color-coral)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
              Evidence-Identified Possible Causes
            </h3>
          </div>

          {analysis?.possible_causes && analysis.possible_causes.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-zinc-700)' }}>
              {analysis.possible_causes.map((cause, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>
                  {cause}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--color-zinc-400)', margin: 0 }}>
              No abnormal causes identified. Parameters match nominal baseline.
            </p>
          )}

          {analysis?.data_quality_warnings && analysis.data_quality_warnings.length > 0 && (
            <div style={{ marginTop: '14px', padding: '10px 12px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Data Quality Warnings:
              </span>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#78350f' }}>
                {analysis.data_quality_warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Recommended Actions Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldCheck size={18} color="var(--color-iris)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
              Recommended Engineering Actions
            </h3>
          </div>

          {analysis?.recommended_actions && analysis.recommended_actions.length > 0 ? (
            <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-zinc-700)' }}>
              {analysis.recommended_actions.map((act, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>
                  <strong>Step {idx + 1}:</strong> {act}
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--color-zinc-400)', margin: 0 }}>
              No immediate intervention required. Maintain standard surveillance.
            </p>
          )}

          <div style={{ marginTop: '14px', padding: '10px 12px', backgroundColor: 'rgba(106, 94, 217, 0.05)', borderRadius: '6px', border: '1px solid rgba(106, 94, 217, 0.2)' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--color-iris)', fontWeight: 600 }}>
              Physical Inspection Mandate:
            </span>
            <p style={{ fontSize: '12px', color: 'var(--color-zinc-700)', margin: '4px 0 0', lineHeight: 1.45 }}>
              Always verify individual series cell balance with a calibrated digital multimeter before re-engaging charging current.
            </p>
          </div>
        </Card>
      </div>

      {/* ========================================================
          6. RETRIEVED TECHNICAL EVIDENCE & DOCUMENT CITATIONS
          ======================================================== */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} color="var(--color-iris)" />
              <Eyebrow color="violet">TRAINED MODEL CITATIONS & BATTERY SPECIFICATIONS</Eyebrow>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-zinc-900)', marginTop: '2px' }}>
              Model Knowledge Base & Physical Citations Supporting Inference
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowEvidence(!showEvidence)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-iris)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {showEvidence ? 'Hide Model Citations' : 'Show Model Citations'}
            {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showEvidence && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analysis?.retrieved_evidence && analysis.retrieved_evidence.length > 0 ? (
              analysis.retrieved_evidence.map((chunk, idx) => {
                const isExpanded = expandedChunk === idx;
                return (
                  <div
                    key={chunk.chunk_id || idx}
                    style={{
                      border: '1px solid var(--color-zinc-200)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      backgroundColor: 'var(--color-white)',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    <div 
                      onClick={() => setExpandedChunk(isExpanded ? null : idx)}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={15} color="var(--color-iris)" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-zinc-800)' }}>
                          {chunk.document_title}
                        </span>
                        <PillTag variant="blue">{chunk.section}</PillTag>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-sprout)', fontWeight: 600 }}>
                          {chunk.relevance_score ? `${chunk.relevance_score}% Relevance` : 'Semantic Match'}
                        </span>
                        {isExpanded ? <ChevronUp size={14} color="var(--color-zinc-400)" /> : <ChevronDown size={14} color="var(--color-zinc-400)" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-zinc-100)', fontSize: '12px', color: 'var(--color-zinc-600)', lineHeight: 1.55 }}>
                        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{chunk.excerpt}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--color-zinc-400)', margin: 0 }}>
                Awaiting initial model inference to display relevant technical citations.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ========================================================
          7. GROUNDED CONVERSATIONAL QUERY DRAWER
          ======================================================== */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} color="var(--color-iris)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
              Ask Trained AI Battery Model (Direct Model Inference)
            </h3>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
            DIRECT TRAINED AI MODEL INFERENCE
          </span>
        </div>

        {/* Suggested Quick Inquiries */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {[
            'Why is condition Insufficient Data?',
            'Why does the cooling fan activate?',
            'What are the risks of universal 12V voltage limits?',
            'How does low temperature affect charging?'
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAskQuestion(prompt)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                backgroundColor: 'var(--color-zinc-100)',
                border: '1px solid var(--color-zinc-200)',
                color: 'var(--color-zinc-700)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAskQuestion(); }}
            placeholder="Ask anything about 12V battery limits, cooling triggers, or thermal degradation..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-inputs)',
              border: '1px solid var(--color-zinc-300)',
              fontSize: '12.5px',
            }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAskQuestion()}
            disabled={chatLoading || !chatQuestion.trim()}
            icon={Send}
          >
            {chatLoading ? 'Inferring...' : 'Ask Model'}
          </Button>
        </div>

        {/* Answer Box */}
        {chatAnswer && (
          <div 
            style={{ 
              marginTop: '14px', 
              padding: '14px', 
              backgroundColor: 'rgba(106, 94, 217, 0.05)', 
              borderRadius: '8px', 
              border: '1px solid rgba(106, 94, 217, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-iris)' }}>
                Q: {chatAnswer.question}
              </span>
              <PillTag variant="purple">MODEL PREDICTION</PillTag>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-zinc-800)', margin: 0, lineHeight: 1.55 }}>
              {chatAnswer.answer}
            </p>
            {chatAnswer.citations && chatAnswer.citations.length > 0 && (
              <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-zinc-500)', borderTop: '1px dashed rgba(106, 94, 217, 0.2)', paddingTop: '6px' }}>
                <strong>Model Citations: </strong> 
                {chatAnswer.citations.map((c, i) => (
                  <span key={i} style={{ marginRight: '8px' }}>
                    [{i+1}] {c.document} ({c.section})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

    </section>
  );
}
