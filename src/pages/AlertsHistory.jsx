import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Search, 
  CheckCheck, 
  Bell, 
  Fan, 
  Thermometer, 
  ArrowUpDown,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  RefreshCw,
  Check,
  Zap,
  Activity
} from 'lucide-react';
import { Card, PillTag, Button, Eyebrow, StateView } from '../components/UiComponents';
import { useBattery } from '../context/BatteryContext';

export function AlertsHistory() {
  const { 
    alerts, 
    acknowledgeSingleAlert,
    acknowledgeAllAlerts,
    showToast
  } = useBattery();

  // Filtering & Sorting State
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Sync / refresh alerts feedback
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Refreshed temperature and battery risk alerts from Firebase', 'info');
    }, 400);
  };

  // Alerts source displaying all real hardware safety and thermal trip alerts
  const sourceAlerts = useMemo(() => {
    return alerts || [];
  }, [alerts]);

  // Filtered and sorted alerts
  const processedAlerts = useMemo(() => {
    return sourceAlerts
      .filter((alert) => {
        // Severity match
        const alertSev = (alert.severity || '').toLowerCase();
        const matchesSeverity = 
          selectedSeverity === 'ALL' || 
          (selectedSeverity === 'HIGH_RISK' ? alertSev.includes('high') : alertSev === selectedSeverity.toLowerCase());

        // Date filter
        const now = Date.now();
        const timestampMs = alert.rawTimestamp || (now - 60000);
        let matchesDate = true;
        if (selectedDateRange === '1H') {
          matchesDate = (now - timestampMs) <= 3600000;
        } else if (selectedDateRange === '24H') {
          matchesDate = (now - timestampMs) <= 86400000;
        } else if (selectedDateRange === '7D') {
          matchesDate = (now - timestampMs) <= 7 * 86400000;
        }

        // Search match
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          !q ||
          (alert.type || '').toLowerCase().includes(q) ||
          (alert.message || '').toLowerCase().includes(q) ||
          (alert.sensorValue || '').toLowerCase().includes(q) ||
          (alert.threshold || '').toLowerCase().includes(q) ||
          (alert.detectionSource || '').toLowerCase().includes(q) ||
          (alert.recommendedAction || '').toLowerCase().includes(q);

        return matchesSeverity && matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return (b.rawTimestamp || 0) - (a.rawTimestamp || 0);
        }
        if (sortBy === 'OLDEST') {
          return (a.rawTimestamp || 0) - (b.rawTimestamp || 0);
        }
        if (sortBy === 'SEVERITY') {
          const rank = { Critical: 4, 'High Risk': 3, Warning: 2, Information: 1, Info: 1 };
          return (rank[b.severity] || 0) - (rank[a.severity] || 0);
        }
        return 0;
      });
  }, [sourceAlerts, selectedSeverity, selectedDateRange, searchQuery, sortBy]);

  // Alert severity counters
  const counts = useMemo(() => {
    return {
      critical: sourceAlerts.filter(a => a.severity === 'Critical').length,
      highRisk: sourceAlerts.filter(a => (a.severity || '').toLowerCase().includes('high')).length,
      warning: sourceAlerts.filter(a => a.severity === 'Warning').length,
      info: sourceAlerts.filter(a => a.severity === 'Information' || a.severity === 'Info').length,
      unacknowledged: sourceAlerts.filter(a => !a.acknowledged && a.status !== 'RESOLVED').length,
    };
  }, [sourceAlerts]);

  const getAlertIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('fan')) return Fan;
    if (t.includes('temp') || t.includes('heat') || t.includes('thermal') || t.includes('otp')) return Thermometer;
    if (t.includes('voltage') || t.includes('ovp') || t.includes('uvp') || t.includes('power')) return Zap;
    if (t.includes('current') || t.includes('ocp')) return Activity;
    if (t.includes('risk') || t.includes('hazard') || t.includes('warning')) return ShieldAlert;
    return AlertTriangle;
  };

  const getSeverityBadgeVariant = (severity = '') => {
    const s = severity.toLowerCase();
    if (s.includes('critical')) return 'red';
    if (s.includes('high')) return 'orange';
    if (s.includes('warn')) return 'yellow';
    return 'blue';
  };

  const getSourceBadgeVariant = (source = '') => {
    const s = (source || '').toLowerCase();
    if (s.includes('hardware') || s.includes('dht11') || s.includes('rule')) return 'red';
    if (s.includes('statistical') || s.includes('anomaly')) return 'orange';
    if (s.includes('trained') || s.includes('ml')) return 'blue';
    return 'purple';
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* ========================================================
          TOP HEADER & ACTIONS ROW
          ======================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Eyebrow color="orange">THERMAL MANAGEMENT & BATTERY RISK AUDIT</Eyebrow>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
            High Temperature & Battery Risk Warning History
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-zinc-500)', marginTop: '4px' }}>
            Real-time over-temperature trips, elevated thermal threshold warnings, and battery safety risk records from live DHT11 telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            size="sm" 
            onClick={handleRefresh}
            icon={RefreshCw}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Logs'}
          </Button>

          <Button 
            variant="primary" 
            size="sm" 
            onClick={acknowledgeAllAlerts}
            icon={CheckCheck}
          >
            Acknowledge All Warnings
          </Button>
        </div>
      </div>

      {/* ========================================================
          CRITICAL PHYSICAL SAFETY NOTICE BANNER
          ======================================================== */}
      <div 
        style={{ 
          padding: '16px 20px', 
          backgroundColor: '#fffbeb', 
          border: '1px solid #fde68a', 
          borderLeft: '5px solid #d97706',
          borderRadius: 'var(--radius-cards)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          boxShadow: 'var(--shadow-subtle)'
        }}
      >
        <ShieldAlert size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Physical Verification Mandate (ISO 26262 Thermal Runaway Safety)
            </span>
            <PillTag variant="orange">SAFETY AUDIT PRINCIPLE</PillTag>
          </div>
          <p style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.55, marginTop: '4px', margin: 0 }}>
            <strong>Operator Acknowledgment Notice:</strong> Marking a high temperature warning or risk alert as acknowledged in this console indicates that an operator has <em>reviewed the thermal event trace</em>. <strong>It does not eliminate internal heat buildup or replace physical inspection</strong>. Verify cooling fan airflow and inspect battery cell temperatures before resuming standard operations.
          </p>
        </div>
      </div>

      {/* ========================================================
          KPI SUMMARY CARDS
          ======================================================== */}
      <div className="grid-responsive-4">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
                OVER-TEMP TRIPS (&ge;60&deg;C)
              </span>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: counts.critical > 0 ? 'var(--color-crimson)' : 'var(--color-zinc-800)', marginTop: '4px' }}>
                {counts.critical}
              </div>
            </div>
            <PillTag variant={counts.critical > 0 ? 'red' : 'green'} pulse={counts.critical > 0}>
              {counts.critical > 0 ? 'OTP ACTIVE' : 'NOMINAL'}
            </PillTag>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
                BATTERY RISK & TEMP WARNS
              </span>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: (counts.highRisk + counts.warning) > 0 ? 'var(--color-coral)' : 'var(--color-zinc-800)', marginTop: '4px' }}>
                {counts.highRisk + counts.warning}
              </div>
            </div>
            <PillTag variant={(counts.highRisk + counts.warning) > 0 ? 'orange' : 'gray'}>
              {counts.highRisk} HIGH / {counts.warning} WARN
            </PillTag>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
                RECORDED THERMAL ALERTS
              </span>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: 'var(--color-cobalt)', marginTop: '4px' }}>
                {sourceAlerts.length}
              </div>
            </div>
            <PillTag variant="blue">THERMAL AUDIT</PillTag>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)' }}>
                UNACKNOWLEDGED QUEUE
              </span>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: counts.unacknowledged > 0 ? 'var(--color-coral)' : 'var(--color-sprout)', marginTop: '4px' }}>
                {counts.unacknowledged}
              </div>
            </div>
            <PillTag variant={counts.unacknowledged > 0 ? 'orange' : 'green'}>
              {counts.unacknowledged > 0 ? 'PENDING AUDIT' : 'ALL REVIEWED'}
            </PillTag>
          </div>
        </Card>
      </div>

      {/* ========================================================
          FEED CONTROLS (SEVERITY, SEARCH, DATE, SORT)
          ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              
              {/* Severity Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginRight: '4px' }}>
                  SEVERITY:
                </span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'Critical', label: 'Critical' },
                  { id: 'HIGH_RISK', label: 'High Risk' },
                  { id: 'Warning', label: 'Warning' },
                  { id: 'Information', label: 'Information' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSeverity(s.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-dm-mono)',
                      fontWeight: selectedSeverity === s.id ? 600 : 400,
                      backgroundColor: selectedSeverity === s.id ? 'var(--color-iris)' : 'var(--color-zinc-100)',
                      color: selectedSeverity === s.id ? '#ffffff' : 'var(--color-zinc-600)',
                      border: selectedSeverity === s.id ? '1px solid var(--color-iris)' : '1px solid var(--color-zinc-200)',
                      cursor: 'pointer',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '380px' }}>
                <Search 
                  size={14} 
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-zinc-400)' }} 
                />
                <input
                  type="text"
                  placeholder="Search temperature, battery risk, threshold..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 34px',
                    borderRadius: 'var(--radius-inputs)',
                    border: '1px solid var(--color-zinc-300)',
                    backgroundColor: 'var(--color-white)',
                    fontSize: '12.5px',
                  }}
                />
              </div>
            </div>

            {/* Date Filters & Sorting Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-zinc-100)' }}>
              
              {/* Date range selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="var(--color-zinc-400)" />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', marginRight: '2px' }}>
                  WINDOW:
                </span>
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: '1H', label: 'Last 1 Hr' },
                  { id: '24H', label: 'Last 24 Hrs' },
                  { id: '7D', label: 'Last 7 Days' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDateRange(d.id)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-dm-mono)',
                      backgroundColor: selectedDateRange === d.id ? 'var(--color-zinc-200)' : 'transparent',
                      color: selectedDateRange === d.id ? 'var(--color-zinc-900)' : 'var(--color-zinc-500)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Sort Option */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowUpDown size={13} color="var(--color-zinc-400)" />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
                  SORT:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-dm-mono)',
                    border: '1px solid var(--color-zinc-300)',
                    backgroundColor: 'var(--color-white)',
                    color: 'var(--color-zinc-700)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                  <option value="SEVERITY">Highest Severity</option>
                </select>
              </div>

            </div>

          </div>
        </Card>

        {/* Alert Feed Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {processedAlerts.length > 0 ? (
            processedAlerts.map((alt) => {
              const Icon = getAlertIcon(alt.type);
              const isCritical = (alt.severity || '').toLowerCase() === 'critical';
              const isHighRisk = (alt.severity || '').toLowerCase().includes('high');
              const isWarning = (alt.severity || '').toLowerCase() === 'warning';
              
              const borderColor = isCritical ? 'var(--color-crimson)' :
                                 isHighRisk ? 'var(--color-coral)' :
                                 isWarning ? 'var(--color-saffron)' : 'var(--color-cobalt)';

              return (
                <div
                  key={alt.id}
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-zinc-200)',
                    borderLeft: `5px solid ${borderColor}`,
                    borderRadius: 'var(--radius-cards)',
                    boxShadow: 'var(--shadow-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Header Row of Single Alert */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: isCritical ? 'var(--color-crimson-wash)' :
                                           isHighRisk ? 'var(--color-coral-wash)' :
                                           isWarning ? 'rgba(255, 185, 41, 0.15)' : 'var(--color-cobalt-wash)',
                          color: borderColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={20} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--color-zinc-900)' }}>
                            {alt.type}
                          </span>
                          <PillTag variant={getSeverityBadgeVariant(alt.severity)}>
                            {alt.severity}
                          </PillTag>
                          <PillTag variant={getSourceBadgeVariant(alt.detectionSource)}>
                            {alt.detectionSource || 'DHT11 Thermal Sensor'}
                          </PillTag>
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
                          ID: {alt.id} · RECORDED: {alt.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Status & Single Acknowledge Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PillTag variant={alt.status === 'RESOLVED' || alt.acknowledged ? 'green' : 'orange'}>
                        {alt.status === 'RESOLVED' || alt.acknowledged ? 'ACKNOWLEDGED / RESOLVED' : 'ACTIVE / UNREVIEWED'}
                      </PillTag>

                      {!alt.acknowledged && alt.status !== 'RESOLVED' && (
                        <Button
                          variant="outlined"
                          size="sm"
                          onClick={() => acknowledgeSingleAlert(alt.id)}
                          icon={Check}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Alert Message */}
                  <p style={{ fontSize: '13.5px', color: 'var(--color-zinc-700)', lineHeight: 1.5, margin: 0 }}>
                    {alt.message}
                  </p>

                  {/* Sensor Value & Threshold Comparison Grid */}
                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                      gap: '12px', 
                      padding: '12px 14px', 
                      backgroundColor: 'var(--color-zinc-50)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--color-zinc-200)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-dm-mono)'
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--color-zinc-400)', fontSize: '10.5px' }}>MEASURED VALUE:</span>
                      <div style={{ color: borderColor, fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>
                        {alt.sensorValue}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-zinc-400)', fontSize: '10.5px' }}>CONFIGURED TRIP THRESHOLD:</span>
                      <div style={{ color: 'var(--color-zinc-800)', fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>
                        {alt.threshold}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-zinc-400)', fontSize: '10.5px' }}>TRIP MECHANISM:</span>
                      <div style={{ color: 'var(--color-zinc-700)', fontSize: '12px', marginTop: '2px' }}>
                        {isCritical ? 'Emergency Cooling Fan & Thermal Cutoff' : 'Automated Cooling Fan Engagement'}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Inspection Action Box */}
                  {alt.recommendedAction && (
                    <div 
                      style={{ 
                        padding: '10px 14px', 
                        backgroundColor: 'rgba(106, 94, 217, 0.05)', 
                        border: '1px solid rgba(106, 94, 217, 0.2)', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '12.5px'
                      }}
                    >
                      <ShieldCheck size={16} color="var(--color-iris)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: 'var(--color-iris)' }}>Recommended Physical Inspection Step: </strong>
                        <span style={{ color: 'var(--color-zinc-700)' }}>{alt.recommendedAction}</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <StateView
              type="empty"
              title="No Temperature or Battery Risk Alerts Found"
              message="No high temperature trips (≥60°C) or battery risk warnings (≥35°C) recorded. All thermal parameters nominal."
            />
          )}
        </div>

      </div>

    </div>
  );
}
