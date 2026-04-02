import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, Target, ArrowUpRight, ArrowDownRight, ChevronDown, UserCheck, UserX, UserMinus, Heart, Sliders, Filter, AlertTriangle, BarChart3, Megaphone, MessageCircle, GitMerge, Layers, Shield, Zap, Info, Mail, Smartphone, Bell, Store, Calendar, ExternalLink, Award } from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import { PageSkeleton } from '../components/common/PageSkeleton';
import NexusIcon from '../components/NexusIcon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useStores } from '../contexts/StoreContext';
import { usePersona } from '../contexts/PersonaContext';
import { useDateRange } from '../contexts/DateRangeContext';
import { locations } from '../data/mockData';

// ---------------------------------------------------------------------------
// Deterministic seeded RNG (same pattern as LocationInsights)
// ---------------------------------------------------------------------------
function _seedRng(seed) {
  let s = seed | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------------------------------------------------------------------------
// Original aggregate SEGMENTS (used when "All Stores" is selected)
// ---------------------------------------------------------------------------
const SEGMENTS = [
  { name: 'Champions', size: 2840, pct: 18.2, avgLTV: 4200, icon: Heart, color: 'var(--color-accent-green)', trend: 3.2, description: 'High frequency, high spend' },
  { name: 'Loyal', size: 4120, pct: 26.4, avgLTV: 2800, icon: UserCheck, color: 'var(--color-accent-blue)', trend: 1.8, description: 'Regular purchasers, consistent' },
  { name: 'At Risk', size: 3260, pct: 20.9, avgLTV: 1900, icon: UserMinus, color: 'var(--color-accent-gold)', trend: -2.1, description: 'Declining visit frequency' },
  { name: 'New', size: 2680, pct: 17.2, avgLTV: 680, icon: Users, color: 'var(--color-accent-purple)', trend: 5.4, description: 'First purchase <60 days ago' },
  { name: 'Lost', size: 2700, pct: 17.3, avgLTV: 1200, icon: UserX, color: 'var(--color-accent-red)', trend: -1.5, description: 'No purchase in 90+ days' },
];

const SEGMENT_ICONS = { Champions: Heart, Loyal: UserCheck, 'At Risk': UserMinus, New: Users, Lost: UserX };
const SEGMENT_DESCRIPTIONS = { Champions: 'High frequency, high spend', Loyal: 'Regular purchasers, consistent', 'At Risk': 'Declining visit frequency', New: 'First purchase <60 days ago', Lost: 'No purchase in 90+ days' };

// ---------------------------------------------------------------------------
// Per-store segment generator (deterministic per location index)
// ---------------------------------------------------------------------------
function generateStoreSegments(locs) {
  const storeSegments = {};
  const segNames = ['Champions', 'Loyal', 'At Risk', 'New', 'Lost'];
  const segColors = ['var(--color-accent-green)', 'var(--color-accent-blue)', 'var(--color-accent-gold)', 'var(--color-accent-purple)', 'var(--color-accent-red)'];
  const segLTVBase = [4200, 2800, 1900, 680, 1200];

  locs.forEach((loc, i) => {
    const rng = _seedRng(i * 7919);
    const isOutlet = loc.name.includes('Outlet');
    // Outlet stores: fewer champions/loyal, more new/at-risk
    const base = isOutlet
      ? [8, 12, 28, 25, 27]
      : [22, 28, 18, 18, 14];

    const segments = segNames.map((name, si) => {
      const variance = Math.round((rng() - 0.5) * base[si] * 0.4);
      const count = Math.max(20, Math.round((base[si] + variance) * (800 + rng() * 400) / 100));
      const ltvVariance = Math.round((rng() - 0.5) * segLTVBase[si] * 0.2);
      const avgLTV = segLTVBase[si] + ltvVariance;
      const trend = Math.round((rng() * 8 - 3) * 10) / 10;
      return { name, count, color: segColors[si], avgLTV, trend };
    });
    storeSegments[loc.name] = segments;
  });
  return storeSegments;
}

const ALL_STORE_SEGMENTS = generateStoreSegments(locations);

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const COHORT_DATA = [
  { month: 'Oct', m0: 100, m1: 72, m2: 58, m3: 48, m4: 42, m5: 38 },
  { month: 'Nov', m0: 100, m1: 75, m2: 61, m3: 51, m4: 44, m5: null },
  { month: 'Dec', m0: 100, m1: 78, m2: 65, m3: 54, m4: null, m5: null },
  { month: 'Jan', m0: 100, m1: 71, m2: 56, m3: null, m4: null, m5: null },
  { month: 'Feb', m0: 100, m1: 74, m2: null, m3: null, m4: null, m5: null },
  { month: 'Mar', m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null },
];

const LTV_DISTRIBUTION = [
  { range: '$0-500', count: 3200 },
  { range: '$500-1K', count: 4100 },
  { range: '$1K-2K', count: 3800 },
  { range: '$2K-3K', count: 2400 },
  { range: '$3K-5K', count: 1600 },
  { range: '$5K+', count: 500 },
];

const LTV_TREND = [
  { month: 'Oct', avg: 2180 },
  { month: 'Nov', avg: 2220 },
  { month: 'Dec', avg: 2380 },
  { month: 'Jan', avg: 2340 },
  { month: 'Feb', avg: 2390 },
  { month: 'Mar', avg: 2420 },
];

const CHURN_RISK_TIERS = [
  { label: 'High Risk', customers: 847, gmv: '$1.1M', color: 'var(--color-accent-red)' },
  { label: 'Medium Risk', customers: 1580, gmv: '$890K', color: 'var(--color-accent-gold)' },
  { label: 'Low Risk', customers: 833, gmv: '$420K', color: 'var(--color-accent-blue)' },
];

const CHURN_AT_RISK_CUSTOMERS = [
  { id: 'CUS-4821', lastVisit: '68 days ago', ltv: '$3,420', riskScore: 92, action: 'VIP Win-Back SMS' },
  { id: 'CUS-1209', lastVisit: '45 days ago', ltv: '$2,890', riskScore: 87, action: 'Personal Outreach' },
  { id: 'CUS-7734', lastVisit: '52 days ago', ltv: '$2,650', riskScore: 84, action: '20% Discount Offer' },
  { id: 'CUS-3305', lastVisit: '41 days ago', ltv: '$2,210', riskScore: 78, action: 'Re-engagement Email' },
  { id: 'CUS-9182', lastVisit: '73 days ago', ltv: '$1,980', riskScore: 75, action: 'Win-Back Campaign' },
];

const PURCHASE_FREQUENCY_DATA = [
  { range: '0-1', customers: 4200 },
  { range: '1-2', customers: 3800 },
  { range: '2-3', customers: 3100 },
  { range: '3-4', customers: 2400 },
  { range: '4-6', customers: 1800 },
  { range: '6-8', customers: 890 },
  { range: '8+', customers: 380 },
];

// ---------------------------------------------------------------------------
// Enhancement 1: Campaign Execution Channel Data per Funnel Stage
// ---------------------------------------------------------------------------
const FUNNEL_CAMPAIGN_DATA = {
  'New': {
    suggestedCampaign: 'Welcome Series — Free pre-roll on 2nd visit',
    triggerType: 'NewCustomer',
    workflowType: 'Automated Workflow',
    schedule: 'Trigger on signup, 3-touch drip: Day 1 email, Day 3 SMS, Day 7 email',
    target: 'New customers with first purchase in last 60 days',
    channels: [
      { channel: 'Email', reach: 2410, cost: '$0', roi: '5.1x ($48K rev)', icon: Mail },
      { channel: 'SMS', reach: 1620, cost: '$24.30', roi: '3.8x ($22K rev)', icon: Smartphone },
      { channel: 'Push', reach: 890, cost: '$0', roi: '6.2x ($32K rev)', icon: Bell },
    ],
  },
  'Returning': {
    suggestedCampaign: 'Loyalty Enrollment — Join rewards, earn 2x points on 3rd visit',
    triggerType: 'VisitMilestone',
    workflowType: 'Automated Workflow',
    schedule: 'Trigger on 3rd visit, follow-up SMS in 5 days if not enrolled',
    target: 'Returning customers with 2-3 purchases, not yet enrolled in loyalty',
    channels: [
      { channel: 'SMS', reach: 3280, cost: '$49.20', roi: '7.3x ($82K rev)', icon: Smartphone },
      { channel: 'Push', reach: 1540, cost: '$0', roi: '3.2x ($18K rev)', icon: Bell },
      { channel: 'Email', reach: 3740, cost: '$0', roi: '4.5x ($52K rev)', icon: Mail },
    ],
  },
  'Loyal': {
    suggestedCampaign: 'VIP Exclusive — Early access to new drops + birthday 3x points',
    triggerType: 'LoyaltyTierSegment',
    workflowType: 'Automated Workflow',
    schedule: 'Monthly VIP drop notifications + birthday reward boost, by tier (Gold+)',
    target: 'Loyal customers with 4+ purchases, Gold tier and above',
    channels: [
      { channel: 'Email', reach: 6240, cost: '$0', roi: '5.7x ($96K rev)', icon: Mail },
      { channel: 'Push', reach: 4180, cost: '$0', roi: '8.4x ($142K rev)', icon: Bell },
    ],
  },
  'At Risk': {
    suggestedCampaign: 'Win-Back Waterfall — 15% off with cascading outreach',
    triggerType: 'WinBack',
    workflowType: 'Automated Workflow',
    schedule: 'Waterfall: Day 1 email, Day 3 SMS if no open, Day 7 push with expiring offer',
    target: 'At-risk customers with >$200 LTV, no purchase in 45+ days',
    channels: [
      { channel: 'Email', reach: 1180, cost: '$0', roi: '4.2x ($18K rev)', icon: Mail },
      { channel: 'SMS', reach: 892, cost: '$13.38', roi: '6.1x ($26K rev)', icon: Smartphone },
      { channel: 'Push', reach: 340, cost: '$0', roi: '2.8x ($8K rev)', icon: Bell },
    ],
  },
};

// ---------------------------------------------------------------------------
// Enhancement 2: Industry Benchmarking Data
// ---------------------------------------------------------------------------
const INDUSTRY_BENCHMARKS = {
  retention: {
    '30-day': { industryAvg: 42, topQuartile: 55, yours: 74 },
    '90-day': { industryAvg: 28, topQuartile: 38, yours: 51 },
  },
  ltv: {
    industryAvg: 1800,
    topQuartile: 3200,
    medicalOnly: 4500,
    yours: 2840,
  },
  segments: {
    Champions: { industryAvgRange: [8, 12] },
    Loyal: { industryAvgRange: [15, 20] },
    'At Risk': { industryAvgRange: [20, 25] },
    New: { industryAvgRange: [25, 35] },
    Lost: { industryAvgRange: [15, 20] },
  },
};

function getSegmentBenchmarkStatus(segName, pct) {
  const bench = INDUSTRY_BENCHMARKS.segments[segName];
  if (!bench) return null;
  const [lo, hi] = bench.industryAvgRange;
  const isNegativeSegment = segName === 'At Risk' || segName === 'Lost';
  if (isNegativeSegment) {
    // Lower is better for At Risk and Lost
    if (pct < lo) return { label: 'Above Market', color: 'var(--color-accent-green)' };
    if (pct <= hi) return { label: 'At Market', color: 'var(--color-accent-gold)' };
    return { label: 'Below Market', color: 'var(--color-accent-red)' };
  } else {
    // Higher is better for Champions, Loyal, New
    if (pct > hi) return { label: 'Above Market', color: 'var(--color-accent-green)' };
    if (pct >= lo) return { label: 'At Market', color: 'var(--color-accent-gold)' };
    return { label: 'Below Market', color: 'var(--color-accent-red)' };
  }
}

// ---------------------------------------------------------------------------
// Enhancement 1: Campaign Execution Panel Component
// ---------------------------------------------------------------------------
function CampaignExecutionPanel({ stage, stageData, onLaunch }) {
  const campaignData = FUNNEL_CAMPAIGN_DATA[stage];
  if (!campaignData) return null;

  return (
    <div className="mt-3 rounded-xl border border-surface-divider p-5 animate-fade-in" style={{ background: 'color-mix(in srgb, var(--color-surface-card) 50%, var(--color-surface-bg))' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">{stage}: {stageData.count.toLocaleString()} customers</span>
        </div>
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Recommended Channels</span>
      </div>

      {/* Channel table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-divider">
              <th className="text-left font-semibold text-text-secondary uppercase tracking-wider py-2 pr-3">Channel</th>
              <th className="text-right font-semibold text-text-secondary uppercase tracking-wider py-2 px-3">Reach</th>
              <th className="text-right font-semibold text-text-secondary uppercase tracking-wider py-2 px-3">Est. Cost</th>
              <th className="text-right font-semibold text-text-secondary uppercase tracking-wider py-2 pl-3">Projected ROI</th>
            </tr>
          </thead>
          <tbody>
            {campaignData.channels.map((ch) => {
              const ChIcon = ch.icon;
              return (
                <tr key={ch.channel} className="border-b border-surface-divider/50">
                  <td className="py-2 pr-3">
                    <span className="flex items-center gap-2 text-text-primary font-medium">
                      <ChIcon className="w-3.5 h-3.5 text-text-muted" /> {ch.channel}
                    </span>
                  </td>
                  <td className="text-right py-2 px-3 text-text-secondary">{ch.reach.toLocaleString()}</td>
                  <td className="text-right py-2 px-3 text-text-secondary">{ch.cost}</td>
                  <td className="text-right py-2 pl-3 text-accent-green font-semibold">{ch.roi}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Campaign details */}
      <div className="rounded-lg px-4 py-3 mb-4 space-y-1.5" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 6%, transparent)' }}>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-text-secondary"><span className="font-semibold text-text-primary">Suggested Campaign:</span> {campaignData.suggestedCampaign}</p>
          {campaignData.workflowType && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)' }}>
              <Zap className="w-2.5 h-2.5" /> {campaignData.workflowType}
            </span>
          )}
        </div>
        {campaignData.triggerType && (
          <p className="text-xs text-text-secondary"><span className="font-semibold text-text-primary">Trigger:</span> {campaignData.triggerType}</p>
        )}
        <p className="text-xs text-text-secondary"><span className="font-semibold text-text-primary">Schedule:</span> {campaignData.schedule}</p>
        <p className="text-xs text-text-secondary"><span className="font-semibold text-text-primary">Target:</span> {campaignData.target}</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onLaunch(stage)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-blue text-white hover:brightness-110 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Launch in Growth Agent
        </button>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: 'color-mix(in srgb, var(--color-accent-green) 10%, transparent)', color: 'var(--color-accent-green)' }}
        >
          <Calendar className="w-3.5 h-3.5" /> Schedule for Monday
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enhancement 3: LTV Methodology Panel Component
// ---------------------------------------------------------------------------
function LTVMethodologyPanel({ isOpen, onToggle }) {
  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={onToggle}
        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
        title="LTV Methodology"
        aria-label="Show LTV methodology"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {isOpen && (
        <div className="absolute top-6 left-0 z-50 w-[380px] rounded-xl border border-surface-border bg-surface-card shadow-lg p-5 animate-fade-in" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">LTV Methodology</h3>
            <button onClick={onToggle} className="text-text-muted hover:text-text-primary text-xs">&times;</button>
          </div>
          <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              <span className="font-semibold text-text-primary">Time Horizon</span>
              <span>12-month rolling (purchases in last 365 days)</span>
              <span className="font-semibold text-text-primary">Calculation</span>
              <span>Total net revenue per customer over the period</span>
              <span className="font-semibold text-text-primary">Includes</span>
              <span>All purchase channels (in-store, online, delivery)</span>
              <span className="font-semibold text-text-primary">Excludes</span>
              <span>Tax, returns, loyalty point redemptions</span>
            </div>

            <div className="border-t border-surface-divider pt-2.5">
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Why 12-month:</span> Cannabis customer lifecycles are shorter than traditional retail. 12-month LTV best reflects the active relationship window and is the industry standard for dispensary analytics. Lifetime LTV inflates numbers with churned customers.
              </p>
            </div>

            <div className="border-t border-surface-divider pt-2.5">
              <p className="font-semibold text-text-primary mb-1.5">Context</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>12-month LTV (shown)</span>
                  <span className="font-semibold text-text-primary">$2,840</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>3-month LTV</span>
                  <span className="font-semibold text-text-primary">$920</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Projected lifetime (avg 2.4 yr lifespan)</span>
                  <span className="font-semibold text-text-primary">$6,800</span>
                </div>
              </div>
            </div>

            {/* LTV Benchmarking (Enhancement 2b) */}
            <div className="border-t border-surface-divider pt-2.5">
              <p className="font-semibold text-text-primary mb-1.5">Industry Benchmarks (12-mo)</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Cannabis dispensary avg</span>
                  <span className="font-semibold text-text-primary">${INDUSTRY_BENCHMARKS.ltv.industryAvg.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Top quartile</span>
                  <span className="font-semibold text-text-primary">${INDUSTRY_BENCHMARKS.ltv.topQuartile.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Medical-only avg</span>
                  <span className="font-semibold text-text-primary">${INDUSTRY_BENCHMARKS.ltv.medicalOnly.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-surface-divider">
                  <span className="font-semibold text-text-primary">Your portfolio</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">${INDUSTRY_BENCHMARKS.ltv.yours.toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)' }}>
                      <Award className="w-3 h-3" /> Top Quartile
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="text-text-secondary">{p.name}:</span>
          <span className="font-medium text-text-primary">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function CohortHeatmap() {
  const months = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'];
  const keys = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5'];
  const getColor = (val) => {
    if (val === null) return 'transparent';
    if (val >= 70) return 'var(--color-accent-green)';
    if (val >= 50) return 'var(--color-accent-blue)';
    if (val >= 40) return 'var(--color-accent-gold)';
    return 'var(--color-accent-red)';
  };
  const getOpacity = (val) => {
    if (val === null) return 0;
    return 0.15 + (val / 100) * 0.85;
  };
  // Check if drop from previous month exceeds 15pp
  const isBigDrop = (row, keyIndex) => {
    if (keyIndex === 0) return false;
    const curr = row[keys[keyIndex]];
    const prev = row[keys[keyIndex - 1]];
    if (curr === null || prev === null) return false;
    return (prev - curr) > 15;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 pr-4">Cohort</th>
            {months.map(m => (
              <th key={m} className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 px-3">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COHORT_DATA.map((row) => (
            <tr key={row.month}>
              <td className="text-text-secondary font-medium py-1.5 pr-4">{row.month}</td>
              {keys.map((key, i) => {
                const val = row[key];
                const bigDrop = isBigDrop(row, i);
                return (
                  <td key={key} className="text-center py-1.5 px-3">
                    {val !== null ? (
                      <span
                        className="inline-flex items-center justify-center w-12 h-8 rounded text-xs font-semibold"
                        style={{
                          background: getColor(val),
                          opacity: getOpacity(val),
                          color: val >= 50 ? 'white' : 'var(--color-text-primary)',
                          border: bigDrop ? '2px solid var(--color-accent-red)' : 'none',
                          boxShadow: bigDrop ? '0 0 0 1px var(--color-accent-red)' : 'none',
                        }}
                      >
                        {val}%
                      </span>
                    ) : (
                      <span className="text-text-muted/30">&mdash;</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ENHANCEMENT 2: Cross-Store Customer Overlap
// ---------------------------------------------------------------------------
function CrossStoreOverlap({ selectedStores }) {
  const overlapData = useMemo(() => {
    const stores = selectedStores.slice(0, 8);
    const matrix = [];
    stores.forEach((storeA, i) => {
      stores.forEach((storeB, j) => {
        if (i >= j) return;
        const rng = _seedRng(i * 1013 + j * 7);
        const sameCity = storeA.city === storeB.city;
        const sameState = storeA.state === storeB.state;
        const baseOverlap = sameCity ? 180 + rng() * 220 : sameState ? 40 + rng() * 80 : 5 + rng() * 15;
        matrix.push({
          storeA: storeA.name,
          storeB: storeB.name,
          shared: Math.round(baseOverlap),
          sameCity,
        });
      });
    });
    return { stores, matrix };
  }, [selectedStores]);

  const { stores, matrix } = overlapData;

  // Find highest overlap pair
  const topPair = matrix.length > 0 ? matrix.reduce((a, b) => a.shared > b.shared ? a : b) : null;

  // Summary stats (deterministic)
  const totalCustomers = 16260;
  const singleStore = 12840;
  const multiStore = 3420;
  const singlePct = Math.round(singleStore / totalCustomers * 100);
  const multiPct = 100 - singlePct;

  // Shorten store name for display
  const shortName = (name) => name.replace('Ascend ', '').replace(' (Outlet)', '*');

  // Heatmap cell color based on shared count
  const cellBg = (shared) => {
    if (shared >= 200) return 'color-mix(in srgb, var(--color-accent-purple) 35%, transparent)';
    if (shared >= 100) return 'color-mix(in srgb, var(--color-accent-purple) 22%, transparent)';
    if (shared >= 40) return 'color-mix(in srgb, var(--color-accent-blue) 18%, transparent)';
    return 'color-mix(in srgb, var(--color-accent-blue) 8%, transparent)';
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6 animate-fade-in" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-2 mb-1">
        <GitMerge className="w-5 h-5 text-accent-purple" />
        <h2 className="text-lg font-semibold text-text-primary">Cross-Store Customer Overlap</h2>
      </div>
      <p className="text-xs text-text-muted mb-5">Customers shopping at multiple locations</p>

      {/* Summary stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-surface-divider p-4 text-center">
          <p className="text-xs text-text-muted mb-1">Single-Store Customers</p>
          <p className="text-xl font-bold text-text-primary">{singleStore.toLocaleString()}</p>
          <p className="text-xs text-text-secondary">({singlePct}%)</p>
        </div>
        <div className="rounded-lg border border-surface-divider p-4 text-center" style={{ borderColor: 'var(--color-accent-purple)' }}>
          <p className="text-xs text-text-muted mb-1">Multi-Store Customers</p>
          <p className="text-xl font-bold" style={{ color: 'var(--color-accent-purple)' }}>{multiStore.toLocaleString()}</p>
          <p className="text-xs text-text-secondary">({multiPct}%)</p>
        </div>
        <div className="rounded-lg border border-surface-divider p-4 text-center">
          <p className="text-xs text-text-muted mb-1">Multi-Store LTV Premium</p>
          <p className="text-xl font-bold text-accent-green">2.6x</p>
          <p className="text-xs text-text-secondary">vs single-store</p>
        </div>
      </div>

      {/* Overlap matrix */}
      {stores.length >= 2 && (
        <div className="overflow-x-auto mb-5">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 pr-2 min-w-[100px]" />
                {stores.map(s => (
                  <th key={s.name} className="text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider py-2 px-1 min-w-[60px]">
                    <span className="block truncate max-w-[72px]" title={s.name}>{shortName(s.name)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stores.map((rowStore, ri) => (
                <tr key={rowStore.name}>
                  <td className="text-text-secondary font-medium py-1.5 pr-2 whitespace-nowrap text-xs">
                    <span className="truncate block max-w-[120px]" title={rowStore.name}>{shortName(rowStore.name)}</span>
                  </td>
                  {stores.map((colStore, ci) => {
                    if (ri === ci) {
                      return (
                        <td key={colStore.name} className="text-center py-1.5 px-1">
                          <span className="inline-flex items-center justify-center w-full h-7 rounded text-[10px] font-medium text-text-muted" style={{ background: 'var(--color-surface-border)' }}>&mdash;</span>
                        </td>
                      );
                    }
                    const pair = matrix.find(m =>
                      (m.storeA === rowStore.name && m.storeB === colStore.name) ||
                      (m.storeA === colStore.name && m.storeB === rowStore.name)
                    );
                    const shared = pair ? pair.shared : 0;
                    return (
                      <td key={colStore.name} className="text-center py-1.5 px-1">
                        <span
                          className="inline-flex items-center justify-center w-full h-7 rounded text-[10px] font-semibold text-text-primary"
                          style={{ background: cellBg(shared) }}
                        >
                          {shared > 0 ? shared.toLocaleString() : '-'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insight callout */}
      <div className="rounded-lg px-4 py-3" style={{ background: 'color-mix(in srgb, var(--color-accent-purple) 8%, transparent)' }}>
        <p className="text-sm text-text-secondary">
          Customers who shop at <span className="font-semibold" style={{ color: 'var(--color-accent-purple)' }}>2+ stores</span> spend{' '}
          <span className="font-semibold" style={{ color: 'var(--color-accent-purple)' }}>2.6x</span> more ($6,290 avg LTV vs $2,420).
          {topPair && (
            <> Your highest overlap: <span className="font-semibold text-text-primary">{shortName(topPair.storeA)}</span> &harr; <span className="font-semibold text-text-primary">{shortName(topPair.storeB)}</span> with <span className="font-semibold" style={{ color: 'var(--color-accent-purple)' }}>{topPair.shared}</span> shared customers.</>
          )}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ENHANCEMENT 3: Store-Level Segment Comparison Grid
// ---------------------------------------------------------------------------
function StoreSegmentGrid({ storeSegments, selectedStores }) {
  const segNames = ['Champions', 'Loyal', 'At Risk', 'New', 'Lost'];
  const segColors = ['var(--color-accent-green)', 'var(--color-accent-blue)', 'var(--color-accent-gold)', 'var(--color-accent-purple)', 'var(--color-accent-red)'];

  const rows = useMemo(() => {
    let storesToShow = selectedStores;
    let aggregatedByState = false;

    // If more than 12 stores, aggregate to state level
    if (storesToShow.length > 12) {
      aggregatedByState = true;
      const stateMap = {};
      storesToShow.forEach(store => {
        if (!stateMap[store.state]) stateMap[store.state] = [];
        stateMap[store.state].push(store);
      });
      const stateRows = Object.entries(stateMap).map(([state, stores]) => {
        const agg = segNames.map((segName) => {
          let total = 0;
          stores.forEach(store => {
            const segs = storeSegments[store.name];
            if (segs) {
              const seg = segs.find(s => s.name === segName);
              if (seg) total += seg.count;
            }
          });
          return total;
        });
        const grandTotal = agg.reduce((a, b) => a + b, 0);
        return {
          label: `${state} (${stores.length} stores)`,
          state,
          segments: segNames.map((name, i) => ({
            name,
            count: agg[i],
            pct: grandTotal > 0 ? Math.round(agg[i] / grandTotal * 1000) / 10 : 0,
          })),
          total: grandTotal,
          champPct: grandTotal > 0 ? Math.round(agg[0] / grandTotal * 1000) / 10 : 0,
          riskPct: grandTotal > 0 ? Math.round(agg[2] / grandTotal * 1000) / 10 : 0,
        };
      });
      return { rows: stateRows.sort((a, b) => b.champPct - a.champPct), aggregatedByState };
    }

    // Normal: per-store rows
    const storeRows = storesToShow.map(store => {
      const segs = storeSegments[store.name] || [];
      const total = segs.reduce((a, b) => a + b.count, 0);
      const champSeg = segs.find(s => s.name === 'Champions');
      const riskSeg = segs.find(s => s.name === 'At Risk');
      return {
        label: store.name.replace('Ascend ', ''),
        state: store.state,
        segments: segNames.map((name) => {
          const seg = segs.find(s => s.name === name);
          const count = seg ? seg.count : 0;
          return { name, count, pct: total > 0 ? Math.round(count / total * 1000) / 10 : 0 };
        }),
        total,
        champPct: champSeg && total > 0 ? Math.round(champSeg.count / total * 1000) / 10 : 0,
        riskPct: riskSeg && total > 0 ? Math.round(riskSeg.count / total * 1000) / 10 : 0,
      };
    });
    return { rows: storeRows.sort((a, b) => b.champPct - a.champPct), aggregatedByState };
  }, [storeSegments, selectedStores]);

  // Compute portfolio average
  const portfolioAvg = useMemo(() => {
    const totals = segNames.map(() => 0);
    rows.rows.forEach(row => {
      row.segments.forEach((seg, i) => { totals[i] += seg.count; });
    });
    const grand = totals.reduce((a, b) => a + b, 0);
    return {
      champPct: grand > 0 ? Math.round(totals[0] / grand * 1000) / 10 : 0,
      riskPct: grand > 0 ? Math.round(totals[2] / grand * 1000) / 10 : 0,
      segments: segNames.map((name, i) => ({
        name, count: totals[i], pct: grand > 0 ? Math.round(totals[i] / grand * 1000) / 10 : 0,
      })),
    };
  }, [rows]);

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6 animate-fade-in" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-5 h-5 text-accent-blue" />
        <h2 className="text-lg font-semibold text-text-primary">Segment Distribution by {rows.aggregatedByState ? 'State' : 'Store'}</h2>
      </div>
      <p className="text-xs text-text-muted mb-5">Customer segment breakdown per location — sorted by % Champions</p>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {segNames.map((name, i) => (
          <div key={name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: segColors[i] }} />
            <span className="text-xs text-text-secondary">{name}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {/* Portfolio average row */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-surface-divider" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 4%, transparent)' }}>
          <div className="w-[140px] flex-shrink-0">
            <span className="text-xs font-semibold text-text-primary">Portfolio Avg</span>
          </div>
          <div className="w-10 flex-shrink-0">
            <span className="text-[10px] font-medium text-text-muted px-1.5 py-0.5 rounded bg-surface-border">ALL</span>
          </div>
          <div className="flex-1 flex h-5 rounded-full overflow-hidden bg-surface-border">
            {portfolioAvg.segments.map((seg, i) => (
              <div
                key={seg.name}
                style={{ width: `${seg.pct}%`, background: segColors[i] }}
                className="h-full transition-all"
                title={`${seg.name}: ${seg.pct}%`}
              />
            ))}
          </div>
          <div className="w-16 flex-shrink-0 text-right">
            <span className="text-xs font-semibold text-accent-green">{portfolioAvg.champPct}%</span>
          </div>
          <div className="w-16 flex-shrink-0 text-right">
            <span className="text-xs font-semibold text-text-secondary">{portfolioAvg.riskPct}%</span>
          </div>
        </div>

        {/* Header labels */}
        <div className="flex items-center gap-3 px-3 py-1">
          <div className="w-[140px] flex-shrink-0">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{rows.aggregatedByState ? 'State' : 'Store'}</span>
          </div>
          <div className="w-10 flex-shrink-0">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">ST</span>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Segment Distribution</span>
          </div>
          <div className="w-16 flex-shrink-0 text-right">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Champ%</span>
          </div>
          <div className="w-16 flex-shrink-0 text-right">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Risk%</span>
          </div>
        </div>

        {/* Store rows */}
        {rows.rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors">
            <div className="w-[140px] flex-shrink-0">
              <span className="text-xs font-medium text-text-primary truncate block" title={row.label}>{row.label}</span>
            </div>
            <div className="w-10 flex-shrink-0">
              <span className="text-[10px] font-medium text-text-muted px-1.5 py-0.5 rounded bg-surface-border">{row.state}</span>
            </div>
            <div className="flex-1 flex h-5 rounded-full overflow-hidden bg-surface-border">
              {row.segments.map((seg, i) => (
                <div
                  key={seg.name}
                  style={{ width: `${seg.pct}%`, background: segColors[i] }}
                  className="h-full transition-all"
                  title={`${seg.name}: ${seg.pct}%`}
                />
              ))}
            </div>
            <div className="w-16 flex-shrink-0 text-right">
              <span className="text-xs font-semibold text-accent-green">{row.champPct}%</span>
            </div>
            <div className="w-16 flex-shrink-0 text-right">
              <span className={`text-xs font-semibold ${row.riskPct > portfolioAvg.riskPct ? 'text-accent-red' : 'text-text-secondary'}`}>{row.riskPct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function CustomerIntelligence() {
  const navigate = useNavigate();
  const { selectionLabel, selectedStoreNames, selectedStores, isAllSelected } = useStores();
  const { selectedPersona, showCrossStore } = usePersona();
  const { rangeLabel } = useDateRange();
  const [expandedSegment, setExpandedSegment] = useState(null);
  const [retentionImprovement, setRetentionImprovement] = useState(5);
  const [showDeepAnalytics, setShowDeepAnalytics] = useState(false);
  const [expandedFunnelStage, setExpandedFunnelStage] = useState(null);
  const [showLtvMethodology, setShowLtvMethodology] = useState(false);

  // ENHANCEMENT 1: Aggregate segment data for selected stores
  const filteredSegments = useMemo(() => {
    if (isAllSelected) return SEGMENTS;
    const selected = locations.filter(l => selectedStoreNames.has(l.name));
    if (selected.length === 0) return SEGMENTS;

    const segNames = ['Champions', 'Loyal', 'At Risk', 'New', 'Lost'];
    const segColors = ['var(--color-accent-green)', 'var(--color-accent-blue)', 'var(--color-accent-gold)', 'var(--color-accent-purple)', 'var(--color-accent-red)'];
    const segIcons = [Heart, UserCheck, UserMinus, Users, UserX];

    const agg = segNames.map(() => ({ count: 0, ltvSum: 0, trendSum: 0, n: 0 }));

    selected.forEach(loc => {
      const segs = ALL_STORE_SEGMENTS[loc.name];
      if (!segs) return;
      segs.forEach((seg, i) => {
        agg[i].count += seg.count;
        agg[i].ltvSum += seg.avgLTV * seg.count;
        agg[i].trendSum += seg.trend;
        agg[i].n += 1;
      });
    });

    const totalCount = agg.reduce((s, a) => s + a.count, 0);

    return segNames.map((name, i) => ({
      name,
      size: agg[i].count,
      pct: totalCount > 0 ? Math.round(agg[i].count / totalCount * 1000) / 10 : 0,
      avgLTV: agg[i].count > 0 ? Math.round(agg[i].ltvSum / agg[i].count) : 0,
      icon: segIcons[i],
      color: segColors[i],
      trend: agg[i].n > 0 ? Math.round(agg[i].trendSum / agg[i].n * 10) / 10 : 0,
      description: SEGMENT_DESCRIPTIONS[name],
    }));
  }, [selectedStoreNames, isAllSelected]);

  const totalCustomers = filteredSegments.reduce((s, seg) => s + seg.size, 0);
  const multiStoreSelected = selectedStores.length > 1;

  // 4.4: Segment action mappings — wired to real Dutchie L&M workflow triggers
  const SEGMENT_ACTIONS = {
    'Champions': { label: 'Send VIP offer', color: 'var(--color-accent-green)', bgClass: 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20', state: { action: 'create-workflow', trigger: 'loyalty_tier', segment: 'champions', campaign: { name: 'Champions VIP Reward', triggerType: 'LoyaltyTierSegment', description: 'Exclusive offer for top-tier customers: early product access, 3x point multiplier weekend, personalized product recs' } } },
    'Loyal': { label: 'Increase frequency', color: 'var(--color-accent-blue)', bgClass: 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20', state: { action: 'create-workflow', trigger: 'visit_milestone', segment: 'loyal', campaign: { name: 'Frequency Builder', triggerType: 'PostPurchase', description: 'Post-purchase follow-up: cross-sell recommendations 48h after purchase, next-visit incentive with escalating loyalty points' } } },
    'Potential Loyalists': { label: 'Convert to loyal', color: 'var(--color-accent-purple)', bgClass: 'bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20', state: { action: 'create-workflow', trigger: 'visit_milestone', segment: 'potential-loyalists', campaign: { name: 'Loyalty Conversion', triggerType: 'VisitMilestone', visitCount: 3, description: 'Trigger on 3rd visit: loyalty program enrollment CTA, 2x points incentive, tier benefits preview' } } },
    'New': { label: 'Welcome series', color: 'var(--color-accent-gold)', bgClass: 'bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20', state: { action: 'create-workflow', trigger: 'new_customer_welcome', segment: 'new', campaign: { name: 'New Customer Welcome', triggerType: 'NewCustomer', description: 'Automated welcome: enrollment email, loyalty signup CTA, first-purchase thank you with personalized recs' } } },
    'At Risk': { label: 'Win-back campaign', color: 'var(--color-accent-red)', bgClass: 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20', state: { action: 'create-workflow', trigger: 'win_back', segment: 'at-risk', channels: ['email', 'sms', 'push'], campaign: { name: 'Win-Back Campaign', triggerType: 'WinBack', dormancyDays: 45, description: 'Waterfall win-back: Day 1 email with personalized "we miss you" + 15% off. Day 3 SMS if no open. Day 7 push with expiring offer. Based on last purchased categories.', suggestedDiscount: '15% off next visit (expiring in 14 days)', loyaltyAction: 'Bonus points on return visit' } } },
    'Lost': { label: 'Reactivation blast', color: 'var(--color-accent-red)', bgClass: 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20', state: { action: 'create-workflow', trigger: 'win_back', segment: 'lost', channels: ['email', 'sms', 'push'], campaign: { name: 'Reactivation Blast', triggerType: 'WinBack', dormancyDays: 90, description: 'Aggressive reactivation: deep discount (20% off), limited-time SMS blast, "your favorites are back in stock" product alerts' } } },
  };
  // Map Loyal Customers alias
  SEGMENT_ACTIONS['Loyal Customers'] = SEGMENT_ACTIONS['Loyal'];

  return (
    <PageSkeleton>
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3"><Users className="w-7 h-7 text-accent-purple" /> Customer Intelligence</h1>
        <p className="text-sm text-text-secondary mt-1">{selectionLabel} &middot; {rangeLabel}</p>
      </div>

      {/* 1. KPI bar (keep existing) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-grid">
        <MetricCard title="Total Customers" value={totalCustomers.toLocaleString()} icon={Users} color="dutchie" trend={4.2} sparkline={[14200, 14500, 14800, 15100, 15400, 15600]} borderAccent />
        <MetricCard title="Avg Customer LTV (12-mo)" value="$2,840" icon={DollarSign} color="amber" trend={3.8} sparkline={LTV_TREND.map(d => d.avg)} borderAccent />
        <MetricCard title="30-Day Retention" value="74%" icon={TrendingUp} color="blue" trend={1.2} borderAccent />
        <MetricCard title="Avg Orders / Customer" value="4.2/yr" icon={Target} color="purple" trend={0.3} subtitle="Rolling 12-month average" borderAccent />
      </div>

      {/* 2. Customer Health Score with "22% drive 78%" callout + CTA (4.3) */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-accent-green" />
          <h2 className="text-lg font-semibold text-text-primary">Customer Health Score</h2>
        </div>
        <p className="text-xs text-text-muted mb-5">Distribution across health bands</p>

        <div className="space-y-4">
          {/* Healthy */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-text-primary">Healthy</span>
              <span className="text-sm text-text-secondary">8,420 <span className="text-text-muted">(54%)</span></span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-border overflow-hidden">
              <div className="h-full rounded-full animate-bar-fill" style={{ width: '54%', background: 'var(--color-accent-green)' }} />
            </div>
          </div>
          {/* Watch */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-text-primary">Watch</span>
              <span className="text-sm text-text-secondary">3,890 <span className="text-text-muted">(25%)</span></span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-border overflow-hidden">
              <div className="h-full rounded-full animate-bar-fill" style={{ width: '25%', background: 'var(--color-accent-gold)' }} />
            </div>
          </div>
          {/* At Risk */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-text-primary">At Risk</span>
              <span className="text-sm text-text-secondary">3,260 <span className="text-text-muted">(21%)</span></span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-border overflow-hidden">
              <div className="h-full rounded-full animate-bar-fill" style={{ width: '21%', background: 'var(--color-accent-red)' }} />
            </div>
          </div>
        </div>

        {/* Revenue concentration insight with CTA (4.3) */}
        <div className="mt-5 rounded-lg px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 8%, transparent)' }}>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-accent-green">22%</span> of customers drive <span className="font-semibold text-accent-green">78%</span> of revenue
          </p>
          <button
            onClick={() => navigate('/agents/marketing', { state: { action: 'create-workflow', trigger: 'loyalty_tier', segment: 'champions', campaign: { name: 'Champions Retention Program', triggerType: 'LoyaltyTierSegment', description: 'Multi-touch VIP retention: birthday 3x points, early access notifications, quarterly VIP appreciation email, refer-a-friend bonus' } } })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Shield className="w-3.5 h-3.5" /> Protect your Champions
          </button>
        </div>
      </div>

      {/* 3. "What If" Retention Simulator (keep prominent) */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-accent-green" />
          <h2 className="text-lg font-semibold text-text-primary">&ldquo;What If&rdquo; Retention Simulator</h2>
        </div>
        <p className="text-xs text-text-muted mb-5">Model the impact of retention improvements</p>

        {/* Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">Retention Improvement</label>
            <span className="text-sm font-bold text-accent-green">{retentionImprovement}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={retentionImprovement}
            onChange={(e) => setRetentionImprovement(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-accent-green) ${((retentionImprovement - 1) / 19) * 100}%, var(--color-surface-border) ${((retentionImprovement - 1) / 19) * 100}%)`,
              accentColor: 'var(--color-accent-green)',
            }}
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>1%</span>
            <span>20%</span>
          </div>
        </div>

        {/* Projected numbers */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center p-3 rounded-lg border border-surface-divider">
            <p className="text-xs text-text-muted mb-1">Retained Customers</p>
            <p className="text-2xl font-bold text-accent-green">{Math.round(3260 * retentionImprovement / 100).toLocaleString()}</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-surface-divider">
            <p className="text-xs text-text-muted mb-1">Projected Revenue</p>
            <p className="text-2xl font-bold text-accent-green">${(Math.round(3260 * retentionImprovement / 100) * 2420 / 1000).toFixed(0)}K/yr</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-surface-divider">
            <p className="text-xs text-text-muted mb-1">ROI on Retention</p>
            <p className="text-2xl font-bold text-accent-green">{(Math.round(3260 * retentionImprovement / 100) * 2420 / (3260 * retentionImprovement / 100 * 50)).toFixed(1)}x</p>
          </div>
        </div>

        {/* Insight + Suggested Action */}
        <div className="rounded-lg px-4 py-3 mb-3" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 8%, transparent)' }}>
          <p className="text-sm text-text-secondary">Every <span className="font-semibold text-accent-green">1%</span> improvement in retention = ~<span className="font-semibold text-accent-green">$79K</span> annual revenue</p>
        </div>

        {/* Dynamic suggested action based on slider value */}
        <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-blue) 20%, transparent)', background: 'color-mix(in srgb, var(--color-accent-blue) 4%, transparent)' }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-semibold text-text-primary">Suggested Action to Achieve +{retentionImprovement}% Retention</span>
          </div>
          {retentionImprovement <= 5 ? (
            <div>
              <p className="text-[12px] text-text-secondary leading-relaxed">A <strong className="text-text-primary">win-back SMS campaign</strong> targeting your 1,247 at-risk customers could recover 3-5% retention. Estimated cost: ~$19/customer. Projected return: {(Math.round(3260 * retentionImprovement / 100) * 2420 / 1000).toFixed(0)}K/yr.</p>
              <button
                onClick={() => navigate('/agents/marketing', { state: { action: 'create-workflow', trigger: 'win_back', channels: ['email', 'sms', 'push'], campaign: { name: 'Retention Improvement Campaign', triggerType: 'WinBack', dormancyDays: 45, description: `Based on your What-If scenario: target ${Math.round(3260 * retentionImprovement / 100).toLocaleString()} slowing customers with a re-engagement series before they become at-risk. Waterfall: email then SMS then push.`, suggestedDiscount: '15% off next visit', loyaltyAction: 'Bonus points on return visit', retentionTarget: `+${retentionImprovement}%` } } })}
                className="flex items-center gap-1.5 mt-2 px-3.5 py-2 rounded-lg text-[11px] font-semibold bg-accent-blue text-white hover:brightness-110 transition-all"
              >
                <Megaphone className="w-3.5 h-3.5" /> Launch Win-Back Campaign
              </button>
            </div>
          ) : retentionImprovement <= 12 ? (
            <div>
              <p className="text-[12px] text-text-secondary leading-relaxed">A <strong className="text-text-primary">multi-touch loyalty program</strong> combining SMS win-backs, loyalty tier upgrades, and personalized offers could achieve 6-12% improvement. Requires coordinated campaigns across segments.</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => navigate('/agents/marketing', { state: { action: 'create-workflow', trigger: 'win_back', channels: ['email', 'sms', 'push'], campaign: { name: 'Multi-Touch Retention Program', triggerType: 'WinBack', dormancyDays: 45, description: `Multi-segment retention program targeting +${retentionImprovement}% improvement: win-back at-risk customers (1,247) with waterfall email/SMS/push, upgrade loyal to VIP with loyalty tier incentives, re-engage slowing customers with visit-based rewards.`, suggestedDiscount: '15% off + 2x loyalty points', loyaltyAction: 'Tier upgrade incentive + visit milestone rewards', retentionTarget: `+${retentionImprovement}%` } } })}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold bg-accent-blue text-white hover:brightness-110 transition-all"
                >
                  <Megaphone className="w-3.5 h-3.5" /> Build Retention Program
                </button>
                <button
                  onClick={() => navigate('/agents/bridge', { state: { question: `How can I improve customer retention by ${retentionImprovement}%? I have 1,247 at-risk customers and want to retain ${Math.round(3260 * retentionImprovement / 100).toLocaleString()} more.` } })}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 10%, transparent)', color: 'var(--color-accent-gold)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 20%, transparent)' }}
                >
                  <NexusIcon size={14} /> Ask Dex for Strategy
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[12px] text-text-secondary leading-relaxed">A <strong className="text-text-primary">{retentionImprovement}% improvement</strong> requires a full customer experience overhaul: loyalty program redesign, store experience upgrades, product assortment optimization, and aggressive win-back automation. This is a quarterly initiative, not a single campaign.</p>
              <button
                onClick={() => navigate('/agents/bridge', { state: { question: `I want to improve customer retention by ${retentionImprovement}%. That would retain ${Math.round(3260 * retentionImprovement / 100).toLocaleString()} more customers and add $${(Math.round(3260 * retentionImprovement / 100) * 2420 / 1000).toFixed(0)}K/yr in revenue. Help me build a quarterly retention strategy.` } })}
                className="flex items-center gap-1.5 mt-2 px-3.5 py-2 rounded-lg text-[11px] font-semibold bg-accent-gold text-white hover:brightness-110 transition-all"
              >
                <NexusIcon size={14} /> Plan Quarterly Retention Strategy with Dex
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Customer Journey Funnel — simplified to 4 stages (4.2) */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6 stagger-grid" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-5 h-5 text-accent-blue" />
          <h2 className="text-lg font-semibold text-text-primary">Customer Journey Funnel</h2>
        </div>
        <p className="text-xs text-text-muted mb-5">Customer lifecycle stages with recommended actions</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { stage: 'New', desc: 'First purchase', count: 2680, pct: 17.2, color: 'var(--color-accent-gold)', action: 'Send welcome offer', actionState: { segment: 'new', action: 'welcome-offer' } },
            { stage: 'Returning', desc: '2\u20133 purchases', count: 4120, pct: 26.4, color: 'var(--color-accent-blue)', action: 'Repeat incentive', actionState: { segment: 'returning', action: 'repeat-incentive' } },
            { stage: 'Loyal', desc: '4+ purchases or monthly', count: 6960, pct: 44.6, color: 'var(--color-accent-green)', action: 'Loyalty reward', actionState: { segment: 'loyal', action: 'loyalty-reward' } },
            { stage: 'At Risk', desc: 'No purchase 60+ days', count: 1840, pct: 11.8, color: 'var(--color-accent-red)', action: 'Win-back campaign', actionState: { segment: 'at-risk', action: 'winback' } },
          ].map((s) => (
            <div key={s.stage} className="rounded-xl border border-surface-divider p-4 flex flex-col items-center text-center" style={{ borderTopWidth: '3px', borderTopColor: s.color }}>
              <span className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: s.color }}>{s.stage}</span>
              <p className="text-2xl font-bold text-text-primary">{s.count.toLocaleString()}</p>
              <p className="text-xs text-text-muted mb-1">{s.pct}% of customers</p>
              <p className="text-[11px] text-text-secondary mb-3">{s.desc}</p>
              <button
                onClick={() => setExpandedFunnelStage(expandedFunnelStage === s.stage ? null : s.stage)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors mt-auto"
                style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)`, color: s.color }}
              >
                <Zap className="w-3 h-3" /> {s.action}
                <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${expandedFunnelStage === s.stage ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Campaign Execution Panel — expands below the funnel grid */}
        {expandedFunnelStage && (
          <CampaignExecutionPanel
            stage={expandedFunnelStage}
            stageData={
              { 'New': { count: 2680 }, 'Returning': { count: 4120 }, 'Loyal': { count: 6960 }, 'At Risk': { count: 1840 } }[expandedFunnelStage]
            }
            onLaunch={(stage) => {
              const stateMap = {
                'New': {
                  action: 'create-workflow', trigger: 'new_customer_welcome', channels: ['email', 'sms'],
                  campaign: { name: 'Welcome Series', type: 'automated', triggerType: 'NewCustomer',
                    description: 'Automated 3-touch welcome series: Day 1 welcome email, Day 3 SMS with loyalty enrollment CTA, Day 7 email with product recommendations based on first purchase',
                    suggestedDiscount: '10% off second purchase', loyaltyAction: 'Auto-enroll in loyalty program' }
                },
                'Returning': {
                  action: 'create-workflow', trigger: 'visit_milestone', channels: ['sms', 'push'],
                  campaign: { name: 'Loyalty Enrollment Push', type: 'automated', triggerType: 'VisitMilestone', visitCount: 3,
                    description: 'Trigger on 3rd visit: SMS with loyalty tier benefits + push notification for mobile app install with exclusive offer',
                    suggestedDiscount: '2x loyalty points on 3rd visit', loyaltyAction: 'Highlight tier progression' }
                },
                'Loyal': {
                  action: 'create-workflow', trigger: 'loyalty_tier', channels: ['email', 'push'],
                  campaign: { name: 'VIP Exclusive Access', type: 'automated', triggerType: 'LoyaltyTierSegment', tier: 'Gold',
                    description: 'Ongoing VIP nurture: early access to new drops, birthday reward boost (3x points), exclusive product previews via push, quarterly VIP email with spending insights',
                    suggestedDiscount: 'Early access + birthday 3x points', loyaltyAction: 'Tier retention program' }
                },
                'At Risk': {
                  action: 'create-workflow', trigger: 'win_back', channels: ['email', 'sms', 'push'],
                  campaign: { name: 'Win-Back Campaign', type: 'automated', triggerType: 'WinBack', dormancyDays: 45,
                    description: 'Waterfall win-back: Day 1 email with personalized "we miss you" + 15% off. Day 3 SMS if no open. Day 7 push with expiring offer. Based on last purchased categories.',
                    suggestedDiscount: '15% off next visit (expiring in 14 days)', loyaltyAction: 'Bonus points on return visit' }
                },
              };
              navigate('/agents/marketing', { state: stateMap[stage] });
            }}
          />
        )}

        {/* Funnel insight */}
        <div className="mt-5 rounded-lg px-4 py-3" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 8%, transparent)' }}>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold" style={{ color: 'var(--color-accent-blue)' }}>Biggest opportunity:</span> Moving 10% of At Risk customers to Returning = <span className="font-semibold" style={{ color: 'var(--color-accent-blue)' }}>+184 retained customers</span> and ~$445K annual revenue.
          </p>
        </div>
      </div>

      {/* 5. Customer Segments with actions (4.4) */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Customer Segments</h2>
        <p className="text-xs text-text-muted mb-4">RFM segmentation &mdash; Recency, Frequency, Monetary</p>

        <div className="space-y-2">
          {filteredSegments.map((seg) => {
            const Icon = seg.icon;
            const isExpanded = expandedSegment === seg.name;
            const segAction = SEGMENT_ACTIONS[seg.name];
            return (
              <div key={seg.name}>
                <button
                  onClick={() => setExpandedSegment(isExpanded ? null : seg.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${seg.color} 12%, transparent)` }}>
                    <Icon className="w-4 h-4" style={{ color: seg.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{seg.name}</span>
                      <span className="text-xs text-text-muted">{seg.description}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-text-secondary">{seg.size.toLocaleString()} customers ({seg.pct}%)</span>
                      <span className="text-xs text-text-secondary">Avg LTV: ${seg.avgLTV.toLocaleString()}</span>
                      {/* Enhancement 2c: Segment benchmark badge */}
                      {(() => {
                        const benchStatus = getSegmentBenchmarkStatus(seg.name, seg.pct);
                        const bench = INDUSTRY_BENCHMARKS.segments[seg.name];
                        if (!benchStatus || !bench) return null;
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: `color-mix(in srgb, ${benchStatus.color} 12%, transparent)`, color: benchStatus.color }}
                            title={`Industry avg: ${bench.industryAvgRange[0]}-${bench.industryAvgRange[1]}%`}
                          >
                            {benchStatus.label} <span className="font-normal opacity-75">(ind. {bench.industryAvgRange[0]}-{bench.industryAvgRange[1]}%)</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 4.4: Action pill — always visible */}
                    {segAction && (
                      <span
                        onClick={(e) => { e.stopPropagation(); navigate('/agents/marketing', { state: segAction.state }); }}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors"
                        style={{ background: `color-mix(in srgb, ${segAction.color} 12%, transparent)`, color: segAction.color }}
                      >
                        <Megaphone className="w-3 h-3" /> {segAction.label}
                      </span>
                    )}
                    {/* Segment bar */}
                    <div className="w-24 h-2 rounded-full bg-surface-border overflow-hidden hidden md:block">
                      <div className="h-full rounded-full animate-bar-fill" style={{ width: `${seg.pct}%`, background: seg.color }} />
                    </div>
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${seg.trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {seg.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {seg.trend >= 0 ? '+' : ''}{seg.trend}%
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="ml-11 mr-4 mb-2 px-4 py-3 rounded-lg bg-surface-bg border border-surface-border text-sm animate-fade-in">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-text-muted text-xs">Avg Visits/Month</p>
                        <p className="text-text-primary font-semibold">{seg.name === 'Champions' ? '4.2' : seg.name === 'Loyal' ? '2.8' : seg.name === 'At Risk' ? '1.1' : seg.name === 'New' ? '1.8' : '0.2'}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Avg Basket</p>
                        <p className="text-text-primary font-semibold">{seg.name === 'Champions' ? '$89' : seg.name === 'Loyal' ? '$72' : seg.name === 'At Risk' ? '$64' : seg.name === 'New' ? '$58' : '$45'}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Migration Trend</p>
                        <p className={`font-semibold ${seg.trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {seg.trend >= 0 ? 'Growing' : 'Shrinking'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-divider">
                      {segAction && (
                        <button onClick={() => navigate('/agents/marketing', { state: segAction.state })} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium ${segAction.bgClass} transition-colors`}>
                          <Megaphone className="w-3 h-3" /> {segAction.label}
                        </button>
                      )}
                      <button onClick={() => navigate('/agents/bridge', { state: { question: `Tell me about the ${seg.name} customer segment` } })} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 transition-colors">
                        <MessageCircle className="w-3 h-3" /> Ask Dex
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Cross-Store Customer Overlap — only when showCrossStore and multi-store */}
      {showCrossStore && multiStoreSelected && (
        <CrossStoreOverlap selectedStores={selectedStores} />
      )}

      {/* 7. Store-Level Segment Comparison Grid — only when more than 1 store selected */}
      {multiStoreSelected && (
        <StoreSegmentGrid storeSegments={ALL_STORE_SEGMENTS} selectedStores={selectedStores} />
      )}

      {/* 8. Cohort Retention (moved up — foundational analytics) */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Cohort Retention</h2>
        <p className="text-xs text-text-muted mb-4">Monthly cohort retention rates &mdash; percentage of customers returning</p>

        {/* Retention Benchmarking */}
        <div className="mb-4 rounded-lg border border-surface-divider overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 4%, transparent)' }}>
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-divider/50">
            <span className="text-xs text-text-secondary">Market avg M1 retention: <span className="font-semibold text-text-primary">68%</span></span>
            <span className="text-text-muted">&middot;</span>
            <span className="text-xs text-text-secondary">Yours: <span className="font-semibold text-accent-green">74%</span></span>
            <span className="text-text-muted">&middot;</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-green">
              <ArrowUpRight className="w-3 h-3" /> Above market
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Industry Context &mdash; Cannabis Dispensary</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">30-Day Retention</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-surface-border overflow-hidden relative">
                    <div className="h-full rounded-full" style={{ width: `${INDUSTRY_BENCHMARKS.retention['30-day'].yours}%`, background: 'var(--color-accent-green)' }} />
                    <div className="absolute top-0 h-full w-0.5" style={{ left: `${INDUSTRY_BENCHMARKS.retention['30-day'].industryAvg}%`, background: 'var(--color-text-muted)', opacity: 0.5 }} />
                    <div className="absolute top-0 h-full w-0.5" style={{ left: `${INDUSTRY_BENCHMARKS.retention['30-day'].topQuartile}%`, background: 'var(--color-accent-gold)', opacity: 0.6 }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-text-muted">Ind. avg: {INDUSTRY_BENCHMARKS.retention['30-day'].industryAvg}%</span>
                  <span className="text-text-muted">Top Q: {INDUSTRY_BENCHMARKS.retention['30-day'].topQuartile}%</span>
                  <span className="font-semibold text-accent-green">Yours: {INDUSTRY_BENCHMARKS.retention['30-day'].yours}%</span>
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)' }}>
                    Above Market
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">90-Day Retention</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-surface-border overflow-hidden relative">
                    <div className="h-full rounded-full" style={{ width: `${INDUSTRY_BENCHMARKS.retention['90-day'].yours}%`, background: 'var(--color-accent-green)' }} />
                    <div className="absolute top-0 h-full w-0.5" style={{ left: `${INDUSTRY_BENCHMARKS.retention['90-day'].industryAvg}%`, background: 'var(--color-text-muted)', opacity: 0.5 }} />
                    <div className="absolute top-0 h-full w-0.5" style={{ left: `${INDUSTRY_BENCHMARKS.retention['90-day'].topQuartile}%`, background: 'var(--color-accent-gold)', opacity: 0.6 }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-text-muted">Ind. avg: {INDUSTRY_BENCHMARKS.retention['90-day'].industryAvg}%</span>
                  <span className="text-text-muted">Top Q: {INDUSTRY_BENCHMARKS.retention['90-day'].topQuartile}%</span>
                  <span className="font-semibold text-accent-green">Yours: {INDUSTRY_BENCHMARKS.retention['90-day'].yours}%</span>
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)' }}>
                    Above Market
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CohortHeatmap />
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-surface-divider">
          <div>
            <p className="text-xs text-text-muted">30-Day Retention</p>
            <p className="text-lg font-bold text-text-primary">74%</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">60-Day Retention</p>
            <p className="text-lg font-bold text-text-primary">60%</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">90-Day Retention</p>
            <p className="text-lg font-bold text-text-primary">51%</p>
          </div>
        </div>

        {/* Drop-off action text */}
        <div className="mt-4 rounded-lg px-4 py-3" style={{ background: 'color-mix(in srgb, var(--color-accent-red) 8%, transparent)' }}>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-accent-red">Your biggest drop-off is Month 2.</span> Consider a 60-day re-engagement campaign.
          </p>
        </div>
      </div>

      {/* 9. LTV Distribution + LTV Trend (moved up — foundational analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LTV Distribution */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-1 mb-1">
            <h2 className="text-lg font-semibold text-text-primary">LTV Distribution (12-mo)</h2>
            <LTVMethodologyPanel isOpen={showLtvMethodology} onToggle={() => setShowLtvMethodology(!showLtvMethodology)} />
          </div>
          <p className="text-xs text-text-muted mb-4">Customer lifetime value breakdown</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={LTV_DISTRIBUTION} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-divider)" vertical={false} />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Customers" radius={[4, 4, 0, 0]}>
                {LTV_DISTRIBUTION.map((entry, i) => (
                  <Cell key={i} fill={i < 3 ? 'var(--color-accent-blue)' : i < 5 ? 'var(--color-accent-green)' : 'var(--color-accent-purple)'} fillOpacity={0.7 + i * 0.05} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* LTV Trend */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-lg font-semibold text-text-primary mb-1">Avg LTV Trend</h2>
          <p className="text-xs text-text-muted mb-4">Monthly average lifetime value</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={LTV_TREND} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ltvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-green)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-accent-green)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-divider)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis domain={['dataMin - 100', 'dataMax + 100']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<ChartTooltip />} formatter={(v) => [`$${v.toLocaleString()}`, 'Avg LTV']} />
              <Area type="monotone" dataKey="avg" name="Avg LTV" stroke="var(--color-accent-green)" strokeWidth={2.5} fill="url(#ltvGrad)" dot={{ r: 3, fill: 'var(--color-accent-green)', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 10. Advanced Analytics — collapsible section (Churn Risk + Purchase Frequency) */}
      <div className="mt-6">
        <button onClick={() => setShowDeepAnalytics(!showDeepAnalytics)} className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4">
          <ChevronDown className={`w-4 h-4 transition-transform ${showDeepAnalytics ? 'rotate-180' : ''}`} />
          Advanced Analytics
        </button>
        {showDeepAnalytics && (
          <div className="space-y-6 animate-fade-in">

            {/* Churn Risk Analysis */}
            <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-accent-red" />
                <h2 className="text-lg font-semibold text-text-primary">Churn Risk Analysis</h2>
              </div>
              <p className="text-xs text-text-muted mb-4">Customers at risk of churning based on behavioral signals</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {CHURN_RISK_TIERS.map((tier) => (
                  <div
                    key={tier.label}
                    className="rounded-lg border border-surface-divider p-4"
                    style={{ borderLeftWidth: '3px', borderLeftColor: tier.color }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tier.color }}>{tier.label}</p>
                    <p className="text-xl font-bold text-text-primary mt-1">{tier.customers.toLocaleString()}</p>
                    <p className="text-xs text-text-secondary">customers</p>
                    <p className="text-sm font-medium text-text-secondary mt-2">{tier.gmv} GMV at risk</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-divider">
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider py-3 pr-4">Customer ID</th>
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider py-3 px-4">Last Visit</th>
                      <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider py-3 px-4">LTV</th>
                      <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider py-3 px-4">Risk Score</th>
                      <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider py-3 pl-4">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHURN_AT_RISK_CUSTOMERS.map((cust) => {
                      const scoreColor = cust.riskScore >= 90
                        ? 'var(--color-accent-red)'
                        : cust.riskScore >= 80
                          ? 'var(--color-accent-gold)'
                          : 'var(--color-accent-blue)';
                      const pillBg = cust.riskScore >= 90
                        ? 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)'
                        : cust.riskScore >= 80
                          ? 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)'
                          : 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)';
                      return (
                        <tr key={cust.id} className="border-b border-surface-divider/50 hover:bg-surface-hover transition-colors">
                          <td className="py-3 pr-4 font-medium text-text-primary">{cust.id}</td>
                          <td className="py-3 px-4 text-text-secondary">{cust.lastVisit}</td>
                          <td className="text-right py-3 px-4 text-text-primary font-medium">{cust.ltv}</td>
                          <td className="text-right py-3 px-4">
                            <span className="font-semibold" style={{ color: scoreColor }}>{cust.riskScore}%</span>
                          </td>
                          <td className="py-3 pl-4">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: pillBg, color: scoreColor }}
                            >
                              {cust.action}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purchase Frequency Distribution */}
            <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-accent-green" />
                <h2 className="text-lg font-semibold text-text-primary">Purchase Frequency Distribution</h2>
              </div>
              <p className="text-xs text-text-muted mb-4">Customer visit frequency per month</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={PURCHASE_FREQUENCY_DATA} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-divider)" vertical={false} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} label={{ value: 'Visits/Month', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="customers" name="Customers" radius={[4, 4, 0, 0]}>
                    {PURCHASE_FREQUENCY_DATA.map((entry, i) => (
                      <Cell key={i} fill={i === 0 ? 'var(--color-accent-red)' : 'var(--color-accent-green)'} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t border-surface-divider">
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-accent-red) 8%, transparent)' }}>
                  <AlertTriangle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">4,200 customers</span> visit less than once per month &mdash; #1 growth lever for frequency programs
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
    </PageSkeleton>
  );
}
