import React from 'react';
import { AlertCircle, WifiOff, Loader2, Database, HelpCircle } from 'lucide-react';

/**
 * DM Mono Section Eyebrow (Signature DevTool Identity)
 * Colors: green (#1bb152), blue (#3f71d4), orange (#db5434), violet (#6a5ed9), zinc (#71717a)
 */
export function Eyebrow({ children, color = 'green', className = '' }) {
  const colorMap = {
    green: 'eyebrow-green',
    blue: 'eyebrow-blue',
    orange: 'eyebrow-orange',
    violet: 'eyebrow-violet',
    zinc: 'eyebrow-zinc',
  };

  return (
    <span className={`eyebrow ${colorMap[color] || 'eyebrow-green'} ${className}`}>
      {children}
    </span>
  );
}

/**
 * Buttons (Tuple Spec: Iris Violet #6a5ed9 for primary action)
 */
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  type = 'button',
  icon: Icon,
  className = '',
  disabled = false,
  style = {},
  title = '',
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = 
    variant === 'primary' ? 'btn-primary' :
    variant === 'secondary' || variant === 'outlined' ? 'btn-outlined' :
    variant === 'ghost' ? 'btn-ghost' :
    variant === 'danger' ? 'btn-danger' : 'btn-outlined';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
      title={title}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
}

/**
 * Standard Luxury Surface Card & Container
 */
