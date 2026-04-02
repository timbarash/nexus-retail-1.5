import React, { useState, useEffect, useRef, useCallback } from 'react';
import NexusIcon from '../components/NexusIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: '#030303',
  text: '#F0EDE8',
  dim: '#6B6359',
  muted: '#3D3529',
  gold: '#D4A03A',
  goldDim: 'rgba(212,160,58,0.10)',
  green: '#00C27C',
  greenDim: 'rgba(0,194,124,0.08)',
  red: '#E87068',
  redDim: 'rgba(232,112,104,0.08)',
  blue: '#64A8E0',
  blueDim: 'rgba(100,168,224,0.10)',
  purple: '#B598E8',
  purpleDim: 'rgba(181,152,232,0.08)',
  orange: '#E8A84C',
  card: '#0C0B09',
  border: '#1C1A17',
};

const FONT = "'DM Sans', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

// Gold text shadow for big statements
const GOLD_GLOW = '0 0 40px rgba(212,160,58,0.15)';

// ─────────────────────────────────────────────────────────────────────────────
// Web Audio API — Ambient Music
// ─────────────────────────────────────────────────────────────────────────────
function createAmbientAudio(audioCtx) {
  // Warm pad: two detuned oscillators through a low-pass filter
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc1.type = 'sine';
  osc1.frequency.value = 110; // A2
  osc2.type = 'sine';
  osc2.frequency.value = 165; // E3 (perfect fifth)

  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 1;

  gain.gain.value = 0;

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.start();
  osc2.start();

  return {
    fadeIn: () => {
      gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2);
    },
    fadeOut: () => {
      gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    },
    swell: () => {
      filter.frequency.setValueAtTime(filter.frequency.value, audioCtx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
      filter.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 1);
      gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 1);
      setTimeout(() => {
        filter.frequency.setValueAtTime(filter.frequency.value, audioCtx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
        filter.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 2);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2);
      }, 3000);
    },
    stop: () => {
      try { osc1.stop(); } catch (_) { /* already stopped */ }
      try { osc2.stop(); } catch (_) { /* already stopped */ }
    },
    mute: () => {
      gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    },
    unmute: () => {
      gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.15);
    },
  };
}

function playTick(audioCtx) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 880;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline Definition — ~70 seconds, tighter pacing
// ─────────────────────────────────────────────────────────────────────────────
const TIMELINE = [
  // ── Opening (0-11s) ──
  { id: 'open-1', at: 1.0, duration: 3.0, type: 'text', text: 'Every morning starts the same.', size: 38 },
  { id: 'open-2', at: 4.5, duration: 3.5, type: 'text', text: 'Pulling reports. Checking inventory.\nChasing stockouts.', size: 32 },
  { id: 'open-3', at: 8.5, duration: 3.0, type: 'text', text: 'Six tabs open.\nDecisions always reactive.', size: 32 },

  // ── The Shift (11-12s) ──
  { id: 'shift-1', at: 11.5, duration: 3.5, type: 'text', text: 'What if your platform already knew?', size: 38, color: C.gold, glow: true },

  // ── Command Center (12-20s) ──
  { id: 'cc-1', at: 12.0, duration: 8.0, type: 'commandCenter' },

  // ── Purchasing Agent (25-35s) ──
  { id: 'po-1', at: 25.0, duration: 2.5, type: 'text', text: 'Need to reorder?', size: 34 },
  { id: 'po-2', at: 25.0, duration: 10.0, type: 'purchasingAgent' },

  // ── Growth Agent (35-45s) ──
  { id: 'gro-1', at: 35.0, duration: 10.0, type: 'growthAgent' },

  // ── $100B Peak (48-55s) ──
  { id: 'data-1', at: 48.0, duration: 7.0, type: 'hundredBillion' },

  // ── Compliance (55-60s) ──
  { id: 'comp-1', at: 55.0, duration: 5.0, type: 'compliance' },

  // ── Close (60-70s) ──
  { id: 'close-1', at: 60.0, duration: 10.0, type: 'closingSequence' },
];

