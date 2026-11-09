import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Cpu, 
  Activity, 
  Thermometer, 
  Fan, 
  Tv, 
  Volume2, 
  Battery, 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  Maximize2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Radio
} from 'lucide-react';

// Icon mapping for technical schematic placeholder
const getComponentIcon = (id = '') => {
  const map = {
    prototype: Cpu,
    esp8266: Cpu,
    can_transceiver: Radio,
    can: Radio,
    ina219: Activity,
    dht11: Thermometer,
    l298n: Activity,
    fan: Fan,
    oled: Tv,
    buzzer: Volume2,
    battery_pack: Battery,
    architecture: GitBranch,
  };
  return map[id] || Cpu;
};

export function ImageCard({
  id = '',
  slotNumber = null,
  name = 'Hardware Component',
  shortPurpose = '',
  shortDescription = '',
  workingPrinciple = '',
  mainInterface = '',
  actualRole = '',
  specs = {},
  datasheetUrl = null,
  datasheetLabel = 'Technical Datasheet Reference',
  technicalNote = '',
  verifiedSpecsNote = '',
  status = 'READY',
  statusType = 'green',
  caption = '',
  alt = '',
  imageSrc = null,
  category = 'Hardware Module',
  className = '',
  style = {},
}) {
  const [currentImage, setCurrentImage] = useState(imageSrc);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef(null);

  const Icon = getComponentIcon(id);

  useEffect(() => {
    setCurrentImage(imageSrc);
    setHasTriedFallback(false);
  }, [imageSrc]);

  const [hasTriedFallback, setHasTriedFallback] = useState(false);

  const handleImageError = () => {
    if (!hasTriedFallback && currentImage) {
      setHasTriedFallback(true);
      const fallbackMap = {
        '/images/hardware/node-mcu.jpg': '/images/hardware/Node mcu.jpg',
        '/images/hardware/Node mcu.jpg': '/images/hardware/node-mcu.jpg',
        '/images/hardware/battery-pack.jpg': '/images/hardware/Battery Pack.jpg',
        '/images/hardware/Battery Pack.jpg': '/images/hardware/battery-pack.jpg',
        '/images/hardware/cpu-fan.jpg': '/images/hardware/CPU Fan.jpg',
        '/images/hardware/CPU Fan.jpg': '/images/hardware/cpu-fan.jpg',
        '/images/hardware/workbench-enclosure.png': '/images/hardware/DIY Electronics Workbench Enclosure.png',
        '/images/hardware/DIY Electronics Workbench Enclosure.png': '/images/hardware/workbench-enclosure.png',
        '/images/hardware/l298n.jpg': '/images/hardware/L298N.jpg',
        '/images/hardware/L298N.jpg': '/images/hardware/l298n.jpg',
        '/images/hardware/buzzer.jpg': '/images/hardware/Buzzer.jpg',
        '/images/hardware/Buzzer.jpg': '/images/hardware/buzzer.jpg',
      };
      if (fallbackMap[currentImage]) {
        setCurrentImage(fallbackMap[currentImage]);
        return;
      }
    }
    setCurrentImage(null);
  };

  // Status badge styling
  const badgeColors = {
    green: { bg: 'var(--color-sprout-wash)', text: 'var(--color-sprout)', border: 'rgba(27, 177, 82, 0.25)' },
    blue: { bg: 'var(--color-cobalt-wash)', text: 'var(--color-cobalt)', border: 'rgba(63, 113, 212, 0.25)' },
    orange: { bg: 'var(--color-coral-wash)', text: 'var(--color-coral)', border: 'rgba(219, 84, 52, 0.25)' },
    gray: { bg: 'var(--color-zinc-100)', text: 'var(--color-zinc-600)', border: 'var(--color-zinc-200)' },
  };
  const activeBadge = badgeColors[statusType] || badgeColors.green;

  // Handle local image attachment (stores in component state for demonstration)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentImage(url);
    }
  };

  const purposeText = shortPurpose || shortDescription;

  return (
    <>
      <div 
        className={`image-card ${className}`}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ========================================================
            1. MEDIA FRAME WITH CONSISTENT 16:10 ASPECT RATIO
            ======================================================== */}
        <div className="image-card-media" style={{ position: 'relative' }}>
          {/* Status Badge */}
          {status && (
            <div className="image-card-badge">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-tags)',
                  backgroundColor: activeBadge.bg,
                  color: activeBadge.text,
                  border: `1px solid ${activeBadge.border}`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span 
                  style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: activeBadge.text 
                  }} 
                />
                {status}
              </span>
            </div>
          )}

          {/* Slot Index Tag */}
          {slotNumber !== null && slotNumber !== undefined && (
            <div 
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 2,
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-zinc-700)',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-zinc-200)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              SLOT #{slotNumber}
            </div>
          )}

          {currentImage ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={currentImage}
                alt={alt || name}
                className="image-card-img"
                onError={handleImageError}
              />
              <button
                type="button"
                onClick={() => setShowFullModal(true)}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  padding: '6px',
                  backgroundColor: 'rgba(24, 24, 27, 0.8)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
                title="Expand Component Image"
                aria-label="Expand image"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          ) : (
            /* Technical Engineering Placeholder */
            <div className="image-card-placeholder">
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-zinc-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-cobalt)',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                <Icon size={24} strokeWidth={1.8} />
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-inter-variable)', fontWeight: 600, fontSize: '13.5px', color: 'var(--color-zinc-900)' }}>
                  {name}
                </div>
                <div 
                  style={{ 
                    fontFamily: 'var(--font-dm-mono)', 
                    fontSize: '11px', 
                    color: 'var(--color-zinc-500)', 
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Clock size={11} /> Photo Pending — Prototype Slot
                </div>
              </div>

              {/* Upload trigger button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-inter-variable)',
                  fontWeight: 500,
                  padding: '5px 12px',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-zinc-800)',
                  border: '1px solid var(--color-zinc-300)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-subtle-2)',
                }}
              >
                <Upload size={12} /> Attach Workbench Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {/* ========================================================
            2. CARD BODY & STRUCTURED FIELDS
            ======================================================== */}
        <div className="image-card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span 
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '11px',
                color: 'var(--color-cobalt)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {category}
            </span>

            {mainInterface && (
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '11px',
                  color: 'var(--color-zinc-500)',
                  backgroundColor: 'var(--color-zinc-100)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {mainInterface.split('(')[0].trim()}
              </span>
            )}
          </div>

          <h3 className="image-card-title">{name}</h3>

          {/* Short Purpose */}
          {purposeText && (
            <p className="image-card-desc">
              <strong>Purpose:</strong> {purposeText}
            </p>
          )}

          {/* Actual Role in this Project */}
          {actualRole && (
            <div 
              style={{
                fontSize: '12.5px',
                color: 'var(--color-zinc-700)',
                backgroundColor: 'var(--color-zinc-50)',
                padding: '10px 12px',
                borderRadius: '8px',
                borderLeft: '3px solid var(--color-cobalt)',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: 'var(--color-zinc-900)' }}>Project Role:</strong> {actualRole}
            </div>
          )}

          {/* Technical Note (e.g. DHT11 ambient note) */}
          {technicalNote && (
            <div 
              style={{
                fontSize: '12px',
                color: 'var(--color-coral)',
                backgroundColor: 'var(--color-coral-wash)',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(219, 84, 52, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{technicalNote}</span>
            </div>
          )}

          {/* Verified Specs Note (e.g. Battery pack note) */}
          {verifiedSpecsNote && (
            <div 
              style={{
                fontSize: '12px',
                color: 'var(--color-sprout)',
                backgroundColor: 'var(--color-sprout-wash)',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(27, 177, 82, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                lineHeight: 1.4,
              }}
            >
              <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{verifiedSpecsNote}</span>
            </div>
          )}

          {/* Expandable Technical Working Principle & Interface Drawer */}
          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                fontSize: '12px',
                fontFamily: 'var(--font-dm-mono)',
                color: 'var(--color-zinc-600)',
                backgroundColor: 'var(--color-zinc-100)',
                borderRadius: '6px',
                border: '1px solid var(--color-zinc-200)',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
              }}
            >
              <span>{showDetails ? 'Hide Working Principle' : 'View Working Principle & Pins'}</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetails && (
              <div 
                style={{ 
                  marginTop: '10px', 
                  padding: '12px', 
                  backgroundColor: 'var(--color-zinc-50)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--color-zinc-200)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  animation: 'pageFadeSlide 0.18s ease',
                }}
              >
                {workingPrinciple && (
                  <div>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)', textTransform: 'uppercase' }}>
                      Working Principle
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--color-zinc-700)', lineHeight: 1.45, marginTop: '2px' }}>
                      {workingPrinciple}
                    </p>
                  </div>
                )}

                {mainInterface && (
                  <div>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--color-zinc-400)', textTransform: 'uppercase' }}>
                      Main Interface / Pinout
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--color-zinc-700)', fontFamily: 'var(--font-dm-mono)', marginTop: '2px' }}>
                      {mainInterface}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Technical Specifications Grid */}
          {specs && Object.keys(specs).length > 0 && (
            <div className="image-card-specs">
              {Object.entries(specs).slice(0, 4).map(([key, val]) => (
                <div key={key} className="image-card-spec-item">
                  <span className="image-card-spec-label">{key}</span>
                  <span className="image-card-spec-value">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Datasheet Reference Link */}
          {datasheetUrl && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--color-zinc-200)' }}>
              <a
                href={datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-dm-mono)',
                  color: 'var(--color-iris)',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <FileText size={12} />
                <span>{datasheetLabel}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          {/* Caption */}
          {caption && (
            <div 
              style={{
                fontSize: '12px',
                color: 'var(--color-zinc-500)',
                fontStyle: 'italic',
                marginTop: '4px',
                borderLeft: '2px solid var(--color-zinc-200)',
                paddingLeft: '8px',
                lineHeight: 1.4,
              }}
            >
              {caption}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Modal */}
      {showFullModal && currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowFullModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
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
              maxWidth: '900px',
              width: '100%',
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-zinc-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--color-zinc-900)' }}>{name}</h4>
              <button 
                type="button"
                onClick={() => setShowFullModal(false)}
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-zinc-500)', cursor: 'pointer' }}
              >
                Close ✕
              </button>
            </div>
            <div style={{ maxHeight: '70vh', overflow: 'hidden', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={currentImage} alt={alt || name} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
            {caption && (
              <div style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--color-zinc-600)', background: 'var(--color-zinc-50)' }}>
                {caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
