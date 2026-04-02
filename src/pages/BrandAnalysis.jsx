import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Megaphone,
  CircleDollarSign,
  Users,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Store,
  ShieldCheck,
  FileText,
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
import { PageSkeleton } from '../components/common/PageSkeleton';
import { locations } from '../data/mockData';
import { useStores } from '../contexts/StoreContext';

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
// Brand x Segment Affinity Data
// ---------------------------------------------------------------------------
const BRAND_SEGMENT_AFFINITY = [
  { brand: 'Jeeter', champions: 1.8, loyal: 1.4, atRisk: 0.6, new: 0.9, lost: 0.4 },
  { brand: 'Stiiizy', champions: 1.3, loyal: 1.5, atRisk: 1.1, new: 1.2, lost: 0.8 },
  { brand: 'WYLD', champions: 1.1, loyal: 1.3, atRisk: 1.4, new: 1.0, lost: 1.2 },
  { brand: 'Cookies', champions: 2.1, loyal: 1.1, atRisk: 0.5, new: 0.7, lost: 0.3 },
  { brand: 'Select', champions: 0.6, loyal: 0.9, atRisk: 1.3, new: 1.6, lost: 1.1 },
  { brand: 'Kiva', champions: 1.4, loyal: 1.2, atRisk: 0.9, new: 1.1, lost: 0.7 },
  { brand: 'Cresco', champions: 0.8, loyal: 1.1, atRisk: 1.2, new: 1.4, lost: 0.9 },
  { brand: 'Good News', champions: 0.5, loyal: 0.8, atRisk: 1.1, new: 1.8, lost: 1.3 },
];

const SEGMENT_KEYS = [
  { key: 'champions', label: 'Champions' },
  { key: 'loyal', label: 'Loyal' },
  { key: 'atRisk', label: 'At Risk' },
  { key: 'new', label: 'New' },
  { key: 'lost', label: 'Lost' },
];

function getAffinityColor(value) {
  if (value > 1.3) return { bg: `rgba(0, 194, 124, ${Math.min((value - 1.0) * 0.35, 0.45)})`, text: '#00C27C' };
  if (value < 0.8) return { bg: `rgba(232, 112, 104, ${Math.min((1.0 - value) * 0.45, 0.4)})`, text: '#E87068' };
  return { bg: 'rgba(255, 255, 255, 0.04)', text: 'var(--color-text-secondary)' };
}

const AFFINITY_INSIGHTS = [
  {
    brand: 'Cookies',
    segment: 'Champions',
    segmentKey: 'champions',
    value: 2.1,
    icon: Lightbulb,
    text: 'Cookies has 2.1x affinity with Champions \u2014 your highest-value customers over-index on this brand. Protect this relationship with VIP early access.',
    campaignName: 'Cookies VIP Early Access',
    campaignDesc: 'Exclusive early access to new Cookies drops for Champion-tier loyalty members.',
  },
  {
    brand: 'Good News',
    segment: 'New',
    segmentKey: 'new',
    value: 1.8,
    icon: Lightbulb,
    text: 'Good News has 1.8x affinity with New customers \u2014 this is your gateway brand. Stock prominently and consider a welcome-series campaign featuring it.',
    campaignName: 'Good News Welcome Series',
    campaignDesc: 'Welcome-series campaign featuring Good News products for newly acquired customers.',
  },
  {
    brand: 'Jeeter',
    segment: 'Lost',
    segmentKey: 'lost',
    value: 0.4,
    icon: Lightbulb,
    text: 'Jeeter has 0.4x affinity with Lost customers \u2014 they stopped buying your premium brand. A Jeeter-specific win-back campaign could recapture high-value churned customers.',
    campaignName: 'Jeeter Win-Back Campaign',
    campaignDesc: 'Targeted win-back campaign featuring Jeeter deals for churned high-value customers.',
  },
];

