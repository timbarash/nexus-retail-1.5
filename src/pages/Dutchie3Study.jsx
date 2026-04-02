import React, { useState, useEffect, useRef } from 'react';
import NexusIcon from '../components/NexusIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Theme & Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg: '#EDE8DC',
  surface: '#E4DFCF',
  card: '#F7F4EC',
  cardHover: '#F0ECE2',
  border: '#D5CEBC',
  borderLight: '#C8C0AC',
  text: '#2C2416',
  muted: '#5C5243',
  dim: '#8A7F6E',
  gold: '#7A5F12',
  goldDim: 'rgba(122,95,18,0.12)',
  green: '#0B6E44',
  greenDim: 'rgba(11,110,68,0.10)',
  blue: '#2E6399',
  blueDim: 'rgba(46,99,153,0.10)',
  purple: '#6B4DAA',
  purpleDim: 'rgba(107,77,170,0.10)',
  red: '#B33A30',
  redDim: 'rgba(179,58,48,0.10)',
  orange: '#9A6B1A',
};

const font = {
  heading: "'DM Sans', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sections Config
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'hero', label: 'Overview' },
  { id: 'transition', label: 'Design Transition' },
  { id: 'directions', label: 'Design Directions' },
  { id: 'question', label: 'The Shift' },
  { id: 'brand', label: 'Brand Architecture' },
  { id: 'suite', label: 'Product Suite' },
  { id: 'design', label: 'Design Philosophy' },
  { id: 'fits', label: 'How It Fits' },
  { id: 'competitive', label: 'Competitive Landscape' },
  { id: 'agentarch', label: 'Agent Architecture' },
  { id: 'decisions', label: 'Strategic Decisions' },
  { id: 'timeline', label: 'Rollout' },
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
      position: 'sticky', top: 0, zIndex: 50, background: `${T.bg}ee`,
      backdropFilter: 'blur(16px)', borderBottom: `1px solid ${T.border}`,
      padding: '0 24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 4, overflowX: 'auto', padding: '12px 0' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)} style={{
            background: active === s.id ? T.goldDim : 'transparent',
            border: active === s.id ? `1px solid rgba(212,160,58,0.3)` : '1px solid transparent',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            fontFamily: font.body, fontSize: 13, fontWeight: 500,
            color: active === s.id ? T.gold : T.dim,
            whiteSpace: 'nowrap', transition: 'all 0.2s',
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
    <section id={id} style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto', ...style }}>
      {children}
    </section>
  );
}

function SectionTitle({ sub, title, desc }) {
  return (
    <div style={{ marginBottom: 48 }}>
      {sub && <p style={{ fontFamily: font.body, fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, marginBottom: 12 }}>{sub}</p>}
      <h2 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 36, letterSpacing: '-0.01em', color: T.text, lineHeight: 1.2, marginBottom: desc ? 16 : 0 }}>{title}</h2>
      {desc && <p style={{ fontFamily: font.body, fontSize: 16, lineHeight: 1.7, color: T.muted, maxWidth: 680 }}>{desc}</p>}
    </div>
  );
}

function Card({ children, style = {}, hover = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: hovered ? T.cardHover : T.card,
        border: `1px solid ${hovered ? T.borderLight : T.border}`,
        borderRadius: 16, padding: 28,
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, color = T.gold, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
      fontFamily: font.body, textTransform: 'uppercase',
      color, background: bg || `${color}18`,
      border: `1px solid ${color}30`,
    }}>
      {children}
    </span>
  );
}

function Stat({ value, label, color = T.gold }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: font.body, fontSize: 36, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: font.body, fontSize: 13, color: T.dim, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.border}, transparent)`, margin: '0 24px' }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 0: Hero
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <Section id="hero" style={{ padding: '100px 24px 80px', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: 24, marginBottom: 32, background: 'linear-gradient(135deg, #0B6E44 0%, #0A5C3A 100%)', boxShadow: '0 0 40px rgba(11,110,68,0.2), inset 0 1px 0 rgba(255,255,255,0.1)', border: '1px solid rgba(11,110,68,0.3)' }}>
        <NexusIcon size={44} />
      </div>
      <h1 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 52, letterSpacing: '-0.02em', color: T.text, lineHeight: 1.15, marginBottom: 20 }}>
        <span style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.orange})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Dutchie Nexus
        </span>
        {' '}Strategic Study
      </h1>
      <p style={{ fontFamily: font.body, fontSize: 18, lineHeight: 1.7, color: T.muted, maxWidth: 660, margin: '0 auto 48px' }}>
        An agent-first operations platform built on $19B in transaction intelligence. This study maps brand architecture, competitive positioning, product strategy, and the decisions that determine whether Nexus becomes Dutchie's defining product.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
        <Stat value="$19B" label="Annual Transaction Data" color={T.gold} />
        <Stat value="6,500+" label="Dispensaries on Platform" color={T.green} />
        <Stat value="4" label="Autonomous AI Agents" color={T.purple} />
        <Stat value="40+" label="State Regulatory Frameworks" color={T.blue} />
      </div>
      <div style={{ marginTop: 56, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Badge color={T.green}>Agent-First Architecture</Badge>
        <Badge color={T.gold}>MSO Portfolio Intelligence</Badge>
        <Badge color={T.purple}>Full-Stack Data Moat</Badge>
        <Badge color={T.blue}>Compliance-Aware AI</Badge>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Design Transition
// ─────────────────────────────────────────────────────────────────────────────

function TransitionSection() {
  const [selectedApproach, setSelectedApproach] = useState('parallel');

  const approaches = [
    {
      id: 'bigbang',
      name: 'Big Bang',
      desc: 'Ship Nexus as a full replacement overnight. Clean break, maximum disruption.',
      pros: ['Clean brand story', 'No dual-maintenance', 'Forces adoption'],
      cons: ['Highest training burden', 'Feature parity required', 'Risk of operator churn'],
      timeline: '1 day',
      risk: 'High',
      color: T.red,
    },
    {
      id: 'parallel',
      name: 'Parallel Run',
      desc: 'Both systems available simultaneously. Operators choose when to switch. Most likely for MVP.',
      pros: ['Lowest adoption risk', 'Operators migrate at their pace', 'A/B feedback loop'],
      cons: ['Longest confusion period', 'Dual maintenance cost', '"Three Dutchies" problem persists'],
      timeline: '12-18 months',
      risk: 'Low',
      color: T.green,
      recommended: true,
    },
    {
      id: 'gradual',
      name: 'Gradual Convergence',
      desc: 'Slowly bring Nexus design language INTO the existing back-office. Sidebar replaces tabs. Agents appear in current shell.',
      pros: ['Least disruptive to operators', 'Familiar shell, new capabilities', 'Natural evolution feel'],
      cons: ['Most engineering work', 'Design compromises required', 'Neither old nor new feels complete'],
      timeline: '18-24 months',
      risk: 'Medium',
      color: T.gold,
    },
  ];

  const tactics = [
    { label: 'Consistent header branding', desc: 'Nexus logo + Dutchie parent brand visible in both systems' },
    { label: 'Shared color semantics', desc: 'Green = action, Red = alert, Gold = AI — carry across all products' },
    { label: '"Try Nexus" toggle', desc: 'Let operators opt into Nexus views within existing back-office' },
    { label: 'Contextual onboarding', desc: 'First-time Nexus users see a "What\'s different" overlay' },
    { label: '"Back to Classic" escape', desc: 'Always available during transition — reduces fear of change' },
    { label: 'Shared design tokens', desc: 'Nexus CSS variables become THE system — back-office adopts them gradually' },
  ];

  return (
    <Section id="transition">
      <SectionTitle
        sub="The Challenge"
        title="The Three Dutchies Problem"
        desc="When Nexus launches alongside the existing back-office and ecommerce admin, operators will switch between 2-3 completely different design systems daily. This section addresses how to manage that transition without losing trust."
      />

      {/* Three design systems comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {/* Back-Office mockup */}
        <Card>
          <Badge color={T.muted}>Current</Badge>
          <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.text, margin: '16px 0 12px' }}>Dutchie Back-Office</h4>
          <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {['Inventory', 'Reports', 'Settings'].map(t => (
                <span key={t} style={{ fontSize: 10, color: t === 'Inventory' ? '#00C27C' : '#888', borderBottom: t === 'Inventory' ? '2px solid #00C27C' : 'none', paddingBottom: 3 }}>{t}</span>
              ))}
            </div>
            <div style={{ height: 24, background: '#F5F5F0', borderRadius: 4 }} />
            <div style={{ height: 16, background: '#F5F5F0', borderRadius: 4, marginTop: 6, width: '70%' }} />
          </div>
          <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6 }}>
            Light mode only. Tab-based navigation. Green primary. Traditional SaaS dashboard. Used by ~6,500 dispensaries daily.
          </div>
        </Card>

        {/* Ecomm Admin mockup */}
        <Card>
          <Badge color={T.muted}>Current</Badge>
          <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.text, margin: '16px 0 12px' }}>Ecommerce Admin</h4>
          <div style={{ background: '#FAFAFA', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #E5E5E5' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {['Menus', 'Orders', 'Settings'].map(t => (
                <span key={t} style={{ fontSize: 10, color: t === 'Menus' ? '#1B3A2D' : '#888', fontWeight: t === 'Menus' ? 600 : 400, paddingBottom: 3 }}>{t}</span>
              ))}
            </div>
            <div style={{ height: 24, background: '#F0F0EC', borderRadius: 4 }} />
            <div style={{ height: 16, background: '#F0F0EC', borderRadius: 4, marginTop: 6, width: '60%' }} />
          </div>
          <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6 }}>
            Light mode only. Similar but not identical to back-office. Manages consumer-facing menus and online ordering. Separate login for many operators.
          </div>
        </Card>

        {/* Nexus mockup */}
        <Card style={{ border: `1px solid rgba(212,160,58,0.3)` }}>
          <Badge color={T.gold}>Nexus</Badge>
          <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.text, margin: '16px 0 12px' }}>Nexus Platform</h4>
          <div style={{ background: '#1A1918', borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {['Command Center', 'Agents'].map(t => (
                <span key={t} style={{ fontSize: 10, color: t === 'Command Center' ? T.green : T.dim, background: t === 'Command Center' ? T.greenDim : 'transparent', padding: '2px 6px', borderRadius: 4 }}>{t}</span>
              ))}
            </div>
            <div style={{ height: 24, background: T.greenDim, borderRadius: 4 }} />
            <div style={{ height: 16, background: `rgba(212,160,58,0.08)`, borderRadius: 4, marginTop: 6, width: '75%' }} />
          </div>
          <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6 }}>
            Dark-first with parchment + classic light modes. Sidebar navigation. Gold + green accents. Agent-driven workflows. Completely different visual language.
          </div>
        </Card>
      </div>

      {/* The cognitive cost */}
      <Card style={{ marginBottom: 32, background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid rgba(232,112,104,0.2)` }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.red, margin: '0 0 12px' }}>The Cognitive Cost</h4>
        <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.7, color: T.muted, margin: 0 }}>
          An operator's daily workflow: check inventory in the <strong style={{ color: T.text }}>back-office</strong> (white, tabs), update menus in <strong style={{ color: T.text }}>ecomm admin</strong> (white, slightly different tabs), then review AI insights in <strong style={{ color: T.text }}>Nexus</strong> (dark, sidebar, agents). Three different navigation paradigms, three color systems, three mental models. Every context switch costs 10-15 seconds of reorientation. Multiply by 50+ switches per day across thousands of operators — the cumulative cognitive tax is significant.
        </p>
      </Card>

      {/* Transition approaches */}
      <h3 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 24, color: T.text, marginBottom: 20 }}>Transition Approaches</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
        {approaches.map(a => (
          <div
            key={a.id}
            onClick={() => setSelectedApproach(a.id)}
            style={{
              background: selectedApproach === a.id ? T.card : T.surface,
              border: `1px solid ${selectedApproach === a.id ? a.color + '50' : T.border}`,
              borderRadius: 16, padding: 24, cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: selectedApproach === a.id ? `0 0 20px ${a.color}10` : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.text, margin: 0 }}>{a.name}</h4>
              <div style={{ display: 'flex', gap: 6 }}>
                {a.recommended && <Badge color={T.green}>Recommended</Badge>}
                <Badge color={a.color}>{a.risk} Risk</Badge>
              </div>
            </div>
            <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim, lineHeight: 1.6, margin: '0 0 16px' }}>{a.desc}</p>
            <div style={{ fontSize: 12, color: a.color, fontWeight: 600, marginBottom: 12 }}>Timeline: {a.timeline}</div>

            {selectedApproach === a.id && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.green, marginBottom: 6 }}>PROS</div>
                  {a.pros.map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: T.muted, padding: '3px 0', display: 'flex', gap: 6 }}>
                      <span style={{ color: T.green }}>+</span> {p}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.red, marginBottom: 6 }}>CONS</div>
                  {a.cons.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, color: T.muted, padding: '3px 0', display: 'flex', gap: 6 }}>
                      <span style={{ color: T.red }}>-</span> {c}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Competitor precedents */}
      <Card style={{ marginBottom: 32 }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.text, margin: '0 0 16px' }}>How Others Handled Platform Transitions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { name: 'Salesforce', transition: 'Classic → Lightning', duration: '3+ years parallel run', outcome: 'Lightning became default but Classic never fully died. Some users still on Classic in 2026.' },
            { name: 'Shopify', transition: 'Admin redesign', duration: 'Phased rollout with flags', outcome: 'Gradual convergence. No hard cutover. Feature flags controlled visibility.' },
            { name: 'Toast', transition: 'Dashboard redesign 2023', duration: 'Tier-based rollout', outcome: 'Enterprise customers got it first, then SMB. 6-month full rollout.' },
          ].map(c => (
            <div key={c.name} style={{ background: T.surface, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 14, color: T.gold, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: T.text, fontWeight: 500, marginBottom: 6 }}>{c.transition}</div>
              <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.5 }}>{c.duration}. {c.outcome}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reducing cognitive load */}
      <h3 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 24, color: T.text, marginBottom: 20 }}>Reducing Cognitive Load During Transition</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {tactics.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: T.surface, borderRadius: 12, padding: '14px 18px', border: `1px solid ${T.border}` }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: T.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <span style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>✓</span>
            </div>
            <div>
              <div style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontFamily: font.body, fontSize: 12, color: T.dim, lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Convergence strategy */}
      <Card style={{ marginTop: 32, border: `1px solid rgba(212,160,58,0.2)` }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.gold, margin: '0 0 12px' }}>The Endgame: One Design System</h4>
        <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.7, color: T.muted, margin: 0 }}>
          Nexus's design token system (CSS variables, dark/parchment/classic themes) is already built to be <strong style={{ color: T.text }}>THE shared design system</strong> that eventually absorbs back-office and ecommerce admin. The three-theme approach means legacy-comfortable operators can use "Classic" (cool white, familiar feel) while forward-leaning operators use dark or parchment. Agent pages can be embedded in the current back-office shell as iframe components during transition. The sidebar can coexist with tab navigation. Over 18-24 months, the back-office gradually adopts Nexus tokens until the visual distinction disappears — and operators barely notice the transition happened.
        </p>
      </Card>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: The Shift
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Deep Design Exploration — High-Fidelity Full-Page Mockups
// ─────────────────────────────────────────────────────────────────────────────

