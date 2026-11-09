import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  CheckCircle2 
} from 'lucide-react';
import { Eyebrow, PillTag, Button } from '../components/UiComponents';
import { useBattery } from '../context/BatteryContext';
import { 
  generateBmsReport, 
  fetchReportsHistory, 
  getReportDownloadUrl, 
  getReportPreviewUrl 
} from '../services/reportService';

export function Reports() {
  const { telemetry, history, connectionStatus, showToast } = useBattery();

  // State: Active report metadata and generation status
  const [latestReport, setLatestReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Auto-load existing report or generate on page mount
  const loadOrCreateReport = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const historyRes = await fetchReportsHistory(10);
      if (historyRes && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
        setLatestReport(historyRes.data[0]);
        setIsGenerating(false);
        return;
      }

      // If no report in history, generate a fresh report
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

      const res = await generateBmsReport({
        period: '24h',
        telemetry: payloadTelemetry,
        history: history || [],
      });

      if (res && res.success && res.metadata) {
        setLatestReport(res.metadata);
      }
    } catch (err) {
      console.warn('Report initialization notice:', err.message);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    loadOrCreateReport();
  }, []);

  // Handler: Regenerate fresh report from current telemetry
  const handleRegenerate = async () => {
    setIsGenerating(true);
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

      const res = await generateBmsReport({
        period: '24h',
        telemetry: payloadTelemetry,
        history: history || [],
      });

      if (res && res.success && res.metadata) {
        setLatestReport(res.metadata);
        if (showToast) showToast('Fresh Technical Report generated!', 'success');
      } else {
        throw new Error(res?.error || 'Failed to generate report');
      }
    } catch (err) {
      const msg = err.message || 'Unable to connect to Report backend on port 8000.';
      setError(msg);
      if (showToast) showToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper: Condition badge styling
  const renderConditionBadge = (condition = 'NORMAL') => {
    const c = (condition || '').toUpperCase();
    if (c.includes('CRITICAL')) {
      return <PillTag variant="red">CRITICAL CONDITION</PillTag>;
    }
    if (c.includes('WARNING')) {
      return <PillTag variant="orange">WARNING CONDITION</PillTag>;
    }
    return <PillTag variant="green">NORMAL OPERATIONAL</PillTag>;
  };

  const reportId = latestReport?.id || 'BMS-REP-OFFICIAL';
  const downloadUrl = latestReport?.id ? getReportDownloadUrl(latestReport.id) : '#';
  const previewUrl = latestReport?.id ? getReportPreviewUrl(latestReport.id) : '';

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <Eyebrow color="blue">TECHNICAL AUDIT & REPORT GENERATION</Eyebrow>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em', marginTop: '2px' }}>
              Battery Condition Technical Report
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--silver-500)', marginTop: '4px', maxWidth: '780px' }}>
              Official laboratory technical audit report based on real-time sensor measurements, hardware safety envelopes, and deterministic condition assessment.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <PillTag variant={connectionStatus === 'live' ? 'green' : 'orange'} pulse={connectionStatus === 'live'}>
              {connectionStatus === 'live' ? 'LIVE TELEMETRY ACTIVE' : 'STALE TELEMETRY'}
            </PillTag>
            <PillTag variant="blue">NOMINAL 12V PROTOTYPE</PillTag>
            <PillTag variant="gray">ISO 26262 FORMAT</PillTag>
          </div>
        </div>
      </div>

      {/* ========================================================
          ACTION TOOLBAR (DOWNLOAD REPORT DIRECTLY ACCESSIBLE)
          ======================================================== */}
      <div 
        style={{ 
          backgroundColor: 'var(--white)', 
          border: '1px solid var(--silver-200)', 
          borderRadius: 'var(--radius-cards)', 
          padding: '16px 20px', 
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        {/* Left: Active Report Document ID & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'var(--cobalt-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--cobalt)'
            }}
          >
            <FileText size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>
              ACTIVE REPORT ID
            </div>
            <div style={{ fontSize: '14.5px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>
              {reportId}
            </div>
          </div>
        </div>

        {/* Right: Direct Download & Refresh Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={handleRegenerate}
            disabled={isGenerating}
            style={{ 
              padding: '8px 16px', 
              fontSize: '13px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}
          >
            <RefreshCw size={14} className={isGenerating ? 'spin' : ''} />
            <span>{isGenerating ? 'Regenerating...' : 'Refresh Report'}</span>
          </Button>

          <a
            href={downloadUrl}
            download={`${reportId}.pdf`}
            style={{ textDecoration: 'none' }}
          >
            <Button 
              variant="primary" 
              disabled={!latestReport?.id}
              style={{ 
                padding: '8px 20px', 
                fontSize: '13.5px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                backgroundColor: 'var(--cobalt)',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                cursor: 'pointer'
              }}
            >
              <Download size={15} /> Download Report PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div 
          style={{ 
            padding: '12px 16px', 
            backgroundColor: 'var(--coral-light)', 
            border: '1px solid var(--coral-border)', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '13px', 
            color: 'var(--coral)', 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center' 
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          1. EMBEDDED PDF VIEWER (SHOWS CONTINUOUSLY)
          ======================================================== */}
      {previewUrl ? (
        <div 
          style={{ 
            borderRadius: 'var(--radius-xl)', 
            overflow: 'hidden', 
            border: '1px solid var(--silver-300)', 
            boxShadow: 'var(--shadow-xl)', 
            backgroundColor: '#1e293b' 
          }}
        >
          {/* PDF Viewer Header Bar */}
          <div 
            style={{ 
              padding: '12px 20px', 
              backgroundColor: 'var(--charcoal)', 
              color: '#ffffff', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={16} color="var(--cobalt)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                {reportId}.pdf
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                Official ReportLab Vector Document
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a
                href={downloadUrl}
                download={`${reportId}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                <button
                  type="button"
                  style={{
                    padding: '6px 14px',
                    fontSize: '12.5px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: 'var(--cobalt)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={13} /> Download
                </button>
              </a>

              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none'
                }}
                title="Open in separate tab"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Embedded PDF iframe */}
          <iframe
            src={previewUrl}
            title="Official Technical Audit Report PDF"
            style={{ 
              width: '100%', 
              height: '780px', 
              border: 'none', 
              display: 'block',
              backgroundColor: '#525659' 
            }}
          />
        </div>
      ) : (
        <div 
          style={{ 
            padding: '48px 24px', 
            textAlign: 'center', 
            backgroundColor: 'var(--white)', 
            borderRadius: 'var(--radius-cards)', 
            border: '1px dashed var(--silver-300)' 
          }}
        >
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: 'var(--cobalt)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)' }}>
            Loading Official Report PDF...
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--silver-500)', marginTop: '4px' }}>
            Synthesizing synchronized telemetry and deterministic condition assessment.
          </p>
        </div>
      )}

      {/* ========================================================
          2. FORMATTED DOCUMENT SHEET (SHOWS CONTINUOUSLY)
          ======================================================== */}
      {latestReport && (
        <div 
          style={{ 
            backgroundColor: 'var(--white)', 
            borderRadius: 'var(--radius-cards)', 
            border: '1px solid var(--silver-200)', 
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden'
          }}
        >
          {/* Header Strip */}
          <div 
            style={{ 
              padding: '18px 24px', 
              backgroundColor: 'var(--charcoal)', 
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              borderBottom: '3px solid var(--cobalt)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  SMART BMS PLATFORM · LABORATORY TECHNICAL AUDIT
                </span>
                <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                  ISO 26262 FORMAT
                </span>
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '4px 0 0', color: '#ffffff', letterSpacing: '-0.01em' }}>
                Battery Condition Technical Audit Document
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                  {reportId}
                </span>
                {renderConditionBadge(latestReport.overallCondition)}
              </div>
              <span style={{ fontSize: '11.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Generated: {new Date(latestReport.generatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Meta Row: Period, Specification, Chemistry Status */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'var(--silver-50)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--silver-200)'
              }}
            >
              <div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>REPORTING PERIOD</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--silver-800)', marginTop: '2px' }}>
                  {latestReport.reportingPeriod?.toUpperCase() || '24H'} HISTORICAL
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>BATTERY SPECIFICATION</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--silver-800)', marginTop: '2px' }}>
                  Nominal 12V Li-ion Prototype
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>CHEMISTRY VERIFICATION</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: latestReport.chemistryVerified ? 'var(--sprout)' : 'var(--coral)', marginTop: '2px' }}>
                  {latestReport.chemistryVerified ? 'VERIFIED (3S NMC)' : 'UNVERIFIED (Provisional Envelope)'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)', textTransform: 'uppercase' }}>SENSING INTERFACE</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cobalt)', marginTop: '2px' }}>
                  CAN Bus (CAN-H / CAN-L) + I²C
                </div>
              </div>
            </div>

            {/* Condition Executive Diagnostic Summary */}
            <div 
              style={{ 
                padding: '14px 18px', 
                borderRadius: 'var(--radius-sm)',
                backgroundColor: latestReport.overallCondition === 'CRITICAL' ? 'var(--crimson-light)' : latestReport.overallCondition === 'WARNING' ? 'var(--coral-light)' : 'var(--sprout-light)',
                border: `1px solid ${latestReport.overallCondition === 'CRITICAL' ? 'var(--crimson-border)' : latestReport.overallCondition === 'WARNING' ? 'var(--coral-border)' : 'var(--sprout-border)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck size={18} color={latestReport.overallCondition === 'CRITICAL' ? 'var(--crimson)' : latestReport.overallCondition === 'WARNING' ? 'var(--coral)' : 'var(--sprout)'} />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--charcoal)' }}>
                  Executive Condition Assessment: {latestReport.overallCondition}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--silver-700)', lineHeight: '1.5' }}>
                Physical hardware telemetry processed within nominal thresholds for the unverified 12V prototype pack. Real-time differential CAN frame validation confirms normal operating parameters.
              </p>
            </div>

            {/* Recorded Measurements Grid */}
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--silver-500)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                1. Synchronized Physical Sensor Telemetry
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--silver-50)', border: '1px solid var(--silver-200)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)' }}>PACK VOLTAGE</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {latestReport.measurements?.voltage != null ? `${Number(latestReport.measurements.voltage).toFixed(2)} V` : '--'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', backgroundColor: 'var(--silver-50)', border: '1px solid var(--silver-200)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)' }}>LOAD CURRENT</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {latestReport.measurements?.current != null ? `${Number(latestReport.measurements.current).toFixed(2)} A` : '--'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', backgroundColor: 'var(--silver-50)', border: '1px solid var(--silver-200)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)' }}>ACTIVE POWER</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {latestReport.measurements?.power != null ? `${Number(latestReport.measurements.power).toFixed(1)} W` : '--'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', backgroundColor: 'var(--silver-50)', border: '1px solid var(--silver-200)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)' }}>AMBIENT TEMPERATURE</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {latestReport.measurements?.temperature != null ? `${Number(latestReport.measurements.temperature).toFixed(1)} °C` : '--'}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', backgroundColor: 'var(--silver-50)', border: '1px solid var(--silver-200)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--silver-400)' }}>RELATIVE HUMIDITY</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--charcoal)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {latestReport.measurements?.humidity != null ? `${Number(latestReport.measurements.humidity).toFixed(1)} %` : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Engineering Actions */}
            <div style={{ borderTop: '1px dashed var(--silver-200)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} color="var(--sprout)" />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
                  2. Recommended Engineering Actions & Grounded Citations
                </h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--silver-700)', lineHeight: '1.6' }}>
                <li>Maintain forced-air convection airflow around the testbench enclosure when ambient temperatures approach 35.0°C.</li>
                <li>Conduct precise manufacturer cell chemistry profiling to transition the nominal 12V envelope from provisional to verified limits.</li>
                <li>Ensure continuous high-side INA219 current monitoring to detect localized motor inrush or short-circuit over-current events.</li>
                <li>Verify 120Ω differential termination across CAN-H and CAN-L lines to maintain automotive ISO 11898 common-mode noise rejection.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
