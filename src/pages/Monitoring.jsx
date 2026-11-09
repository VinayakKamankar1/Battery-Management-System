import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  Thermometer, 
  Battery, 
  BatteryCharging,
  Clock, 
  Download, 
  RefreshCw, 
  SlidersHorizontal, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Radio, 
  ShieldCheck, 
  ShieldAlert, 
  Fan, 
  Volume2, 
  VolumeX, 
  Search, 
  FileSpreadsheet, 
  Layers, 
  Info,
  Sliders,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { Card, PillTag, Eyebrow, Button } from '../components/UiComponents';
import { useBattery } from '../context/BatteryContext';
import { 
  validateMeasurement, 
  calculateStatistics, 
  filterByTimeRange,
  calculateTrend
} from '../services/telemetryService';

export function Monitoring() {
  const { 
    telemetry, 
    history, 
    connectionStatus, 
    trends, 
    freshnessSeconds, 
    deviceStatusInfo, 
    activeBatterySpec,
    socInfo,
    voltageWithSoc,
    batteryCondition,
    refreshTelemetry, 
    showToast,
    toggleFan,
    toggleBuzzer
  } = useBattery();

  const activeTelemetry = telemetry;

  const [timeRange, setTimeRange] = useState('1h'); // '1m' | '10m' | '1h' | '24h' | 'all'
  const [activeChartTab, setActiveChartTab] = useState('voltage'); // 'voltage' | 'current' | 'power' | 'temperature' | 'combined'
  const [tableSearch, setTableSearch] = useState('');
  const [tableLimit, setTableLimit] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual sync refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTelemetry();
    setTimeout(() => setIsRefreshing(false), 450);
  };

  // Filter history points based on active time range
  const filteredHistory = useMemo(() => {
    return filterByTimeRange(history, timeRange);
  }, [history, timeRange]);

  // Dynamically calculate Min, Max, Avg for the selected time range
  const stats = useMemo(() => {
    return calculateStatistics(filteredHistory);
  }, [filteredHistory]);

  // Validation checks for individual real sensor measurements
  const validation = useMemo(() => ({
    voltage: validateMeasurement('voltage', telemetry.voltage),
    current: validateMeasurement('current', telemetry.current),
    power: validateMeasurement('power', telemetry.power),
    temperature: validateMeasurement('temperature', telemetry.temperature),
  }), [telemetry]);

  // Trend badge renderer adhering strictly to Tuple design
  const renderTrend = (trendObj, unit = '') => {
    if (!trendObj || !trendObj.hasTrend) {
      return (
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
          {trendObj?.label || 'STABLE'}
        </span>
      );
    }

    if (trendObj.direction === 'up') {
      return (
        <span 
          style={{ 
            fontSize: '11.5px', 
            fontFamily: 'var(--font-dm-mono)', 
            fontWeight: 600, 
            color: 'var(--color-sprout)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '2px' 
          }}
        >
          <TrendingUp size={12} /> +{trendObj.delta} {unit}
        </span>
      );
    }

    if (trendObj.direction === 'down') {
      return (
        <span 
          style={{ 
            fontSize: '11.5px', 
            fontFamily: 'var(--font-dm-mono)', 
            fontWeight: 600, 
            color: 'var(--color-coral)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '2px' 
          }}
        >
          <TrendingDown size={12} /> -{trendObj.delta} {unit}
        </span>
      );
    }

    return (
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
        <Minus size={12} /> STABLE
      </span>
    );
  };

  // Export telemetry history to CSV
  const handleExportCsv = () => {
    if (!filteredHistory || filteredHistory.length === 0) {
      showToast('No telemetry records available to export', 'warning');
      return;
    }

    const headers = 'Timestamp,RawTimestamp,Voltage_V,Current_A,Power_W,AmbientTemp_C,FanStatus,BuzzerStatus\n';
    const rows = filteredHistory.map(pt => 
      `"${pt.timestamp || ''}",${pt.rawTimestamp || ''},${pt.voltage !== null ? pt.voltage : ''},${pt.current !== null ? pt.current : ''},${pt.power !== null ? pt.power : ''},${pt.temperature !== null ? pt.temperature : ''},"${pt.fanStatus || 'OFF'}","${pt.buzzerStatus || 'OFF'}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart-bms-telemetry-${timeRange}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredHistory.length} telemetry points to CSV`, 'info');
  };

  // Export telemetry history to JSON
  const handleExportJson = () => {
    if (!filteredHistory || filteredHistory.length === 0) {
      showToast('No telemetry records available to export', 'warning');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredHistory, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.setAttribute('download', `smart-bms-telemetry-${timeRange}-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredHistory.length} telemetry records to JSON`, 'info');
  };

  // Recent-readings table data (reverse order: newest first)
  const recentTableData = useMemo(() => {
    const list = [...filteredHistory].reverse();
    if (!tableSearch.trim()) return list.slice(0, tableLimit);

    const q = tableSearch.toLowerCase();
    return list
      .filter(r => 
        (r.timestamp && r.timestamp.toLowerCase().includes(q)) ||
        (r.fanStatus && r.fanStatus.toLowerCase().includes(q)) ||
        (r.voltage && String(r.voltage).includes(q)) ||
        (r.temperature && String(r.temperature).includes(q))
      )
      .slice(0, tableLimit);
  }, [filteredHistory, tableSearch, tableLimit]);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ========================================================
          TOP ACTION & FRESHNESS HEADER
          ======================================================== */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px',
          borderBottom: '1px solid var(--color-zinc-200)',
          paddingBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Eyebrow color="blue">HIGH-FREQUENCY TELEMETRY ENGINE</Eyebrow>
            <PillTag 
              variant={
                deviceStatusInfo.status === 'ONLINE' ? 'green' :
                deviceStatusInfo.status === 'DEMO_SIMULATION' ? 'blue' :
                deviceStatusInfo.status === 'STALE_DATA' ? 'orange' : 'red'
              } 
              pulse={deviceStatusInfo.isFresh}
            >
              {deviceStatusInfo.label}
            </PillTag>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-zinc-900)', letterSpacing: '-0.02em', margin: 0 }}>
            Live Sensor Monitoring & CAN Bus Signal Waveforms
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-zinc-500)', margin: '4px 0 0' }}>
            Two-Node CAN Bus Architecture · NodeMCU Controller · CAN Transceiver (CAN-H/CAN-L) · INA219 · DHT11 · L298N
          </p>
        </div>

        {/* Action Controls & Beacon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Data Freshness Indicator */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: 'var(--color-zinc-100)', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-buttons)',
              border: '1px solid var(--color-zinc-200)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11.5px',
            }}
          >
            <div 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: 
                  connectionStatus === 'live' ? 'var(--color-sprout)' :
                  connectionStatus === 'stale' ? 'var(--color-saffron)' :
                  connectionStatus === 'disconnected' ? 'var(--color-crimson)' : 'var(--color-cobalt)',
                boxShadow: connectionStatus === 'live' ? '0 0 8px rgba(27, 177, 82, 0.6)' : 'none',
                animation: connectionStatus === 'live' ? 'pulse-beacon 1.8s infinite' : 'none',
              }} 
            />
            <span style={{ color: 'var(--color-zinc-700)' }}>
              FEED STATUS: <strong>
                {connectionStatus === 'live' ? `Live (${freshnessSeconds ?? 0}s ago)` :
                 connectionStatus === 'stale' ? `Stale (${freshnessSeconds}s)` :
                 connectionStatus === 'disconnected' ? 'Socket Disconnected' : 'Awaiting ESP8266'}
              </strong>
            </span>
          </div>

          {/* Sync Button */}
          <Button 
            variant="outlined" 
            size="sm" 
            onClick={handleRefresh}
            icon={RefreshCw}
            className={isRefreshing ? 'animate-spin' : ''}
          >
            Sync Stream
          </Button>

          {/* Export Controls */}
          <Button 
            variant="outlined" 
            size="sm" 
            onClick={handleExportCsv}
            icon={Download}
          >
            CSV
          </Button>

          <Button 
            variant="outlined" 
            size="sm" 
            onClick={handleExportJson}
            icon={FileSpreadsheet}
          >
            JSON
          </Button>
        </div>
      </div>

      {/* ========================================================
          DEVICE STATUS NOTIFICATION & SENSOR BUS HEALTH BANNER
          ======================================================== */}
      <div
        style={{
          padding: '14px 20px',
          backgroundColor: 
            deviceStatusInfo.status === 'ONLINE' ? 'var(--color-sprout-wash)' :
            deviceStatusInfo.status === 'DEMO_SIMULATION' ? 'var(--color-cobalt-wash)' :
            deviceStatusInfo.status === 'STALE_DATA' ? 'var(--color-coral-wash)' : 'var(--color-crimson-wash)',
          border: `1px solid ${
            deviceStatusInfo.status === 'ONLINE' ? 'rgba(27, 177, 82, 0.3)' :
            deviceStatusInfo.status === 'DEMO_SIMULATION' ? 'rgba(63, 113, 212, 0.3)' :
            deviceStatusInfo.status === 'STALE_DATA' ? 'rgba(219, 84, 52, 0.3)' : 'rgba(239, 68, 68, 0.3)'
          }`,
          borderRadius: 'var(--radius-cards)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              backgroundColor: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-subtle-2)',
              color: 
                deviceStatusInfo.status === 'ONLINE' ? 'var(--color-sprout)' :
                deviceStatusInfo.status === 'DEMO_SIMULATION' ? 'var(--color-cobalt)' :
                deviceStatusInfo.status === 'STALE_DATA' ? 'var(--color-coral)' : 'var(--color-crimson)',
            }}
          >
            {deviceStatusInfo.status === 'ONLINE' ? <CheckCircle2 size={20} /> :
             deviceStatusInfo.status === 'DEMO_SIMULATION' ? <Radio size={20} /> :
             deviceStatusInfo.status === 'STALE_DATA' ? <AlertTriangle size={20} /> : <AlertOctagon size={20} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
                {deviceStatusInfo.label}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-sprout)', fontWeight: 600 }}>
                [ESP8266 LIVE PIPELINE]
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--color-zinc-600)', margin: '2px 0 0' }}>
              {deviceStatusInfo.description}
            </p>
          </div>
        </div>

        {/* Bus Interface Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid var(--color-zinc-200)', fontSize: '11.5px', fontFamily: 'var(--font-dm-mono)' }}>
            INA219 I²C: <strong style={{ color: validation.voltage.isValid ? 'var(--color-sprout)' : 'var(--color-crimson)' }}>{validation.voltage.isValid ? '0x40 (ACK)' : 'BUS FAULT'}</strong>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid var(--color-zinc-200)', fontSize: '11.5px', fontFamily: 'var(--font-dm-mono)' }}>
            DHT11 1-Wire: <strong style={{ color: validation.temperature.isValid ? 'var(--color-sprout)' : 'var(--color-crimson)' }}>{validation.temperature.isValid ? 'D7 (ACK)' : 'CHECKSUM ERR'}</strong>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid var(--color-zinc-200)', fontSize: '11.5px', fontFamily: 'var(--font-dm-mono)' }}>
            AMBIENT HUMIDITY: <strong style={{ color: 'var(--color-cobalt)' }}>{telemetry.humidity !== null && telemetry.humidity !== undefined ? `${telemetry.humidity.toFixed(1)} %` : '--'}</strong>
          </div>
          
          <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--color-zinc-100)', border: '1px solid var(--color-zinc-200)', fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-600)' }}>
            FEED: <strong>/smart_bms/latest</strong>
          </div>
        </div>
      </div>

      {/* ========================================================
          1. LARGE SENSOR MEASUREMENT CARDS
          Voltage, Current, Power, Ambient Temperature
          ======================================================== */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <Eyebrow color="blue">CALIBRATED ANALOG FRONT-END & CAN BUS</Eyebrow>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
              CAN Bus Battery Sensor Telemetry
            </h2>
          </div>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
            SAMPLE RATE: 1000ms · 12-BIT RESOLUTION
          </span>
        </div>

        {/* Dedicated Big Bold Battery Charging Percentage (SOC) Callout */}
        <div
          style={{
            padding: '18px 24px',
            borderRadius: 'var(--radius-cards)',
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            boxShadow: 'var(--shadow-subtle-2)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(238, 242, 255, 0.85) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              <BatteryCharging size={32} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  BATTERY CHARGE PERCENTAGE (ESTIMATED SOC)
                </span>
                <PillTag variant={socInfo?.isAvailable && socInfo.socPercent >= 100 ? 'green' : 'blue'}>
                  {socInfo?.isAvailable && socInfo.socPercent >= 100 ? 'FULLY CHARGED (≥ 12.0V)' : 'CALIBRATED 12V PACK'}
                </PillTag>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
                <span 
                  className="font-mono" 
                  style={{ 
                    fontSize: '44px', 
                    fontWeight: 900, 
                    color: '#0284c7',
                    lineHeight: 1.0,
                    letterSpacing: '-0.03em'
                  }}
                >
                  {socInfo?.isAvailable ? `${socInfo.socPercent}%` : '-- %'}
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--color-zinc-600)', fontWeight: 500 }}>
                  {socInfo?.basis || '12V Calibrated Profile'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ minWidth: '220px', flex: '1 1 240px', maxWidth: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', marginBottom: '6px' }}>
              <span>0% Empty (9.0V)</span>
              <strong style={{ color: '#0284c7' }}>{socInfo?.isAvailable ? `${socInfo.socPercent}% Usable Capacity` : '--'}</strong>
              <span>100% Full (≥ 12.0V)</span>
            </div>
            <div style={{ height: '10px', width: '100%', backgroundColor: 'rgba(2, 132, 199, 0.12)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: socInfo?.isAvailable ? `${Math.min(100, Math.max(0, socInfo.socPercent))}%` : '0%',
                  background: 'linear-gradient(90deg, #38bdf8 0%, #22c55e 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid-responsive-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          {/* Large Card 1: Pack Voltage (V) - Distinct Reading */}
          <Card 
            className="accent-cobalt"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              minHeight: '260px',
              borderTop: '4px solid var(--color-cobalt)',
              boxShadow: 'var(--shadow-subtle-2)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      PACK VOLTAGE
                    </span>
                    <PillTag variant={validation.voltage.isValid ? 'blue' : 'red'}>
                      {validation.voltage.isValid ? 'INA219' : 'FAULT'}
                    </PillTag>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-zinc-400)', display: 'block', marginTop: '2px' }}>
                    12V Li-ion Pack Terminal
                  </span>
                </div>

                <div 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--color-cobalt-wash)', 
                    color: 'var(--color-cobalt)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <Zap size={20} />
                </div>
              </div>

              {/* Pure Large Voltage Metric Display (Separated) */}
              <div style={{ margin: '14px 0 8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                  <span 
                    className="font-mono" 
                    style={{ 
                      fontSize: '32px', 
                      fontWeight: 800, 
                      color: validation.voltage.isValid ? 'var(--color-zinc-900)' : 'var(--color-crimson)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}
                  >
                    {validation.voltage.isValid ? `${telemetry.voltage.toFixed(2)} V` : '-- V'}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--color-zinc-500)', marginTop: '4px', fontFamily: 'var(--font-dm-mono)' }}>
                  INA219 High-Side Bus · Calibrated AFE
                </div>

                {!validation.voltage.isValid && (
                  <span style={{ fontSize: '11px', color: 'var(--color-crimson)', fontFamily: 'var(--font-dm-mono)', display: 'block', marginTop: '4px' }}>
                    Validation Error: {validation.voltage.reason}
                  </span>
                )}
              </div>

              {/* Visual Operating Limit Range */}
              <div style={{ marginTop: '14px' }}>
                {activeBatterySpec?.verification_status === 'VERIFIED' && activeBatterySpec.min_operating_voltage && activeBatterySpec.max_operating_voltage ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginBottom: '4px' }}>
                      <span>Cutoff {activeBatterySpec.min_operating_voltage.toFixed(1)}V</span>
                      <span>Nominal {activeBatterySpec.nominal_voltage.toFixed(1)}V</span>
                      <span>Max {activeBatterySpec.max_operating_voltage.toFixed(1)}V</span>
                    </div>
                    <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--color-zinc-100)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: validation.voltage.isValid ? `${Math.min(100, Math.max(0, ((telemetry.voltage - activeBatterySpec.min_operating_voltage) / (activeBatterySpec.max_operating_voltage - activeBatterySpec.min_operating_voltage)) * 100))}%` : '0%',
                          backgroundColor: 
                            !validation.voltage.isValid ? 'var(--color-zinc-300)' :
                            telemetry.voltage > activeBatterySpec.max_operating_voltage ? 'var(--color-crimson)' :
                            telemetry.voltage < activeBatterySpec.min_operating_voltage ? 'var(--color-coral)' : 'var(--color-cobalt)',
                          transition: 'width 0.3s ease',
                          borderRadius: '999px',
                        }} 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginBottom: '4px' }}>
                      <span>Chemistry Unverified</span>
                      <span>Universal Limits Prohibited</span>
                    </div>
                    <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--color-zinc-100)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', width: '100%', backgroundColor: 'var(--color-zinc-200)', borderRadius: '999px' }} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Register Stats & Trend */}
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '10px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)' }}>
                Range: <strong>{stats.voltage.min}V</strong> – <strong>{stats.voltage.max}V</strong>
              </div>
              {renderTrend(trends.voltage, 'V')}
            </div>
          </Card>

          {/* Large Card 2: Pack Current (A) */}
          <Card 
            className="accent-sprout"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              minHeight: '260px',
              borderTop: '4px solid var(--color-sprout)',
              boxShadow: 'var(--shadow-subtle-2)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      PACK CURRENT
                    </span>
                    <PillTag variant={validation.current.isValid ? 'green' : 'red'}>
                      {validation.current.isValid ? 'SHUNT' : 'FAULT'}
                    </PillTag>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-zinc-400)', display: 'block', marginTop: '2px' }}>
                    Bidirectional Shunt Flow
                  </span>
                </div>

                <div 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--color-sprout-wash)', 
                    color: 'var(--color-sprout)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <Activity size={20} />
                </div>
              </div>

              {/* Large Metric Display with Validation */}
              <div style={{ margin: '14px 0 8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span 
                    className="font-mono" 
                    style={{ 
                      fontSize: '36px', 
                      fontWeight: 800, 
                      color: validation.current.isValid ? 'var(--color-zinc-900)' : 'var(--color-crimson)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {validation.current.isValid ? telemetry.current.toFixed(2) : '--'}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-zinc-500)' }}>A</span>
                </div>

                {!validation.current.isValid && (
                  <span style={{ fontSize: '11px', color: 'var(--color-crimson)', fontFamily: 'var(--font-dm-mono)', display: 'block', marginTop: '4px' }}>
                    Validation Error: {validation.current.reason}
                  </span>
                )}
              </div>

              {/* Visual Progress Bar (0A to 16A range with 15A OCP mark) */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginBottom: '4px' }}>
                  <span>0.0A (Idle)</span>
                  <span>Nominal: 4.0A</span>
                  <span>OCP 15.0A</span>
                </div>
                <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--color-zinc-100)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: validation.current.isValid ? `${Math.min(100, Math.max(0, (telemetry.current / 16) * 100))}%` : '0%',
                      backgroundColor: 
                        !validation.current.isValid ? 'var(--color-zinc-300)' :
                        telemetry.current >= 15.0 ? 'var(--color-crimson)' : 'var(--color-sprout)',
                      transition: 'width 0.3s ease',
                      borderRadius: '999px',
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Bottom Register Stats & Trend */}
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '10px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)' }}>
                Range: <strong>{stats.current.min}A</strong> – <strong>{stats.current.max}A</strong>
              </div>
              {renderTrend(trends.current, 'A')}
            </div>
          </Card>

          {/* Large Card 3: Active Power (W) */}
          <Card 
            className="accent-iris"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              minHeight: '260px',
              borderTop: '4px solid var(--color-iris)',
              boxShadow: 'var(--shadow-subtle-2)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ACTIVE POWER
                    </span>
                    <PillTag variant={validation.power.isValid ? 'blue' : 'red'}>
                      {validation.power.isValid ? 'V × I LOAD' : 'FAULT'}
                    </PillTag>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-zinc-400)', display: 'block', marginTop: '2px' }}>
                    Instantaneous Electrical Output
                  </span>
                </div>

                <div 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--color-iris-wash)', 
                    color: 'var(--color-iris)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <Battery size={20} />
                </div>
              </div>

              {/* Large Metric Display with Validation */}
              <div style={{ margin: '14px 0 8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span 
                    className="font-mono" 
                    style={{ 
                      fontSize: '36px', 
                      fontWeight: 800, 
                      color: validation.power.isValid ? 'var(--color-zinc-900)' : 'var(--color-crimson)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {validation.power.isValid ? telemetry.power.toFixed(1) : '--'}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-zinc-500)' }}>W</span>
                </div>

                {!validation.power.isValid && (
                  <span style={{ fontSize: '11px', color: 'var(--color-crimson)', fontFamily: 'var(--font-dm-mono)', display: 'block', marginTop: '4px' }}>
                    Validation Error: {validation.power.reason}
                  </span>
                )}
              </div>

              {/* Visual Progress Bar (0W to 800W range) */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginBottom: '4px' }}>
                  <span>0W</span>
                  <span>250W Cont.</span>
                  <span>800W Peak</span>
                </div>
                <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--color-zinc-100)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: validation.power.isValid ? `${Math.min(100, Math.max(0, (telemetry.power / 800) * 100))}%` : '0%',
                      backgroundColor: 'var(--color-iris)',
                      transition: 'width 0.3s ease',
                      borderRadius: '999px',
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Bottom Register Stats & Trend */}
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '10px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)' }}>
                Range: <strong>{stats.power.min}W</strong> – <strong>{stats.power.max}W</strong>
              </div>
              {renderTrend(trends.power, 'W')}
            </div>
          </Card>

          {/* Large Card 4: Ambient Enclosure Temperature (°C) */}
          <Card 
            className="accent-coral"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              minHeight: '260px',
              borderTop: '4px solid var(--color-coral)',
              boxShadow: 'var(--shadow-subtle-2)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      AMBIENT TEMPERATURE
                    </span>
                    <PillTag variant={validation.temperature.isValid ? 'orange' : 'red'}>
                      {validation.temperature.isValid ? 'DHT11' : 'FAULT'}
                    </PillTag>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-zinc-400)', display: 'block', marginTop: '2px' }}>
                    Enclosure Air (Not Cell Core)
                  </span>
                </div>

                <div 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--color-coral-wash)', 
                    color: 'var(--color-coral)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <Thermometer size={20} />
                </div>
              </div>

              {/* Large Metric Display with Validation */}
              <div style={{ margin: '14px 0 8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span 
                    className="font-mono" 
                    style={{ 
                      fontSize: '36px', 
                      fontWeight: 800, 
                      color: validation.temperature.isValid ? 'var(--color-zinc-900)' : 'var(--color-crimson)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {validation.temperature.isValid ? telemetry.temperature.toFixed(1) : '--'}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-zinc-500)' }}>°C</span>
                </div>

                {!validation.temperature.isValid && (
                  <span style={{ fontSize: '11px', color: 'var(--color-crimson)', fontFamily: 'var(--font-dm-mono)', display: 'block', marginTop: '4px' }}>
                    Validation Error: {validation.temperature.reason}
                  </span>
                )}
              </div>

              {/* Visual Progress Bar (20°C to 70°C with 35°C Fan & 60°C OTP) */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginBottom: '4px' }}>
                  <span>20°C (Ambient)</span>
                  <span>Fan On: 35°C</span>
                  <span>OTP 60°C</span>
                </div>
                <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--color-zinc-100)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: validation.temperature.isValid ? `${Math.min(100, Math.max(0, ((telemetry.temperature - 20) / 50) * 100))}%` : '0%',
                      backgroundColor: 
                        !validation.temperature.isValid ? 'var(--color-zinc-300)' :
                        telemetry.temperature >= 60.0 ? 'var(--color-crimson)' :
                        telemetry.temperature >= 35.0 ? 'var(--color-saffron)' : 'var(--color-coral)',
                      transition: 'width 0.3s ease',
                      borderRadius: '999px',
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Bottom Register Stats & Trend */}
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '10px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)' }}>
                Range: <strong>{stats.temperature.min}°C</strong> – <strong>{stats.temperature.max}°C</strong>
              </div>
              {renderTrend(trends.temperature, '°C')}
            </div>
          </Card>

          {/* Large Card 5: Ambient Humidity (%) */}
          <Card 
            className="accent-cobalt"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              minHeight: '260px',
              borderTop: '4px solid var(--color-cobalt)',
              boxShadow: 'var(--shadow-subtle-2)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      RELATIVE HUMIDITY
                    </span>
                    <PillTag variant={telemetry.humidity !== null ? 'green' : 'gray'}>
                      {telemetry.humidity !== null ? 'DHT11' : 'NO DATA'}
                    </PillTag>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-zinc-400)', display: 'block', marginTop: '2px' }}>
                    Enclosure Relative Humidity
                  </span>
                </div>

                <div 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--color-cobalt-wash)', 
                    color: 'var(--color-cobalt)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <Radio size={20} />
                </div>
              </div>

              {/* Large Metric Display */}
              <div style={{ margin: '14px 0 8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span 
                    className="font-mono" 
                    style={{ 
                      fontSize: '36px', 
                      fontWeight: 800, 
                      color: telemetry.humidity !== null ? 'var(--color-zinc-900)' : 'var(--color-zinc-400)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {telemetry.humidity !== null && telemetry.humidity !== undefined ? telemetry.humidity.toFixed(1) : '--'}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-zinc-500)' }}>%</span>
                </div>
              </div>

              {/* Visual Progress Bar (0% to 100% RH) */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginBottom: '4px' }}>
                  <span>0% Dry</span>
                  <span>Optimal: 40-60%</span>
                  <span>100% Condensing</span>
                </div>
                <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--color-zinc-100)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: telemetry.humidity !== null ? `${Math.min(100, Math.max(0, telemetry.humidity))}%` : '0%',
                      backgroundColor: telemetry.humidity > 75 ? 'var(--color-coral)' : 'var(--color-cobalt)',
                      transition: 'width 0.3s ease',
                      borderRadius: '999px',
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Bottom Register Stats & Trend */}
            <div style={{ borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '10px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)' }}>
                Target: <strong>&lt; 65% RH Non-Condensing</strong>
              </div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-sprout)', fontWeight: 600 }}>
                NORMAL
              </span>
            </div>
          </Card>
        </div>
      </section>


      {/* ========================================================
          2. MIN, MAX, AND AVERAGE VALUES STRIP (SELECTED PERIOD)
          Dynamically calculated via calculateStatistics(filteredHistory)
          ======================================================== */}
      <section>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eyebrow color="violet">CAN TELEMETRY AGGREGATION</Eyebrow>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-zinc-800)' }}>
                Statistical Min / Max / Avg Bounds for Selected Window
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)', backgroundColor: 'var(--color-zinc-100)', padding: '3px 8px', borderRadius: '4px' }}>
              SAMPLES ANALYZED: <strong>{stats.totalSamples} PACKETS</strong> ({timeRange.toUpperCase()} WINDOW)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            
            {/* Voltage Aggregate */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Zap size={14} color="var(--color-cobalt)" />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--color-zinc-600)', textTransform: 'uppercase' }}>
                  Voltage Summary
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--color-zinc-700)' }}>
                <div>Min: <strong style={{ color: 'var(--color-zinc-900)' }}>{stats.voltage.min} V</strong></div>
                <div>Max: <strong style={{ color: 'var(--color-zinc-900)' }}>{stats.voltage.max} V</strong></div>
                <div>Avg: <strong style={{ color: 'var(--color-cobalt)' }}>{stats.voltage.avg} V</strong></div>
              </div>
            </div>

            {/* Current Aggregate */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Activity size={14} color="var(--color-sprout)" />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--color-zinc-600)', textTransform: 'uppercase' }}>
                  Current Summary
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--color-zinc-700)' }}>
                <div>Min: <strong style={{ color: 'var(--color-zinc-900)' }}>{stats.current.min} A</strong></div>
                <div>Max: <strong style={{ color: 'var(--color-zinc-900)' }}>{stats.current.max} A</strong></div>
                <div>Avg: <strong style={{ color: 'var(--color-sprout)' }}>{stats.current.avg} A</strong></div>
              </div>
            </div>

            {/* Power Aggregate */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Battery size={14} color="var(--color-iris)" />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--color-zinc-600)', textTransform: 'uppercase' }}>
                  Power Summary
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--color-zinc-700)' }}>
                <div>Min: <strong style={{ color: 'var(--color-zinc-900)' }}>{stats.power.min} W</strong></div>
                <div>Max: <strong style={{ color: 'var(--color-zinc-900)' }}>{stats.power.max} W</strong></div>
                <div>Avg: <strong style={{ color: 'var(--color-iris)' }}>{stats.power.avg} W</strong></div>
              </div>
            </div>

            {/* Temperature Aggregate */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--color-zinc-50)', border: '1px solid var(--color-zinc-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Thermometer size={14} color="var(--color-coral)" />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--color-zinc-600)', textTransform: 'uppercase' }}>
                  Ambient Temp Summary
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--color-zinc-700)' }}>
                <div>Min: <strong style={{ color: 'var(--color-zinc-900)' }}>{stats.temperature.min} °C</strong></div>
                <div>Max: <strong style={{ color: 'var(--color-zinc-900)' }}>{stats.temperature.max} °C</strong></div>
                <div>Avg: <strong style={{ color: 'var(--color-coral)' }}>{stats.temperature.avg} °C</strong></div>
              </div>
            </div>

          </div>
        </Card>
      </section>

      {/* ========================================================
          3. HISTORICAL CHARTS WITH TIME-RANGE FILTERS
          Voltage, Current, Power, Ambient Temperature
          ======================================================== */}
      <section>
        <Card>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <Eyebrow color="blue">CALIBRATED OSCILLOSCOPE & CAN TRENDS</Eyebrow>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
                Time-Domain CAN Telemetry Waveforms
              </h3>
            </div>

            {/* Selectable Time Ranges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', textTransform: 'uppercase' }}>
                WINDOW:
              </span>
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '2px', 
                  backgroundColor: 'var(--color-zinc-100)', 
                  padding: '3px', 
                  borderRadius: 'var(--radius-buttons)',
                  border: '1px solid var(--color-zinc-200)',
                }}
              >
                {['1m', '10m', '1h', '24h', 'all'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimeRange(r)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-dm-mono)',
                      fontWeight: timeRange === r ? 600 : 400,
                      borderRadius: '6px',
                      backgroundColor: timeRange === r ? 'var(--color-white)' : 'transparent',
                      color: timeRange === r ? 'var(--color-zinc-900)' : 'var(--color-zinc-500)',
                      boxShadow: timeRange === r ? 'var(--shadow-subtle-2)' : 'none',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '6px', 
              borderBottom: '1px solid var(--silver-200)',
              paddingBottom: '12px',
              marginBottom: '16px',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'voltage', label: 'Voltage (V)', color: 'var(--cobalt)' },
              { id: 'current', label: 'Current (A)', color: 'var(--sprout)' },
              { id: 'power', label: 'Power (W)', color: 'var(--iris)' },
              { id: 'temperature', label: 'Ambient Temp (°C)', color: 'var(--coral)' },
              { id: 'combined', label: 'Multi-Sensor Overlay', color: 'var(--charcoal)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChartTab(tab.id)}
                className={`chart-tab-btn ${activeChartTab === tab.id ? 'active' : ''}`}
              >
                <span 
                  style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    backgroundColor: tab.color,
                    display: 'inline-block',
                  }} 
                />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Render Active Chart View */}
          <div style={{ height: '320px', width: '100%', marginTop: '8px' }}>
            {filteredHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {/* 1. Voltage Chart */}
                {activeChartTab === 'voltage' && (
                  <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monVoltGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--cobalt)" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="var(--cobalt)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--silver-200)" />
                    <XAxis dataKey="timestamp" stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" tickLine={false} />
                    <YAxis stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" domain={[9.0, 13.5]} tickLine={false} unit="V" />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value} V`, 'Pack Voltage']} />
                    <Legend />
                    <ReferenceLine y={12.6} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'OVP 12.6V', fill: '#e11d48', fontSize: 10, position: 'top' }} />
                    <ReferenceLine y={10.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'UVP 10.0V', fill: '#f59e0b', fontSize: 10, position: 'bottom' }} />
                    <Area type="monotone" dataKey="voltage" stroke="var(--cobalt)" strokeWidth={2.4} fill="url(#monVoltGrad)" name="Pack Voltage (V)" isAnimationActive={false} />
                  </AreaChart>
                )}

                {/* 2. Current Chart */}
                {activeChartTab === 'current' && (
                  <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monCurrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--sprout)" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="var(--sprout)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--silver-200)" />
                    <XAxis dataKey="timestamp" stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" tickLine={false} />
                    <YAxis stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" domain={[0, 16]} tickLine={false} unit="A" />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value} A`, 'Current Draw']} />
                    <Legend />
                    <ReferenceLine y={15.0} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'OCP 15.0A', fill: '#e11d48', fontSize: 10, position: 'top' }} />
                    <Area type="monotone" dataKey="current" stroke="var(--sprout)" strokeWidth={2.4} fill="url(#monCurrGrad)" name="Current Draw (A)" isAnimationActive={false} />
                  </AreaChart>
                )}

                {/* 3. Power Chart */}
                {activeChartTab === 'power' && (
                  <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monPwrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--iris)" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="var(--iris)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--silver-200)" />
                    <XAxis dataKey="timestamp" stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" tickLine={false} />
                    <YAxis stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" tickLine={false} unit="W" />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value} W`, 'Active Power']} />
                    <Legend />
                    <Area type="monotone" dataKey="power" stroke="var(--iris)" strokeWidth={2.4} fill="url(#monPwrGrad)" name="Active Power (W)" isAnimationActive={false} />
                  </AreaChart>
                )}

                {/* 4. Ambient Temperature Chart */}
                {activeChartTab === 'temperature' && (
                  <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monTmpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--coral)" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="var(--coral)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--silver-200)" />
                    <XAxis dataKey="timestamp" stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" tickLine={false} />
                    <YAxis stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" domain={[20, 65]} tickLine={false} unit="°C" />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value} °C`, 'Ambient Temp']} />
                    <Legend />
                    <ReferenceLine y={60.0} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'OTP 60.0°C', fill: '#e11d48', fontSize: 10, position: 'top' }} />
                    <ReferenceLine y={35.0} stroke="var(--cobalt)" strokeDasharray="3 3" label={{ value: 'Fan On 35.0°C', fill: 'var(--cobalt)', fontSize: 10, position: 'bottom' }} />
                    <Area type="monotone" dataKey="temperature" stroke="var(--coral)" strokeWidth={2.4} fill="url(#monTmpGrad)" name="Ambient Temperature (°C)" isAnimationActive={false} />
                  </AreaChart>
                )}

                {/* 5. Combined Overlay Chart */}
                {activeChartTab === 'combined' && (
                  <LineChart data={filteredHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--silver-200)" />
                    <XAxis dataKey="timestamp" stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" tickLine={false} />
                    <YAxis stroke="var(--silver-400)" fontSize={11} fontFamily="var(--font-dm-mono)" tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="voltage" stroke="var(--cobalt)" strokeWidth={2} dot={false} name="Voltage (V)" isAnimationActive={false} />
                    <Line type="monotone" dataKey="current" stroke="var(--sprout)" strokeWidth={2} dot={false} name="Current (A)" isAnimationActive={false} />
                    <Line type="monotone" dataKey="temperature" stroke="var(--coral)" strokeWidth={2} dot={false} name="Temp (°C)" isAnimationActive={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-zinc-400)', fontFamily: 'var(--font-dm-mono)', fontSize: '13px' }}>
                No telemetry data available for this selected window.
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* ========================================================
          4. SENSOR BUS HEALTH & ACTUATOR CONTROL REGISTER
          ======================================================== */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <Eyebrow color="orange">BUS INTERFACES & ACTUATORS</Eyebrow>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
              Hardware Bus Registers & Actuator Interlocks
            </h3>
          </div>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
            GPIO PINOUT ASSIGNMENTS VERIFIED
          </span>
        </div>

        <div className="grid-responsive-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Channel 1: INA219 I2C Bus */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)' }}>
                I²C BUS ADDR 0x40
              </span>
              <PillTag variant={validation.voltage.isValid ? 'green' : 'red'}>
                {validation.voltage.isValid ? 'ACK ACTIVE' : 'NO ACK'}
              </PillTag>
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-zinc-900)', marginBottom: '4px' }}>
              INA219 Power Monitor
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--color-zinc-500)', lineHeight: 1.4, marginBottom: '12px' }}>
              Measures bus voltage and shunt current. SDA on NodeMCU D5 (GPIO14), SCL on D6 (GPIO12). Shared I²C bus with 0.96" SSD1306 OLED.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontFamily: 'var(--font-dm-mono)', borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--color-zinc-500)' }}>Bus Health:</span>
              <span style={{ color: 'var(--color-sprout)', fontWeight: 600 }}>100 kHz Standard</span>
            </div>
          </Card>

          {/* Channel 2: DHT11 1-Wire Digital */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)' }}>
                1-WIRE GPIO13 (D7)
              </span>
              <PillTag variant={validation.temperature.isValid ? 'green' : 'red'}>
                {validation.temperature.isValid ? 'PULLED UP' : 'TIMEOUT'}
              </PillTag>
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-zinc-900)', marginBottom: '4px' }}>
              DHT11 Ambient Enclosure Sensor
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--color-zinc-500)', lineHeight: 1.4, marginBottom: '12px' }}>
              Measures ambient air temperature and relative humidity inside casing. 1-wire digital stream on Pin D7. Sampling rate 1000ms.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontFamily: 'var(--font-dm-mono)', borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--color-zinc-500)' }}>Fan Setpoint:</span>
              <span style={{ color: 'var(--color-cobalt)', fontWeight: 600 }}>Auto-Trigger &gt; 35.0°C</span>
            </div>
          </Card>

          {/* Channel 3: L298N & Fan Actuator */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-500)' }}>
                L298N DUAL H-BRIDGE
              </span>
              <PillTag variant={telemetry.fanStatus === 'ON' ? 'green' : 'gray'}>
                {telemetry.fanStatus === 'ON' ? '12V PWM ON' : 'STANDBY'}
              </PillTag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Fan 
                  size={18} 
                  className={telemetry.fanStatus === 'ON' ? 'fan-active-spin' : ''} 
                  style={{ 
                    color: telemetry.fanStatus === 'ON' ? 'var(--color-sprout)' : 'var(--color-zinc-400)',
                    transition: 'color 0.3s ease'
                  }} 
                />
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-zinc-900)', margin: 0 }}>
                  Cooling Fan Channel A
                </h4>
              </div>
              <button
                type="button"
                onClick={() => toggleFan()}
                style={{
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-dm-mono)',
                  color: telemetry.fanStatus === 'ON' ? 'var(--color-coral)' : 'var(--color-sprout)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: telemetry.fanStatus === 'ON' ? 'var(--color-coral-wash)' : 'var(--color-sprout-wash)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${telemetry.fanStatus === 'ON' ? 'rgba(219, 84, 52, 0.3)' : 'rgba(27, 177, 82, 0.3)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                {telemetry.fanStatus === 'ON' ? 'Force Stop Fan' : 'Trigger Cooling'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-zinc-500)', lineHeight: 1.4, marginBottom: '12px' }}>
              12V brushless CPU fan driven by opto-isolated dual H-bridge motor driver module. Pins D1 (GPIO5), D2 (GPIO4) to IN3/IN4.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontFamily: 'var(--font-dm-mono)', borderTop: '1px dashed var(--color-zinc-200)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--color-zinc-500)' }}>Physical Protection:</span>
              <span style={{ color: 'var(--color-sprout)', fontWeight: 600 }}>Active on ESP8266</span>
            </div>
          </Card>

        </div>
      </section>

      {/* ========================================================
          5. RECENT-READINGS TABLE (TABULAR TELEMETRY LOG)
          Comprehensive log showing recent packets
          ======================================================== */}
      <section>
        <Card>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <Eyebrow color="green">CAN TELEMETRY FRAME ARCHIVE</Eyebrow>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
                Recent CAN Bus Telemetry Readings Table
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Table Search Input */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--color-zinc-400)' }} />
                <input
                  type="text"
                  placeholder="Filter timestamp..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 30px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-zinc-200)',
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '12px',
                    width: '180px',
                    backgroundColor: 'var(--color-zinc-50)',
                  }}
                />
              </div>

              {/* Table Limit Selector */}
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '2px', 
                  backgroundColor: 'var(--color-zinc-100)', 
                  padding: '2px', 
                  borderRadius: 'var(--radius-buttons)',
                  border: '1px solid var(--color-zinc-200)',
                }}
              >
                {[10, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTableLimit(num)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-dm-mono)',
                      fontWeight: tableLimit === num ? 600 : 400,
                      borderRadius: '4px',
                      backgroundColor: tableLimit === num ? 'var(--color-white)' : 'transparent',
                      color: tableLimit === num ? 'var(--color-zinc-900)' : 'var(--color-zinc-500)',
                      boxShadow: tableLimit === num ? 'var(--shadow-subtle-2)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {num} rows
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--color-zinc-200)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-dm-mono)', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-zinc-100)', borderBottom: '1px solid var(--color-zinc-200)', color: 'var(--color-zinc-600)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>CAN FRAME TIME</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>VOLTAGE (V)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>CURRENT (A)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>POWER (W)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>AMBIENT TEMP (°C)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>FAN STATE</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>BUZZER</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>SENSOR INTEGRITY</th>
                </tr>
              </thead>
              <tbody>
                {recentTableData.length > 0 ? (
                  recentTableData.map((row, idx) => {
                    const isVoltValid = row.voltage !== null && typeof row.voltage === 'number' && row.voltage >= 8.5 && row.voltage <= 14.5;
                    const isCurrValid = row.current !== null && typeof row.current === 'number';
                    const isTempValid = row.temperature !== null && typeof row.temperature === 'number' && row.temperature < 60;
                    const isAllValid = isVoltValid && isCurrValid && isTempValid;

                    return (
                      <tr 
                        key={row.rawTimestamp || idx} 
                        style={{ 
                          borderBottom: '1px solid var(--color-zinc-100)',
                          backgroundColor: idx % 2 === 0 ? 'var(--color-white)' : 'var(--color-zinc-50)',
                        }}
                      >
                        <td style={{ padding: '9px 14px', color: 'var(--color-zinc-800)', fontWeight: 500 }}>
                          {row.timestamp || '--:--:--'}
                        </td>
                        <td style={{ padding: '9px 14px', color: 'var(--color-cobalt)', fontWeight: 600 }}>
                          {row.voltage !== null && row.voltage !== undefined ? `${row.voltage.toFixed(2)} V` : '--'}
                        </td>
                        <td style={{ padding: '9px 14px', color: 'var(--color-sprout)', fontWeight: 600 }}>
                          {row.current !== null && row.current !== undefined ? `${row.current.toFixed(2)} A` : '--'}
                        </td>
                        <td style={{ padding: '9px 14px', color: 'var(--color-iris)', fontWeight: 600 }}>
                          {row.power !== null && row.power !== undefined ? `${row.power.toFixed(1)} W` : '--'}
                        </td>
                        <td style={{ padding: '9px 14px', color: 'var(--color-coral)', fontWeight: 600 }}>
                          {row.temperature !== null && row.temperature !== undefined ? `${row.temperature.toFixed(1)} °C` : '--'}
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <span 
                            style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '10.5px', 
                              backgroundColor: row.fanStatus === 'ON' ? 'var(--color-sprout-wash)' : 'var(--color-zinc-100)', 
                              color: row.fanStatus === 'ON' ? 'var(--color-sprout)' : 'var(--color-zinc-500)',
                              fontWeight: 600,
                            }}
                          >
                            {row.fanStatus || 'OFF'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <span 
                            style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '10.5px', 
                              backgroundColor: row.buzzerStatus === 'ON' ? 'var(--color-crimson-wash)' : 'var(--color-zinc-100)', 
                              color: row.buzzerStatus === 'ON' ? 'var(--color-crimson)' : 'var(--color-zinc-500)',
                              fontWeight: 600,
                            }}
                          >
                            {row.buzzerStatus || 'OFF'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <PillTag variant={isAllValid ? 'green' : 'orange'}>
                            {isAllValid ? 'VALID' : 'CHECK SENSOR'}
                          </PillTag>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-zinc-400)' }}>
                      No matching telemetry packets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
            <span>Showing top {recentTableData.length} records of {filteredHistory.length} total points</span>
            <span>CSV and JSON exports include complete un-truncated time series</span>
          </div>
        </Card>
      </section>

    </div>
  );
}
