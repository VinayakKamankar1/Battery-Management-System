import React, { useState } from 'react';
import { 
  Home, 
  Activity, 
  HeartPulse, 
  AlertTriangle, 
  FileText, 
  Cpu, 
  Zap, 
  Clock, 
  RefreshCw, 
  SlidersHorizontal, 
  Bell, 
  Menu, 
  X,
  Wifi
} from 'lucide-react';
import { useBattery } from '../context/BatteryContext';
import { PillTag } from './UiComponents';

export function Navbar({ activeTab, setActiveTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    telemetry, 
    connectionStatus, 
    refreshTelemetry, 
    alerts 
  } = useBattery();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
    { id: 'health', label: 'Health & AI', icon: HeartPulse },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: alerts.filter(a => a.status !== 'RESOLVED').length },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'device', label: 'Device & Hardware', icon: Cpu },
  ];

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshTelemetry();
    setTimeout(() => setIsRefreshing(false), 450);
  };

  const unreadAlertsCount = alerts.filter(a => a.status !== 'RESOLVED').length;

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-zinc-200)',
          boxShadow: 'var(--shadow-subtle-2)',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--page-max-width)',
            margin: '0 auto',
            height: '66px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            gap: '16px',
          }}
        >
          {/* ========================================================
              LEFT: BRAND LOGO
              ======================================================== */}
          <div
            onClick={() => setActiveTab('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-iris)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(106, 94, 217, 0.35)',
              }}
            >
              <Zap size={20} fill="#ffffff" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-inter-variable)',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-zinc-900)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                Smart BMS
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '10px',
                  color: 'var(--color-cobalt)',
                  letterSpacing: '0.06em',
                }}
              >
                CAN BUS · AI DIAGNOSTICS
              </span>
            </div>
          </div>

          {/* ========================================================
              CENTER: HORIZONTAL NAVIGATION LINKS (DESKTOP)
              ======================================================== */}
          <nav
            className="horizontal-nav-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--color-zinc-100)',
              padding: '4px',
              borderRadius: 'var(--radius-buttons)',
              border: '1px solid var(--color-zinc-200)',
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '7px 13px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-inter-variable)',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? 'var(--color-white)' : 'transparent',
                    color: isActive ? 'var(--color-iris)' : 'var(--color-zinc-600)',
                    border: isActive ? '1px solid rgba(106, 94, 217, 0.25)' : '1px solid transparent',
                    boxShadow: isActive ? 'var(--shadow-subtle-2)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                  }}
                >
                  <Icon 
                    size={15} 
                    strokeWidth={isActive ? 2.2 : 1.75} 
                    color={isActive ? 'var(--color-iris)' : 'var(--color-zinc-500)'} 
                  />
                  <span>{item.label}</span>

                  {item.badge > 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--color-coral)',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontFamily: 'var(--font-dm-mono)',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '9999px',
                        lineHeight: 1.2,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ========================================================
              RIGHT: STATUS, CLOCK, MODE TOGGLE & NOTIFICATIONS
              ======================================================== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Status Beacon */}
            <div className="hide-on-tablet">
              {connectionStatus === 'live' && (
                <PillTag variant="green" pulse>
                  LIVE
                </PillTag>
              )}
              {connectionStatus === 'stale' && (
                <PillTag variant="orange">
                  STALE DATA
                </PillTag>
              )}
              {connectionStatus === 'offline' && (
                <PillTag variant="red">
                  DEVICE OFFLINE
                </PillTag>
              )}
              {connectionStatus === 'disconnected' && (
                <PillTag variant="red">
                  FIREBASE DISCONNECTED
                </PillTag>
              )}
              {(connectionStatus === 'nodata' || connectionStatus === 'connecting') && (
                <PillTag variant="blue" pulse>
                  NO DATA AVAILABLE
                </PillTag>
              )}
            </div>

            {/* Live Clock */}
            <div 
              className="hide-on-tablet"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontFamily: 'var(--font-dm-mono)', 
                fontSize: '12px', 
                color: 'var(--color-zinc-500)',
                backgroundColor: 'var(--color-zinc-100)',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-zinc-200)',
              }}
              title="Last telemetry packet time"
            >
              <Clock size={13} color="var(--color-zinc-400)" />
              <span>{telemetry.lastUpdated || '--:--:--'}</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              style={{
                padding: '7px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-zinc-200)',
                color: 'var(--color-zinc-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle-2)',
              }}
              title="Refresh Telemetry"
              aria-label="Refresh telemetry data"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowAlertMenu(!showAlertMenu)}
                style={{
                  padding: '7px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: unreadAlertsCount > 0 ? 'var(--color-coral-wash)' : 'var(--color-white)',
                  border: unreadAlertsCount > 0 ? '1px solid rgba(219, 84, 52, 0.3)' : '1px solid var(--color-zinc-200)',
                  color: unreadAlertsCount > 0 ? 'var(--color-coral)' : 'var(--color-zinc-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: 'var(--shadow-subtle-2)',
                }}
                title="System Notifications"
                aria-label="System Notifications"
              >
                <Bell size={16} />
                {unreadAlertsCount > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: 'var(--color-crimson)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontFamily: 'var(--font-dm-mono)',
                      fontWeight: 700,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showAlertMenu && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-zinc-200)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 200,
                    overflow: 'hidden',
                    animation: 'pageFadeSlide 0.18s ease',
                  }}
                >
                  <div 
                    style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid var(--color-zinc-100)',
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--color-zinc-900)' }}>
                      Fault Notifications
                    </span>
                    <button 
                      type="button" 
                      onClick={() => { setActiveTab('alerts'); setShowAlertMenu(false); }}
                      style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-iris)', cursor: 'pointer' }}
                    >
                      View All →
                    </button>
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '8px 12px' }}>
                    {alerts.length === 0 ? (
                      <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--color-zinc-400)', fontSize: '12px', fontFamily: 'var(--font-inter-variable)' }}>
                        No active safety alerts recorded. All hardware protection interlocks nominal.
                      </div>
                    ) : (
                      alerts.slice(0, 4).map((a) => (
                        <div 
                          key={a.id}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: a.status === 'RESOLVED' ? 'transparent' : 'var(--color-zinc-50)',
                            borderBottom: '1px solid var(--color-zinc-100)',
                            marginBottom: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span 
                              style={{ 
                                fontSize: '11.5px', 
                                fontWeight: 600, 
                                color: a.severity === 'Critical' ? 'var(--color-crimson)' : a.severity === 'Warning' ? 'var(--color-coral)' : 'var(--color-cobalt)',
                                fontFamily: 'var(--font-dm-mono)'
                              }}
                            >
                              {a.type}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--color-zinc-400)' }}>{a.timestamp}</span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--color-zinc-600)', lineHeight: 1.35 }}>
                            {a.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-trigger"
              style={{
                display: 'none',
                padding: '6px',
                color: 'var(--color-zinc-700)',
                cursor: 'pointer',
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          MOBILE / TABLET SLIDE-DOWN DRAWER
          ======================================================== */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '66px',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
            backgroundColor: 'rgba(24, 24, 27, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-white)',
              borderBottom: '1px solid var(--color-zinc-200)',
              boxShadow: 'var(--shadow-xl)',
              padding: '18px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              animation: 'pageFadeSlide 0.2s ease',
            }}
          >
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)', textTransform: 'uppercase', marginBottom: '4px' }}>
              NAVIGATION MENU
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-nav)',
                    backgroundColor: isActive ? 'var(--color-iris-wash)' : 'var(--color-zinc-50)',
                    color: isActive ? 'var(--color-iris)' : 'var(--color-zinc-800)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '14.5px',
                    border: isActive ? '1px solid rgba(106, 94, 217, 0.3)' : '1px solid var(--color-zinc-200)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={18} color={isActive ? 'var(--color-iris)' : 'var(--color-zinc-500)'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Responsive Breakpoints CSS */}
      <style>{`
        @media (max-width: 1040px) {
          .horizontal-nav-links {
            display: none !important;
          }
          .mobile-menu-trigger {
            display: inline-flex !important;
          }
        }
        @media (max-width: 720px) {
          .hide-on-tablet {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
