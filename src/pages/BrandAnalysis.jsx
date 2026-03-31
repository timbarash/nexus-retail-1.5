import React, { useState, useMemo } from 'react';
import {
  Tag,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import MetricCard from '../components/common/MetricCard';

// ---------------------------------------------------------------------------
// Seeded RNG (same algo as NexusHome / InventoryAnalytics)
// ---------------------------------------------------------------------------
function _seedRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Brand catalog
// ---------------------------------------------------------------------------
const BRANDS = [
  'Cookies',
  'Jeeter',
  'Raw Garden',
  'Stiiizy',
  'WYLD',
  'Select',
  'Cresco',
  'Rythm',
  'Good News',
  'Kiva',
];

const BRAND_COLORS = {
  Cookies: 'var(--color-accent-purple)',
  Jeeter: 'var(--color-accent-green)',
  'Raw Garden': 'var(--color-accent-gold)',
  Stiiizy: 'var(--color-accent-blue)',
  WYLD: '#E87068',
  Select: '#64A8E0',
  Cresco: '#B598E8',
  Rythm: '#6ABA48',
  'Good News': '#F59E0B',
  Kiva: '#00C27C',
};

const BRAND_HEX = {
  Cookies: '#B598E8',
  Jeeter: '#00C27C',
  'Raw Garden': '#D4A03A',
  Stiiizy: '#64A8E0',
  WYLD: '#E87068',
};

const CATEGORIES = ['Flower', 'Edibles', 'Concentrates', 'Pre-Rolls', 'Vapes'];

// ---------------------------------------------------------------------------
// Generate deterministic brand performance data
// ---------------------------------------------------------------------------
const BRAND_DATA = BRANDS.map((brand, i) => {
  const rng = _seedRng(i * 6173 + 421);
  const sellThrough = Math.round((55 + rng() * 35) * 10) / 10;
  const revenue = Math.round(120000 + rng() * 380000);
  const margin = Math.round((18 + rng() * 22) * 10) / 10;
  const daysOnShelf = Math.round(8 + rng() * 30);
  const trendUp = rng() > 0.4;
  const trendDelta = Math.round((rng() * 12 + 1) * 10) / 10;
  return {
    brand,
    sellThrough,
    revenue,
    margin,
    daysOnShelf,
    trendUp,
    trendDelta,
  };
});

// Top 5 brands by revenue for the area chart
const TOP5_BRANDS = [...BRAND_DATA]
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 5)
  .map((b) => b.brand);

// Monthly revenue over 6 months for top 5 brands
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const REVENUE_OVER_TIME = MONTHS.map((month, mi) => {
  const point = { month };
  TOP5_BRANDS.forEach((brand, bi) => {
    const rng = _seedRng(bi * 3571 + mi * 997 + 53);
    const base = BRAND_DATA.find((b) => b.brand === brand).revenue / 6;
    const variation = base * 0.15;
    point[brand] = Math.round(base + (rng() - 0.4) * variation * 2 + mi * (base * 0.03));
  });
  return point;
});

// Sell-through by category
const CATEGORY_DATA = CATEGORIES.map((category, ci) => {
  const rng = _seedRng(ci * 2311 + 77);
  return {
    category,
    sellThrough: Math.round((50 + rng() * 40) * 10) / 10,
  };
}).sort((a, b) => b.sellThrough - a.sellThrough);