const TOTAL_DURATION = 70;

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(target, durationMs, active) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, durationMs, active]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Word-by-word reveal hook
// ─────────────────────────────────────────────────────────────────────────────
function useWordReveal(text, active, delayMs = 80) {
  const [count, setCount] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    if (!active) { setCount(0); return; }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCount(i);
      if (i >= words.length) clearInterval(interval);
    }, delayMs);
    return () => clearInterval(interval);
  }, [active, words.length, delayMs]);

  return words.slice(0, count).join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Moment Renderers
// ─────────────────────────────────────────────────────────────────────────────

function TextMoment({ moment, visible }) {
  const fadeDur = moment.fadeDuration || 0.3;
  return (
    <div style={{
      position: 'absolute',
      top: moment.yOffset ? `calc(50% + ${moment.yOffset}px)` : '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: visible ? 1 : 0,
      transition: `opacity ${fadeDur}s ease`,
      pointerEvents: 'none',
      width: '90vw',
      maxWidth: 800,
      textAlign: 'center',
      zIndex: 2,
    }}>
      <span style={{
        fontFamily: FONT,
        fontWeight: moment.weight || 200,
        fontSize: `clamp(${Math.round(moment.size * 0.55)}px, ${moment.size / 16}vw, ${moment.size}px)`,
        lineHeight: 1.35,
        color: moment.color || C.text,
        whiteSpace: 'pre-line',
        letterSpacing: moment.size >= 64 ? '-0.02em' : '0.01em',
        textShadow: moment.glow ? GOLD_GLOW : 'none',
      }}>
        {moment.text}
      </span>
    </div>
  );
}