const CROSS_SELL_RECOMMENDATIONS = [
  {
    text: 'Champions who buy Cookies (2.1x) rarely buy Select (0.6x). Bundle recommendation: Cookies + Select sampler pack to diversify their portfolio.',
  },
  {
    text: 'New customers start with Good News (1.8x) and Select (1.6x). Upsell path: introduce Kiva (1.1x) and Stiiizy (1.2x) as graduation brands.',
  },
];

// ---------------------------------------------------------------------------
// Per-store brand data — deterministic, seeded by store index
// Store archetypes add personality: college-town, medical, urban-rec, suburban
// ---------------------------------------------------------------------------
const STORE_ARCHETYPES = [
  // Archetype adjustments: [brand] => delta in share points
  { label: 'urban-rec', biases: { Cookies: 6, Jeeter: 3, Stiiizy: 2, 'Raw Garden': -3, Select: -4, Kiva: -2, Cresco: -1, Rythm: -1, 'Good News': 0, WYLD: 0 } },
  { label: 'college-town', biases: { Cookies: 8, Stiiizy: 5, Jeeter: 2, WYLD: 1, 'Good News': 2, 'Raw Garden': -4, Select: -5, Kiva: -4, Cresco: -3, Rythm: -2 } },
  { label: 'medical', biases: { Select: 6, Kiva: 5, Cresco: 3, Rythm: 2, 'Raw Garden': 1, Cookies: -6, Jeeter: -4, Stiiizy: -3, WYLD: -2, 'Good News': -2 } },
  { label: 'suburban', biases: { WYLD: 4, Kiva: 3, 'Good News': 2, Rythm: 1, 'Raw Garden': 1, Cookies: -3, Jeeter: -2, Stiiizy: -2, Select: -2, Cresco: -2 } },
  { label: 'outlet', biases: { 'Good News': 5, Select: 4, WYLD: 3, Cresco: 1, Rythm: 1, Cookies: -5, Jeeter: -4, Stiiizy: -2, 'Raw Garden': -1, Kiva: -2 } },
];

// Portfolio-level brand shares (derived from BRAND_DATA revenue)
const PORTFOLIO_TOTAL_REVENUE = BRAND_DATA.reduce((s, b) => s + b.revenue, 0);
const PORTFOLIO_BRAND_SHARES = BRAND_DATA.map((b) => ({
  brand: b.brand,
  share: (b.revenue / PORTFOLIO_TOTAL_REVENUE) * 100,
  revenue: b.revenue,
  margin: b.margin,
  trendUp: b.trendUp,
  trendDelta: b.trendDelta,
}));

function generateStoreBrandData(storeIndex) {
  const rng = _seedRng(storeIndex * 8461 + 1039);
  // Pick archetype deterministically
  const archetype = STORE_ARCHETYPES[storeIndex % STORE_ARCHETYPES.length];

  // Generate store-level total revenue ($60K-$200K per period)
  const storeTotal = Math.round(60000 + rng() * 140000);

  // Build brand shares for this store
  const rawShares = BRANDS.map((brand) => {
    const portfolioEntry = PORTFOLIO_BRAND_SHARES.find((p) => p.brand === brand);
    const baseShare = portfolioEntry.share;
    const bias = archetype.biases[brand] || 0;
    // Add random noise +-2pp on top of archetype bias
    const noise = (rng() - 0.5) * 4;
    return { brand, rawShare: Math.max(1, baseShare + bias + noise) };
  });

  // Normalize to 100%
  const totalRaw = rawShares.reduce((s, r) => s + r.rawShare, 0);
  return rawShares.map((r) => {
    const rngLocal = _seedRng(storeIndex * 3119 + BRANDS.indexOf(r.brand) * 709 + 43);
    const storeShare = (r.rawShare / totalRaw) * 100;
    const portfolioShare = PORTFOLIO_BRAND_SHARES.find((p) => p.brand === r.brand).share;
    const storeRevenue = Math.round((storeShare / 100) * storeTotal);
    const margin = Math.round((18 + rngLocal() * 24) * 10) / 10;
    const velocity = Math.round((3 + rngLocal() * 25) * 10) / 10;
    const trendUp = rngLocal() > 0.4;
    const deltaShare = Math.round((storeShare - portfolioShare) * 10) / 10;

    return {
      brand: r.brand,
      storeRevenue,
      storeShare: Math.round(storeShare * 10) / 10,
      portfolioShare: Math.round(portfolioShare * 10) / 10,
      deltaShare,
      margin,
      velocity,
      trendUp,
    };
  }).sort((a, b) => b.storeRevenue - a.storeRevenue);
}