export function Card({ 
  children, 
  className = '', 
  style = {}, 
  variant = 'default', // 'default' | 'dark' | 'interactive' | 'silver' | 'metallic' | 'panel' | 'wash'
  onClick,
}) {
  let variantClass = 'card';
  if (variant === 'dark') variantClass = 'card dark-band';
  else if (variant === 'interactive') variantClass = 'card card-interactive';
  else if (variant === 'silver') variantClass = 'card card-silver';
  else if (variant === 'metallic') variantClass = 'card card-metallic';
  else if (variant === 'panel') variantClass = 'panel-luxury';

  return (
    <div 
      className={`${variantClass} ${className}`} 
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * Multicolored Metric KPI Card
 * Distinct accents: Cobalt, Coral, Sprout, Iris, Saffron, Teal, Crimson
 * Optional "Unavailable" state for reserved slots (SOC, SOH in Phase 1)
 */
export function StatCard({
  title = '',
  value = null,
  unit = '',
  icon: Icon,
  accent = 'cobalt', // 'cobalt' | 'coral' | 'sprout' | 'iris' | 'saffron' | 'teal' | 'crimson' | 'disabled'
  trend = null, // 'up' | 'down' | 'flat'
  delta = null,
  subtitle = '',
  unavailable = false,
  unavailableLabel = 'Unavailable Until Implemented',
  tooltip = '',
  className = '',
  style = {},
}) {
  const accentClass = unavailable ? 'accent-disabled' : `accent-${accent}`;

  const iconColors = {
    cobalt: 'var(--color-cobalt)',
    coral: 'var(--color-coral)',
    sprout: 'var(--color-sprout)',
    iris: 'var(--color-iris)',
    saffron: 'var(--color-saffron)',
    teal: 'var(--color-teal)',
    crimson: 'var(--color-crimson)',
    disabled: 'var(--color-zinc-400)',
  };

  return (
    <div className={`stat-card ${accentClass} ${className}`} style={style} title={tooltip}>
      {/* Header row: title and icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span 
          style={{ 
            fontFamily: 'var(--font-dm-mono)', 
            fontSize: '12px', 
            fontWeight: 500, 
            color: unavailable ? 'var(--color-zinc-400)' : 'var(--color-zinc-500)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </span>
        {Icon && (
          <div 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: unavailable ? 'var(--color-zinc-100)' : 'var(--color-zinc-50)',
              color: unavailable ? 'var(--color-zinc-400)' : (iconColors[accent] || 'var(--color-cobalt)'),
              border: '1px solid var(--color-zinc-200)',
            }}
          >
            <Icon size={16} strokeWidth={1.8} />
          </div>
        )}
      </div>

      {/* Main Value */}
      {unavailable ? (
        <div style={{ margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-zinc-400)' }}>
            <span style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-dm-mono)' }}>--</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', textTransform: 'uppercase' }}>PHASE 2</span>
          </div>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px', 
              marginTop: '6px',
              fontSize: '11px', 
              color: 'var(--color-zinc-500)',
              backgroundColor: 'var(--color-zinc-100)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--color-zinc-300)',
            }}
          >
            <HelpCircle size={11} /> {unavailableLabel}
          </div>
        </div>
      ) : (
        <div style={{ margin: '4px 0 8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span 
              className="font-mono"
              style={{ 
                fontSize: '28px', 
                fontWeight: 700, 
                color: 'var(--color-zinc-900)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {value !== null && value !== undefined ? value : '--'}
            </span>
            {unit && (
              <span 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: 'var(--color-zinc-500)',
                  fontFamily: 'var(--font-inter-variable)',
                }}
              >
                {unit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer / Trend line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
        {subtitle && (
          <span style={{ fontSize: '12px', color: 'var(--color-zinc-500)' }}>
            {subtitle}
          </span>
        )}
        {trend && delta !== null && (
          <span 
            className="font-mono"
            style={{ 
              fontSize: '11.5px', 
              fontWeight: 600,
              color: trend === 'up' ? 'var(--color-sprout)' : trend === 'down' ? 'var(--color-coral)' : 'var(--color-zinc-400)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} {delta} {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Status Pill Badge
 */
export function PillTag({ 
  children, 
  variant = 'green', // 'green' | 'blue' | 'orange' | 'red' | 'gray'
  pulse = false, 
  className = '',
  style = {},
}) {
  const variantMap = {
    green: 'status-pill-green',
    blue: 'status-pill-blue',
    orange: 'status-pill-orange',
    red: 'status-pill-red',
    gray: 'status-pill-gray',
  };

  return (
    <span className={`status-pill ${variantMap[variant] || 'status-pill-green'} ${className}`} style={style}>
      {pulse && <span className="status-pill-pulse" />}
      {children}
    </span>
  );
}

/**
 * Consistent System States: Loading, Error, Offline, Empty-data
 */
export function StateView({
  type = 'empty', // 'loading' | 'offline' | 'error' | 'empty'
  title = '',
  message = '',
  actionText = '',
  onAction = null,
  minHeight = '280px',
}) {
  const configs = {
    loading: {
      icon: Loader2,
      iconColor: 'var(--color-cobalt)',
      defaultTitle: 'Acquiring Telemetry Data',
      defaultMsg: 'Synchronizing with ESP8266 controller bus...',
      spin: true,
    },
    offline: {
      icon: WifiOff,
      iconColor: 'var(--color-coral)',
      defaultTitle: 'Edge Hardware Offline',
      defaultMsg: 'NodeMCU ESP8266 is currently not transmitting over Wi-Fi. Simulated fallback telemetry active.',
      spin: false,
    },
    error: {
      icon: AlertCircle,
      iconColor: 'var(--color-crimson)',
      defaultTitle: 'Sensor Bus Error',
      defaultMsg: 'Telemetry read failure on INA219 or DHT11 communication lines.',
      spin: false,
    },
    empty: {
      icon: Database,
      iconColor: 'var(--color-zinc-400)',
      defaultTitle: 'No Records Recorded',
      defaultMsg: 'No historical trip events or log traces recorded in this timeframe.',
      spin: false,
    },
  };

  const current = configs[type] || configs.empty;
  const Icon = current.icon;

  return (
    <div 
      style={{ 
        minHeight, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '32px 24px',
        backgroundColor: 'var(--color-white)',
        border: '1px dashed var(--color-zinc-300)',
        borderRadius: 'var(--radius-cards)',
      }}
    >
      <div 
        style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px', 
          backgroundColor: 'var(--color-zinc-100)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: current.iconColor,
          marginBottom: '14px',
        }}
      >
        <Icon size={24} className={current.spin ? 'animate-spin' : ''} />
      </div>

      <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-zinc-800)', marginBottom: '6px' }}>
        {title || current.defaultTitle}
      </h4>

      <p style={{ fontSize: '13.5px', color: 'var(--color-zinc-500)', maxWidth: '440px', lineHeight: 1.5, marginBottom: actionText ? '16px' : 0 }}>
        {message || current.defaultMsg}
      </p>

      {actionText && onAction && (
        <Button variant="outlined" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
