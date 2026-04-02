import React, { useState, useEffect, useRef } from 'react';
import NexusIcon from '../components/NexusIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Theme & Design Tokens -- exact match to [data-theme="light"] in index.css
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  // Surface
  bg:          '#EDE8DC',   // --color-surface-bg
  surface:     '#F7F4EC',   // --color-surface-card
  surfaceDeep: '#E4DFCF',   // --color-surface-hover
  surfaceMuted:'#E8E3D5',   // --color-surface-muted
  // Text
  text:        '#2C2416',   // --color-text-primary
  secondary:   '#5C5243',   // --color-text-secondary
  muted:       '#706858',   // --color-text-muted
  // Accents
  gold:        '#7A5F12',   // --color-accent-gold
  green:       '#0B6E44',   // --color-accent-green
  greenHover:  '#0A5F3B',
  // Borders
  border:      '#D5CEBC',   // --color-surface-border
  // Shadows -- from --shadow-card / --shadow-elevated
  shadowCard:  '0 1px 3px rgba(60,48,20,0.08), 0 1px 2px rgba(60,48,20,0.04)',
  shadowHover: '0 4px 16px rgba(60,48,20,0.12), 0 1px 3px rgba(60,48,20,0.06)',
  shadowDeep:  '0 8px 32px rgba(60,48,20,0.14), 0 2px 8px rgba(60,48,20,0.08)',
};

const font = {
  heading: "'DM Sans', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
};

// Spacing scale: 16 / 24 / 32 / 48 / 64 / 80 / 120

// ─────────────────────────────────────────────────────────────────────────────
// Sections Config
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'hero', label: 'Overview' },
  { id: 'problem', label: 'The Problem' },
  { id: 'command-center', label: 'Command Center' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'multi-location', label: 'Multi-Location' },
  { id: 'data', label: 'Data Advantage' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'cta', label: 'Get Started' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────────────────────────────────────

function SectionNav({ active }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: T.bg,
      borderBottom: `1px solid ${T.border}`,
      padding: '0 24px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 4, overflowX: 'auto', padding: '10px 0' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)} style={{
            background: 'transparent',
            border: 'none',
            borderBottom: active === s.id ? `2px solid ${T.gold}` : '2px solid transparent',
            borderRadius: 0, padding: '4px 12px', cursor: 'pointer',
            fontFamily: font.body, fontSize: 12, fontWeight: 500,
            color: active === s.id ? T.gold : T.muted,
            whiteSpace: 'nowrap', transition: 'color 0.2s, border-color 0.2s',
          }}>
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Section({ id, children, style = {} }) {
  return (
    <section id={id} style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto', ...style }}>
      {children}
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: font.body, fontSize: 11, fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: T.muted, marginBottom: 16,
    }}>
      {children}
    </p>
  );
}

function SectionTitle({ sub, title, desc, center = false }) {
  return (
    <div style={{ marginBottom: 48, textAlign: center ? 'center' : 'left' }}>
      {sub && <SectionLabel>{sub}</SectionLabel>}
      <h2 style={{
        fontFamily: font.heading, fontWeight: 300,
        fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.01em',
        color: T.text, lineHeight: 1.25,
        marginBottom: desc ? 16 : 0,
      }}>
        {title}
      </h2>
      {desc && (
        <p style={{
          fontFamily: font.body, fontSize: 16, fontWeight: 400, lineHeight: 1.7,
          color: T.secondary, maxWidth: center ? 640 : 680,
          margin: center ? '0 auto' : undefined,
        }}>
          {desc}
        </p>
      )}
    </div>
  );
}

function Card({ children, style = {}, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12, padding: 24,
        transition: 'box-shadow 0.25s ease, transform 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? T.shadowHover : T.shadowCard,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: font.body, fontSize: 'clamp(28px, 4vw, 40px)',
        fontWeight: 700, color: T.text,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
      }}>
        {value}
      </div>
      <div style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, color: T.muted, marginTop: 8 }}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: T.border, margin: '0 auto', maxWidth: 1100 }} />;
}

