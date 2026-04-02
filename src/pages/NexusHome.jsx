import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../contexts/StoreContext';
import { useDateRange } from '../contexts/DateRangeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useAlerts } from '../contexts/AlertContext';
import { useGoals, GOAL_TYPES } from '../contexts/GoalContext';
import { locations } from '../data/mockData';
import { CountUp } from '../hooks/useCountUp';
import {
  TrendingUp, AlertTriangle, Package,
  AlertCircle, ArrowRightLeft, Check, Lock,
  Store, Shield, MessageSquare, X,
  Sparkles, Rocket, ChevronRight, ChevronDown, Users, BarChart3,
  DollarSign, ArrowUpRight, ArrowDownRight, Target,
  Upload, Download, Percent, ShoppingCart, TrendingDown, Copy,
  Inbox, ShoppingBag, CheckCircle2, XCircle, Tag,
Megaphone, Info, } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import NexusIcon from '../components/NexusIcon';
import ConfirmationDrawer from '../components/common/ConfirmationDrawer';
import { RevealOnScroll } from '../components/common/RevealOnScroll';

// ---------------------------------------------------------------------------
// Per-store metrics — deterministically generated for all 39 Ascend stores
// State-based parameters from real MSO dispensary data (2024 earnings)
// Revenue in thousands per month; ranges reflect limited-license vs saturated markets
// ---------------------------------------------------------------------------

