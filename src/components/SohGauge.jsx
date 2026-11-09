import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, PillTag } from './UiComponents';

export function SohGauge({ soh = null, cycleCount = null, rul = null, degradation = null }) {
  const radius = 54;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const hasSoh = typeof soh === 'number';
  const displaySoh = hasSoh ? soh : 0;
  const strokeDashoffset = hasSoh 
    ? circumference - (displaySoh / 100) * circumference 
    : circumference;

  const getSohColor = (val) => {
    if (val == null) return 'var(--color-zinc-400)';
    if (val >= 90) return 'var(--color-sprout)';
    if (val >= 75) return 'var(--color-iris)';
    if (val >= 60) return 'var(--color-saffron)';
    return 'var(--color-crimson)';
  };

  const getSohLabel = (val) => {
    if (val == null) return 'UNAVAILABLE';
    if (val >= 90) return 'EXCELLENT';
    if (val >= 75) return 'GOOD';
    if (val >= 60) return 'MODERATE';
    return 'CRITICAL';
  };

  const color = getSohColor(soh);
  const label = getSohLabel(soh);

  return (
    <Card
      stripe="sprout"
      title="State of Health (SOH)"
      subtitle="Retained electrochemical capacity relative to factory rating"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px 0', flexWrap: 'wrap', gap: '16px' }}>
        {/* SVG Circular Gauge Meter */}
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg height="130" width="130" style={{ transform: 'rotate(-90deg)', filter: hasSoh ? 'drop-shadow(0 2px 6px rgba(5, 150, 105, 0.2))' : 'none' }}>
            <circle
              stroke="#e2e8f0"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={!hasSoh ? "4 4" : undefined}
              r={normalizedRadius}
              cx="65"
              cy="65"
            />
            {hasSoh && (
              <circle
                stroke={color}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx="65"
                cy="65"
              />
            )}
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: hasSoh ? 'var(--text-primary)' : 'var(--color-zinc-400)', fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {hasSoh ? `${soh}%` : '--'}
            </div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-gold)', marginTop: '4px', letterSpacing: '0.1em', fontWeight: 700 }}>
              SOH INDEX
            </div>
          </div>
        </div>

        {/* Breakdown Stats & Mandatory ISO 26262 Non-Fabrication Notice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '280px' }}>
          <PillTag variant={hasSoh ? 'green' : 'blue'}>
            SOH: {label}
          </PillTag>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Cycles Completed:{' '}
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {cycleCount != null ? cycleCount : '--'}
            </strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Est. RUL:{' '}
            <strong style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-mono)' }}>
              {rul != null ? `~${rul} Cycles` : 'Awaiting Cycle Data'}
            </strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
            *SOH cannot be calculated from voltage alone. Requires multi-cycle full discharge capacity testing (Ah / Ah_rated).
          </div>
        </div>
      </div>
    </Card>
  );
}