const MOCKUP_VIBES = [
  {
    id: 'backoffice', name: 'Current Dutchie Back-Office', tag: 'EXISTING PRODUCT',
    desc: 'The current back-office operators use daily. White, clean, tab-based, Dutchie green. No AI features.',
    bg: '#FFFFFF', surface: '#F5F5F0', card: '#FFFFFF', border: '#E0E0E0', divider: '#EBEBEB',
    text: '#333333', muted: '#666666', dim: '#999999',
    accent: '#00C27C', accentBg: '#E6F9F1', negative: '#DC3545',
    sidebarBg: '#FAFAF8', sidebarBorder: '#E5E5E5', sidebarText: '#666666', sidebarActive: '#00C27C',
    logo: 'dutchie', logoStyle: 'green',
    sections: [{ label: null, items: ['Home', 'Orders', 'Products', 'Inventory', 'Customers', 'Discounts', 'Reports', 'Settings'] }],
    headerBg: '#FFFFFF', headerBorder: '#E5E5E5',
    greeting: 'Dashboard',
    kpis: [
      { label: 'Total Sales', value: '$142,847', trend: null },
      { label: 'Transactions', value: '1,284', trend: null },
      { label: 'Avg Transaction', value: '$111.25', trend: null },
      { label: 'Discounts', value: '$8,420', trend: null },
      { label: 'Items Sold', value: '3,847', trend: null },
    ],
    chartTitle: 'Hourly Sales',
    tableHeaders: ['Product', 'Category', 'Qty Sold', 'Revenue', 'Margin'],
    tableRows: [
      ['Blue Dream 3.5g', 'Flower', '142', '$5,680', '48%'],
      ['Jeeter Baby Pre-Roll', 'Pre-Roll', '98', '$3,920', '52%'],
      ['Wyld Gummies 10pk', 'Edible', '87', '$2,610', '55%'],
      ['Stiiizy Pod 1g', 'Vape', '76', '$4,560', '44%'],
      ['Raw Garden Cart', 'Vape', '65', '$3,250', '46%'],
    ],
    alert: null,
    buttons: [{ label: 'Export Report', style: 'outline' }, { label: 'Print', style: 'outline' }],
    radius: 4, font: 'system-ui', badge: 'Current', sidebar: '#FAFAF8', green: '#00C27C',
    traits: ['Light mode only', 'Tab-based', 'No AI features', 'Familiar', 'Utilitarian'],
  },
  {
    id: 'nexus', name: 'Current Nexus Prototype', tag: 'THIS PROTOTYPE',
    desc: 'Warm dark mode, gold accents, agent-first, NexusIcon spiral. The current direction being evaluated.',
    bg: '#0A0908', surface: '#141210', card: '#1A1918', border: '#282724', divider: '#282724',
    text: '#F0EDE8', muted: '#ADA599', dim: '#6B6359',
    accent: '#00C27C', accentBg: 'rgba(0,194,124,0.12)', negative: '#E87068',
    sidebarBg: '#0A0908', sidebarBorder: '#282724', sidebarText: '#6B6359', sidebarActive: '#00C27C',
    logo: 'nexus', logoStyle: 'gold',
    sections: [
      { label: 'MY STORES', items: ['Command Center', 'Store Performance', 'Inventory Analytics', 'Brand Performance'] },
      { label: 'AI AGENTS', items: ['Inventory Agent', 'Pricing & Margins', 'Growth Agent', 'Dex'] },
    ],
    headerBg: '#0A0908', headerBorder: '#282724',
    greeting: 'Good morning, Tim — portfolio +6.8% WoW',
    kpis: [
      { label: 'NET REVENUE', value: '$1.2M', trend: '+6.8%', up: true },
      { label: 'DISCOUNT RATE', value: '11.8%', trend: '-0.4pp', up: true },
      { label: 'TRANSACTIONS', value: '2,847', trend: '+12%', up: true },
      { label: 'GROSS MARGIN', value: '48.2%', trend: '+0.8pp', up: true },
      { label: 'OOS LOST SALES', value: '$4.2K/day', trend: '23 SKUs', up: false },
    ],
    chartTitle: 'Revenue — This Week vs Last',
    tableHeaders: ['STORE', 'REVENUE', 'MARGIN', 'VS PORTFOLIO', 'DISC RATE'],
    tableRows: [
      ['Logan Square', '$142K', '49.1%', '+8.2%', '10.2%'],
      ['Wicker Park', '$128K', '47.3%', '+4.1%', '12.8%'],
      ['Grand Rapids', '$112K', '46.2%', '+5.7%', '11.1%'],
      ['Fort Lee', '$98K', '45.8%', '-1.2%', '14.5%'],
      ['Morenci', '$89K', '44.8%', '-2.3%', '16.1%'],
    ],
    alert: { severity: 'CRITICAL', color: '#E87068', msg: 'Blue Dream OOS at Logan Square — $340/day lost revenue', action: 'Transfer 38' },
    buttons: [{ label: 'Generate PO →', style: 'accent' }, { label: 'Ask Dex', style: 'gold' }, { label: 'Details', style: 'ghost' }],
    radius: 12, font: "'Inter', system-ui", badge: 'Prototype', sidebar: '#0A0908', green: '#00C27C',
    traits: ['Dark mode native', 'Gold accents', 'Agent-first', 'Warm tones', 'AI-forward branding'],
  },
  {
    id: 'hybrid', name: 'Hybrid Evolution', tag: 'RECOMMENDED',
    desc: 'Dark sidebar like Nexus + white content like back-office. AI features are inline, not separate pages. Familiar patterns + new intelligence.',
    bg: '#F8F7F4', surface: '#EFECE6', card: '#FFFFFF', border: '#E0DDD6', divider: '#E8E5DE',
    text: '#1A1A1A', muted: '#555555', dim: '#999999',
    accent: '#00C27C', accentBg: 'rgba(0,194,124,0.08)', negative: '#DC3545',
    sidebarBg: '#1A1918', sidebarBorder: '#282724', sidebarText: '#6B6359', sidebarActive: '#00C27C',
    logo: 'dutchie', logoStyle: 'white',
    sections: [
      { label: 'STORES', items: ['Dashboard', 'Store Performance', 'Inventory', 'Brands', 'Customers'] },
      { label: 'TOOLS', items: ['Purchasing', 'Pricing', 'Campaigns', 'Reports'] },
    ],
    headerBg: '#FFFFFF', headerBorder: '#E0DDD6',
    greeting: 'Good morning, Tim — portfolio +6.8% WoW',
    kpis: [
      { label: 'Net Revenue', value: '$1.2M', trend: '+6.8%', up: true },
      { label: 'Discount Rate', value: '11.8%', trend: '-0.4pp', up: true },
      { label: 'Transactions', value: '2,847', trend: '+12%', up: true },
      { label: 'Gross Margin', value: '48.2%', trend: '+0.8pp', up: true },
      { label: 'OOS Lost', value: '$4.2K/day', trend: '23 SKUs', up: false },
    ],
    chartTitle: 'Revenue — This Week vs Last',
    tableHeaders: ['Store', 'Revenue', 'Margin', 'Vs Portfolio', 'Disc Rate'],
    tableRows: [
      ['Logan Square', '$142K', '49.1%', '+8.2%', '10.2%'],
      ['Wicker Park', '$128K', '47.3%', '+4.1%', '12.8%'],
      ['Grand Rapids', '$112K', '46.2%', '+5.7%', '11.1%'],
      ['Fort Lee', '$98K', '45.8%', '-1.2%', '14.5%'],
      ['Morenci', '$89K', '44.8%', '-2.3%', '16.1%'],
    ],
    alert: { severity: 'Action needed', color: '#DC3545', msg: 'Blue Dream OOS at Logan Square — $340/day lost', action: 'Transfer from vault' },
    buttons: [{ label: 'Generate PO', style: 'accent' }, { label: 'View Details', style: 'outline' }],
    radius: 8, font: "'Inter', system-ui", badge: 'Recommended', sidebar: '#1A1918', green: '#00C27C',
    traits: ['Hybrid dark/light', 'Tools not Agents', 'Familiar content', 'Modern sidebar', 'Least disruption'],
  },
  {
    id: 'midnight', name: 'Midnight Operations', tag: 'ALT: COLD DARK',
    desc: 'Near-black with ice blue accents. Bloomberg/Datadog energy. Monospaced data, dense layouts, no warm tones.',
    bg: '#050508', surface: '#0A0A10', card: '#101018', border: '#1C1C28', divider: '#1C1C28',
    text: '#E8EAF0', muted: '#8890A8', dim: '#505870',
    accent: '#4A9BE8', accentBg: 'rgba(74,155,232,0.12)', negative: '#FF4D4D',
    sidebarBg: '#050508', sidebarBorder: '#1C1C28', sidebarText: '#505870', sidebarActive: '#4A9BE8',
    logo: 'NEXUS', logoStyle: 'blue',
    sections: [
      { label: 'OPERATIONS', items: ['Dashboard', 'Stores', 'Inventory', 'Analytics'] },
      { label: 'TOOLS', items: ['Procurement', 'Pricing', 'Campaigns', 'Console'] },
    ],
    headerBg: '#050508', headerBorder: '#1C1C28',
    greeting: 'Portfolio Status — 39 stores online',
    kpis: [
      { label: 'NET REV', value: '$1.2M', trend: '+6.8%', up: true },
      { label: 'MARGIN', value: '48.2%', trend: '+0.8pp', up: true },
      { label: 'TXNS', value: '2,847', trend: '+12%', up: true },
      { label: 'OOS IMPACT', value: '$4.2K/d', trend: '23 SKU', up: false },
    ],
    chartTitle: 'Revenue 7d',
    tableHeaders: ['STORE', 'REV', 'MGN', 'DELTA', 'DISC'],
    tableRows: [
      ['LOGAN_SQ', '$142K', '49.1', '+8.2', '10.2'],
      ['WICKER_PK', '$128K', '47.3', '+4.1', '12.8'],
      ['GR_RAPIDS', '$112K', '46.2', '+5.7', '11.1'],
      ['FORT_LEE', '$98K', '45.8', '-1.2', '14.5'],
      ['MORENCI', '$89K', '44.8', '-2.3', '16.1'],
    ],
    alert: { severity: 'CRIT', color: '#FF4D4D', msg: 'OOS: Blue Dream @ Logan Square — $340/day impact', action: 'TRANSFER' },
    buttons: [{ label: 'GENERATE PO', style: 'accent' }, { label: 'DETAILS', style: 'outline' }],
    radius: 4, font: "'JetBrains Mono', monospace", badge: 'Alt', sidebar: '#050508', green: '#4A9BE8',
    traits: ['Ice blue accents', 'Monospaced data', 'Bloomberg energy', 'Data-dense', 'Zero warmth'],
  },
  {
    id: 'forest', name: 'Forest & Gold', tag: 'ALT: CANNABIS NATIVE',
    desc: 'Dark forest green + gold. Cannabis heritage meets data platform. Premium, botanical, organic.',
    bg: '#0A1A12', surface: '#0E2218', card: '#132A1C', border: '#1E3A28', divider: '#1E3A28',
    text: '#F0EDE8', muted: '#A8C5B0', dim: '#5A8A68',
    accent: '#D4A03A', accentBg: 'rgba(212,160,58,0.12)', negative: '#E87068',
    sidebarBg: '#071510', sidebarBorder: '#1E3A28', sidebarText: '#5A8A68', sidebarActive: '#D4A03A',
    logo: 'dutchie', logoStyle: 'gold',
    sections: [
      { label: 'DISPENSARY', items: ['Operations', 'Locations', 'Garden', 'Brands', 'Community'] },
      { label: 'INTELLIGENCE', items: ['Purchasing', 'Pricing', 'Marketing', 'Concierge'] },
    ],
    headerBg: '#0A1A12', headerBorder: '#1E3A28',
    greeting: 'Good morning, Tim — your dispensaries are thriving',
    kpis: [
      { label: 'Net Revenue', value: '$1.2M', trend: '+6.8%', up: true },
      { label: 'Margin', value: '48.2%', trend: '+0.8pp', up: true },
      { label: 'Transactions', value: '2,847', trend: '+12%', up: true },
      { label: 'Lost to OOS', value: '$4.2K/day', trend: '23 SKUs', up: false },
    ],
    chartTitle: 'Revenue Trend',
    tableHeaders: ['Location', 'Revenue', 'Margin', 'Growth', 'Discount'],
    tableRows: [
      ['Logan Square', '$142K', '49.1%', '+8.2%', '10.2%'],
      ['Wicker Park', '$128K', '47.3%', '+4.1%', '12.8%'],
      ['Grand Rapids', '$112K', '46.2%', '+5.7%', '11.1%'],
      ['Fort Lee', '$98K', '45.8%', '-1.2%', '14.5%'],
      ['Morenci', '$89K', '44.8%', '-2.3%', '16.1%'],
    ],
    alert: { severity: 'Attention', color: '#E87068', msg: 'Blue Dream out of stock — Logan Square — $340/day', action: 'Transfer from vault' },
    buttons: [{ label: 'Create Purchase Order', style: 'accent' }, { label: 'View Details', style: 'outline' }],
    radius: 14, font: "'Inter', system-ui", badge: 'Alt', sidebar: '#071510', green: '#D4A03A',
    traits: ['Cannabis heritage', 'Botanical', 'Premium organic', 'Gold accents', 'Unique identity'],
  },
  {
    id: 'slate', name: 'Clean Slate', tag: 'ALT: MODERN SAAS',
    desc: 'Cool light mode, blue accent, dark sidebar. Linear/Vercel energy. Professional, minimal, tool-first.',
    bg: '#F5F6F8', surface: '#ECEEF2', card: '#FFFFFF', border: '#E2E5EB', divider: '#E2E5EB',
    text: '#1A1D23', muted: '#475569', dim: '#94A3B8',
    accent: '#3B82F6', accentBg: 'rgba(59,130,246,0.08)', negative: '#EF4444',
    sidebarBg: '#1E293B', sidebarBorder: '#334155', sidebarText: '#94A3B8', sidebarActive: '#3B82F6',
    logo: 'Nexus', logoStyle: 'white',
    sections: [
      { label: 'OPERATIONS', items: ['Home', 'Locations', 'Inventory', 'Brands', 'Customers'] },
      { label: 'TOOLS', items: ['Purchasing', 'Pricing', 'Growth', 'Chat'] },
    ],
    headerBg: '#FFFFFF', headerBorder: '#E2E5EB',
    greeting: 'Good morning, Tim',
    kpis: [
      { label: 'Net Revenue', value: '$1.2M', trend: '+6.8%', up: true },
      { label: 'Discount Rate', value: '11.8%', trend: '-0.4pp', up: true },
      { label: 'Transactions', value: '2,847', trend: '+12%', up: true },
      { label: 'Margin', value: '48.2%', trend: '+0.8pp', up: true },
    ],
    chartTitle: 'Revenue — Last 7 Days',
    tableHeaders: ['Store', 'Revenue', 'Margin', 'Vs Avg', 'Discount'],
    tableRows: [
      ['Logan Square', '$142K', '49.1%', '+8.2%', '10.2%'],
      ['Wicker Park', '$128K', '47.3%', '+4.1%', '12.8%'],
      ['Grand Rapids', '$112K', '46.2%', '+5.7%', '11.1%'],
      ['Fort Lee', '$98K', '45.8%', '-1.2%', '14.5%'],
      ['Morenci', '$89K', '44.8%', '-2.3%', '16.1%'],
    ],
    alert: { severity: 'Critical', color: '#EF4444', msg: 'Blue Dream OOS at Logan Square — $340/day lost', action: 'Transfer' },
    buttons: [{ label: 'Generate PO', style: 'accent' }, { label: 'Details', style: 'outline' }],
    radius: 8, font: "'Inter', system-ui", badge: 'Alt', sidebar: '#1E293B', green: '#3B82F6',
    traits: ['Cool tones', 'Linear/Vercel energy', 'Blue accents', 'Professional', 'No cannabis identity'],
  },
  {
    id: 'evolved', name: 'Dutchie Evolved', tag: 'ALT: SMART CURRENT',
    desc: 'Takes the real current Dutchie back-office design and evolves it with intelligence features baked in subtly. No dark mode, no gold, no spiral logo. Just Dutchie green + white + smart defaults. Intelligence shows up as inline suggestions, not agent pages.',
    bg: '#FFFFFF', surface: '#F7F7F5', card: '#FFFFFF', border: '#E0E0E0', divider: '#EBEBEB',
    text: '#333333', muted: '#666666', dim: '#999999',
    accent: '#00C27C', accentBg: '#E6F9F1', negative: '#DC3545',
    sidebarBg: '#FAFAF8', sidebarBorder: '#E5E5E5', sidebarText: '#666666', sidebarActive: '#00C27C',
    logo: 'dutchie', logoStyle: 'green',
    sections: [
      { label: null, items: ['Home', 'Orders', 'Products', 'Inventory', 'Customers', 'Discounts', 'Reports'] },
      { label: null, items: ['Settings'] },
    ],
    headerBg: '#FFFFFF', headerBorder: '#E5E5E5',
    greeting: 'Good morning, Tim — 3 items need attention',
    kpis: [
      { label: 'Total Sales', value: '$142,847', trend: '+6.8%', up: true },
      { label: 'Transactions', value: '1,284', trend: '+12%', up: true },
      { label: 'Avg Transaction', value: '$111.25', trend: '+$3.20', up: true },
      { label: 'Discounts', value: '$8,420', trend: '-0.4pp', up: true },
      { label: 'Items Sold', value: '3,847', trend: '+8%', up: true },
    ],
    chartTitle: 'Hourly Sales',
    tableHeaders: ['Product', 'Category', 'Qty Sold', 'Revenue', 'Suggested Action'],
    tableRows: [
      ['Blue Dream 3.5g', 'Flower', '142', '$5,680', 'Reorder — 3 days left'],
      ['Jeeter Baby Pre-Roll', 'Pre-Roll', '98', '$3,920', 'On track'],
      ['Wyld Gummies 10pk', 'Edible', '87', '$2,610', 'Price opportunity'],
      ['Stiiizy Pod 1g', 'Vape', '76', '$4,560', 'Reorder — 5 days left'],
      ['Raw Garden Cart', 'Vape', '65', '$3,250', 'On track'],
    ],
    alert: { severity: 'Suggestion', color: '#00C27C', msg: 'Blue Dream is selling 2x faster than usual — consider reordering early', action: 'Reorder now' },
    buttons: [{ label: 'Export Report', style: 'outline' }, { label: 'Print', style: 'outline' }],
    radius: 4, font: 'system-ui', badge: 'Alt', sidebar: '#FAFAF8', green: '#00C27C',
    traits: ['Light mode only', 'Dutchie green', 'Inline intelligence', 'No AI branding', 'Familiar patterns'],
  },
  {
    id: 'warmops', name: 'Warm Operations', tag: 'ALT: INVISIBLE AI',
    desc: 'The current prototype warm dark mode but with ALL AI-specific branding removed. No "AI Agent" labels, no "Dex", no sparkles, no "powered by AI". Intelligence is invisible — it is just how the product works.',
    bg: '#0A0908', surface: '#141210', card: '#1A1918', border: '#282724', divider: '#282724',
    text: '#F0EDE8', muted: '#ADA599', dim: '#6B6359',
    accent: '#00C27C', accentBg: 'rgba(0,194,124,0.12)', negative: '#E87068',
    sidebarBg: '#0A0908', sidebarBorder: '#282724', sidebarText: '#6B6359', sidebarActive: '#D4A03A',
    logo: 'dutchie', logoStyle: 'gold',
    sections: [
      { label: 'STORES', items: ['Command Center', 'Store Performance', 'Inventory', 'Brands'] },
      { label: 'OPERATIONS', items: ['Purchasing', 'Pricing', 'Marketing', 'Reports'] },
    ],
    headerBg: '#0A0908', headerBorder: '#282724',
    greeting: 'Good morning, Tim — portfolio +6.8% WoW',
    kpis: [
      { label: 'NET REVENUE', value: '$1.2M', trend: '+6.8%', up: true },
      { label: 'DISCOUNT RATE', value: '11.8%', trend: '-0.4pp', up: true },
      { label: 'TRANSACTIONS', value: '2,847', trend: '+12%', up: true },
      { label: 'GROSS MARGIN', value: '48.2%', trend: '+0.8pp', up: true },
      { label: 'OOS LOST SALES', value: '$4.2K/day', trend: '23 SKUs', up: false },
    ],
    chartTitle: 'Revenue — This Week vs Last',
    tableHeaders: ['STORE', 'REVENUE', 'MARGIN', 'VS PORTFOLIO', 'DISC RATE'],
    tableRows: [
      ['Logan Square', '$142K', '49.1%', '+8.2%', '10.2%'],
      ['Wicker Park', '$128K', '47.3%', '+4.1%', '12.8%'],
      ['Grand Rapids', '$112K', '46.2%', '+5.7%', '11.1%'],
      ['Fort Lee', '$98K', '45.8%', '-1.2%', '14.5%'],
      ['Morenci', '$89K', '44.8%', '-2.3%', '16.1%'],
    ],
    alert: { severity: 'CRITICAL', color: '#E87068', msg: 'Blue Dream OOS at Logan Square — $340/day lost revenue', action: 'Transfer 38' },
    buttons: [{ label: 'Generate PO', style: 'accent' }, { label: 'View Details', style: 'outline' }],
    radius: 12, font: "'Inter', system-ui", badge: 'Alt', sidebar: '#0A0908', green: '#00C27C',
    traits: ['Warm dark mode', 'No AI labels', 'Gold accents', 'Operations-first', 'Invisible intelligence'],
  },
  {
    id: 'pro', name: 'Dutchie Pro', tag: 'ALT: PREMIUM LIGHT',
    desc: 'Premium light mode with dark navy sidebar. Sage green accent instead of bright green. Cream cards on light gray. Feels like a private members club — understated, expensive, quiet confidence. Typography does the heavy lifting.',
    bg: '#F4F2ED', surface: '#EAE7E0', card: '#FAF9F6', border: '#DDD9D0', divider: '#E5E1D9',
    text: '#1A1A1A', muted: '#4A4A4A', dim: '#8A8A8A',
    accent: '#2D6B4F', accentBg: 'rgba(45,107,79,0.08)', negative: '#B33A30',
    sidebarBg: '#0F172A', sidebarBorder: '#1E293B', sidebarText: '#64748B', sidebarActive: '#2D6B4F',
    logo: 'dutchie', logoStyle: 'sage',
    sections: [
      { label: 'PORTFOLIO', items: ['Overview', 'Locations', 'Inventory', 'Brands', 'Customers'] },
      { label: 'MANAGEMENT', items: ['Purchasing', 'Pricing', 'Growth', 'Reports'] },
    ],
    headerBg: '#FAF9F6', headerBorder: '#DDD9D0',
    greeting: 'Good morning, Tim',
    kpis: [
      { label: 'Net Revenue', value: '$1.2M', trend: '+6.8%', up: true },
      { label: 'Discount Rate', value: '11.8%', trend: '-0.4pp', up: true },
      { label: 'Transactions', value: '2,847', trend: '+12%', up: true },
      { label: 'Gross Margin', value: '48.2%', trend: '+0.8pp', up: true },
    ],
    chartTitle: 'Revenue — Last 7 Days',
    tableHeaders: ['Location', 'Revenue', 'Margin', 'Vs Portfolio', 'Discount'],
    tableRows: [
      ['Logan Square', '$142K', '49.1%', '+8.2%', '10.2%'],
      ['Wicker Park', '$128K', '47.3%', '+4.1%', '12.8%'],
      ['Grand Rapids', '$112K', '46.2%', '+5.7%', '11.1%'],
      ['Fort Lee', '$98K', '45.8%', '-1.2%', '14.5%'],
      ['Morenci', '$89K', '44.8%', '-2.3%', '16.1%'],
    ],
    alert: { severity: 'Attention', color: '#B33A30', msg: 'Blue Dream out of stock at Logan Square — $340/day impact', action: 'Transfer inventory' },
    buttons: [{ label: 'Generate Purchase Order', style: 'accent' }, { label: 'View Details', style: 'outline' }],
    radius: 6, font: "'Inter', system-ui", badge: 'Alt', sidebar: '#0F172A', green: '#2D6B4F',
    traits: ['Premium light mode', 'Navy sidebar', 'Sage green', 'Cream palette', 'Typography-driven'],
  },
  {
    id: 'terminal', name: 'Terminal', tag: 'ALT: MAX DENSITY',
    desc: 'Maximum data density. Monospaced everything. No rounded corners. Thin 1px borders. Green-on-dark. No icons in nav — just text. Tables not cards. Numbers not graphics. For operators who want Bloomberg, not Figma.',
    bg: '#0A0A0A', surface: '#0E0E0E', card: '#111111', border: '#222222', divider: '#1A1A1A',
    text: '#CCCCCC', muted: '#888888', dim: '#555555',
    accent: '#00FF88', accentBg: 'rgba(0,255,136,0.08)', negative: '#FF4444',
    sidebarBg: '#080808', sidebarBorder: '#1A1A1A', sidebarText: '#555555', sidebarActive: '#00FF88',
    logo: 'DUTCHIE', logoStyle: 'terminal',
    sections: [
      { label: 'NAV', items: ['dashboard', 'stores', 'inventory', 'brands', 'customers'] },
      { label: 'OPS', items: ['purchasing', 'pricing', 'campaigns', 'reports'] },
    ],
    headerBg: '#0A0A0A', headerBorder: '#222222',
    greeting: '39 stores online / portfolio +6.8% WoW / 3 alerts',
    kpis: [
      { label: 'REV', value: '$1.2M', trend: '+6.8%', up: true },
      { label: 'MGN', value: '48.2%', trend: '+0.8pp', up: true },
      { label: 'TXN', value: '2,847', trend: '+12%', up: true },
      { label: 'OOS', value: '$4.2K/d', trend: '23', up: false },
      { label: 'DISC', value: '11.8%', trend: '-0.4pp', up: true },
    ],
    chartTitle: 'rev_7d',
    tableHeaders: ['store', 'rev', 'mgn', 'delta', 'disc'],
    tableRows: [
      ['logan_sq', '$142K', '49.1', '+8.2', '10.2'],
      ['wicker_pk', '$128K', '47.3', '+4.1', '12.8'],
      ['gr_rapids', '$112K', '46.2', '+5.7', '11.1'],
      ['fort_lee', '$98K', '45.8', '-1.2', '14.5'],
      ['morenci', '$89K', '44.8', '-2.3', '16.1'],
    ],
    alert: { severity: 'CRIT', color: '#FF4444', msg: 'OOS blue_dream @ logan_sq — $340/d impact', action: 'XFER 38' },
    buttons: [{ label: 'GEN_PO', style: 'accent' }, { label: 'DETAIL', style: 'outline' }],
    radius: 0, font: "'JetBrains Mono', 'Courier New', monospace", badge: 'Alt', sidebar: '#080808', green: '#00FF88',
    traits: ['Zero decoration', 'Monospaced', 'Max density', 'No icons', 'Bloomberg energy'],
  },
];

