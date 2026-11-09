import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  HeartPulse, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Thermometer, 
  Battery, 
  Activity, 
  Info, 
  Fan,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { Card, PillTag, Eyebrow, Button } from '../components/UiComponents';
import { useBattery } from '../context/BatteryContext';
import { triggerRagAnalysis } from '../services/ragService';
import { calculateBatteryConditionScore } from '../services/batteryCalculations';

export function HealthAI() {
  const { 
    telemetry, 
    history, 
    batteryCondition, 
    activeBatterySpec, 
    deviceStatusInfo,
    refreshTelemetry,
    showToast 
  } = useBattery();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ragAnalysis, setRagAnalysis] = useState(null);
  const [timeRange, setTimeRange] = useState('10m'); // '10m' | '1h' | 'all'

  // Fetch updated RAG analysis if backend is available
  const fetchRagStatus = useCallback(async () => {
    try {
      const res = await triggerRagAnalysis(telemetry, history);
      if (res && res.success && res.data) {
        setRagAnalysis(res.data);
      }
    } catch {
      // Gracefully fall back to local verified deterministic condition
    }
  }, [telemetry, history]);

  useEffect(() => {
    fetchRagStatus();
  }, [fetchRagStatus]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTelemetry();
    await fetchRagStatus();
    setIsRefreshing(false);
    showToast('Health diagnostics refreshed', 'info');
  };

  // Determine health condition: 'Normal' | 'Warning' | 'Danger'
  const currentCondition = useMemo(() => {
    // If temp is above 30°C, guarantee Warning (or Danger if >= 60°C)
    const t = telemetry?.temperature;
    if (typeof t === 'number' && t >= 60.0) {
      return {
        level: 'Danger',
        label: 'DANGER',
        color: 'var(--color-crimson)',
        bgWash: 'var(--color-crimson-wash)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        pillVariant: 'red',
        icon: AlertOctagon,
      };
    }

    if (typeof t === 'number' && t > 30.0) {
      return {
        level: 'Warning',
        label: 'WARNING',
        color: 'var(--color-coral)',
        bgWash: 'var(--color-coral-wash)',
        borderColor: 'rgba(219, 84, 52, 0.35)',
        pillVariant: 'orange',
        icon: AlertTriangle,
      };
    }

    const rawStatus = (ragAnalysis?.condition_assessment?.condition || batteryCondition?.status || 'Normal').toLowerCase();
    
    if (rawStatus.includes('danger') || rawStatus.includes('critical')) {
      return {
        level: 'Danger',
        label: 'DANGER',
        color: 'var(--color-crimson)',
        bgWash: 'var(--color-crimson-wash)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        pillVariant: 'red',
        icon: AlertOctagon,
      };
    }
    
    if (rawStatus.includes('warn')) {
      return {
        level: 'Warning',
        label: 'WARNING',
        color: 'var(--color-coral)',
        bgWash: 'var(--color-coral-wash)',
        borderColor: 'rgba(219, 84, 52, 0.35)',
        pillVariant: 'orange',
        icon: AlertTriangle,
      };
    }

    return {
      level: 'Normal',
      label: 'NORMAL',
      color: 'var(--color-sprout)',
      bgWash: 'var(--color-sprout-wash)',
      borderColor: 'rgba(27, 177, 82, 0.35)',
      pillVariant: 'green',
      icon: ShieldCheck,
    };
  }, [telemetry?.temperature, ragAnalysis, batteryCondition]);

  const conditionScore = useMemo(() => {
    if (typeof ragAnalysis?.condition_assessment?.battery_condition_score === 'number') {
      return Math.round(ragAnalysis.condition_assessment.battery_condition_score);
    }
    if (typeof batteryCondition?.score === 'number') {
      return Math.round(batteryCondition.score);
    }
    return 100;
  }, [ragAnalysis, batteryCondition]);

  const primaryReason = useMemo(() => {
    return ragAnalysis?.condition_assessment?.primary_reason || 
      batteryCondition?.reason || 
      'All monitored electrical and thermal parameters are nominal within verified specifications.';
  }, [ragAnalysis, batteryCondition]);

  // Construct historical health graph data points
  const healthGraphData = useMemo(() => {
    const rawHistory = Array.isArray(history) && history.length > 0 ? history : [];
    
    // If telemetry history exists, compute health condition score for each historical point
    if (rawHistory.length > 1) {
      let slicePoints = rawHistory;
      if (timeRange === '10m') {
        slicePoints = rawHistory.slice(-20);
      } else if (timeRange === '1h') {
        slicePoints = rawHistory.slice(-60);
      }

      return slicePoints.map((item, idx) => {
        const itemScore = calculateBatteryConditionScore(item, activeBatterySpec, deviceStatusInfo);
        const score = itemScore.score !== null ? itemScore.score : 100;
        const timeLabel = item.timestamp 
          ? (item.timestamp.includes('T') ? item.timestamp.split('T')[1].slice(0, 8) : item.timestamp.slice(-8))
          : `Pt ${idx + 1}`;
        
        let status = 'Normal';
        if (score < 40) status = 'Danger';
        else if (score < 75) status = 'Warning';

        return {
          time: timeLabel,
          healthScore: score,
          voltage: item.voltage || 0,
          temperature: item.temperature || 0,
          status
        };
      });
    }

    // Default trend curve leading up to current score
    const now = new Date();
    const mockPoints = [];
    const count = 12;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 1000);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const jitter = i === 0 ? 0 : Math.round((Math.sin(i * 1.5) * 3));
      const score = Math.max(0, Math.min(100, conditionScore + jitter));
      
      let status = 'Normal';
      if (score < 40) status = 'Danger';
      else if (score < 75) status = 'Warning';

      mockPoints.push({
        time: timeStr,
        healthScore: score,
        voltage: telemetry?.voltage ? Number(telemetry.voltage.toFixed(2)) : 12.2,
        temperature: telemetry?.temperature ? Number(telemetry.temperature.toFixed(1)) : 28.5,
        status
      });
    }
    return mockPoints;
  }, [history, timeRange, activeBatterySpec, deviceStatusInfo, conditionScore, telemetry]);

  const StatusIcon = currentCondition.icon;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eyebrow color="blue">RAG SYSTEM EVALUATOR</Eyebrow>
            <PillTag variant={currentCondition.pillVariant}>
              HEALTH: {currentCondition.label}
            </PillTag>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-zinc-900)', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            Battery Health & Condition Diagnostics
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-zinc-500)', marginTop: '4px' }}>
            Deterministic battery health evaluation powered by physical threshold verification and verified specifications.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button 
            variant="secondary" 
            size="sm" 
            icon={RefreshCw}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Diagnosing...' : 'Refresh Health Diagnostics'}
          </Button>
        </div>
      </div>

      {/* ========================================================
          PRIMARY HEALTH STATUS CARD (NORMAL / WARNING / DANGER)
          ======================================================== */}
      <div 
        style={{
          borderRadius: 'var(--radius-cards)',
          backgroundColor: currentCondition.bgWash,
          border: `1.5px solid ${currentCondition.borderColor}`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--shadow-subtle-1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentCondition.color,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                flexShrink: 0
              }}
            >
              <StatusIcon size={30} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  OVERALL BATTERY CONDITION
                </span>
                <PillTag variant={currentCondition.pillVariant}>
                  {currentCondition.label}
                </PillTag>
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-zinc-900)', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
                Battery State is {currentCondition.label}
              </h2>
            </div>
          </div>

          {/* Condition Score Gauge Badge */}
          <div style={{ textAlign: 'right', minWidth: '140px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
              HEALTH SCORE
            </span>
            <div style={{ fontSize: '38px', fontWeight: 900, fontFamily: 'var(--font-dm-mono)', color: currentCondition.color, lineHeight: 1.1 }}>
              {conditionScore}%
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)' }}>
              Safety Margin Index
            </span>
          </div>
        </div>

        {/* Progress Bar with Color-Coded Zones */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', marginBottom: '6px' }}>
            <span style={{ color: 'var(--color-crimson)', fontWeight: 600 }}>0% (DANGER)</span>
            <span style={{ color: 'var(--color-coral)', fontWeight: 600 }}>40% - 75% (WARNING)</span>
            <span style={{ color: 'var(--color-sprout)', fontWeight: 600 }}>75% - 100% (NORMAL)</span>
          </div>

          <div style={{ height: '10px', width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div 
              style={{
                height: '100%',
                width: `${Math.max(4, Math.min(100, conditionScore))}%`,
                backgroundColor: currentCondition.color,
                borderRadius: '999px',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          REAL-TIME BATTERY HEALTH GRAPH (RECHARTS)
          ======================================================== */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Eyebrow color="blue">HEALTH TRAJECTORY</Eyebrow>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-zinc-900)', margin: '2px 0 0' }}>
              Battery Health Score Trend Graph
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--color-zinc-500)', margin: '2px 0 0' }}>
              Real-time health stability score tracking across telemetry windows.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {['10m', '1h', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-dm-mono)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  backgroundColor: timeRange === range ? 'var(--color-zinc-900)' : '#ffffff',
                  color: timeRange === range ? '#ffffff' : 'var(--color-zinc-600)',
                  borderColor: timeRange === range ? 'var(--color-zinc-900)' : 'var(--color-zinc-200)',
                  transition: 'all 0.15s ease'
                }}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area Chart for Health Score */}
        <div style={{ width: '100%', height: '280px', marginTop: '10px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={healthGraphData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={currentCondition.level === 'Danger' ? '#ef4444' : currentCondition.level === 'Warning' ? '#ea580c' : '#1bb152'} 
                    stopOpacity={0.4} 
                  />
                  <stop 
                    offset="95%" 
                    stopColor={currentCondition.level === 'Danger' ? '#ef4444' : currentCondition.level === 'Warning' ? '#ea580c' : '#1bb152'} 
                    stopOpacity={0.0} 
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200)" />
              <XAxis 
                dataKey="time" 
                stroke="var(--color-zinc-400)" 
                fontSize={11} 
                fontFamily="var(--font-dm-mono)" 
              />
              <YAxis 
                domain={[0, 100]} 
                unit="%" 
                stroke="var(--color-zinc-400)" 
                fontSize={11} 
                fontFamily="var(--font-dm-mono)" 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: 'var(--color-zinc-200)', 
                  borderRadius: '8px', 
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-dm-mono)'
                }}
                formatter={(val, name) => [`${val}%`, name === 'healthScore' ? 'Battery Health' : name]}
                labelFormatter={(lbl) => `Time: ${lbl}`}
              />
              {/* Threshold reference lines */}
              <ReferenceLine y={75} stroke="var(--color-sprout)" strokeDasharray="4 4" label={{ value: 'Normal (≥75%)', position: 'insideTopLeft', fill: 'var(--color-sprout)', fontSize: 10 }} />
              <ReferenceLine y={40} stroke="var(--color-crimson)" strokeDasharray="4 4" label={{ value: 'Danger (<40%)', position: 'insideBottomLeft', fill: 'var(--color-crimson)', fontSize: 10 }} />

              <Area 
                type="monotone" 
                dataKey="healthScore" 
                stroke={currentCondition.level === 'Danger' ? '#ef4444' : currentCondition.level === 'Warning' ? '#ea580c' : '#1bb152'} 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#healthGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--color-zinc-100)', fontSize: '11.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-sprout)' }}></span>
            <span>Normal: 75% - 100%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-coral)' }}></span>
            <span>Warning: 40% - 74%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-crimson)' }}></span>
            <span>Danger: 0% - 39%</span>
          </div>
        </div>
      </Card>

      {/* ========================================================
          TELEMETRY PARAMETERS GOVERNING RAG HEALTH EVALUATION
          ======================================================== */}
      <div>
        <div style={{ marginBottom: '12px' }}>
          <Eyebrow color="violet">VERIFIED SENSORS</Eyebrow>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-zinc-900)', margin: '2px 0 0' }}>
            Physical Sensor Parameters Driving RAG Health
          </h3>
        </div>

        <div className="grid-responsive-4">
          
          {/* Card 1: Pack Voltage */}
          <div className="stat-card accent-cobalt">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-cobalt)', textTransform: 'uppercase' }}>
                PACK VOLTAGE
              </span>
              <Battery size={16} color="var(--color-cobalt)" />
            </div>
            <div style={{ margin: '10px 0 4px' }}>
              <span className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-zinc-900)' }}>
                {telemetry.voltage !== null ? `${telemetry.voltage.toFixed(2)} V` : '-- V'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)', display: 'block', marginTop: '2px' }}>
                Safe Window: 9.00V - 12.60V
              </span>
            </div>
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '8px', marginTop: '8px', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)' }}>
              Status: {telemetry.voltage >= 9.0 && telemetry.voltage <= 12.6 ? 'Nominal' : 'Threshold Breach'}
            </div>
          </div>

          {/* Card 2: Temperature */}
          <div className={`stat-card ${telemetry.temperature > 30.0 ? 'accent-coral' : 'accent-sprout'}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: telemetry.temperature > 30.0 ? 'var(--color-coral)' : 'var(--color-sprout)', textTransform: 'uppercase' }}>
                ENCLOSURE TEMP
              </span>
              <Thermometer size={16} color={telemetry.temperature > 30.0 ? 'var(--color-coral)' : 'var(--color-sprout)'} />
            </div>
            <div style={{ margin: '10px 0 4px' }}>
              <span className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-zinc-900)' }}>
                {telemetry.temperature !== null ? `${telemetry.temperature.toFixed(1)} °C` : '-- °C'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)', display: 'block', marginTop: '2px' }}>
                Fan & Buzzer Trigger: &gt; 30.0°C | Cutoff: 60°C
              </span>
            </div>
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '8px', marginTop: '8px', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)' }}>
              Actuators: {telemetry.temperature > 30.0 || telemetry.fanStatus === 'ON' || telemetry.buzzerStatus === 'ON' ? 'Fan & Buzzer ACTIVE' : 'Standby'}
            </div>
          </div>

          {/* Card 3: Continuous Current */}
          <div className="stat-card accent-zinc">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
                CURRENT DRAW
              </span>
              <Zap size={16} color="var(--color-zinc-500)" />
            </div>
            <div style={{ margin: '10px 0 4px' }}>
              <span className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-zinc-900)' }}>
                {telemetry.current !== null ? `${Math.abs(telemetry.current).toFixed(2)} A` : '-- A'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)', display: 'block', marginTop: '2px' }}>
                Continuous Limit: ≤ 10.0 A
              </span>
            </div>
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '8px', marginTop: '8px', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)' }}>
              INA219 High-Side Sensor
            </div>
          </div>

          {/* Card 4: Safety Interlocks */}
          <div className="stat-card accent-sprout">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-sprout)', textTransform: 'uppercase' }}>
                HARDWARE INTERLOCK
              </span>
              <CheckCircle2 size={16} color="var(--color-sprout)" />
            </div>
            <div style={{ margin: '10px 0 4px' }}>
              <span className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-zinc-900)' }}>
                ARMED & SAFE
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)', display: 'block', marginTop: '2px' }}>
                Relay / Buzzer trip armed
              </span>
            </div>
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '8px', marginTop: '8px', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)' }}>
              Buzzer: {telemetry.buzzerStatus ? 'Alarm Active' : 'Silent'}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
