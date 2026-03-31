import { useState, useMemo } from 'react';
import { Users, TrendingUp, DollarSign, Target, ArrowUpRight, ArrowDownRight, ChevronDown, UserCheck, UserX, UserMinus, Heart } from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useStores } from '../contexts/StoreContext';
import { useDateRange } from '../contexts/DateRangeContext';

// Deterministic mock data
const SEGMENTS = [
  { name: 'Champions', size: 2840, pct: 18.2, avgLTV: 4200, icon: Heart, color: 'var(--color-accent-green)', trend: 3.2, description: 'High frequency, high spend' },
  { name: 'Loyal', size: 4120, pct: 26.4, avgLTV: 2800, icon: UserCheck, color: 'var(--color-accent-blue)', trend: 1.8, description: 'Regular purchasers, consistent' },
  { name: 'At Risk', size: 3260, pct: 20.9, avgLTV: 1900, icon: UserMinus, color: 'var(--color-accent-gold)', trend: -2.1, description: 'Declining visit frequency' },
  { name: 'New', size: 2680, pct: 17.2, avgLTV: 680, icon: Users, color: 'var(--color-accent-purple)', trend: 5.4, description: 'First purchase <60 days ago' },
  { name: 'Lost', size: 2700, pct: 17.3, avgLTV: 1200, icon: UserX, color: 'var(--color-accent-red)', trend: -1.5, description: 'No purchase in 90+ days' },
];

const COHORT_DATA = [
  { month: 'Oct', m0: 100, m1: 72, m2: 58, m3: 48, m4: 42, m5: 38 },
  { month: 'Nov', m0: 100, m1: 75, m2: 61, m3: 51, m4: 44, m5: null },
  { month: 'Dec', m0: 100, m1: 78, m2: 65, m3: 54, m4: null, m5: null },
  { month: 'Jan', m0: 100, m1: 71, m2: 56, m3: null, m4: null, m5: null },
  { month: 'Feb', m0: 100, m1: 74, m2: null, m3: null, m4: null, m5: null },
  { month: 'Mar', m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null },
];

const ACQUISITION_CHANNELS = [
  { name: 'Walk-in', customers: 5840, pct: 37.4, cpa: 0, revenue: 892000 },
  { name: 'Online Order', customers: 4200, pct: 26.9, cpa: 12, revenue: 714000 },
  { name: 'Referral', customers: 2680, pct: 17.2, cpa: 28, revenue: 456000 },
  { name: 'Campaign', customers: 1640, pct: 10.5, cpa: 42, revenue: 246000 },
  { name: 'Social', customers: 1240, pct: 8.0, cpa: 35, revenue: 186000 },
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-text-muted font-medium py-2 pr-4">Cohort</th>
            {months.map(m => (
              <th key={m} className="text-center text-text-muted font-medium py-2 px-3">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COHORT_DATA.map((row) => (
            <tr key={row.month}>
              <td className="text-text-secondary font-medium py-1.5 pr-4">{row.month}</td>
              {['m0', 'm1', 'm2', 'm3', 'm4', 'm5'].map((key, i) => {
                const val = row[key];
                return (
                  <td key={key} className="text-center py-1.5 px-3">
                    {val !== null ? (
                      <span
                        className="inline-flex items-center justify-center w-12 h-8 rounded text-xs font-semibold"
                        style={{ background: getColor(val), opacity: getOpacity(val), color: val >= 50 ? 'white' : 'var(--color-text-primary)' }}
                      >
                        {val}%
                      </span>
                    ) : (
                      <span className="text-text-muted/30">—</span>
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

export default function CustomerIntelligence() {
  const { selectionLabel } = useStores();
  const { rangeLabel } = useDateRange();
  const [expandedSegment, setExpandedSegment] = useState(null);

  const totalCustomers = SEGMENTS.reduce((s, seg) => s + seg.size, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Customer Intelligence</h1>
        <p className="text-sm text-text-secondary mt-1">{selectionLabel} &middot; {rangeLabel}</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-grid">
        <MetricCard title="Total Customers" value={totalCustomers.toLocaleString()} icon={Users} color="dutchie" trend={4.2} sparkline={[14200, 14500, 14800, 15100, 15400, 15600]} borderAccent />
        <MetricCard title="Avg Lifetime Value" value="$2,420" icon={DollarSign} color="amber" trend={3.8} sparkline={LTV_TREND.map(d => d.avg)} borderAccent />
        <MetricCard title="30-Day Retention" value="74%" icon={TrendingUp} color="blue" trend={1.2} borderAccent />
        <MetricCard title="Acquisition Rate" value="1,640/mo" icon={Target} color="purple" trend={5.4} subtitle="New customers this period" borderAccent />
      </div>

      {/* Customer Segments (RFM) */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Customer Segments</h2>
        <p className="text-xs text-text-muted mb-4">RFM segmentation — Recency, Frequency, Monetary</p>

        <div className="space-y-2">
          {SEGMENTS.map((seg) => {
            const Icon = seg.icon;
            const isExpanded = expandedSegment === seg.name;
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
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Segment bar */}
                    <div className="w-24 h-2 rounded-full bg-surface-hover overflow-hidden hidden md:block">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LTV Distribution */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-lg font-semibold text-text-primary mb-1">LTV Distribution</h2>
          <p className="text-xs text-text-muted mb-4">Customer lifetime value breakdown</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={LTV_DISTRIBUTION} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis domain={['dataMin - 100', 'dataMax + 100']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<ChartTooltip />} formatter={(v) => [`$${v.toLocaleString()}`, 'Avg LTV']} />
              <Area type="monotone" dataKey="avg" name="Avg LTV" stroke="var(--color-accent-green)" strokeWidth={2.5} fill="url(#ltvGrad)" dot={{ r: 3, fill: 'var(--color-accent-green)', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cohort Retention */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Cohort Retention</h2>
        <p className="text-xs text-text-muted mb-4">Monthly cohort retention rates — percentage of customers returning</p>
        <CohortHeatmap />
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-surface-border">
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
      </div>

      {/* Acquisition Channels */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Acquisition Channels</h2>
        <p className="text-xs text-text-muted mb-4">Customer acquisition by channel with cost per acquisition</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left text-text-muted font-medium py-3 pr-4">Channel</th>
                <th className="text-right text-text-muted font-medium py-3 px-4">Customers</th>
                <th className="text-right text-text-muted font-medium py-3 px-4">Share</th>
                <th className="text-right text-text-muted font-medium py-3 px-4">CPA</th>
                <th className="text-right text-text-muted font-medium py-3 pl-4">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {ACQUISITION_CHANNELS.map((ch) => (
                <tr key={ch.name} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                  <td className="py-3 pr-4">
                    <span className="text-text-primary font-medium">{ch.name}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-text-secondary">{ch.customers.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                        <div className="h-full rounded-full bg-accent-green" style={{ width: `${ch.pct}%` }} />
                      </div>
                      <span className="text-text-secondary text-xs w-10 text-right">{ch.pct}%</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-text-secondary">{ch.cpa === 0 ? 'Organic' : `$${ch.cpa}`}</td>
                  <td className="text-right py-3 pl-4 text-text-primary font-medium">${(ch.revenue / 1000).toFixed(0)}K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