function FullPageMockup({ v, isSelected, onSelect }) {
  const bars = [35, 58, 48, 72, 65, 82, 55, 78, 68, 88, 80, 70];
  const isLight = v.id === 'backoffice' || v.id === 'hybrid' || v.id === 'slate' || v.id === 'evolved' || v.id === 'pro';
  const isMono = v.id === 'midnight' || v.id === 'terminal';
  const r = v.radius;

  return (
    <div onClick={onSelect} style={{
      width: 880, flexShrink: 0, cursor: 'pointer', borderRadius: 16, overflow: 'hidden',
      border: isSelected ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
      boxShadow: isSelected ? `0 0 40px ${T.gold}15` : '0 4px 20px rgba(0,0,0,0.2)',
      transition: 'all 0.25s',
    }}>
      {/* Tag bar */}
      <div style={{ background: T.card, padding: '8px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: font.heading, fontSize: 15, fontWeight: 600, color: isSelected ? T.gold : T.text }}>{v.name}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: v.id === 'hybrid' ? T.green : T.dim, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4, background: v.id === 'hybrid' ? T.greenDim : `${T.dim}15`, border: `1px solid ${v.id === 'hybrid' ? T.green + '30' : T.border}` }}>{v.tag}</span>
        </div>
        {isSelected && <Badge color={T.gold}>Selected</Badge>}
      </div>
      {/* Dashboard body */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', height: 560 }}>
        {/* === SIDEBAR === */}
        <div style={{ background: v.sidebarBg, borderRight: `1px solid ${v.sidebarBorder}`, padding: '16px 10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Logo */}
          <div style={{ padding: '0 8px', marginBottom: 20 }}>
            {v.logoStyle === 'gold' && <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: 17, fontWeight: 300, color: '#D4A03A', letterSpacing: '0.04em' }}>{v.logo}</span>}
            {v.logoStyle === 'green' && <span style={{ fontFamily: 'system-ui', fontSize: 17, fontWeight: 700, color: '#00C27C' }}>{v.logo}</span>}
            {v.logoStyle === 'white' && <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: 17, fontWeight: 300, color: '#F0EDE8', letterSpacing: '0.04em' }}>{v.logo}</span>}
            {v.logoStyle === 'blue' && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#4A9BE8', letterSpacing: '0.12em' }}>{v.logo}</span>}
            {v.logoStyle === 'sage' && <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: 17, fontWeight: 600, color: '#2D6B4F', letterSpacing: '0.02em' }}>{v.logo}</span>}
            {v.logoStyle === 'terminal' && <span style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 12, fontWeight: 700, color: '#00FF88', letterSpacing: '0.15em' }}>{v.logo}</span>}
          </div>
          {/* Nav sections */}
          {v.sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 12 }}>
              {sec.label && <div style={{ fontSize: 8, fontWeight: 700, color: v.dim || v.sidebarText, letterSpacing: '0.12em', padding: '4px 8px', marginBottom: 2 }}>{sec.label}</div>}
              {sec.items.map((item, ii) => {
                const isFirst = si === 0 && ii === 0;
                return (
                  <div key={item} style={{
                    padding: '5px 8px', borderRadius: Math.min(r, 6), fontSize: 11,
                    color: isFirst ? v.sidebarActive : v.sidebarText,
                    background: isFirst ? `${v.sidebarActive}15` : 'transparent',
                    fontWeight: isFirst ? 600 : 400,
                    borderLeft: isFirst ? `2px solid ${v.sidebarActive}` : '2px solid transparent',
                    fontFamily: v.font,
                  }}>{item}</div>
                );
              })}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          {/* Bottom user area */}
          <div style={{ padding: '8px', borderTop: `1px solid ${v.sidebarBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: `${v.sidebarActive}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: v.sidebarActive }}>T</span>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, color: isLight && v.id === 'backoffice' ? '#333' : '#F0EDE8' }}>Tim</div>
              <div style={{ fontSize: 8, color: v.sidebarText }}>CEO — Ascend</div>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div style={{ background: v.bg, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header bar */}
          <div style={{ background: v.headerBg, borderBottom: `1px solid ${v.headerBorder}`, padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: v.text, fontFamily: v.font }}>{v.greeting}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ fontSize: 9, color: v.dim, padding: '3px 10px', borderRadius: Math.min(r, 6), border: `1px solid ${v.border}`, background: v.card, fontFamily: v.font }}>Last 7 days</div>
              <div style={{ fontSize: 9, color: v.dim, padding: '3px 10px', borderRadius: Math.min(r, 6), border: `1px solid ${v.border}`, background: v.card, fontFamily: v.font }}>All stores (39)</div>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${v.kpis.length}, 1fr)`, gap: 10, marginBottom: 14 }}>
              {v.kpis.map((k, i) => (
                <div key={i} style={{ background: v.card, borderRadius: r, padding: '10px 12px', border: `1px solid ${v.border}`, fontFamily: v.font }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: v.dim, letterSpacing: '0.06em', marginBottom: 4, textTransform: v.id === 'backoffice' ? 'none' : 'uppercase' }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: v.text, fontFamily: isMono ? "'JetBrains Mono', monospace" : v.font }}>{k.value}</div>
                  {k.trend && <div style={{ fontSize: 9, color: k.up ? v.accent : v.negative, marginTop: 2, fontFamily: v.font }}>{k.trend}</div>}
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: v.card, borderRadius: r, border: `1px solid ${v.border}`, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: v.muted, marginBottom: 8, fontFamily: v.font }}>{v.chartTitle}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
                {bars.map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`, borderRadius: Math.max(r / 4, 2),
                    background: i === bars.length - 1 ? v.accent : `${v.accent}50`,
                  }} />
                ))}
              </div>
            </div>

            {/* Alert (if exists) */}
            {v.alert && (
              <div style={{ background: v.card, borderRadius: r, border: `1px solid ${v.border}`, borderLeft: `3px solid ${v.alert.color}`, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: v.font }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: v.alert.color, letterSpacing: '0.06em' }}>{v.alert.severity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: v.text }}>{v.alert.msg}</div>
                </div>
                <button style={{ background: `${v.accent}18`, color: v.accent, border: 'none', borderRadius: Math.min(r, 6), padding: '5px 12px', fontSize: 10, fontWeight: 600, cursor: 'default', fontFamily: v.font, whiteSpace: 'nowrap' }}>{v.alert.action}</button>
              </div>
            )}

            {/* Table */}
            <div style={{ background: v.card, borderRadius: r, border: `1px solid ${v.border}`, overflow: 'hidden', fontFamily: v.font }}>
              <div style={{ display: 'grid', gridTemplateColumns: `2fr repeat(${v.tableHeaders.length - 1}, 1fr)`, padding: '8px 14px', borderBottom: `1px solid ${v.divider}` }}>
                {v.tableHeaders.map(h => (
                  <div key={h} style={{ fontSize: 8, fontWeight: 600, color: v.dim, letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {v.tableRows.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: `2fr repeat(${v.tableHeaders.length - 1}, 1fr)`, padding: '6px 14px', borderBottom: ri < v.tableRows.length - 1 ? `1px solid ${v.divider}` : 'none' }}>
                  {row.map((cell, ci) => (
                    <div key={ci} style={{
                      fontSize: 10,
                      color: ci === 0 ? v.text : (cell.startsWith && cell.startsWith('-') ? v.negative : v.muted),
                      fontWeight: ci === 0 ? 500 : 400,
                      fontFamily: isMono && ci > 0 ? "'JetBrains Mono', monospace" : v.font,
                    }}>{cell}</div>
                  ))}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {v.buttons.map((btn, i) => (
                <button key={i} style={{
                  background: btn.style === 'accent' ? `${v.accent}18` : btn.style === 'gold' ? 'rgba(212,160,58,0.12)' : btn.style === 'outline' ? 'transparent' : 'transparent',
                  color: btn.style === 'accent' ? v.accent : btn.style === 'gold' ? '#D4A03A' : v.muted,
                  border: btn.style === 'outline' ? `1px solid ${v.border}` : 'none',
                  borderRadius: Math.min(r, 6), padding: '6px 14px', fontSize: 10, fontWeight: 600,
                  cursor: 'default', fontFamily: v.font,
                }}>{btn.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Description bar */}
      <div style={{ background: T.card, padding: '10px 16px', borderTop: `1px solid ${T.border}` }}>
        <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
      </div>
    </div>
  );
}

function ElementCompare({ label, current, options, selected, onSelect }) {
  const opt = options[selected] || options.A;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: T.dim }}>{label}</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {['A', 'B', 'C'].map(k => (
            <button key={k} onClick={(e) => { e.stopPropagation(); onSelect(k); }} style={{
              width: 22, height: 20, borderRadius: 4, border: `1px solid ${selected === k ? T.gold + '60' : T.border}`,
              background: selected === k ? T.goldDim : 'transparent', color: selected === k ? T.gold : T.dim,
              fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: font.body,
            }}>{k}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 100 }}>
        <div style={{ padding: 14, borderRight: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: T.dim, letterSpacing: '0.1em', marginBottom: 8 }}>CURRENT</div>
          {current}
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: T.green, letterSpacing: '0.1em', marginBottom: 8 }}>OPTION {selected}</div>
          {opt}
        </div>
      </div>
    </div>
  );
}

function DesignDirectionsSection() {
  const [vibeSelected, setVibeSelected] = useState('hybrid');
  const [elOpts, setElOpts] = useState({});
  const setOpt = (el, val) => setElOpts(prev => ({ ...prev, [el]: val }));
  const getOpt = (el) => elOpts[el] || 'A';

  const nxBg = '#0D0C0A'; const nxCard = '#1A1918'; const nxBorder = '#282724';
  const nxGreen = '#00C27C'; const nxGold = '#D4A03A'; const nxText = '#F0EDE8';
  const nxMuted = '#ADA599'; const nxDim = '#6B6359';
  const miniBox = { background: nxCard, borderRadius: 8, border: `1px solid ${nxBorder}`, padding: 10 };
  const miniDot = (c, s = 6) => ({ width: s, height: s, borderRadius: '50%', background: c, flexShrink: 0, display: 'inline-block' });

  return (
    <Section id="directions">
      <SectionTitle sub="Design Directions" title="Design Exploration" desc="Full-page vibe mockups at decision-making fidelity. Includes the current Dutchie back-office, the current prototype, a hybrid evolution, and 7 alternative directions — from invisible-AI operations tools to maximum-density terminal views. Click any mockup to select it." />

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', background: T.surface, padding: 4, borderRadius: 12, border: `1px solid ${T.border}` }}>
        {MOCKUP_VIBES.map(v => (
          <button key={v.id} onClick={() => setVibeSelected(v.id)} style={{
            background: vibeSelected === v.id ? T.card : 'transparent',
            border: vibeSelected === v.id ? `1px solid ${T.border}` : '1px solid transparent',
            borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
            fontFamily: font.body, fontSize: 13, fontWeight: vibeSelected === v.id ? 600 : 400,
            color: vibeSelected === v.id ? T.text : T.dim, transition: 'all 0.2s',
            boxShadow: vibeSelected === v.id ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
          }}>{v.name}</button>
        ))}
      </div>

      {/* Selected mockup — large */}
      {MOCKUP_VIBES.filter(v => v.id === vibeSelected).map(v => (
        <div key={v.id} style={{ marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            <div style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
              <FullPageMockup v={v} isSelected={true} onSelect={() => {}} />
            </div>
            <div>
              <Badge color={v.badge === 'Recommended' ? T.green : v.badge === 'Current' ? T.muted : T.blue}>{v.badge}</Badge>
              <h3 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 22, color: T.text, margin: '12px 0 8px' }}>{v.name}</h3>
              <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.7, color: T.muted, marginBottom: 16 }}>{v.desc}</p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.dim, marginBottom: 8 }}>COLOR PALETTE</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[v.sidebar, v.bg, v.card, v.accent, v.green].map((c, i) => (
                    <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: `1px solid ${T.border}` }} title={c} />
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.dim, marginBottom: 6 }}>DESIGN TRAITS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(v.traits || ['Distinctive', 'Professional', 'Modern']).map(t => (
                    <span key={t} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: T.surface, border: `1px solid ${T.border}`, color: T.muted }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: T.dim }}>
                <span style={{ fontWeight: 600, color: T.muted }}>Border radius:</span> {v.radius}px
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ═══ Element-Level Options ═══ */}
      <h3 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 24, color: T.text, marginBottom: 8, marginTop: 16 }}>Element-Level Alternatives</h3>
      <p style={{ fontFamily: font.body, fontSize: 14, color: T.muted, marginBottom: 16, maxWidth: 600 }}>Same Nexus colors, different UI element treatment. Toggle A/B/C per element independently.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 11, color: T.dim }}>
        <span><strong style={{ color: T.gold }}>A</strong> Operations Native</span>
        <span><strong style={{ color: T.gold }}>B</strong> Subtle Intelligence</span>
        <span><strong style={{ color: T.gold }}>C</strong> Invisible Intelligence</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
        <ElementCompare label="AGENT PAGE HEADER" selected={getOpt('hdr')} onSelect={v => setOpt('hdr', v)}
          current={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: 7, background: `${nxGreen}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: nxGreen, fontSize: 14 }}>&#9741;</span></div><div><div style={{ fontSize: 14, fontWeight: 700, color: nxText }}>Inventory Agent</div><div style={{ fontSize: 9, color: nxDim }}>Purchasing & Inventory — Dutchie AI</div></div></div>}
          options={{ A: <div><div style={{ fontSize: 14, fontWeight: 700, color: nxText }}>Inventory</div><div style={{ fontSize: 9, color: nxDim }}>Purchasing & stock management</div></div>, B: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: `${nxGreen}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: nxGreen, fontSize: 12 }}>&#9741;</span></div><div><div style={{ fontSize: 13, fontWeight: 600, color: nxText }}>Inventory</div><div style={{ fontSize: 9, color: nxDim }}>Purchasing</div></div></div>, C: <div style={{ fontSize: 14, fontWeight: 700, color: nxText, borderBottom: `2px solid ${nxGreen}`, display: 'inline-block', paddingBottom: 2 }}>Inventory</div> }}
        />
        <ElementCompare label="SIDEBAR NAVIGATION" selected={getOpt('nav')} onSelect={v => setOpt('nav', v)}
          current={<div style={{ ...miniBox, padding: 6 }}><div style={{ fontSize: 7, fontWeight: 700, color: nxDim, letterSpacing: '0.1em', padding: '4px 6px' }}>AI AGENTS</div>{['Inventory Agent', 'Pricing & Margins', 'Growth Agent', 'Dex'].map((n, i) => <div key={n} style={{ padding: '4px 6px', borderRadius: 4, fontSize: 9, color: i === 0 ? nxGreen : nxDim, background: i === 0 ? `${nxGreen}15` : 'transparent', fontWeight: i === 0 ? 600 : 400 }}>{n}</div>)}</div>}
          options={{ A: <div style={{ ...miniBox, padding: 6 }}><div style={{ fontSize: 7, fontWeight: 700, color: nxDim, letterSpacing: '0.1em', padding: '4px 6px' }}>TOOLS</div>{['Inventory', 'Pricing', 'Campaigns', 'Ask Nexus'].map((n, i) => <div key={n} style={{ padding: '4px 6px', borderRadius: 4, fontSize: 9, color: i === 0 ? nxGreen : nxDim, background: i === 0 ? `${nxGreen}15` : 'transparent' }}>{n}</div>)}</div>, B: <div style={{ ...miniBox, padding: 6 }}><div style={{ fontSize: 7, fontWeight: 700, color: nxDim, letterSpacing: '0.1em', padding: '4px 6px' }}>WORKFLOWS</div>{['Inventory', 'Pricing & Margins', 'Growth', 'Dex'].map((n, i) => <div key={n} style={{ padding: '4px 6px', borderRadius: 4, fontSize: 9, color: i === 0 ? nxGreen : nxDim, background: i === 0 ? `${nxGreen}15` : 'transparent' }}>{n}</div>)}</div>, C: <div style={{ ...miniBox, padding: 6 }}>{['Inventory', 'Pricing', 'Marketing', 'Nexus Chat'].map((n, i) => <div key={n} style={{ padding: '4px 6px', borderRadius: 4, fontSize: 9, color: i === 0 ? nxGreen : nxDim, background: i === 0 ? `${nxGreen}12` : 'transparent' }}>{n}</div>)}</div> }}
        />
        <ElementCompare label="THINKING INDICATOR" selected={getOpt('think')} onSelect={v => setOpt('think', v)}
          current={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 24, borderRadius: 12, background: nxBg, border: `1px solid ${nxGold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><NexusIcon size={12} /></div><div style={{ ...miniBox, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}><span style={miniDot(`${nxGreen}80`)} /><span style={miniDot(`${nxGreen}60`)} /><span style={miniDot(`${nxGreen}40`)} /><span style={{ fontSize: 8, color: nxDim, marginLeft: 4 }}>Analyzing...</span></div></div>}
          options={{ A: <div><div style={{ height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${nxGreen}, transparent)`, width: '60%', marginTop: 8 }} /></div>, B: <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><span style={miniDot(nxGreen, 5)} /><span style={{ fontSize: 9, color: nxDim }}>Working...</span></div>, C: <div style={{ height: 24 }} /> }}
        />
        <ElementCompare label="SUGGESTION TILES" selected={getOpt('sug')} onSelect={v => setOpt('sug', v)}
          current={<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>{['Reorder Stockouts', 'Explore Products', 'Purchasing Recs', 'Vendor Costs'].map((s, i) => <div key={s} style={{ ...miniBox, padding: '5px 8px', fontSize: 9, color: nxText, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><span style={miniDot(i < 2 ? nxGreen : nxGold, 4)} />{s}</div>)}</div>}
          options={{ A: <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{['Reorder out-of-stock items →', 'Browse new products →', 'Review purchasing →', 'Analyze vendor costs →'].map(s => <div key={s} style={{ fontSize: 10, color: nxGreen }}>{s}</div>)}</div>, B: <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{['Reorder', 'Explore', 'Purchasing', 'Costs'].map(s => <span key={s} style={{ fontSize: 9, color: nxMuted, padding: '3px 8px', borderRadius: 10, border: `1px solid ${nxBorder}` }}>{s}</span>)}</div>, C: <div style={{ marginTop: 4, borderRadius: 8, border: `1px solid ${nxBorder}`, background: nxBg, padding: '6px 10px' }}><span style={{ fontSize: 9, color: nxDim }}>What would you like to do?</span></div> }}
        />
        <ElementCompare label="BOT MESSAGE BUBBLE" selected={getOpt('msg')} onSelect={v => setOpt('msg', v)}
          current={<div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><div style={{ width: 24, height: 24, borderRadius: 12, background: nxBg, border: `1px solid ${nxGold}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NexusIcon size={12} /></div><div style={{ ...miniBox, padding: '8px 12px', flex: 1 }}><div style={{ fontSize: 10, color: nxText, lineHeight: 1.5 }}>Found <strong>3 items</strong> that need reordering across your stores.</div></div></div>}
          options={{ A: <div style={{ borderLeft: `2px solid ${nxGreen}`, paddingLeft: 10, marginLeft: 4 }}><div style={{ fontSize: 10, color: nxText, lineHeight: 1.5 }}>Found <strong>3 items</strong> that need reordering across your stores.</div></div>, B: <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}><span style={{ ...miniDot(nxGreen, 8), marginTop: 4 }} /><div style={{ ...miniBox, padding: '8px 12px', flex: 1 }}><div style={{ fontSize: 10, color: nxText, lineHeight: 1.5 }}>Found <strong>3 items</strong> that need reordering.</div></div></div>, C: <div><div style={{ fontSize: 10, color: nxText, lineHeight: 1.5 }}>Found <strong>3 items</strong> that need reordering.</div></div> }}
        />
        <ElementCompare label="KPI METRIC CARD" selected={getOpt('kpi')} onSelect={v => setOpt('kpi', v)}
          current={<div style={miniBox}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ fontSize: 8, fontWeight: 600, color: nxDim, letterSpacing: '0.08em' }}>NET REVENUE</div><div style={{ width: 18, height: 18, borderRadius: 5, background: `${nxGreen}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 9, color: nxGreen }}>$</span></div></div><div style={{ fontSize: 20, fontWeight: 700, color: nxText, marginTop: 2 }}>$1.2M</div><div style={{ fontSize: 9, color: nxGreen, marginTop: 2 }}>+6.8% YoY</div></div>}
          options={{ A: <div style={miniBox}><div style={{ fontSize: 8, fontWeight: 600, color: nxDim, letterSpacing: '0.08em' }}>NET REVENUE</div><div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}><span style={{ fontSize: 20, fontWeight: 700, color: nxText, fontFamily: 'monospace' }}>$1.2M</span><span style={{ fontSize: 9, color: nxGreen }}>+6.8%</span></div></div>, B: <div style={miniBox}><div style={{ fontSize: 8, fontWeight: 600, color: nxDim, letterSpacing: '0.08em' }}>NET REVENUE</div><div style={{ fontSize: 20, fontWeight: 700, color: nxText, marginTop: 2 }}>$1.2M</div><div style={{ fontSize: 9, color: nxMuted, marginTop: 2 }}>+6.8% vs prior year</div></div>, C: <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid ${nxBorder}` }}><span style={{ fontSize: 10, color: nxDim }}>Net Revenue</span><span style={{ fontSize: 16, fontWeight: 600, color: nxText }}>$1.2M</span></div> }}
        />
        <ElementCompare label="SMART ALERT" selected={getOpt('alert')} onSelect={v => setOpt('alert', v)}
          current={<div style={{ ...miniBox, borderLeft: '2px solid #E87068' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 8, fontWeight: 700, color: '#E87068', letterSpacing: '0.06em' }}>CRITICAL</span><span style={{ fontSize: 8, color: nxGold }}>2m ago</span></div><div style={{ fontSize: 10, color: nxText, marginBottom: 6 }}>Blue Dream OOS — Logan Square — $340/day</div><button style={{ background: `${nxGreen}15`, color: nxGreen, border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 9, fontWeight: 600, cursor: 'default' }}>Transfer 38 →</button></div>}
          options={{ A: <div style={miniBox}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><span style={miniDot('#E87068', 6)} /><span style={{ fontSize: 10, color: nxText }}>Blue Dream OOS — Logan Square — $340/day</span></div><button style={{ background: nxGreen, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 9, fontWeight: 600, cursor: 'default' }}>Transfer</button></div>, B: <div style={{ ...miniBox, borderLeft: '2px solid #E87068' }}><div style={{ fontSize: 10, color: nxText, marginBottom: 6 }}>Blue Dream OOS — Logan Square — $340/day</div><button style={{ background: `${nxGreen}15`, color: nxGreen, border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 9, fontWeight: 600, cursor: 'default' }}>Transfer 38</button></div>, C: <div style={{ padding: '5px 0', borderBottom: `1px solid ${nxBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 10, color: nxText }}>Blue Dream OOS — Logan Square</span><button style={{ background: nxGreen, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 8, fontWeight: 600, cursor: 'default' }}>Fix</button></div> }}
        />
        <ElementCompare label="ACTION BUTTONS" selected={getOpt('btn')} onSelect={v => setOpt('btn', v)}
          current={<div style={{ display: 'flex', gap: 6 }}><button style={{ background: `${nxGreen}15`, color: nxGreen, border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 10, fontWeight: 600, cursor: 'default' }}>Generate PO →</button><button style={{ background: `${nxGold}15`, color: nxGold, border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 10, fontWeight: 600, cursor: 'default' }}>Ask Dex</button><button style={{ background: 'transparent', color: nxDim, border: 'none', padding: '5px 8px', fontSize: 10, cursor: 'default' }}>Details</button></div>}
          options={{ A: <div style={{ display: 'flex', gap: 6 }}><button style={{ background: nxGreen, color: '#fff', border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 10, fontWeight: 600, cursor: 'default' }}>Generate PO</button><button style={{ background: nxCard, color: nxText, border: `1px solid ${nxBorder}`, borderRadius: 5, padding: '5px 12px', fontSize: 10, cursor: 'default' }}>Details</button></div>, B: <div style={{ display: 'flex', gap: 6 }}><button style={{ background: `${nxGreen}18`, color: nxGreen, border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 10, fontWeight: 600, cursor: 'default' }}>Generate PO</button><button style={{ background: 'transparent', color: nxMuted, border: 'none', padding: '5px 8px', fontSize: 10, cursor: 'default' }}>Details</button></div>, C: <div style={{ display: 'flex', gap: 8 }}><span style={{ fontSize: 10, color: nxGreen, cursor: 'default', textDecoration: 'underline' }}>Generate PO</span><span style={{ fontSize: 10, color: nxDim }}>Details</span></div> }}
        />
        <ElementCompare label="STORE HEALTH CARD" selected={getOpt('store')} onSelect={v => setOpt('store', v)}
          current={
            <div style={miniBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={miniDot(nxGreen, 8)} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: nxText }}>Logan Square</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 600, color: nxGreen, padding: '2px 6px', borderRadius: 4, background: `${nxGreen}15` }}>HEALTHY</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div><div style={{ fontSize: 8, color: nxDim }}>Revenue</div><div style={{ fontSize: 12, fontWeight: 600, color: nxText }}>$142K</div></div>
                <div><div style={{ fontSize: 8, color: nxDim }}>Margin</div><div style={{ fontSize: 12, fontWeight: 600, color: nxText }}>49.1%</div></div>
              </div>
            </div>
          }
          options={{
            A: <div style={{ borderLeft: `3px solid ${nxGreen}`, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: nxText }}>Logan Square</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 10, color: nxMuted, fontFamily: 'monospace' }}>$142K</span>
                <span style={{ fontSize: 10, color: nxMuted, fontFamily: 'monospace' }}>49.1%</span>
              </div>
            </div>,
            B: <div style={miniBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: nxText }}>Logan Square</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: nxText }}>87</span>
                  <span style={{ fontSize: 10, color: nxGreen }}>&#9650;</span>
                </div>
              </div>
            </div>,
            C: <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: nxGreen }} />
              <span style={{ fontSize: 11, color: nxText }}>Logan Square</span>
            </div>,
          }}
        />
        <ElementCompare label="PAGE TITLE TREATMENT" selected={getOpt('title')} onSelect={v => setOpt('title', v)}
          current={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${nxGreen}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: nxGreen, fontSize: 14 }}>&#9741;</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: nxText }}>Inventory Agent</div>
                <div style={{ fontSize: 9, color: nxDim }}>Purchasing & Inventory — Dutchie AI</div>
              </div>
            </div>
          }
          options={{
            A: <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: nxText, letterSpacing: '-0.01em' }}>Inventory</div>
            </div>,
            B: <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: nxText, display: 'inline-block', borderBottom: `3px solid ${nxGreen}`, paddingBottom: 3 }}>Inventory</div>
            </div>,
            C: <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: nxDim }}>
              <span>Stores</span>
              <span style={{ color: nxDim }}>&#8250;</span>
              <span>Inventory</span>
              <span style={{ color: nxDim }}>&#8250;</span>
              <span style={{ color: nxText, fontWeight: 600 }}>Logan Square</span>
            </div>,
          }}
        />
        <ElementCompare label="DATA TABLE" selected={getOpt('table')} onSelect={v => setOpt('table', v)}
          current={
            <div style={{ ...miniBox, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '6px 10px', background: `${nxGreen}08`, borderBottom: `1px solid ${nxBorder}` }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: nxDim }}>PRODUCT</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: nxDim }}>QTY</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: nxDim }}>REV</span>
              </div>
              {[['Blue Dream', '142', '$5.6K'], ['Jeeter Baby', '98', '$3.9K']].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '5px 10px', borderBottom: i === 0 ? `1px solid ${nxBorder}` : 'none' }}>
                  <span style={{ fontSize: 9, color: nxText }}>{r[0]}</span>
                  <span style={{ fontSize: 9, color: nxMuted }}>{r[1]}</span>
                  <span style={{ fontSize: 9, color: nxMuted }}>{r[2]}</span>
                </div>
              ))}
            </div>
          }
          options={{
            A: <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '4px 0', borderBottom: `1px solid ${nxBorder}` }}>
                <span style={{ fontSize: 8, fontWeight: 600, color: nxDim }}>PRODUCT</span>
                <span style={{ fontSize: 8, fontWeight: 600, color: nxDim }}>QTY</span>
                <span style={{ fontSize: 8, fontWeight: 600, color: nxDim }}>REV</span>
              </div>
              {[['Blue Dream', '142', '$5.6K'], ['Jeeter Baby', '98', '$3.9K']].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '4px 0', borderBottom: `1px solid ${nxBorder}` }}>
                  <span style={{ fontSize: 9, color: nxText, fontFamily: "'JetBrains Mono', monospace" }}>{r[0]}</span>
                  <span style={{ fontSize: 9, color: nxMuted, fontFamily: "'JetBrains Mono', monospace" }}>{r[1]}</span>
                  <span style={{ fontSize: 9, color: nxMuted, fontFamily: "'JetBrains Mono', monospace" }}>{r[2]}</span>
                </div>
              ))}
            </div>,
            B: <div>
              {[['Blue Dream', '142', '$5.6K'], ['Jeeter Baby', '98', '$3.9K']].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '5px 6px', background: i % 2 === 0 ? `${nxBorder}30` : 'transparent' }}>
                  <span style={{ fontSize: 9, color: nxText }}>{r[0]}</span>
                  <span style={{ fontSize: 9, color: nxMuted }}>{r[1]}</span>
                  <span style={{ fontSize: 9, color: nxMuted }}>{r[2]}</span>
                </div>
              ))}
            </div>,
            C: <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['Blue Dream', '142', '$5.6K'], ['Jeeter Baby', '98', '$3.9K']].map((r, i) => (
                <div key={i} style={{ ...miniBox, padding: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: nxText, marginBottom: 4 }}>{r[0]}</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 8, color: nxDim }}>Qty: <span style={{ color: nxMuted }}>{r[1]}</span></span>
                    <span style={{ fontSize: 8, color: nxDim }}>Rev: <span style={{ color: nxMuted }}>{r[2]}</span></span>
                  </div>
                </div>
              ))}
            </div>,
          }}
        />
        <ElementCompare label="CHART CONTAINER" selected={getOpt('chart')} onSelect={v => setOpt('chart', v)}
          current={
            <div style={{ ...miniBox, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: `${nxGreen}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: nxGreen }}>&#9650;</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: nxDim }}>Revenue Trend</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
                {[40, 55, 48, 70, 65, 80].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: i === 5 ? nxGreen : `${nxGreen}40` }} />
                ))}
              </div>
            </div>
          }
          options={{
            A: <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: nxDim, marginBottom: 6 }}>Revenue Trend</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
                {[40, 55, 48, 70, 65, 80].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: i === 5 ? nxGreen : `${nxGreen}40` }} />
                ))}
              </div>
            </div>,
            B: <div style={{ border: `1px solid ${nxBorder}`, borderRadius: 6, padding: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, marginBottom: 6 }}>
                {[40, 55, 48, 70, 65, 80].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: i === 5 ? nxGreen : `${nxGreen}40` }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 7, color: nxDim, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: nxGreen, display: 'inline-block' }} />This week</span>
                <span style={{ fontSize: 7, color: nxDim, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: `${nxGreen}40`, display: 'inline-block' }} />Last week</span>
              </div>
            </div>,
            C: <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24, marginBottom: 4 }}>
                {[40, 55, 48, 70, 65, 80].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? nxGreen : `${nxGreen}40` }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                {[['Mon', '$18K'], ['Tue', '$22K'], ['Wed', '$20K']].map(([d, v], i) => (
                  <div key={i} style={{ fontSize: 7, color: nxDim, textAlign: 'center' }}>{d}: <span style={{ color: nxMuted }}>{v}</span></div>
                ))}
              </div>
            </div>,
          }}
        />
        <ElementCompare label="LOADING / SKELETON" selected={getOpt('load')} onSelect={v => setOpt('load', v)}
          current={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${nxBorder}60, ${nxBorder}30, ${nxBorder}60)`, width: i === 3 ? '60%' : '100%' }} />
              ))}
            </div>
          }
          options={{
            A: <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${nxDim}`, borderTopColor: nxGreen }} />
              <span style={{ fontSize: 10, color: nxDim }}>Loading...</span>
            </div>,
            B: <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 12, borderRadius: 6, background: nxBg, width: i === 3 ? '60%' : '100%', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(90deg, transparent, ${nxBorder}80, transparent)` }} />
                </div>
              ))}
            </div>,
            C: <div style={{ padding: '16px 0' }} />,
          }}
        />
      </div>

      {/* Design Analysis */}
      <div style={{ marginTop: 40, marginBottom: 32 }}>
        <h3 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 24, color: T.text, marginBottom: 8 }}>Avoiding "Generic AI" — What to Watch For</h3>
        <p style={{ fontFamily: font.body, fontSize: 14, color: T.muted, marginBottom: 20, maxWidth: 640 }}>
          After comparing the prototype against Dutchie's production back-office side by side, here's what's signal vs. noise in the "generic AI" critique.
        </p>

        {/* Comparison grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <Card style={{ borderTop: `2px solid ${T.green}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.green, marginBottom: 12 }}>WHAT THE PRODUCTION UI DOES BETTER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { item: 'Intelligence is infrastructure, not branding', detail: 'Smart Alerts with METRC tags, severity badges, and one-click transfers — no "AI" label anywhere. It\'s just the product being smart.' },
                { item: 'Restraint in decoration', detail: 'No glowing logos, no gradient borders, no pulse animations. Every pixel serves a functional purpose.' },
                { item: 'Action buttons are plain and clear', detail: '"Transfer 38 →" in solid green. Not "Ask Dex" in a gold-tinted glow button.' },
                { item: 'The sidebar is just navigation', detail: 'Plain text labels, clear groupings. "Insights, Inventory, Catalog" — not "AI AGENTS" with a rotating spiral.' },
              ].map((p, i) => (
                <div key={i} style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                  <strong>{p.item}</strong>
                  <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{p.detail}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ borderTop: `2px solid ${T.gold}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.gold, marginBottom: 12 }}>WHERE OUR PROTOTYPE WINS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { item: 'Multi-location portfolio intelligence', detail: 'Production is single-dispensary. Ours orchestrates across 39 stores with cross-store metrics, transfers, and benchmarking.' },
                { item: 'Proactive decision-making', detail: 'Production says "here\'s a problem." Ours says "here\'s a problem, here\'s the solution, approve it."' },
                { item: 'Visual identity that stands alone', detail: 'Flowhub is white. Treez is white. Current Dutchie is white. Nexus in warm dark + gold is immediately recognizable.' },
                { item: 'Feature convergence validates our direction', detail: 'The production team built Smart Alerts with METRC tags and brand-funded discounts. They\'re building toward what we prototyped.' },
              ].map((p, i) => (
                <div key={i} style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                  <strong>{p.item}</strong>
                  <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{p.detail}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* The actual diagnosis */}
        <Card style={{ border: `1px solid ${T.gold}30`, background: `linear-gradient(135deg, ${T.card}, ${T.surface})` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.gold }} />
            <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.gold, margin: 0 }}>The Diagnosis</h4>
          </div>
          <p style={{ fontFamily: font.body, fontSize: 15, lineHeight: 1.8, color: T.muted, marginBottom: 16 }}>
            <strong style={{ color: T.text }}>"Generic AI" is a valid critique of the labels, not the design.</strong> The warm dark palette, gold accents, and data-dense layouts are distinctive and strong. Nobody else in cannabis tech looks like this. What reads as "generic AI startup" are specific branding choices that can be changed in 10 minutes:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px 16px', marginBottom: 16 }}>
            {[
              ['"Inventory Agent"', '→', '"Purchasing"'],
              ['"Growth Agent"', '→', '"Campaigns"'],
              ['"AI AGENTS" sidebar group', '→', '"TOOLS"'],
              ['"Powered by Dutchie AI"', '→', 'Remove entirely'],
              ['Rotating gradient logo border', '→', 'Static logo, no glow'],
            ].map(([from, arrow, to], i) => (
              <React.Fragment key={i}>
                <span style={{ fontSize: 13, color: T.red, fontFamily: 'monospace', textDecoration: 'line-through', opacity: 0.7 }}>{from}</span>
                <span style={{ fontSize: 13, color: T.dim }}>{arrow}</span>
                <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>{to}</span>
              </React.Fragment>
            ))}
          </div>
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.7, color: T.muted, margin: 0 }}>
            <strong style={{ color: T.text }}>Keep "Dex"</strong> as the one AI proper name (like Siri or Alexa). One branded AI personality is fine — you just don't need "AI" plastered on everything else. The design is the differentiator. The labels are the problem.
          </p>
        </Card>
      </div>

      {/* Recommendation */}
      <Card style={{ marginTop: 24, border: `1px solid ${T.gold}20` }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.gold, marginBottom: 12 }}>Recommendation</h4>
        <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.7, color: T.muted }}>
          <strong style={{ color: T.text }}>Keep the current prototype's visual design. Change the labels.</strong> The warm dark mode, gold accents, and data-dense layouts are what make Nexus distinctive in a sea of white SaaS dashboards. The "generic AI" problem is solved by renaming "AI Agents" to "Tools," removing AI-specific branding from nav items, and letting the intelligence be invisible infrastructure — exactly how Dutchie's own production team treats their Smart Alerts.
        </p>
      </Card>
    </Section>
  );
}

