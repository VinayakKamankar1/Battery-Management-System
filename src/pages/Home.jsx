import React from 'react';
import { 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Sliders, 
  BarChart3, 
  Radio, 
  CheckCircle2, 
  Thermometer,
  Fan,
  Volume2,
  Tv,
  FileText,
  Sparkles,
  GitBranch,
  Shield,
  Layers,
  ArrowUpRight,
  Droplets,
  HardDrive,
  Database
} from 'lucide-react';
import { Eyebrow, Button, Card, PillTag } from '../components/UiComponents';
import { useBattery } from '../context/BatteryContext';
import heroBgImage from '../assets/hero-workbench-enclosure.png';

export function Home({ setActiveTab }) {
  const { 
    telemetry, 
    connectionStatus, 
    voltageWithSoc, 
    socInfo, 
    batteryCondition, 
    activeBatterySpec 
  } = useBattery();

  const voltage = telemetry?.voltage !== null && telemetry?.voltage !== undefined 
    ? `${Number(telemetry.voltage).toFixed(2)} V` 
    : '--';

  const current = telemetry?.current !== null && telemetry?.current !== undefined 
    ? `${Number(telemetry.current).toFixed(3)} A` 
    : '--';

  const power = telemetry?.power !== null && telemetry?.power !== undefined 
    ? `${Number(telemetry.power).toFixed(2)} W` 
    : '--';

  const temperature = telemetry?.temperature !== null && telemetry?.temperature !== undefined 
    ? `${Number(telemetry.temperature).toFixed(1)} °C` 
    : '--';

  const humidity = telemetry?.humidity !== null && telemetry?.humidity !== undefined 
    ? `${Number(telemetry.humidity).toFixed(1)} %` 
    : (telemetry?.ambient_humidity ? `${Number(telemetry.ambient_humidity).toFixed(1)} %` : '--');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '56px', width: '100%' }}>
      
      {/* ========================================================
          1. ULTRA-PREMIUM HERO SECTION (FULL WIDTH)
          ======================================================== */}
      <section 
        className="hero-landing-banner"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.92) 48%, rgba(15, 23, 42, 0.55) 75%, rgba(15, 23, 42, 0.18) 100%), url(${heroBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.40)',
          padding: 'clamp(36px, 5vw, 64px) clamp(24px, 4vw, 56px)',
          minHeight: '620px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '36px',
          width: '100%',
        }}
      >
        {/* Top Badges Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 16px', 
              borderRadius: '9999px', 
              backgroundColor: 'rgba(16, 185, 129, 0.16)', 
              border: '1px solid rgba(52, 211, 153, 0.4)', 
              backdropFilter: 'blur(12px)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', boxShadow: '0 0 10px #34d399' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#a7f3d0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ACADEMIC ENGINEERING BENCHMARK · TWO-NODE CAN BUS BMS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                color: 'rgba(226, 232, 240, 0.95)',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
              PHYSICAL ENCLOSURE VERIFIED
            </div>

            <PillTag variant={connectionStatus === 'live' ? 'green' : 'orange'} pulse={connectionStatus === 'live'}>
              {connectionStatus === 'live' ? 'LIVE TELEMETRY STREAM' : 'STALE STREAM'}
            </PillTag>

            <PillTag 
              variant={batteryCondition.status === 'Danger' ? 'red' : batteryCondition.status === 'Warning' ? 'orange' : batteryCondition.status === 'Insufficient Data' ? 'blue' : 'green'}
            >
              CONDITION: {batteryCondition.displayText.toUpperCase()} {batteryCondition.score !== null ? `(${batteryCondition.score}%)` : ''}
            </PillTag>
          </div>
        </div>

        {/* Hero Headline & Description */}
        <div style={{ maxWidth: '820px' }}>
          <h1 
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 4.6vw, 56px)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.12,
              letterSpacing: '-0.035em',
              margin: '0 0 20px',
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.65)',
            }}
          >
            AI-Driven Smart Battery Management System{' '}
            <span 
              style={{ 
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                display: 'inline-block' 
              }}
            >
              Using Two-Node CAN Bus
            </span>
          </h1>

          <p 
            style={{
              fontSize: '16.5px',
              color: 'rgba(226, 232, 240, 0.94)',
              maxWidth: '760px',
              lineHeight: 1.65,
              margin: '0 0 32px',
              textShadow: '0 1px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            An enterprise-grade laboratory testbench engineered for academic validation of real-time battery safety interlocks, 
            ISO 11898 differential CAN communication, edge actuator controls, and physics-grounded trained AI battery prognostics.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => setActiveTab('monitoring')}
              icon={ArrowRight}
              style={{
                backgroundColor: 'var(--iris)',
                boxShadow: '0 6px 24px rgba(99, 102, 241, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                padding: '13px 28px',
                fontSize: '15px'
              }}
            >
              Launch Live Telemetry
            </Button>

            <button 
              type="button"
              onClick={() => setActiveTab('health')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 'var(--radius-buttons)',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '14.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Sparkles size={17} color="#38bdf8" />
              Health & AI Model Prediction
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('reports')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 'var(--radius-buttons)',
                backgroundColor: 'rgba(15, 23, 42, 0.55)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                color: '#e2e8f0',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '14.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.55)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FileText size={17} color="#a78bfa" />
              Audit Reports
            </button>
          </div>
        </div>

        {/* Real-Time Live Telemetry Snapshot Bar (Hero Integrated) */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            width: '100%',
            marginTop: 'auto',
          }}
        >
          {/* 1. Dedicated Big Bold Battery Charging Percentage (SOC) */}
          <div 
            style={{ 
              padding: '14px 18px', 
              backgroundColor: 'rgba(15, 23, 42, 0.90)', 
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-cards)', 
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderTop: '3px solid #38bdf8',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  BATTERY CHARGE (SOC)
                </span>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '34px', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                  {socInfo?.isAvailable ? `${socInfo.socPercent}%` : '--%'}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#93c5fd', fontWeight: 600 }}>
                  {socInfo?.isAvailable && socInfo.socPercent >= 100 ? 'FULLY CHARGED' : 'CALIBRATED'}
                </span>
              </div>
            </div>

            {/* Visual Mini Battery Progress Bar */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: socInfo?.isAvailable ? `${Math.min(100, Math.max(0, socInfo.socPercent))}%` : '0%',
                    background: 'linear-gradient(90deg, #38bdf8 0%, #4ade80 100%)',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
              <span style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                {activeBatterySpec?.name || '12V Pack (≥12V Full, 9V Cutoff)'}
              </span>
            </div>
          </div>

          {/* 2. Pure Pack Voltage Reading (Separated) */}
          <div 
            style={{ 
              padding: '14px 18px', 
              backgroundColor: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-cards)', 
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderTop: '3px solid var(--cobalt)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase' }}>
                PACK VOLTAGE
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#60a5fa' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              {voltage}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              INA219 High-Side Bus
            </span>
          </div>

          <div 
            style={{ 
              padding: '14px 18px', 
              backgroundColor: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-cards)', 
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderTop: '3px solid var(--saffron)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fcd34d', textTransform: 'uppercase' }}>
                SHUNT CURRENT
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              {current}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>±3.2A Bidirectional</span>
          </div>

          <div 
            style={{ 
              padding: '14px 18px', 
              backgroundColor: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-cards)', 
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderTop: '3px solid var(--iris)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#c084fc', textTransform: 'uppercase' }}>
                ELECTRICAL POWER
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a78bfa' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              {power}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>V × I Instantaneous</span>
          </div>

          <div 
            style={{ 
              padding: '14px 18px', 
              backgroundColor: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-cards)', 
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderTop: '3px solid var(--sprout)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#86efac', textTransform: 'uppercase' }}>
                AMBIENT ENCLOSURE
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              {temperature}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>DHT11 Enclosure Sensor</span>
          </div>

          <div 
            style={{ 
              padding: '14px 18px', 
              backgroundColor: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-cards)', 
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderTop: '3px solid var(--teal)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#67e8f9', textTransform: 'uppercase' }}>
                RELATIVE HUMIDITY
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22d3ee' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              {humidity}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Non-Condensing Air</span>
          </div>
        </div>
      </section>


      {/* ========================================================
          2. CORE ENGINEERING PILLARS (4 LUXURY CARDS)
          ======================================================== */}
      <section style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Eyebrow color="violet">ENGINEERING SPECIFICATIONS</Eyebrow>
          <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.025em' }}>
            Four Core Operational Pillars
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--silver-500)', maxWidth: '740px', margin: '8px auto 0' }}>
            Precision hardware interfacing, high-integrity differential communications, and physics-constrained prognostics.
          </p>
        </div>

        <div className="grid-responsive-4">
          <Card 
            variant="interactive" 
            onClick={() => setActiveTab('monitoring')}
            style={{ borderTop: '4px solid var(--cobalt)' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--cobalt-light)', color: 'var(--cobalt)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Radio size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              Differential CAN Bus
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              Full ISO 11898-2 differential communication over CAN-H and CAN-L twisted pairs with 120Ω termination, ensuring common-mode noise rejection.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cobalt)', fontSize: '12.5px', fontWeight: 600 }}>
              <span>Live CAN Bus Frames</span>
              <ArrowUpRight size={14} />
            </div>
          </Card>

          <Card 
            variant="interactive" 
            onClick={() => setActiveTab('alerts')}
            style={{ borderTop: '4px solid var(--coral)' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--coral-light)', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              4-Stage Safety Interlocks
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              Hardware protection thresholds for Over-Voltage (OVP &gt; 13.5V), Under-Voltage (UVP &lt; 9.0V), Over-Current (OCP &gt; 3.0A), and Thermal Lockout (OTP ≥ 60.0°C).
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--coral)', fontSize: '12.5px', fontWeight: 600 }}>
              <span>Protection Thresholds</span>
              <ArrowUpRight size={14} />
            </div>
          </Card>

          <Card 
            variant="interactive" 
            onClick={() => setActiveTab('health')}
            style={{ borderTop: '4px solid var(--iris)' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--iris-light)', color: 'var(--iris)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              Trained AI Prediction Engine
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              High-accuracy trained battery health diagnostics evaluating live telemetry against verified battery physics, citing IEEE and ISO safety standards.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--iris)', fontSize: '12.5px', fontWeight: 600 }}>
              <span>AI Health Model</span>
              <ArrowUpRight size={14} />
            </div>
          </Card>

          <Card 
            variant="interactive" 
            onClick={() => setActiveTab('device')}
            style={{ borderTop: '4px solid var(--sprout)' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--sprout-light)', color: 'var(--sprout)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Cpu size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              Physical Hardware Bench
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              Dedicated modular electronics testbench enclosure uniting NodeMCU, MCP2515, TJA1050, INA219, DHT11, SSD1306 OLED, and L298N cooling driver.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sprout)', fontSize: '12.5px', fontWeight: 600 }}>
              <span>8 Hardware Modules</span>
              <ArrowUpRight size={14} />
            </div>
          </Card>
        </div>
      </section>


      {/* ========================================================
          3. INTERACTIVE SYSTEM SIGNAL PIPELINE (DARK BAND)
          ======================================================== */}
      <section className="dark-band" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px', 
              color: '#38bdf8', 
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '4px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              marginBottom: '14px',
            }}
          >
            END-TO-END TELEMETRY ARCHITECTURE
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            CAN Bus Data Acquisition & Edge Safety Pipeline
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(203, 213, 225, 0.85)', maxWidth: '780px', margin: '8px auto 0' }}>
            Structured signal flow from electrochemical sensing across differential CAN-H/CAN-L lines to cloud IoT and vector analytics.
          </p>
        </div>

        {/* Linear Step Bar */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '14px',
            marginBottom: '28px'
          }}
        >
          <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', borderTop: '3px solid #60a5fa' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#93c5fd', display: 'block', marginBottom: '6px' }}>STEP 01</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>1. Physical Sensing</div>
            <p style={{ fontSize: '12.5px', color: 'rgba(203, 213, 225, 0.8)', lineHeight: 1.5, margin: 0 }}>
              INA219 high-side shunt (0x40) &amp; DHT11 thermal probe (D7) sample nominal 12V pack bus.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', borderTop: '3px solid #c084fc' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#d8b4fe', display: 'block', marginBottom: '6px' }}>STEP 02</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>2. NodeMCU Edge Processing</div>
            <p style={{ fontSize: '12.5px', color: 'rgba(203, 213, 225, 0.8)', lineHeight: 1.5, margin: 0 }}>
              Tensilica 32-bit core validates safety limits, formats payloads, and updates SSD1306 OLED.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', borderTop: '3px solid #fcd34d' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#fde047', display: 'block', marginBottom: '6px' }}>STEP 03</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>3. MCP2515 CAN Transceiver</div>
            <p style={{ fontSize: '12.5px', color: 'rgba(203, 213, 225, 0.8)', lineHeight: 1.5, margin: 0 }}>
              Translates SPI frames into balanced CAN-H &amp; CAN-L differential signals adhering to ISO 11898.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', borderTop: '3px solid #4ade80' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#86efac', display: 'block', marginBottom: '6px' }}>STEP 04</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>4. Closed-Loop Actuation</div>
            <p style={{ fontSize: '12.5px', color: 'rgba(203, 213, 225, 0.8)', lineHeight: 1.5, margin: 0 }}>
              L298N energizes 12V forced-air cooling fan on heat elevation (≥35°C); buzzer fires on trip.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', borderTop: '3px solid #f472b6' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#fbcfe8', display: 'block', marginBottom: '6px' }}>STEP 05</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>5. Web Dashboard & AI Prediction Model</div>
            <p style={{ fontSize: '12.5px', color: 'rgba(203, 213, 225, 0.8)', lineHeight: 1.5, margin: 0 }}>
              Streams live charts, PDF report compilation, and interactive AI model inference &amp; diagnostics.
            </p>
          </div>
        </div>
      </section>


      {/* ========================================================
          4. COMPREHENSIVE FEATURES GRID (6 CARDS)
          ======================================================== */}
      <section style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Eyebrow color="blue">COMPLETE FEATURE ECOSYSTEM</Eyebrow>
          <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.025em' }}>
            Interactive Console Modules
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--silver-500)', maxWidth: '720px', margin: '8px auto 0' }}>
            Explore the dedicated modules for real-time telemetry, artificial intelligence diagnostics, safety interlocks, and technical reporting.
          </p>
        </div>

        <div className="grid-responsive-3">
          <Card variant="interactive" onClick={() => setActiveTab('monitoring')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--cobalt-light)', color: 'var(--cobalt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={18} />
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cobalt)', fontWeight: 600 }}>LAUNCH →</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              Real-Time Telemetry &amp; Actuators
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              Live streaming line charts of bus voltage, load current, power, and temperature, plus active L298N cooling fan and buzzer override toggles.
            </p>
          </Card>

          <Card variant="interactive" onClick={() => setActiveTab('health')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--iris-light)', color: 'var(--iris)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} />
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--iris)', fontWeight: 600 }}>LAUNCH →</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              Trained AI Health Prognostics
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              On-demand health condition assessment powered by trained battery predictive models evaluating live physical telemetry with verified battery limits.
            </p>
          </Card>

          <Card variant="interactive" onClick={() => setActiveTab('alerts')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--coral-light)', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} />
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--coral)', fontWeight: 600 }}>LAUNCH →</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              Hardware Trip Fault Management
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              Auditable logs of Over-Voltage, Under-Voltage, Over-Current, and Over-Temperature trip events with instant acknowledge capabilities.
            </p>
          </Card>

          <Card variant="interactive" onClick={() => setActiveTab('reports')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--cobalt-light)', color: 'var(--cobalt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} />
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cobalt)', fontWeight: 600 }}>LAUNCH →</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              ISO 26262 Format Technical Reports
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              Format-wise on-page battery condition audit documents, vector PDF report generation, direct downloads, and SMTP email dispatch.
            </p>
          </Card>

          <Card variant="interactive" onClick={() => setActiveTab('device')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--sprout-light)', color: 'var(--sprout)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={18} />
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--sprout)', fontWeight: 600 }}>LAUNCH →</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              Hardware Testbench &amp; Photo Audit
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              Complete inventory of all 8 physical testbench modules with verified photos, pinout connections, datasheets, and bus registers.
            </p>
          </Card>

          <Card variant="interactive" onClick={() => setActiveTab('monitoring')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--saffron-light)', color: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={18} />
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--saffron)', fontWeight: 600 }}>LAUNCH →</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '8px' }}>
              Time-Series Historical Statistics
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.6 }}>
              Dynamic time-series analysis with min/max/average metrics across customizable time windows from 1 minute up to 24 hours.
            </p>
          </Card>
        </div>
      </section>

    </div>
  );
}
