import React from 'react';
import { Zap, Shield, Cpu, ExternalLink, Code } from 'lucide-react';

export function Footer({ setActiveTab }) {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-zinc-100)',
        borderTop: '1px solid var(--color-zinc-200)',
        padding: '36px 28px 24px',
        color: 'var(--color-zinc-500)',
        fontSize: '13px',
        marginTop: '48px',
      }}
    >
      <div style={{ maxWidth: 'var(--page-max-width)', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--color-zinc-200)',
          }}
        >
          {/* Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-iris)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(106, 94, 217, 0.3)',
              }}
            >
              <Zap size={16} fill="#ffffff" />
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--color-zinc-900)', fontFamily: 'var(--font-inter-variable)', fontSize: '14.5px' }}>
                Smart BMS Platform (CAN Bus)
              </span>
              <span 
                style={{ 
                  marginLeft: '8px',
                  fontFamily: 'var(--font-dm-mono)', 
                  fontSize: '10.5px', 
                  color: 'var(--color-cobalt)', 
                  backgroundColor: 'var(--color-cobalt-wash)', 
                  padding: '2px 7px', 
                  borderRadius: '4px', 
                  border: '1px solid rgba(63, 113, 212, 0.25)',
                }}
              >
                AI-DRIVEN CAN BUS BMS
              </span>
            </div>
          </div>

          {/* Quick Page Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13.5px' }}>
            <button type="button" onClick={() => setActiveTab('home')} style={linkBtnStyle}>Home</button>
            <button type="button" onClick={() => setActiveTab('monitoring')} style={linkBtnStyle}>Live Monitoring</button>
            <button type="button" onClick={() => setActiveTab('health')} style={linkBtnStyle}>Health & AI</button>
            <button type="button" onClick={() => setActiveTab('alerts')} style={linkBtnStyle}>Alerts</button>
            <button type="button" onClick={() => setActiveTab('reports')} style={linkBtnStyle}>Reports</button>
            <button type="button" onClick={() => setActiveTab('device')} style={linkBtnStyle}>Device & Hardware</button>
          </div>
        </div>

        {/* Bottom meta row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            fontSize: '12px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)', letterSpacing: '0.04em' }}>
            © {new Date().getFullYear()} UNIVERSITY ENGINEERING PROJECT · AI-DRIVEN SMART BATTERY MANAGEMENT SYSTEM USING CAN BUS
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-zinc-500)' }}>
              <Cpu size={13} color="var(--color-cobalt)" /> Two-Node CAN Transceiver Interface
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-zinc-500)' }}>
              <Shield size={13} color="var(--color-sprout)" /> 4-Stage Safety Interlock
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-zinc-500)' }}>
              <Code size={13} color="var(--color-iris)" /> Tuple UI Architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-zinc-600)',
  cursor: 'pointer',
  padding: 0,
  fontSize: '13px',
  fontFamily: 'var(--font-inter-variable)',
  fontWeight: 500,
  transition: 'color 0.16s ease',
};
