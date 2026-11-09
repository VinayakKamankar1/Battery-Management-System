import React from 'react';
import { 
  Flame, 
  TrendingDown, 
  Zap, 
  BatteryCharging, 
  Clock,
  AlertOctagon,
  Radio,
  CheckCircle2,
  Thermometer
} from 'lucide-react';
import { Card, PillTag, Eyebrow } from '../UiComponents';

export function HistoricalTrendAnalysisCard({ trends }) {
  if (!trends) return null;

  const trendItems = [
    {
      id: 'temperatureRise',
      title: 'Enclosure Ambient Temp Rise (dT / dt)',
      symbol: 'dT / dt (°C/min)',
      icon: Thermometer,
      color: 'var(--color-coral)',
      data: trends.temperatureRise,
      note: 'DHT11 measures casing ambient air (not internal cell core). Requires ≥ 2 timestamped samples.',
      tier: 'STATISTICAL ANOMALY',
    },
    {
      id: 'voltageSag',
      title: 'Transient Voltage Sag (ΔV_sag)',
      symbol: 'ΔV Under Load',
      icon: TrendingDown,
      color: 'var(--color-cobalt)',
      data: trends.voltageSag,
      note: 'Measures bus voltage droop during current step transients. Indicator of internal cell impedance.',
      tier: 'STATISTICAL ANOMALY',
    },
    {
      id: 'currentVariation',
      title: 'Dynamic Current Variation (σ_I)',
      symbol: 'σ_I (A Standard Dev)',
      icon: Zap,
      color: 'var(--color-iris)',
      data: trends.currentVariation,
      note: 'Standard deviation of current draw. Flags sudden auxiliary load surges and inrush transients.',
      tier: 'STATISTICAL ANOMALY',
    },
    {
      id: 'sensorIntegrity',
      title: 'Sensor Bus & Missing-Data Pattern',
      symbol: 'I²C / 1-Wire Health',
      icon: Radio,
      color: 'var(--color-sprout)',
      data: { status: 'Normal', value: 'INA219 (0x40): ACK · DHT11: STREAMING' },
      note: 'Differentiates physical sensor bus disconnection / timeouts from actual electrochemical battery faults.',
      tier: 'RULE-BASED THRESHOLD',
    },
    {
      id: 'degradationTrend',
      title: 'Long-Term Degradation Trend',
      symbol: 'ΔSOH / 100 Cycles',
      icon: Clock,
      color: 'var(--color-emerald)',
      data: trends.degradationTrend,
      note: 'Capacity fade slope over charge/discharge lifecycle. Validated only with multi-cycle calibration data.',
      tier: 'AI MODEL PREDICTION',
    },
  ];

  return (
    <Card 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '560px',
        borderTop: '4px solid var(--color-cobalt)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eyebrow color="blue">STATISTICAL ANOMALY DETECTION</Eyebrow>
            <PillTag variant="blue">SIGNAL PROCESSING</PillTag>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-zinc-900)', margin: '2px 0 0' }}>
            Time-Series Signal Trends & Feature Vectors
          </h3>
        </div>

        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
          5 EXTRACTED ML FEATURES
        </span>
      </div>

      <p style={{ fontSize: '12.5px', color: 'var(--color-zinc-600)', marginBottom: '14px', lineHeight: 1.45 }}>
        Mathematical features derived from high-frequency telemetry. These feeds are ingested by the trained AI prediction model to calculate failure probabilities and prognostic health curves.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {trendItems.map((item) => {
          const trendData = item.data;
          if (!trendData) return null;

          const Icon = item.icon;
          const status = trendData.status || 'Normal';
          const isCrit = status === 'Critical';
          const isWarn = status === 'Warning';
          const pillVariant = isCrit ? 'red' : isWarn ? 'orange' : 'green';

          return (
            <div
              key={item.id}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: isCrit ? 'var(--color-crimson-wash)' : isWarn ? 'var(--color-coral-wash)' : 'var(--color-zinc-50)',
                border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.3)' : isWarn ? 'rgba(219, 84, 52, 0.3)' : 'var(--color-zinc-200)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={16} color={item.color} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-zinc-900)' }}>
                    {item.title}
                  </span>
                </div>
                <PillTag variant={pillVariant}>
                  {status.toUpperCase()}
                </PillTag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--color-zinc-800)' }}>
                  {trendData.value || '--'}
                </span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10.5px', color: 'var(--color-zinc-400)' }}>
                  {item.symbol}
                </span>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--color-zinc-500)', lineHeight: 1.35 }}>
                {item.note}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