function _seedRng(seed) {
  let s = seed | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const STATE_PARAMS = {
  IL: { revLow: 350, revMid: 525, revHigh: 750, basketLow: 85, basketHigh: 110, gmLow: 48, gmHigh: 54 },
  NJ: { revLow: 400, revMid: 540, revHigh: 700, basketLow: 80, basketHigh: 100, gmLow: 50, gmHigh: 55 },
  MA: { revLow: 250, revMid: 375, revHigh: 500, basketLow: 70, basketHigh: 90,  gmLow: 46, gmHigh: 52 },
  OH: { revLow: 275, revMid: 375, revHigh: 475, basketLow: 75, basketHigh: 90,  gmLow: 48, gmHigh: 53 },
  MD: { revLow: 250, revMid: 335, revHigh: 425, basketLow: 70, basketHigh: 85,  gmLow: 47, gmHigh: 52 },
  MI: { revLow: 100, revMid: 225, revHigh: 350, basketLow: 55, basketHigh: 75,  gmLow: 40, gmHigh: 47 },
  PA: { revLow: 100, revMid: 225, revHigh: 350, basketLow: 80, basketHigh: 95,  gmLow: 45, gmHigh: 50 },
};

const STORE_METRICS = locations.map((loc, i) => {
  const rng = _seedRng(i * 7919 + 31);
  const isOutlet = loc.name.includes('Outlet');
  const sp = STATE_PARAMS[loc.state] || STATE_PARAMS.MI;
  const tierShift = isOutlet ? -0.30 : (rng() > 0.6 ? 0.25 : 0);
  const baseRev = sp.revMid + (rng() - 0.5) * (sp.revHigh - sp.revLow) * 0.6;
  const revenue = Math.round(Math.max(sp.revLow * 0.8, baseRev * (1 + tierShift)) * 10) / 10;
  const avgBasket = Math.round((sp.basketLow + rng() * (sp.basketHigh - sp.basketLow) + (isOutlet ? -3 : 0)) * 100) / 100;
  const transactions = Math.round((revenue * 1000) / avgBasket);
  const margin = Math.round((sp.gmLow + rng() * (sp.gmHigh - sp.gmLow) + (isOutlet ? -(1 + rng()) : 0)) * 10) / 10;
  // Consume 2 rng calls to keep downstream seeds stable (were sentimentScore, sentimentDelta)
  rng(); rng();
  const vsBenchmark = Math.round((rng() * 30 - 8) * 10) / 10;
  return {
    name: loc.name, state: loc.state, city: loc.city,
    revenue, transactions, avgBasket, margin, vsBenchmark,
    revenueWeight: Math.round((revenue / 1000) * 100) / 100,
  };
});

// ---------------------------------------------------------------------------
// Nexus data — only fields consumed by MorningBriefing
// ---------------------------------------------------------------------------

const NEXUS_DATA = {
  todaySales: 13_640_000,
  grossRevenue: 15_500_000,
  discountTotal: 1_860_000,
  traffic: { today: 175_500 },
  transactions: 2_840,
  avgOrderValue: 98,
  grossMarginPct: 48.2,
  oosLostSales: 112_000,
  oosSKUs: 87,
  repeatCustomerPct: 68,
  repeatCustomerMoM: 2.1,
  lowStockAlerts: 7,
  stockoutRisk: 3,
};

const BASE = import.meta.env.BASE_URL || '/';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDollar(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Tile Components
// ---------------------------------------------------------------------------

function NexusTile({ children, className = '', span = 1, onClick }) {
  const spanClass = span === 2 ? 'lg:col-span-2' : span === 3 ? 'lg:col-span-3' : '';
  return (
    <div
      className={`rounded-xl border border-surface-border bg-surface-card shadow-card transition-all duration-200 ${onClick ? 'hover:brightness-110' : ''} overflow-hidden ${spanClass} ${className}`}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function TileHeader({ icon: Icon, title, subtitle, action, actionLabel, iconBg = 'bg-accent-green/10 text-accent-green', badge }) {
  return (
    <div className="flex items-start justify-between border-b border-surface-divider px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} />
          {badge && (
            <span className={`absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${badge.color || 'bg-accent-red'}`}>
              {badge.count}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={action}
          className="flex items-center gap-1 rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-110"
        >
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function StatRow({ label, value, sub, trend, color }) {
  const numMatch = String(value).match(/^([^0-9]*?)([\d,.]+)(.*?)$/);
  const prefix = numMatch ? numMatch[1] : '';
  const numVal = numMatch ? parseFloat(numMatch[2].replace(/,/g, '')) : 0;
  const suffix = numMatch ? numMatch[3] : '';
  const decimals = numMatch && numMatch[2].includes('.') ? (numMatch[2].split('.')[1] || '').length : 0;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="text-right">
        <span className={`text-lg font-bold ${color || 'text-text-primary'}`}>
          {numMatch ? <CountUp value={numVal} decimals={decimals} prefix={prefix} suffix={suffix} duration={800} /> : value}
        </span>
        {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
        {trend !== undefined && (
          <span className={`ml-2 text-xs font-medium ${trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}


function MorningBriefing() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
  const { selectedStoreNames, isAllSelected, selectionLabel } = useStores();
  const { dateMultiplier, rangeLabel, trendScale } = useDateRange();
  const { selectedPersona, isCEO, isVP, isRegional, isStoreMgr, isCompliance } = usePersona();
  const { getGoal } = useGoals();

  const storeRatio = useMemo(() => {
    if (isAllSelected) return 1;
    const totalRev = STORE_METRICS.reduce((sum, s) => sum + s.revenue, 0);
    const selRev = STORE_METRICS.filter(s => selectedStoreNames.has(s.name)).reduce((sum, s) => sum + s.revenue, 0);
    return totalRev > 0 ? selRev / totalRev : 0;
  }, [selectedStoreNames, isAllSelected]);

  // Compute portfolio average labor cost % from goal settings (default 20%)
  const portfolioLaborCostPct = useMemo(() => {
    const selectedStores = STORE_METRICS.filter(s => selectedStoreNames.has(s.name));
    if (selectedStores.length === 0) return 20;
    let total = 0;
    for (const s of selectedStores) {
      const laborGoal = getGoal(s.name, 'labor');
      total += laborGoal !== null ? laborGoal : 20;
    }
    return Math.round((total / selectedStores.length) * 10) / 10;
  }, [selectedStoreNames, getGoal]);

  const contributionMarginPct = Math.round((NEXUS_DATA.grossMarginPct - portfolioLaborCostPct) * 10) / 10;

  const briefingText = useMemo(() => {
    if (isCEO) return '"Portfolio revenue $1.2M yesterday, +6.8% same-store growth vs last year. IL and NJ leading at +9% and +7% SSG. MI flat — 3 stores dragging avg. Inventory turnover at 4.2x (target 5x). 87 SKUs currently out of stock across 8 stores — estimated $112K in missed sales yesterday. Margin holding at 48.2%."';
    if (isVP) return '"Your 23 stores did $720K yesterday. Same-store growth +5.1% YoY. Logan Square top performer at $48.2K. Morenci down 23% — foot traffic declining 3 weeks straight, may need local campaign. 34 out-of-stock SKUs across your region — $48K in estimated missed sales. Avg basket $118, up $4 WoW."';
    if (isRegional) return '"IL revenue $280K yesterday, +4.2% WoW. Springfield leading at +18%. 2 vault-to-floor transfers pending at Naperville — Kiva Gummies and Stiiizy Pods both have demand on floor. 34 SKUs received yesterday, all checked in. Schaumburg running a flash promo today (15% off 3-6 PM)."';
    if (isStoreMgr) return '"Logan Square did $48.2K yesterday, 8% above target. 2 products out of stock on floor — Blue Dream 3.5g (45 units in vault, ready to transfer) and Kiva Gummies (60 in vault). Stiiizy Pod LR down to 4 units on floor, transfer before afternoon rush. Happy Hour promo starts at 3 PM. No pending reorders to review."';
    if (isCompliance) return '"All 39 stores synced with state track-and-trace systems. 0 active discrepancies. NJ METRC sync delay cleared at Newark (12 min, no data loss). 3 product batches expiring within 30 days need METRC destruction events filed. Next scheduled audit: IL Mar 24."';
    return '"Yesterday was your best Friday this quarter. Springfield IL drove 34% of revenue. 3 items need reordering."';
  }, [isCEO, isVP, isRegional, isStoreMgr, isCompliance]);

  // Compute discount rate from NEXUS_DATA
  const discountRate = Math.round((NEXUS_DATA.discountTotal / NEXUS_DATA.grossRevenue) * 1000) / 10;
  const netRevenue = Math.round((NEXUS_DATA.grossRevenue - NEXUS_DATA.discountTotal) * storeRatio * dateMultiplier);
  const scaledTransactions = Math.round(NEXUS_DATA.transactions * storeRatio * dateMultiplier);
  const scaledOosLost = Math.round(NEXUS_DATA.oosLostSales * storeRatio);
  const scaledOosSKUs = Math.max(1, Math.round(NEXUS_DATA.oosSKUs * storeRatio));

  // 9 KPIs in 3 rows of 3: Revenue Story, Sales Drivers, Health Check
  const scaledGross = Math.round(NEXUS_DATA.grossRevenue * storeRatio * dateMultiplier);
  const scaledDiscount = Math.round(NEXUS_DATA.discountTotal * storeRatio * dateMultiplier);
  const kpiRows = useMemo(() => [
    // Row 1: The Revenue Story — what you sold, what you gave back, what you kept
    [
      { label: 'Gross Revenue', value: fmtDollar(scaledGross), trend: `+7.2% YoY`, up: true },
      { label: 'Discount Rate', value: `${discountRate}%`, trend: fmtDollar(scaledDiscount), up: false },
      { label: 'Net Revenue', value: fmtDollar(netRevenue), trend: `+6.8% YoY`, up: true },
    ],
    // Row 2: The Sales Drivers — what's driving the top line
    [
      { label: 'Transactions', value: scaledTransactions.toLocaleString(), trend: `+${(4.2 * trendScale).toFixed(1)}%`, up: true },
      { label: 'AOV', value: `$${NEXUS_DATA.avgOrderValue}`, trend: '+$4 WoW', up: true },
      { label: 'Units / Txn', value: '3.2', trend: '+0.1', up: true },
    ],
    // Row 3: The Health Check — are we profitable, efficient, and retaining
    [
      { label: 'Gross Margin', value: `${NEXUS_DATA.grossMarginPct}%`, trend: '+0.8pp', up: true },
      { label: 'OOS Lost Sales', value: fmtDollar(scaledOosLost), trend: `${scaledOosSKUs} SKUs`, up: false },
      { label: 'Repeat Customer', value: `${NEXUS_DATA.repeatCustomerPct}%`, trend: `+${NEXUS_DATA.repeatCustomerMoM}pp MoM`, up: true },
    ],
  ], [scaledGross, scaledDiscount, netRevenue, discountRate, scaledTransactions, trendScale, scaledOosLost, scaledOosSKUs, storeRatio, dateMultiplier]);

  const Icon = selectedPersona.icon;

  return (
    <div className="rounded-xl border overflow-hidden animate-fade-up" style={{ background: 'linear-gradient(135deg, var(--color-surface-card) 0%, var(--color-surface-bg) 50%, var(--color-surface-card) 100%)', borderColor: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' }}>
      <div className="px-6 py-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-bg)', boxShadow: '0 0 20px color-mix(in srgb, var(--color-accent-gold) 25%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 20%, transparent)' }}>
            <NexusIcon size={22} />
          </div>
          <div>
            <p className="text-xs text-text-muted">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} &middot; {rangeLabel} &middot; {selectedPersona.label}</p>
            <h1 className="text-xl font-bold text-text-primary">Good {greeting}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' }}>
          <Icon className="w-3.5 h-3.5 text-accent-gold" />
          <span className="text-[10px] font-semibold text-accent-gold">{selectedPersona.shortLabel}</span>
        </div>
      </div>
      <div className="px-6 pb-4">
        <div className="rounded-xl p-4 mb-4" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 10%, transparent)' }}>
          <p className="text-[13px] text-text-secondary leading-[1.7] italic briefing-shimmer line-clamp-3 lg:line-clamp-none">
            {briefingText}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="text-[10px] text-text-muted">Updated just now</span>
          </div>
        </div>
        {/* Hero KPIs — 3 big numbers that anchor the eye */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Net Revenue', value: fmtDollar(netRevenue), trend: '+6.8% YoY', up: true, accent: 'var(--color-accent-green)' },
            { label: 'Gross Margin', value: `${NEXUS_DATA.grossMarginPct}%`, trend: '+0.8pp', up: true, accent: 'var(--color-accent-gold)' },
            { label: 'AOV', value: `$${NEXUS_DATA.avgOrderValue}`, trend: '+$4 WoW', up: true, accent: 'var(--color-accent-green)' },
          ].map((m, i) => {
            const nm = String(m.value).match(/^([^0-9]*?)([\d,.]+)(.*?)$/);
            const pre = nm ? nm[1] : '', num = nm ? parseFloat(nm[2].replace(/,/g, '')) : 0;
            const suf = nm ? nm[3] : '', dec = nm && nm[2].includes('.') ? (nm[2].split('.')[1] || '').length : 0;
            return (
              <div key={m.label} className="rounded-xl px-3 py-3 relative overflow-hidden" style={{ background: 'var(--color-surface-bg)', border: '1px solid var(--color-surface-border)' }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: m.accent }} />
                <p className="text-[9px] uppercase tracking-[1px] text-text-muted font-semibold mb-1">{m.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-extrabold text-text-primary leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <CountUp value={num} decimals={dec} prefix={pre} suffix={suf} duration={800} delay={i * 100} />
                  </span>
                  <span className={`text-[11px] font-semibold ${m.up ? 'text-accent-green' : 'text-accent-red'}`}>{m.trend}</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* Operating Narrative — the complete story in one sentence with embedded trends */}
        <div className="rounded-xl px-4 py-3.5 mb-3" style={{ background: 'color-mix(in srgb, var(--color-surface-border) 25%, transparent)' }}>
          <p className="text-[13px] text-text-secondary leading-[1.9]">
            <span className="font-semibold text-text-primary">{scaledTransactions.toLocaleString()}</span> transactions (up {(4.2 * trendScale).toFixed(1)}% period-over-period) averaging <span className="font-semibold text-text-primary">3.2 items per basket</span> (up 0.1). Discounted <span className="font-semibold text-accent-red">{discountRate}%</span> of {fmtDollar(scaledGross)} gross ({fmtDollar(scaledDiscount)} given back). An estimated <span className="font-semibold text-accent-red">{fmtDollar(scaledOosLost)}</span> was left on the table from {scaledOosSKUs} out-of-stock SKUs. At an estimated <span className="font-semibold text-text-primary">{portfolioLaborCostPct}%</span> labor cost, contribution margin is <span className={`font-semibold ${contributionMarginPct >= 25 ? 'text-accent-green' : contributionMarginPct >= 15 ? 'text-accent-gold' : 'text-accent-red'}`}>{contributionMarginPct}%</span>.
          </p>
        </div>
        {/* Customer Health — lightweight inline row */}
        <div className="flex items-center gap-0 divide-x" style={{ borderColor: 'color-mix(in srgb, var(--color-surface-border) 60%, transparent)' }}>
          {[
            { label: 'Avg Customer LTV', val: 2840, pre: '$', suf: '', trend: '+$180 QoQ', up: true },
            { label: 'Repeat Customers', val: NEXUS_DATA.repeatCustomerPct, suf: '%', trend: `+${NEXUS_DATA.repeatCustomerMoM}pp`, up: true },
            { label: 'At-Risk Customers', val: 1247, suf: '', trend: '-8%', up: true },
          ].map((m, i) => (
            <div key={m.label} className={`flex-1 ${i > 0 ? 'pl-4' : ''} ${i < 2 ? 'pr-4' : ''}`}>
              <p className="text-[8px] uppercase tracking-[1px] text-text-muted font-semibold mb-0.5">{m.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <CountUp value={m.val} decimals={0} prefix={m.pre || ''} suffix={m.suf} duration={800} delay={300 + i * 100} />
                </span>
                <span className={`text-[9px] font-semibold ${m.up ? 'text-accent-green' : 'text-accent-red'}`}>{m.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── STATE COMPLIANCE HELPERS ─── //

const STATE_COMPLIANCE = {
  IL: { system: 'BioTrack', vaultToFloor: 'Room-to-room adjustment in BioTrack', crossStore: 'Requires licensed transport agent credentials + BioTrack manifest', agentInCharge: true, strictness: 'high' },
  MI: { system: 'METRC', vaultToFloor: 'Package room transfer in METRC', crossStore: 'METRC transfer manifest required', agentInCharge: false, strictness: 'medium' },
  OH: { system: 'METRC', vaultToFloor: 'Package room transfer in METRC', crossStore: 'METRC manifest + documented justification required', agentInCharge: false, strictness: 'very_high' },
  NJ: { system: 'METRC', vaultToFloor: 'Package room transfer in METRC', crossStore: 'METRC transfer manifest required (new system — verify procedures)', agentInCharge: false, strictness: 'high' },
  PA: { system: 'MJ Freeway', vaultToFloor: 'Inventory adjustment in MJ Freeway', crossStore: 'MJ Freeway manifest + DOH transport compliance required (medical program)', agentInCharge: false, strictness: 'very_high' },
};

function getComplianceForStore(storeStr) {
  // Extract state abbreviation from store string like "Logan Square, IL"
  const match = storeStr?.match(/,\s*([A-Z]{2})\s*$/);
  const stateCode = match ? match[1] : 'IL';
  return { stateCode, ...(STATE_COMPLIANCE[stateCode] || STATE_COMPLIANCE.IL) };
}

function ComplianceBadge({ system, size = 'sm' }) {
  const colors = {
    'METRC': { bg: 'color-mix(in srgb, var(--color-accent-green) 15%, transparent)', text: 'var(--color-accent-green)' },
    'BioTrack': { bg: 'color-mix(in srgb, var(--color-accent-blue) 15%, transparent)', text: 'var(--color-accent-blue)' },
    'MJ Freeway': { bg: 'color-mix(in srgb, var(--color-accent-purple) 15%, transparent)', text: 'var(--color-accent-purple)' },
  };
  const c = colors[system] || colors['METRC'];
  const textSize = size === 'xs' ? 'text-[7px]' : 'text-[8px]';
  return (
    <span className={`${textSize} font-bold px-1 py-px rounded`} style={{ background: c.bg, color: c.text }}>{system}</span>
  );
}

// Detect if an alert is about cross-store transfers
function isCrossStoreAlert(a) {
  const text = (a.title || '') + ' ' + (a.ai || '');
  return /inter.?store|cross.?store|store\s+[AB]|between.*stores|from.*store/i.test(text) ||
    (text.includes('OOS') && /at\s+\w+.*units at\s+\w+/i.test(text));
}

// ─── SMART ALERTS DATA ─── //

const STORE_MGR_ALERTS = [
  { id: 'vtf-1', type: 'transfer', severity: 'CRITICAL', color: 'var(--color-accent-red)', time: '2m ago', title: 'Blue Dream 3.5g — out of stock, 45 units in vault', ai: 'Floor empty for 3 days. $1,140 estimated lost sales. 45 units in vault at Logan Square ready for immediate transfer.', product: 'Blue Dream 3.5g', brand: 'Jeeter', store: 'Logan Square, IL', trackSystem: 'METRC', floor: 0, vault: 45, avgWeekly: 38, daysOOS: 3, recQty: 38, metrcPkg: '1A4060300003BD35', metrcSrc: 'Storage Vault A', metrcDest: 'Sales Floor', img: 'brands/jeeter-baby-churros.webp' },
  { id: 'vtf-2', type: 'transfer', severity: 'CRITICAL', color: 'var(--color-accent-red)', time: '18m ago', title: 'Kiva Lost Farm Gummies — 2 days out of stock', ai: '60 units in vault, customers asking at counter. Transfer 28 units (weekly avg) to floor.', product: 'Kiva Lost Farm Gummies', brand: 'Kiva', store: 'Logan Square, IL', trackSystem: 'METRC', floor: 0, vault: 60, avgWeekly: 28, daysOOS: 2, recQty: 28, metrcPkg: '1A4060300003KL60', metrcSrc: 'Storage Vault A', metrcDest: 'Sales Floor', img: 'brands/kiva-camino.jpg' },
  { id: 'low-1', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '30m ago', title: 'Stiiizy Pod LR — floor stock running low (4 units)', ai: 'At current velocity, depletes by 3 PM. 18 units available in vault.', actions: ['View Inventory'] },
  { id: 'promo-1', type: 'standard', severity: 'OPPORTUNITY', color: 'var(--color-accent-green)', time: '1h ago', title: "Today's promo: Happy Hour 15% Off (3–6 PM)", ai: 'Last week this promo drove +23% afternoon traffic.', actions: ['View Sales'] },
  { id: 'queue-1', type: 'standard', severity: 'INSIGHT', color: 'var(--color-accent-blue)', time: '2h ago', title: 'Expected traffic spike: 920 customers today', ai: 'Tuesday avg is 780. +18% projected from March Madness campaign.', actions: ['View Sales'] },
];

const CEO_ALERTS = [
  { id: 'ceo-aging', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '10m ago', title: '48 SKUs aging >60 days, $42K tied up', ai: 'Highest concentration in MA ($14K) and PA ($11K). Recommend markdown strategy or cross-store redistribution.', actions: ['View Breakdown'] },
  { id: 'ceo-brand-discount', type: 'standard', severity: 'OPPORTUNITY', color: 'var(--color-accent-green)', time: '25m ago', title: 'Jeeter 15% co-funded discount available, $18K opportunity', ai: 'Jeeter offering 15% co-funded discount on Baby Jeeter Churros. Brand covers 60% of cost. Est. $18K incremental revenue.', actions: ['Activate', 'View Details'] },
  { id: 'ceo-assortment', type: 'standard', severity: 'OPPORTUNITY', color: 'var(--color-accent-green)', time: '45m ago', title: 'Top IL SKU not in 3 MI stores, $12K/month gap', ai: 'Jeeter Baby Churros #1 in IL but not stocked at Morenci, Grand Rapids, or Ann Arbor MI. Est. $12K/month opportunity.', actions: ['Draft PO', 'View Data'] },
  { id: 'ceo-transfer', type: 'standard', severity: 'CRITICAL', color: 'var(--color-accent-red)', time: '1h ago', title: 'Store A has 30 units aging, Store B OOS — saves $1,650', ai: 'Blue Dream 89 units at Naperville (22-day supply) while Logan Square OOS 3 days. Inter-store transfer of 40 units saves $1,650.', actions: ['Transfer Now'] },
  { id: 'ceo-pricing', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '2h ago', title: 'BOGO 0.3x ROI, $4,800/month waste', ai: 'BOGO on Cookies flower has 0.3x ROI — $1,440 incremental vs $4,800/month cost. Replace with 15% off or bundle.', actions: ['View Promos'] },
  { id: 'ceo-5', type: 'standard', severity: 'INSIGHT', color: 'var(--color-accent-blue)', time: '4h ago', title: 'IL margin expanding: 48.2% → 49.1% this quarter', ai: 'Pricing optimization working. If replicated in NJ and OH, projected +$180K quarterly.', actions: ['View Margins'] },
];

const VP_ALERTS = [
  { id: 'vp-aging', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '8m ago', title: '48 SKUs aging >60 days, $42K tied up across region', ai: 'Highest in MA ($14K) and PA ($11K). 12 SKUs zero sales in 30 days.', actions: ['View Breakdown'] },
  { id: 'vp-transfer', type: 'standard', severity: 'CRITICAL', color: 'var(--color-accent-red)', time: '15m ago', title: 'Blue Dream: Naperville 89 units aging, Logan Square OOS — saves $1,650', ai: 'Logan Square lost $1,140 in 3 days. Transfer 40 units. METRC manifest ready.', actions: ['Transfer Now'] },
  { id: 'vp-brand', type: 'standard', severity: 'OPPORTUNITY', color: 'var(--color-accent-green)', time: '30m ago', title: 'Jeeter 15% co-funded discount, $18K opportunity', ai: 'Brand covers 60% of discount cost. Activate across IL and NJ for $18K incremental.', actions: ['Activate'] },
  { id: 'vp-assortment', type: 'standard', severity: 'OPPORTUNITY', color: 'var(--color-accent-green)', time: '1h ago', title: 'Top IL SKU not in 3 MI stores, $12K/month gap', ai: 'Jeeter Baby Churros not stocked at 3 MI locations.', actions: ['Draft PO'] },
  { id: 'vp-pricing', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '2h ago', title: 'BOGO on Cookies: 0.3x ROI, $4,800/month waste', ai: 'Only $1,440 incremental vs $4,800 cost. Replace with targeted 15% off.', actions: ['View Promos'] },
];

const REGIONAL_ALERTS = [
  { id: 'reg-1', type: 'transfer', severity: 'CRITICAL', color: 'var(--color-accent-red)', time: '2m ago', title: 'Blue Dream 3.5g — OOS at Logan Square, 45 in vault', ai: 'Floor empty 3 days. $1,140 lost sales. Transfer immediately.', product: 'Blue Dream 3.5g', brand: 'Jeeter', store: 'Logan Square, IL', trackSystem: 'METRC', floor: 0, vault: 45, avgWeekly: 38, daysOOS: 3, recQty: 38, metrcPkg: '1A4060300003BD35', metrcSrc: 'Storage Vault A', metrcDest: 'Sales Floor', img: 'brands/jeeter-baby-churros.webp' },
  { id: 'reg-aging', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '15m ago', title: '22 SKUs aging >60 days in IL, $18K tied up', ai: 'Springfield has 8 aging SKUs ($6K). Consider flash sale.', actions: ['View Breakdown'] },
  { id: 'reg-3', type: 'standard', severity: 'OPPORTUNITY', color: 'var(--color-accent-green)', time: '45m ago', title: 'Delivery arriving: 14 packages at Springfield', ai: '42 SKUs from DreamFields arriving 2:30 PM. METRC manifest verified.', actions: ['View Inventory'] },
  { id: 'reg-4', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '1h ago', title: 'Cash reconciliation: 2 flags from last night', ai: 'Schaumburg: $47 over. Arlington Heights: $12 short. Both within tolerance.', actions: ['View Sales'] },
  { id: 'reg-5', type: 'standard', severity: 'INSIGHT', color: 'var(--color-accent-blue)', time: '2h ago', title: 'Springfield revenue: +18% WoW, basket up $12', ai: 'Checkout display and staff training showing results.', actions: ['View Report'] },
];

const COMPLIANCE_ALERTS = [
  { id: 'comp-1', type: 'standard', severity: 'CRITICAL', color: 'var(--color-accent-red)', time: '5m ago', title: 'OH METRC reconciliation overdue at Columbus (28h)', ai: 'State requires reconciliation within 48h. 4 packages pending.', actions: ['View OH Stores'] },
  { id: 'comp-2', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '12m ago', title: 'NJ METRC: Newark sync delay cleared (12 min)', ai: 'Retried at 8:54 AM. All 4 NJ stores green. No data loss.', actions: ['View NJ Stores'] },
  { id: 'comp-3', type: 'standard', severity: 'WARNING', color: 'var(--color-accent-gold)', time: '1h ago', title: '3 product batches expiring within 30 days', ai: 'METRC destruction events required for 3 batches across IL, NJ, MA.', actions: ['View Inventory'] },
  { id: 'comp-4', type: 'standard', severity: 'OPPORTUNITY', color: 'var(--color-accent-green)', time: '2h ago', title: 'State sync: 38/39 stores green, 1 OH pending', ai: 'Average sync latency: 3.2 minutes.', actions: ['View All Stores'] },
  { id: 'comp-5', type: 'standard', severity: 'INSIGHT', color: 'var(--color-accent-blue)', time: '4h ago', title: 'License tracker: IL renewal due Apr 15', ai: 'IL 80% complete. MD renewal not yet started (120 days out).', actions: ['View Details'] },
  { id: 'comp-6', type: 'standard', severity: 'INSIGHT', color: 'var(--color-accent-purple)', time: '6h ago', title: 'OH proposing new audit frequency', ai: '4 of 6 OH stores would be affected by monthly audits.', actions: ['View OH Stores'] },
];

function getAlertsForPersona(personaId) {
  switch (personaId) {
    case 'ceo': return CEO_ALERTS;
    case 'vp_retail': return VP_ALERTS;
    case 'regional_mgr': return REGIONAL_ALERTS;
    case 'store_mgr': return STORE_MGR_ALERTS;
    case 'compliance': return COMPLIANCE_ALERTS;
    default: return STORE_MGR_ALERTS;
  }
}

const STATUS_UPDATES_BY_PERSONA = {
  ceo: [
    { text: 'NJ METRC sync delay cleared at Newark (12 min, no action needed)', icon: 'compliance' },
    { text: 'METRC reconciliation passed — 0 discrepancies across 39 stores', icon: 'compliance' },
    { text: 'March Madness campaign performing +18% above forecast', icon: 'campaign' },
    { text: 'IL wholesale delivery received on schedule — 42 SKUs checked in', icon: 'reorder' },
  ],
  vp_retail: [
    { text: 'Springfield receiving complete — all packages verified in METRC', icon: 'transfer' },
    { text: 'Morenci staffing gap filled — coverage confirmed for evening shift', icon: 'campaign' },
    { text: 'METRC reconciliation passed — 0 discrepancies (IL+MI+OH)', icon: 'compliance' },
    { text: 'Naperville foot traffic recovering — up 6% vs yesterday', icon: 'reorder' },
  ],
  regional_mgr: [
    { text: 'Springfield receiving complete — 42 SKUs verified in METRC', icon: 'transfer' },
    { text: 'METRC reconciliation passed — 0 discrepancies across IL', icon: 'compliance' },
    { text: 'Schaumburg afternoon rush cleared — no stockouts reported', icon: 'reorder' },
  ],
  store_mgr: [
    { text: 'Morning METRC reconciliation passed — 0 discrepancies', icon: 'compliance' },
    { text: 'March Madness promo active — 23 redemptions so far today', icon: 'campaign' },
    { text: 'Yesterday\'s cash close balanced — all drawers within tolerance', icon: 'transfer' },
  ],
  compliance: [
    { text: 'NJ METRC sync delay cleared at Newark (12 min, no data loss)', icon: 'compliance' },
    { text: 'METRC reconciliation passed across all IL stores — 0 discrepancies', icon: 'compliance' },
    { text: 'PA Leaf Data sync verified — all 3 stores green', icon: 'compliance' },
    { text: 'Batch #2847 approaching 30-day expiry — flagged for review', icon: 'reorder' },
  ],
};

function SmartAlertsFeed({ onAction }) {
  const navigate = useNavigate();
  const [transferState, setTransferState] = useState({});
  const [expanded, setExpanded] = useState({});
  const [actionDone, setActionDone] = useState({});
  const [confirmTransfer, setConfirmTransfer] = useState(null);
  const { selectedPersonaId, selectedPersona } = usePersona();
  const { markRead } = useAlerts();

  const SMART_ALERTS = useMemo(() => getAlertsForPersona(selectedPersonaId), [selectedPersonaId]);
  const transferAlerts = SMART_ALERTS.filter(a => a.type === 'transfer');
  const oosCount = transferAlerts.filter(a => a.floor === 0 && !transferState[a.id]).length;

  const startTransfer = (id) => {
    setTransferState(prev => ({ ...prev, [id]: { step: 1, scanning: true } }));
    setTimeout(() => {
      setTransferState(prev => ({ ...prev, [id]: { step: 2 } }));
    }, 1400);
  };

  const completeTransfer = (id) => {
    setTransferState(prev => ({ ...prev, [id]: { step: 3 } }));
  };

  const handleBulkTransfer = () => {
    transferAlerts.filter(a => a.floor === 0 && !transferState[a.id]).forEach((a, i) => {
      setTimeout(() => {
        setTransferState(prev => ({ ...prev, [a.id]: { step: 1, scanning: true } }));
        setTimeout(() => {
          setTransferState(prev => ({ ...prev, [a.id]: { step: 3 } }));
        }, 1200 + i * 300);
      }, i * 500);
    });
  };

  const handleAction = (alertId, action, alertTitle) => {
    setActionDone(prev => ({ ...prev, [`${alertId}-${action}`]: true }));
    markRead(1);

    // Find the alert to get context (product, store)
    const alert = SMART_ALERTS.find(a => a.id === alertId);
    const alertStore = alert?.store || '';
    const alertProduct = alert?.product || alert?.title || '';

    // Route based on action type
    if (action === 'View Breakdown' || action === 'View Inventory' || action === 'View All') {
      navigate('/inventory');
      return;
    }
    if (action === 'View Promos') {
      navigate('/agents/pricing');
      return;
    }
    if (action === 'View Margins') {
      navigate('/locations');
      return;
    }
    if (action === 'Draft PO') {
      navigate('/agents/connect', { state: { product: alertProduct, store: alertStore } });
      return;
    }
    if (action === 'Activate') {
      navigate('/agents/marketing');
      return;
    }

    // Default: route to Dex (bridge) with contextual query
    const alertActionQueries = {
      'low-1::View Inventory': 'Check inventory levels for Stiiizy Pod LR running low',
      'promo-1::View Sales': 'How are sales doing today vs last week?',
      'queue-1::View Sales': 'How are sales doing today vs last week?',
      'ceo-1::View Details': 'Show me revenue performance across MI stores this week',
      'ceo-2::View OH Stores': 'Show me revenue performance across OH stores this week',
      'ceo-3::View Data': 'What are our top selling brands by revenue?',
      'vp-1::View Stores': 'Show me sales performance across all stores this week',
      'vp-3::View Sales': 'Show me sales performance at Schaumburg this week',
      'vp-4::View Details': 'Show me top sellers at Wicker Park this week',
      'vp-5::View Pricing': 'Compare my pricing for Stiiizy Pod across IL and NJ',
      'reg-4::View Sales': 'Show me sales performance at Schaumburg and Arlington Heights',
      'reg-5::View Report': 'Show me revenue performance at Springfield this week',
      'comp-1::View OH Stores': 'Show me revenue performance across OH stores',
      'comp-2::View NJ Stores': 'Show me revenue performance across NJ stores',
      'comp-4::View All Stores': 'Show me revenue performance across all stores this week',
      'comp-5::View Details': 'Show me revenue performance across all stores this week',
      'comp-6::View OH Stores': 'Show me revenue performance across OH stores',
    };
    const query = alertActionQueries[`${alertId}::${action}`] || `Show me details about ${alertTitle}`;
    navigate('/agents/bridge');
  };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const renderTransferAlert = (a) => {
    const ts = transferState[a.id];
    const done = ts?.step === 3;
    const scanning = ts?.step === 1 && ts?.scanning;
    const confirming = ts?.step === 2;
    const isExpanded = expanded[a.id];
    const compliance = getComplianceForStore(a.store);

    return (
      <div key={a.id} className={`px-4 py-2.5 hover:bg-surface-hover/50 transition-colors${done ? ' green-pulse' : ''}`} style={done ? { background: 'color-mix(in srgb, var(--color-accent-green) 3%, transparent)' } : undefined}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-surface-hover">
            <img src={`${BASE}${a.img}`} alt={a.brand} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(a.id)}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ color: done ? 'var(--color-accent-green)' : a.color, background: done ? 'color-mix(in srgb, var(--color-accent-green) 8%, transparent)' : `color-mix(in srgb, ${a.color} 8%, transparent)` }}>
                {done ? 'DONE' : a.severity}
              </span>
              <span className="text-[12px] font-medium text-text-primary truncate">{a.product}</span>
              <ComplianceBadge system={compliance.system} />
              <span className="text-[10px] text-text-muted flex-shrink-0">{a.time}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-text-muted mt-0.5">
              <span>{a.store}</span>
              <span>Floor: <span className="font-semibold" style={{ color: a.floor === 0 ? 'var(--color-accent-red)' : 'var(--color-accent-gold)' }}>{a.floor}</span></span>
              <span>Vault: <span className="font-semibold text-accent-green">{a.vault}</span></span>
              <span className="text-[9px] text-text-muted italic">Room transfer — no manifest required</span>
              <span className="flex items-center gap-0.5"><Lock size={8} />{a.metrcPkg.slice(-8)}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {done ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-accent-green"><Check size={12} className="elastic-pop" />{a.recQty} moved</span>
            ) : scanning ? (
              <div className="flex items-center gap-1.5 text-[10px] text-accent-gold">
                <div className="w-4 h-4 rounded-full border border-surface-border relative"><div className="absolute inset-0 rounded-full border border-transparent border-t-accent-gold animate-spin" /></div>
                Scanning...
              </div>
            ) : confirming ? (
              <button onClick={() => completeTransfer(a.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-accent-green text-white hover:brightness-110 transition-colors">
                <Check size={11} />Confirm
              </button>
            ) : (
              <button onClick={() => setConfirmTransfer(a)} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors">
                <ArrowRightLeft size={11} />Transfer {a.recQty}
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 ml-11 text-[11px] rounded-lg px-3 py-2 border border-surface-border bg-surface-bg">
            <p className="text-text-secondary mb-1.5">{a.ai}</p>
            {done && (
              <div className="flex flex-wrap gap-x-3 text-[10px] text-text-muted">
                <span className="text-accent-green">{compliance.vaultToFloor} completed</span>
                <span>{a.metrcSrc} → {a.metrcDest}</span>
                <span>Pkg: {a.metrcPkg}</span>
              </div>
            )}
            {!done && !scanning && !confirming && (
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                  <span>{a.metrcSrc} → {a.metrcDest}</span>
                  <span>Rec: {a.recQty} units</span>
                  {a.daysOOS > 0 && <span className="text-accent-red">{a.daysOOS}d OOS</span>}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-text-muted">
                  <ComplianceBadge system={compliance.system} size="xs" />
                  <span>{compliance.vaultToFloor}</span>
                  {compliance.agentInCharge && <span className="text-accent-gold font-semibold">· Agent-in-charge approval required</span>}
                </div>
              </div>
            )}
            {confirming && (
              <div className="flex items-center gap-2 text-[10px]">
                <Check size={11} className="text-accent-green" />
                <span className="text-accent-green">{compliance.system} tag {a.metrcPkg.slice(-8)} verified</span>
                <span className="text-text-muted">{a.recQty} units · {a.metrcSrc} → {a.metrcDest}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStandardAlert = (a) => {
    const isExpanded = expanded[a.id];
    const isCrossStore = isCrossStoreAlert(a);
    // For cross-store alerts, derive compliance from the alert text (IL stores mentioned)
    const crossStoreCompliance = isCrossStore ? getComplianceForStore('Store, IL') : null;
    return (
      <div key={a.id} className="px-4 py-2.5 hover:bg-surface-hover/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${a.color} 6%, transparent)` }}>
            {a.severity === 'CRITICAL' && <AlertCircle size={14} style={{ color: a.color }} />}
            {a.severity === 'WARNING' && <AlertTriangle size={14} style={{ color: a.color }} />}
            {a.severity === 'OPPORTUNITY' && <TrendingUp size={14} style={{ color: a.color }} />}
            {a.severity === 'INSIGHT' && <Sparkles size={14} style={{ color: a.color }} />}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(a.id)}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ color: a.color, background: `color-mix(in srgb, ${a.color} 8%, transparent)` }}>
                {a.severity}
              </span>
              <span className="text-[12px] font-medium text-text-primary truncate">{a.title}</span>
              {isCrossStore && <ComplianceBadge system={crossStoreCompliance.system} />}
              <span className="text-[10px] text-text-muted flex-shrink-0">{a.time}</span>
            </div>
            {isCrossStore && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-semibold text-accent-gold">Cross-store transfer requires {crossStoreCompliance.crossStore}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {a.actions.map((act, j) => {
              const isDone = actionDone[`${a.id}-${act}`];
              return (
                <button
                  key={j}
                  onClick={() => handleAction(a.id, act, a.title)}
                  disabled={isDone}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                    isDone ? 'text-accent-green bg-accent-green/10 cursor-default'
                    : j === 0 ? 'text-white hover:brightness-110' : 'text-text-secondary border border-surface-border hover:text-text-primary'
                  }`}
                  style={!isDone && j === 0 ? { background: a.color } : undefined}
                >
                  {isDone ? <span className="flex items-center gap-1"><Check size={10} />Done</span> : act}
                </button>
              );
            })}
          </div>
        </div>
        {isExpanded && (
          <div className="mt-2 ml-11 text-[11px] rounded-lg px-3 py-2 border border-surface-border bg-surface-bg">
            <p className="text-text-secondary">{a.ai}</p>
            {isCrossStore && (
              <div className="mt-2 rounded-lg px-2.5 py-2 border" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-gold) 25%, var(--color-surface-border))', background: 'color-mix(in srgb, var(--color-accent-gold) 5%, transparent)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={10} className="text-accent-gold" />
                  <span className="text-[10px] font-semibold text-accent-gold">Cross-Store Compliance</span>
                  <ComplianceBadge system={crossStoreCompliance.system} size="xs" />
                </div>
                <p className="text-[10px] text-text-secondary">{crossStoreCompliance.crossStore}</p>
                {crossStoreCompliance.strictness === 'very_high' && (
                  <div className="mt-1 rounded px-2 py-1" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' }}>
                    <span className="text-[9px] font-bold text-accent-gold">
                      {crossStoreCompliance.stateCode === 'OH' ? 'Ohio requires documented justification for all transfers' : 'Pennsylvania DOH transport regulations apply'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <NexusTile className="animate-fade-up" style={{ animationDelay: '300ms' }}>
      <div className="px-4 py-2.5 flex justify-between items-center border-b border-surface-divider">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent-gold" />
          <span className="text-xs font-semibold text-text-primary">Smart Alerts</span>
          <span className="text-[10px] text-text-muted">{SMART_ALERTS.length} active &middot; {selectedPersona.shortLabel}</span>
        </div>
        {oosCount > 0 && (
          <button onClick={() => setConfirmTransfer('bulk')} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-accent-red bg-accent-red/10 border border-accent-red/20 hover:bg-accent-red/15 transition-colors">
            <ArrowRightLeft size={11} /> Transfer {oosCount} OOS
          </button>
        )}
      </div>

      <div className="divide-y divide-surface-divider">
        {SMART_ALERTS.map(a => a.type === 'transfer' ? renderTransferAlert(a) : renderStandardAlert(a))}
      </div>

      <div className="px-4 py-2 border-t border-surface-divider" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 3%, transparent)' }}>
        <p className="text-[10px] font-medium text-text-muted mb-1">Status Updates</p>
        {(STATUS_UPDATES_BY_PERSONA[selectedPersonaId] || STATUS_UPDATES_BY_PERSONA.store_mgr).map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-0.5">
            {r.icon === 'transfer' && <ArrowRightLeft className="w-3 h-3 text-accent-green" />}
            {r.icon === 'campaign' && <Rocket className="w-3 h-3 text-accent-green" />}
            {r.icon === 'compliance' && <Lock className="w-3 h-3 text-accent-green" />}
            {r.icon === 'reorder' && <Package className="w-3 h-3 text-accent-green" />}
            {r.text}
          </div>
        ))}
      </div>
      {confirmTransfer && confirmTransfer !== 'bulk' && (
        <ConfirmationDrawer
          open={true}
          onCancel={() => setConfirmTransfer(null)}
          onConfirm={() => { const id = confirmTransfer.id; setConfirmTransfer(null); startTransfer(id); }}
          title="Confirm Vault-to-Floor Transfer"
          description={`Move ${confirmTransfer.product} to sales floor`}
          icon={ArrowRightLeft}
          confirmLabel={`Transfer ${confirmTransfer.recQty} Units`}
          confirmColor="var(--color-accent-gold)"
          details={[
            { label: 'Product', value: confirmTransfer.product },
            { label: 'Store', value: confirmTransfer.store },
            { label: 'Quantity', value: `${confirmTransfer.recQty} units` },
            { label: 'From → To', value: `${confirmTransfer.metrcSrc} → ${confirmTransfer.metrcDest}` },
            { label: 'Compliance System', value: getComplianceForStore(confirmTransfer.store).system },
            { label: 'METRC Package', value: confirmTransfer.metrcPkg },
            { label: 'Days OOS', value: `${confirmTransfer.daysOOS} days` },
          ]}
          warning={`${getComplianceForStore(confirmTransfer.store).vaultToFloor}. Room transfer — no manifest required.`}
        />
      )}
      {confirmTransfer === 'bulk' && (
        <ConfirmationDrawer
          open={true}
          onCancel={() => setConfirmTransfer(null)}
          onConfirm={() => { setConfirmTransfer(null); handleBulkTransfer(); }}
          title="Confirm Bulk Transfer"
          description={`Transfer ${oosCount} out-of-stock items from vault to floor`}
          icon={ArrowRightLeft}
          confirmLabel={`Transfer All ${oosCount} Items`}
          confirmColor="var(--color-accent-red)"
          details={transferAlerts.filter(a => a.floor === 0 && !transferState[a.id]).map(a => ({
            label: a.product,
            value: `${a.recQty} units · ${a.metrcPkg.slice(-8)}`,
          }))}
          warning="This will create METRC manifests for all items and update inventory records."
        />
      )}
    </NexusTile>
  );
}


// ─── STORE HEALTH MATRIX ─── //

function StoreHealthMatrix() {
  const navigate = useNavigate();
  const { selectedStoreNames } = useStores();
  const { isStoreMgr, isCompliance, selectedPersona } = usePersona();
  const { getGoal } = useGoals();

  const stores = useMemo(() => {
    return STORE_METRICS.filter(s => selectedStoreNames.has(s.name)).slice(0, 12).map(s => {
      const rng = _seedRng(s.name.length * 31);
      const revScore = Math.min(100, Math.round((s.revenue / 750) * 100));
      const marginScore = Math.min(100, Math.round((s.margin / 55) * 100));
      const stockScore = Math.round(70 + rng() * 30);
      const compScore = Math.round(75 + rng() * 25);
      const composite = Math.round(revScore * 0.35 + marginScore * 0.25 + stockScore * 0.25 + compScore * 0.15);
      const alerts = s.vsBenchmark <= -5 ? 2 : s.margin < 44 ? 1 : 0;
      return { ...s, composite, alerts, stockScore, compScore };
    }).sort((a, b) => a.composite - b.composite);
  }, [selectedStoreNames]);

  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    if (!selectedStore) return;
    const handler = (e) => { if (e.key === 'Escape') setSelectedStore(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedStore]);

  const getStatusColor = (composite) => {
    if (composite >= 75) return 'var(--color-accent-green)';
    if (composite >= 55) return 'var(--color-accent-gold)';
    return 'var(--color-accent-red)';
  };

  const getStatusLabel = (composite) => {
    if (composite >= 75) return 'Healthy';
    if (composite >= 55) return 'Watch';
    return 'At Risk';
  };

  if (isStoreMgr) {
    return (
      <NexusTile className="animate-fade-up" style={{ animationDelay: '400ms' }}>
        <div className="px-5 py-3 flex justify-between items-center border-b border-surface-divider">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-accent-gold" />
            <span className="text-xs font-semibold text-text-primary">Logan Square — Store Dashboard</span>
          </div>
          <span className="text-[9px] px-1.5 py-px rounded-full bg-accent-green/10 text-accent-green font-bold">METRC Synced</span>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Vault Items', value: '142', sub: '12 pending transfer', color: 'var(--color-accent-gold)' },
              { label: 'Floor SKUs', value: '284', sub: '2 OOS', color: 'var(--color-accent-red)' },
              { label: 'Staff On Duty', value: '8', sub: '3 budtenders', color: 'var(--color-accent-blue)' },
              { label: 'Revenue Today', value: '$34.2K', sub: '+8% vs target', color: 'var(--color-accent-green)' },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-surface-border bg-surface-bg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px] text-text-muted">{m.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Transactions', value: '312', trend: '+7.1%', up: true },
              { label: 'Avg Basket', value: '$110', trend: '+$4', up: true },
              { label: 'CSAT Score', value: '4.6', trend: '+0.2', up: true },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-surface-border bg-surface-bg p-3 text-center">
                <p className="text-[10px] text-text-muted mb-1">{m.label}</p>
                <p className="text-base font-bold text-text-primary">{m.value}</p>
                <p className={`text-[10px] font-medium ${m.up ? 'text-accent-green' : 'text-accent-red'}`}>{m.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </NexusTile>
    );
  }

  if (isCompliance) {
    const stateCompliance = [
      { state: 'IL', system: 'METRC', stores: 8, synced: 8, lastSync: '4m ago', status: 'green', discrepancies: 0, nextAudit: 'Mar 24' },
      { state: 'NJ', system: 'METRC', stores: 5, synced: 5, lastSync: '8m ago', status: 'green', discrepancies: 0, nextAudit: 'Apr 12' },
      { state: 'OH', system: 'METRC', stores: 6, synced: 5, lastSync: '28h ago', status: 'warning', discrepancies: 1, nextAudit: 'May 1' },
      { state: 'MA', system: 'METRC', stores: 4, synced: 4, lastSync: '6m ago', status: 'green', discrepancies: 0, nextAudit: 'Jun 15' },
      { state: 'MI', system: 'METRC', stores: 7, synced: 7, lastSync: '3m ago', status: 'green', discrepancies: 0, nextAudit: 'Apr 30' },
      { state: 'MD', system: 'METRC', stores: 4, synced: 4, lastSync: '5m ago', status: 'green', discrepancies: 0, nextAudit: 'Jun 30' },
      { state: 'PA', system: 'MJ Freeway', stores: 5, synced: 5, lastSync: '7m ago', status: 'green', discrepancies: 0, nextAudit: 'May 15' },
    ];
    return (
      <NexusTile className="animate-fade-up" style={{ animationDelay: '400ms' }}>
        <div className="px-5 py-3 flex justify-between items-center border-b border-surface-divider">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-semibold text-text-primary">Compliance Status by State</span>
          </div>
          <span className="text-[10px] text-accent-green font-semibold">38/39 stores synced</span>
        </div>
        <div className="px-5 py-4 space-y-2">
          {stateCompliance.map(sc => {
            const statusColor = sc.status === 'green' ? 'var(--color-accent-green)' : sc.status === 'warning' ? 'var(--color-accent-gold)' : 'var(--color-accent-red)';
            return (
              <div key={sc.state} className="flex items-center gap-4 rounded-xl border border-surface-border bg-surface-bg px-4 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: `color-mix(in srgb, ${statusColor} 8%, transparent)`, color: statusColor }}>
                  {sc.state}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-text-primary">{sc.stores} stores</span>
                    <span className="px-1.5 py-px rounded text-[8px] font-bold" style={{ background: `color-mix(in srgb, ${statusColor} 8%, transparent)`, color: statusColor }}>{sc.system}</span>
                  </div>
                  <p className="text-[10px] text-text-muted">Last sync: {sc.lastSync} &middot; Next audit: {sc.nextAudit}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs font-bold" style={{ color: statusColor }}>{sc.synced}/{sc.stores}</p>
                    <p className="text-[9px] text-text-muted">synced</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold ${sc.discrepancies > 0 ? 'text-accent-red' : 'text-accent-green'}`}>{sc.discrepancies}</p>
                    <p className="text-[9px] text-text-muted">disc.</p>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </NexusTile>
    );
  }

  // Default: Multi-store health matrix
  return (
    <>
    <NexusTile className="animate-fade-up" style={{ animationDelay: '400ms' }}>
      <div className="px-5 py-3 flex justify-between items-center border-b border-surface-divider">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-accent-gold" />
          <span className="text-xs font-semibold text-text-primary">Store Health Matrix</span>
          <span className="text-[10px] text-text-muted">{selectedPersona.shortLabel} view</span>
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-green" /> Healthy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-gold" /> Watch</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-red" /> At Risk</span>
        </div>
      </div>
      {/* Summary line */}
      {(() => {
        const healthyCt = stores.filter(s => s.composite >= 75).length;
        const watchCt = stores.filter(s => s.composite >= 55 && s.composite < 75).length;
        const atRiskCt = stores.filter(s => s.composite < 55).length;
        const portfolioRev = stores.reduce((sum, s) => sum + s.revenue, 0);
        return (
          <div className="px-5 pt-3 pb-1 text-[11px] text-text-muted">
            <span className="font-semibold text-text-secondary">{stores.length} stores</span>
            {' · '}
            <span className="text-accent-green font-medium">{healthyCt} Healthy</span>
            {' · '}
            <span className="text-accent-gold font-medium">{watchCt} Watch</span>
            {' · '}
            <span className="text-accent-red font-medium">{atRiskCt} At Risk</span>
            {' · Portfolio Revenue '}
            <span className="font-semibold text-text-secondary">{fmtDollar(portfolioRev * 1000)} MTD</span>
            {' (+6.8%)'}
          </div>
        );
      })()}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stores.map(s => {
          const statusColor = getStatusColor(s.composite);
          const statusLabel = getStatusLabel(s.composite);
          return (
            <div key={s.name} onClick={() => setSelectedStore(s)} className="rounded-xl border border-surface-border bg-surface-bg p-3 hover:brightness-110 transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ color: statusColor, background: `color-mix(in srgb, ${statusColor} 10%, transparent)` }}>{statusLabel}</span>
              </div>
              <p className="text-[11px] font-semibold text-text-primary truncate">{s.name}</p>
              <p className="text-[10px] text-text-muted mb-1.5">{s.city}, {s.state}</p>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px]">
                  <span className="text-text-muted">Rev MTD </span>
                  <span className="font-semibold text-text-primary">{fmtDollar(s.revenue * 1000)}</span>
                </div>
                <div className="text-[10px]">
                  <span className="text-text-muted">Margin </span>
                  <span className="font-semibold text-text-primary">{s.margin}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold ${s.vsBenchmark >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{s.vsBenchmark >= 0 ? '+' : ''}{s.vsBenchmark}%</span>
                {s.alerts > 0 && <span className="text-[9px] font-semibold text-accent-red bg-accent-red/10 px-1.5 py-px rounded-full">{s.alerts} alert{s.alerts > 1 ? 's' : ''}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </NexusTile>

    {selectedStore && (() => {
      const s = selectedStore;
      const statusColor = getStatusColor(s.composite);
      const statusLabel = getStatusLabel(s.composite);
      return (
        <>
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" onClick={() => setSelectedStore(null)} />
          <div className="fixed z-[91] bottom-0 left-0 right-0 sm:bottom-auto sm:top-[50%] sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-surface-card border border-surface-border shadow-2xl overflow-hidden animate-[slideUp_200ms_ease-out] sm:animate-[fadeIn_150ms_ease-out] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-surface-card z-10 border-b border-surface-divider">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: statusColor }}>
                  <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center text-[10px] font-bold" style={{ color: statusColor }}>{statusLabel}</div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{s.name}</h3>
                  <p className="text-[11px] text-text-muted">{s.state} &middot; {fmtDollar(s.revenue * 1000)} MTD &middot; {s.transactions} txns</p>
                </div>
              </div>
              <button onClick={() => setSelectedStore(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="px-5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Revenue', value: fmtDollar(s.revenue * 1000), color: 'var(--color-accent-green)' },
                { label: 'Margin', value: `${s.margin}%`, color: s.margin >= 38 ? 'var(--color-accent-green)' : 'var(--color-accent-gold)' },
                { label: 'Avg Basket', value: `$${s.avgBasket}`, color: 'var(--color-accent-blue)' },
                { label: 'vs Bench', value: `${s.vsBenchmark >= 0 ? '+' : ''}${s.vsBenchmark}%`, color: s.vsBenchmark >= 0 ? 'var(--color-accent-green)' : 'var(--color-accent-red)' },
              ].map(m => (
                <div key={m.label} className="rounded-lg border border-surface-border bg-surface-bg p-2 text-center">
                  <p className="text-[9px] text-text-muted uppercase">{m.label}</p>
                  <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
            {/* Contribution Margin */}
            {(() => {
              const storeLaborPct = getGoal(s.name, 'labor') ?? 20;
              const storeContribMargin = Math.round((s.margin - storeLaborPct) * 10) / 10;
              const contribColor = storeContribMargin >= 25 ? 'var(--color-accent-green)' : storeContribMargin >= 15 ? 'var(--color-accent-gold)' : 'var(--color-accent-red)';
              return (
                <div className="px-5 pt-3">
                  <div className="rounded-lg border border-surface-border bg-surface-bg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-text-muted">Gross Margin: <span className="font-semibold text-text-primary">{s.margin}%</span></p>
                        <p className="text-[11px] font-semibold" style={{ color: contribColor }}>
                          Est. Contribution: {storeContribMargin}% <span className="text-[9px] font-normal text-text-muted">(at {storeLaborPct}% labor)</span>
                        </p>
                      </div>
                      <div className="relative group">
                        <Info size={12} className="text-text-muted cursor-help" />
                        <div className="absolute z-10 bottom-full right-0 mb-1 w-56 p-2 rounded-lg bg-surface-card border border-surface-border shadow-lg text-[9px] text-text-muted leading-relaxed hidden group-hover:block">
                          Contribution Margin = Gross Margin % - Labor Cost %. Labor cost is operator-estimated (default 20%). Set your actual labor cost in Goal Planning.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Active Alerts for this store */}
            {(() => {
              const storeAlerts = [];
              if (s.alerts > 0 && s.vsBenchmark <= -5) storeAlerts.push({ severity: 'CRITICAL', color: 'var(--color-accent-red)', text: `Revenue ${s.vsBenchmark}% vs benchmark — declining trend` });
              if (s.margin < 44) storeAlerts.push({ severity: 'WARNING', color: 'var(--color-accent-gold)', text: `Margin at ${s.margin}% — below portfolio average` });
              if (s.stockScore < 80) storeAlerts.push({ severity: 'WARNING', color: 'var(--color-accent-gold)', text: `Inventory score ${s.stockScore} — potential stockout risk` });
              if (storeAlerts.length > 0) return (
                <div className="px-5 pt-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Active Alerts</p>
                  {storeAlerts.map((al, ai) => (
                    <div key={ai} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]" style={{ background: `color-mix(in srgb, ${al.color} 5%, transparent)`, border: `1px solid color-mix(in srgb, ${al.color} 12%, transparent)` }}>
                      <span className="text-[8px] font-bold px-1.5 py-px rounded-full" style={{ color: al.color, background: `color-mix(in srgb, ${al.color} 10%, transparent)` }}>{al.severity}</span>
                      <span className="text-text-secondary">{al.text}</span>
                    </div>
                  ))}
                </div>
              );
              return null;
            })()}
            {/* Contextual CTA */}
            <div className="p-5 space-y-3">
              {(() => {
                // Determine primary CTA based on store's top issue
                const hasHighOOS = s.stockScore < 80;
                const hasMarginProblem = s.margin < 44;
                const hasRevDecline = s.vsBenchmark <= -5;
                const isHealthy = !hasHighOOS && !hasMarginProblem && !hasRevDecline;

                let primaryCTA = { label: 'View Full Report', icon: BarChart3, route: '/locations', color: 'var(--color-accent-green)' };
                if (hasHighOOS) primaryCTA = { label: 'View Inventory', icon: Package, route: '/inventory', color: 'var(--color-accent-red)' };
                else if (hasMarginProblem) primaryCTA = { label: 'View Discount Activity', icon: DollarSign, route: '/agents/pricing', color: 'var(--color-accent-gold)' };
                else if (hasRevDecline) primaryCTA = { label: 'Deep Dive', icon: MessageSquare, route: '/agents/bridge', color: 'var(--color-accent-gold)' };

                return (
                  <>
                    <button
                      onClick={() => { setSelectedStore(null); navigate(primaryCTA.route, { state: { store: s.name } }); }}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{ background: primaryCTA.color }}
                    >
                      <primaryCTA.icon size={14} />
                      {primaryCTA.label}
                    </button>
                    <div className="flex items-center gap-2">
                      {!hasHighOOS && (
                        <button
                          onClick={() => { setSelectedStore(null); navigate('/inventory', { state: { store: s.name } }); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" /> View Inventory
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedStore(null); navigate('/agents/bridge', { state: { store: s.name, question: `Tell me about ${s.name}` } }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-gold/10 text-accent-gold border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Ask Dex
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      );
    })()}
    </>
  );
}


// ─── SALES REPORTING ─── //

const SALES_TABS = ['Patterns & Pacing', 'Categories', 'Brands', 'Stores'];

// Generate sales trend data dynamically based on date range and store selection
function generateSalesTrend(selectedRange, dateMultiplier, storeRatio) {
  const rng = _seedRng(42);
  const baseDaily = 1800; // base daily revenue for "all stores"

  if (selectedRange === 'last_week' || false) {
    // 7 data points: Mon-Sun
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Day-of-week multipliers (weekends higher)
    const dayMult = [0.90, 1.02, 0.87, 1.12, 1.30, 1.49, 1.07];
    return days.map((d, i) => {
      const r = _seedRng(42 + i * 17);
      const jitter = 0.92 + r() * 0.16;
      const prevJitter = 0.88 + r() * 0.18;
      return {
        name: d,
        revenue: Math.round(baseDaily * dayMult[i] * jitter * storeRatio),
        lastWeek: Math.round(baseDaily * dayMult[i] * prevJitter * storeRatio * 0.93),
      };
    });
  }

  if (selectedRange === 'last_month') {
    // ~4 weekly buckets
    const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
    const weekMult = [0.94, 1.02, 1.08, 0.96];
    return weeks.map((w, i) => {
      const r = _seedRng(100 + i * 23);
      const jitter = 0.95 + r() * 0.10;
      const prevJitter = 0.90 + r() * 0.14;
      return {
        name: w,
        revenue: Math.round(baseDaily * 7 * weekMult[i] * jitter * storeRatio),
        lastWeek: Math.round(baseDaily * 7 * weekMult[i] * prevJitter * storeRatio * 0.93),
      };
    });
  }

  if (selectedRange === 'last_quarter') {
    // ~12 weekly buckets
    const buckets = Array.from({ length: 12 }, (_, i) => `Wk ${i + 1}`);
    const seasonalCurve = [0.88, 0.92, 0.96, 1.00, 1.04, 1.08, 1.06, 1.02, 0.98, 1.10, 1.14, 1.08];
    return buckets.map((label, i) => {
      const r = _seedRng(200 + i * 31);
      const jitter = 0.94 + r() * 0.12;
      const prevJitter = 0.90 + r() * 0.14;
      return {
        name: label,
        revenue: Math.round(baseDaily * 7 * seasonalCurve[i] * jitter * storeRatio),
        lastWeek: Math.round(baseDaily * 7 * seasonalCurve[i] * prevJitter * storeRatio * 0.93),
      };
    });
  }

  if (selectedRange === 'last_year') {
    // 12 monthly buckets
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMult = [0.88, 0.85, 0.95, 1.00, 1.02, 1.06, 1.04, 0.98, 0.96, 1.08, 1.12, 1.20];
    return months.map((m, i) => {
      const r = _seedRng(300 + i * 37);
      const jitter = 0.94 + r() * 0.12;
      const prevJitter = 0.88 + r() * 0.16;
      return {
        name: m,
        revenue: Math.round(baseDaily * 30 * monthMult[i] * jitter * storeRatio),
        lastWeek: Math.round(baseDaily * 30 * monthMult[i] * prevJitter * storeRatio * 0.93),
      };
    });
  }

  // Fallback: 7-day
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayMult = [0.90, 1.02, 0.87, 1.12, 1.30, 1.49, 1.07];
  return days.map((d, i) => {
    const r = _seedRng(42 + i * 17);
    const jitter = 0.92 + r() * 0.16;
    const prevJitter = 0.88 + r() * 0.18;
    return {
      name: d,
      revenue: Math.round(baseDaily * dayMult[i] * jitter * storeRatio),
      lastWeek: Math.round(baseDaily * dayMult[i] * prevJitter * storeRatio * 0.93),
    };
  });
}

const CATEGORY_DATA = [
  { name: 'Flower', revenue: 4820, pct: 38.2, trend: 5.1, color: 'var(--color-accent-green)', margin: 48.2, velocity: 'High', oosCount: 12, action: 'Restock Now' },
  { name: 'Vapes', revenue: 2940, pct: 23.3, trend: 2.8, color: 'var(--color-accent-blue)', margin: 52.1, velocity: 'High', oosCount: 8, action: 'Restock Now' },
  { name: 'Edibles', revenue: 1860, pct: 14.7, trend: 8.4, color: 'var(--color-accent-purple)', margin: 55.8, velocity: 'Med', oosCount: 3, action: 'Maintain' },
  { name: 'Pre-Rolls', revenue: 1240, pct: 9.8, trend: -1.2, color: 'var(--color-accent-gold)', margin: 44.1, velocity: 'Med', oosCount: 5, action: 'Deprioritize' },
  { name: 'Concentrates', revenue: 980, pct: 7.8, trend: 3.5, color: 'var(--color-accent-red)', margin: 50.3, velocity: 'Low', oosCount: 2, action: 'Maintain' },
  { name: 'Other', revenue: 780, pct: 6.2, trend: 1.1, color: 'var(--color-text-muted)', margin: 42.0, velocity: 'Low', oosCount: 1, action: 'Deprioritize' },
];

const BRAND_DATA = [
  { name: 'Jeeter', revenue: 1840, share: 14.6, margin: 52.1, trend: 12.3, daysOfSupply: 18, bfdAvailable: true },
  { name: 'Stiiizy', revenue: 1620, share: 12.8, margin: 48.7, trend: 4.2, daysOfSupply: 22, bfdAvailable: true },
  { name: 'Cookies', revenue: 1380, share: 10.9, margin: 44.2, trend: -2.1, daysOfSupply: 34, bfdAvailable: false },
  { name: 'WYLD', revenue: 1120, share: 8.9, margin: 55.8, trend: 7.6, daysOfSupply: 12, bfdAvailable: true },
  { name: 'Rythm', revenue: 980, share: 7.8, margin: 50.3, trend: 1.4, daysOfSupply: 28, bfdAvailable: false },
];

const TRENDING_BRANDS = [
  { name: 'Alien Labs', category: 'Flower', trend: '+34%', note: 'Rising fast in IL & NJ markets' },
  { name: 'Raw Garden', category: 'Concentrates', trend: '+28%', note: 'Growing demand, limited distro' },
  { name: 'Kanha', category: 'Edibles', trend: '+22%', note: 'Strong repeat purchase rate' },
  { name: 'Ozone', category: 'Flower', trend: '+19%', note: 'Value segment gaining share' },
];

const STORE_SALES = [
  { name: 'Morenci, MI', revenue: 480, transactions: 188, avgBasket: 62, vsBench: -12.4, discountRate: 18.2, upt: 1.8 },
  { name: 'Columbus, OH', revenue: 960, transactions: 298, avgBasket: 88, vsBench: -3.2, discountRate: 14.6, upt: 2.1 },
  { name: 'Boston, MA', revenue: 1080, transactions: 324, avgBasket: 94, vsBench: 2.1, discountRate: 11.8, upt: 2.3 },
  { name: 'Hoboken, NJ', revenue: 1340, transactions: 386, avgBasket: 105, vsBench: 5.4, discountRate: 12.1, upt: 2.4 },
  { name: 'Logan Square, IL', revenue: 1420, transactions: 412, avgBasket: 112, vsBench: 8.2, discountRate: 10.4, upt: 2.6 },
  { name: 'Springfield, IL', revenue: 1180, transactions: 348, avgBasket: 98, vsBench: 18.1, discountRate: 9.8, upt: 2.2 },
];

// ---------------------------------------------------------------------------
// GoalPlanningModal — extracted from SalesReporting IIFE for stable rendering
// ---------------------------------------------------------------------------
function GoalPlanningModal({ open, onClose, stores }) {
  const [goalType, setGoalType] = useState('revenue');
  const [collapsedStates, setCollapsedStates] = useState({});
  const [csvMessage, setCsvMessage] = useState(null);
  const csvInputRef = useRef(null);
  const { setGoal, getGoal, getPortfolioGoal, bulkSetGoals, clearGoals } = useGoals();

  const activeGoalType = GOAL_TYPES.find(g => g.key === goalType) || GOAL_TYPES[0];
  const NEW_STORE_NAMES = new Set(['Ascend Morenci', 'Ascend Whitehall (Outlet)']);

  const getLastMonth = (store) => {
    switch (goalType) {
      case 'revenue': return Math.round(store.revenue * 1000);
      case 'transactions': return store.transactions;
      case 'aov': return Math.round(store.avgBasket);
      case 'margin': return store.margin;
      case 'labor': return 20; // default labor cost % — operator-estimated
      default: return Math.round(store.revenue * 1000);
    }
  };

  const getThreeMonthAvg = (store) => {
    const lm = getLastMonth(store);
    if (goalType === 'labor') return Math.round(lm * 1.02 * 10) / 10; // labor cost % trending up slightly
    return goalType === 'margin' ? Math.round(lm * 0.97 * 10) / 10 : Math.round(lm * 0.97);
  };

  // Group stores by state
  const stateGroups = {};
  const STATE_DISPLAY = { IL: 'Illinois', NJ: 'New Jersey', MA: 'Massachusetts', OH: 'Ohio', MD: 'Maryland', MI: 'Michigan', PA: 'Pennsylvania' };
  for (const store of stores) {
    const st = store.state || 'Other';
    if (!stateGroups[st]) stateGroups[st] = [];
    stateGroups[st].push(store);
  }
  const sortedStates = Object.keys(stateGroups).sort((a, b) => stateGroups[b].length - stateGroups[a].length);

  const portfolioGoalTotal = getPortfolioGoal(stores, goalType);

  const stateSubtotal = (stateStores) => {
    let total = 0;
    let hasAny = false;
    for (const s of stateStores) {
      const val = getGoal(s.name, goalType);
      if (val !== null) { total += val; hasAny = true; }
    }
    return hasAny ? total : null;
  };

  const fmtGoalVal = (v) => {
    if (v === null || v === undefined) return '--';
    return activeGoalType.format(v);
  };

  const handleApplyGrowth = () => {
    bulkSetGoals(stores, (store) => {
      const lm = getLastMonth(store);
      return goalType === 'margin' ? Math.round(lm * 1.05 * 10) / 10 : Math.round(lm * 1.05);
    }, goalType);
  };
  const handleCopyLastMonth = () => {
    bulkSetGoals(stores, (store) => getLastMonth(store), goalType);
  };
  const handleClearAll = () => {
    clearGoals(stores, goalType);
  };

  const toggleState = (st) => {
    setCollapsedStates(prev => ({ ...prev, [st]: !prev[st] }));
  };

  // --- CSV Import ---
  const handleCsvImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { setCsvMessage('CSV has no data rows'); return; }
      // Skip header
      const storeNameMap = {};
      for (const store of stores) {
        storeNameMap[store.name.toLowerCase()] = store.name;
      }
      let matched = 0;
      for (let i = 1; i < lines.length; i++) {
        // Handle quoted CSV fields and simple comma-split
        const parts = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        if (!parts || parts.length < 2) continue;
        const rawName = parts[0].replace(/^"|"$/g, '').trim();
        const rawGoal = parts[1].replace(/^"|"$/g, '').replace(/[$,%\s]/g, '').trim();
        const goalVal = parseFloat(rawGoal);
        if (isNaN(goalVal)) continue;
        const matchedName = storeNameMap[rawName.toLowerCase()];
        if (matchedName) {
          setGoal(matchedName, goalVal, goalType);
          matched++;
        }
      }
      setCsvMessage(`${matched} goal${matched !== 1 ? 's' : ''} imported`);
      setTimeout(() => setCsvMessage(null), 3000);
    };
    reader.readAsText(file);
    // Reset so re-uploading same file works
    e.target.value = '';
  };

  // --- Download Template ---
  const handleDownloadTemplate = () => {
    const goalLabel = activeGoalType.label + ' Goal';
    const rows = [['Store Name', goalLabel]];
    for (const store of stores) {
      const suggested = goalType === 'margin'
        ? Math.round(getLastMonth(store) * 1.05 * 10) / 10
        : Math.round(getLastMonth(store) * 1.05);
      rows.push([store.name, suggested]);
    }
    const csv = rows.map(r => r.map(c => typeof c === 'string' && c.includes(',') ? `"${c}"` : c).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal-template-${goalType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const goalTypeIcons = { revenue: DollarSign, transactions: ShoppingCart, aov: BarChart3, margin: Percent, labor: Users };

  if (!open) return null;
  return createPortal(

    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col"
        style={{ maxHeight: 'min(90vh, 800px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-divider">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/10">
              <Target size={18} className="text-accent-blue" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Goal Planning</h3>
              <p className="text-[10px] text-text-muted">Monthly targets &middot; {stores.length} stores &middot; {sortedStates.length} states</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-surface-bg">
            <X size={16} />
          </button>
        </div>

        {/* Goal Type Tabs */}
        <div className="px-6 pt-3 pb-0 border-b border-surface-divider">
          <div className="flex gap-0.5">
            {GOAL_TYPES.map(gt => {
              const GtIcon = goalTypeIcons[gt.key];
              const isActive = goalType === gt.key;
              return (
                <button
                  key={gt.key}
                  onClick={() => setGoalType(gt.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 ${
                    isActive
                      ? 'border-accent-blue text-accent-blue bg-accent-blue/5'
                      : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-surface-bg'
                  }`}
                >
                  <GtIcon size={13} />
                  {gt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <div className="px-6 py-2.5 bg-surface-bg/50 border-b border-surface-divider flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mr-1">Bulk:</span>
          <button
            onClick={handleApplyGrowth}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors border border-accent-green/20"
          >
            <TrendingUp size={10} />
            Apply +5% Growth
          </button>
          <button
            onClick={handleCopyLastMonth}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors border border-accent-blue/20"
          >
            <Copy size={10} />
            Copy Last Month
          </button>
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors border border-accent-red/20"
          >
            <X size={10} />
            Clear All
          </button>
          <div className="flex-1" />
          {csvMessage && (
            <span className="text-[10px] font-semibold text-accent-green animate-fade-in">{csvMessage}</span>
          )}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-surface-card text-text-muted hover:text-text-secondary transition-colors border border-surface-border"
            title="Download CSV template with current store names"
          >
            <Download size={10} />
            Download Template
          </button>
          <button
            onClick={() => csvInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-surface-card text-text-muted hover:text-text-secondary transition-colors border border-surface-border"
            title="Import goals from a CSV file"
          >
            <Upload size={10} />
            Import CSV
          </button>
        </div>

        {/* Column Headers */}
        <div className="px-6 py-2 border-b border-surface-divider bg-surface-bg/30">
          <div className="flex items-center text-[9px] text-text-muted uppercase tracking-wider font-semibold">
            <div className="flex-1 min-w-0">Store</div>
            <div className="w-20 text-right">Last Mo.</div>
            <div className="w-20 text-right">3-Mo Avg</div>
            <div className="w-28 text-right">{activeGoalType.label} Goal</div>
          </div>
        </div>

        {/* Store List -- grouped by state */}
        <div className="flex-1 overflow-y-auto">
          {sortedStates.map(st => {
            const stStores = stateGroups[st];
            const isCollapsed = !!collapsedStates[st];
            const sub = stateSubtotal(stStores);
            const stateLastMonth = stStores.reduce((sum, s) => sum + getLastMonth(s), 0);

            return (
              <div key={st}>
                {/* State Header */}
                <button
                  onClick={() => toggleState(st)}
                  className="w-full flex items-center gap-2 px-6 py-2 bg-surface-bg/60 hover:bg-surface-bg transition-colors border-b border-surface-divider text-left"
                >
                  <span className="text-text-muted transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                    <ChevronDown size={12} />
                  </span>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{STATE_DISPLAY[st] || st}</span>
                  <span className="text-[10px] text-text-muted">({stStores.length} stores)</span>
                  <div className="flex-1" />
                  {goalType === 'revenue' && (
                    <span className="text-[10px] text-text-muted">
                      Actual: {fmtDollar(stateLastMonth)}
                    </span>
                  )}
                  {sub !== null && (
                    <span className="text-[10px] font-semibold text-accent-blue ml-3">
                      Target: {fmtGoalVal(sub)}
                    </span>
                  )}
                </button>

                {/* Store Rows */}
                {!isCollapsed && stStores.map(store => {
                  const lastMonth = getLastMonth(store);
                  const threeMonthAvg = getThreeMonthAvg(store);
                  const currentGoal = getGoal(store.name, goalType);
                  const isNewStore = NEW_STORE_NAMES.has(store.name);
                  const inputVal = currentGoal !== null ? currentGoal : '';

                  return (
                    <div key={store.name} className="flex items-center gap-2 px-6 py-2 border-b border-surface-divider last:border-0 hover:bg-surface-bg/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-medium text-text-primary truncate">{store.name}</p>
                          {isNewStore && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-accent-gold/15 text-accent-gold border border-accent-gold/20 flex-shrink-0">
                              <Rocket size={8} />
                              RAMP
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-text-muted">{store.city}, {store.state}</p>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-[11px] text-text-secondary font-medium">{goalType === 'margin' || goalType === 'labor' ? `${lastMonth}%` : goalType === 'aov' ? `$${lastMonth}` : goalType === 'revenue' ? fmtDollar(lastMonth) : lastMonth.toLocaleString()}</span>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-[11px] text-text-muted">{goalType === 'margin' || goalType === 'labor' ? `${threeMonthAvg}%` : goalType === 'aov' ? `$${threeMonthAvg}` : goalType === 'revenue' ? fmtDollar(threeMonthAvg) : threeMonthAvg.toLocaleString()}</span>
                        {goalType !== 'margin' && goalType !== 'labor' && (
                          <TrendingDown size={8} className="inline ml-0.5 text-accent-red" />
                        )}
                      </div>
                      <div className="w-28 flex items-center justify-end gap-1">
                        <span className="text-[9px] text-text-muted">{activeGoalType.unit === '%' ? '' : activeGoalType.unit}</span>
                        <input
                          type="number"
                          step={goalType === 'margin' || goalType === 'labor' ? '0.1' : '1'}
                          placeholder={goalType === 'margin' || goalType === 'labor' ? lastMonth.toFixed(1) : lastMonth.toLocaleString()}
                          value={inputVal}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '') {
                              setGoal(store.name, undefined, goalType);
                            } else {
                              setGoal(store.name, Number(val), goalType);
                            }
                          }}
                          className="w-24 px-2 py-1 rounded-md bg-surface-bg border border-surface-border text-[11px] text-text-primary text-right focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
                        />
                        {(goalType === 'margin' || goalType === 'labor') && <span className="text-[9px] text-text-muted">%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer -- Portfolio Total + Done */}
        <div className="px-6 py-4 border-t border-surface-divider bg-surface-bg/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-text-secondary">Portfolio Total</span>
              <span className="text-[10px] text-text-muted ml-2">({stores.length} stores)</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-text-primary">
                {portfolioGoalTotal !== null ? fmtGoalVal(portfolioGoalTotal) : '--'}
              </span>
              {goalType === 'revenue' && portfolioGoalTotal !== null && (
                <span className="text-[10px] text-text-muted font-normal ml-1">/mo</span>
              )}
            </div>
          </div>
          {goalType === 'revenue' && portfolioGoalTotal !== null && (() => {
            const actualTotal = stores.reduce((sum, s) => sum + Math.round(s.revenue * 1000), 0);
            const growthPct = ((portfolioGoalTotal - actualTotal) / actualTotal * 100).toFixed(1);
            const isGrowth = portfolioGoalTotal >= actualTotal;
            return (
              <div className="flex items-center gap-2 mb-3 text-[10px]">
                <span className="text-text-muted">vs. last month actual ({fmtDollar(actualTotal)}):</span>
                <span className={`font-semibold ${isGrowth ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isGrowth ? '+' : ''}{growthPct}%
                </span>
              </div>
            );
          })()}
          {goalType === 'labor' && (
            <div className="mb-3 rounded-lg px-3 py-2 text-[10px] text-text-muted leading-relaxed" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-blue) 10%, transparent)' }}>
              <span className="font-semibold text-text-secondary">Contribution Margin = Gross Margin % - Labor Cost %.</span>{' '}
              Labor cost is operator-estimated (default 20%). Cannabis dispensary industry range: 15-25% of revenue. Set your actual labor cost per store here to improve accuracy. Dutchie does not track payroll data — integrate with your HR/payroll system for exact figures.
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-accent-blue text-white text-xs font-semibold hover:bg-accent-blue/90 transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  , document.body);
}

function SalesReporting() {
  const [activeTab, setActiveTab] = useState('Patterns & Pacing');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const { dateMultiplier, rangeLabel, selectedRange } = useDateRange();
  const { selectedStoreNames, isAllSelected, selectionLabel } = useStores();
  const { isCompliance } = usePersona();
  const { getPortfolioGoal } = useGoals();
  if (isCompliance) return null;

  const storeRatio = useMemo(() => {
    if (isAllSelected) return 1;
    const totalRev = STORE_METRICS.reduce((sum, s) => sum + s.revenue, 0);
    const selRev = STORE_METRICS.filter(s => selectedStoreNames.has(s.name)).reduce((sum, s) => sum + s.revenue, 0);
    return totalRev > 0 ? selRev / totalRev : 0;
  }, [selectedStoreNames, isAllSelected]);

  const salesTrendData = useMemo(
    () => generateSalesTrend(selectedRange, dateMultiplier, storeRatio),
    [selectedRange, dateMultiplier, storeRatio]
  );

  const grossRevenue = Math.round(NEXUS_DATA.grossRevenue * storeRatio * dateMultiplier);
  const netRevenue = Math.round((NEXUS_DATA.grossRevenue - NEXUS_DATA.discountTotal) * storeRatio * dateMultiplier);
  const selectedStoresList = STORE_METRICS.filter(s => isAllSelected || selectedStoreNames.has(s.name));
  const userGoal = getPortfolioGoal(selectedStoresList);
  const goalRevenue = userGoal ? Math.round(userGoal * dateMultiplier) : Math.round(grossRevenue * 0.95);
  const hasUserGoal = userGoal !== null;
  const goalPctRaw = goalRevenue > 0 ? Math.round((netRevenue / goalRevenue) * 100) : 0;
  const goalBarWidth = Math.min(110, goalPctRaw); // visual cap at 110%
  const isOverGoal = goalPctRaw >= 100;

  // Legend labels depend on range
  const currentLabel = selectedRange === 'last_year' ? 'This Year' : selectedRange === 'last_quarter' ? 'This Quarter' : selectedRange === 'last_month' ? 'This Period' : 'This Week';
  const priorLabel = selectedRange === 'last_year' ? 'Last Year' : selectedRange === 'last_quarter' ? 'Last Quarter' : selectedRange === 'last_month' ? 'Last Period' : 'Last Week';

  return (
    <NexusTile className="animate-fade-up" style={{ animationDelay: '350ms' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-divider">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-green/10 text-accent-green">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Sales Reporting</h3>
            <p className="text-xs text-text-muted">{rangeLabel} &middot; {selectionLabel}</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-bg p-0.5 overflow-x-auto">
          {SALES_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap ${activeTab === tab ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Patterns & Pacing — Sales Trend + Revenue vs Goal + Category Mix */}
        {activeTab === 'Patterns & Pacing' && (
          <div className="space-y-5">
            {/* Sales Trend Line Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Sales Trend</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded-full bg-accent-green" />
                    <span className="text-[9px] text-text-muted">{currentLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded-full" style={{ background: 'var(--color-text-muted)', opacity: 0.4 }} />
                    <span className="text-[9px] text-text-muted">{priorLabel}</span>
                  </div>
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent-green)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--color-accent-green)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-divider)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => fmtDollar(v)} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', borderRadius: '8px', fontSize: '11px' }}
                      labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
                      formatter={(v, name) => [fmtDollar(v), name === 'revenue' ? currentLabel : priorLabel]}
                    />
                    <Area type="monotone" dataKey="lastWeek" stroke="var(--color-text-muted)" strokeWidth={1.5} strokeOpacity={0.3} fill="none" dot={false} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-accent-green)" strokeWidth={2} fill="url(#salesGreen)" dot={{ r: 3, fill: 'var(--color-accent-green)', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* % to Goal progress bar — track represents 0–110% of goal */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary font-medium flex items-center gap-1.5">
                  % to Goal
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
                  >
                    <Target size={10} />
                    Set Goals
                  </button>
                  {hasUserGoal && <span className="text-[9px] text-accent-green font-medium">Custom</span>}
                </span>
                <span className={`font-semibold ${isOverGoal ? 'text-accent-green' : 'text-accent-gold'}`}>
                  {goalPctRaw}% to goal
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-surface-bg overflow-hidden">
                {isOverGoal ? (
                  <>
                    {/* Base fill: 0% → 100% of goal */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-l-full transition-all duration-700"
                      style={{ width: `${(100 / 110) * 100}%`, background: 'var(--color-accent-green)' }}
                    />
                    {/* Overflow: 100% → goalBarWidth% of goal (brighter) */}
                    <div
                      className="absolute inset-y-0 rounded-r-full transition-all duration-700"
                      style={{
                        left: `${(100 / 110) * 100}%`,
                        width: `${((goalBarWidth - 100) / 110) * 100}%`,
                        background: 'var(--color-accent-green)',
                        filter: 'brightness(1.35)',
                      }}
                    />
                  </>
                ) : (
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(goalPctRaw / 110) * 100}%`, background: 'var(--color-accent-gold)' }}
                  />
                )}
              </div>
            </div>

            {/* Category Mix — annotated bars with revenue share + trend arrows */}
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">Revenue by Category</p>
              <div className="flex h-5 rounded-full overflow-hidden mb-3">
                {CATEGORY_DATA.map(cat => (
                  <div key={cat.name} className="h-full transition-all duration-500 relative group" style={{ width: `${cat.pct}%`, background: cat.color, opacity: 0.8 }} title={`${cat.name}: ${cat.pct}%`}>
                    {cat.pct >= 10 && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">{cat.pct}%</span>}
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {CATEGORY_DATA.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-[11px] text-text-primary w-24">{cat.name}</span>
                    <span className="text-[11px] font-semibold text-text-secondary w-14 text-right">{cat.pct}%</span>
                    <span className="text-[11px] text-text-muted w-14 text-right">${(cat.revenue * dateMultiplier / 1000).toFixed(1)}K</span>
                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${cat.trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {cat.trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {cat.trend >= 0 ? '+' : ''}{cat.trend}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab — with merchandising decision columns */}
        {activeTab === 'Categories' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-divider">
                  <th className="text-left py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Category</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Revenue</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Margin</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Velocity</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">OOS</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Trend</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-divider">
                {CATEGORY_DATA.map(cat => {
                  const actionColor = cat.action === 'Restock Now' ? 'text-accent-red bg-accent-red/10' : cat.action === 'Deprioritize' ? 'text-accent-gold bg-accent-gold/10' : 'text-accent-green bg-accent-green/10';
                  return (
                    <tr key={cat.name}>
                      <td className="py-2.5 font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                          {cat.name}
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-text-secondary">${(cat.revenue * dateMultiplier / 1000).toFixed(1)}K</td>
                      <td className="py-2.5 text-right text-text-secondary">{cat.margin}%</td>
                      <td className="py-2.5 text-right text-text-secondary hidden md:table-cell">{cat.velocity}</td>
                      <td className="py-2.5 text-right hidden md:table-cell"><span className={cat.oosCount > 5 ? 'text-accent-red font-semibold' : 'text-text-secondary'}>{cat.oosCount}</span></td>
                      <td className={`py-2.5 text-right font-semibold ${cat.trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{cat.trend >= 0 ? '+' : ''}{cat.trend}%</td>
                      <td className="py-2.5 text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${actionColor}`}>{cat.action}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Brands Tab — with Days of Supply + BFD Available */}
        {activeTab === 'Brands' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-divider">
                    <th className="text-left py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Brand</th>
                    <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Revenue</th>
                    <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Share</th>
                    <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Margin</th>
                    <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Days Supply</th>
                    <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">BFD</th>
                    <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-divider">
                  {BRAND_DATA.map(b => (
                    <tr key={b.name}>
                      <td className="py-2.5 font-medium text-text-primary">{b.name}</td>
                      <td className="py-2.5 text-right text-text-secondary">${(b.revenue * dateMultiplier / 1000).toFixed(1)}K</td>
                      <td className="py-2.5 text-right text-text-secondary">{b.share}%</td>
                      <td className="py-2.5 text-right text-text-secondary">{b.margin}%</td>
                      <td className="py-2.5 text-right hidden md:table-cell"><span className={b.daysOfSupply <= 14 ? 'text-accent-red font-semibold' : 'text-text-secondary'}>{b.daysOfSupply}d</span></td>
                      <td className="py-2.5 text-right hidden md:table-cell">
                        {b.bfdAvailable
                          ? <span className="text-[9px] font-bold px-1.5 py-px rounded-full bg-accent-green/10 text-accent-green">Available</span>
                          : <span className="text-[9px] px-1.5 py-px rounded-full bg-surface-bg text-text-muted">No</span>
                        }
                      </td>
                      <td className={`py-2.5 text-right font-semibold ${b.trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{b.trend >= 0 ? '+' : ''}{b.trend}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Trending in Your Market */}
            <div className="mt-5 pt-4 border-t border-surface-divider">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-3">Trending in Your Market</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {TRENDING_BRANDS.map(tb => (
                  <div key={tb.name} className="rounded-lg border border-surface-border bg-surface-bg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-text-primary">{tb.name}</span>
                      <span className="text-[10px] font-bold text-accent-green">{tb.trend}</span>
                    </div>
                    <p className="text-[9px] text-text-muted">{tb.category}</p>
                    <p className="text-[9px] text-text-muted mt-0.5">{tb.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stores Tab — sorted ascending (underperformers first), with Discount Rate */}
        {activeTab === 'Stores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-divider">
                  <th className="text-left py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Store</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Revenue</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Txns</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">AOV</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">UPT</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Disc. Rate</th>
                  <th className="text-right py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Vs Portfolio Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-divider">
                {STORE_SALES.map(s => (
                  <tr key={s.name}>
                    <td className="py-2.5 font-medium text-text-primary">{s.name}</td>
                    <td className="py-2.5 text-right text-text-secondary">${(s.revenue * dateMultiplier / 1000).toFixed(1)}K</td>
                    <td className="py-2.5 text-right text-text-secondary hidden md:table-cell">{Math.round(s.transactions * dateMultiplier).toLocaleString()}</td>
                    <td className="py-2.5 text-right text-text-secondary hidden md:table-cell">${s.avgBasket}</td>
                    <td className="py-2.5 text-right text-text-secondary hidden md:table-cell">{s.upt}</td>
                    <td className="py-2.5 text-right"><span className={s.discountRate > 15 ? 'text-accent-red font-semibold' : 'text-text-secondary'}>{s.discountRate}%</span></td>
                    <td className={`py-2.5 text-right font-semibold ${s.vsBench >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{s.vsBench >= 0 ? '+' : ''}{s.vsBench}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GoalPlanningModal open={showGoalModal} onClose={() => setShowGoalModal(false)} stores={selectedStoresList} />
    </NexusTile>
  );
}


// ─── CUSTOMER HEALTH OVERVIEW ─── //

function CustomerHealthOverview({ onNavigate }) {
  const { isCompliance } = usePersona();
  if (isCompliance) return null;

  const HEALTH_BANDS = [
    { label: 'Active & Engaged', subtitle: 'Purchased within last 14 days', pct: 54, count: '8,420', color: 'var(--color-accent-green)' },
    { label: 'Slowing Down', subtitle: 'Visit frequency dropped >30% in last 30 days', pct: 25, count: '3,890', color: 'var(--color-accent-gold)' },
    { label: 'At Risk of Leaving', subtitle: 'No purchase in 45+ days, previously monthly buyer', pct: 21, count: '3,260', color: 'var(--color-accent-red)' },
  ];

  return (
    <NexusTile className="animate-fade-up" style={{ animationDelay: '500ms' }}>
      <TileHeader
        icon={Users}
        title="Customer Health"
        subtitle="30-day snapshot"
        iconBg="bg-accent-purple/10 text-accent-purple"
        action={onNavigate}
        actionLabel="Full Analytics"
      />
      <div className="px-6 py-4">
        <div className="space-y-3">
          {HEALTH_BANDS.map(band => (
            <div key={band.label}>
              <div className="flex items-center gap-3">
                <div className="w-36 flex-shrink-0">
                  <span className="text-xs text-text-secondary">{band.label}</span>
                  {band.subtitle && <p className="text-[9px] text-text-muted leading-tight mt-0.5">{band.subtitle}</p>}
                </div>
                <div className="flex-1 h-5 rounded-full bg-surface-bg overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${band.pct}%`, background: band.color, opacity: 0.75 }}
                  />
                </div>
                <span className="text-xs font-semibold text-text-primary w-10 text-right">{band.pct}%</span>
                <span className="text-[10px] text-text-muted w-12 text-right">{band.count}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--color-accent-red) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-red) 10%, transparent)' }}>
          <p className="text-[11px] text-text-secondary">
            <span className="font-semibold text-accent-red">3,260</span> customers at risk of churning — <span className="font-semibold text-accent-red">$6.3M</span> lifetime value at stake
          </p>
        </div>
      </div>
    </NexusTile>
  );
}


// ─── CONNECT INBOX ─── //

const CONNECT_INBOX = {
  pendingPOs: [
    { id: 'PO-KGP5GPE', brand: 'Jeeter', store: 'Ascend Logan Square', state: 'IL', items: 8, total: 3420, expectedArrival: 'Apr 5-7', status: 'needs_attention', changedBy: 'brand', changeNote: 'Jeeter confirmed 6 of 8 items, zeroed out 2 (out of stock at distributor)', daysAgo: 0 },
    { id: 'PO-MN82KRP', brand: 'Wyld', store: 'Ascend Grand Rapids 28th St', state: 'MI', items: 4, total: 1890, expectedArrival: 'Apr 8-10', status: 'submitted', changedBy: 'retailer', changeNote: 'Awaiting brand confirmation', daysAgo: 1 },
    { id: 'PO-QR47PLT', brand: 'Kiva Confections', store: 'Ascend Morenci', state: 'MI', items: 3, total: 960, expectedArrival: 'Apr 3', status: 'needs_attention', changedBy: 'brand', changeNote: 'Kiva substituted Terra Bites for Lost Farm Gummies (out of stock)', daysAgo: 0 },
  ],
  bfdProposals: [
    { id: 'BFD-001', brand: 'Jeeter', type: 'percent_off', value: 20, products: 'All Jeeter Live Resin carts', locations: 5, fundingLimit: 5000, startDate: 'Apr 1', endDate: 'Apr 30', status: 'pending', daysAgo: 0 },
    { id: 'BFD-002', brand: 'Wyld', type: 'dollar_off', value: 3, products: 'Wyld CBD Gummies 500mg', locations: 12, fundingLimit: 8000, startDate: 'Apr 7', endDate: 'May 7', status: 'pending', daysAgo: 1 },
    { id: 'BFD-003', brand: 'CANN', type: 'bogo', value: null, products: 'CANN Social Tonics 6-pack', locations: 8, fundingLimit: 3000, startDate: 'Apr 15', endDate: 'Apr 30', status: 'pending', daysAgo: 2 },
  ],
};

const BFD_INSIGHTS = {
  'BFD-001': 'This BFD would improve Jeeter Live Resin margin by 8pp. Est. savings: $840/mo.',
  'BFD-002': 'Wyld CBD Gummies sell 18 units/wk. $3 off discount = 6% margin lift across 12 locations.',
  'BFD-003': 'CANN Tonics BOGO drove 2.4x velocity lift in last promo. Estimated funding burn: $1,800.',
};

const PO_INSIGHTS = {
  'PO-KGP5GPE': 'Jeeter fill rate: 92%. Recommend: Accept confirmed items, find alt vendor for zeroed SKUs.',
  'PO-MN82KRP': 'Wyld typically confirms within 24h. Fill rate: 97%. No action needed yet.',
  'PO-QR47PLT': 'Kiva substitution: Terra Bites outsell Lost Farm 1.8x at Morenci. Recommend: Accept sub.',
};

const DECLINE_REASONS = [
  'Pricing not competitive',
  'Discount too low to drive traffic',
  'Already running a competing promo',
  'Wrong product assortment',
  'Budget constraints',
  'Other',
];

function fmtBfdType(type, value) {
  if (type === 'percent_off') return `${value}% off`;
  if (type === 'dollar_off') return `$${value} off`;
  if (type === 'bogo') return 'BOGO';
  return type;
}

function ConnectInboxTile() {
  const navigate = useNavigate();
  const [bfdActions, setBfdActions] = useState({});
  const [declineOpen, setDeclineOpen] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const pendingCount = CONNECT_INBOX.pendingPOs.length + CONNECT_INBOX.bfdProposals.filter(b => !bfdActions[b.id]).length;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleAcceptBfd = (bfd) => {
    setBfdActions(prev => ({ ...prev, [bfd.id]: 'accepted' }));
    showToast(`${bfd.brand} ${fmtBfdType(bfd.type, bfd.value)} offer accepted. Auto-applies at POS starting ${bfd.startDate}.`);
  };

  const handleDeclineBfd = (bfdId, reason) => {
    setBfdActions(prev => ({ ...prev, [bfdId]: 'declined' }));
    setDeclineOpen(null);
    showToast('Offer declined.');
  };

  return (
    <NexusTile className="animate-fade-up" style={{ animationDelay: '350ms' }}>
      {/* header */}
      <div className="px-4 py-2.5 flex justify-between items-center border-b border-surface-divider">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Inbox className="w-4 h-4 text-accent-blue" />
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white bg-accent-red">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-text-primary ml-1">Connect Inbox</span>
          <span className="text-[10px] text-text-muted">{pendingCount} pending</span>
        </div>
        <button
          onClick={() => navigate('/agents/connect', { state: { action: 'review-po' } })}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-accent-blue bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/15 transition-colors"
        >
          View All <ChevronRight size={11} />
        </button>
      </div>

      {/* Purchase Orders section */}
      <div className="px-4 py-2.5 border-b border-surface-divider">
        <div className="flex items-center gap-1.5 mb-2">
          <Package className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Purchase Orders</span>
        </div>
        <div className="space-y-2">
          {CONNECT_INBOX.pendingPOs.map(po => (
            <div key={po.id} className="rounded-lg border border-surface-border bg-surface-bg p-3 hover:border-surface-border/80 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary font-mono">{po.id}</span>
                  <span className="text-[10px] font-semibold text-text-secondary">{po.brand}</span>
                  {po.status === 'needs_attention' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/20">Needs Attention</span>
                  )}
                  {po.status === 'submitted' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/20">Submitted</span>
                  )}
                </div>
                <span className="text-[10px] text-text-muted">{po.daysAgo === 0 ? 'Today' : `${po.daysAgo}d ago`}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-text-secondary mb-1.5">
                <span>{po.store}, {po.state}</span>
                <span>{po.items} items</span>
                <span className="font-semibold text-text-primary">${po.total.toLocaleString()}</span>
                <span>ETA {po.expectedArrival}</span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed mb-1.5">{po.changeNote}</p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] italic text-accent-green/80 leading-relaxed max-w-[75%]">{PO_INSIGHTS[po.id]}</p>
                <button
                  onClick={() => navigate('/agents/connect', { state: { action: 'review-po', po } })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-white bg-accent-blue hover:brightness-110 transition-all"
                >
                  Review <ChevronRight size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Offers section */}
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Tag className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Brand Offers</span>
        </div>
        <div className="space-y-2">
          {CONNECT_INBOX.bfdProposals.map(bfd => {
            const action = bfdActions[bfd.id];
            if (action === 'accepted') {
              return (
                <div key={bfd.id} className="rounded-lg border border-accent-green/20 bg-accent-green/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
                    <span className="text-[11px] text-accent-green font-semibold">{bfd.brand} {fmtBfdType(bfd.type, bfd.value)} — Active at POS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">Drive traffic to these products?</span>
                    <button
                      onClick={() => navigate('/agents/marketing', { state: { action: 'bfd-campaign', brand: bfd.brand, discount: fmtBfdType(bfd.type, bfd.value), products: bfd.products, locations: bfd.locations, endDate: bfd.endDate, fundingLimit: bfd.fundingLimit } })}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors"
                      style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 10%, transparent)', color: 'var(--color-accent-blue)', border: '1px solid color-mix(in srgb, var(--color-accent-blue) 20%, transparent)' }}
                    >
                      <Megaphone size={10} /> Create Campaign
                    </button>
                  </div>
                </div>
              );
            }
            if (action === 'declined') {
              return (
                <div key={bfd.id} className="rounded-lg border border-surface-border bg-surface-bg/50 p-3 flex items-center gap-2 opacity-50">
                  <XCircle className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="text-[11px] text-text-muted font-semibold">{bfd.brand} {fmtBfdType(bfd.type, bfd.value)} — Declined</span>
                </div>
              );
            }
            return (
              <div key={bfd.id} className="rounded-lg border border-surface-border bg-surface-bg p-3 hover:border-surface-border/80 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">{bfd.brand}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple border border-accent-purple/20">
                      {fmtBfdType(bfd.type, bfd.value)}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted">{bfd.daysAgo === 0 ? 'Today' : `${bfd.daysAgo}d ago`}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-secondary mb-1.5">
                  <span>{bfd.products}</span>
                  <span>{bfd.locations} locations</span>
                  <span>Fund: ${bfd.fundingLimit.toLocaleString()}</span>
                  <span>{bfd.startDate} – {bfd.endDate}</span>
                </div>
                <p className="text-[10px] italic text-accent-green/80 leading-relaxed mb-2">{BFD_INSIGHTS[bfd.id]}</p>
                <div className="flex items-center gap-2 justify-end relative">
                  <button
                    onClick={() => setDeclineOpen(declineOpen === bfd.id ? null : bfd.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-text-secondary bg-surface-card border border-surface-border hover:bg-surface-hover transition-colors"
                  >
                    <X size={10} /> Decline
                  </button>
                  <button
                    onClick={() => handleAcceptBfd(bfd)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-white bg-accent-green hover:brightness-110 transition-all"
                  >
                    <Check size={10} /> Accept
                  </button>
                  {declineOpen === bfd.id && (
                    <div className="absolute top-full right-0 mt-1 z-30 w-56 rounded-lg border border-surface-border bg-surface-card shadow-lg py-1 animate-fade-in">
                      <p className="px-3 py-1.5 text-[10px] font-semibold text-text-secondary">Select reason:</p>
                      {DECLINE_REASONS.map(r => (
                        <button
                          key={r}
                          onClick={() => handleDeclineBfd(bfd.id, r)}
                          className="w-full text-left px-3 py-1.5 text-[11px] text-text-primary hover:bg-surface-hover transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Promotions — observability for running BFDs */}
      <div className="px-4 py-3 border-t border-surface-divider">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Promotions</h4>
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 10%, transparent)', color: 'var(--color-accent-green)' }}>3 running</span>
        </div>
        <div className="space-y-2">
          {[
            { brand: 'Cookies', type: '15% off all flower', used: 3200, limit: 8000, daysLeft: 18, locations: 12 },
            { brand: 'Stiiizy', type: 'BOGO pods', used: 1450, limit: 3000, daysLeft: 9, locations: 6 },
            { brand: 'Kiva', type: '$5 off edibles', used: 890, limit: 2000, daysLeft: 24, locations: 8 },
          ].map((promo, i) => {
            const pct = Math.round((promo.used / promo.limit) * 100);
            const barColor = pct > 80 ? 'var(--color-accent-red)' : pct > 50 ? 'var(--color-accent-gold)' : 'var(--color-accent-green)';
            return (
              <div key={i} className="rounded-lg bg-surface-bg border border-surface-border p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-text-primary">{promo.brand} — {promo.type}</span>
                  <span className="text-[9px] text-text-muted">{promo.daysLeft}d left &middot; {promo.locations} stores</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-card overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: pct + '%', background: barColor }} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: barColor }}>${promo.used.toLocaleString()} / ${promo.limit.toLocaleString()} ({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-card border border-accent-green/30 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
            <span className="text-xs font-medium text-text-primary">{toastMsg}</span>
          </div>
        </div>
      )}
    </NexusTile>
  );
}


// ─── MAIN LAYOUT ─── //

export default function NexusHome() {
  const navigate = useNavigate();
  const handleNexusAction = useCallback((query) => {
    navigate('/agents/bridge');
  }, [navigate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <MorningBriefing />
      <RevealOnScroll>
        <SmartAlertsFeed onAction={handleNexusAction} />
      </RevealOnScroll>
      <RevealOnScroll delay={80}>
        <ConnectInboxTile />
      </RevealOnScroll>
      <RevealOnScroll delay={150}>
        <SalesReporting />
      </RevealOnScroll>
      <RevealOnScroll delay={200}>
        <StoreHealthMatrix />
      </RevealOnScroll>
      <RevealOnScroll delay={300}>
        <CustomerHealthOverview onNavigate={() => navigate('/customers')} />
      </RevealOnScroll>
    </div>
  );
}