function CTAButton({ children, primary = false, onClick, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: font.body, fontSize: 14, fontWeight: 600,
        padding: '12px 28px', borderRadius: 8, cursor: 'pointer',
        border: primary ? 'none' : `1px solid ${T.border}`,
        background: primary
          ? (hovered ? T.greenHover : T.green)
          : (hovered ? T.surfaceDeep : 'transparent'),
        color: primary ? '#FFFFFF' : T.text,
        transition: 'all 0.2s ease',
        boxShadow: primary ? '0 2px 8px rgba(11,110,68,0.2)' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating CTA
// ─────────────────────────────────────────────────────────────────────────────

function FloatingCTA({ visible }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <button
        onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          fontFamily: font.body, fontSize: 12, fontWeight: 600,
          padding: '10px 20px', borderRadius: 20, cursor: 'pointer',
          border: 'none',
          background: hovered ? T.greenHover : T.green,
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(11,110,68,0.25)',
          transition: 'all 0.2s ease',
        }}
      >
        Request Access
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: Hero
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <Section id="hero" style={{ padding: '120px 24px 80px', textAlign: 'center', position: 'relative' }}>
      {/* Nexus Icon -- 48px, clean on parchment, no glow */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 48, height: 48, marginBottom: 32,
      }}>
        <NexusIcon size={48} />
      </div>

      <h1 style={{
        fontFamily: font.heading, fontWeight: 300,
        fontSize: 'clamp(28px, 4.5vw, 44px)', letterSpacing: '-0.01em',
        color: T.text, lineHeight: 1.2, marginBottom: 24,
        maxWidth: 800, margin: '0 auto 24px',
      }}>
        Your dispensary runs on data.{' '}
        <span style={{ color: T.gold }}>
          nexus makes it run on intelligence.
        </span>
      </h1>

      <p style={{
        fontFamily: font.body, fontSize: 18, fontWeight: 400, lineHeight: 1.7,
        color: T.secondary, maxWidth: 640, margin: '0 auto 48px',
      }}>
        nexus is the AI-powered operations platform from Dutchie. Built on over $100B in processed cannabis transactions, it turns your data into automated actions -- so you can focus on growing, not managing.
      </p>

      {/* Hero stats with vertical dividers */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 0, flexWrap: 'wrap', marginBottom: 48,
      }}>
        <Stat value="6,500+" label="Dispensaries" />
        <div style={{ width: 1, height: 40, background: T.border, margin: '0 clamp(24px, 5vw, 56px)' }} />
        <Stat value="4" label="AI Agents" />
        <div style={{ width: 1, height: 40, background: T.border, margin: '0 clamp(24px, 5vw, 56px)' }} />
        <Stat value="$100B+" label="Transactions processed" />
      </div>

      {/* CTAs -- green solid primary, outlined secondary */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <CTAButton primary onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}>
          Request Access
        </CTAButton>
        <CTAButton onClick={() => document.getElementById('command-center')?.scrollIntoView({ behavior: 'smooth' })}>
          See it in action
        </CTAButton>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: The Problem
// ─────────────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    title: 'You check 6 tabs to understand one store',
    pain: 'Manual report pulling, spreadsheet exports, switching between POS, ecommerce admin, and analytics tools just to get a daily read on performance.',
    after: 'Nexus gives you a morning briefing across every store, every metric, in one sentence.',
    stat: '6 tools',
    statLabel: 'avg. to get a daily report',
  },
  {
    title: 'Stockouts cost you $3,500/day and you find out too late',
    pain: 'Reactive inventory management. By the time you notice a top-seller is out, you\'ve already lost a weekend\'s worth of sales.',
    after: 'Nexus predicts stockouts 3-5 days before they happen and auto-generates transfer or PO recommendations.',
    stat: '$3,500',
    statLabel: 'avg. daily cost of one stockout',
  },
  {
    title: 'Your pricing strategy is a spreadsheet someone updates monthly',
    pain: 'No competitive intelligence, no margin optimization, no awareness of what the dispensary across the street is charging.',
    after: 'Nexus benchmarks your prices against 6,500+ dispensaries and recommends margin-optimized adjustments.',
    stat: '1x/month',
    statLabel: 'avg. pricing review frequency',
  },
  {
    title: 'Marketing campaigns take 3 hours to build and you can\'t measure ROI',
    pain: 'Disconnected tools, manual list building, no attribution back to POS data. You\'re guessing what works.',
    after: 'Nexus builds campaigns in minutes using real POS data and tracks ROI down to the transaction.',
    stat: '3 hours',
    statLabel: 'avg. time to build one campaign',
  },
];