const CATEGORY_COLORS = {
  Flower: 'var(--color-accent-green)',
  Edibles: 'var(--color-accent-gold)',
  Concentrates: 'var(--color-accent-purple)',
  'Pre-Rolls': 'var(--color-accent-blue)',
  Vapes: '#E87068',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDollar(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${Math.round(v).toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-5 h-5 text-accent-green" />}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface-card rounded-lg shadow-lg border border-surface-border p-3 text-sm">
      <p className="font-semibold text-text-primary mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-text-secondary">{p.name}</span>
            </span>
            <span className="font-medium" style={{ color: p.color }}>
              {typeof p.value === 'number' ? fmtDollar(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-surface-card rounded-lg shadow-lg border border-surface-border p-3 text-sm">
      <p className="font-semibold text-text-primary mb-1">{d.category}</p>
      <p className="text-text-secondary">
        Sell-Through: <span className="text-text-primary font-medium">{d.sellThrough}%</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function BrandAnalysis() {
  const [sortCol, setSortCol] = useState('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  const sortedBrands = useMemo(() => {
    const data = [...BRAND_DATA];
    data.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case 'brand':
          av = a.brand.toLowerCase();
          bv = b.brand.toLowerCase();
          return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
        case 'sellThrough':
          av = a.sellThrough;
          bv = b.sellThrough;
          break;
        case 'revenue':
          av = a.revenue;
          bv = b.revenue;
          break;
        case 'margin':
          av = a.margin;
          bv = b.margin;
          break;
        case 'daysOnShelf':
          av = a.daysOnShelf;
          bv = b.daysOnShelf;
          break;
        default:
          av = a.revenue;
          bv = b.revenue;
      }
      if (typeof av === 'number') {
        return sortAsc ? av - bv : bv - av;
      }
      return 0;
    });
    return data;
  }, [sortCol, sortAsc]);

  // Summary metrics
  const activeBrandCount = BRAND_DATA.length;
  const avgSellThrough =
    Math.round(
      (BRAND_DATA.reduce((sum, b) => sum + b.sellThrough, 0) / BRAND_DATA.length) * 10
    ) / 10;
  const totalRevenue = BRAND_DATA.reduce((sum, b) => sum + b.revenue, 0);
  const topByMargin = [...BRAND_DATA].sort((a, b) => b.margin - a.margin)[0];

  function SortIcon({ col }) {
    if (sortCol !== col) return <ChevronDown className="w-3 h-3 text-text-muted opacity-40" />;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 text-accent-green" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent-green" />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Tag size={22} className="text-accent-green" />
          Brand Performance
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Vendor and brand evaluation across sell-through, revenue, and margin contribution
        </p>
      </div>

      {/* Section 1: Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Brands"
          value={activeBrandCount}
          icon={Tag}
          color="dutchie"
          trend={3.2}
          trendLabel="vs last period"
          borderAccent
          sparkline={[7, 8, 8, 9, 9, 10]}
        />
        <MetricCard
          title="Avg Sell-Through Rate"
          value={`${avgSellThrough}%`}
          icon={TrendingUp}
          color="blue"
          trend={2.4}
          trendLabel="vs last period"
          borderAccent
          benchmark="65.0%"
          benchmarkLabel="Industry Avg"
        />
        <MetricCard
          title="Total Brand Revenue"
          value={fmtDollar(totalRevenue)}
          icon={DollarSign}
          color="dutchie"
          trend={5.8}
          trendLabel="vs last month"
          borderAccent
          sparkline={[180, 195, 210, 205, 220, 240]}
        />
        <MetricCard
          title="Top Brand by Margin"
          value={topByMargin.brand}
          subtitle={`${topByMargin.margin}% margin contribution`}
          icon={BarChart3}
          color="purple"
          borderAccent
        />
      </div>

      {/* Section 2: Brand Ranking Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <SectionHeader
            title="Brand Rankings"
            subtitle="Click column headers to sort"
            icon={BarChart3}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b border-surface-border bg-surface-muted">
                {[
                  { key: 'brand', label: 'Brand' },
                  { key: 'sellThrough', label: 'Sell-Through' },
                  { key: 'revenue', label: 'Revenue' },
                  { key: 'margin', label: 'Margin' },
                  { key: 'daysOnShelf', label: 'Days on Shelf' },
                  { key: null, label: 'Trend' },
                ].map(({ key, label }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider ${
                      key ? 'cursor-pointer select-none hover:text-text-primary transition-colors' : ''
                    }`}
                    onClick={key ? () => handleSort(key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {key && <SortIcon col={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedBrands.map((b, i) => (
                <tr
                  key={b.brand}
                  className="border-b border-surface-border/40 hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            BRAND_HEX[b.brand] || BRAND_COLORS[b.brand] || '#6b7280',
                        }}
                      />
                      <span className="font-medium text-text-primary">{b.brand}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${b.sellThrough}%`,
                            backgroundColor: b.sellThrough >= 75
                              ? 'var(--color-accent-green)'
                              : b.sellThrough >= 60
                              ? 'var(--color-accent-gold)'
                              : 'var(--color-accent-red)',
                          }}
                        />
                      </div>
                      <span className="text-text-primary font-medium">{b.sellThrough}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-primary font-medium">
                    {fmtDollar(b.revenue)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-medium ${
                        b.margin >= 30
                          ? 'text-accent-green'
                          : b.margin >= 22
                          ? 'text-accent-gold'
                          : 'text-accent-red'
                      }`}
                    >
                      {b.margin}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-medium ${
                        b.daysOnShelf <= 14
                          ? 'text-accent-green'
                          : b.daysOnShelf <= 25
                          ? 'text-text-primary'
                          : 'text-accent-red'
                      }`}
                    >
                      {b.daysOnShelf}d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                        b.trendUp
                          ? 'text-accent-green bg-surface-muted'
                          : 'text-accent-red bg-surface-muted'
                      }`}
                    >
                      {b.trendUp ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {b.trendUp ? '+' : '-'}
                      {b.trendDelta}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Revenue by Brand (Area Chart) */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-5">
        <SectionHeader
          title="Revenue by Brand"
          subtitle="Top 5 brands — monthly revenue trend"
          icon={TrendingUp}
        />
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={REVENUE_OVER_TIME}
            margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
          >
            <defs>
              {TOP5_BRANDS.map((brand) => (
                <linearGradient key={brand} id={`grad-${brand.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_HEX[brand] || '#6b7280'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BRAND_HEX[brand] || '#6b7280'} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              tickFormatter={(v) => fmtDollar(v)}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-text-secondary">{value}</span>
              )}
            />
            {TOP5_BRANDS.map((brand) => (
              <Area
                key={brand}
                type="monotone"
                dataKey={brand}
                stroke={BRAND_HEX[brand] || '#6b7280'}
                strokeWidth={2}
                fill={`url(#grad-${brand.replace(/\s/g, '')})`}
                name={brand}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Section 4: Sell-Through by Category (Horizontal Bar) */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-5">
        <SectionHeader
          title="Sell-Through by Category"
          subtitle="Average sell-through rate across product categories"
          icon={Clock}
        />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={CATEGORY_DATA}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" horizontal={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: 'var(--color-text-primary)', fontWeight: 500 }}
              width={100}
            />
            <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="sellThrough" radius={[0, 6, 6, 0]} barSize={28} name="Sell-Through %">
              {CATEGORY_DATA.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_COLORS[entry.category] || 'var(--color-accent-green)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