function QuestionSection() {
  return (
    <Section id="question">
      <SectionTitle
        sub="Section 01"
        title="The Paradigm Shift"
        desc="This is not a UI refresh. It's a fundamental change in how operators interact with their business — from pulling reports to receiving agent-driven actions."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Current Back-Office */}
        <Card>
          <Badge color={T.muted}>Current Platform</Badge>
          <h3 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 22, color: T.text, margin: '20px 0 16px' }}>Dutchie Back-Office</h3>
          <div style={{ background: '#F5F5F0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              {['Brands', 'Products', 'Inventory', 'Reports'].map(tab => (
                <span key={tab} style={{ fontSize: 12, fontWeight: tab === 'Brands' ? 600 : 400, color: tab === 'Brands' ? '#1a1a1a' : '#888', borderBottom: tab === 'Brands' ? '2px solid #00C27C' : 'none', paddingBottom: 4 }}>{tab}</span>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#888' }}>Gross Sales</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>$756K</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888' }}>Net Sales</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>$641K</div>
              </div>
            </div>
            <div style={{ height: 40, background: 'linear-gradient(90deg, #e8e8e0, #d8d8d0, #e0e0d8)', borderRadius: 6, opacity: 0.5 }} />
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              { text: 'Tab-based navigation, manual workflows', note: 'User hunts for data across tabs' },
              { text: 'Static report generation', note: 'Pull data, export, analyze in spreadsheets' },
              { text: 'Single-store mental model', note: 'MSO operators click through each location' },
              { text: 'Reactive: user asks questions of the system', note: 'Dashboards require interpretation + separate action' },
            ].map((item, i) => (
              <li key={i} style={{ fontFamily: font.body, fontSize: 14, color: T.muted, padding: '8px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.dim, flexShrink: 0 }} />
                  {item.text}
                </div>
                <div style={{ fontSize: 12, color: T.dim, marginLeft: 14, marginTop: 2 }}>{item.note}</div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Nexus */}
        <Card style={{ border: `1px solid rgba(212,160,58,0.3)`, boxShadow: '0 0 40px rgba(212,160,58,0.06)' }}>
          <Badge color={T.gold}>Nexus Platform</Badge>
          <h3 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 22, color: T.text, margin: '20px 0 16px' }}>Agent-First Operations</h3>
          <div style={{ background: '#1A1918', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['Command Center', 'Dex Agents'].map(tab => (
                <span key={tab} style={{ fontSize: 11, fontWeight: 500, color: tab === 'Command Center' ? T.green : T.dim, background: tab === 'Command Center' ? T.greenDim : 'transparent', padding: '3px 8px', borderRadius: 6 }}>{tab}</span>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: T.dim }}>Portfolio Sales</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.green }}>$13.6M</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.dim }}>Agent Actions</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.gold }}>12 Pending</div>
              </div>
            </div>
            <div style={{ height: 40, background: `linear-gradient(90deg, ${T.greenDim}, rgba(212,160,58,0.08), ${T.greenDim})`, borderRadius: 6 }} />
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              { text: 'Agent-driven workflows with approval gates', note: 'Agents draft actions, operators approve or reject' },
              { text: 'Cross-portfolio intelligence at a glance', note: 'One view across all locations, unified metrics' },
              { text: 'Proactive: system surfaces decisions to make', note: 'Agents identify issues and propose solutions before you ask' },
              { text: 'Compliance-aware automation', note: '40+ state regulatory frameworks embedded in agent logic' },
            ].map((item, i) => (
              <li key={i} style={{ fontFamily: font.body, fontSize: 14, color: T.muted, padding: '8px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, flexShrink: 0 }} />
                  {item.text}
                </div>
                <div style={{ fontSize: 12, color: T.dim, marginLeft: 14, marginTop: 2 }}>{item.note}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Key Shifts */}
      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {[
          { from: 'Dashboards you read', to: 'Agents that act', detail: 'From interpretation to automation' },
          { from: 'Per-store workflows', to: 'Portfolio-level AI', detail: 'One brain across all locations' },
          { from: 'Pull reports manually', to: 'Decisions pushed to you', detail: 'Proactive, not reactive' },
          { from: 'Generic SaaS tools', to: 'Cannabis-native intelligence', detail: '40+ states of regulatory awareness' },
        ].map((shift, i) => (
          <div key={i} style={{ background: T.surface, borderRadius: 12, padding: '16px 20px', border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontFamily: font.body, fontSize: 13, color: T.dim }}>{shift.from}</span>
              <span style={{ color: T.gold, fontSize: 16, flexShrink: 0 }}>→</span>
              <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: T.green }}>{shift.to}</span>
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginLeft: 0 }}>{shift.detail}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Brand Architecture
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_OPTIONS = [
  {
    key: 'A',
    name: 'Dutchie Nexus',
    tagline: 'Endorsed product name',
    desc: 'Nexus becomes a permanent, named product within the Dutchie family — the same pattern as Salesforce Lightning, Adobe Creative Cloud, or Google Workspace. It is NOT a version. It is a product.',
    color: T.gold,
    sidebarName: 'NEXUS',
    sidebarSub: 'by Dutchie',
    loginTitle: 'Sign in to Nexus',
    pros: [
      'Preserves $19B in Dutchie brand equity',
      'Nexus already has internal momentum — zero friction',
      'Clean product family: Nexus (B2B ops), B2C AI suite, Connect, Dex',
      'Avoids version treadmill permanently',
      'Salesforce Lightning precedent validates the pattern',
      '"I work on Nexus" > "I work on Dutchie 3.0"',
    ],
    cons: [
      'Two-word name is longer in UI contexts',
      'Requires usage guidelines (Dutchie vs Nexus vs both)',
      'People will shorten to just "Nexus" in daily use',
    ],
    confidence: 88,
    internalAppeal: 'Engineers already call it Nexus. Zero rebranding friction. PMs can own "Nexus features" — it has its own identity and roadmap.',
  },
  {
    key: 'B',
    name: 'Nexus (Standalone)',
    tagline: 'Full product independence',
    desc: 'Nexus becomes its own standalone brand. "Dutchie" recedes to a corporate/parent brand — like Alphabet to Google, or Meta to Instagram. Bold, fresh, maximum startup energy.',
    color: T.green,
    sidebarName: 'NEXUS',
    sidebarSub: 'A Dutchie platform',
    loginTitle: 'Sign in to Nexus',
    pros: [
      'Maximum brand freshness and startup energy',
      'Complete break from legacy perceptions',
      'One-word names are powerful (Slack, Linear, Figma)',
    ],
    cons: [
      'Abandons Dutchie brand equity in operator segment',
      'Sales must re-educate the market from scratch',
      'Inconsistent product family — why is one product named differently?',
      'Legal and contract complications',
    ],
    confidence: 62,
    internalAppeal: 'Feels like a startup-within-a-startup. Risk: creates "us vs. them" between Nexus team and legacy teams.',
  },
  {
    key: 'C',
    name: 'Dutchie Cortex',
    tagline: 'Platform generation name',
    desc: 'Adopt "Cortex" as the generation name for the next-gen platform. Cortex already exists internally as an initiative umbrella. Elevate it to the product brand, retire Nexus as a codename.',
    color: T.blue,
    sidebarName: 'CORTEX',
    sidebarSub: 'by Dutchie',
    loginTitle: 'Sign in to Cortex',
    pros: [
      'Strong AI/intelligence metaphor (brain, processing)',
      'Unifies the platform narrative',
      'Already has internal usage as initiative name',
    ],
    cons: [
      'Kills the Nexus name the team already loves',
      'Cortex is overused in tech (Palo Alto, ARM Cortex)',
      'Conflates initiative with product — messy boundaries',
      'Top-down rebrand feeling will frustrate the builders',
    ],
    confidence: 41,
    internalAppeal: 'Moderate. The team already loves "Nexus" — renaming it would feel like a conference room rebrand.',
  },
  {
    key: 'D',
    name: 'Dutchie Intelligence',
    tagline: 'The capability brand',
    desc: 'Brand the new platform around the capability it delivers rather than giving it a proper name. "Intelligence" becomes the product tier — like Tableau Desktop / Server / Prep.',
    color: T.purple,
    sidebarName: 'Dutchie Intelligence',
    sidebarSub: null,
    loginTitle: 'Sign in to Dutchie Intelligence',
    pros: [
      'Self-explanatory — the name tells you what it does',
      'Easy initial pitch: "It\'s Dutchie, but intelligent"',
      'No trademark risk',
    ],
    cons: [
      'Generic and boring — the team would hate it',
      'Feels like a feature tier, not a new product',
      '7 syllables — people will shorten it, uncontrollably',
      'Kills internal energy around Nexus',
    ],
    confidence: 25,
    internalAppeal: 'Low. Engineers don\'t rally around adjectives. "I work on Dutchie Intelligence" sounds like a department.',
  },
  {
    key: 'E',
    name: 'NXUS',
    tagline: 'Stylized standalone',
    desc: 'Take Nexus and stylize it — drop the "e" for a sharper, more technical mark (like Flickr, Tumblr). Distinctive and ownable, very dev-tool aesthetic.',
    color: T.orange,
    sidebarName: 'NXUS',
    sidebarSub: 'from Dutchie',
    loginTitle: 'Sign in to NXUS',
    pros: [
      'Highly distinctive and ownable',
      'Strong design potential — terminal-style typography',
      'Preserves the Nexus spirit with sharper edge',
    ],
    cons: [
      'Pronunciation ambiguity kills enterprise sales conversations',
      'Over-indexes on aesthetics over clarity',
      'Cannabis operators are not a dev-tool audience',
      'Potential trademark conflicts',
    ],
    confidence: 22,
    internalAppeal: 'High for engineers and designers. But "How do you pronounce it?" is a real risk for sales.',
  },
];

function BrandOption({ option, selected, onSelect }) {
  const isActive = selected === option.key;
  return (
    <div
      onClick={() => onSelect(option.key)}
      style={{
        background: isActive ? T.card : T.surface,
        border: `1px solid ${isActive ? option.color + '50' : T.border}`,
        borderRadius: 16, padding: 24, cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: isActive ? `0 0 30px ${option.color}10` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: font.body, fontSize: 12, fontWeight: 700, color: option.color, marginBottom: 6 }}>OPTION {option.key}</div>
          <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 20, color: T.text, margin: 0 }}>{option.name}</h4>
          <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim, margin: '4px 0 0' }}>{option.tagline}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 700, color: option.color }}>{option.confidence}%</span>
          {option.confidence >= 80 && (
            <span style={{ background: option.color, color: T.bg, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>REC</span>
          )}
        </div>
      </div>

      {/* Mini Sidebar Mockup */}
      <div style={{ background: '#1A1918', borderRadius: 10, padding: 14, marginBottom: 16, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${option.color}30, ${option.color}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NexusIcon size={12} />
          </div>
          <div>
            <span style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 14, letterSpacing: '0.06em', color: T.text }}>{option.sidebarName}</span>
            {option.sidebarSub && <span style={{ fontFamily: font.body, fontSize: 10, color: T.dim, marginLeft: 6 }}>{option.sidebarSub}</span>}
          </div>
        </div>
        {['Command Center', 'Inventory Agent', 'Marketing'].map((item, i) => (
          <div key={i} style={{ padding: '4px 8px', fontSize: 11, color: i === 0 ? T.green : T.dim, background: i === 0 ? T.greenDim : 'transparent', borderRadius: 4, marginBottom: 2 }}>{item}</div>
        ))}
      </div>

      <p style={{ fontFamily: font.body, fontSize: 13.5, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>{option.desc}</p>

      {isActive && (
        <>
          {/* Internal Appeal */}
          <div style={{ background: T.surface, borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Internal Culture Appeal</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{option.internalAppeal}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.green, marginBottom: 6 }}>PROS</div>
              {option.pros.map((p, i) => (
                <div key={i} style={{ fontSize: 12, color: T.muted, padding: '3px 0', display: 'flex', gap: 6 }}>
                  <span style={{ color: T.green, flexShrink: 0 }}>+</span> {p}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.red, marginBottom: 6 }}>CONS</div>
              {option.cons.map((c, i) => (
                <div key={i} style={{ fontSize: 12, color: T.muted, padding: '3px 0', display: 'flex', gap: 6 }}>
                  <span style={{ color: T.red, flexShrink: 0 }}>−</span> {c}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Confidence Meter */}
      <div style={{ marginTop: 16 }}>
        <div style={{ height: 4, background: T.surface, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${option.confidence}%`, height: '100%', background: option.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
      </div>
    </div>
  );
}

function BrandSection() {
  const [selected, setSelected] = useState('A');
  return (
    <Section id="brand">
      <SectionTitle
        sub="Section 02"
        title="Brand Architecture"
        desc="Five strategic approaches to naming. Version numbers are off the table — they signal changelogs, not transformation. Names create identity."
      />

      {/* Anti-version-number callout */}
      <Card style={{ marginBottom: 32, border: `1px solid ${T.red}30`, background: `${T.red}08` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
          <div>
            <h4 style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 16, color: T.text, margin: '0 0 8px' }}>Why Not "Dutchie 3.0"?</h4>
            <p style={{ fontFamily: font.body, fontSize: 13.5, lineHeight: 1.7, color: T.muted, margin: 0 }}>
              Version numbers create a treadmill. Toast doesn't say "Toast 2.0." ServiceTitan doesn't say "ST 3.0." They name things. Names create identity — numbers create confusion. Dutchie already did "2.0" internally, and another version number won't generate the excitement this deserves. Nobody asks "when is Nexus 2.0 coming?" — they ask "what's new in Nexus?"
            </p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {BRAND_OPTIONS.map(opt => (
          <BrandOption key={opt.key} option={opt} selected={selected} onSelect={setSelected} />
        ))}
      </div>

      {/* Product Family */}
      <Card style={{ marginTop: 32, border: `1px solid rgba(212,160,58,0.2)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.gold, margin: 0 }}>Recommended Product Family</h4>
          <Badge color={T.gold}>Salesforce Lightning Pattern</Badge>
        </div>
        <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.7, color: T.muted, marginBottom: 20 }}>
          <strong style={{ color: T.text }}>Dutchie Nexus</strong> is the strongest play. The name already has internal momentum, the pattern is proven (Salesforce Lightning, not Salesforce 4.0), and it solves everything — no version numbers, clear product identity, preserved brand equity, and a team that's already bought in.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { name: 'Nexus', role: 'Operator intelligence platform', color: T.gold, primary: true },
            { name: 'Connect', role: 'B2B wholesale marketplace', color: T.blue },
            { name: 'B2C AI', role: 'Voice AI, agentic commerce, budtender copilot (name TBD)', color: T.purple },
            { name: 'Dex', role: 'AI agent personality (cross-product)', color: T.green },
          ].map(p => (
            <div key={p.name} style={{ background: `${p.color}10`, border: `1px solid ${p.color}30`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: p.color }}>{p.name}</div>
                {p.primary && <span style={{ fontSize: 9, background: p.color, color: T.bg, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>PRIMARY</span>}
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>{p.role}</div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim, marginTop: 16, lineHeight: 1.6 }}>
          In daily use, people will just say "Nexus." That's fine — same as Salesforce Lightning. The "Dutchie" prefix is for formal contexts, sales decks, and contracts. The sales pitch: <em style={{ color: T.muted }}>"You've been using Dutchie for transactions. Nexus is what happens when we put agents on top of $19B in data."</em>
        </p>
      </Card>
      {/* Brand Hierarchy Visual */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 24, color: T.text, marginBottom: 24 }}>Brand Hierarchy</h3>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, padding: '40px 32px', overflow: 'hidden' }}>
          {/* Parent Brand — wordmark only, no fabricated logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-block', background: T.card, borderRadius: 16, padding: '24px 48px', border: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 36, color: T.text, letterSpacing: '-0.01em' }}>dutchie</div>
              <div style={{ fontFamily: font.body, fontSize: 12, color: T.dim, letterSpacing: '0.04em', marginTop: 4 }}>The cannabis technology company</div>
            </div>
            <div style={{ width: 2, height: 32, background: `linear-gradient(to bottom, ${T.border}, ${T.gold}40)`, margin: '0 auto' }} />
          </div>

          {/* Product Brands */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 900, margin: '0 auto' }}>
            {/* Nexus */}
            <div style={{ background: `${T.gold}08`, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 20, textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 2, height: 12, background: `${T.gold}40` }} />
              <div style={{ width: 40, height: 40, borderRadius: 12, margin: '0 auto 12px', background: 'linear-gradient(135deg, #0B6E44, #0A5C3A)', border: `1px solid ${T.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NexusIcon size={22} />
              </div>
              <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 18, color: T.gold, letterSpacing: '0.04em', marginBottom: 4 }}>NEXUS</div>
              <div style={{ fontFamily: font.body, fontSize: 11, color: T.dim, marginBottom: 12, lineHeight: 1.4 }}>Operator Intelligence Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Command Center', 'AI Agent Orchestration', 'Portfolio Analytics', 'Operational Workflows'].map(f => (
                  <div key={f} style={{ fontSize: 10, color: T.muted, background: `${T.gold}08`, borderRadius: 4, padding: '3px 6px' }}>{f}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, fontWeight: 600, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.08em' }}>B2B · Operators · MSOs</div>
            </div>

            {/* B2C AI */}
            <div style={{ background: `${T.purple}08`, borderRadius: 16, border: `1px solid ${T.purple}30`, padding: 20, textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 2, height: 12, background: `${T.purple}40` }} />
              <div style={{ width: 40, height: 40, borderRadius: 12, margin: '0 auto 12px', background: 'linear-gradient(135deg, #2A1A3A, #3D2A5A)', border: `1px solid ${T.purple}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: font.heading, fontWeight: 700, fontSize: 14, color: T.purple }}>B2C</span>
              </div>
              <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 16, color: T.purple, letterSpacing: '0.04em', marginBottom: 4 }}>B2C AI</div>
              <div style={{ fontFamily: font.body, fontSize: 10, color: T.dim, marginBottom: 8, lineHeight: 1.4 }}>Name TBD — see options below</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Voice AI Ordering', 'Agentic Commerce', 'Budtender Copilot', 'Consumer Intelligence'].map(f => (
                  <div key={f} style={{ fontSize: 10, color: T.muted, background: `${T.purple}08`, borderRadius: 4, padding: '3px 6px' }}>{f}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, fontWeight: 600, color: T.purple, textTransform: 'uppercase', letterSpacing: '0.08em' }}>B2C · Consumers · Budtenders</div>
            </div>

            {/* Connect */}
            <div style={{ background: `${T.blue}08`, borderRadius: 16, border: `1px solid ${T.blue}30`, padding: 20, textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 2, height: 12, background: `${T.blue}40` }} />
              <div style={{ width: 40, height: 40, borderRadius: 12, margin: '0 auto 12px', background: 'linear-gradient(135deg, #1A2A3A, #2A3D5A)', border: `1px solid ${T.blue}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, color: T.blue }}>⬡</span>
              </div>
              <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 18, color: T.blue, letterSpacing: '0.04em', marginBottom: 4 }}>CONNECT</div>
              <div style={{ fontFamily: font.body, fontSize: 11, color: T.dim, marginBottom: 12, lineHeight: 1.4 }}>B2B Wholesale Marketplace</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Supplier Discovery', 'Wholesale Ordering', 'Brand Partnerships', 'Catalog Distribution'].map(f => (
                  <div key={f} style={{ fontSize: 10, color: T.muted, background: `${T.blue}08`, borderRadius: 4, padding: '3px 6px' }}>{f}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, fontWeight: 600, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }}>B2B · Brands · Buyers</div>
            </div>

            {/* Dex */}
            <div style={{ background: `${T.green}08`, borderRadius: 16, border: `1px solid ${T.green}30`, padding: 20, textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 2, height: 12, background: `${T.green}40` }} />
              <div style={{ width: 40, height: 40, borderRadius: 12, margin: '0 auto 12px', background: 'linear-gradient(135deg, #0A2A1A, #1A3D2A)', border: `1px solid ${T.green}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: T.green }}>dx</span>
              </div>
              <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 18, color: T.green, letterSpacing: '0.04em', marginBottom: 4 }}>DEX</div>
              <div style={{ fontFamily: font.body, fontSize: 11, color: T.dim, marginBottom: 12, lineHeight: 1.4 }}>AI Agent Personality</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Lives in every product', 'One voice, many surfaces', 'Inventory · Pricing · Marketing', 'Customer Bridge · Voice'].map(f => (
                  <div key={f} style={{ fontSize: 10, color: T.muted, background: `${T.green}08`, borderRadius: 4, padding: '3px 6px' }}>{f}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, fontWeight: 600, color: T.green, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cross-Product · AI Layer</div>
            </div>
          </div>

          {/* Data Platform Foundation */}
          <div style={{ marginTop: 24, maxWidth: 900, margin: '24px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
              {[T.gold, T.purple, T.blue, T.green].map((c, i) => (
                <div key={i} style={{ width: 2, height: 16, background: `${c}30` }} />
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 14, color: T.dim, marginBottom: 4 }}>Dutchie Data Platform</div>
              <div style={{ fontFamily: font.body, fontSize: 11, color: T.dim }}>$19B transaction data · Catalog Cortex V3 · Loyalty & Marketing Cortex · 40+ state compliance · 6,500+ dispensaries</div>
            </div>
          </div>

          {/* Positioning Statement */}
          <div style={{ marginTop: 32, textAlign: 'center', maxWidth: 700, margin: '32px auto 0' }}>
            <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.7, color: T.muted }}>
              <strong style={{ color: T.text }}>Dutchie</strong> is the parent brand — trust, market leadership, $19B in GMV.{' '}
              <strong style={{ color: T.gold }}>Nexus</strong> is for operators who run the business.{' '}
              <strong style={{ color: T.purple }}>The B2C AI suite</strong> is for consumers who experience it.{' '}
              <strong style={{ color: T.blue }}>Connect</strong> is for brands who supply it.{' '}
              <strong style={{ color: T.green }}>Dex</strong> is the intelligence that powers all of it.
            </p>
          </div>

          {/* B2C Naming Alternatives */}
          <div style={{ marginTop: 32, maxWidth: 900, margin: '32px auto 0' }}>
            <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.purple, marginBottom: 16, textAlign: 'center' }}>B2C AI Suite — Naming Options</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { name: 'Bloom', tagline: 'Consumer AI experience', confidence: 60, note: 'Existing brand. Warm, consumer-friendly. Risk: feels like an ecommerce menu, not an AI suite.' },
                { name: 'Dutchie B2C AI', tagline: 'Direct, functional', confidence: 55, note: 'No ambiguity about what it is. Descriptive over creative. Pairs well with "Nexus" on the B2B side.' },
                { name: 'Aura', tagline: 'The AI that knows you', confidence: 50, note: 'Consumer-facing AI personality. Complementary to Dex (operator-facing). Evokes personalization and ambient intelligence.' },
                { name: 'Pulse', tagline: 'Cannabis commerce, alive', confidence: 45, note: 'Energetic, modern. Voice AI + real-time recs. Risk: generic tech name, possible trademark conflicts.' },
                { name: 'Grove', tagline: 'Where consumers grow', confidence: 40, note: 'Cannabis-native metaphor. Warm, organic. Risk: too soft for an AI-powered product.' },
              ].map(opt => (
                <div key={opt.name} style={{ background: T.card, borderRadius: 12, padding: '16px 18px', border: `1px solid ${T.border}`, cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 16, color: T.purple }}>{opt.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.purple }}>{opt.confidence}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, fontStyle: 'italic', marginBottom: 8 }}>{opt.tagline}</div>
                  <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.5 }}>{opt.note}</div>
                  <div style={{ marginTop: 8, height: 3, background: T.surface, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${opt.confidence}%`, height: '100%', background: T.purple, borderRadius: 2 }} />
                  </div>
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
// Section 3: Product Suite Map
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_MAP = [
  {
    old: 'POS + Manual Reports', oldDesc: 'Tab-based point of sale, static report builder',
    nexus: 'Command Center', nexusDesc: 'AI-orchestrated operations hub with portfolio-level intelligence',
    status: 'live', category: 'Core Operations',
    detail: 'Replaces per-store dashboarding with a single portfolio view. An MSO VP sees all 39 locations in one screen, with agents surfacing anomalies and opportunities across the whole network.',
  },
  {
    old: 'Inventory Management', oldDesc: 'Manual stock tracking, spreadsheet-based reordering',
    nexus: 'Inventory Agent', nexusDesc: 'AI-powered reorder drafting, supplier recommendations via Connect data',
    status: 'live', category: 'AI Agents',
    detail: 'Currently a 2-4 hour weekly task per store. For an MSO with 20 stores, that\'s 40-80 hours/week. The agent knows what you need (POS sell-through) and what\'s available (Connect). It drafts POs, suggests vendors by price/terms/reliability, and routes for approval.',
  },
  {
    old: 'Pricing Tools', oldDesc: 'Manual margin spreadsheets, competitor price checking',
    nexus: 'Pricing Agent', nexusDesc: 'Dynamic pricing intelligence using cross-network benchmarking',
    status: 'live', category: 'AI Agents',
    detail: 'Uses anonymized data from 6,500+ stores. When it recommends lowering Blue Dream from $45 to $40, that\'s based on pricing, velocity, and margin data across thousands of stores selling the same SKU in your state. No single-store POS has this signal.',
  },
  {
    old: 'Marketing (basic)', oldDesc: 'Email blasts, basic promos, third-party loyalty (Alpine IQ/Springbig)',
    nexus: 'Marketing Agent', nexusDesc: 'Audience segmentation, campaign orchestration, loyalty lifecycle',
    status: 'live', category: 'AI Agents',
    detail: 'Replaces Alpine IQ and Springbig entirely. Dutchie has better data than both (it owns the POS). The Loyalty & Marketing Cortex (24 proposals, 4 parts) makes this a profit center via brand-funded promotions, not just a cost center.',
  },
  {
    old: 'Customer Support', oldDesc: 'Generic helpdesk (Zendesk/Freshdesk), no cannabis context',
    nexus: 'Dex (Customer Bridge)', nexusDesc: 'AI support agent with full order history, loyalty status, and cannabis knowledge',
    status: 'live', category: 'AI Agents',
    detail: 'Dex has full context: order history (POS + ecommerce), loyalty status, past interactions, and cannabis-specific knowledge (strain effects, state regulations). Generic helpdesks have none of this.',
  },
  {
    old: 'Catalog Management', oldDesc: 'Manual product data entry, inconsistent naming',
    nexus: 'Catalog Cortex V3', nexusDesc: 'Unified product graph — normalizes data across entire ecosystem',
    status: 'cortex', category: 'Cortex Initiatives',
    detail: 'Cannabis product data is notoriously messy — "Blue Dream 3.5g" / "Blue Dream 1/8" / "BD Eighth" are the same thing. Catalog V3 creates a unified product graph that makes cross-store benchmarking and automated reordering actually work.',
  },
  {
    old: 'Loyalty & CRM', oldDesc: 'Points programs via third-party vendors',
    nexus: 'Loyalty & Marketing Cortex', nexusDesc: '24-proposal lifecycle platform — segmentation, campaigns, brand marketplace',
    status: 'cortex', category: 'Cortex Initiatives',
    detail: 'The most complex Cortex: customer data unification, ML-based segmentation, multi-channel campaign orchestration (compliance-aware per state), and a brand marketplace where CPGs pay for targeted promotions. This is a revenue engine.',
  },
  {
    old: 'Connect (B2B)', oldDesc: 'Wholesale marketplace for brands and dispensaries',
    nexus: 'Connect (retained)', nexusDesc: 'Stays separate — but Inventory Agent bridges the data gap',
    status: 'retained', category: 'Ecosystem',
    detail: 'Connect serves different users (brand reps, dispensary buyers) with different workflows. The Inventory Agent reads Connect data to power recommendations — operators never leave Nexus to interact with Connect directly.',
  },
  {
    old: 'Ecommerce / Bloom', oldDesc: 'Consumer ordering menus, dutchie.com, basic storefront',
    nexus: 'Bloom — B2C AI Suite', nexusDesc: 'Voice AI ordering, agentic commerce, budtender copilot, consumer intelligence',
    status: 'live', category: 'Ecosystem',
    detail: 'Bloom evolves from a static ordering menu into a full B2C AI suite. Voice AI handles phone orders and in-store kiosks. Agentic commerce proactively recommends products based on purchase history, preferences, and real-time inventory. The budtender copilot gives frontline staff instant access to product knowledge, strain effects, and personalized suggestions. Consumer browsing + purchase data feeds back into every Nexus agent.',
  },
];

function ProductRow({ item }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors = { live: T.green, cortex: T.purple, retained: T.blue };
  const statusLabels = { live: 'In Nexus', cortex: 'Cortex', retained: 'Retained' };
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: expanded ? T.card : 'transparent',
        border: `1px solid ${expanded ? T.border : 'transparent'}`,
        borderRadius: 12, padding: '14px 20px', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr auto', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: T.muted }}>{item.old}</div>
          {expanded && <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{item.oldDesc}</div>}
        </div>
        <span style={{ color: T.gold, textAlign: 'center', fontSize: 16 }}>→</span>
        <div>
          <div style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: T.text }}>{item.nexus}</div>
          {expanded && <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{item.nexusDesc}</div>}
        </div>
        <Badge color={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
      </div>
      {expanded && item.detail && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: 1.65, color: T.muted, margin: 0 }}>{item.detail}</p>
        </div>
      )}
    </div>
  );
}

function ProductSuiteSection() {
  const categories = [...new Set(PRODUCT_MAP.map(p => p.category))];
  return (
    <Section id="suite">
      <SectionTitle
        sub="Section 03"
        title="Product Suite Map"
        desc="How every current Dutchie product maps into the Nexus architecture. Click any row to see the strategic detail — what gets replaced, what gets extended, and why."
      />
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 32 }}>
          <h4 style={{ fontFamily: font.body, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim, marginBottom: 12, paddingLeft: 20 }}>{cat}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PRODUCT_MAP.filter(p => p.category === cat).map(item => (
              <ProductRow key={item.old} item={item} />
            ))}
          </div>
        </div>
      ))}

      <Card style={{ marginTop: 24, border: `1px solid ${T.purple}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 16, color: T.purple, margin: 0 }}>The Alpine IQ / Springbig Kill Shot</h4>
        </div>
        <p style={{ fontFamily: font.body, fontSize: 13.5, lineHeight: 1.7, color: T.muted, margin: 0 }}>
          Alpine IQ and Springbig collectively charge Dutchie's customer base an estimated $10-20M/year in aggregate. Every campaign they run uses Dutchie POS data that Dutchie gave them through API integrations — Dutchie is literally fueling its competitors' products. The Loyalty & Marketing Cortex closes that leak. Ship customer segmentation first (included in plan, better data than competitors), then loyalty migration tools (one-click import of point balances), then brand-funded promotions (the revenue engine). Sequence matters.
        </p>
      </Card>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: Design Philosophy
