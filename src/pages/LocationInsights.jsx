import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  Percent,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { locations } from '../data/mockData';
import { useStores } from '../contexts/StoreContext';
import { useDateRange } from '../contexts/DateRangeContext';
import { PageSkeleton } from '../components/common/PageSkeleton';

// ---------------------------------------------------------------------------
// Per-store metrics — deterministically generated (same seed as NexusHome)
// State-based parameters from real MSO dispensary data (2024 earnings)
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
  const vsBenchmark = Math.round((rng() * 30 - 8) * 10) / 10;

  // Inventory metrics
  const skuCount = Math.round(180 + rng() * 220 + (isOutlet ? -40 : 0));
  const daysOnHand = Math.round(14 + rng() * 26);
  const stockOutRate = Math.round((1.5 + rng() * 7) * 10) / 10;
  const turnoverRate = Math.round((3.0 + rng() * 5.5) * 10) / 10;

  // Week-over-week revenue delta (deterministic)
  const wowDelta = Math.round((rng() * 40 - 20) * 10) / 10;

  // Discount rate (8-22%)
  const discountRate = Math.round((8 + rng() * 14) * 10) / 10;

  // Aged inventory $ (value of inventory >60 days, $2K-$18K)
  const agedInventory = Math.round(2 + rng() * 16);

  // Online order % (15-45%)
  const onlineOrderPct = Math.round((15 + rng() * 30) * 10) / 10;

  // Avg fulfillment time (8-22 min)
  const avgFulfillmentMin = Math.round(8 + rng() * 14);

  // Top selling category
  const TOP_CATEGORIES = ['Flower', 'Vapes', 'Edibles', 'Concentrates', 'Pre-Rolls', 'Tinctures'];
  const topCategory = TOP_CATEGORIES[Math.floor(rng() * TOP_CATEGORIES.length)];

  return {
    name: loc.name, state: loc.state, city: loc.city,
    revenue, transactions, avgBasket, margin, vsBenchmark,
    skuCount, daysOnHand, stockOutRate, turnoverRate, wowDelta,
    discountRate, agedInventory, onlineOrderPct, avgFulfillmentMin, topCategory,
  };
});

/* ────────────────────────────────────────────
   Helper: format revenue (in thousands) as $XK or $X.XM
   ──────────────────────────────────────────── */
function fmtRevenue(revK) {
  if (revK >= 1000) return `$${(revK / 1000).toFixed(1)}M`;
  return `$${Math.round(revK)}K`;
}

/* ────────────────────────────────────────────
   Helper: generate insight callout for a store
   ──────────────────────────────────────────── */
