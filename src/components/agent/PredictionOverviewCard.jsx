import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  HeartPulse, 
  Zap, 
  Thermometer, 
  TrendingDown, 
  CheckCircle2, 
  Info,
  Clock,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Card, PillTag, Eyebrow } from '../UiComponents';

export function PredictionOverviewCard({ prediction }) {
  if (!prediction) {
    return (
      <Card>
        <Eyebrow color="blue">TRAINED ML PREDICTION</Eyebrow>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-zinc-900)', marginTop: '4px' }}>
          ML Battery Health & Failure Prediction
        </h3>
        <p style={{ color: 'var(--color-zinc-400)', fontSize: '13px', marginTop: '8px' }}>
          Awaiting sensor stream features to execute Random Forest / Tree Ensemble inference...
        </p>
      </Card>
    );
  }

  const {
    riskLevel = 'Unavailable',
    failureProbability = null,
    mainDetectedReason = 'AI failure prognostics and predictive models require physical cycle aging dataset from the testbench. In the interim, hardware threshold safety interlocks (OVP, UVP, OCP, OTP) provide active real-time protection.',
    recommendedAction = 'Awaiting verified physical model integration. Rely on active hardware threshold interlocks.',
    risks = {},
    modelMetadata = {},
    rawMetrics = {},
  } = prediction;

  const isAvailable = failureProbability !== null;
  const isCrit = riskLevel === 'Critical';
  const isWarn = riskLevel === 'Warning';
  const riskVariant = isCrit ? 'red' : isWarn ? 'orange' : isAvailable ? 'green' : 'blue';

  const subRisks = [
    {
      label: 'Early Failure Probability',
      prob: risks?.earlyFailure?.probability ?? null,
      level: risks?.earlyFailure?.level ?? 'Unavailable',
      icon: ShieldAlert,
      desc: 'Ensemble weighted failure score across all channels',
    },
    {
      label: 'Thermal Escalation Risk',
      prob: risks?.overheating?.probability ?? null,
      level: risks?.overheating?.level ?? 'Unavailable',
      icon: Thermometer,
      desc: 'Enclosure ambient heating slope dT/dt evaluation',
    },
    {
      label: 'Over-Current Stress',
      prob: risks?.overCurrent?.probability ?? null,
      level: risks?.overCurrent?.level ?? 'Unavailable',
      icon: Zap,
      desc: 'Dynamic current surges and variance σ_I',
    },
    {
      label: 'Voltage Sag / Delta Risk',
      prob: risks?.voltageRisk?.probability ?? null,
      level: risks?.voltageRisk?.level ?? 'Unavailable',
      icon: TrendingDown,
      desc: 'Transient impedance droop under active load',
    },
  ];

  return (
    <Card 
      style={{
        borderTop: isCrit ? '4px solid var(--color-crimson)' : isWarn ? '4px solid var(--color-coral)' : '4px solid var(--color-cobalt)',
      }}
    >
      {/* ========================================================
          FOUR-TIER CLASSIFICATION ARCHITECTURE BADGES
          ======================================================== */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid var(--color-zinc-200)',
          paddingBottom: '14px',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <Eyebrow color="blue">TRAINED ML PREDICTION · CAN TELEMETRY</Eyebrow>
          <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--color-zinc-900)', margin: '2px 0 0' }}>
            Machine Learning Failure Prognostics (CAN Bus Data)
          </h3>
        </div>

        {/* 4 Diagnostic Classification Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--color-coral-wash)', color: 'var(--color-coral)', border: '1px solid rgba(219, 84, 52, 0.25)' }}>
            1. RULE-BASED THRESHOLD
          </span>
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(255, 185, 41, 0.15)', color: '#b45309', border: '1px solid rgba(255, 185, 41, 0.3)' }}>
            2. STATISTICAL ANOMALY
          </span>
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--color-cobalt-wash)', color: 'var(--color-cobalt)', border: '1px solid rgba(63, 113, 212, 0.3)' }}>
            3. TRAINED ML PREDICTION
          </span>
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--color-iris-wash)', color: 'var(--color-iris)', border: '1px solid rgba(106, 94, 217, 0.3)' }}>
            4. AI-GENERATED EXPLANATION
          </span>
        </div>
      </div>

      {/* Primary Indicators Grid */}
      <div className="grid-responsive-3" style={{ marginBottom: '22px' }}>
        
        {/* Metric 1: Overall Failure Probability */}
        <div 
          style={{ 
            padding: '16px', 
            borderRadius: '10px', 
            backgroundColor: isCrit ? 'var(--color-crimson-wash)' : isWarn ? 'var(--color-coral-wash)' : isAvailable ? 'var(--color-sprout-wash)' : 'var(--color-zinc-100)',
            border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.3)' : isWarn ? 'rgba(219, 84, 52, 0.3)' : isAvailable ? 'rgba(27, 177, 82, 0.3)' : 'var(--color-zinc-200)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-600)', textTransform: 'uppercase' }}>
              FAILURE PROBABILITY
            </span>
            <PillTag variant={riskVariant}>
              {isAvailable ? `${riskLevel.toUpperCase()} RISK` : 'MODEL PENDING'}
            </PillTag>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="font-mono" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-zinc-900)' }}>
              {isAvailable ? `${failureProbability}%` : '--'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-zinc-500)', fontFamily: 'var(--font-dm-mono)' }}>
              {isAvailable ? 'Score' : 'Awaiting Model'}
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--color-zinc-600)', display: 'block', marginTop: '4px' }}>
            {isAvailable ? 'Active inference score' : 'Unavailable until validated ML model integration'}
          </span>
        </div>

        {/* Metric 2: Model Version & Metadata */}
        <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
              MODEL ARCHITECTURE
            </span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-cobalt)', fontWeight: 600 }}>
              Architecture Ready
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
            {modelMetadata.name || 'Random Forest & Tree Ensemble'}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11.5px', color: 'var(--color-zinc-500)', marginTop: '4px' }}>
            Designed for 12V Li-ion degradation profiles
          </div>
        </div>

        {/* Metric 3: Analysis Timestamp & Calibrated Confidence */}
        <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
              MODEL CONFIDENCE
            </span>
            <PillTag variant="gray">--</PillTag>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
            Pending Bench Data
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)', marginTop: '4px' }}>
            FEED: /smart_bms/latest
          </div>
        </div>

      </div>

      {/* Sub-Risk Categorical Channels */}
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11.5px', color: 'var(--color-zinc-500)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          MULTI-CHANNEL RISK CLASSIFICATION:
        </span>
        <div className="grid-responsive-4" style={{ gap: '12px' }}>
          {subRisks.map((sr, idx) => {
            const Icon = sr.icon;
            return (
              <div 
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-zinc-200)',
                  boxShadow: 'var(--shadow-subtle-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Icon size={16} color="var(--color-zinc-400)" />
                  <PillTag variant="gray">
                    UNAVAILABLE
                  </PillTag>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-zinc-800)', marginBottom: '4px' }}>
                  {sr.label}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--color-zinc-400)' }}>
                  --
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-zinc-400)', display: 'block', marginTop: '4px' }}>
                  {sr.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>


      {/* Grounded Explanation & Operator Inspection Banner */}
      <div 
        style={{
          padding: '16px 18px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-iris-wash)',
          border: '1px solid rgba(106, 94, 217, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--color-iris)" />
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-iris)' }}>
            AI Diagnostic Reasoning Grounded in Real Telemetry
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-zinc-800)', lineHeight: 1.5, margin: 0 }}>
          <strong>Physical Finding:</strong> {mainDetectedReason}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-zinc-700)', lineHeight: 1.5, margin: 0 }}>
          <strong>Operator Inspection Step:</strong> {recommendedAction}
        </p>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', marginTop: '4px', borderTop: '1px dashed rgba(106, 94, 217, 0.2)', paddingTop: '6px' }}>
          *Hardware Interlock Guarantee: Essential physical safety trips remain autonomous on the controller node and CAN transceivers.*
        </div>
      </div>
    </Card>
  );
}
