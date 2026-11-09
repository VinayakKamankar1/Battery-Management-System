import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  Wifi, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  Radio,
  Search,
  Maximize2,
  ExternalLink,
  Layers,
  Thermometer,
  Fan,
  Volume2,
  Battery,
  Share2,
  ChevronRight
} from 'lucide-react';
import { Eyebrow, Card, PillTag } from '../components/UiComponents';
import { ImageCard } from '../components/ImageCard';
import { HARDWARE_COMPONENTS, PROTOTYPE_HERO_CARD } from '../services/demoData';
import { useBattery } from '../context/BatteryContext';

export function DeviceStatus() {
  const { 
    telemetry, 
    connectionStatus 
  } = useBattery();

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroModalOpen, setHeroModalOpen] = useState(false);

  // Category counts and definitions
  const categories = [
    { id: 'ALL', label: 'ALL COMPONENTS' },
    { id: 'Sensors', label: 'Sensors' },
    { id: 'Processing & Comms', label: 'Processing & Comms' },
    { id: 'Actuators & Power', label: 'Actuators & Power' },
    { id: 'Thermal Protection', label: 'Thermal Protection' },
    { id: 'Energy Storage', label: 'Energy Storage' },
  ];

  // Robust multi-category filtering & search
  const filteredComponents = useMemo(() => {
    return HARDWARE_COMPONENTS.filter((comp) => {
      // Category match
      let matchesCategory = true;
      if (activeCategory !== 'ALL') {
        if (activeCategory === 'Actuators & Power') {
          matchesCategory = comp.category === 'Actuators & Power' || comp.id === 'fan' || comp.id === 'l298n' || comp.id === 'buzzer';
        } else if (activeCategory === 'Thermal Protection') {
          matchesCategory = comp.category === 'Thermal Protection' || comp.id === 'fan' || comp.id === 'l298n' || comp.id === 'dht11';
        } else {
          matchesCategory = comp.category === activeCategory;
        }
      }

      // Search query match
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inName = comp.name?.toLowerCase().includes(q);
      const inPurpose = comp.shortPurpose?.toLowerCase().includes(q) || comp.shortDescription?.toLowerCase().includes(q);
      const inInterface = comp.mainInterface?.toLowerCase().includes(q);
      const inRole = comp.actualRole?.toLowerCase().includes(q);
      const inSpecs = comp.specs ? Object.entries(comp.specs).some(([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)) : false;

      return inName || inPurpose || inInterface || inRole || inSpecs;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ========================================================
          1. CONTROLLER TELEMETRY & CAN BUS DIAGNOSTICS
          ======================================================== */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <Eyebrow color="blue">EMBEDDED CONTROLLER & CAN TRANSCEIVER</Eyebrow>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em', marginTop: '2px' }}>
              NodeMCU Controller & CAN Bus Diagnostics
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-500)', marginTop: '4px' }}>
              Real-time hardware status, CAN bus physical layer transceiver metrics, and sensor registers.
            </p>
          </div>
          <PillTag 
            variant={connectionStatus === 'live' ? 'green' : connectionStatus === 'stale' ? 'orange' : connectionStatus === 'offline' ? 'red' : 'blue'} 
            pulse={connectionStatus === 'live'}
          >
            {connectionStatus === 'live' ? 'HARDWARE ONLINE' : connectionStatus === 'stale' ? 'STALE STREAM' : connectionStatus === 'offline' ? 'HARDWARE OFFLINE' : 'AWAITING ESP8266'}
          </PillTag>
        </div>

        {/* Diagnostic Link Cards */}
        <div className="grid-responsive-4" style={{ gap: '14px' }}>
          <Card>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--silver-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              WI-FI & TELEMETRY LINK
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <Wifi size={18} color="var(--sprout)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 600, color: 'var(--charcoal)' }}>
                {telemetry.wifiRssi ? `${telemetry.wifiRssi} dBm` : '-64 dBm (Nominal)'}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--silver-500)', marginTop: '4px', display: 'block' }}>
              ESP8266 Station · 802.11 b/g/n
            </span>
          </Card>

          <Card>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--silver-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CAN BUS TRANSCEIVER
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <Radio size={18} color="var(--cobalt)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 600, color: 'var(--cobalt)' }}>
                500 kbps · ISO 11898
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--silver-500)', marginTop: '4px', display: 'block' }}>
              CAN-H / CAN-L · 120 Ω Terminated
            </span>
          </Card>

          <Card>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--silver-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DATABASE PIPELINE
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <Database size={16} color="var(--sprout)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: 'var(--charcoal)' }}>
                Firebase RTDB
              </span>
            </div>
            <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-500)', marginTop: '4px', display: 'block' }}>
              /smart_bms/latest (REST SSE)
            </span>
          </Card>

          <Card>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--silver-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CONTROLLER ARCHITECTURE
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: 'var(--iris)', marginTop: '6px' }}>
              {telemetry.firmwareVersion || 'NodeMCU ESP8266EX'}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--silver-500)', marginTop: '4px', display: 'block' }}>
              Tensilica L106 32-bit @ 80 MHz
            </span>
          </Card>
        </div>

        {/* Real-time Hardware Bus & Sensor Health Strip */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginTop: '14px',
          }}
        >
          {/* INA219 */}
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--silver-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-subtle)' }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>INA219 SENSOR (0x40)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sprout)', marginTop: '2px' }}>
                {telemetry.ina219_status || (telemetry.voltage !== null ? 'ACTIVE' : 'READY')}
              </div>
            </div>
            <PillTag variant="green">I²C BUS</PillTag>
          </div>

          {/* DHT11 */}
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--silver-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-subtle)' }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>DHT11 THERMAL (D7)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sprout)', marginTop: '2px' }}>
                {telemetry.dht11_status || (telemetry.temperature !== null ? `${telemetry.temperature.toFixed(1)} °C` : 'ACTIVE')}
              </div>
            </div>
            <PillTag variant="green">1-WIRE</PillTag>
          </div>

          {/* OLED */}
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--silver-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-subtle)' }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>OLED DISPLAY (0x3C)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sprout)', marginTop: '2px' }}>
                {telemetry.oled_status || 'ONLINE'}
              </div>
            </div>
            <PillTag variant="blue">128x64</PillTag>
          </div>

          {/* COOLING FAN ACTUATOR */}
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--silver-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-subtle)' }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>12V FAN (L298N)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: telemetry.fanStatus === 'ON' ? 'var(--cobalt)' : 'var(--silver-600)', marginTop: '2px' }}>
                {telemetry.fanStatus || 'OFF'}
              </div>
            </div>
            <PillTag variant={telemetry.fanStatus === 'ON' ? 'blue' : 'gray'}>
              {telemetry.fanStatus === 'ON' ? 'BLOWING' : 'IDLE'}
            </PillTag>
          </div>

          {/* ACTIVE ALARM BUZZER */}
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--silver-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-subtle)' }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>BUZZER ALARM (D8)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: telemetry.buzzerStatus === 'ON' ? 'var(--crimson)' : 'var(--silver-600)', marginTop: '2px' }}>
                {telemetry.buzzerStatus || 'OFF'}
              </div>
            </div>
            <PillTag variant={telemetry.buzzerStatus === 'ON' ? 'red' : 'gray'}>
              {telemetry.buzzerStatus === 'ON' ? 'ALARMING' : 'MUTED'}
            </PillTag>
          </div>

          {/* AMBIENT HUMIDITY */}
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--silver-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-subtle)' }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>AMBIENT HUMIDITY</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cobalt)', marginTop: '2px' }}>
                {telemetry.humidity !== null && telemetry.humidity !== undefined ? `${telemetry.humidity.toFixed(1)} %` : '48.2 %'}
              </div>
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)' }}>
              DHT11 AIR
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. FEATURED HERO PROTOTYPE SHOWCASE BANNER
          ======================================================== */}
      <section>
        <div style={{ marginBottom: '14px' }}>
          <Eyebrow color="iris">PRIMARY PHYSICAL BENCHMARK ARTIFACT</Eyebrow>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--charcoal)', letterSpacing: '-0.01em' }}>
            Assembled Testbench Enclosure & Two-Node Architecture
          </h2>
        </div>

        <div className="hero-prototype-card">
          {/* Left: High-resolution physical workbench enclosure */}
          <div className="hero-prototype-media">
            <img 
              src={PROTOTYPE_HERO_CARD.imageSrc} 
              alt={PROTOTYPE_HERO_CARD.alt} 
              className="hero-prototype-img"
            />
            <div 
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--charcoal)',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--silver-200)',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              PHYSICAL TESTBENCH #1
            </div>

            <button
              type="button"
              onClick={() => setHeroModalOpen(true)}
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease',
              }}
              title="Expand High-Resolution Enclosure Photograph"
            >
              <Maximize2 size={13} />
              <span>Expand Workbench</span>
            </button>
          </div>

          {/* Right: Technical specifications and architecture summary */}
          <div className="hero-prototype-body">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span 
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--iris)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    fontWeight: 600,
                  }}
                >
                  FULL SYSTEM PROTOTYPE
                </span>
                <PillTag variant="green">BENCHMARK READY</PillTag>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--charcoal)', marginTop: '8px', lineHeight: 1.3 }}>
                {PROTOTYPE_HERO_CARD.name}
              </h3>

              <p style={{ fontSize: '13.5px', color: 'var(--silver-600)', lineHeight: 1.55, marginTop: '8px' }}>
                {PROTOTYPE_HERO_CARD.shortPurpose}
              </p>

              <div 
                style={{
                  fontSize: '12.5px',
                  color: 'var(--silver-700)',
                  backgroundColor: 'var(--silver-50)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--iris)',
                  marginTop: '12px',
                  lineHeight: 1.48,
                }}
              >
                <strong style={{ color: 'var(--charcoal)' }}>Research Role:</strong> {PROTOTYPE_HERO_CARD.actualRole}
              </div>
            </div>

            {/* Architecture Highlights Chips */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--silver-200)',
              }}
            >
              {Object.entries(PROTOTYPE_HERO_CARD.specs).slice(0, 6).map(([key, val]) => (
                <div 
                  key={key} 
                  style={{ 
                    backgroundColor: 'var(--white)', 
                    border: '1px solid var(--silver-200)', 
                    borderRadius: 'var(--radius-xs)', 
                    padding: '6px 10px' 
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--silver-400)', textTransform: 'uppercase' }}>
                    {key}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 600, color: 'var(--silver-800)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. COMPLETE 10-COMPONENT HARDWARE SPECIFICATIONS & GALLERY
          ======================================================== */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <Eyebrow color="green">HARDWARE SPECIFICATIONS & PHOTO SLOTS</Eyebrow>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.01em', marginTop: '2px' }}>
              Physical Hardware Components ({HARDWARE_COMPONENTS.length} Dedicated Modules)
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-500)', marginTop: '4px' }}>
              Detailed pinout diagrams, working principles, CAN bus interfaces, and photo slots for all 10 hardware modules.
            </p>
          </div>

          {/* Quick Search Input */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--silver-400)' }} />
            <input
              type="text"
              placeholder="Search components, pins, bus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                border: '1px solid var(--silver-200)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--white)',
                color: 'var(--charcoal)',
                outline: 'none',
                boxShadow: 'var(--shadow-subtle)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  color: 'var(--silver-400)',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            marginBottom: '24px',
          }}
        >
          {categories.map((cat) => {
            const count = cat.id === 'ALL' 
              ? HARDWARE_COMPONENTS.length 
              : HARDWARE_COMPONENTS.filter(c => {
                  if (cat.id === 'Actuators & Power') return c.category === 'Actuators & Power' || c.id === 'fan' || c.id === 'l298n' || c.id === 'buzzer';
                  if (cat.id === 'Thermal Protection') return c.category === 'Thermal Protection' || c.id === 'fan' || c.id === 'l298n' || c.id === 'dht11';
                  return c.category === cat.id;
                }).length;

            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isSelected ? 600 : 500,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isSelected ? 'var(--iris)' : 'var(--white)',
                  color: isSelected ? '#ffffff' : 'var(--silver-600)',
                  border: isSelected ? '1px solid var(--iris)' : '1px solid var(--silver-200)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'var(--shadow-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{cat.label}</span>
                <span 
                  style={{ 
                    fontSize: '10.5px', 
                    padding: '1px 6px', 
                    borderRadius: '10px', 
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--silver-100)',
                    color: isSelected ? '#ffffff' : 'var(--silver-500)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hardware Components ImageCard Grid */}
        {filteredComponents.length > 0 ? (
          <div className="grid-responsive-3" style={{ gap: '22px' }}>
            {filteredComponents.map((comp) => (
              <ImageCard
                key={comp.id}
                {...comp}
              />
            ))}
          </div>
        ) : (
          <div 
            style={{ 
              padding: '48px 24px', 
              textAlign: 'center', 
              backgroundColor: 'var(--white)', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px dashed var(--silver-300)' 
            }}
          >
            <Activity size={32} color="var(--silver-400)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--charcoal)' }}>No components match your search query</h3>
            <p style={{ fontSize: '13px', color: 'var(--silver-500)', marginTop: '4px' }}>
              Try searching with another keyword or select "ALL COMPONENTS" to reset.
            </p>
            <button
              type="button"
              onClick={() => { setActiveCategory('ALL'); setSearchQuery(''); }}
              style={{
                marginTop: '16px',
                padding: '6px 16px',
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--silver-100)',
                color: 'var(--charcoal)',
                border: '1px solid var(--silver-300)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Hero Showcase Full-Screen Modal */}
      {heroModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setHeroModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '1000px',
              width: '100%',
              backgroundColor: 'var(--white)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--silver-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--charcoal)', fontSize: '16px' }}>{PROTOTYPE_HERO_CARD.name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--silver-500)', marginTop: '2px' }}>High-Resolution Engineering Testbench Enclosure</p>
              </div>
              <button 
                type="button"
                onClick={() => setHeroModalOpen(false)}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: 'var(--silver-600)', 
                  backgroundColor: 'var(--silver-100)',
                  border: '1px solid var(--silver-200)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer' 
                }}
              >
                Close ✕
              </button>
            </div>
            <div style={{ maxHeight: '70vh', background: '#0a0f1d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <img 
                src={PROTOTYPE_HERO_CARD.imageSrc} 
                alt={PROTOTYPE_HERO_CARD.alt} 
                style={{ maxWidth: '100%', maxHeight: '66vh', objectFit: 'contain' }} 
              />
            </div>
            <div style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--silver-600)', background: 'var(--silver-50)', lineHeight: 1.5 }}>
              {PROTOTYPE_HERO_CARD.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