function generateStoreInsights(storeBrandData, storeName) {
  const insights = [];
  // Sort by deltaShare to find most over/under-indexed
  const sorted = [...storeBrandData].sort((a, b) => a.deltaShare - b.deltaShare);

  // Find the most under-indexed brand
  const mostUnder = sorted[0];
  if (mostUnder && mostUnder.deltaShare < -3) {
    // Check if this brand is top in portfolio
    const portfolioRank = [...PORTFOLIO_BRAND_SHARES].sort((a, b) => b.revenue - a.revenue);
    const rank = portfolioRank.findIndex((p) => p.brand === mostUnder.brand) + 1;
    const rankLabel = rank === 1 ? '#1 brand' : rank === 2 ? '#2 brand' : `#${rank} brand`;
    // Check if brand has segment affinity
    const affinityEntry = BRAND_SEGMENT_AFFINITY.find((a) => a.brand === mostUnder.brand);
    let affinityNote = '';
    if (affinityEntry) {
      const bestSeg = SEGMENT_KEYS.reduce((best, seg) => affinityEntry[seg.key] > (best.val || 0) ? { key: seg.key, label: seg.label, val: affinityEntry[seg.key] } : best, {});
      if (bestSeg.val > 1.2) {
        affinityNote = ` As a brand with ${bestSeg.val.toFixed(1)}x ${bestSeg.label} Customer affinity, stocking more could help with customer ${bestSeg.label === 'New' ? 'acquisition' : 'retention'} at this location.`;
      }
    }
    insights.push({
      type: 'under',
      brand: mostUnder.brand,
      delta: Math.abs(mostUnder.deltaShare),
      text: `This store under-indexes on ${mostUnder.brand} by ${Math.abs(mostUnder.deltaShare).toFixed(1)}pp vs portfolio. ${mostUnder.brand} is the ${rankLabel} by revenue portfolio-wide. Consider expanding shelf space and running a promotional campaign.${affinityNote}`,
    });
  }

  // Find the most over-indexed brand
  const mostOver = sorted[sorted.length - 1];
  if (mostOver && mostOver.deltaShare > 3) {
    insights.push({
      type: 'over',
      brand: mostOver.brand,
      delta: mostOver.deltaShare,
      text: `${mostOver.brand} over-indexes by ${mostOver.deltaShare.toFixed(1)}pp at this store \u2014 a local strength. Ensure adequate inventory depth and negotiate priority allocation with vendor.`,
    });
  }

  // Find second most under-indexed if available
  const secondUnder = sorted[1];
  if (secondUnder && secondUnder.deltaShare < -3 && insights.length < 3) {
    const affinityEntry = BRAND_SEGMENT_AFFINITY.find((a) => a.brand === secondUnder.brand);
    let affinityNote = '';
    if (affinityEntry) {
      const bestSeg = SEGMENT_KEYS.reduce((best, seg) => affinityEntry[seg.key] > (best.val || 0) ? { key: seg.key, label: seg.label, val: affinityEntry[seg.key] } : best, {});
      if (bestSeg.val > 1.2) {
        affinityNote = ` As a ${secondUnder.portfolioShare > 12 ? 'major' : 'value'} brand with ${bestSeg.val.toFixed(1)}x ${bestSeg.label} Customer affinity, stocking more could help with customer ${bestSeg.label === 'New' ? 'acquisition' : 'retention'} at this location.`;
      }
    }
    insights.push({
      type: 'under',
      brand: secondUnder.brand,
      delta: Math.abs(secondUnder.deltaShare),
      text: `${secondUnder.brand} under-indexes by ${Math.abs(secondUnder.deltaShare).toFixed(1)}pp.${affinityNote || ' Consider evaluating local demand and adjusting assortment.'}`,
    });
  }

  // If we still need more, find second most over-indexed
  if (insights.length < 2) {
    const secondOver = sorted[sorted.length - 2];
    if (secondOver && secondOver.deltaShare > 3) {
      insights.push({
        type: 'over',
        brand: secondOver.brand,
        delta: secondOver.deltaShare,
        text: `${secondOver.brand} over-indexes by ${secondOver.deltaShare.toFixed(1)}pp \u2014 consider protecting inventory allocation to maintain this local advantage.`,
      });
    }
  }

  return insights.slice(0, 3);
}

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
  const navigate = useNavigate();
  const { selectedStores, selectedStoreNames, isAllSelected } = useStores();
  const [sortCol, setSortCol] = useState('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedStoreIdx, setSelectedStoreIdx] = useState('all');

  // Determine which stores to show in the dropdown (respects header StoreSelector filter)
  const availableStores = useMemo(() => {
    return locations.filter((l) => selectedStoreNames.has(l.name));
  }, [selectedStoreNames]);

  // Get selected store data
  const storePerformance = useMemo(() => {
    if (selectedStoreIdx === 'all') return null;
    const idx = parseInt(selectedStoreIdx, 10);
    const store = locations[idx];
    if (!store) return null;
    const brandData = generateStoreBrandData(idx);
    const insights = generateStoreInsights(brandData, store.name);
    return { store, brandData, insights, storeIndex: idx };
  }, [selectedStoreIdx]);

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
    <PageSkeleton>
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
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
              <tr className="border-t border-b border-surface-divider bg-surface-muted">
                {[
                  { key: 'brand', label: 'Brand' },
                  { key: 'sellThrough', label: 'Sell-Through' },
                  { key: 'revenue', label: 'Revenue' },
                  { key: 'margin', label: 'Margin' },
                  { key: 'daysOnShelf', label: 'Days on Shelf' },
                  { key: null, label: 'Trend' },
                  { key: null, label: 'Actions' },
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
                  className="border-b border-surface-divider hover:bg-surface-hover transition-colors"
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => navigate('/agents/marketing', { state: { brand: b.brand, action: 'promote' } })} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors">
                        <Megaphone className="w-3 h-3" /> Promote
                      </button>
                      <button onClick={() => navigate('/agents/pricing', { state: { brand: b.brand } })} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 transition-colors">
                        <CircleDollarSign className="w-3 h-3" /> Pricing
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2.5: Customer Segment Affinity */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <SectionHeader
            title="Customer Segment Affinity"
            subtitle="Which customer segments over-index on which brands. Affinity index: 1.0 = average purchase rate, higher = stronger preference."
            icon={Users}
          />
        </div>

        {/* Heatmap Matrix */}
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-divider">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Brand</th>
                {SEGMENT_KEYS.map(({ key, label }) => (
                  <th key={key} className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BRAND_SEGMENT_AFFINITY.map((row) => (
                <tr key={row.brand} className="border-b border-surface-divider hover:bg-surface-hover/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: BRAND_HEX[row.brand] || BRAND_COLORS[row.brand] || '#6b7280' }}
                      />
                      <span className="font-medium text-text-primary">{row.brand}</span>
                    </div>
                  </td>
                  {SEGMENT_KEYS.map(({ key }) => {
                    const value = row[key];
                    const colors = getAffinityColor(value);
                    return (
                      <td key={key} className="px-4 py-3 text-center">
                        <span
                          className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold min-w-[52px]"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {value.toFixed(1)}x
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insight Callouts */}
        <div className="px-5 pb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-accent-gold" />
            Key Insights
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {AFFINITY_INSIGHTS.map((insight, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-surface-divider bg-surface-muted/50 p-4 flex flex-col gap-3"
              >
                <p className="text-sm text-text-secondary leading-relaxed flex-1">{insight.text}</p>
                <button
                  onClick={() => navigate('/agents/marketing', {
                    state: {
                      action: 'create-workflow',
                      trigger: 'loyalty_tier',
                      brand: insight.brand,
                      segment: insight.segment,
                      campaign: {
                        name: insight.campaignName,
                        description: insight.campaignDesc,
                      },
                    },
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors self-start"
                >
                  <Megaphone className="w-3 h-3" />
                  Create Campaign
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Sell Recommendations */}
        <div className="px-5 pb-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent-purple" />
            Cross-Sell Opportunities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CROSS_SELL_RECOMMENDATIONS.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-surface-divider bg-surface-muted/50 p-4 flex items-start gap-3"
              >
                <Sparkles className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary leading-relaxed">{rec.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2.7: Store Brand Performance */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <SectionHeader
            title="Store Brand Performance"
            subtitle="Compare your store's brand mix against the portfolio average to identify assortment gaps and local strengths."
            icon={Store}
          />
          {/* Store Selector */}
          <div className="mt-3 mb-1">
            <select
              value={selectedStoreIdx}
              onChange={(e) => setSelectedStoreIdx(e.target.value)}
              className="bg-surface-muted border border-surface-divider rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-green/40 focus:border-accent-green min-w-[280px]"
            >
              <option value="all">All Stores (Portfolio)</option>
              {availableStores.map((store) => {
                const idx = locations.indexOf(store);
                return (
                  <option key={store.name} value={idx}>
                    {store.name} — {store.city}, {store.state}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {selectedStoreIdx === 'all' ? (
          <div className="px-5 pb-5">
            <p className="text-sm text-text-muted italic">Select a specific store above to compare its brand mix against the portfolio average.</p>
          </div>
        ) : storePerformance && (
          <>
            {/* Brand Mix Comparison Bar */}
            <div className="px-5 pb-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Brand Mix Comparison</h3>
              <div className="space-y-2">
                {/* Store bar */}
                <div>
                  <p className="text-xs text-text-secondary mb-1">This Store</p>
                  <div className="flex h-8 rounded-lg overflow-hidden border border-surface-divider">
                    {(() => {
                      const top = storePerformance.brandData.slice(0, 4);
                      const othersShare = Math.round((100 - top.reduce((s, b) => s + b.storeShare, 0)) * 10) / 10;
                      return (
                        <>
                          {top.map((b) => (
                            <div
                              key={b.brand}
                              className="flex items-center justify-center text-[10px] font-semibold text-white overflow-hidden whitespace-nowrap"
                              style={{
                                width: `${b.storeShare}%`,
                                backgroundColor: BRAND_HEX[b.brand] || BRAND_COLORS[b.brand] || '#6b7280',
                                minWidth: b.storeShare > 5 ? undefined : '0px',
                              }}
                              title={`${b.brand}: ${b.storeShare}%`}
                            >
                              {b.storeShare >= 8 ? `${b.brand} ${b.storeShare}%` : b.storeShare >= 5 ? `${b.storeShare}%` : ''}
                            </div>
                          ))}
                          {othersShare > 0 && (
                            <div
                              className="flex items-center justify-center text-[10px] font-semibold text-text-secondary overflow-hidden whitespace-nowrap"
                              style={{ width: `${othersShare}%`, backgroundColor: 'rgba(107, 114, 128, 0.3)' }}
                              title={`Others: ${othersShare}%`}
                            >
                              {othersShare >= 8 ? `Others ${othersShare}%` : othersShare >= 5 ? `${othersShare}%` : ''}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                {/* Portfolio bar */}
                <div>
                  <p className="text-xs text-text-secondary mb-1">Portfolio Avg</p>
                  <div className="flex h-8 rounded-lg overflow-hidden border border-surface-divider">
                    {(() => {
                      const sorted = [...PORTFOLIO_BRAND_SHARES].sort((a, b) => b.share - a.share);
                      const top = sorted.slice(0, 4);
                      const othersShare = Math.round((100 - top.reduce((s, b) => s + b.share, 0)) * 10) / 10;
                      return (
                        <>
                          {top.map((b) => {
                            const share = Math.round(b.share * 10) / 10;
                            return (
                              <div
                                key={b.brand}
                                className="flex items-center justify-center text-[10px] font-semibold text-white overflow-hidden whitespace-nowrap"
                                style={{
                                  width: `${share}%`,
                                  backgroundColor: BRAND_HEX[b.brand] || BRAND_COLORS[b.brand] || '#6b7280',
                                  minWidth: share > 5 ? undefined : '0px',
                                }}
                                title={`${b.brand}: ${share}%`}
                              >
                                {share >= 8 ? `${b.brand} ${share}%` : share >= 5 ? `${share}%` : ''}
                              </div>
                            );
                          })}
                          {othersShare > 0 && (
                            <div
                              className="flex items-center justify-center text-[10px] font-semibold text-text-secondary overflow-hidden whitespace-nowrap"
                              style={{ width: `${othersShare}%`, backgroundColor: 'rgba(107, 114, 128, 0.3)' }}
                              title={`Others: ${othersShare}%`}
                            >
                              {othersShare >= 8 ? `Others ${othersShare}%` : othersShare >= 5 ? `${othersShare}%` : ''}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Store vs Portfolio Brand Comparison Table */}
            <div className="overflow-x-auto px-5 pb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b border-surface-divider bg-surface-muted">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Brand</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Store Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Store Share %</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Portfolio Share %</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">{'\u0394'} Share</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Store Margin %</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Velocity</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {storePerformance.brandData.map((b) => {
                    const deltaColor = b.deltaShare > 3 ? 'text-accent-green' : b.deltaShare < -3 ? 'text-accent-red' : 'text-text-secondary';
                    const deltaBg = b.deltaShare > 3 ? 'bg-accent-green/10' : b.deltaShare < -3 ? 'bg-accent-red/10' : 'bg-transparent';
                    return (
                      <tr key={b.brand} className="border-b border-surface-divider hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: BRAND_HEX[b.brand] || BRAND_COLORS[b.brand] || '#6b7280' }}
                            />
                            <span className="font-medium text-text-primary">{b.brand}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-text-primary font-medium">{fmtDollar(b.storeRevenue)}</td>
                        <td className="px-4 py-3 text-right text-text-primary">{b.storeShare}%</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{b.portfolioShare}%</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${deltaColor} ${deltaBg}`}>
                            {b.deltaShare > 0 ? '+' : ''}{b.deltaShare}pp
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${b.margin >= 30 ? 'text-accent-green' : b.margin >= 22 ? 'text-accent-gold' : 'text-accent-red'}`}>
                            {b.margin}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-text-primary">{b.velocity} u/wk</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${b.trendUp ? 'text-accent-green' : 'text-accent-red'}`}>
                            {b.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Assortment Insights */}
            {storePerformance.insights.length > 0 && (
              <div className="px-5 pb-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-accent-gold" />
                  Assortment Insights
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {storePerformance.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-surface-divider bg-surface-muted/50 p-4 flex flex-col gap-3"
                    >
                      <p className="text-sm text-text-secondary leading-relaxed flex-1">{insight.text}</p>
                      <button
                        onClick={() => navigate('/agents/connect', {
                          state: {
                            action: 'reorder',
                            store: storePerformance.store.name,
                            vendor: insight.brand,
                          },
                        })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors self-start ${
                          insight.type === 'under'
                            ? 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20'
                            : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'
                        }`}
                      >
                        {insight.type === 'under' ? (
                          <>
                            <FileText className="w-3 h-3" />
                            Draft PO for {insight.brand}
                            <ArrowRight className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            Protect Inventory
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-divider)" vertical={false} />
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
                <span className="text-sm text-text-primary">{value}</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-divider)" horizontal={false} />
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
    </PageSkeleton>
  );
}