function getStoreInsight(store) {
  // Revenue trending down significantly WoW
  if (store.wowDelta <= -15) {
    return { type: 'alert', color: 'red', text: `Revenue trending down ${Math.abs(store.wowDelta)}% WoW` };
  }
  // Below benchmark
  if (store.vsBenchmark <= -5) {
    return { type: 'alert', color: 'red', text: `Underperforming benchmark by ${store.vsBenchmark}%` };
  }
  // Margin erosion — margin below 43% and declining
  if (store.margin < 43 && store.wowDelta < 0) {
    return { type: 'warning', color: 'gold', text: `Margin at ${store.margin}% and declining — review pricing strategy` };
  }
  // Discount spike — discountRate above 18%
  if (store.discountRate > 18) {
    return { type: 'warning', color: 'blue', text: `Discount rate ${store.discountRate}% — significantly above portfolio average` };
  }
  // High stock-out rate
  if (store.stockOutRate >= 6) {
    return { type: 'warning', color: 'blue', text: `Stock-out rate at ${store.stockOutRate}% — replenishment needed` };
  }
  // Low margin (but not declining — general warning)
  if (store.margin < 44) {
    return { type: 'warning', color: 'gold', text: `Margin at ${store.margin}% — below target threshold` };
  }
  // Strong revenue growth
  if (store.wowDelta >= 12) {
    return { type: 'positive', color: 'green', text: `Revenue up ${store.wowDelta}% WoW — strong momentum` };
  }
  // Above benchmark
  if (store.vsBenchmark >= 15) {
    return { type: 'positive', color: 'green', text: `Outperforming benchmark by +${store.vsBenchmark}%` };
  }
  // Low inventory days
  if (store.daysOnHand <= 16) {
    return { type: 'warning', color: 'blue', text: `Only ${store.daysOnHand} days of inventory on hand` };
  }
  return null;
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function LocationInsights() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState('vsBenchmark');
  const [sortDir, setSortDir] = useState('asc');
  const [expandedStore, setExpandedStore] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [laborCostPct, setLaborCostPct] = useState(20);
  const [benchmarkType, setBenchmarkType] = useState('portfolio'); // 'portfolio' | 'state' | 'goal'
  const [showBenchInfo, setShowBenchInfo] = useState(false);
  const { selectedStoreNames } = useStores();
  const { dateMultiplier, trendScale, rateOffset, periodLabel, rangeLabel } = useDateRange();

  /* ── Derive location-level data from STORE_METRICS ── */
  const locationData = useMemo(() => {
    return STORE_METRICS.map((metrics) => ({
      name: metrics.name,
      city: metrics.city,
      state: metrics.state,
      revenue: Math.round((metrics.revenue * dateMultiplier) * 10) / 10,
      transactions: Math.round(metrics.transactions * dateMultiplier),
      avgBasket: Math.round((metrics.avgBasket * (1 + rateOffset)) * 100) / 100,
      margin: Math.round((metrics.margin + rateOffset * 50) * 10) / 10,
      vsBenchmark: metrics.vsBenchmark,
      skuCount: metrics.skuCount,
      daysOnHand: metrics.daysOnHand,
      stockOutRate: metrics.stockOutRate,
      turnoverRate: metrics.turnoverRate,
      wowDelta: metrics.wowDelta,
      discountRate: metrics.discountRate,
      agedInventory: metrics.agedInventory,
      onlineOrderPct: metrics.onlineOrderPct,
      avgFulfillmentMin: metrics.avgFulfillmentMin,
      topCategory: metrics.topCategory,
    }));
  }, [dateMultiplier, rateOffset]);

  /* ── Filter by selected stores ── */
  const filteredLocations = useMemo(() => {
    return locationData.filter((loc) => selectedStoreNames.has(loc.name));
  }, [locationData, selectedStoreNames]);

  /* ── KPI aggregates ── */
  const kpis = useMemo(() => {
    const stores = filteredLocations;
    const totalRevenue = stores.reduce((s, l) => s + l.revenue, 0);
    const totalTransactions = stores.reduce((s, l) => s + l.transactions, 0);
    const weightedBasket = totalTransactions > 0
      ? (totalRevenue * 1000) / totalTransactions
      : 0;
    const avgMargin = stores.length > 0
      ? stores.reduce((s, l) => s + l.margin, 0) / stores.length
      : 0;
    return {
      totalRevenue,
      totalTransactions,
      avgBasket: Math.round(weightedBasket * 100) / 100,
      avgMargin: Math.round(avgMargin * 10) / 10,
    };
  }, [filteredLocations]);

  /* ── Sorted location data for table ── */
  const sortedLocations = useMemo(() => {
    const sorted = [...filteredLocations];
    sorted.sort((a, b) => {
      let valA, valB;
      switch (sortKey) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'revenue':
          valA = a.revenue; valB = b.revenue; break;
        case 'transactions':
          valA = a.transactions; valB = b.transactions; break;
        case 'avgBasket':
          valA = a.avgBasket; valB = b.avgBasket; break;
        case 'margin':
          valA = a.margin; valB = b.margin; break;
        case 'vsBenchmark':
          valA = a.vsBenchmark; valB = b.vsBenchmark; break;
        case 'stockOutRate':
          valA = a.stockOutRate; valB = b.stockOutRate; break;
        case 'daysOnHand':
          valA = a.daysOnHand; valB = b.daysOnHand; break;
        case 'discountRate':
          valA = a.discountRate; valB = b.discountRate; break;
        case 'agedInventory':
          valA = a.agedInventory; valB = b.agedInventory; break;
        case 'contribMargin':
          valA = a.margin - laborCostPct; valB = b.margin - laborCostPct; break;
        default:
          valA = a.revenue; valB = b.revenue; break;
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
    return sorted;
  }, [filteredLocations, sortKey, sortDir, laborCostPct]);

  /* ── State-level aggregates ── */
  const stateData = useMemo(() => {
    const grouped = {};
    filteredLocations.forEach(loc => {
      if (!grouped[loc.state]) grouped[loc.state] = { stores: [], totalRevenue: 0, totalTransactions: 0 };
      grouped[loc.state].stores.push(loc);
      grouped[loc.state].totalRevenue += loc.revenue;
      grouped[loc.state].totalTransactions += loc.transactions;
    });
    return Object.entries(grouped).map(([state, data]) => ({
      state,
      storeCount: data.stores.length,
      totalRevenue: data.totalRevenue,
      avgMargin: Math.round((data.stores.reduce((s, l) => s + l.margin, 0) / data.stores.length) * 10) / 10,
      avgBenchmark: Math.round((data.stores.reduce((s, l) => s + l.vsBenchmark, 0) / data.stores.length) * 10) / 10,
      topStore: [...data.stores].sort((a, b) => b.revenue - a.revenue)[0],
      bottomStore: [...data.stores].sort((a, b) => a.revenue - b.revenue)[0],
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredLocations]);

  /* ── Filtered table rows (by selectedState) ── */
  const displayedLocations = useMemo(() => {
    if (!selectedState) return sortedLocations;
    return sortedLocations.filter(loc => loc.state === selectedState);
  }, [sortedLocations, selectedState]);

  /* ── Sort handler ── */
  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ column }) {
    if (sortKey !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-accent-green" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-accent-green" />
    );
  }

  function SortableHeader({ label, column, className = '' }) {
    return (
      <th
        className={`px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors ${className}`}
        onClick={() => handleSort(column)}
      >
        <span className="flex items-center gap-1">
          {label} <SortIcon column={column} />
        </span>
      </th>
    );
  }

  /* ════════════════════════════════════════
     RENDER
     ════════════════════════════════════════ */
  return (
    <PageSkeleton>
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* --- Section 1: Header --- */}
      <div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <MapPin className="w-6 h-6 text-accent-green" />
              Store Performance
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Performance metrics across your dispensary locations — {rangeLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-surface-card rounded-xl border border-surface-border px-3 py-2">
            <label className="text-xs text-text-secondary font-medium whitespace-nowrap" htmlFor="labor-cost-input">
              Labor Cost %
            </label>
            <input
              id="labor-cost-input"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={laborCostPct}
              onChange={e => setLaborCostPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className="w-16 px-2 py-1 rounded-md bg-surface-bg border border-surface-border text-xs text-text-primary text-right focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
            />
            <span className="text-xs text-text-muted">%</span>
            <div className="relative group ml-1">
              <Info className="w-3.5 h-3.5 text-text-muted cursor-help" />
              <div className="absolute z-10 bottom-full right-0 mb-1 w-64 p-2.5 rounded-lg bg-surface-card border border-surface-border shadow-lg text-[10px] text-text-muted leading-relaxed hidden group-hover:block">
                Contribution Margin = Gross Margin % - Labor Cost %. Labor cost is operator-estimated (default 20%). Cannabis dispensary industry range: 15-25% of revenue. Set your actual labor cost here to improve accuracy. Dutchie does not track payroll data — integrate with your HR/payroll system for exact figures.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- KPI Summary Cards --- */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-green-bg)' }}>
                <DollarSign className="w-4 h-4 text-accent-green" />
              </div>
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              ${(kpis.totalRevenue / 1000).toFixed(1)}M
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-accent-green" />
              <span className="text-xs text-accent-green">+{(4.2 * trendScale).toFixed(1)}% {periodLabel}</span>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-blue) 10%, transparent)' }}>
                <Receipt className="w-4 h-4 text-accent-blue" />
              </div>
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {kpis.totalTransactions.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-accent-green" />
              <span className="text-xs text-accent-green">+{(2.8 * trendScale).toFixed(1)}% {periodLabel}</span>
            </div>
          </div>

          {/* Avg Basket */}
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-gold) 10%, transparent)' }}>
                <ShoppingCart className="w-4 h-4 text-accent-gold" />
              </div>
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Avg Basket</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              ${kpis.avgBasket.toFixed(2)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-accent-red" />
              <span className="text-xs text-accent-red">-{(1.1 * trendScale).toFixed(1)}% {periodLabel}</span>
            </div>
          </div>

          {/* Avg Margin */}
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-purple) 10%, transparent)' }}>
                <Percent className="w-4 h-4 text-accent-purple" />
              </div>
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Avg Margin</span>
            </div>
            <p className={`text-2xl font-bold ${kpis.avgMargin >= 48 ? 'text-accent-green' : 'text-accent-gold'}`}>
              {kpis.avgMargin}%
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-accent-green" />
              <span className="text-xs text-accent-green">+{(0.5 * trendScale).toFixed(1)}pp {periodLabel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- State Overview: Clickable State Cards --- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">State Overview</h3>
          {selectedState && (
            <button
              onClick={() => setSelectedState(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-text-primary border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors"
            >
              <X className="w-3 h-3" />
              All States
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stateData.map(sd => {
            const isSelected = selectedState === sd.state;
            const marginColor = sd.avgMargin >= 48
              ? 'text-accent-green'
              : sd.avgMargin >= 45
              ? 'text-accent-gold'
              : 'text-accent-red';
            const marginBg = sd.avgMargin >= 48
              ? 'var(--color-accent-green-bg)'
              : sd.avgMargin >= 45
              ? 'color-mix(in srgb, var(--color-accent-gold) 10%, transparent)'
              : 'color-mix(in srgb, var(--color-accent-red) 10%, transparent)';
            const borderColor = sd.avgMargin >= 48
              ? 'var(--color-accent-green)'
              : sd.avgMargin >= 45
              ? 'var(--color-accent-gold)'
              : 'var(--color-accent-red)';
            return (
              <button
                key={sd.state}
                onClick={() => setSelectedState(isSelected ? null : sd.state)}
                className="bg-surface-card rounded-xl border p-4 flex flex-col items-center gap-1 transition-all hover:scale-105 hover:shadow-md"
                style={{
                  borderColor: isSelected ? borderColor : 'var(--color-surface-border)',
                  boxShadow: isSelected ? `0 0 0 2px ${borderColor}33` : undefined,
                }}
              >
                <span className="text-2xl font-extrabold text-text-primary">{sd.state}</span>
                <span className="text-xs text-text-muted">{sd.storeCount} store{sd.storeCount !== 1 ? 's' : ''}</span>
                <span className="text-sm font-semibold text-text-primary">{fmtRevenue(sd.totalRevenue)}</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${marginColor}`}
                  style={{ backgroundColor: marginBg }}
                >
                  {sd.avgMargin}% margin
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* --- State Card Modal --- */}
      {selectedState && (() => {
        const sd = stateData.find(s => s.state === selectedState);
        if (!sd) return null;
        const marginColor = sd.avgMargin >= 48 ? 'text-accent-green' : sd.avgMargin >= 45 ? 'text-accent-gold' : 'text-accent-red';
        const benchColor = sd.avgBenchmark >= 0 ? 'text-accent-green' : 'text-accent-red';
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            onClick={() => setSelectedState(null)}
          >
            <div
              className="bg-surface-card rounded-2xl border border-surface-border shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-divider">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent-green-bg)' }}
                  >
                    <MapPin className="w-5 h-5 text-accent-green" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-text-primary">{sd.state} — State Overview</h4>
                    <p className="text-xs text-text-muted">{sd.storeCount} locations</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedState(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* KPI grid */}
              <div className="grid grid-cols-2 gap-3 px-6 pt-5">
                <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                  <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl font-bold text-text-primary">{fmtRevenue(sd.totalRevenue)}</p>
                </div>
                <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                  <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Avg Margin</p>
                  <p className={`text-xl font-bold ${marginColor}`}>{sd.avgMargin}%</p>
                </div>
                <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                  <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Avg vs Benchmark</p>
                  <p className={`text-xl font-bold ${benchColor}`}>
                    {sd.avgBenchmark >= 0 ? '+' : ''}{sd.avgBenchmark}%
                  </p>
                </div>
                <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                  <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Locations</p>
                  <p className="text-xl font-bold text-text-primary">{sd.storeCount}</p>
                </div>
              </div>

              {/* Top / Bottom stores */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-surface-border p-3" style={{ backgroundColor: 'var(--color-accent-green-bg)' }}>
                  <TrendingUp className="w-4 h-4 text-accent-green shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-accent-green uppercase tracking-wider mb-0.5">Top Store</p>
                    <p className="font-semibold text-text-primary truncate">{sd.topStore.name}</p>
                    <p className="text-xs text-text-muted">{sd.topStore.city} · {fmtRevenue(sd.topStore.revenue)} rev · {sd.topStore.margin}% margin</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-surface-border p-3" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-red) 6%, transparent)' }}>
                  <TrendingDown className="w-4 h-4 text-accent-red shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-accent-red uppercase tracking-wider mb-0.5">Lowest Revenue Store</p>
                    <p className="font-semibold text-text-primary truncate">{sd.bottomStore.name}</p>
                    <p className="text-xs text-text-muted">{sd.bottomStore.city} · {fmtRevenue(sd.bottomStore.revenue)} rev · {sd.bottomStore.margin}% margin</p>
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <div className="px-6 pb-5">
                <button
                  onClick={() => setSelectedState(null)}
                  className="w-full text-center text-sm text-text-muted hover:text-text-primary transition-colors py-2 border border-surface-border rounded-xl hover:bg-surface-hover"
                >
                  Close — view all states in table below
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- Section 2: Store Rankings Table --- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">
            Store Rankings
            {selectedState && (
              <span className="ml-2 text-sm font-normal text-text-muted">— filtered to {selectedState}</span>
            )}
          </h3>
          {selectedState && (
            <button
              onClick={() => setSelectedState(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-text-muted border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors"
            >
              <X className="w-3 h-3" />
              Clear Filter
            </button>
          )}
        </div>

        {/* Benchmark type selector + methodology */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Benchmark:</span>
          {[
            { key: 'portfolio', label: 'Portfolio Avg' },
            { key: 'state', label: 'State Avg' },
            { key: 'goal', label: 'Revenue Goal' },
          ].map(b => (
            <button
              key={b.key}
              onClick={() => setBenchmarkType(b.key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${benchmarkType === b.key ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/25' : 'text-text-muted border border-surface-border hover:text-text-secondary'}`}
            >
              {b.label}
            </button>
          ))}
          <button onClick={() => setShowBenchInfo(!showBenchInfo)} className="ml-1 text-text-muted hover:text-accent-gold transition-colors" title="How benchmarks are calculated">
            <Info size={13} />
          </button>
        </div>

        {showBenchInfo && (
          <div className="mb-3 rounded-xl border border-surface-border bg-surface-bg p-4 text-[11px] text-text-secondary leading-[1.8]">
            <p className="font-semibold text-text-primary mb-2">Benchmark Methodology</p>
            {benchmarkType === 'portfolio' && (
              <p><strong className="text-text-primary">Portfolio Average</strong> — Each store's revenue is compared to the average revenue across all stores in your selected portfolio. A store showing "+12.4%" means it generates 12.4% more revenue than the portfolio mean. <span className="text-text-muted">Source: Dutchie POS transaction data, aggregated across selected locations for the current date range.</span></p>
            )}
            {benchmarkType === 'state' && (
              <p><strong className="text-text-primary">State Average</strong> — Each store is compared to the average of other stores in the same state. This controls for state-level factors (market maturity, regulations, population density). An IL store is compared to other IL stores, not to MI stores. <span className="text-text-muted">Source: Dutchie POS transaction data, grouped by state.</span></p>
            )}
            {benchmarkType === 'goal' && (
              <p><strong className="text-text-primary">Revenue Goal</strong> — Each store is compared to its monthly revenue target set in Goal Planning. A store showing "-8.2%" is 8.2% below its goal for the current period. <span className="text-text-muted">Source: Operator-set goals in Goal Planning. Stores without goals show "—".</span></p>
            )}
            <p className="mt-2 text-text-muted">Note: Benchmark calculations use net revenue (after discounts). All comparisons are for the currently selected date range and store filter.</p>
          </div>
        )}

        <div className="bg-surface-card rounded-xl shadow-sm border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-bg border-b border-surface-divider">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">
                    #
                  </th>
                  <SortableHeader label="Location" column="name" />
                  <SortableHeader label="Revenue" column="revenue" />
                  <SortableHeader label="Txns" column="transactions" className="hidden md:table-cell" />
                  <SortableHeader label="Avg Basket" column="avgBasket" className="hidden md:table-cell" />
                  <SortableHeader label="Margin" column="margin" />
                  <SortableHeader label="Contrib. Margin" column="contribMargin" className="hidden md:table-cell" />
                  <th className="hidden lg:table-cell px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <SortableHeader label={benchmarkType === 'portfolio' ? 'vs Portfolio' : benchmarkType === 'state' ? 'vs State Avg' : 'vs Goal'} column="vsBenchmark" />
                      <button onClick={() => setShowBenchInfo(!showBenchInfo)} className="text-text-muted hover:text-accent-gold transition-colors" title="Benchmark methodology">
                        <Info size={11} />
                      </button>
                    </div>
                  </th>
                  <SortableHeader label="OOS SKUs %" column="stockOutRate" className="hidden lg:table-cell" />
                  <SortableHeader label="Discount %" column="discountRate" className="hidden lg:table-cell" />
                  <SortableHeader label="Aged Inv $" column="agedInventory" className="hidden xl:table-cell" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-divider">
                {displayedLocations.map((loc, idx) => {
                  const isExpanded = expandedStore === loc.name;
                  const insight = getStoreInsight(loc);

                  return (
                    <React.Fragment key={loc.name}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? '' : 'hover:bg-surface-hover'
                        }`}
                        style={isExpanded ? { background: 'color-mix(in srgb, var(--color-accent-green) 6%, transparent)' } : undefined}
                        onClick={() =>
                          setExpandedStore(isExpanded ? null : loc.name)
                        }
                      >
                        <td className="px-4 py-3 text-text-muted font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-text-primary">{loc.name}</p>
                            <p className="text-xs text-text-muted">
                              {loc.city}, {loc.state}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-primary font-medium">
                          {fmtRevenue(loc.revenue)}
                        </td>
                        <td className="px-4 py-3 text-text-primary font-medium hidden md:table-cell">
                          {loc.transactions.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-text-primary font-medium hidden md:table-cell">
                          ${loc.avgBasket.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${loc.margin >= 48 ? 'text-accent-green' : loc.margin >= 45 ? 'text-accent-gold' : 'text-accent-red'}`}>
                            {loc.margin}%
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {(() => {
                            const cm = Math.round((loc.margin - laborCostPct) * 10) / 10;
                            const cmColor = cm >= 25 ? 'text-accent-green' : cm >= 15 ? 'text-accent-gold' : 'text-accent-red';
                            return <span className={`font-semibold ${cmColor}`}>{cm}%</span>;
                          })()}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                            loc.vsBenchmark >= 0
                              ? 'text-accent-green'
                              : 'text-accent-red'
                          }`}
                            style={{
                              backgroundColor: loc.vsBenchmark >= 0
                                ? 'var(--color-accent-green-bg)'
                                : 'color-mix(in srgb, var(--color-accent-red) 10%, transparent)',
                            }}
                          >
                            {loc.vsBenchmark >= 0 ? '+' : ''}{loc.vsBenchmark}%
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`font-medium ${loc.stockOutRate >= 6 ? 'text-accent-red' : loc.stockOutRate >= 4 ? 'text-accent-gold' : 'text-text-primary'}`}>
                            {loc.stockOutRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`font-medium ${loc.discountRate > 18 ? 'text-accent-red' : loc.discountRate > 14 ? 'text-accent-gold' : 'text-text-primary'}`}>
                            {loc.discountRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className={`font-medium ${loc.agedInventory >= 14 ? 'text-accent-red' : loc.agedInventory >= 8 ? 'text-accent-gold' : 'text-text-primary'}`}>
                            ${loc.agedInventory}K
                          </span>
                        </td>
                      </tr>

                      {/* Expanded store detail row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={11} className="px-4 py-4 bg-surface-hover/50">
                            {/* Additional detail metrics (not repeated from table) */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Discount Rate</p>
                                <p className={`text-lg font-bold ${loc.discountRate > 18 ? 'text-accent-red' : loc.discountRate > 14 ? 'text-accent-gold' : 'text-text-primary'}`}>
                                  {loc.discountRate}%
                                </p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Online Order %</p>
                                <p className="text-lg font-bold text-text-primary">{loc.onlineOrderPct}%</p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Avg Fulfillment Time</p>
                                <p className={`text-lg font-bold ${loc.avgFulfillmentMin >= 18 ? 'text-accent-red' : loc.avgFulfillmentMin >= 14 ? 'text-accent-gold' : 'text-text-primary'}`}>
                                  {loc.avgFulfillmentMin} min
                                </p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Top Selling Category</p>
                                <p className="text-lg font-bold text-text-primary">{loc.topCategory}</p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Aged Inventory $</p>
                                <p className={`text-lg font-bold ${loc.agedInventory >= 14 ? 'text-accent-red' : loc.agedInventory >= 8 ? 'text-accent-gold' : 'text-text-primary'}`}>
                                  ${loc.agedInventory}K
                                </p>
                              </div>
                              {(() => {
                                const cm = Math.round((loc.margin - laborCostPct) * 10) / 10;
                                const cmColor = cm >= 25 ? 'text-accent-green' : cm >= 15 ? 'text-accent-gold' : 'text-accent-red';
                                return (
                                  <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                    <p className="text-xs text-text-secondary mb-1">Contrib. Margin</p>
                                    <p className={`text-lg font-bold ${cmColor}`}>{cm}%</p>
                                    <p className="text-[9px] text-text-muted">at {laborCostPct}% labor</p>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Insight callout */}
                            {insight && (
                              <div className={`flex items-start gap-2 rounded-lg border p-3 ${
                                insight.type === 'alert'
                                  ? 'border-accent-red/30'
                                  : insight.type === 'warning'
                                  ? 'border-accent-gold/30'
                                  : 'border-accent-green/30'
                              }`} style={{ background: insight.type === 'alert' ? 'color-mix(in srgb, var(--color-accent-red) 6%, transparent)' : insight.type === 'warning' ? 'color-mix(in srgb, var(--color-accent-gold) 6%, transparent)' : 'color-mix(in srgb, var(--color-accent-green) 6%, transparent)' }}>
                                {insight.type === 'alert' ? (
                                  <AlertTriangle className="w-4 h-4 text-accent-red mt-0.5 shrink-0" />
                                ) : insight.type === 'warning' ? (
                                  <AlertTriangle className="w-4 h-4 text-accent-gold mt-0.5 shrink-0" />
                                ) : (
                                  <Info className="w-4 h-4 text-accent-green mt-0.5 shrink-0" />
                                )}
                                <p className={`text-sm font-medium ${
                                  insight.type === 'alert'
                                    ? 'text-accent-red'
                                    : insight.type === 'warning'
                                    ? 'text-accent-gold'
                                    : 'text-accent-green'
                                }`}>
                                  {insight.text}
                                </p>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-divider">
                              <button onClick={() => navigate('/inventory', { state: { store: loc.name } })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors">
                                <Package className="w-3.5 h-3.5" /> View Inventory
                              </button>
                              <button onClick={() => navigate('/agents/bridge', { state: { store: loc.name, question: `Tell me about ${loc.name}` } })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-gold/10 text-accent-gold border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors">
                                <Sparkles className="w-3.5 h-3.5" /> Ask Dex
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-[10px] text-text-muted mt-2 px-1 leading-relaxed">
          Contribution margin = Gross Margin % minus estimated labor cost. Set your labor % above. Dutchie does not track payroll data.
        </p>
      </section>

      {/* --- Section 3: Insight Callouts Summary --- */}
      {(() => {
        const storesWithInsights = sortedLocations
          .map((loc) => ({ ...loc, insight: getStoreInsight(loc) }))
          .filter((loc) => loc.insight && (loc.insight.type === 'alert' || loc.insight.type === 'warning'));
        if (storesWithInsights.length === 0) return null;

        const borderColorMap = { red: 'border-accent-red', gold: 'border-accent-gold', blue: 'border-accent-blue' };
        const textColorMap = { red: 'text-accent-red', gold: 'text-accent-gold', blue: 'text-accent-blue' };
        const iconColorMap = { red: 'text-accent-red', gold: 'text-accent-gold', blue: 'text-accent-blue' };

        return (
          <section>
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-red" />
              Attention Needed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storesWithInsights.map((loc) => {
                const insightColor = loc.insight.color || 'red';
                return (
                  <div
                    key={loc.name}
                    className={`bg-surface-card rounded-xl border-l-4 border p-4 ${borderColorMap[insightColor] || 'border-surface-border'}`}
                    style={{ borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-text-primary">{loc.name}</p>
                        <p className="text-xs text-text-muted">{loc.city}, {loc.state}</p>
                      </div>
                      <AlertTriangle className={`w-4 h-4 shrink-0 ${iconColorMap[insightColor] || 'text-accent-red'}`} />
                    </div>
                    <p className={`text-sm font-medium ${textColorMap[insightColor] || 'text-accent-red'}`}>{loc.insight.text}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                      <span>Rev: {fmtRevenue(loc.revenue)}</span>
                      <span>Margin: {loc.margin}%</span>
                      <span>Bench: {loc.vsBenchmark >= 0 ? '+' : ''}{loc.vsBenchmark}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-divider">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedStore(loc.name); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" /> View Store Detail
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/agents/bridge', { state: { store: loc.name, question: `Analyze issues at ${loc.name}` } }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-gold/10 text-accent-gold border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Ask Dex
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}
    </div>
    </PageSkeleton>
  );
}