// ── Command Center (12-20s) ──
// Full mini Command Center with morning briefing, KPIs counting up,
// smart alert sliding in, transfer button auto-clicking at t=18
function CommandCenterMoment({ visible, elapsed }) {
  const briefingText = "Good morning. Revenue is up 4.2% vs last week. 87 SKUs below safety stock — 3 are priority. Customer repeat rate holds at 68%.";
  const revealedBriefing = useWordReveal(briefingText, visible, 60);

  const kpis = [
    { label: 'Net Revenue', to: 136, prefix: '$', suffix: 'M', sub: '+4.2% vs last week', color: C.green, decimals: 1 },
    { label: 'Gross Margin', to: 482, prefix: '', suffix: '%', sub: 'On target', color: C.gold, decimals: 1 },
    { label: 'Stockout SKUs', to: 87, prefix: '', suffix: '', sub: '$112K lost revenue', color: C.red, decimals: 0 },
    { label: 'Customer Health', to: 68, prefix: '', suffix: '%', sub: 'Repeat rate', color: C.blue, decimals: 0 },
  ];

  const kpiActive = visible && elapsed > 0.5;
  const alertActive = visible && elapsed > 3.5;
  const transferring = visible && elapsed > 6.0;
  const transferred = visible && elapsed > 7.0;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      zIndex: 1,
      width: '90vw',
      maxWidth: 640,
    }}>
      {/* Morning briefing text */}
      <div style={{
        fontFamily: FONT, fontSize: 13, lineHeight: 1.7, color: C.dim,
        marginBottom: 16, minHeight: 44, padding: '12px 16px',
        background: C.card, borderRadius: 10, border: `1px solid ${C.border}`,
      }}>
        <span style={{ color: C.gold, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Morning Briefing</span>
        <span style={{ color: C.text }}>{revealedBriefing}</span>
        <span style={{ opacity: 0.4, animation: 'blink 1s steps(1) infinite' }}>|</span>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {kpis.map((k, i) => (
          <KPICard key={k.label} kpi={k} active={kpiActive} delay={0.15 * i} />
        ))}
      </div>

      {/* Smart alert sliding in from right */}
      <div style={{
        opacity: alertActive ? 1 : 0,
        transform: alertActive ? 'translateX(0)' : 'translateX(60px)',
        transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
        padding: '14px 16px',
        borderRadius: 10,
        background: C.card,
        border: `1px solid ${alertActive ? 'rgba(232,112,104,0.3)' : C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: C.redDim, border: '1px solid rgba(232,112,104,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.red,
          }}>!</div>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.text }}>
            Blue Dream 3.5g — <span style={{ color: C.red }}>OOS</span> — Logan Square
          </div>
          <div style={{
            marginLeft: 'auto', padding: '2px 6px', borderRadius: 4,
            background: C.redDim, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.red,
          }}>URGENT</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim }}>
            45 units available — Wicker Park vault
          </div>
          <div style={{
            marginLeft: 'auto',
            padding: '8px 20px', borderRadius: 8, textAlign: 'center',
            fontFamily: FONT, fontSize: 12, fontWeight: 600,
            background: transferred
              ? 'linear-gradient(135deg, #00C27C 0%, #009E60 100%)'
              : transferring
                ? 'linear-gradient(135deg, #B8862E 0%, #D4A03A 100%)'
                : 'linear-gradient(135deg, #D4A03A 0%, #B8862E 100%)',
            color: '#050504',
            transition: 'all 0.4s ease',
            boxShadow: transferred ? '0 0 20px rgba(0,194,124,0.3)' : 'none',
            animation: (alertActive && !transferring) ? 'pulse-btn 2s ease infinite' : 'none',
          }}>
            {transferred ? '\u2713 Done' : transferring ? 'Transferring...' : 'Transfer \u2192'}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ kpi, active, delay }) {
  const rawVal = useCountUp(kpi.to, 1800, active);
  const displayVal = kpi.decimals === 1
    ? (rawVal / 10).toFixed(1)
    : rawVal.toLocaleString();

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 10,
      background: C.card,
      border: `1px solid ${C.border}`,
      opacity: active ? 1 : 0,
      transform: active ? 'translateY(0)' : 'translateY(12px)',
      transition: `all 0.5s ease ${delay}s`,
    }}>
      <div style={{ fontFamily: FONT, fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{kpi.label}</div>
      <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: kpi.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {kpi.prefix}{displayVal}{kpi.suffix}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 10, color: C.dim, marginTop: 3 }}>{kpi.sub}</div>
    </div>
  );
}

// ── Purchasing Agent (25-35s) ──
function PurchasingAgentMoment({ visible, elapsed }) {
  const vendorVisible = visible && elapsed > 0.5;
  const line1 = visible && elapsed > 1.5;
  const line2 = visible && elapsed > 2.2;
  const line3 = visible && elapsed > 2.9;
  const line4 = visible && elapsed > 3.6;
  const bfdVisible = visible && elapsed > 4.5;
  const totalVisible = visible && elapsed > 5.5;
  const reviewVisible = visible && elapsed > 6.5;
  const reviewScreen = visible && elapsed > 7.5;
  const submitted = visible && elapsed > 9.0;

  const items = [
    { name: 'Blue Dream 3.5g', qty: 120, cost: '$1,080' },
    { name: 'Green Line OG 1g', qty: 200, cost: '$1,200' },
    { name: 'Mango Haze Cart', qty: 80, cost: '$560' },
    { name: 'Kush Mints 7g', qty: 40, cost: '$640' },
  ];
  const visibleItems = [line1, line2, line3, line4];

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      zIndex: 1,
      width: '90vw',
      maxWidth: 480,
    }}>
      {/* Vendor card */}
      <div style={{
        padding: '16px 18px',
        borderRadius: 12,
        background: C.card,
        border: `1px solid ${C.border}`,
        opacity: vendorVisible ? 1 : 0,
        transform: vendorVisible ? 'translateX(0)' : 'translateX(-30px)',
        transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.text }}>Jeeter</span>
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.dim }}>4 products below reorder</span>
        </div>

        {/* Line items appearing one by one */}
        {items.map((item, i) => (
          <div key={item.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0',
            borderTop: `1px solid ${C.border}`,
            opacity: visibleItems[i] ? 1 : 0,
            transform: visibleItems[i] ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.4s ease',
          }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.text }}>{item.name}</span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>\u00d7{item.qty}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.green }}>{item.cost}</span>
            </div>
          </div>
        ))}

        {/* BFD badge */}
        <div style={{
          marginTop: 10,
          opacity: bfdVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            padding: '4px 10px', borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(212,160,58,0.15) 0%, rgba(212,160,58,0.08) 100%)',
            border: '1px solid rgba(212,160,58,0.3)',
            fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.gold,
            animation: bfdVisible ? 'bfd-glow 2s ease infinite' : 'none',
          }}>BFD 20% Brand Funded Discount</span>
        </div>

        {/* Total */}
        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          opacity: totalVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          <span style={{ fontFamily: FONT, fontSize: 12, color: C.dim }}>Total (after BFD)</span>
          <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: C.green }}>$2,784</span>
        </div>

        {/* Review / Submit button */}
        {!reviewScreen ? (
          <div style={{
            marginTop: 12,
            opacity: reviewVisible ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}>
            <div style={{
              padding: '10px 0', borderRadius: 8, textAlign: 'center',
              fontFamily: FONT, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #D4A03A 0%, #B8862E 100%)',
              color: '#050504',
            }}>Review PO</div>
          </div>
        ) : (
          <div style={{
            marginTop: 12, padding: '12px 14px', borderRadius: 8,
            background: '#080807', border: `1px solid ${C.border}`,
            opacity: reviewScreen ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginBottom: 6 }}>PO-2026-0847 → Ascend Logan Square</div>
            <div style={{
              padding: '10px 0', borderRadius: 8, textAlign: 'center',
              fontFamily: FONT, fontSize: 13, fontWeight: 600,
              background: submitted
                ? 'linear-gradient(135deg, #00C27C 0%, #009E60 100%)'
                : 'linear-gradient(135deg, #D4A03A 0%, #B8862E 100%)',
              color: '#050504',
              transition: 'all 0.4s ease',
              boxShadow: submitted ? '0 0 20px rgba(0,194,124,0.25)' : 'none',
            }}>
              {submitted ? 'Submitted via Dutchie Connect \u2713' : 'Submit PO'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Growth Agent (35-45s) ──
function GrowthAgentMoment({ visible, elapsed }) {
  const countActive = visible && elapsed > 0.3;
  const titleVisible = visible && elapsed > 2.5;
  const channelsVisible = visible && elapsed > 3.5;
  const discountVisible = visible && elapsed > 5.0;
  const autoLabel = visible && elapsed > 6.0;
  const createBtn = visible && elapsed > 7.0;
  const created = visible && elapsed > 8.5;

  const countVal = useCountUp(1247, 2000, countActive);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      zIndex: 2,
      width: '90vw',
      maxWidth: 520,
      textAlign: 'center',
    }}>
      {/* Counter */}
      <div style={{
        fontFamily: FONT, fontWeight: 200,
        fontSize: 'clamp(36px, 5vw, 64px)',
        color: C.text,
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 4,
        textShadow: GOLD_GLOW,
      }}>
        {countVal.toLocaleString()}
      </div>
      <div style={{
        fontFamily: FONT, fontSize: 16, color: C.dim, marginBottom: 24,
        opacity: countActive ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        customers lapsed 45+ days
      </div>

      {/* Campaign card */}
      <div style={{
        padding: '20px',
        borderRadius: 12,
        background: C.card,
        border: `1px solid ${C.border}`,
        textAlign: 'left',
      }}>
        {/* Title */}
        <div style={{
          fontFamily: FONT, fontSize: 16, fontWeight: 600, color: C.gold,
          marginBottom: 14,
          opacity: titleVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>Win-Back Campaign</div>

        {/* Channel pills with waterfall arrows */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          opacity: channelsVisible ? 1 : 0,
          transform: channelsVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.5s ease',
        }}>
          {['Email', 'SMS', 'Push'].map((ch, i) => (
            <React.Fragment key={ch}>
              {i > 0 && <span style={{ fontFamily: FONT, fontSize: 11, color: C.dim }}>\u2192</span>}
              <span style={{
                padding: '5px 12px', borderRadius: 20,
                background: i === 0 ? C.blueDim : i === 1 ? C.greenDim : C.purpleDim,
                border: `1px solid ${i === 0 ? 'rgba(100,168,224,0.2)' : i === 1 ? 'rgba(0,194,124,0.2)' : 'rgba(181,152,232,0.2)'}`,
                fontFamily: FONT, fontSize: 11, fontWeight: 600,
                color: i === 0 ? C.blue : i === 1 ? C.green : C.purple,
              }}>{ch}</span>
            </React.Fragment>
          ))}
          <span style={{ fontFamily: FONT, fontSize: 9, color: C.dim, marginLeft: 4 }}>waterfall</span>
        </div>

        {/* Discount badge */}
        <div style={{
          opacity: discountVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          marginBottom: 10,
        }}>
          <span style={{
            padding: '4px 10px', borderRadius: 4,
            background: C.goldDim, border: '1px solid rgba(212,160,58,0.25)',
            fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.gold,
          }}>15% off next visit</span>
        </div>

        {/* Automation label */}
        <div style={{
          fontFamily: FONT, fontSize: 11, color: C.dim, marginBottom: 14,
          opacity: autoLabel ? 1 : 0, transition: 'opacity 0.4s ease',
        }}>
          Automated — triggers on 45 days of inactivity
        </div>

        {/* Create button */}
        <div style={{
          opacity: createBtn ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          <div style={{
            padding: '10px 0', borderRadius: 8, textAlign: 'center',
            fontFamily: FONT, fontSize: 13, fontWeight: 600,
            background: created
              ? 'linear-gradient(135deg, #00C27C 0%, #009E60 100%)'
              : 'linear-gradient(135deg, #D4A03A 0%, #B8862E 100%)',
            color: '#050504',
            transition: 'all 0.4s ease',
            boxShadow: created ? '0 0 20px rgba(0,194,124,0.25)' : 'none',
          }}>
            {created ? '4 system objects created \u2713' : 'Create Campaign Package'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── $100 Billion Peak (48-55s) ──
function HundredBillionMoment({ visible, elapsed }) {
  const typewriterText = 'billion';
  const typedCount = Math.min(Math.floor((elapsed - 1.0) * 8), typewriterText.length);
  const typed = visible && elapsed > 1.0 ? typewriterText.slice(0, Math.max(0, typedCount)) : '';

  const point1 = visible && elapsed > 3.0;
  const point2 = visible && elapsed > 4.0;
  const point3 = visible && elapsed > 5.0;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      zIndex: 2,
      textAlign: 'center',
      width: '90vw',
      maxWidth: 700,
    }}>
      {/* $100 */}
      <div style={{
        fontFamily: FONT, fontWeight: 200,
        fontSize: 'clamp(60px, 10vw, 120px)',
        color: C.text,
        letterSpacing: '-0.03em',
        lineHeight: 1.0,
        textShadow: GOLD_GLOW,
      }}>$100</div>

      {/* billion — typed out */}
      <div style={{
        fontFamily: FONT, fontWeight: 200,
        fontSize: 'clamp(28px, 4vw, 48px)',
        color: C.gold,
        letterSpacing: '0.05em',
        marginTop: 8,
        minHeight: 52,
        textShadow: GOLD_GLOW,
      }}>
        {typed}<span style={{ opacity: typed.length < typewriterText.length ? 0.4 : 0, animation: 'blink 1s steps(1) infinite' }}>|</span>
      </div>

      {/* Three data points */}
      <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        {[
          { text: 'Cross-operator benchmarking', show: point1 },
          { text: 'Demand prediction', show: point2 },
          { text: 'Supply intelligence from Connect', show: point3 },
        ].map((p) => (
          <div key={p.text} style={{
            fontFamily: FONT, fontSize: 16, color: C.dim,
            opacity: p.show ? 1 : 0,
            transform: p.show ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.6s ease',
          }}>{p.text}</div>
        ))}
      </div>
    </div>
  );
}

// ── Compliance (55-60s) ──
function ComplianceMoment({ visible, elapsed }) {
  const title = visible && elapsed > 0;
  const badges = visible && elapsed > 1.5;
  const tagline = visible && elapsed > 3.0;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      zIndex: 2,
      textAlign: 'center',
      width: '90vw',
      maxWidth: 600,
    }}>
      <div style={{
        fontFamily: FONT, fontWeight: 200, fontSize: 'clamp(20px, 3vw, 32px)',
        color: C.text, marginBottom: 28,
        opacity: title ? 1 : 0, transition: 'opacity 0.5s ease',
        textShadow: GOLD_GLOW,
      }}>
        40 states. 3 traceability systems.
      </div>

      {/* Compliance badges */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28,
        opacity: badges ? 1 : 0,
        transform: badges ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.6s ease',
      }}>
        {[
          { name: 'METRC', color: C.green, bg: C.greenDim, border: 'rgba(0,194,124,0.3)' },
          { name: 'BioTrack', color: C.blue, bg: C.blueDim, border: 'rgba(100,168,224,0.3)' },
          { name: 'MJ Freeway', color: C.purple, bg: C.purpleDim, border: 'rgba(181,152,232,0.3)' },
        ].map((b) => (
          <span key={b.name} style={{
            padding: '8px 20px', borderRadius: 8,
            background: b.bg, border: `1px solid ${b.border}`,
            fontFamily: MONO, fontSize: 13, fontWeight: 700, color: b.color,
            letterSpacing: '0.03em',
          }}>{b.name}</span>
        ))}
      </div>

      <div style={{
        fontFamily: FONT, fontWeight: 300, fontSize: 'clamp(14px, 2vw, 20px)',
        color: C.dim,
        opacity: tagline ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        Compliance built into every action. Not bolted on.
      </div>
    </div>
  );
}

// ── Closing Sequence (60-70s) ──
function ClosingSequenceMoment({ visible, elapsed }) {
  const iconVisible = visible && elapsed > 0.5;
  const nameVisible = visible && elapsed > 1.5;
  const taglineVisible = visible && elapsed > 3.5;
  const builtByVisible = visible && elapsed > 5.5;
  const ctaVisible = visible && elapsed > 7.5;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      zIndex: 2,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* NexusIcon with rotating gold border */}
      <div style={{
        opacity: iconVisible ? 1 : 0,
        transition: 'opacity 1s ease',
        position: 'relative',
        width: 120,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Rotating gold border ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1.5px solid transparent',
          borderTopColor: C.gold,
          borderRightColor: 'rgba(212,160,58,0.3)',
          animation: iconVisible ? 'spin 4s linear infinite' : 'none',
        }} />
        <div style={{
          filter: 'drop-shadow(0 0 40px rgba(212,160,58,0.5)) drop-shadow(0 0 80px rgba(212,160,58,0.15))',
        }}>
          <NexusIcon size={100} />
        </div>
      </div>

      {/* "Nexus" */}
      <div style={{
        fontFamily: FONT, fontWeight: 200, fontSize: 60,
        color: C.text, letterSpacing: '-0.02em',
        opacity: nameVisible ? 1 : 0,
        transition: 'opacity 0.8s ease',
        textShadow: GOLD_GLOW,
      }}>nexus</div>

      {/* Tagline */}
      <div style={{
        fontFamily: FONT, fontWeight: 300, fontSize: 20,
        color: C.dim, marginTop: 8,
        opacity: taglineVisible ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>Intelligence for cannabis operations.</div>

      {/* Built by Dutchie */}
      <div style={{
        fontFamily: FONT, fontWeight: 300, fontSize: 16,
        color: C.muted, marginTop: 12,
        opacity: builtByVisible ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>Built by Dutchie.</div>

      {/* CTA */}
      <div style={{
        marginTop: 20,
        opacity: ctaVisible ? 1 : 0,
        transition: 'opacity 0.8s ease',
        pointerEvents: ctaVisible ? 'auto' : 'none',
      }}>
        <a
          href="#/marketing-v2"
          style={{
            display: 'inline-block',
            padding: '14px 40px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #D4A03A 0%, #B8862E 100%)',
            color: '#050504',
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 0 30px rgba(212,160,58,0.2)',
            letterSpacing: '0.02em',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Explore Nexus &rarr;
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mute / Unmute Toggle
// ─────────────────────────────────────────────────────────────────────────────
function MuteButton({ muted, onToggle, playing }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 50,
        opacity: hover ? 0.9 : 0.35,
        transition: 'opacity 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {/* Speaker icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={C.text} />
        {muted ? (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>

      {/* Animated volume bars when playing and not muted */}
      {!muted && playing && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
          <div style={{ width: 2, background: C.gold, borderRadius: 1, animation: 'bar1 0.8s ease infinite alternate' }} />
          <div style={{ width: 2, background: C.gold, borderRadius: 1, animation: 'bar2 0.6s ease infinite alternate' }} />
          <div style={{ width: 2, background: C.gold, borderRadius: 1, animation: 'bar3 0.9s ease infinite alternate' }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Moment Dispatcher
// ─────────────────────────────────────────────────────────────────────────────
function Moment({ moment, visible, currentTime }) {
  const elapsed = currentTime - moment.at;
  switch (moment.type) {
    case 'text':
      return <TextMoment moment={moment} visible={visible} />;
    case 'commandCenter':
      return <CommandCenterMoment visible={visible} elapsed={elapsed} />;
    case 'purchasingAgent':
      return <PurchasingAgentMoment visible={visible} elapsed={elapsed} />;
    case 'growthAgent':
      return <GrowthAgentMoment visible={visible} elapsed={elapsed} />;
    case 'hundredBillion':
      return <HundredBillionMoment visible={visible} elapsed={elapsed} />;
    case 'compliance':
      return <ComplianceMoment visible={visible} elapsed={elapsed} />;
    case 'closingSequence':
      return <ClosingSequenceMoment visible={visible} elapsed={elapsed} />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Play Button Overlay
// ─────────────────────────────────────────────────────────────────────────────
function PlayOverlay({ onPlay }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        gap: 36,
      }}
      onClick={onPlay}
    >
      <NexusIcon
        size={48}
        style={{ filter: 'drop-shadow(0 0 30px rgba(212,160,58,0.4))' }}
      />

      {/* Play circle */}
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          border: `2px solid ${hover ? C.gold : C.text}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: hover ? '0 0 40px rgba(212,160,58,0.2)' : 'none',
        }}
      >
        <svg width="28" height="32" viewBox="0 0 28 32" fill="none" style={{ marginLeft: 4 }}>
          <path d="M2 1.5L26 16L2 30.5V1.5Z" fill={hover ? C.gold : C.text} />
        </svg>
      </div>

      <span style={{
        fontFamily: FONT,
        fontWeight: 200,
        fontSize: 16,
        color: C.dim,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}>
        Play
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function NexusVideo() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [pauseHover, setPauseHover] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(null);
  const timeRef = useRef(0);
  const audioCtxRef = useRef(null);
  const ambientRef = useRef(null);
  const swellFiredRef = useRef(false);
  const prevVisibleRef = useRef(new Set());

  // ── Playback loop ──
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = null;
      return;
    }

    const tick = (now) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
      }
      const delta = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;
      timeRef.current += delta;

      if (timeRef.current >= TOTAL_DURATION) {
        timeRef.current = TOTAL_DURATION;
        setCurrentTime(TOTAL_DURATION);
        setPlaying(false);
        setFinished(true);
        // Fade out audio
        if (ambientRef.current) ambientRef.current.fadeOut();
        return;
      }

      setCurrentTime(timeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing]);

  // ── Tick sounds on text transitions + $100B swell ──
  useEffect(() => {
    if (!playing || !audioCtxRef.current || muted) return;

    const visibleNow = new Set();
    for (const m of TIMELINE) {
      if (currentTime >= m.at && currentTime < m.at + m.duration) {
        visibleNow.add(m.id);
      }
    }

    // Play tick on newly appearing moments
    for (const id of visibleNow) {
      if (!prevVisibleRef.current.has(id)) {
        playTick(audioCtxRef.current);
        break; // one tick per frame max
      }
    }

    // Swell at $100B moment (~48s)
    if (!swellFiredRef.current && currentTime >= 48.0) {
      swellFiredRef.current = true;
      if (ambientRef.current) ambientRef.current.swell();
    }

    prevVisibleRef.current = visibleNow;
  }, [currentTime, playing, muted]);

  // ── Start ──
  const handlePlay = useCallback(() => {
    setStarted(true);
    setPlaying(true);
    setFinished(false);
    timeRef.current = 0;
    setCurrentTime(0);
    swellFiredRef.current = false;
    prevVisibleRef.current = new Set();

    // Create AudioContext on user gesture
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const ambient = createAmbientAudio(ctx);
      ambientRef.current = ambient;
      ambient.fadeIn();
    } catch (_) {
      // Audio not available — continue silently
    }
  }, []);

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      if (ambientRef.current) {
        if (next) {
          ambientRef.current.mute();
        } else {
          ambientRef.current.unmute();
        }
      }
      return next;
    });
  }, []);

  // ── Toggle pause ──
  const togglePause = useCallback(() => {
    if (finished) {
      // Replay — stop old audio first
      if (ambientRef.current) {
        try { ambientRef.current.stop(); } catch (_) { /* ok */ }
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) { /* ok */ }
      }
      handlePlay();
      return;
    }
    setPlaying(p => !p);
  }, [finished, handlePlay]);

  // ── Click anywhere to toggle ──
  const handleScreenClick = useCallback((e) => {
    if (e.target.tagName === 'A' || e.target.closest('a')) return;
    togglePause();
  }, [togglePause]);

  // ── Keyboard ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (!started) {
          handlePlay();
        } else {
          togglePause();
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
      if (e.key === 'Escape') {
        window.location.hash = '#/marketing-v2';
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, handlePlay, togglePause, toggleMute]);

  // ── Cleanup audio on unmount ──
  useEffect(() => {
    return () => {
      if (ambientRef.current) {
        try { ambientRef.current.stop(); } catch (_) { /* ok */ }
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) { /* ok */ }
      }
    };
  }, []);

  // ── Progress fraction ──
  const progress = Math.min(currentTime / TOTAL_DURATION, 1);

  // ── Determine which moments are visible ──
  const visibleSet = new Set();
  for (const m of TIMELINE) {
    if (currentTime >= m.at && currentTime < m.at + m.duration) {
      visibleSet.add(m.id);
    }
  }

  if (!started) {
    return (
      <>
        <PlayOverlay onPlay={handlePlay} />
        <style>{globalStyles}</style>
      </>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: C.bg,
        overflow: 'hidden',
        cursor: 'default',
        fontFamily: FONT,
      }}
      onClick={handleScreenClick}
    >
      {/* ── Vignette overlay ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
      }} />

      {/* ── Moments ── */}
      {TIMELINE.map(m => (
        <Moment
          key={m.id}
          moment={m}
          visible={visibleSet.has(m.id)}
          currentTime={currentTime}
        />
      ))}

      {/* ── Mute button (bottom-left) ── */}
      <MuteButton muted={muted} onToggle={toggleMute} playing={playing} />

      {/* ── Pause button (bottom-right, nearly invisible) ── */}
      <div
        onMouseEnter={() => setPauseHover(true)}
        onMouseLeave={() => setPauseHover(false)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 50,
          opacity: pauseHover ? 0.7 : 0.15,
          transition: 'opacity 0.3s ease',
          cursor: 'pointer',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => { e.stopPropagation(); togglePause(); }}
      >
        {playing ? (
          <svg width="14" height="16" viewBox="0 0 14 16" fill={C.text}>
            <rect x="0" y="0" width="4" height="16" rx="1" />
            <rect x="10" y="0" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="16" viewBox="0 0 14 16" fill={C.text}>
            <path d="M1 0.5L13 8L1 15.5V0.5Z" />
          </svg>
        )}
      </div>

      {/* ── Progress bar — thin gold-to-green gradient ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 50,
        background: 'transparent',
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${C.gold} 0%, ${C.green} 100%)`,
          transition: playing ? 'none' : 'width 0.3s ease',
          boxShadow: '0 0 8px rgba(212,160,58,0.3)',
        }} />
      </div>

      <style>{globalStyles}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Global styles
// ─────────────────────────────────────────────────────────────────────────────
const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; overflow: hidden; }
  ::selection { background: rgba(212,160,58,0.25); color: ${C.text}; }

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse-btn {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212,160,58,0.3); }
    50% { box-shadow: 0 0 0 8px rgba(212,160,58,0); }
  }

  @keyframes bfd-glow {
    0%, 100% { box-shadow: 0 0 4px rgba(212,160,58,0.2); }
    50% { box-shadow: 0 0 12px rgba(212,160,58,0.4); }
  }

  @keyframes bar1 {
    0% { height: 3px; }
    100% { height: 12px; }
  }
  @keyframes bar2 {
    0% { height: 6px; }
    100% { height: 10px; }
  }
  @keyframes bar3 {
    0% { height: 2px; }
    100% { height: 14px; }
  }
`;