function ProblemSection() {
  return (
    <Section id="problem">
      <SectionTitle
        sub="The Problem"
        title="Your back office is stuck in 2019"
        desc="Cannabis retail has evolved. Your tools haven't. Operators are drowning in manual workflows, disconnected systems, and reactive decision-making."
        center
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {PAIN_POINTS.map((p, i) => (
          <Card key={i}>
            <h3 style={{
              fontFamily: font.heading, fontWeight: 500, fontSize: 17,
              color: T.text, lineHeight: 1.35, marginBottom: 16,
            }}>
              {p.title}
            </h3>

            {/* Before / After */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <p style={{
                  fontFamily: font.body, fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: T.muted, marginBottom: 6,
                }}>
                  Before
                </p>
                <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, lineHeight: 1.7, color: T.muted }}>{p.pain}</p>
              </div>
              <div>
                <p style={{
                  fontFamily: font.body, fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: T.green, marginBottom: 6,
                }}>
                  With Nexus
                </p>
                <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, lineHeight: 1.7, color: T.text }}>{p.after}</p>
              </div>
            </div>

            {/* Stat callout */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, textAlign: 'center' }}>
              <div style={{
                fontFamily: font.body, fontSize: 22, fontWeight: 700,
                color: T.text, fontVariantNumeric: 'tabular-nums',
              }}>
                {p.stat}
              </div>
              <div style={{ fontFamily: font.body, fontSize: 11, fontWeight: 400, color: T.muted, marginTop: 2 }}>{p.statLabel}</div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: Command Center Mockup
// ─────────────────────────────────────────────────────────────────────────────

function CommandCenterSection() {
  return (
    <Section id="command-center" style={{ padding: '120px 24px' }}>
      <SectionTitle
        sub="The Platform"
        title="Meet Nexus -- The Command Center"
        desc="Everything you need to run your dispensary portfolio, in one intelligent view. No more tab-switching, no more spreadsheet exports."
        center
      />

      {/* "Nexus Command Center" label */}
      <p style={{
        fontFamily: font.body, fontSize: 11, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: T.muted, marginBottom: 16, textAlign: 'center',
      }}>
        Nexus Command Center
      </p>

      {/* Mockup container -- deeper parchment surface for depth */}
      <div style={{
        background: T.surfaceDeep, borderRadius: 16,
        border: `1px solid ${T.border}`,
        padding: 'clamp(16px, 3vw, 32px)', position: 'relative',
        boxShadow: T.shadowDeep,
      }}>
        {/* Product interior -- dark theme (the real product) */}
        <div style={{
          background: '#0A0908', borderRadius: 12, padding: 'clamp(16px, 2vw, 24px)',
          border: '1px solid #2E2A24',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 20, paddingBottom: 14,
            borderBottom: '1px solid #2E2A24',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: '#1C1A17', border: '1px solid #3D3529',
            }}>
              <NexusIcon size={16} />
            </div>
            <span style={{
              fontFamily: font.heading, fontWeight: 300,
              letterSpacing: '0.06em', fontSize: 16, color: '#F0EDE8',
            }}>
              nexus
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3D3529' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3D3529' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3D3529' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {/* Morning Briefing */}
            <div style={{ background: '#1C1A17', borderRadius: 10, padding: 18, border: '1px solid #2E2A24' }}>
              <p style={{
                fontFamily: font.body, fontSize: 10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#D4A03A', marginBottom: 10,
              }}>
                AI Morning Briefing
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C27C' }} />
                <span style={{ fontFamily: font.body, fontSize: 11, color: '#00C27C', fontWeight: 500 }}>Live</span>
              </div>
              <p style={{ fontFamily: font.body, fontSize: 12, color: '#ADA599', lineHeight: 1.6, marginBottom: 14 }}>
                Portfolio revenue is up 4.2% vs. last week. Your IL stores are outperforming benchmark by $12K. Two stockout risks flagged in NJ -- transfer recommendations ready.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Revenue', value: '$13.6M', delta: '+4.2%', up: true },
                  { label: 'Margin', value: '48.2%', delta: '+0.8pp', up: true },
                  { label: 'Traffic', value: '175.5K', delta: '-1.1%', up: false },
                ].map((kpi, i) => (
                  <div key={i} style={{ background: '#141210', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: font.body, fontSize: 9, color: '#6B6359', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</div>
                    <div style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 600, color: '#F0EDE8' }}>{kpi.value}</div>
                    <div style={{ fontFamily: font.body, fontSize: 10, color: kpi.up ? '#00C27C' : '#E87068', marginTop: 2 }}>{kpi.delta}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Alerts */}
            <div style={{ background: '#1C1A17', borderRadius: 10, padding: 18, border: '1px solid #2E2A24' }}>
              <p style={{
                fontFamily: font.body, fontSize: 10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#00C27C', marginBottom: 10,
              }}>
                Smart Alerts
              </p>
              <p style={{ fontFamily: font.body, fontSize: 10, color: '#6B6359', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Problems surfaced before you look for them
              </p>
              {[
                { type: 'Stockout Risk', msg: 'Blue Dream 3.5g -- Sunnyside Chicago (2 days supply)', action: 'Transfer from Rockford' },
                { type: 'Margin Alert', msg: 'Flower category margin dropped 1.2pp in OH stores', action: 'View pricing recs' },
                { type: 'Inventory', msg: 'BFD offer from Cresco -- 15% off Flower (expires Thu)', action: 'Review in Connect' },
              ].map((alert, i) => (
                <div key={i} style={{ background: '#141210', borderRadius: 8, padding: 10, marginBottom: i < 2 ? 8 : 0 }}>
                  <span style={{ fontFamily: font.body, fontSize: 9, fontWeight: 600, color: '#D4A03A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{alert.type}</span>
                  <p style={{ fontFamily: font.body, fontSize: 11, color: '#ADA599', lineHeight: 1.5, margin: '4px 0 6px' }}>{alert.msg}</p>
                  <span style={{
                    fontFamily: font.body, fontSize: 10, fontWeight: 500, color: '#00C27C',
                    cursor: 'pointer',
                  }}>
                    {alert.action} &rarr;
                  </span>
                </div>
              ))}
            </div>

            {/* One-Click Actions */}
            <div style={{ background: '#1C1A17', borderRadius: 10, padding: 18, border: '1px solid #2E2A24' }}>
              <p style={{
                fontFamily: font.body, fontSize: 10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#64A8E0', marginBottom: 10,
              }}>
                One-Click Actions
              </p>
              <p style={{ fontFamily: font.body, fontSize: 10, color: '#6B6359', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Transfer inventory, approve POs, launch campaigns
              </p>
              {[
                { label: 'Transfer Blue Dream 3.5g', from: 'Rockford', to: 'Chicago', status: 'Ready', statusColor: '#00C27C' },
                { label: 'PO #4421 -- Cresco Flower', from: 'Auto-generated', to: '3 stores', status: 'Pending', statusColor: '#D4A03A' },
                { label: '4/20 Campaign -- VIP Early Access', from: 'Growth Agent', to: '12,400 customers', status: 'Draft', statusColor: '#B598E8' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#141210', borderRadius: 8, padding: 10, marginBottom: i < 2 ? 8 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: font.body, fontSize: 11, fontWeight: 500, color: '#F0EDE8' }}>{item.label}</span>
                    <span style={{
                      fontFamily: font.body, fontSize: 9, fontWeight: 600, color: item.statusColor,
                      padding: '2px 6px', borderRadius: 4, background: `${item.statusColor}15`,
                    }}>{item.status}</span>
                  </div>
                  <p style={{ fontFamily: font.body, fontSize: 10, color: '#6B6359' }}>{item.from} &rarr; {item.to}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: Four Agents
// ─────────────────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    name: 'Purchasing',
    letter: 'P',
    tint: '#0B6E44',
    desc: 'Reorder the right products at the right time. Vault-to-floor transfers, multi-vendor POs, brand-funded discounts -- all in one workflow.',
    features: ['Auto-generated POs', 'Transfer recommendations', 'BFD deal surfacing'],
  },
  {
    name: 'Pricing & Margins',
    letter: 'M',
    tint: '#7A5F12',
    desc: 'See how your prices compare to 6,500+ dispensaries. Dynamic margin optimization with compliance guardrails.',
    features: ['Network price benchmarking', 'Margin-aware recommendations', 'Compliance guardrails'],
  },
  {
    name: 'Growth',
    letter: 'G',
    tint: '#5C5243',
    desc: 'Build campaigns in minutes, not hours. Automated workflows: welcome series, win-back, VIP rewards -- powered by real POS data.',
    features: ['POS-powered segmentation', 'Automated workflows', 'ROI attribution'],
  },
  {
    name: 'Dex',
    letter: 'D',
    tint: '#4A6F8A',
    desc: 'Ask anything about your business. Dex connects all four agents and answers questions across inventory, pricing, customers, and marketing.',
    features: ['Natural language queries', 'Cross-agent intelligence', 'Executive summaries'],
  },
];

function AgentsSection() {
  return (
    <Section id="agents">
      <SectionTitle
        sub="AI Agents"
        title="Four agents, one platform"
        desc="Each agent is a specialist. Together, they run your operation. You set the goals, they do the work -- you just approve."
        center
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {AGENTS.map((agent, i) => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${agent.tint}10`,
                border: `1px solid ${agent.tint}20`,
              }}>
                <span style={{
                  fontFamily: font.heading, fontSize: 16, fontWeight: 600,
                  color: agent.tint,
                }}>
                  {agent.letter}
                </span>
              </div>
              <h3 style={{
                fontFamily: font.heading, fontWeight: 500, fontSize: 18, color: T.text,
              }}>
                {agent.name}
              </h3>
            </div>

            <p style={{
              fontFamily: font.body, fontSize: 14, fontWeight: 400, lineHeight: 1.7,
              color: T.secondary, marginBottom: 20, flex: 1,
            }}>
              {agent.desc}
            </p>

            {/* Features -- small green dots */}
            <div>
              {agent.features.map((f, fi) => (
                <div key={fi} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: fi < agent.features.length - 1 ? 8 : 0,
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: T.green, flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, color: T.muted }}>{f}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: Multi-Location
// ─────────────────────────────────────────────────────────────────────────────

const MULTI_LOC_FEATURES = [
  { title: 'Cross-store inventory visibility', desc: 'See every SKU across every location. Transfer between stores in one click.' },
  { title: 'Portfolio-level KPIs', desc: 'Revenue, margin, traffic, basket size -- rolled up across your portfolio with store-by-store drill-down.' },
  { title: 'Compliance-aware operations', desc: 'METRC, BioTrack, MJ Freeway -- Nexus understands your state\'s traceability system.' },
  { title: 'Goal setting & tracking', desc: 'Set revenue targets, margin goals, and labor cost benchmarks. Nexus alerts you when stores drift.' },
  { title: 'State-specific regulatory awareness', desc: 'From purchase limits to packaging requirements, Nexus adapts to your state\'s rules.' },
];

function MultiLocationSection() {
  return (
    <Section id="multi-location">
      <SectionTitle
        sub="Built for Scale"
        title="One brain across all your stores"
        desc="Whether you run 3 locations or 30, Nexus gives you a single pane of glass for your entire operation."
        center
      />
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {MULTI_LOC_FEATURES.map((f, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            marginBottom: i < MULTI_LOC_FEATURES.length - 1 ? 24 : 0,
          }}>
            {/* Small green dot */}
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: T.green, flexShrink: 0, marginTop: 8,
            }} />
            <div>
              <span style={{
                fontFamily: font.body, fontWeight: 500, fontSize: 15,
                color: T.text, lineHeight: 1.5,
              }}>
                {f.title}
              </span>
              <span style={{
                fontFamily: font.body, fontWeight: 400, fontSize: 15,
                color: T.secondary, lineHeight: 1.5,
              }}>
                {' '}{f.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6: Data Advantage
// ─────────────────────────────────────────────────────────────────────────────

function DataAdvantageSection() {
  return (
    <Section id="data" style={{ padding: '120px 24px' }}>
      <SectionLabel>The Moat</SectionLabel>

      {/* Large pull-quote number -- DM Sans weight 200, 72px */}
      <div style={{ marginBottom: 16 }}>
        <span style={{
          fontFamily: font.heading, fontWeight: 200,
          fontSize: 72, letterSpacing: '-0.03em',
          color: T.text, lineHeight: 1,
        }}>
          $100 billion
        </span>
      </div>
      <p style={{
        fontFamily: font.body, fontSize: 16, fontWeight: 400, lineHeight: 1.7,
        color: T.secondary, maxWidth: 600, marginBottom: 48,
      }}>
        in cannabis transactions. That's not a number -- it's your competitive edge. Every recommendation nexus makes is backed by the largest cannabis transaction dataset in the industry.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          {
            title: 'Cross-operator benchmarking',
            desc: 'Compare your performance against anonymized data from thousands of dispensaries. Know where you stand on pricing, margin, and product mix.',
          },
          {
            title: 'Demand prediction',
            desc: 'POS data combined with ecommerce browsing behavior creates demand signals no single operator could generate alone.',
          },
          {
            title: 'Supply intelligence',
            desc: 'Brand-funded discounts, vendor availability, and promotional calendars -- surfaced proactively through Dutchie Connect.',
          },
        ].map((item, i) => (
          <div key={i}>
            <h4 style={{
              fontFamily: font.heading, fontWeight: 500, fontSize: 16,
              color: T.text, marginBottom: 8, lineHeight: 1.35,
            }}>
              {item.title}
            </h4>
            <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 400, lineHeight: 1.7, color: T.muted }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 7: Testimonials
// ─────────────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: 'I used to spend Monday mornings pulling reports from 12 stores. Now I open nexus and everything is there.',
    role: 'VP of Operations, Multi-State Operator',
  },
  {
    quote: 'The inventory agent caught a $4,000 stockout before we opened on 4/20. That paid for the whole year.',
    role: 'Store Manager, Illinois',
  },
  {
    quote: 'Building POs used to take me 3 hours. Now the agent drafts them and I just review and approve.',
    role: 'Buyer, New Jersey MSO',
  },
];

function TestimonialsSection() {
  return (
    <Section id="testimonials">
      <SectionTitle
        sub="From Operators"
        title="What operators are saying"
        center
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48 }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} style={{
            borderLeft: `2px solid ${T.gold}`,
            paddingLeft: 24,
          }}>
            <p style={{
              fontFamily: font.heading, fontSize: 20, fontWeight: 300, lineHeight: 1.6,
              color: T.text, fontStyle: 'italic', marginBottom: 16,
            }}>
              {t.quote}
            </p>
            <p style={{ fontFamily: font.body, fontSize: 12, fontWeight: 400, color: T.muted }}>
              -- {t.role}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 8: How It Works
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: '1',
    title: 'Connect your Dutchie account',
    desc: 'Already on Dutchie POS? You\'re already integrated. No new setup, no data migration, no IT project.',
  },
  {
    step: '2',
    title: 'Set your goals and preferences',
    desc: 'Revenue targets, margin goals, par levels. Tell Nexus what matters and it optimizes around your priorities.',
  },
  {
    step: '3',
    title: 'Let Nexus work',
    desc: 'Agents analyze your data, surface recommendations, draft POs, build campaigns, and flag problems. You review and approve.',
  },
];

function HowItWorksSection() {
  return (
    <Section id="how-it-works">
      <SectionTitle
        sub="Getting Started"
        title="Three steps. That's it."
        center
      />
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 24,
            position: 'relative',
          }}>
            {/* Thin connecting line */}
            {i < STEPS.length - 1 && (
              <div style={{
                position: 'absolute', left: 15, top: 40, width: 1,
                height: 'calc(100% - 8px)',
                background: T.border,
              }} />
            )}
            {/* Step number -- 32px circle, gold border */}
            <div style={{
              width: 32, height: 32, borderRadius: 16, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${T.gold}`, background: T.surface,
              fontFamily: font.body, fontSize: 13, fontWeight: 700,
              color: T.gold,
            }}>
              {s.step}
            </div>
            <div style={{ paddingBottom: i < STEPS.length - 1 ? 32 : 0 }}>
              <h3 style={{
                fontFamily: font.heading, fontWeight: 500, fontSize: 17,
                color: T.text, marginBottom: 6, lineHeight: 1.3,
              }}>
                {s.title}
              </h3>
              <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 400, lineHeight: 1.7, color: T.secondary }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 9: CTA Footer
// ─────────────────────────────────────────────────────────────────────────────

function CTAFooterSection() {
  return (
    <Section id="cta" style={{ textAlign: 'center', padding: '120px 24px 80px' }}>
      <h2 style={{
        fontFamily: font.heading, fontWeight: 300,
        fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-0.01em',
        color: T.text, lineHeight: 1.2, marginBottom: 16,
      }}>
        Ready to see what your data can do?
      </h2>
      <p style={{
        fontFamily: font.body, fontSize: 16, fontWeight: 400, color: T.secondary,
        marginBottom: 32,
      }}>
        Already on Dutchie? You're halfway there.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <CTAButton primary>
          Request Access
        </CTAButton>
      </div>

      <p style={{
        fontFamily: font.body, fontSize: 12, fontWeight: 400, color: T.muted,
        lineHeight: 1.6, maxWidth: 480, margin: '0 auto',
      }}>
        Nexus is available for Dutchie POS customers. Requires Ascend POS. Contact your account rep for pricing.
      </p>

      {/* Bottom brand */}
      <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <NexusIcon size={18} style={{ opacity: 0.35 }} />
        <span style={{
          fontFamily: font.heading, fontWeight: 300,
          letterSpacing: '0.06em', fontSize: 16, color: T.muted,
        }}>
          nexus
        </span>
        <span style={{
          fontFamily: font.body, fontSize: 12, color: T.muted,
          marginLeft: 8, opacity: 0.6,
        }}>
          by Dutchie
        </span>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function NexusMarketing() {
  const [activeSection, setActiveSection] = useState('hero');
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const scrollTop = container.scrollTop;

      // Show floating CTA after scrolling past hero
      setShowFloatingCTA(scrollTop > 600);

      // Determine active section
      const sectionEls = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
      let current = SECTIONS[0].id;
      for (const el of sectionEls) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) current = el.id;
      }
      setActiveSection(current);
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
      <SectionNav active={activeSection} />
      <HeroSection />
      <Divider />
      <ProblemSection />
      <Divider />
      <CommandCenterSection />
      <Divider />
      <AgentsSection />
      <Divider />
      <MultiLocationSection />
      <Divider />
      <DataAdvantageSection />
      <Divider />
      <TestimonialsSection />
      <Divider />
      <HowItWorksSection />
      <Divider />
      <CTAFooterSection />
      <FloatingCTA visible={showFloatingCTA} />

      <style>{`
        @media (max-width: 768px) {
          #problem > div:last-child { grid-template-columns: 1fr !important; }
          #agents > div:last-child { grid-template-columns: 1fr !important; }
          #data > div:last-child { grid-template-columns: 1fr !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C4B99C; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #A89975; }
      `}</style>
    </div>
  );
}