// ─────────────────────────────────────────────────────────────────────────────

function DesignSection() {
  return (
    <Section id="design">
      <SectionTitle
        sub="Section 04"
        title="Design Philosophy"
        desc="Not about dark mode vs. light mode — both exist. The design philosophy is about building an agent-first operational interface with a more aggressive, technical aesthetic that no cannabis competitor has attempted."
      />

      {/* Core Design Principles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
        {[
          {
            title: 'Agent-First Information Architecture',
            desc: 'Traditional SaaS: user navigates to data. Agent-first: the system navigates to the user. The approval workflow — where an operator reviews what an agent wants to do and says yes or no — is the most important screen in Nexus. Not the dashboard. Not the charts. Invest disproportionately in the approval experience.',
            color: T.gold,
            principles: ['Pending actions surface to the top', 'Agent recommendations are the primary content', 'Approval/rejection is a first-class interaction', 'Historical agent accuracy is always visible'],
          },
          {
            title: 'Operational Density, Not Dashboard Sprawl',
            desc: 'Inspired by developer tools (Linear, Vercel, Figma) and financial terminals — not by typical SaaS dashboards. Information-dense layouts that respect the operator\'s expertise. Three similar lines of data are better than one chart you have to hover over.',
            color: T.green,
            principles: ['Data-dense tables over decorative charts', 'Monospace accents for precision data', 'Keyboard shortcuts for power users', 'Portfolio-level views as default, drill-down on demand'],
          },
          {
            title: 'Technical Confidence, Not SaaS Friendly',
            desc: 'The visual language says "mission control" not "welcome to your dashboard." Sharp typography, high contrast, accent colors that mean something (green = action, gold = intelligence, red = attention). This aesthetic signals competence and earns trust from serious operators.',
            color: T.purple,
            principles: ['DM Sans headings + Inter body — clean, not decorative', 'Color is semantic, not decorative', 'Animations are functional (loading states, transitions)', 'Both dark and light modes share the same aggressive DNA'],
          },
        ].map(principle => (
          <Card key={principle.title} style={{ borderTop: `3px solid ${principle.color}` }}>
            <h4 style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 17, color: T.text, margin: '0 0 10px' }}>{principle.title}</h4>
            <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: 1.65, color: T.muted, marginBottom: 16 }}>{principle.desc}</p>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              {principle.principles.map((p, i) => (
                <div key={i} style={{ fontSize: 12, color: T.dim, padding: '4px 0', display: 'flex', gap: 6 }}>
                  <span style={{ color: principle.color, flexShrink: 0 }}>›</span> {p}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Design Precedents */}
      <h3 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 24, color: T.text, marginBottom: 20 }}>Design Precedents — Who Got This Right</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { name: 'Linear', lesson: 'Proved that B2B tools can look like consumer products without sacrificing density. Keyboard-first, opinionated, fast.', color: T.blue },
          { name: 'Vercel', lesson: 'Dark-by-default but light mode is equally polished. The "aggressive tech" aesthetic earns trust with technical users.', color: T.text },
          { name: 'Figma', lesson: 'Dense tool UI that never feels cluttered. Every pixel is intentional. Proves that complex tools can be beautiful.', color: T.purple },
          { name: 'Bloomberg Terminal', lesson: 'The gold standard for operational density. Traders don\'t want dashboards — they want data. Nexus operators are the same.', color: T.orange },
          { name: 'Toast (counter-example)', lesson: 'Good product, generic SaaS design. Looks like every other B2B tool. Nexus should NOT look like Toast.', color: T.red },
        ].map(p => (
          <div key={p.name} style={{ background: T.surface, borderRadius: 12, padding: '16px 20px', border: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 14, color: p.color, marginBottom: 6 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{p.lesson}</div>
          </div>
        ))}
      </div>

      {/* Theme System */}
      <Card style={{ border: `1px solid ${T.gold}30` }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.gold, margin: '0 0 12px' }}>Two Themes, One DNA</h4>
        <p style={{ fontFamily: font.body, fontSize: 13.5, lineHeight: 1.7, color: T.muted, marginBottom: 20 }}>
          Both dark and light modes share the same aggressive, operational aesthetic. The dark theme is the showcase — it signals "this is a different kind of tool" — but the light theme is equally polished, not an afterthought. The design system (DM Sans + Inter, semantic color system, data-dense layouts, monospace accents) is theme-agnostic. The <em>vibe</em> — technical confidence, agent-first hierarchy, operational density — carries across both.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#1A1918', borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: font.heading, fontSize: 12, fontWeight: 600, color: T.gold, marginBottom: 8 }}>DARK THEME</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#0A0908', '#141210', '#D4A03A', '#00C27C', '#F0EDE8'].map(c => (
                <div key={c} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: `1px solid ${T.border}` }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 8 }}>Warm blacks · Gold intelligence · Green action</div>
          </div>
          <div style={{ background: '#F8F6F2', borderRadius: 10, padding: 16, border: '1px solid #E0DDD6' }}>
            <div style={{ fontFamily: font.heading, fontSize: 12, fontWeight: 600, color: '#8B7D3C', marginBottom: 8 }}>LIGHT THEME</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#FFFFFF', '#F8F6F2', '#8B7D3C', '#0A7B52', '#1A1918'].map(c => (
                <div key={c} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: '1px solid #E0DDD6' }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#8B8578', marginTop: 8 }}>Warm whites · Deep gold · Forest green</div>
          </div>
        </div>
      </Card>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: How It All Fits
