import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, TrendingDown, TrendingUp, ChevronLeft, Calendar, DollarSign, BarChart3, Layers, Archive, Award, Tag, Star, ShieldCheck, ShieldAlert, Clock, Truck, Zap, PieChart } from 'lucide-react';
import { locations } from '../data/mockData';
import { usePersona } from '../contexts/PersonaContext';
import { useStores } from '../contexts/StoreContext';
import { PageSkeleton } from '../components/common/PageSkeleton';
import {
  _seedRng,
  fmtDollar,
  PRODUCT_CATALOG,
  ALL_STORE_INVENTORY,
  CALENDAR_EVENTS,
  generateReorderSuggestions,
  generateDemandForecasts,
} from '../data/inventoryData';

// ---------------------------------------------------------------------------
// StockOut Impact Panel
// ---------------------------------------------------------------------------
function StockOutImpactPanel({ stores }) {
  const impacts = useMemo(() => {
    const items = [];
    stores.forEach(store => {
      store.products.forEach(p => {
        if (p.status === 'oos') {
          items.push({
            storeName: store.name,
            product: p.name,
            brand: p.brand,
            category: p.category,
            daysOOS: p.daysOOS,
            estLostPerDay: p.estLostPerDay,
            totalLost: Math.round(p.estLostPerDay * p.daysOOS),
            lastSoldDate: p.lastSoldDate,
          });
        }
      });
    });
    return items.sort((a, b) => b.totalLost - a.totalLost).slice(0, 10);
  }, [stores]);

  const totalCumulativeLost = impacts.reduce((s, i) => s + i.totalLost, 0);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-divider flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-accent-red" />
          <h3 className="text-[15px] font-bold text-text-primary">Stock-Out Impact Analysis</h3>
        </div>
        <span className="text-[12px] font-semibold text-accent-red bg-accent-red/10 px-3 py-1 rounded-lg border border-accent-red/15">
          {fmtDollar(totalCumulativeLost)} cumulative lost
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-surface-bg text-text-secondary uppercase tracking-wider text-[10px]">
              <th className="px-4 py-2 text-left font-semibold">Product</th>
              <th className="px-4 py-2 text-left font-semibold">Store</th>
              <th className="px-4 py-2 text-center font-semibold">Days OOS</th>
              <th className="px-4 py-2 text-right font-semibold">Lost/Day</th>
              <th className="px-4 py-2 text-right font-semibold">Total Lost</th>
              <th className="px-4 py-2 text-right font-semibold">Last Sold</th>
            </tr>
          </thead>
          <tbody>
            {impacts.map((item, i) => (
              <tr key={i} className="border-b border-surface-divider hover:bg-surface-muted transition-colors">
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-text-primary">{item.product}</p>
                  <p className="text-[10px] text-text-muted">{item.brand} - {item.category}</p>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{item.storeName}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`font-bold ${item.daysOOS > 14 ? 'text-accent-red' : 'text-accent-gold'}`}>{item.daysOOS}d</span>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-accent-red">{fmtDollar(item.estLostPerDay)}</td>
                <td className="px-4 py-2.5 text-right font-bold text-accent-red">{fmtDollar(item.totalLost)}</td>
                <td className="px-4 py-2.5 text-right text-text-muted">{item.lastSoldDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proactive Reorder Panel
// ---------------------------------------------------------------------------
function ProactiveReorderPanel({ stores }) {
  const suggestions = useMemo(() => generateReorderSuggestions(stores), [stores]);
  const totalPOValue = suggestions.reduce((s, r) => s + r.reorderValue, 0);
  const totalMargin = suggestions.reduce((s, r) => s + r.estMarginOnPO, 0);

  const urgencyColors = {
    critical: { bg: 'bg-accent-red/10', text: 'text-accent-red', border: 'border-accent-red/20', label: 'Critical' },
    overdue: { bg: 'bg-accent-gold/10', text: 'text-accent-gold', border: 'border-accent-gold/20', label: 'Overdue' },
    upcoming: { bg: 'bg-accent-blue/10', text: 'text-accent-blue', border: 'border-accent-blue/20', label: 'Upcoming' },
  };

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-divider flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-accent-green" />
          <h3 className="text-[15px] font-bold text-text-primary">Proactive Reorder Suggestions</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-accent-green bg-accent-green/10 px-3 py-1 rounded-lg border border-accent-green/15">
            {fmtDollar(totalPOValue)} suggested PO
          </span>
          <span className="text-[12px] font-semibold text-accent-purple bg-accent-purple/10 px-3 py-1 rounded-lg border border-accent-purple/15">
            {fmtDollar(totalMargin)} est. margin
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-surface-bg text-text-secondary uppercase tracking-wider text-[10px]">
              <th className="px-4 py-2 text-left font-semibold">Product</th>
              <th className="px-4 py-2 text-left font-semibold">Store</th>
              <th className="px-4 py-2 text-center font-semibold">Urgency</th>
              <th className="px-4 py-2 text-center font-semibold">Current Supply</th>
              <th className="px-4 py-2 text-center font-semibold">Lead Time</th>
              <th className="px-4 py-2 text-right font-semibold">Suggested Qty</th>
              <th className="px-4 py-2 text-right font-semibold">PO Value</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((item, i) => {
              const uc = urgencyColors[item.urgency];
              return (
                <tr key={i} className="border-b border-surface-divider hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-text-primary">{item.product}</p>
                    <p className="text-[10px] text-text-muted">{item.brand} - {item.category}</p>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{item.storeName}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${uc.bg} ${uc.text} border ${uc.border}`}>
                      {uc.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold text-text-primary">{item.currentSupply.toFixed(1)}d</td>
                  <td className="px-4 py-2.5 text-center text-text-secondary">{item.leadTimeDays}d</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-text-primary">{item.reorderQty} units</td>
                  <td className="px-4 py-2.5 text-right font-bold text-accent-green">{fmtDollar(item.reorderValue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demand Forecast Panel
// ---------------------------------------------------------------------------
function DemandForecastPanel({ stores }) {
  const forecasts = useMemo(() => generateDemandForecasts(stores), [stores]);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-divider flex items-center gap-2">
        <TrendingUp size={18} className="text-accent-blue" />
        <h3 className="text-[15px] font-bold text-text-primary">4-Week Demand Forecast by Category</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
        {forecasts.map((fc) => (
          <div key={fc.category} className="rounded-lg border border-surface-border bg-surface-bg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-bold text-text-primary">{fc.category}</h4>
              <span className={`text-[11px] font-bold ${fc.growthPct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {fc.growthPct >= 0 ? '+' : ''}{fc.growthPct}%
              </span>
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-text-muted">Current Weekly</span>
                <span className="font-semibold text-text-primary">{fc.currentWeekly} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Projected Weekly</span>
                <span className="font-semibold text-accent-blue">{fc.projectedWeekly} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Suggested PO Value</span>
                <span className="font-bold text-accent-green">{fmtDollar(fc.suggestedPOValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Active SKUs</span>
                <span className="text-text-secondary">{fc.productCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar Planning Panel
// ---------------------------------------------------------------------------
function CalendarPlanningPanel() {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-divider flex items-center gap-2">
        <Calendar size={18} className="text-accent-gold" />
        <h3 className="text-[15px] font-bold text-text-primary">Upcoming High-Demand Events</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
        {CALENDAR_EVENTS.map((event) => (
          <div key={event.name} className="rounded-lg border border-surface-border bg-surface-bg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent-gold/10 border border-accent-gold/20">
                <span className="text-[11px] font-bold text-accent-gold">{event.icon}</span>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-text-primary">{event.name}</h4>
                <p className="text-[11px] text-text-muted">{event.date} -- {event.daysAway} days away</p>
              </div>
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-text-muted">Demand Multiplier</span>
                <span className="font-bold text-accent-gold">{event.multiplier}x</span>
              </div>
              <div>
                <span className="text-text-muted">Impacted Categories:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {event.categories.map(cat => (
                    <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/15">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Mix Panel
// ---------------------------------------------------------------------------
function CategoryMixPanel({ stores }) {
  const catData = useMemo(() => {
    const agg = {};
    stores.forEach(store => {
      store.products.forEach(p => {
        if (!agg[p.category]) agg[p.category] = { units: 0, revenue: 0, skus: 0, oos: 0 };
        agg[p.category].units += p.floor + p.vault;
        agg[p.category].revenue += p.avgWeekly * p.price;
        agg[p.category].skus += 1;
        if (p.status === 'oos') agg[p.category].oos += 1;
      });
    });
    const totalRevenue = Object.values(agg).reduce((s, a) => s + a.revenue, 0);
    return Object.entries(agg).map(([cat, data]) => ({
      category: cat,
      ...data,
      pct: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 1000) / 10 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [stores]);

  const catColors = {
    Flower: 'var(--color-accent-green)',
    Vapes: 'var(--color-accent-blue)',
    Edibles: 'var(--color-accent-gold)',
    'Pre-Rolls': 'var(--color-accent-purple)',
    Concentrates: 'var(--color-accent-red)',
    Topicals: 'var(--color-accent-pink, #e879a8)',
  };

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-divider flex items-center gap-2">
        <PieChart size={18} className="text-accent-purple" />
        <h3 className="text-[15px] font-bold text-text-primary">Category Revenue Mix</h3>
      </div>
      <div className="p-5">
        {/* Stacked bar */}
        <div className="flex h-6 rounded-lg overflow-hidden mb-4">
          {catData.map(c => (
            <div
              key={c.category}
              style={{ width: `${c.pct}%`, background: catColors[c.category] || 'var(--color-accent-blue)', minWidth: c.pct > 0 ? '4px' : '0' }}
              title={`${c.category}: ${c.pct}%`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {catData.map(c => (
            <div key={c.category} className="flex items-center gap-3 p-3 rounded-lg bg-surface-bg border border-surface-border">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: catColors[c.category] || 'var(--color-accent-blue)' }} />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-text-primary truncate">{c.category}</p>
                <p className="text-[11px] text-text-muted">{c.pct}% -- {c.skus} SKUs{c.oos > 0 ? ` -- ${c.oos} OOS` : ''}</p>
                <p className="text-[11px] font-semibold" style={{ color: catColors[c.category] }}>{fmtDollar(c.revenue)}/wk</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aging Stock Panel
// ---------------------------------------------------------------------------
function AgingStockPanel({ stores }) {
  const agingItems = useMemo(() => {
    const items = [];
    stores.forEach(store => {
      store.products.forEach(p => {
        if (p.status === 'ok' && p.daysSupply > 30) {
          items.push({
            storeName: store.name,
            product: p.name,
            brand: p.brand,
            category: p.category,
            daysSupply: p.daysSupply,
            onHand: p.floor + p.vault,
            avgWeekly: p.avgWeekly,
            value: (p.floor + p.vault) * p.price,
          });
        }
      });
    });
    return items.sort((a, b) => b.daysSupply - a.daysSupply).slice(0, 10);
  }, [stores]);

  const totalTiedUp = agingItems.reduce((s, i) => s + i.value, 0);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-divider flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive size={18} className="text-accent-gold" />
          <h3 className="text-[15px] font-bold text-text-primary">Aging / Overstocked Inventory</h3>
        </div>
        <span className="text-[12px] font-semibold text-accent-gold bg-accent-gold/10 px-3 py-1 rounded-lg border border-accent-gold/15">
          {fmtDollar(totalTiedUp)} tied up
        </span>
      </div>
      {agingItems.length === 0 ? (
        <div className="p-8 text-center text-text-muted text-[13px]">No slow-moving inventory detected (all items under 30 days supply)</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-surface-bg text-text-secondary uppercase tracking-wider text-[10px]">
                <th className="px-4 py-2 text-left font-semibold">Product</th>
                <th className="px-4 py-2 text-left font-semibold">Store</th>
                <th className="px-4 py-2 text-center font-semibold">Days Supply</th>
                <th className="px-4 py-2 text-center font-semibold">On Hand</th>
                <th className="px-4 py-2 text-center font-semibold">Avg/Wk</th>
                <th className="px-4 py-2 text-right font-semibold">Value Tied Up</th>
              </tr>
            </thead>
            <tbody>
              {agingItems.map((item, i) => (
                <tr key={i} className="border-b border-surface-divider hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-text-primary">{item.product}</p>
                    <p className="text-[10px] text-text-muted">{item.brand} - {item.category}</p>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{item.storeName}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="font-bold text-accent-gold">{item.daysSupply > 90 ? '90+' : item.daysSupply.toFixed(0)}d</span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-text-primary font-semibold">{item.onHand}</td>
                  <td className="px-4 py-2.5 text-center text-text-secondary">{item.avgWeekly}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-accent-gold">{fmtDollar(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vendor Scorecard Panel
// ---------------------------------------------------------------------------
function VendorScorecardPanel({ stores }) {
  const vendors = useMemo(() => {
    const agg = {};
    const rng = _seedRng(77777);
    stores.forEach(store => {
      store.products.forEach(p => {
        if (!agg[p.brand]) agg[p.brand] = { brand: p.brand, totalSKUs: 0, oosSKUs: 0, revenue: 0, fillRate: 0 };
        agg[p.brand].totalSKUs += 1;
        if (p.status === 'oos') agg[p.brand].oosSKUs += 1;
        agg[p.brand].revenue += p.avgWeekly * p.price;
      });
    });
    return Object.values(agg).map(v => ({
      ...v,
      oosRate: v.totalSKUs > 0 ? Math.round((v.oosSKUs / v.totalSKUs) * 1000) / 10 : 0,
      fillRate: Math.round((85 + rng() * 14) * 10) / 10,
      avgLeadDays: Math.round(3 + rng() * 8),
      onTimeRate: Math.round((80 + rng() * 18) * 10) / 10,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [stores]);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-divider flex items-center gap-2">
        <Award size={18} className="text-accent-green" />
        <h3 className="text-[15px] font-bold text-text-primary">Vendor Scorecard</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-surface-bg text-text-secondary uppercase tracking-wider text-[10px]">
              <th className="px-4 py-2 text-left font-semibold">Vendor / Brand</th>
              <th className="px-4 py-2 text-center font-semibold">SKUs</th>
              <th className="px-4 py-2 text-center font-semibold">OOS Rate</th>
              <th className="px-4 py-2 text-center font-semibold">Fill Rate</th>
              <th className="px-4 py-2 text-center font-semibold">Avg Lead</th>
              <th className="px-4 py-2 text-center font-semibold">On-Time %</th>
              <th className="px-4 py-2 text-right font-semibold">Weekly Rev</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v, i) => (
              <tr key={i} className="border-b border-surface-divider hover:bg-surface-muted transition-colors">
                <td className="px-4 py-2.5 font-semibold text-text-primary">{v.brand}</td>
                <td className="px-4 py-2.5 text-center text-text-secondary">{v.totalSKUs}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`font-bold ${v.oosRate > 15 ? 'text-accent-red' : v.oosRate > 5 ? 'text-accent-gold' : 'text-accent-green'}`}>
                    {v.oosRate}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`font-bold ${v.fillRate >= 95 ? 'text-accent-green' : v.fillRate >= 90 ? 'text-accent-gold' : 'text-accent-red'}`}>
                    {v.fillRate}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center text-text-secondary">{v.avgLeadDays}d</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`font-bold ${v.onTimeRate >= 95 ? 'text-accent-green' : v.onTimeRate >= 85 ? 'text-accent-gold' : 'text-accent-red'}`}>
                    {v.onTimeRate}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-accent-green">{fmtDollar(v.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page — Inventory Analytics (planning view)
// ---------------------------------------------------------------------------
export default function InventoryAnalytics() {
  const { selectedPersona } = usePersona();
  const { selectedStoreNames } = useStores();

  // Filter stores by persona/store selection
  const visibleStores = useMemo(() => {
    let stores = ALL_STORE_INVENTORY;

    if (selectedPersona.storeFilter) {
      if (selectedPersona.storeFilter.states) {
        stores = stores.filter(s => selectedPersona.storeFilter.states.includes(s.state));
      }
      if (selectedPersona.storeFilter.store) {
        stores = stores.filter(s => s.name === selectedPersona.storeFilter.store);
      }
    }

    if (selectedStoreNames.size > 0 && selectedStoreNames.size < locations.length) {
      stores = stores.filter(s => selectedStoreNames.has(s.name));
    }

    return stores;
  }, [selectedPersona, selectedStoreNames]);

  // Summary KPIs for the analytics header
  const kpis = useMemo(() => {
    const allProducts = visibleStores.flatMap(s => s.products);
    const oosCount = allProducts.filter(p => p.status === 'oos').length;
    const totalLost = allProducts.reduce((sum, p) => sum + p.estLostPerDay, 0);
    const inStockProducts = allProducts.filter(p => p.status !== 'oos' && p.daysSupply < 900);
    const avgDaysOfSupply = inStockProducts.length > 0
      ? Math.round((inStockProducts.reduce((sum, p) => sum + p.daysSupply, 0) / inStockProducts.length) * 10) / 10
      : 0;
    return { oosCount, totalLost, avgDaysOfSupply, storeCount: visibleStores.length };
  }, [visibleStores]);

  return (
    <PageSkeleton>
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={22} className="text-accent-purple" />
            Inventory Planning
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Forecasting, category mix, vendor scorecards, and stock-out impact across {kpis.storeCount} locations
          </p>
        </div>
        <Link
          to="/inventory"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-accent-gold/10 text-accent-gold border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={14} />
          <Package size={16} />
          Back to Inventory
        </Link>
      </div>

      {/* Mini KPI summary bar */}
      <div className="flex items-center gap-6 rounded-xl border border-surface-border bg-surface-card px-5 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-accent-red" />
          <span className="text-[12px] text-text-muted">OOS:</span>
          <span className="text-[13px] font-bold text-accent-red">{kpis.oosCount}</span>
        </div>
        <div className="w-px h-4 bg-surface-border" />
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-accent-gold" />
          <span className="text-[12px] text-text-muted">Daily Lost:</span>
          <span className="text-[13px] font-bold text-accent-gold">{fmtDollar(kpis.totalLost)}</span>
        </div>
        <div className="w-px h-4 bg-surface-border" />
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-accent-purple" />
          <span className="text-[12px] text-text-muted">Avg Supply:</span>
          <span className="text-[13px] font-bold text-accent-purple">{kpis.avgDaysOfSupply}d</span>
        </div>
      </div>

      {/* Analytics Panels */}
      <StockOutImpactPanel stores={visibleStores} />
      <ProactiveReorderPanel stores={visibleStores} />
      <DemandForecastPanel stores={visibleStores} />
      <CalendarPlanningPanel />
      <CategoryMixPanel stores={visibleStores} />
      <AgingStockPanel stores={visibleStores} />
      <VendorScorecardPanel stores={visibleStores} />
    </div>
    </PageSkeleton>
  );
}
