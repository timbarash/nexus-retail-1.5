import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, CircleDollarSign, Megaphone } from 'lucide-react';
import NexusIcon from '../components/NexusIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens — warm parchment palette, richer
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg: '#EDE8DC',
  surface: '#F7F4EC',
  deep: '#E4DFD0',
  darker: '#D8D2C4',
  text: '#2C2416',
  secondary: '#5C5243',
  muted: '#706858',
  gold: '#7A5F12',
  goldLight: '#9A7B2E',
  green: '#0B6E44',
  greenLight: '#0D8A56',
  border: '#D5CEBC',
  ink: '#1A1510',
};

const font = {
  heading: "'DM Sans', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-driven fade-in hook
// ─────────────────────────────────────────────────────────────────────────────
function useFadeIn(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function FadeIn({ children, style = {}, delay = 0 }) {
  const [ref, visible] = useFadeIn();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating nav (fades in on scroll)
// ─────────────────────────────────────────────────────────────────────────────
function FloatingNav({ visible }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
      pointerEvents: visible ? 'auto' : 'none',
      background: `${T.bg}ee`,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NexusIcon size={20} />
          <span style={{
            fontFamily: font.heading, fontWeight: 200, fontSize: 20,
            letterSpacing: '0.1em', color: T.text,
          }}>nexus</span>
        </div>
        <button
          onClick={() => document.getElementById('v2-close')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            fontFamily: font.body, fontSize: 13, fontWeight: 600,
            padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
            border: 'none', background: T.green, color: '#fff',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.greenLight}
          onMouseLeave={e => e.currentTarget.style.background = T.green}
        >
          Request Access
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating CTA pill (appears after section 2)
// ─────────────────────────────────────────────────────────────────────────────
function FloatingCTA({ visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 100,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <button
        onClick={() => document.getElementById('v2-close')?.scrollIntoView({ behavior: 'smooth' })}
        style={{
          fontFamily: font.body, fontSize: 14, fontWeight: 600,
          padding: '14px 28px', borderRadius: 28, cursor: 'pointer',
          border: 'none', background: T.green, color: '#fff',
          boxShadow: '0 6px 24px rgba(11,110,68,0.28), 0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = T.greenLight;
          e.currentTarget.style.transform = 'scale(1.04)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = T.green;
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Request Access
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: HERO — Full viewport, theatrical
// ─────────────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', position: 'relative', textAlign: 'center',
      background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${T.surface} 0%, ${T.bg} 100%)`,
    }}>
      {/* Pulsing Nexus icon */}
      <div style={{ marginBottom: 40 }}>
        <div className="v2-pulse-icon" style={{ display: 'inline-block' }}>
          <NexusIcon size={80} />
        </div>
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: font.heading, fontWeight: 200, fontSize: 'clamp(48px, 7vw, 80px)',
        letterSpacing: '0.15em', color: T.text, lineHeight: 1.1,
        marginBottom: 24,
      }}>
        nexus
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: font.body, fontWeight: 300, fontSize: 'clamp(16px, 2vw, 20px)',
        color: T.secondary, lineHeight: 1.6, maxWidth: 520,
        marginBottom: 32,
      }}>
        The intelligence layer for cannabis operations
      </p>

      {/* Stats line */}
      <p style={{
        fontFamily: font.body, fontWeight: 400, fontSize: 14,
        color: T.muted, letterSpacing: '0.02em',
      }}>
        $100B+ in cannabis transactions processed. One platform.
      </p>

      {/* Animated scroll chevron */}
      <div className="v2-chevron" style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: THE OPENING STATEMENT — Editorial spread
// ─────────────────────────────────────────────────────────────────────────────
function OpeningStatement() {
  return (
    <section style={{ padding: '120px 24px', textAlign: 'center' }}>
      <FadeIn style={{ maxWidth: 800, margin: '0 auto' }}>
        <p style={{
          fontFamily: font.heading, fontWeight: 300,
          fontSize: 'clamp(22px, 3.5vw, 32px)', lineHeight: 1.55,
          color: T.text,
        }}>
          Every dispensary owner we've talked to says the same thing:{' '}
          <em style={{ fontStyle: 'italic', color: T.gold }}>
            I spend my mornings pulling reports instead of running my business.
          </em>{' '}
          nexus changes that.
        </p>

        {/* Gold rule */}
        <div style={{
          width: 100, height: 1, background: T.gold,
          margin: '48px auto 24px',
        }} />

        <p style={{
          fontFamily: font.body, fontSize: 14, color: T.muted,
          letterSpacing: '0.04em',
        }}>
          Here's how.
        </p>
      </FadeIn>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: THE THREE PILLARS — Side-by-side editorial
// ─────────────────────────────────────────────────────────────────────────────

/* Mini CSS mockups for each pillar — warm parchment light mode */
function CommandCenterMockup() {
  return (
    <div style={{
      background: '#D8D2C4', borderRadius: 14, padding: 6,
      boxShadow: '0 8px 32px rgba(60,48,20,0.12), 0 2px 8px rgba(60,48,20,0.06)',
    }}>
      <div style={{
        background: '#EDE8DC', borderRadius: 10, padding: 'clamp(14px, 2vw, 22px)',
        border: '1px solid #D5CEBC', overflow: 'hidden',
      }}>
        {/* Top bar — greeting */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 16, paddingBottom: 12,
          borderBottom: '1px solid #D5CEBC',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#F7F4EC', border: '1px solid #D5CEBC',
          }}>
            <NexusIcon size={13} />
          </div>
          <span style={{
            fontFamily: font.heading, fontWeight: 400,
            fontSize: 13, color: '#2C2416',
          }}>Good morning, Sarah</span>
          <span style={{
            marginLeft: 'auto', fontFamily: font.body, fontSize: 9,
            color: '#706858', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Morning Briefing</span>
        </div>

        {/* Hero KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Net Revenue', value: '$1.2M', delta: '+6.8%', up: true },
            { label: 'Gross Margin', value: '48.2%', delta: '+0.8pp', up: true },
            { label: 'AOV', value: '$98', delta: '+$4', up: true },
          ].map((kpi, i) => (
            <div key={i} style={{
              background: '#F7F4EC', borderRadius: 8, padding: 10, textAlign: 'center',
              border: '1px solid #D5CEBC', boxShadow: '0 1px 3px rgba(60,48,20,0.08)',
            }}>
              <div style={{ fontFamily: font.body, fontSize: 8, color: '#706858', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{kpi.label}</div>
              <div style={{ fontFamily: font.heading, fontSize: 15, fontWeight: 600, color: '#2C2416' }}>{kpi.value}</div>
              <div style={{ fontFamily: font.body, fontSize: 9, color: kpi.up ? '#0B6E44' : '#C0392B', marginTop: 2, fontWeight: 500 }}>{kpi.delta}</div>
            </div>
          ))}
        </div>

        {/* Operating narrative */}
        <div style={{
          background: '#F7F4EC', borderRadius: 8, padding: 12,
          border: '1px solid #D5CEBC', marginBottom: 12,
        }}>
          <p style={{ fontFamily: font.body, fontSize: 11, color: '#5C5243', lineHeight: 1.6 }}>
            2,840 transactions averaging 3.2 items per basket. Flower category up 8.2% — edibles flat. Logan Square leading portfolio at $98 AOV.
          </p>
        </div>

        {/* Smart alert */}
        <div style={{
          background: '#F7F4EC', borderRadius: 8, padding: 12,
          border: '1px solid #D5CEBC', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 1px 3px rgba(60,48,20,0.08)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C0392B' }} />
              <span style={{ fontFamily: font.body, fontSize: 10, color: '#C0392B', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>OOS Alert</span>
            </div>
            <span style={{ fontFamily: font.body, fontSize: 11, color: '#2C2416', fontWeight: 500 }}>Blue Dream 3.5g</span>
            <span style={{ fontFamily: font.body, fontSize: 10, color: '#706858' }}> — Logan Square</span>
          </div>
          <button style={{
            fontFamily: font.body, fontSize: 10, fontWeight: 600,
            padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
            border: 'none', background: '#0B6E44', color: '#fff',
            whiteSpace: 'nowrap',
          }}>
            Transfer 38
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferMockup() {
  return (
    <div style={{
      background: '#D8D2C4', borderRadius: 14, padding: 6,
      boxShadow: '0 8px 32px rgba(60,48,20,0.12), 0 2px 8px rgba(60,48,20,0.06)',
    }}>
      <div style={{
        background: '#EDE8DC', borderRadius: 10, padding: 'clamp(14px, 2vw, 22px)',
        border: '1px solid #D5CEBC', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, paddingBottom: 12,
          borderBottom: '1px solid #D5CEBC',
        }}>
          <div>
            <span style={{ fontFamily: font.body, fontSize: 9, color: '#7A5F12', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Floor Restock</span>
            <div style={{ fontFamily: font.heading, fontSize: 13, fontWeight: 500, color: '#2C2416', marginTop: 2 }}>Ascend Logan Square</div>
          </div>
          <span style={{ fontFamily: font.body, fontSize: 9, color: '#706858' }}>4 items below par</span>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 44px 44px 44px 44px', gap: 6, alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
          <div />
          <span style={{ fontFamily: font.body, fontSize: 8, color: '#706858', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Product</span>
          <span style={{ fontFamily: font.body, fontSize: 8, color: '#706858', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Floor</span>
          <span style={{ fontFamily: font.body, fontSize: 8, color: '#706858', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Par</span>
          <span style={{ fontFamily: font.body, fontSize: 8, color: '#706858', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Vault</span>
          <span style={{ fontFamily: font.body, fontSize: 8, color: '#706858', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Pull</span>
        </div>

        {/* Product rows */}
        {[
          { name: 'Blue Dream 3.5g', floor: 2, par: 40, vault: 45, pull: 38, checked: true },
          { name: 'Gelato Cart 0.5g', floor: 5, par: 24, vault: 30, pull: 19, checked: true },
          { name: 'Gummies 10pk', floor: 8, par: 20, vault: 22, pull: 12, checked: true },
          { name: 'Preroll 5pk Sativa', floor: 3, par: 16, vault: 18, pull: 13, checked: false },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '20px 1fr 44px 44px 44px 44px', gap: 6, alignItems: 'center',
            background: '#F7F4EC', borderRadius: 6, padding: '8px 4px', marginBottom: 4,
            border: '1px solid #D5CEBC',
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: 3,
              border: row.checked ? 'none' : '1.5px solid #D5CEBC',
              background: row.checked ? '#0B6E44' : '#F7F4EC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {row.checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>&#10003;</span>}
            </div>
            <span style={{ fontFamily: font.body, fontSize: 11, fontWeight: 500, color: '#2C2416', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
            <span style={{ fontFamily: font.body, fontSize: 11, color: row.floor < row.par * 0.25 ? '#C0392B' : '#5C5243', textAlign: 'center', fontWeight: 600 }}>{row.floor}</span>
            <span style={{ fontFamily: font.body, fontSize: 11, color: '#706858', textAlign: 'center' }}>{row.par}</span>
            <span style={{ fontFamily: font.body, fontSize: 11, color: '#5C5243', textAlign: 'center' }}>{row.vault}</span>
            <span style={{ fontFamily: font.body, fontSize: 11, color: '#0B6E44', textAlign: 'center', fontWeight: 600 }}>{row.pull}</span>
          </div>
        ))}

        {/* Create Transfer button */}
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button style={{
            fontFamily: font.body, fontSize: 11, fontWeight: 600,
            padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
            border: 'none', background: '#0B6E44', color: '#fff',
            boxShadow: '0 2px 8px rgba(11,110,68,0.2)',
          }}>
            Create Transfer &middot; 3 items
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignMockup() {
  return (
    <div style={{
      background: '#D8D2C4', borderRadius: 14, padding: 6,
      boxShadow: '0 8px 32px rgba(60,48,20,0.12), 0 2px 8px rgba(60,48,20,0.06)',
    }}>
      <div style={{
        background: '#EDE8DC', borderRadius: 10, padding: 'clamp(14px, 2vw, 22px)',
        border: '1px solid #D5CEBC', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, paddingBottom: 12,
          borderBottom: '1px solid #D5CEBC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: font.heading, fontSize: 14, fontWeight: 500, color: '#2C2416' }}>Win-Back Campaign</span>
            <span style={{
              fontFamily: font.body, fontSize: 8, fontWeight: 600, color: '#7A5F12',
              padding: '2px 8px', borderRadius: 4,
              background: '#7A5F1215', border: '1px solid #7A5F1225',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Automated</span>
          </div>
          <span style={{ fontFamily: font.body, fontSize: 9, color: '#706858' }}>Growth Agent</span>
        </div>

        {/* Audience */}
        <div style={{
          background: '#F7F4EC', borderRadius: 8, padding: 12, marginBottom: 12,
          border: '1px solid #D5CEBC',
        }}>
          <div style={{ fontFamily: font.body, fontSize: 9, color: '#706858', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Audience</div>
          <div style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 600, color: '#2C2416', marginBottom: 2 }}>1,247</div>
          <span style={{ fontFamily: font.body, fontSize: 11, color: '#5C5243' }}>at-risk customers &middot; no visit in 45+ days</span>
        </div>

        {/* Channel cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { channel: 'Email', reach: '1,247', active: true },
            { channel: 'SMS', reach: '1,081', active: true },
            { channel: 'Push', reach: '634', active: true },
          ].map((ch, i) => (
            <div key={i} style={{
              background: '#F7F4EC', borderRadius: 8, padding: 10, textAlign: 'center',
              border: `1px solid ${ch.active ? '#0B6E4440' : '#D5CEBC'}`,
              boxShadow: ch.active ? '0 1px 4px rgba(11,110,68,0.08)' : 'none',
            }}>
              <div style={{ fontFamily: font.body, fontSize: 11, fontWeight: 600, color: ch.active ? '#0B6E44' : '#706858', marginBottom: 2 }}>{ch.channel}</div>
              <div style={{ fontFamily: font.body, fontSize: 10, color: '#5C5243' }}>{ch.reach} reach</div>
            </div>
          ))}
        </div>

        {/* Waterfall sequence */}
        <div style={{
          background: '#F7F4EC', borderRadius: 8, padding: 12, marginBottom: 12,
          border: '1px solid #D5CEBC',
        }}>
          <div style={{ fontFamily: font.body, fontSize: 9, color: '#706858', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Waterfall Sequence</div>
          {[
            { day: 'Day 0', action: 'SMS: "We miss you — 20% off your next visit"' },
            { day: 'Day 3', action: 'Email with personalized product recs' },
            { day: 'Day 7', action: 'Push notification to non-converters' },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: i < 2 ? 6 : 0,
            }}>
              <span style={{ fontFamily: font.heading, fontSize: 10, fontWeight: 600, color: '#7A5F12', flexShrink: 0, width: 36 }}>{step.day}</span>
              <div style={{ width: 1, height: 12, background: '#D5CEBC', flexShrink: 0 }} />
              <span style={{ fontFamily: font.body, fontSize: 10, color: '#5C5243' }}>{step.action}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'right' }}>
          <button style={{
            fontFamily: font.body, fontSize: 11, fontWeight: 600,
            padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
            border: 'none', background: '#0B6E44', color: '#fff',
            boxShadow: '0 2px 8px rgba(11,110,68,0.2)',
          }}>
            Create Campaign Package
          </button>
        </div>
      </div>
    </div>
  );
}

const PILLARS = [
  {
    number: '01',
    label: 'VISIBILITY',
    headline: 'Your entire portfolio in one morning briefing',
    body: 'Net revenue, margin, stockouts, customer health \u2014 across every store, updated before you pour your coffee. Smart alerts surface problems and suggest solutions. You decide what to act on.',
    stat: 'Operators report saving 2+ hours every morning',
    Mockup: CommandCenterMockup,
  },
  {
    number: '02',
    label: 'ACTION',
    headline: 'From insight to action in one click',
    body: 'Blue Dream is out at Logan Square \u2014 45 units sitting in vault. Transfer with one click, METRC updated automatically. Need to reorder? The agent bundles by vendor, surfaces brand-funded discounts, and drafts POs you approve. Compliance built in, not bolted on.',
    stat: 'Average $2,400/month saved on inventory waste per location',
    Mockup: TransferMockup,
  },
  {
    number: '03',
    label: 'GROWTH',
    headline: 'Marketing that runs while you sleep',
    body: '1,247 customers haven\u2019t visited in 45 days. A win-back campaign builds itself \u2014 email, SMS, push in a waterfall sequence. The right discount at the right time, with TCPA compliance handled. You review the plan and approve. It launches across every channel.',
    stat: 'Win-back campaigns recover 12% of lapsed customers within 30 days',
    Mockup: CampaignMockup,
  },
];

function PillarSection({ pillar, index }) {
  const reversed = index === 1;
  const mockupSide = (
    <div style={{ flex: '0 0 58%', maxWidth: '58%' }} className="v2-pillar-mockup">
      <pillar.Mockup />
    </div>
  );
  const textSide = (
    <div style={{ flex: '0 0 38%', maxWidth: '38%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="v2-pillar-text">
      <FadeIn delay={0.1}>
        <p style={{
          fontFamily: font.body, fontSize: 11, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: T.gold, marginBottom: 16,
        }}>
          {pillar.number} / {pillar.label}
        </p>
        <h3 style={{
          fontFamily: font.heading, fontWeight: 500,
          fontSize: 'clamp(22px, 3vw, 28px)', color: T.text,
          lineHeight: 1.3, marginBottom: 20,
        }}>
          {pillar.headline}
        </h3>
        <p style={{
          fontFamily: font.body, fontSize: 15, lineHeight: 1.75,
          color: T.secondary, marginBottom: 28,
        }}>
          {pillar.body}
        </p>
        <div style={{
          borderLeft: `2px solid ${T.gold}`, paddingLeft: 16,
        }}>
          <p style={{
            fontFamily: font.body, fontSize: 13, lineHeight: 1.6,
            color: T.muted, fontStyle: 'italic',
          }}>
            {pillar.stat}
          </p>
        </div>
      </FadeIn>
    </div>
  );

  return (
    <div style={{
      maxWidth: 1100, margin: '0 auto',
      padding: '80px 24px',
    }}>
      <FadeIn>
        <div className="v2-pillar-row" style={{
          display: 'flex', gap: 'clamp(32px, 5vw, 64px)',
          alignItems: 'center',
          flexDirection: reversed ? 'row-reverse' : 'row',
        }}>
          {mockupSide}
          {textSide}
        </div>
      </FadeIn>
      {/* Divider */}
      {index < PILLARS.length - 1 && (
        <div style={{ height: 1, background: T.border, margin: '0 auto', maxWidth: 200, marginTop: 80 }} />
      )}
    </div>
  );
}

function PillarsSection() {
  return (
    <section>
      {PILLARS.map((p, i) => (
        <PillarSection key={i} pillar={p} index={i} />
      ))}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3.5: ALWAYS IN CONTROL — Human approval workflows
// ─────────────────────────────────────────────────────────────────────────────

const APPROVAL_WORKFLOWS = [
  {
    title: 'Brand Discount to Promotion',
    steps: [
      {
        label: 'Jeeter offers 20% brand-funded discount',
        detail: '$5,000 funding cap / Apr 1\u201330 / All Jeeter Live Resin',
        borderColor: T.gold,
        bg: T.surface,
      },
      {
        label: 'You review terms and margin impact',
        detail: 'Your margin increases from 42% to 50% / Est. $840/mo in brand-funded savings',
        borderColor: T.border,
        bg: T.surface,
        checkmark: true,
      },
      {
        label: 'Accept and announce the special',
        detail: 'Discount auto-applies at POS / Campaign promotes "20% off Jeeter Live Resin" via email, SMS, push',
        borderColor: T.green,
        bg: T.surface,
      },
      {
        label: 'Live across all channels',
        detail: 'Customers see the deal on your menu, in their inbox, and at checkout',
        borderColor: T.green,
        bg: T.surface,
        greenBadge: true,
      },
    ],
    note: 'The brand funds the discount \u2014 no cost to you. The agent calculates the margin impact, drafts the promotional campaign, and you approve before anything goes live.',
  },
  {
    title: 'Purchase Order with Approval',
    steps: [
      {
        label: 'Agent drafts a Jeeter reorder',
        detail: '4 products below safety stock / Bundles with active 20% BFD / Meets $1K vendor minimum',
        borderColor: T.border,
        bg: T.surface,
      },
      {
        label: 'You review the PO line by line',
        detail: 'PO-2026-0847 / $3,420 across 4 SKUs / Quantities based on 28-day velocity',
        borderColor: T.border,
        bg: T.surface,
        checkmark: true,
      },
      {
        label: 'PO exceeds your $2K approval threshold',
        detail: 'Automatically routed to Katie G. (Regional Buyer) with your urgency note',
        borderColor: T.gold,
        bg: T.surface,
        goldBadge: true,
      },
      {
        label: 'Approved and sent to Jeeter via Connect',
        detail: 'PO transmitted digitally / Est. delivery Apr 5\u20137 / You\u2019ll be notified when shipped',
        borderColor: T.green,
        bg: T.surface,
        checkmark: true,
      },
    ],
    note: 'You set the dollar threshold. POs below it go straight to the vendor. Above it, they route for approval. The agent handles the bundling, math, and compliance \u2014 you handle the judgment calls.',
  },
  {
    title: 'Inventory Transfer with Compliance',
    steps: [
      {
        label: 'Blue Dream is out of stock on the floor',
        detail: '0 units on display / 45 units sitting in your vault / Losing ~$400/day in sales',
        borderColor: T.border,
        bg: T.surface,
      },
      {
        label: 'Agent builds a transfer worksheet',
        detail: '8 products need restocking at this store / Top 5 by revenue impact pre-selected / Quantities based on par levels',
        borderColor: T.border,
        bg: T.surface,
      },
      {
        label: 'You review and adjust the pick list',
        detail: 'Change quantities / Add or remove products / Check vault counts before committing',
        borderColor: T.border,
        bg: T.surface,
        checkmark: true,
      },
      {
        label: 'Transferred and logged in METRC',
        detail: 'Room-to-room transfer recorded / Pick list sent to vault manager / No manifest required',
        borderColor: T.green,
        bg: T.surface,
        checkmark: true,
        metrcBadge: true,
      },
    ],
    note: 'Vault-to-floor is a room change, not a store-to-store transfer \u2014 no manifest required. The agent identifies what needs restocking and calculates quantities from par levels and velocity. You approve the final list.',
  },
];

function WorkflowStepCard({ step, index }) {
  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 0,
      background: step.bg,
      border: `1.5px solid ${step.borderColor}`,
      borderRadius: 12,
      padding: '16px 14px',
      position: 'relative',
    }}>
      {/* Top badge area */}
      {step.greenBadge && (
        <span style={{
          position: 'absolute', top: -9, right: 12,
          fontFamily: font.body, fontSize: 9, fontWeight: 700,
          color: '#fff', background: T.green,
          padding: '2px 10px', borderRadius: 10,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>Live</span>
      )}
      {step.goldBadge && (
        <span style={{
          position: 'absolute', top: -9, right: 12,
          fontFamily: font.body, fontSize: 9, fontWeight: 700,
          color: T.gold, background: `${T.gold}15`,
          border: `1px solid ${T.gold}35`,
          padding: '2px 10px', borderRadius: 10,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>Needs Approval</span>
      )}
      {step.metrcBadge && (
        <span style={{
          position: 'absolute', top: -9, right: 12,
          fontFamily: font.body, fontSize: 9, fontWeight: 700,
          color: '#fff', background: T.green,
          padding: '2px 10px', borderRadius: 10,
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>Compliant</span>
      )}

      {/* Step number + checkmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          fontSize: 11, fontWeight: 700, fontFamily: font.body,
          ...(step.checkmark
            ? { background: T.green, color: '#fff' }
            : { background: 'transparent', border: `1.5px solid ${T.border}`, color: T.muted }
          ),
        }}>{step.checkmark ? '\u2713' : index + 1}</span>
        <span style={{
          fontFamily: font.body, fontSize: 12, fontWeight: 600,
          color: T.text, lineHeight: 1.35,
        }}>{step.label}</span>
      </div>
      <p style={{
        fontFamily: font.body, fontSize: 11, color: T.secondary, lineHeight: 1.55,
        margin: 0, paddingLeft: 30,
      }}>{step.detail}</p>
    </div>
  );
}

function WorkflowArrow() {
  return (
    <div className="v2-workflow-arrow" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {/* Horizontal arrow (desktop) */}
      <svg className="v2-arrow-horizontal" width="28" height="12" viewBox="0 0 28 12" fill="none" style={{ display: 'block' }}>
        <line x1="0" y1="6" x2="22" y2="6" stroke={T.gold} strokeWidth="1.5" />
        <polyline points="20,2 26,6 20,10" stroke={T.gold} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Vertical arrow (mobile) */}
      <svg className="v2-arrow-vertical" width="12" height="28" viewBox="0 0 12 28" fill="none" style={{ display: 'none' }}>
        <line x1="6" y1="0" x2="6" y2="22" stroke={T.gold} strokeWidth="1.5" />
        <polyline points="2,20 6,26 10,20" stroke={T.gold} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ApprovalWorkflow({ workflow, isLast }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: 'clamp(20px, 3vw, 32px)',
    }}>
      {/* Workflow title */}
      <p style={{
        fontFamily: font.body, fontSize: 12, fontWeight: 600,
        color: T.gold, letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: 20,
      }}>{workflow.title}</p>

      {/* Steps row */}
      <div className="v2-workflow-steps" style={{
        display: 'flex', alignItems: 'stretch', gap: 8,
      }}>
        {workflow.steps.map((step, i) => (
          <React.Fragment key={i}>
            <WorkflowStepCard step={step} index={i} />
            {i < workflow.steps.length - 1 && <WorkflowArrow />}
          </React.Fragment>
        ))}
      </div>

      {/* Note */}
      <p style={{
        fontFamily: font.body, fontSize: 13, color: T.muted,
        fontStyle: 'italic', lineHeight: 1.6,
        marginTop: 20,
      }}>{workflow.note}</p>
    </div>
  );
}

function AlwaysInControlSection() {
  return (
    <section style={{ padding: 'clamp(80px, 10vw, 120px) 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          {/* Section label */}
          <p style={{
            fontFamily: font.body, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: T.gold, marginBottom: 16, textAlign: 'center',
          }}>
            How It Works
          </p>

          {/* Headline */}
          <h2 style={{
            fontFamily: font.heading, fontWeight: 300,
            fontSize: 36, color: T.text,
            lineHeight: 1.3, marginBottom: 16, textAlign: 'center',
          }}>
            Agents recommend. You decide.
          </h2>

          {/* Subtitle */}
          <p style={{
            fontFamily: font.body, fontSize: 16, color: T.secondary,
            lineHeight: 1.6, maxWidth: 560, margin: '0 auto 56px',
            textAlign: 'center',
          }}>
            Every action flows through your approval. Nothing happens until you say so.
          </p>
        </FadeIn>

        {/* Workflows — vertical stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {APPROVAL_WORKFLOWS.map((wf, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <ApprovalWorkflow
                workflow={wf}
                isLast={i === APPROVAL_WORKFLOWS.length - 1}
              />
              {i < APPROVAL_WORKFLOWS.length - 1 && (
                <div style={{
                  height: 1, background: T.border,
                  margin: '0 auto', maxWidth: 120, marginTop: 48,
                }} />
              )}
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: THE DATA STORY — Full-bleed dark section
// ─────────────────────────────────────────────────────────────────────────────
function DataStorySection() {
  return (
    <section style={{
      background: T.ink, color: T.bg, padding: 'clamp(80px, 10vw, 140px) 24px',
      textAlign: 'center',
    }}>
      <FadeIn>
        <p style={{
          fontFamily: font.heading, fontWeight: 200,
          fontSize: 'clamp(48px, 8vw, 96px)', letterSpacing: '-0.02em',
          lineHeight: 1.05, marginBottom: 28,
          color: T.bg,
        }}>
          $100 billion
        </p>
      </FadeIn>
      <FadeIn delay={0.15}>
        <p style={{
          fontFamily: font.body, fontWeight: 300,
          fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.7,
          color: '#ADA599', maxWidth: 700, margin: '0 auto 72px',
        }}>
          in cannabis transactions, processed through Dutchie. Every recommendation nexus makes draws from this -- the largest cannabis dataset in the industry.
        </p>
      </FadeIn>

      <FadeIn delay={0.25}>
        <div className="v2-data-cols" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40,
          maxWidth: 900, margin: '0 auto', textAlign: 'left',
        }}>
          {[
            {
              title: 'Benchmark',
              desc: 'See how your prices, margins, and velocity compare to thousands of dispensaries. Not industry averages \u2014 real operator data.',
            },
            {
              title: 'Predict',
              desc: 'POS transactions plus ecommerce browsing data create demand signals. nexus sees what will sell before you stock it.',
            },
            {
              title: 'Optimize',
              desc: 'Connect marketplace data shows what\u2019s available, at what price, with which discounts. Your purchasing agent uses all of it.',
            },
          ].map((item, i) => (
            <div key={i}>
              <h4 style={{
                fontFamily: font.heading, fontWeight: 500, fontSize: 16,
                color: T.bg, marginBottom: 10, lineHeight: 1.35,
              }}>
                {item.title}
              </h4>
              <p style={{
                fontFamily: font.body, fontSize: 14, lineHeight: 1.7,
                color: '#8A8278',
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: THE AGENTS — Clean card grid
// ─────────────────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    icon: 'ShoppingCart',
    name: 'Purchasing Agent',
    desc: 'Drafts POs, manages vault-to-floor transfers, and surfaces brand-funded discounts. You review and approve.',
    features: ['Auto-generated POs from demand signals', 'One-click transfers across stores', 'Brand-funded discount surfacing'],
    color: T.green,
  },
  {
    icon: 'CircleDollarSign',
    name: 'Pricing & Margins',
    desc: 'Benchmarks your prices against thousands of dispensaries and recommends margin-optimal pricing with compliance guardrails.',
    features: ['Network-wide price benchmarking', 'Margin-aware price recommendations', 'State-specific compliance checks'],
    color: T.gold,
  },
  {
    icon: 'Megaphone',
    name: 'Growth Agent',
    desc: 'Builds campaigns from real POS data. Welcome series, win-backs, VIP rewards \u2014 deployed across email, SMS, and push.',
    features: ['POS-powered customer segmentation', 'Automated waterfall workflows', 'ROI attribution to transactions'],
    color: T.secondary,
  },
  {
    icon: 'NexusIcon',
    name: 'Dex',
    desc: 'Ask anything about your business in natural language. Dex queries all agents and returns answers in seconds.',
    features: ['Cross-agent intelligence queries', 'Executive summary generation', 'Custom reports on demand'],
    color: '#4A6F8A',
  },
];

const AGENT_ICONS = {
  ShoppingCart,
  CircleDollarSign,
  Megaphone,
};

function AgentsSection() {
  return (
    <section style={{ padding: 'clamp(80px, 10vw, 120px) 24px' }}>
      <FadeIn>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{
            fontFamily: font.heading, fontWeight: 300,
            fontSize: 'clamp(26px, 4vw, 36px)', color: T.text,
            lineHeight: 1.3,
          }}>
            Four agents. One operations partner.
          </h2>
        </div>
      </FadeIn>

      <div className="v2-agents-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24,
        maxWidth: 900, margin: '0 auto',
      }}>
        {AGENTS.map((agent, i) => {
          const IconComponent = AGENT_ICONS[agent.icon];
          return (
            <FadeIn key={i} delay={i * 0.08}>
              <div style={{
                border: `1px solid ${T.border}`,
                borderRadius: 12, padding: 28,
                boxShadow: `0 1px 3px rgba(60,48,20,0.06)`,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                background: 'transparent',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 4px 20px rgba(60,48,20,0.1)`;
                  e.currentTarget.style.borderColor = T.darker;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = `0 1px 3px rgba(60,48,20,0.06)`;
                  e.currentTarget.style.borderColor = T.border;
                }}
              >
                {/* Agent icon */}
                <div style={{ marginBottom: 16 }}>
                  {agent.icon === 'NexusIcon' ? (
                    <NexusIcon size={32} />
                  ) : IconComponent ? (
                    <IconComponent size={32} strokeWidth={1.5} style={{ color: agent.color }} />
                  ) : null}
                </div>

                <h3 style={{
                  fontFamily: font.heading, fontWeight: 400, fontSize: 20,
                  color: T.text, marginBottom: 10,
                }}>
                  {agent.name}
                </h3>

                <p style={{
                  fontFamily: font.body, fontSize: 14, lineHeight: 1.65,
                  color: T.secondary, marginBottom: 20,
                }}>
                  {agent.desc}
                </p>

                {agent.features.map((f, fi) => (
                  <div key={fi} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: fi < agent.features.length - 1 ? 6 : 0,
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: T.green, flexShrink: 0,
                    }} />
                    <span style={{ fontFamily: font.body, fontSize: 13, color: T.muted }}>{f}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6: BUILT FOR SCALE — Typography-driven
// ─────────────────────────────────────────────────────────────────────────────

const SCALE_FEATURES = [
  { name: 'Cross-store visibility', desc: 'See every SKU across every location. Transfer between stores in one click.' },
  { name: 'State-specific compliance', desc: 'METRC, BioTrack, MJ Freeway -- nexus adapts to your state\'s traceability system automatically.' },
  { name: 'Contribution margin tracking', desc: 'Track true profitability per store, per category, per SKU -- not just revenue.' },
  { name: 'Goal setting by store', desc: 'Set revenue targets, margin goals, and labor cost benchmarks. nexus alerts you when stores drift.' },
  { name: 'Portfolio vs. store benchmarking', desc: 'Compare individual store performance against your own portfolio average and the broader network.' },
];

function BuiltForScaleSection() {
  return (
    <section style={{ padding: 'clamp(80px, 10vw, 120px) 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <FadeIn>
          <p style={{
            fontFamily: font.heading, fontWeight: 300,
            fontSize: 'clamp(22px, 3.5vw, 30px)', color: T.text,
            lineHeight: 1.4, marginBottom: 64,
          }}>
            Built for operators who manage more than one store.
          </p>
        </FadeIn>

        {SCALE_FEATURES.map((f, i) => (
          <FadeIn key={i} delay={i * 0.06}>
            <div style={{ marginBottom: i < SCALE_FEATURES.length - 1 ? 0 : 0 }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '28px 0' }}>
                <span style={{
                  fontFamily: font.heading, fontWeight: 200, fontSize: 48,
                  color: T.gold, lineHeight: 1, flexShrink: 0,
                  width: 56, textAlign: 'right',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4 style={{
                    fontFamily: font.heading, fontWeight: 500, fontSize: 18,
                    color: T.text, marginBottom: 6, lineHeight: 1.3,
                  }}>
                    {f.name}
                  </h4>
                  <p style={{
                    fontFamily: font.body, fontSize: 14, lineHeight: 1.65,
                    color: T.secondary,
                  }}>
                    {f.desc}
                  </p>
                </div>
              </div>
              {i < SCALE_FEATURES.length - 1 && (
                <div style={{ height: 1, background: T.border, marginLeft: 80 }} />
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 7: SOCIAL PROOF — Minimal editorial quotes
// ─────────────────────────────────────────────────────────────────────────────

const QUOTES = [
  {
    text: 'I used to spend Monday mornings pulling revenue reports from 12 stores into a spreadsheet. Now I open nexus and the briefing tells me everything \u2014 including what to do about it.',
    name: 'VP of Operations',
    role: 'Multi-State Operator, 14 locations',
  },
  {
    text: 'The inventory agent flagged a Blue Dream stockout at 6am and suggested a vault transfer before we opened. That\u2019s $400 in daily revenue we would have lost.',
    name: 'Store Manager',
    role: 'Illinois',
  },
  {
    text: 'Building purchase orders across 8 vendors used to take me half a day. Now the agent drafts them, surfaces brand discounts I would have missed, and I just review and approve.',
    name: 'Buyer',
    role: 'New Jersey MSO',
  },
];

function SocialProofSection() {
  return (
    <section style={{ padding: 'clamp(80px, 10vw, 120px) 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {QUOTES.map((q, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{
                fontFamily: font.heading, fontWeight: 300, fontStyle: 'italic',
                fontSize: 'clamp(18px, 2.5vw, 22px)', lineHeight: 1.65,
                color: T.text, marginBottom: 20,
              }}>
                "{q.text}"
              </p>
              <p style={{
                fontFamily: font.body, fontSize: 12, color: T.muted,
                letterSpacing: '0.04em',
              }}>
                {q.name} &middot; {q.role}
              </p>
            </div>
            {i < QUOTES.length - 1 && (
              <div style={{ width: 60, height: 1, background: T.gold, margin: '0 auto' }} />
            )}
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 8: THE CLOSE
// ─────────────────────────────────────────────────────────────────────────────
function CloseSection() {
  return (
    <section id="v2-close" style={{
      padding: 'clamp(80px, 10vw, 120px) 24px 80px', textAlign: 'center',
    }}>
      <FadeIn>
        <h2 style={{
          fontFamily: font.heading, fontWeight: 300,
          fontSize: 'clamp(26px, 4vw, 38px)', color: T.text,
          lineHeight: 1.3, marginBottom: 36, letterSpacing: '-0.01em',
        }}>
          Ready to see what intelligence looks like?
        </h2>

        <button
          onClick={() => {}}
          style={{
            fontFamily: font.body, fontSize: 16, fontWeight: 600,
            padding: '16px 40px', borderRadius: 8, cursor: 'pointer',
            border: 'none', background: T.green, color: '#fff',
            boxShadow: '0 4px 16px rgba(11,110,68,0.2)',
            transition: 'all 0.2s',
            marginBottom: 20,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = T.greenLight;
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(11,110,68,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = T.green;
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,110,68,0.2)';
          }}
        >
          Request Access
        </button>

        <p style={{
          fontFamily: font.body, fontSize: 14, color: T.secondary,
          marginBottom: 56,
        }}>
          Already on Dutchie? You're halfway there.
        </p>

        {/* Closing brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.5 }}>
          <NexusIcon size={24} />
        </div>
        <p style={{
          fontFamily: font.heading, fontWeight: 300,
          fontSize: 11, color: T.muted, letterSpacing: '0.1em',
          marginTop: 10,
        }}>
          nexus by Dutchie
        </p>
      </FadeIn>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function NexusMarketingV2() {
  const containerRef = useRef(null);
  const [showNav, setShowNav] = useState(false);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const scrollTop = container.scrollTop;
      // Show nav after scrolling past hero
      setShowNav(scrollTop > window.innerHeight * 0.7);
      // Show floating CTA after scrolling past opening statement (~2 sections)
      setShowFloatingCTA(scrollTop > window.innerHeight * 1.5);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, overflow: 'auto',
        background: T.bg, color: T.text,
        fontFamily: font.body,
      }}
    >
      <FloatingNav visible={showNav} />

      <HeroSection />
      <OpeningStatement />
      <PillarsSection />
      <AlwaysInControlSection />
      <DataStorySection />
      <AgentsSection />
      <BuiltForScaleSection />
      <SocialProofSection />
      <CloseSection />

      <FloatingCTA visible={showFloatingCTA} />

      <style>{`
        /* Pulsing Nexus icon */
        @keyframes v2-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .v2-pulse-icon {
          animation: v2-pulse 4s ease-in-out infinite;
        }

        /* Chevron bounce */
        @keyframes v2-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }
        .v2-chevron {
          animation: v2-bounce 2.5s ease-in-out infinite;
        }

        /* Responsive: stack pillars on mobile */
        @media (max-width: 820px) {
          .v2-pillar-row {
            flex-direction: column !important;
          }
          .v2-pillar-mockup,
          .v2-pillar-text {
            flex: 1 1 100% !important;
            max-width: 100% !important;
          }
          .v2-agents-grid {
            grid-template-columns: 1fr !important;
          }
          .v2-data-cols {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .v2-workflow-steps {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0 !important;
          }
          .v2-workflow-steps > div:first-child,
          .v2-workflow-steps > div:nth-child(odd):not(.v2-workflow-arrow) {
            flex: 1 1 auto !important;
          }
          .v2-arrow-horizontal {
            display: none !important;
          }
          .v2-arrow-vertical {
            display: block !important;
          }
          .v2-workflow-arrow {
            padding: 6px 0 !important;
          }
        }

        /* Smooth scroll behavior */
        * { scroll-behavior: smooth; }

        /* Selection color */
        ::selection {
          background: ${T.gold}30;
          color: ${T.ink};
        }
      `}</style>
    </div>
  );
}