// ─────────────────────────────────────────────────────────────────────────────

function FitsSection() {
  const products = [
    { name: 'Nexus', desc: 'Operator Intelligence Platform', color: T.gold, items: ['Command Center', 'Intelligence Pages', 'Agent Orchestration', 'Multi-location Portfolio View'] },
    { name: 'Dex', desc: 'AI Agent Personality (cross-product)', color: T.green, items: ['Inventory Agent', 'Pricing Agent', 'Marketing Agent', 'Customer Bridge'] },
    { name: 'Connect', desc: 'B2B Wholesale Marketplace', color: T.blue, items: ['Supplier Discovery', 'Wholesale Orders', 'Brand Partnerships', 'Feeds Inventory Agent data'] },
    { name: 'B2C AI', desc: 'Consumer AI Suite (name TBD)', color: T.purple, items: ['Voice AI Ordering (phone + kiosk)', 'Agentic Commerce (proactive recs)', 'Budtender Copilot', 'Consumer Intelligence + Loyalty'] },
  ];

  return (
    <Section id="fits">
      <SectionTitle
        sub="Section 05"
        title="How It All Fits Together"
        desc="Four products, one data platform. Dex lives everywhere but belongs to no single product — same personality, different context and capabilities across each surface."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
        {products.map(p => (
          <Card key={p.name} hover>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
              <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 20, color: T.text, margin: 0 }}>{p.name}</h4>
            </div>
            <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim, marginBottom: 16 }}>{p.desc}</p>
            {p.items.map((item, i) => (
              <div key={i} style={{ fontSize: 13, color: T.muted, padding: '5px 0', borderBottom: i < p.items.length - 1 ? `1px solid ${T.border}` : 'none' }}>{item}</div>
            ))}
          </Card>
        ))}
      </div>

      {/* Data Flywheel */}
      <Card style={{ border: `1px solid ${T.gold}30`, marginBottom: 24 }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.gold, margin: '0 0 16px' }}>The Data Flywheel</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { flow: 'POS sell-through data', arrow: 'feeds', target: 'Inventory Agent reorder intelligence', color: T.green },
            { flow: 'Ecommerce browsing intent', arrow: 'feeds', target: 'Pricing Agent demand signals', color: T.gold },
            { flow: 'Connect wholesale pricing', arrow: 'feeds', target: 'Inventory Agent supplier recommendations', color: T.blue },
            { flow: 'Customer purchase history', arrow: 'feeds', target: 'Marketing Agent audience segmentation', color: T.purple },
          ].map((f, i) => (
            <div key={i} style={{ background: T.surface, borderRadius: 10, padding: '12px 16px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>{f.flow}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: f.color }}>→</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: f.color }}>{f.target}</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim, marginTop: 16, lineHeight: 1.6 }}>
          Every new dispensary makes benchmarking better. Every brand on Connect makes supply recommendations better. Every consumer order makes demand predictions better. Competitors face a cold-start problem — even if Flowhub ships an AI agent tomorrow, it's trained on ~1,000 stores, not 6,500+.
        </p>
      </Card>

      {/* Architecture Diagram */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim, marginBottom: 24 }}>Platform Architecture</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: `${T.purple}15`, border: `1px solid ${T.purple}30`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.purple }}>B2C AI Suite</div>
              <div style={{ fontSize: 11, color: T.dim }}>Consumer Experience</div>
            </div>
            <div style={{ background: `${T.blue}15`, border: `1px solid ${T.blue}30`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.blue }}>Connect</div>
              <div style={{ fontSize: 11, color: T.dim }}>B2B Marketplace</div>
            </div>
          </div>
          <div style={{ background: `${T.gold}12`, border: `1px solid ${T.gold}30`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.gold }}>Nexus — Operator Intelligence Platform</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Command Center · Intelligence Pages · Agent Orchestration</div>
          </div>
          <div style={{ background: `${T.green}12`, border: `1px solid ${T.green}30`, borderRadius: 10, padding: '14px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.green }}>Dex — AI Agent Layer</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Inventory · Pricing · Marketing · Customer Bridge</div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.dim }}>Dutchie Data Platform</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>$19B transaction data · Catalog Cortex V3 · Loyalty & Marketing Cortex</div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6: Competitive Landscape
// ─────────────────────────────────────────────────────────────────────────────

function CompetitiveSection() {
  const tiers = [
    {
      name: 'Tier 1: Point-of-Sale / Compliance',
      desc: 'The foundation layer. Everyone plays here.',
      competitors: [
        { name: 'Flowhub', strength: 'POS + compliance-first. Maui product is a modern rebuild. Strong in Colorado.', locations: '~1,000+', limitation: 'No ecommerce. No B2B marketplace. No AI beyond basic reporting. Single-store workflows — an MSO has to click through each location.', color: T.blue },
        { name: 'Treez', strength: 'POS + analytics. TreezBI is the most mature analytics among pure cannabis POS vendors.', locations: '~800+', limitation: 'No ecommerce consumer product. Analytics are backward-looking dashboards, not predictive or agentic. No agent architecture.', color: T.blue },
        { name: 'Meadow', strength: 'California-focused POS with strong delivery logistics.', locations: '~300', limitation: 'Geographic moat is also a ceiling. No multi-state capability. No AI story.', color: T.blue },
        { name: 'Cova', strength: 'Strong Canadian presence. Dutchie acquired GreenBits, removing their biggest US competitor.', locations: '~1,500+', limitation: 'Canada-heavy. US presence is fragmented. No AI, no marketplace, no ecommerce.', color: T.blue },
      ],
    },
    {
      name: 'Tier 2: Marketing / Loyalty / CRM',
      desc: 'The engagement layer. These companies are most directly threatened by Nexus.',
      competitors: [
        { name: 'Alpine IQ', strength: 'Marketing automation + loyalty + analytics. "Brands" product lets CPGs target dispensary customers.', locations: 'Series A', limitation: 'Not a POS. Depends on POS integrations (including Dutchie\'s). Data access is secondhand — they see what the POS shares, not the raw transaction stream.', color: T.purple },
        { name: 'Springbig', strength: 'Publicly traded. Largest pure-play loyalty company in cannabis. "Brands" marketplace.', locations: 'OTC', limitation: 'Stock down ~90% from peak. SMS-heavy in an era moving toward omnichannel. No POS data, no ecommerce data. AI features are cosmetic (GPT wrappers for copy).', color: T.purple },
      ],
    },
    {
      name: 'Tier 3: Full Platform',
      desc: 'Where Dutchie sits alone.',
      competitors: [
        { name: 'Dutchie (Nexus)', strength: 'POS + Ecommerce + B2B Marketplace + AI Agents + $19B transaction data. The only player that spans all columns.', locations: '6,500+', limitation: 'The agent layer is new and unproven in production. The competitive moat is real but the product must ship.', color: T.gold },
      ],
    },
  ];

  return (
    <Section id="competitive">
      <SectionTitle
        sub="Section 06"
        title="Competitive Landscape"
        desc='The standard narrative is "Dutchie vs. Flowhub vs. Treez." That framing is wrong. The real landscape has three tiers — and Dutchie is the only player that spans all of them.'
      />

      {/* Three Tiers */}
      {tiers.map((tier, ti) => (
        <div key={tier.name} style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 20, color: T.text, margin: '0 0 4px' }}>{tier.name}</h3>
            <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim }}>{tier.desc}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tier.competitors.map(c => (
              <Card key={c.name} style={c.name.includes('Dutchie') ? { border: `1px solid ${T.gold}40`, boxShadow: `0 0 30px ${T.gold}08` } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h4 style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 16, color: c.name.includes('Dutchie') ? T.gold : T.text, margin: 0 }}>{c.name}</h4>
                  <Badge color={c.color}>{c.locations}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.green, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Strength</div>
                    <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, margin: 0 }}>{c.strength}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.red, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Limitation</div>
                    <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, margin: 0 }}>{c.limitation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* The $19B Data Advantage */}
      <Card style={{ marginTop: 16, border: `1px solid ${T.gold}30`, background: `linear-gradient(135deg, ${T.card}, ${T.surface})` }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 20, color: T.gold, margin: '0 0 20px' }}>The $19B Data Advantage — How It Actually Works</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { title: 'Cross-Operator Benchmarking', desc: 'When the Pricing Agent recommends Store X lower Blue Dream from $45 to $40, that\'s based on anonymized data from thousands of stores selling the same SKU in the same state. No single-store POS has this signal.', color: T.gold },
            { title: 'Ecommerce + POS = Full Funnel', desc: 'Dutchie sees what customers browse online (intent) AND what they buy in-store (conversion). A customer who browses edibles 3x without buying is a signal no POS-only competitor can detect.', color: T.green },
            { title: 'Connect Closes the Supply Loop', desc: 'Combine retail velocity (POS), consumer demand (ecommerce), and supply availability (Connect) to say: "Brand X\'s new gummy is selling 3x faster than category average and they\'re offering 15% volume discount. Draft a PO?"', color: T.blue },
            { title: 'Compliance as Training Data', desc: 'AI agents embed knowledge of 40+ state regulatory frameworks. A pricing agent can\'t recommend a promotion that violates state advertising rules. An inventory agent can\'t suggest ordering a product type not approved in that state.', color: T.purple },
          ].map(a => (
            <div key={a.title} style={{ background: `${a.color}08`, borderRadius: 10, padding: '16px 18px', border: `1px solid ${a.color}20` }}>
              <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 14, color: a.color, marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Three Moats */}
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {[
          { moat: 'Data Network Effects', desc: 'More stores → better data → smarter agents → more stores. The Amazon flywheel for cannabis. Quality follows a power law with data volume.', color: T.gold },
          { moat: 'Workflow Embedding', desc: 'Once an MSO\'s daily operations run through Nexus agents — reordering, pricing, marketing — the platform becomes infrastructure. You don\'t switch infrastructure.', color: T.green },
          { moat: 'Two-Sided Marketplace', desc: 'Connect creates dispensary + brand lock-in. Each side makes the other stickier. Alpine IQ/Springbig have a version of this, but built on someone else\'s POS data.', color: T.blue },
        ].map(m => (
          <div key={m.moat} style={{ background: T.surface, borderRadius: 12, padding: '20px 24px', border: `1px solid ${T.border}`, borderLeft: `3px solid ${m.color}` }}>
            <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 15, color: m.color, marginBottom: 8 }}>{m.moat}</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 7: Strategic Decisions
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  {
    question: 'How much autonomy do the agents get?',
    category: 'Agent Architecture',
    recommendation: 'Launch with Copilot (recommend-only). Graduate to Guardrailed Autonomy within 90 days.',
    confidence: 85,
    color: T.gold,
    context: 'Operators want automation but fear losing control — one compliance mistake can cost a license worth millions. The approval workflow is the most important UX in Nexus. Not the dashboard. Not the charts.',
    detail: 'Three models: (1) Copilot — agent suggests, human always decides. Safe but high friction. (2) Guardrailed Autonomy — agent acts within operator-defined rules. "Reorder if stock drops below 2-week supply AND margin stays above 30%." The sweet spot. (3) Full Autonomy — agent runs independently after proving accuracy. The endgame, but never without per-operator confidence scores the operator can see.',
    options: ['Copilot (recommend only)', 'Guardrailed Autonomy (rules-based)', 'Full Autonomy (earned trust)'],
  },
  {
    question: 'MSO-first or single-store-first?',
    category: 'Go-to-Market',
    recommendation: 'MSO-first, aggressively. They have the data, the budget, the pain, and the word-of-mouth.',
    confidence: 90,
    color: T.green,
    context: 'MSOs are ~15% of dispensaries but ~50%+ of revenue. The agent value prop is dramatically stronger for MSOs — more stores = more manual work to automate = more ROI.',
    detail: 'MSOs generate the data volume that makes agents smart (single-store data is too thin). They have budget for premium pricing. A VP managing 39 stores spending 60 hours/week on manual operations will write a check for something that gives 20 hours back. And MSOs talk to each other — win Curaleaf and Green Thumb talks about it. Single-store operators get Dex in a lighter form (chat Q&A, basic recommendations) as a gateway.',
    options: ['MSO-first (enterprise motion)', 'Single-store-first (self-serve)', 'Parallel tiered (both)'],
  },
  {
    question: 'How do we weaponize data migration?',
    category: 'Competitive Strategy',
    recommendation: 'Treat data migration as a product, not a professional services project. Build automated "Import from Flowhub/Treez/Cova" tools.',
    confidence: 80,
    color: T.blue,
    context: 'The biggest barrier to adoption isn\'t feature gaps — it\'s migration pain. Shopify killed Magento by making switching trivially easy.',
    detail: 'One-click migration tools that pull historical sales data, customer lists, product catalogs, and loyalty programs. Use Dex as the migration guide: "I see you imported 18 months of Flowhub data. Here are three things your old system couldn\'t tell you: (1) your top 3 overpriced products vs. market, (2) 847 lapsed customers you could win back, (3) $23K/month in inventory carrying costs to reduce." The more history you bring, the smarter Dex gets on day one.',
    options: ['Automated migration tools (product)', 'Professional services (manual)', 'API-only (self-service)'],
  },
  {
    question: 'Is Dex one unified AI brand or per-product agents?',
    category: 'AI Brand Strategy',
    recommendation: 'One Dex everywhere. Same personality, different context per surface. Launch in domains where data advantage is strongest first.',
    confidence: 82,
    color: T.purple,
    context: 'Toast proved this with "Toast IQ" and ServiceTitan with "Atlas." One AI brand is more memorable than naming each agent separately.',
    detail: 'Dex in Nexus helps operators manage their business. Dex in Connect helps brands understand sell-through. Dex in Bloom powers the B2C AI suite — voice ordering, budtender copilot, agentic product recommendations. One personality, many surfaces. Mitigate quality variance by launching Dex where data advantage is strongest first (inventory, pricing) and expanding to consumer-facing surfaces once confidence is high. This is Veeva\'s playbook — they launched Pre-call Agent first, not everything at once.',
    options: ['One Dex (unified AI brand)', 'Per-product agents', 'No AI branding'],
  },
  {
    question: 'When do we kill Alpine IQ and Springbig?',
    category: 'Loyalty & Marketing',
    recommendation: 'Phase 1: segmentation (free, included). Phase 2: loyalty migration (90 days). Phase 3: brand-funded promotions (180 days).',
    confidence: 88,
    color: T.red,
    context: 'These vendors collectively charge Dutchie\'s customer base $10-20M/year using Dutchie POS data that Dutchie gave them through API integrations. Every dollar is leakage.',
    detail: 'Phase 1 ships immediately: customer segmentation using data better than either competitor has (Dutchie owns the POS). Market as "included in your Nexus plan at no extra cost" — the pricing weapon alone causes churn. Phase 2 at 90 days: loyalty program migration with one-click import of existing point balances. Removes the last switching barrier. Phase 3 at 180 days: brand-funded promotions marketplace. This turns the marketing capability from a competitive weapon into a profit center.',
    options: ['Aggressive (ship now, migrate at 90d)', 'Conservative (parity first, then migrate)', 'Coexist (API partnership)'],
  },
  {
    question: 'What does the operator need to see to trust an agent?',
    category: 'Trust & Transparency',
    recommendation: 'Every agent action shows its reasoning, data sources, confidence score, and historical accuracy rate.',
    confidence: 92,
    color: T.orange,
    context: 'This is the single most important UX decision. "Dex recommends lowering Blue Dream to $40" means nothing. "Dex recommends $40 because 73% of comparable stores in your state price between $38-42 and your velocity would increase an estimated 22%" — that earns trust.',
    detail: 'The approval screen must show: (1) What the agent wants to do, in plain English. (2) Why — the specific data sources and logic. (3) Expected outcome with confidence interval. (4) Historical accuracy — "this agent\'s pricing recommendations have been accepted 84% of the time and improved margins by 3.2% on average." Without this transparency, operators will override every recommendation and the system becomes a fancy notification center.',
    options: ['Full transparency (reasoning + sources + accuracy)', 'Summary only (recommendation + confidence)', 'Minimal (action + approve/reject)'],
  },
];

function DecisionCard({ decision }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card style={{ borderLeft: `3px solid ${decision.color}`, cursor: 'pointer' }} hover>
      <div onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Badge color={decision.color}>{decision.category}</Badge>
          <span style={{ fontFamily: font.body, fontSize: 12, fontWeight: 700, color: decision.color }}>{decision.confidence}%</span>
        </div>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 20, color: T.text, margin: '0 0 8px' }}>{decision.question}</h4>
        <p style={{ fontFamily: font.body, fontSize: 14, color: T.green, fontWeight: 500, margin: '0 0 12px' }}>→ {decision.recommendation}</p>
        <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim, lineHeight: 1.6, margin: 0 }}>{decision.context}</p>

        {expanded && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: 1.65, color: T.muted, marginBottom: 16 }}>{decision.detail}</p>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.dim, marginBottom: 8, textTransform: 'uppercase' }}>Options Considered</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {decision.options.map((opt, i) => (
                <span key={opt} style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: i === 0 ? `${decision.color}18` : T.surface,
                  color: i === 0 ? decision.color : T.dim,
                  border: `1px solid ${i === 0 ? decision.color + '40' : T.border}`,
                }}>
                  {opt} {i === 0 && '✓'}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ height: 4, background: T.surface, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${decision.confidence}%`, height: '100%', background: decision.color, borderRadius: 2 }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function AgentArchitectureSection() {
  const LAYERS = [
    { num: '01', label: 'Real Data Layer', status: 'Building Now', color: T.green, desc: 'POS transactions, inventory levels, cash positions, vendor catalogs, compliance rules. The single source of truth that every agent reads from.', items: ['$19B transaction history', 'Real-time inventory per store', 'Vendor catalogs via Connect', '40+ state compliance frameworks'] },
    { num: '02', label: 'Smart Workflows', status: 'Building Now', color: T.gold, desc: 'Transfer worksheets, multi-vendor POs, campaign builders, pricing tools. Direct actions that work off real data — fast, reliable, no conversation required.', items: ['Batch floor restock (4 clicks)', 'Multi-vendor PO sessions', 'Campaign package builder', 'Dynamic pricing tools'] },
    { num: '03', label: 'Behavioral Learning', status: 'Next Phase', color: T.blue, desc: 'System observes patterns and adapts defaults. "You order from Jeeter every Tuesday" → proactive suggestion. No preference screens — the system just gets it.', items: ['Action log pattern detection', 'Proactive reorder suggestions', 'Personalized alert thresholds', 'Workflow timing optimization'] },
    { num: '04', label: 'Personal Orchestration', status: 'Future', color: T.purple, desc: 'Saved workflows, preference profiles, custom automation rules. Only works when Layers 1-3 are solid — you can\'t personalize workflows that don\'t exist yet.', items: ['Saved "My Tuesday Reorder"', 'Role-based default scopes', 'Custom automation rules', 'Standing order schedules'] },
  ];
  const WORKFLOW_PRINCIPLES = [
    { title: 'Direct Action for Routine Work', desc: 'Vault-to-floor transfers happen 3-8 times daily. They must be 4 clicks, not a conversation. The transfer worksheet handles batch restocking with checkboxes and a Go button.', color: T.green, example: 'Click "Transfer" → Worksheet shows all products needing restocking → Check items → Create Transfer → Done' },
    { title: 'Agent for Complex Decisions', desc: 'Optimizing $50K monthly purchasing across 30 vendors and 10 stores is where the agent earns its keep. The agent does the thinking humans don\'t have time for.', color: T.gold, example: '"Help me rebalance inventory between my Denver stores" → Agent analyzes cross-store data → Generates optimized transfer plan' },
    { title: 'Smart Nudges Bridge the Two', desc: 'Direct actions surface agent opportunities. After creating a Jeeter PO, a toast says "2 other vendors have OOS products — View All." The agent enters when complexity exceeds a button click.', color: T.blue, example: 'Complete transfer → Toast: "12 other products below par" → Click to expand → Agent suggests par optimization' },
  ];
  const ORCHESTRATOR_DEBATE = [
    { position: 'Personal Orchestrator Agent', desc: 'Each customer gets their own meta-agent that learns preferences: ordering cadence, vendor preferences, approval style, cash constraints. It orchestrates all other agents based on this profile.', verdict: 'Premature', color: T.red, reason: 'You can\'t personalize workflows that don\'t exist yet. An orchestrator on top of fragmented manual processes just memorizes bad habits. Build the workflows first.' },
    { position: 'Data-First Intelligence', desc: 'Nail the ledger. Each workflow agent reads first-party data (inventory levels, cash position, velocity, compliance rules) and makes smart defaults. Personalization emerges from observed behavior, not declared preferences.', verdict: 'Build This', color: T.green, reason: 'First-party data beats declared preferences. People are bad at describing how they work. They\'re good at just working. The system watches and adapts.' },
    { position: 'Simple Settings + Behavioral Learning', desc: 'Settings for scope (single vendor / all vendors, one store / portfolio). Behavioral learning for timing and cadence. No separate orchestrator — each agent gets smarter through usage.', verdict: 'The Sweet Spot', color: T.gold, reason: 'A dropdown for "Default reorder scope" is simpler and more reliable than training an AI to guess. Layer behavioral learning on top once you have 90 days of action log data.' },
  ];
  return (
    <Section id="agentarch">
      <SectionTitle sub="Agent Architecture" title="How Intelligence Should Work" desc="The agent architecture isn't about chatbots. It's about making routine operations faster and complex decisions smarter — without forcing operators into conversations for things that should be button clicks." />
      {/* The Four Layers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
        {LAYERS.map(l => (
          <Card key={l.num}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontFamily: font.body, fontSize: 11, fontWeight: 700, color: l.color, letterSpacing: '0.08em' }}>LAYER {l.num}</div>
              <Badge color={l.color}>{l.status}</Badge>
            </div>
            <h4 style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 18, color: T.text, margin: '0 0 8px' }}>{l.label}</h4>
            <p style={{ fontFamily: font.body, fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>{l.desc}</p>
            {l.items.map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: T.dim, padding: '4px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: l.color }}>+</span> {item}
              </div>
            ))}
          </Card>
        ))}
      </div>
      {/* Direct Action vs Agent */}
      <h3 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 24, color: T.text, marginBottom: 24 }}>When to Use Direct Action vs. Agent</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 48 }}>
        {WORKFLOW_PRINCIPLES.map(p => (
          <Card key={p.title} style={{ borderLeft: `3px solid ${p.color}` }}>
            <h4 style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 16, color: T.text, marginBottom: 8 }}>{p.title}</h4>
            <p style={{ fontFamily: font.body, fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 12 }}>{p.desc}</p>
            <div style={{ background: T.surface, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: T.dim, fontFamily: 'monospace', lineHeight: 1.5 }}>{p.example}</div>
          </Card>
        ))}
      </div>
      {/* The Orchestrator Question */}
      <h3 style={{ fontFamily: font.heading, fontWeight: 300, fontSize: 24, color: T.text, marginBottom: 12 }}>Should Each Customer Have a Personal Orchestrator Agent?</h3>
      <p style={{ fontFamily: font.body, fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: 24, maxWidth: 680 }}>
        A proposed model where each operator gets their own meta-agent that learns preferences — ordering cadence, vendor preferences, approval style, cash constraints — and orchestrates all workflows. Here's the analysis:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
        {ORCHESTRATOR_DEBATE.map(o => (
          <Card key={o.position} style={{ border: `1px solid ${o.color}30` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h4 style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 15, color: T.text, margin: 0 }}>{o.position}</h4>
              <Badge color={o.color}>{o.verdict}</Badge>
            </div>
            <p style={{ fontFamily: font.body, fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 12 }}>{o.desc}</p>
            <div style={{ background: `${o.color}10`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: T.muted, lineHeight: 1.5, border: `1px solid ${o.color}20` }}>
              <strong style={{ color: T.text }}>Why:</strong> {o.reason}
            </div>
          </Card>
        ))}
      </div>
      {/* Inventory Workflow Insights */}
      <Card style={{ border: `1px solid rgba(212,160,58,0.2)`, marginBottom: 32 }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.gold, marginBottom: 16 }}>Cannabis Operations Insight: How Inventory Actions Really Work</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h5 style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: T.green, marginBottom: 8 }}>VAULT-TO-FLOOR TRANSFERS</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['95% of transfers are batch, not single-product', 'Vault-to-floor is NOT a METRC manifest — it\'s a room change within one license', 'Large stores do morning par restock (batch pull 15-30 products)', 'Cross-store transfers ARE manifests — different compliance weight', 'The trigger is one product, but the action is "restock everything that needs it"'].map((item, i) => (
                <li key={i} style={{ fontSize: 12, color: T.muted, padding: '4px 0', display: 'flex', gap: 6 }}><span style={{ color: T.green, flexShrink: 0 }}>→</span> {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: T.gold, marginBottom: 8 }}>PURCHASE ORDERS</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Single-SKU POs rarely meet vendor minimums ($500-$2K)', 'Bundle by vendor, surface other low-stock products from same vendor', 'BFDs (Brand Funded Discounts) should appear at point of decision', 'BFDs restricted in OH, PA — system must suppress per state', 'MSOs negotiate volume pricing across stores, but POs deliver per-license', 'Lead times vary: 24h local craft → 2 weeks large brands'].map((item, i) => (
                <li key={i} style={{ fontSize: 12, color: T.muted, padding: '4px 0', display: 'flex', gap: 6 }}><span style={{ color: T.gold, flexShrink: 0 }}>→</span> {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
      {/* Design Feedback Section */}
      <Card style={{ border: `1px solid rgba(100,168,224,0.2)` }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.blue, marginBottom: 16 }}>Avoiding "Generic AI" — Diagnosis & Fix</h4>
        <p style={{ fontFamily: font.body, fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: 16 }}>
          The observation that some elements look "generic AI" is valid for the <strong style={{ color: T.text }}>labels and branding</strong>, not the visual design. The warm dark palette + gold accents is distinctive — no competitor looks like this. The issue is vocabulary:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: `${T.red}10`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.red, marginBottom: 8 }}>READS AS "GENERIC AI"</div>
            {['"AI Agents" sidebar group', '"Inventory Agent" page label', '"Dex" branding everywhere', '"Powered by Dutchie AI" footer', 'Rotating logo glow borders', 'Sparkles icons on everything'].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: T.muted, padding: '3px 0' }}>× {item}</div>
            ))}
          </div>
          <div style={{ background: `${T.green}10`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.green, marginBottom: 8 }}>READS AS "SMART TOOL"</div>
            {['"Tools" or "Workflows" sidebar group', '"Purchasing" page label', '"Nexus Chat" or just "Chat"', 'No AI footer needed', 'Clean logo, no effects', 'Functional icons (cart, chart, megaphone)'].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: T.muted, padding: '3px 0' }}>✓ {item}</div>
            ))}
          </div>
        </div>
        <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim, lineHeight: 1.6 }}>
          <strong style={{ color: T.text }}>The fix is a 10-minute label change, not a design direction change.</strong> Keep 100% of the visual design. Change "AI Agents" → "Tools", "Inventory Agent" → "Purchasing", "Growth Agent" → "Campaigns". Keep "Dex" as the one proper AI name (like Siri or Alexa — one name is fine, you just don't plaster "AI" on everything else).
        </p>
      </Card>
    </Section>
  );
}

function DecisionsSection() {
  return (
    <Section id="decisions">
      <SectionTitle
        sub="Section 07"
        title="Strategic Decisions"
        desc="Six decisions that will determine whether Nexus succeeds or becomes another cannabis tech dashboard. These aren't naming debates — they're the forks in the road."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {DECISIONS.map(d => <DecisionCard key={d.question} decision={d} />)}
      </div>

      {/* The Three Things */}
      <Card style={{ marginTop: 40, border: `1px solid ${T.gold}30` }}>
        <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 20, color: T.gold, margin: '0 0 20px' }}>The Three Things That Make or Break This</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { num: '01', title: 'The approval workflow is the product.', desc: 'Not the dashboards, not the AI chat, not the design system. The moment where an operator reviews an agent\'s recommendation and clicks approve or reject — that is where trust is built or lost. Design it like it\'s the most important screen in the application, because it is.' },
            { num: '02', title: 'The data moat must be communicated in operator language.', desc: '"We process $19B in transactions" means nothing to a dispensary owner. "Dex can tell you that you\'re overpricing Blue Dream by $5 compared to 847 stores in your state" — that means everything. Translate the data advantage into specific, tangible outcomes.' },
            { num: '03', title: 'The Loyalty & Marketing Cortex is the highest-leverage bet.', desc: 'It simultaneously eliminates revenue leakage to Alpine IQ/Springbig, creates a new revenue stream from brand-funded promotions, deepens platform lock-in by owning the customer relationship layer, and generates behavior data that makes every other agent smarter. Ship with urgency.' },
          ].map(item => (
            <div key={item.num} style={{ display: 'flex', gap: 16 }}>
              <div style={{ fontFamily: font.body, fontSize: 24, fontWeight: 700, color: T.gold, opacity: 0.4, flexShrink: 0, width: 32 }}>{item.num}</div>
              <div>
                <div style={{ fontFamily: font.heading, fontWeight: 500, fontSize: 15, color: T.text, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 8: Rollout Timeline
// ─────────────────────────────────────────────────────────────────────────────

const PHASES = [
  {
    phase: 1,
    title: 'Prototype & Demo',
    period: 'Q2 2026',
    color: T.green,
    desc: 'Internal demos, leadership buy-in, design system alignment.',
    milestones: [
      'Nexus 1.5 prototype complete',
      'Strategic study presentation',
      'Design system convergence proposal',
      'Engineering feasibility assessment',
      'Executive stakeholder alignment',
    ],
  },
  {
    phase: 2,
    title: 'Real Data Pilot',
    period: 'Q3–Q4 2026',
    color: T.gold,
    desc: 'Select MSO partners pilot Nexus with live dispensary data. Agent accuracy validation.',
    milestones: [
      'API integration with live POS data',
      'MSO pilot (3-5 enterprise partners)',
      'AI agent accuracy validation',
      'Catalog Cortex V3 integration',
      'Approval workflow UX iteration',
      'Performance & reliability baseline',
    ],
  },
  {
    phase: 3,
    title: 'GA + Loyalty Kill Shot',
    period: '2027',
    color: T.purple,
    desc: 'Nexus becomes the default experience. Loyalty & Marketing Cortex ships. Alpine IQ / Springbig displacement begins.',
    milestones: [
      'GA launch for all MSO tiers',
      'Loyalty & Marketing Cortex Phase 1 (segmentation)',
      'Automated migration tools for Flowhub/Treez/Cova',
      'Brand-funded promotions marketplace',
      'B2C AI suite launch (voice AI, agentic commerce, budtender copilot)',
      'Legacy back-office sunset planning',
    ],
  },
];

function TimelineSection() {
  return (
    <Section id="timeline">
      <SectionTitle
        sub="Section 08"
        title="Rollout Timeline"
        desc="Three phases from prototype to platform. Each phase gates on validation metrics before proceeding."
      />
      <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8 }}>
        {PHASES.map(p => (
          <div key={p.phase} style={{ flex: '1 0 300px', minWidth: 300 }}>
            <Card style={{ borderTop: `3px solid ${p.color}`, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${p.color}18`, border: `1px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.body, fontSize: 14, fontWeight: 700, color: p.color }}>{p.phase}</div>
                <div>
                  <h4 style={{ fontFamily: font.heading, fontWeight: 400, fontSize: 18, color: T.text, margin: 0 }}>{p.title}</h4>
                  <div style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.period}</div>
                </div>
              </div>
              <p style={{ fontFamily: font.body, fontSize: 13, color: T.dim, lineHeight: 1.5, margin: '12px 0 16px' }}>{p.desc}</p>
              {p.milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < p.milestones.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontFamily: font.body, fontSize: 13, color: T.muted }}>{m}</span>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, background: T.surface, borderRadius: 12, padding: '20px 24px', border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 500, color: T.muted }}>Overall Progress</span>
          <Badge color={T.green}>Phase 1 In Progress</Badge>
        </div>
        <div style={{ height: 8, background: T.card, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: '18%', background: T.green, borderRadius: '4px 0 0 4px' }} />
          <div style={{ width: '1%', background: 'transparent' }} />
          <div style={{ width: '2%', background: `${T.gold}40`, borderRadius: 0 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: T.green }}>Q2 2026</span>
          <span style={{ fontSize: 11, color: T.dim }}>Q3–Q4 2026</span>
          <span style={{ fontSize: 11, color: T.dim }}>2027</span>
        </div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Dutchie3Study() {
  const [activeSection, setActiveSection] = useState('hero');
  const mainRef = useRef(null);

  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollY = container.scrollTop;
      let current = 'hero';
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el && el.offsetTop - 120 <= scrollY) {
          current = section.id;
        }
      }
      setActiveSection(current);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={mainRef} style={{
      minHeight: '100vh', height: '100vh', overflowY: 'auto',
      background: T.bg, color: T.text,
      fontFamily: font.body,
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <SectionNav active={activeSection} />

      <HeroSection />
      <Divider />
      <TransitionSection />
      <Divider />
      <DesignDirectionsSection />
      <Divider />
      <QuestionSection />
      <Divider />
      <BrandSection />
      <Divider />
      <ProductSuiteSection />
      <Divider />
      <DesignSection />
      <Divider />
      <FitsSection />
      <Divider />
      <CompetitiveSection />
      <Divider />
      <AgentArchitectureSection />
      <Divider />
      <DecisionsSection />
      <Divider />
      <TimelineSection />

      <div style={{ textAlign: 'center', padding: '40px 24px 80px' }}>
        <a href="#/" style={{ fontFamily: font.body, fontSize: 14, color: T.gold, textDecoration: 'none', padding: '10px 24px', borderRadius: 10, border: `1px dashed ${T.gold}40`, transition: 'all 0.2s' }}>
          ← Back to Nexus
        </a>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
