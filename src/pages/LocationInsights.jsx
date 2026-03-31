import React, { useState, useMemo } from 'react';
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
  Info,
} from 'lucide-react';
import { locations } from '../data/mockData';
import { useStores } from '../contexts/StoreContext';
import { useDateRange } from '../contexts/DateRangeContext';

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

  return {
    name: loc.name, state: loc.state, city: loc.city,
    revenue, transactions, avgBasket, margin, vsBenchmark,
    skuCount, daysOnHand, stockOutRate, turnoverRate, wowDelta,
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
    return { type: 'alert', text: `Revenue trending down ${Math.abs(store.wowDelta)}% WoW` };
  }
  // High stock-out rate
  if (store.stockOutRate >= 6) {
    return { type: 'warning', text: `Stock-out rate at ${store.stockOutRate}% — replenishment needed` };
  }
  // Low margin
  if (store.margin < 44) {
    return { type: 'warning', text: `Margin at ${store.margin}% — below target threshold` };
  }
  // Strong revenue growth
  if (store.wowDelta >= 12) {
    return { type: 'positive', text: `Revenue up ${store.wowDelta}% WoW — strong momentum` };
  }
  // Above benchmark
  if (store.vsBenchmark >= 15) {
    return { type: 'positive', text: `Outperforming benchmark by +${store.vsBenchmark}%` };
  }
  // Low inventory days
  if (store.daysOnHand <= 16) {
    return { type: 'warning', text: `Only ${store.daysOnHand} days of inventory on hand` };
  }
  // Below benchmark
  if (store.vsBenchmark <= -5) {
    return { type: 'alert', text: `Underperforming benchmark by ${store.vsBenchmark}%` };
  }
  return null;
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function LocationInsights() {
  const [sortKey, setSortKey] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedStore, setExpandedStore] = useState(null);
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
        default:
          valA = a.revenue; valB = b.revenue; break;
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
    return sorted;
  }, [filteredLocations, sortKey, sortDir]);

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
    <div className="space-y-8">
      {/* --- Section 1: Header --- */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <MapPin className="w-6 h-6 text-accent-green" />
          Store Performance
        </h2>
        <p className="text-text-secondary mt-1">
          Performance metrics across your dispensary locations — {rangeLabel}
        </p>
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

      {/* --- Section 2: Store Rankings Table --- */}
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Store Rankings</h3>
        <div className="bg-surface-card rounded-xl shadow-sm border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-bg border-b border-surface-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">
                    #
                  </th>
                  <SortableHeader label="Location" column="name" />
                  <SortableHeader label="Revenue" column="revenue" />
                  <SortableHeader label="Txns" column="transactions" className="hidden md:table-cell" />
                  <SortableHeader label="Avg Basket" column="avgBasket" className="hidden md:table-cell" />
                  <SortableHeader label="Margin" column="margin" />
                  <SortableHeader label="vs Bench" column="vsBenchmark" className="hidden lg:table-cell" />
                  <SortableHeader label="Stock-Out" column="stockOutRate" className="hidden lg:table-cell" />
                  <SortableHeader label="Days OH" column="daysOnHand" className="hidden xl:table-cell" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {sortedLocations.map((loc, idx) => {
                  const isExpanded = expandedStore === loc.name;
                  const insight = getStoreInsight(loc);

                  return (
                    <React.Fragment key={loc.name}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-[rgba(0,194,124,0.06)]' : 'hover:bg-surface-hover'
                        }`}
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
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className={`font-medium ${loc.daysOnHand <= 16 ? 'text-accent-red' : loc.daysOnHand <= 20 ? 'text-accent-gold' : 'text-text-primary'}`}>
                            {loc.daysOnHand}d
                          </span>
                        </td>
                      </tr>

                      {/* Expanded store detail row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="px-4 py-4 bg-surface-hover/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Revenue</p>
                                <p className="text-lg font-bold text-text-primary">{fmtRevenue(loc.revenue)}</p>
                                <p className={`text-xs font-medium mt-0.5 ${loc.wowDelta >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                  {loc.wowDelta >= 0 ? '+' : ''}{loc.wowDelta}% WoW
                                </p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Transactions</p>
                                <p className="text-lg font-bold text-text-primary">{loc.transactions.toLocaleString()}</p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Avg Basket</p>
                                <p className="text-lg font-bold text-text-primary">${loc.avgBasket.toFixed(2)}</p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">Margin</p>
                                <p className={`text-lg font-bold ${loc.margin >= 48 ? 'text-accent-green' : loc.margin >= 45 ? 'text-accent-gold' : 'text-accent-red'}`}>
                                  {loc.margin}%
                                </p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">vs Benchmark</p>
                                <p className={`text-lg font-bold ${loc.vsBenchmark >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                  {loc.vsBenchmark >= 0 ? '+' : ''}{loc.vsBenchmark}%
                                </p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <p className="text-xs text-text-secondary mb-1">SKU Count</p>
                                <p className="text-lg font-bold text-text-primary">{loc.skuCount}</p>
                              </div>
                            </div>

                            {/* Inventory row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Package className="w-3.5 h-3.5 text-text-muted" />
                                  <p className="text-xs text-text-secondary">Days on Hand</p>
                                </div>
                                <p className={`text-lg font-bold ${loc.daysOnHand <= 16 ? 'text-accent-red' : loc.daysOnHand <= 20 ? 'text-accent-gold' : 'text-text-primary'}`}>
                                  {loc.daysOnHand} days
                                </p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Package className="w-3.5 h-3.5 text-text-muted" />
                                  <p className="text-xs text-text-secondary">Stock-Out Rate</p>
                                </div>
                                <p className={`text-lg font-bold ${loc.stockOutRate >= 6 ? 'text-accent-red' : loc.stockOutRate >= 4 ? 'text-accent-gold' : 'text-accent-green'}`}>
                                  {loc.stockOutRate}%
                                </p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Package className="w-3.5 h-3.5 text-text-muted" />
                                  <p className="text-xs text-text-secondary">Turnover Rate</p>
                                </div>
                                <p className="text-lg font-bold text-text-primary">{loc.turnoverRate}x</p>
                              </div>
                              <div className="bg-surface-card rounded-lg border border-surface-border p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Package className="w-3.5 h-3.5 text-text-muted" />
                                  <p className="text-xs text-text-secondary">Active SKUs</p>
                                </div>
                                <p className="text-lg font-bold text-text-primary">{loc.skuCount}</p>
                              </div>
                            </div>

                            {/* Insight callout */}
                            {insight && (
                              <div className={`flex items-start gap-2 rounded-lg border p-3 ${
                                insight.type === 'alert'
                                  ? 'border-accent-red/30 bg-[rgba(232,112,104,0.06)]'
                                  : insight.type === 'warning'
                                  ? 'border-accent-gold/30 bg-[rgba(212,160,58,0.06)]'
                                  : 'border-accent-green/30 bg-[rgba(0,194,124,0.06)]'
                              }`}>
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
      </section>

      {/* --- Section 3: Insight Callouts Summary --- */}
      {(() => {
        const storesWithInsights = sortedLocations
          .map((loc) => ({ ...loc, insight: getStoreInsight(loc) }))
          .filter((loc) => loc.insight && loc.insight.type === 'alert');
        if (storesWithInsights.length === 0) return null;
        return (
          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-red" />
              Attention Needed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storesWithInsights.map((loc) => (
                <div
                  key={loc.name}
                  className="bg-surface-card rounded-xl border border-surface-border p-4 cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => setExpandedStore(loc.name)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-text-primary">{loc.name}</p>
                      <p className="text-xs text-text-muted">{loc.city}, {loc.state}</p>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-accent-red shrink-0" />
                  </div>
                  <p className="text-sm text-accent-red font-medium">{loc.insight.text}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                    <span>Rev: {fmtRevenue(loc.revenue)}</span>
                    <span>Margin: {loc.margin}%</span>
                    <span>Bench: {loc.vsBenchmark >= 0 ? '+' : ''}{loc.vsBenchmark}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
