import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, ArrowRightLeft, ShoppingCart, ChevronDown, ChevronRight, Filter, ArrowUpDown, TrendingDown, TrendingUp, Warehouse, Truck, ClipboardList, Check, RotateCw, Clock, Calendar, DollarSign, BarChart3, Zap, Star } from 'lucide-react';
import { locations } from '../data/mockData';
import { usePersona } from '../contexts/PersonaContext';
import { useStores } from '../contexts/StoreContext';
import ConfirmationDrawer from '../components/common/ConfirmationDrawer';

// ---------------------------------------------------------------------------
// Seeded RNG (same algo as NexusHome)
// ---------------------------------------------------------------------------
function _seedRng(seed) {
  let s = seed | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function fmtDollar(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${Math.round(v).toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Product Catalog — 25 cannabis products across 6 categories
// ---------------------------------------------------------------------------
const PRODUCT_CATALOG = [
  // Flower (6)
  { name: 'Blue Dream 3.5g', brand: 'Ozone', category: 'Flower', price: 45 },
  { name: 'Gelato 3.5g', brand: 'Cookies', category: 'Flower', price: 55 },
  { name: 'OG Kush 7g', brand: 'Ozone Reserve', category: 'Flower', price: 80 },
  { name: 'Wedding Cake 3.5g', brand: 'Simply Herb', category: 'Flower', price: 35 },
  { name: 'Purple Punch 3.5g', brand: 'Common Goods', category: 'Flower', price: 30 },
  { name: 'Jack Herer 7g', brand: 'Ozone', category: 'Flower', price: 75 },
  // Pre-Rolls (4)
  { name: 'Baby Jeeter Infused 5pk', brand: 'Jeeter', category: 'Pre-Rolls', price: 40 },
  { name: 'Blunt 2pk Indica', brand: 'Tunnel Vision', category: 'Pre-Rolls', price: 28 },
  { name: 'Diamond Infused Pre-Roll', brand: 'Jeeter', category: 'Pre-Rolls', price: 22 },
  { name: 'Classic Pre-Roll 3pk', brand: 'Simply Herb', category: 'Pre-Rolls', price: 18 },
  // Vapes (5)
  { name: 'Live Resin Pod 1g', brand: 'STIIIZY', category: 'Vapes', price: 55 },
  { name: 'CDT Pod 0.5g', brand: 'STIIIZY', category: 'Vapes', price: 35 },
  { name: 'Xeno Disposable 1g', brand: 'Alien Labs', category: 'Vapes', price: 48 },
  { name: 'Bagio Punch Cart 1g', brand: 'Alien Labs', category: 'Vapes', price: 52 },
  { name: 'All-in-One Disposable 0.3g', brand: 'Ozone', category: 'Vapes', price: 25 },
  // Edibles (5)
  { name: 'Camino Gummies 100mg', brand: 'Kiva', category: 'Edibles', price: 22 },
  { name: 'Lost Farm Chews 100mg', brand: 'Kiva', category: 'Edibles', price: 24 },
  { name: 'Raspberry Gummies 100mg', brand: 'Wyld', category: 'Edibles', price: 18 },
  { name: 'Marionberry Gummies 100mg', brand: 'Wyld', category: 'Edibles', price: 18 },
  { name: 'Chocolate Bar 100mg', brand: 'Kiva', category: 'Edibles', price: 20 },
  // Concentrates (3)
  { name: 'Live Resin Badder 1g', brand: 'Ozone Reserve', category: 'Concentrates', price: 45 },
  { name: 'Diamonds & Sauce 1g', brand: 'Ozone Reserve', category: 'Concentrates', price: 60 },
  { name: 'Cured Resin Shatter 1g', brand: 'Common Goods', category: 'Concentrates', price: 30 },
  // Topicals (2)
  { name: 'Relief Balm 200mg', brand: 'Kiva', category: 'Topicals', price: 32 },
  { name: 'Transdermal Patch 40mg', brand: 'Common Goods', category: 'Topicals', price: 18 },
];

// ---------------------------------------------------------------------------
// Generate deterministic per-store inventory
// ---------------------------------------------------------------------------
function generateStoreInventory(loc, storeIndex) {
  const rng = _seedRng(storeIndex * 8731 + 137);
  const numProducts = 8 + Math.floor(rng() * 5); // 8-12 SKUs per store
  const isOutlet = loc.name.includes('Outlet');

  // Pick products deterministically
  const shuffled = [...PRODUCT_CATALOG].sort(() => rng() - 0.5);
  const picked = shuffled.slice(0, numProducts);

  return picked.map((product, pi) => {
    const r = _seedRng(storeIndex * 4219 + pi * 997 + 53);
    const avgWeekly = Math.round((3 + r() * 25) * (isOutlet ? 0.6 : 1));
    const roll = r();

    let floor, vault;
    if (roll < 0.12) {
      // OOS: floor=0, maybe vault
      floor = 0;
      vault = r() < 0.6 ? Math.round(2 + r() * 10) : 0;
    } else if (roll < 0.30) {
      // Low stock
      floor = Math.round(1 + r() * (avgWeekly * 0.4));
      vault = Math.round(r() * 8);
    } else {
      // Normal
      floor = Math.round(avgWeekly * (0.8 + r() * 1.5));
      vault = Math.round(r() * 15);
    }

    const daysSupply = avgWeekly > 0 ? Math.round(((floor + vault) / (avgWeekly / 7)) * 10) / 10 : 999;
    const estLostPerDay = floor === 0 ? Math.round((avgWeekly / 7) * product.price * 100) / 100 : 0;

    // Status
    let status;
    if (floor === 0) status = 'oos';
    else if (daysSupply < 3) status = 'critical';
    else if (daysSupply < 7) status = 'low';
    else status = 'ok';

    // METRC package tag (24-char numeric format: 1A4 + 21 digits)
    const tagNum = String(4060300000 + storeIndex * 1000 + pi + 1).padStart(21, '0');
    const metrcPkg = `1A4${tagNum}`;

    // Per-product enriched metrics (Phase 4.3)
    const velocityR = _seedRng(storeIndex * 2347 + pi * 613);
    const velocityTrend = Array.from({ length: 8 }, () => Math.max(1, Math.round(avgWeekly * (0.6 + velocityR() * 0.8))));
    const categoryProducts = PRODUCT_CATALOG.filter(p => p.category === product.category);
    const categoryRank = Math.min(categoryProducts.length, 1 + Math.floor(velocityR() * categoryProducts.length));
    const revenueContribution = Math.round((avgWeekly * product.price * 100) / (PRODUCT_CATALOG.reduce((s, p) => s + 15 * p.price, 0))) / 100;

    return {
      ...product,
      floor,
      vault,
      avgWeekly,
      daysSupply,
      estLostPerDay,
      status,
      metrcPkg,
      velocityTrend,
      categoryRank,
      categoryTotal: categoryProducts.length,
      revenueContribution: Math.max(0.3, Math.min(8.5, revenueContribution * 100)),
    };
  });
}

// ---------------------------------------------------------------------------
// Build all store data
// ---------------------------------------------------------------------------
const ALL_STORE_INVENTORY = locations.map((loc, i) => {
  const products = generateStoreInventory(loc, i);
  const oosCount = products.filter(p => p.status === 'oos').length;
  const lowCount = products.filter(p => p.status === 'low' || p.status === 'critical').length;
  const totalLost = products.reduce((sum, p) => sum + p.estLostPerDay, 0);
  const vaultReady = products.filter(p => p.floor === 0 && p.vault > 0).length;
  return { ...loc, products, oosCount, lowCount, totalLost, vaultReady };
});

// State list from locations
const ALL_STATES = [...new Set(locations.map(l => l.state))].sort();

// ---------------------------------------------------------------------------
// Calendar-Aware Holiday Data (Phase 4.3)
// ---------------------------------------------------------------------------
const CALENDAR_EVENTS = [
  { name: '4/20 (Cannabis Day)', date: '2026-04-20', daysAway: 20, multiplier: 3.2, categories: ['Flower', 'Pre-Rolls', 'Vapes', 'Edibles'], icon: '420' },
  { name: 'Green Wednesday', date: '2026-04-19', daysAway: 19, multiplier: 2.1, categories: ['Flower', 'Pre-Rolls', 'Edibles'], icon: 'GW' },
  { name: 'Memorial Day Weekend', date: '2026-05-23', daysAway: 53, multiplier: 1.6, categories: ['Edibles', 'Pre-Rolls', 'Vapes'], icon: 'MD' },
  { name: 'Independence Day', date: '2026-07-04', daysAway: 95, multiplier: 1.8, categories: ['Flower', 'Pre-Rolls', 'Edibles'], icon: 'J4' },
];

// ---------------------------------------------------------------------------
// Proactive Reorder Mock Data (Phase 4.3)
// ---------------------------------------------------------------------------
function generateReorderSuggestions(stores) {
  const suggestions = [];
  const rng = _seedRng(42069);
  stores.forEach(store => {
    store.products.forEach(product => {
      if (product.daysSupply < 10 && product.status !== 'ok') {
        const leadTimeDays = Math.round(3 + rng() * 7);
        const velocityPerDay = product.avgWeekly / 7;
        const safetyStockDays = 3;
        const reorderQty = Math.round(velocityPerDay * (leadTimeDays + safetyStockDays + 7));
        const reorderValue = reorderQty * product.price;
        const urgency = product.daysSupply <= leadTimeDays ? 'overdue' : product.daysSupply <= leadTimeDays + 3 ? 'urgent' : 'upcoming';
        suggestions.push({
          storeName: store.name,
          product: product.name,
          brand: product.brand,
          category: product.category,
          currentSupply: product.daysSupply,
          leadTimeDays,
          velocityPerDay: Math.round(velocityPerDay * 10) / 10,
          reorderQty,
          reorderValue,
          urgency,
        });
      }
    });
  });
  return suggestions.sort((a, b) => {
    const order = { overdue: 0, urgent: 1, upcoming: 2 };
    return order[a.urgency] - order[b.urgency];
  }).slice(0, 12);
}

// ---------------------------------------------------------------------------
// Demand Forecast Mock Data (Phase 4.3)
// ---------------------------------------------------------------------------
function generateDemandForecasts(stores) {
  const rng = _seedRng(31415);
  const catAggs = {};
  stores.forEach(store => {
    store.products.forEach(p => {
      if (!catAggs[p.category]) catAggs[p.category] = { weeklyUnits: 0, revenue: 0, products: 0 };
      catAggs[p.category].weeklyUnits += p.avgWeekly;
      catAggs[p.category].revenue += p.avgWeekly * p.price;
      catAggs[p.category].products += 1;
    });
  });
  return Object.entries(catAggs).map(([cat, data]) => {
    const growthPct = Math.round((-5 + rng() * 20) * 10) / 10;
    const projectedWeekly = Math.round(data.weeklyUnits * (1 + growthPct / 100));
    const suggestedPOValue = Math.round(data.revenue * 2 * (1 + growthPct / 100));
    return {
      category: cat,
      currentWeekly: data.weeklyUnits,
      projectedWeekly,
      growthPct,
      suggestedPOValue,
      productCount: data.products,
    };
  }).sort((a, b) => b.suggestedPOValue - a.suggestedPOValue);
}

// ---------------------------------------------------------------------------
// Tiny inline sparkline SVG (Phase 4.3)
// ---------------------------------------------------------------------------
function MiniSparkline({ data, width = 48, height = 16, color = 'var(--color-accent-blue)' }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  const trending = data[data.length - 1] > data[0];
  const lineColor = trending ? 'var(--color-accent-green)' : 'var(--color-accent-red)';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block align-middle">
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  oos: { label: 'OOS', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20', leftBorder: '#EF4444' },
  critical: { label: 'Critical', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20', leftBorder: '#F97316' },
  low: { label: 'Low', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20', leftBorder: '#F59E0B' },
  ok: { label: 'OK', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/15', leftBorder: 'transparent' },
};

const URGENCY_ORDER = { oos: 0, critical: 1, low: 2, ok: 3 };

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, subValue, color, iconBg }) {
  return (
    <div className="flex-1 min-w-[180px] rounded-xl border border-surface-border bg-surface-card px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-[20px] font-bold" style={{ color }}>{value}</p>
          <p className="text-[11px] text-text-muted">{label}</p>
          {subValue && <p className="text-[10px] text-text-muted/70 mt-0.5">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, onReorder, transferStep, onStartTransfer, onConfirmTransfer }) {
  const canTransfer = product.floor === 0 && product.vault > 0;
  const canReorder = product.daysSupply < 7;
  const isBold = product.status === 'oos' || product.status === 'critical';
  const leftColor = STATUS_CONFIG[product.status]?.leftBorder || 'transparent';

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-3 border-b border-surface-border/40 hover:bg-surface-muted transition-colors group" style={{ borderLeft: `3px solid ${leftColor}` }}>
      <div className="grid grid-cols-[1fr_repeat(7,auto)] items-center gap-x-4 gap-y-1 min-w-0">
        {/* Product info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] text-text-primary truncate ${isBold ? 'font-bold' : 'font-medium'}`}>{product.name}</span>
            <StatusPill status={product.status} />
          </div>
          <p className="text-[11px] text-text-muted truncate">{product.brand} · {product.category} · {fmtDollar(product.price)}</p>
        </div>

        {/* Floor qty */}
        <div className="text-center min-w-[60px]">
          <p className={`text-[13px] font-semibold ${product.floor === 0 ? 'text-red-400' : 'text-text-primary'}`}>{product.floor}</p>
          <p className="text-[10px] text-text-muted/70">Floor</p>
        </div>

        {/* Vault qty */}
        <div className="text-center min-w-[60px]">
          <p className={`text-[13px] font-semibold ${product.vault > 0 && product.floor === 0 ? 'text-blue-400' : 'text-text-primary'}`}>{product.vault}</p>
          <p className="text-[10px] text-text-muted/70">Vault</p>
        </div>

        {/* Days of supply */}
        <div className="text-center min-w-[60px]">
          <p className={`text-[13px] font-semibold ${product.daysSupply < 3 ? 'text-red-400' : product.daysSupply < 7 ? 'text-amber-400' : 'text-text-primary'}`}>
            {product.daysSupply > 90 ? '90+' : product.daysSupply.toFixed(1)}
          </p>
          <p className="text-[10px] text-text-muted/70">Days Supply</p>
        </div>

        {/* Avg weekly */}
        <div className="text-center min-w-[60px]">
          <p className="text-[13px] font-semibold text-text-primary">{product.avgWeekly}</p>
          <p className="text-[10px] text-text-muted/70">Avg/Wk</p>
        </div>

        {/* Velocity Trend sparkline (Phase 4.3) */}
        <div className="text-center min-w-[56px]">
          <MiniSparkline data={product.velocityTrend} />
          <p className="text-[10px] text-text-muted/70">Velocity</p>
        </div>

        {/* Category Rank (Phase 4.3) */}
        <div className="text-center min-w-[50px]">
          <p className="text-[13px] font-semibold text-accent-purple">#{product.categoryRank}<span className="text-text-muted/50">/{product.categoryTotal}</span></p>
          <p className="text-[10px] text-text-muted/70">Cat Rank</p>
        </div>

        {/* Revenue Contribution (Phase 4.3) */}
        <div className="text-center min-w-[60px]">
          <p className="text-[13px] font-semibold text-accent-gold">{product.revenueContribution.toFixed(1)}%</p>
          <p className="text-[10px] text-text-muted/70">Rev %</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Stock-out revenue impact badge (Phase 4.3) */}
        {product.estLostPerDay > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/15">
            <DollarSign size={10} />
            {fmtDollar(product.estLostPerDay)}/day lost
          </span>
        )}

        {canTransfer && (
          transferStep === 3 ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-accent-green">
              <Check size={12} />
              {product.vault} moved
            </span>
          ) : transferStep === 2 ? (
            <button
              onClick={() => onConfirmTransfer(product)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white hover:brightness-110 transition-colors"
              style={{ background: 'var(--color-accent-green)' }}
            >
              <Check size={12} />
              Confirm
            </button>
          ) : transferStep === 1 ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-accent-gold">
              <div className="w-3.5 h-3.5 rounded-full border border-surface-border relative"><div className="absolute inset-0 rounded-full border border-t-accent-gold animate-spin" /></div>
              Scanning...
            </span>
          ) : (
            <button
              onClick={() => onStartTransfer(product)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors"
            >
              <ArrowRightLeft size={12} />
              Transfer {product.vault}
            </button>
          )
        )}
        {canReorder && (
          <button
            onClick={() => onReorder(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            <Truck size={12} />
            Draft Reorder
          </button>
        )}
      </div>
    </div>
  );
}

function StoreAccordion({ store, onReorder, transferStates, onStartTransfer, onConfirmTransfer, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  // Sort products by urgency: OOS -> Critical -> Low -> OK
  const sortedProducts = useMemo(() => {
    return [...store.products].sort((a, b) => URGENCY_ORDER[a.status] - URGENCY_ORDER[b.status]);
  }, [store.products]);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      {/* Store header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-muted transition-colors"
      >
        {open ? <ChevronDown size={16} className="text-text-muted flex-shrink-0" /> : <ChevronRight size={16} className="text-text-muted flex-shrink-0" />}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="text-[14px] font-semibold text-text-primary truncate">{store.name}</span>
          <span className="text-[11px] text-text-muted flex-shrink-0">{store.state}</span>
          {store.oosCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
              {store.oosCount} OOS
            </span>
          )}
          {store.lowCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
              {store.lowCount} Low
            </span>
          )}
          {store.vaultReady > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {store.vaultReady} Vault Ready
            </span>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          {store.totalLost > 0 && (
            <span className="text-[12px] font-semibold text-red-400">{fmtDollar(store.totalLost)}/day lost</span>
          )}
        </div>
      </button>

      {/* Product rows */}
      {open && (
        <div className="border-t border-surface-border">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 bg-surface-bg border-b border-surface-border/60">
            <div className="grid grid-cols-[1fr_repeat(7,auto)] items-center gap-x-4 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider">
              <span>Product</span>
              <span className="text-center min-w-[60px]">Floor</span>
              <span className="text-center min-w-[60px]">Vault</span>
              <span className="text-center min-w-[60px]">Days</span>
              <span className="text-center min-w-[60px]">Avg/Wk</span>
              <span className="text-center min-w-[56px]">Velocity</span>
              <span className="text-center min-w-[50px]">Rank</span>
              <span className="text-center min-w-[60px]">Rev %</span>
            </div>
            <span className="min-w-[260px]" />
          </div>
          {sortedProducts.map((product, i) => {
            const key = `${store.name}::${product.name}`;
            return (
              <ProductRow
                key={i}
                product={product}
                transferStep={transferStates[key]}
                onStartTransfer={(p) => onStartTransfer(store, p)}
                onConfirmTransfer={(p) => onConfirmTransfer(store, p)}
                onReorder={(p) => onReorder(store, p)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stock-Out Revenue Impact Panel (Phase 4.3)
// ---------------------------------------------------------------------------
function StockOutImpactPanel({ stores }) {
  const impactItems = useMemo(() => {
    const items = [];
    stores.forEach(store => {
      store.products.forEach(p => {
        if (p.estLostPerDay > 0) {
          items.push({ ...p, storeName: store.name });
        }
      });
    });
    return items.sort((a, b) => b.estLostPerDay - a.estLostPerDay).slice(0, 8);
  }, [stores]);

  const totalDailyLost = impactItems.reduce((s, p) => s + p.estLostPerDay, 0);
  const totalWeeklyLost = totalDailyLost * 7;
  const totalMonthlyLost = totalDailyLost * 30;

  if (impactItems.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] overflow-hidden">
      <div className="px-5 py-4 border-b border-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10">
              <DollarSign size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-text-primary">Stock-Out Revenue Impact</h3>
              <p className="text-[11px] text-text-muted">Estimated lost revenue from {impactItems.length} out-of-stock products</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[18px] font-bold text-red-400">{fmtDollar(totalDailyLost)}<span className="text-[11px] font-normal text-text-muted">/day</span></p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-semibold text-red-400/80">{fmtDollar(totalWeeklyLost)}<span className="text-[11px] font-normal text-text-muted">/week</span></p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-semibold text-red-400/60">{fmtDollar(totalMonthlyLost)}<span className="text-[11px] font-normal text-text-muted">/month</span></p>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-red-500/10">
        {impactItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-red-500/[0.03] transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-text-primary truncate">{item.name}</span>
                <span className="text-[10px] text-text-muted">{item.brand}</span>
              </div>
              <p className="text-[10px] text-text-muted">{item.storeName} · {item.avgWeekly} units/wk velocity</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[13px] font-bold text-red-400">{fmtDollar(item.estLostPerDay)}/day</p>
                <p className="text-[10px] text-text-muted">{fmtDollar(item.estLostPerDay * 30)}/month</p>
              </div>
              <div className="w-20 h-1.5 rounded-full bg-red-500/10 overflow-hidden">
                <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, (item.estLostPerDay / (impactItems[0]?.estLostPerDay || 1)) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proactive Reorder Panel (Phase 4.3)
// ---------------------------------------------------------------------------
function ProactiveReorderPanel({ stores }) {
  const suggestions = useMemo(() => generateReorderSuggestions(stores), [stores]);
  if (suggestions.length === 0) return null;

  const urgencyColors = {
    overdue: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15', label: 'Overdue' },
    urgent: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15', label: 'Urgent' },
    upcoming: { bg: 'bg-accent-blue/10', text: 'text-accent-blue', border: 'border-accent-blue/15', label: 'Upcoming' },
  };

  const totalPOValue = suggestions.reduce((s, item) => s + item.reorderValue, 0);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-green/10">
              <Zap size={18} className="text-accent-green" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-text-primary">Proactive Reorder Suggestions</h3>
              <p className="text-[11px] text-text-muted">Based on velocity, lead times, and safety stock requirements</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-semibold text-accent-green">{suggestions.length} POs recommended</p>
            <p className="text-[11px] text-text-muted">Total value: {fmtDollar(totalPOValue)}</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-border/60 bg-surface-bg">
              <th className="px-4 py-2 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider">Product</th>
              <th className="px-4 py-2 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider">Store</th>
              <th className="px-4 py-2 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider text-center">Current Supply</th>
              <th className="px-4 py-2 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider text-center">Lead Time</th>
              <th className="px-4 py-2 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider text-center">Velocity</th>
              <th className="px-4 py-2 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider text-center">Reorder Qty</th>
              <th className="px-4 py-2 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider text-center">PO Value</th>
              <th className="px-4 py-2 text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider text-center">Urgency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/40">
            {suggestions.map((item, i) => {
              const uc = urgencyColors[item.urgency];
              return (
                <tr key={i} className="hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="text-[12px] font-medium text-text-primary">{item.product}</p>
                    <p className="text-[10px] text-text-muted">{item.brand} · {item.category}</p>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-text-secondary">{item.storeName}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[12px] font-semibold ${item.currentSupply < 3 ? 'text-red-400' : 'text-amber-400'}`}>{item.currentSupply.toFixed(1)}d</span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-[12px] text-text-secondary">{item.leadTimeDays}d</td>
                  <td className="px-4 py-2.5 text-center text-[12px] text-text-secondary">{item.velocityPerDay}/day</td>
                  <td className="px-4 py-2.5 text-center text-[12px] font-semibold text-text-primary">{item.reorderQty}</td>
                  <td className="px-4 py-2.5 text-center text-[12px] font-semibold text-accent-green">{fmtDollar(item.reorderValue)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${uc.bg} ${uc.text} border ${uc.border}`}>
                      {uc.label}
                    </span>
                  </td>
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
// Demand Forecasting Panel (Phase 4.3)
// ---------------------------------------------------------------------------
function DemandForecastPanel({ stores }) {
  const forecasts = useMemo(() => generateDemandForecasts(stores), [stores]);
  if (forecasts.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-purple/10">
            <BarChart3 size={18} className="text-accent-purple" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-text-primary">Demand Forecasting</h3>
            <p className="text-[11px] text-text-muted">Projected 2-week demand by category with suggested PO values</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {forecasts.map((fc, i) => (
          <div key={i} className="rounded-lg border border-surface-border bg-surface-bg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-text-primary">{fc.category}</span>
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${fc.growthPct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {fc.growthPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {fc.growthPct >= 0 ? '+' : ''}{fc.growthPct}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">Current weekly</span>
                <span className="font-medium text-text-secondary">{fc.currentWeekly} units</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">Projected weekly</span>
                <span className="font-medium text-accent-blue">{fc.projectedWeekly} units</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">Products tracked</span>
                <span className="font-medium text-text-secondary">{fc.productCount}</span>
              </div>
              <div className="h-px bg-surface-border my-1" />
              <div className="flex justify-between text-[12px]">
                <span className="text-text-muted font-medium">Suggested PO</span>
                <span className="font-bold text-accent-green">{fmtDollar(fc.suggestedPOValue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar-Aware Planning Panel (Phase 4.3)
// ---------------------------------------------------------------------------
function CalendarPlanningPanel() {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-gold/10">
            <Calendar size={18} className="text-accent-gold" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-text-primary">Calendar-Aware Planning</h3>
            <p className="text-[11px] text-text-muted">Upcoming demand spikes -- order ahead to avoid stockouts during peak events</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        {CALENDAR_EVENTS.map((event, i) => (
          <div key={i} className={`rounded-lg border p-4 ${event.daysAway <= 21 ? 'border-red-500/25 bg-red-500/[0.04]' : 'border-surface-border bg-surface-bg'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: event.daysAway <= 21 ? 'rgba(239,68,68,0.12)' : 'var(--color-surface-hover)', color: event.daysAway <= 21 ? '#EF4444' : 'var(--color-text-muted)' }}>
                {event.icon}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${event.daysAway <= 21 ? 'bg-red-500/10 text-red-400' : 'bg-surface-hover text-text-muted'}`}>
                {event.daysAway}d away
              </span>
            </div>
            <h4 className="text-[13px] font-semibold text-text-primary mb-1">{event.name}</h4>
            <p className="text-[11px] text-text-muted mb-3">{event.date}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">Demand multiplier</span>
                <span className="font-bold text-accent-gold">{event.multiplier}x</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">Peak categories</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {event.categories.map((cat, ci) => (
                  <span key={ci} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-surface-hover text-text-secondary">{cat}</span>
                ))}
              </div>
            </div>
            {event.daysAway <= 21 && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-red-400">
                <AlertTriangle size={10} />
                Order now to arrive in time
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function InventoryAnalytics() {
  const { selectedPersona } = usePersona();
  const { selectedStoreNames } = useStores();
  const navigate = useNavigate();

  // Filters
  const [stateFilter, setStateFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all | oos | low | vault
  const [sortBy, setSortBy] = useState('lost'); // lost | days | alpha

  // Inline transfer state machine: key = "storeName::productName" -> step (1=scanning, 2=confirm, 3=done)
  const [transferStates, setTransferStates] = useState({});

  // Drawer state (bulk only)
  const [bulkTransferDrawer, setBulkTransferDrawer] = useState(false);
  const [bulkReorderDrawer, setBulkReorderDrawer] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Filter stores by persona/store selection
  const visibleStores = useMemo(() => {
    let stores = ALL_STORE_INVENTORY;

    // Persona filter
    if (selectedPersona.storeFilter) {
      if (selectedPersona.storeFilter.states) {
        stores = stores.filter(s => selectedPersona.storeFilter.states.includes(s.state));
      }
      if (selectedPersona.storeFilter.store) {
        stores = stores.filter(s => s.name === selectedPersona.storeFilter.store);
      }
    }

    // Store context selection
    if (selectedStoreNames.size > 0 && selectedStoreNames.size < locations.length) {
      stores = stores.filter(s => selectedStoreNames.has(s.name));
    }

    // State filter
    if (stateFilter) {
      stores = stores.filter(s => s.state === stateFilter);
    }

    // Status filter — filter stores that have matching products
    if (statusFilter === 'oos') {
      stores = stores.filter(s => s.oosCount > 0);
    } else if (statusFilter === 'low') {
      stores = stores.filter(s => s.lowCount > 0 || s.oosCount > 0);
    } else if (statusFilter === 'vault') {
      stores = stores.filter(s => s.vaultReady > 0);
    }

    // Sort
    if (sortBy === 'lost') {
      stores = [...stores].sort((a, b) => b.totalLost - a.totalLost);
    } else if (sortBy === 'days') {
      stores = [...stores].sort((a, b) => {
        const aMin = Math.min(...a.products.map(p => p.daysSupply));
        const bMin = Math.min(...b.products.map(p => p.daysSupply));
        return aMin - bMin;
      });
    } else {
      stores = [...stores].sort((a, b) => a.name.localeCompare(b.name));
    }

    return stores;
  }, [selectedPersona, selectedStoreNames, stateFilter, statusFilter, sortBy]);

  // Also filter products within each store based on status filter
  const filteredStores = useMemo(() => {
    if (statusFilter === 'all') return visibleStores;
    return visibleStores.map(store => {
      let filtered;
      if (statusFilter === 'oos') filtered = store.products.filter(p => p.status === 'oos');
      else if (statusFilter === 'low') filtered = store.products.filter(p => ['oos', 'critical', 'low'].includes(p.status));
      else if (statusFilter === 'vault') filtered = store.products.filter(p => p.floor === 0 && p.vault > 0);
      else filtered = store.products;
      return { ...store, products: filtered };
    }).filter(s => s.products.length > 0);
  }, [visibleStores, statusFilter]);

  // KPI totals
  const kpis = useMemo(() => {
    const allProducts = visibleStores.flatMap(s => s.products);
    const inStockProducts = allProducts.filter(p => p.status !== 'oos' && p.daysSupply < 900);
    const avgDaysOfSupply = inStockProducts.length > 0
      ? Math.round((inStockProducts.reduce((sum, p) => sum + p.daysSupply, 0) / inStockProducts.length) * 10) / 10
      : 0;
    const totalWeeklyUnits = allProducts.reduce((sum, p) => sum + p.avgWeekly, 0);
    const totalInventory = allProducts.reduce((sum, p) => sum + p.floor + p.vault, 0);
    const turnRate = totalInventory > 0 ? Math.round(((totalWeeklyUnits * 52) / totalInventory) * 10) / 10 : 0;

    return {
      oosCount: allProducts.filter(p => p.status === 'oos').length,
      lowCount: allProducts.filter(p => p.status === 'low' || p.status === 'critical').length,
      vaultReady: allProducts.filter(p => p.floor === 0 && p.vault > 0).length,
      totalLost: allProducts.reduce((sum, p) => sum + p.estLostPerDay, 0),
      avgDaysOfSupply,
      turnRate,
    };
  }, [visibleStores]);

  // Available states from visible stores
  const availableStates = useMemo(() => {
    return [...new Set(visibleStores.map(s => s.state))].sort();
  }, [visibleStores]);

  // Inline transfer state machine (matches NexusHome smart alerts pattern)
  const handleStartTransfer = useCallback((store, product) => {
    const key = `${store.name}::${product.name}`;
    setTransferStates(prev => ({ ...prev, [key]: 1 }));
    setTimeout(() => {
      setTransferStates(prev => ({ ...prev, [key]: 2 }));
    }, 1400);
  }, []);

  const handleConfirmTransfer = useCallback((store, product) => {
    const key = `${store.name}::${product.name}`;
    setTransferStates(prev => ({ ...prev, [key]: 3 }));
  }, []);

  // Navigate to Inventory Agent with full product context for focused PO
  // Also include other low/OOS items from the same brand + new catalog items the store doesn't carry
  const handleReorder = useCallback((store, product) => {
    const sameBrandItems = visibleStores.flatMap(s =>
      s.products
        .filter(p => p.brand === product.brand && p.name !== product.name && ['oos', 'critical', 'low'].includes(p.status))
        .map(p => ({ ...p, storeName: s.name }))
    );

    // Find catalog items from same brand that this store doesn't currently carry
    const storeData = visibleStores.find(s => s.name === store.name);
    const storeProductNames = new Set(storeData ? storeData.products.map(p => p.name) : []);
    const newBrandItems = PRODUCT_CATALOG
      .filter(p => p.brand === product.brand && !storeProductNames.has(p.name))
      .map(p => ({ name: p.name, brand: p.brand, category: p.category, price: p.price }));

    navigate('/agents/connect', { state: {
      product: product.name,
      store: store.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      floor: product.floor,
      vault: product.vault,
      avgWeekly: product.avgWeekly,
      daysSupply: product.daysSupply,
      estLostPerDay: product.estLostPerDay,
      status: product.status,
      metrcPkg: product.metrcPkg,
      sameBrandItems,
      newBrandItems,
    } });
  }, [navigate, visibleStores]);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Bulk counts
  const bulkTransferCount = useMemo(() => visibleStores.reduce((sum, s) => sum + s.products.filter(p => p.floor === 0 && p.vault > 0).length, 0), [visibleStores]);
  const bulkReorderCount = useMemo(() => visibleStores.reduce((sum, s) => sum + s.products.filter(p => p.daysSupply < 3).length, 0), [visibleStores]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary flex items-center gap-2">
            <Package size={22} className="text-accent-gold" />
            Inventory Analytics & Actions
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Real-time stock levels, vault-to-floor transfers, and reorder management across {visibleStores.length} locations
          </p>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="flex gap-3 flex-wrap">
        <KpiCard
          icon={AlertTriangle}
          label="Out of Stock Products"
          value={kpis.oosCount}
          subValue={`across ${visibleStores.filter(s => s.oosCount > 0).length} stores`}
          color="#EF4444"
          iconBg="rgba(239,68,68,0.1)"
        />
        <KpiCard
          icon={TrendingDown}
          label="Low Stock (< 7 days)"
          value={kpis.lowCount}
          subValue="critical + low stock"
          color="#F59E0B"
          iconBg="rgba(245,158,11,0.1)"
        />
        <KpiCard
          icon={Warehouse}
          label="Vault -> Floor Pending"
          value={kpis.vaultReady}
          subValue="OOS with vault inventory"
          color="#3B82F6"
          iconBg="rgba(59,130,246,0.1)"
        />
        <KpiCard
          icon={TrendingDown}
          label="Est. Lost Sales / Day"
          value={fmtDollar(kpis.totalLost)}
          subValue="from stockouts only"
          color="#EF4444"
          iconBg="rgba(239,68,68,0.1)"
        />
        <KpiCard
          icon={Clock}
          label="Avg Days of Supply"
          value={`${kpis.avgDaysOfSupply}d`}
          subValue="across in-stock SKUs"
          color="#A855F7"
          iconBg="rgba(168,85,247,0.1)"
        />
        <KpiCard
          icon={RotateCw}
          label="Inventory Turn Rate"
          value={`${kpis.turnRate}x`}
          subValue="annualized"
          color="#3B82F6"
          iconBg="rgba(59,130,246,0.1)"
        />
      </div>

      {/* Stock-Out Revenue Impact (Phase 4.3 — surfaced prominently) */}
      <StockOutImpactPanel stores={visibleStores} />

      {/* Calendar-Aware Planning (Phase 4.3) */}
      <CalendarPlanningPanel />

      {/* Demand Forecasting Panel (Phase 4.3) */}
      <DemandForecastPanel stores={visibleStores} />

      {/* Proactive Reorder Suggestions (Phase 4.3) */}
      <ProactiveReorderPanel stores={visibleStores} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* State pills */}
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-text-muted" />
          <button
            onClick={() => setStateFilter(null)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${!stateFilter ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/25' : 'text-text-muted border border-surface-border hover:text-text-secondary hover:border-surface-hover'}`}
          >
            All States
          </button>
          {availableStates.map(st => (
            <button
              key={st}
              onClick={() => setStateFilter(stateFilter === st ? null : st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${stateFilter === st ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/25' : 'text-text-muted border border-surface-border hover:text-text-secondary hover:border-surface-hover'}`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-surface-border" />

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'oos', label: 'OOS Only' },
            { key: 'low', label: 'Low Stock' },
            { key: 'vault', label: 'Vault Ready' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${statusFilter === f.key ? 'bg-accent-green/15 text-accent-green border border-accent-green/25' : 'text-text-muted border border-surface-border hover:text-text-secondary hover:border-surface-hover'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-surface-border" />

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-text-muted" />
          {[
            { key: 'lost', label: 'By Lost Sales' },
            { key: 'days', label: 'By Days Supply' },
            { key: 'alpha', label: 'A->Z' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${sortBy === s.key ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25' : 'text-text-muted border border-surface-border hover:text-text-secondary hover:border-surface-hover'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Store Accordion List */}
      <div className="space-y-3 pb-20">
        {filteredStores.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-[14px]">No stores match the current filters</p>
          </div>
        ) : (
          filteredStores.map((store, i) => (
            <StoreAccordion
              key={store.name}
              store={store}
              transferStates={transferStates}
              onStartTransfer={handleStartTransfer}
              onConfirmTransfer={handleConfirmTransfer}
              onReorder={handleReorder}
              defaultOpen={i === 0}
            />
          ))
        )}
      </div>

      {/* Bulk Actions Bar (sticky bottom) */}
      {(kpis.vaultReady > 0 || kpis.oosCount > 0) && (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-20 bg-surface-card/95 backdrop-blur-md border-t border-surface-border px-6 py-3 flex items-center justify-between">
          <div className="text-[12px] text-text-muted">
            <span className="text-text-primary font-semibold">{filteredStores.length}</span> stores · <span className="text-red-400 font-semibold">{kpis.oosCount}</span> OOS · <span className="text-amber-400 font-semibold">{kpis.lowCount}</span> low stock
          </div>
          <div className="flex items-center gap-3">
            {kpis.vaultReady > 0 && (
              <button
                onClick={() => setBulkTransferDrawer(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                <ArrowRightLeft size={14} />
                Transfer All OOS from Vault ({kpis.vaultReady})
              </button>
            )}
            {bulkReorderCount > 0 && (
              <button
                onClick={() => setBulkReorderDrawer(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <ClipboardList size={14} />
                Draft Reorder for All Critical ({bulkReorderCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Transfer Confirmation Drawer */}
      <ConfirmationDrawer
        open={bulkTransferDrawer}
        onCancel={() => setBulkTransferDrawer(false)}
        onConfirm={() => {
          setBulkTransferDrawer(false);
          showToast(`Queued ${bulkTransferCount} vault -> floor room changes for METRC confirmation`);
        }}
        title="Bulk Vault -> Floor Room Changes"
        description={`This will queue ${bulkTransferCount} METRC room assignments across ${visibleStores.filter(s => s.vaultReady > 0).length} stores.`}
        icon={ArrowRightLeft}
        confirmLabel={`Queue ${bulkTransferCount} Room Changes`}
        confirmColor="#3B82F6"
        details={[
          { label: 'Total Items', value: `${bulkTransferCount} OOS products with vault stock` },
          { label: 'Stores Affected', value: `${visibleStores.filter(s => s.vaultReady > 0).length} locations` },
          { label: 'Action', value: 'Move from Vault to Sales Floor in METRC' },
        ]}
        warning="Each room change will be logged individually in METRC. Verify physical inventory at each location before confirming."
      />

      {/* Bulk Reorder Confirmation Drawer */}
      <ConfirmationDrawer
        open={bulkReorderDrawer}
        onCancel={() => setBulkReorderDrawer(false)}
        onConfirm={() => {
          setBulkReorderDrawer(false);
          showToast(`Drafted reorder POs for ${bulkReorderCount} critical items`);
        }}
        title="Bulk Draft Reorder POs"
        description={`This will create ${bulkReorderCount} draft POs for all products with < 3 days supply.`}
        icon={ShoppingCart}
        confirmLabel={`Draft ${bulkReorderCount} POs`}
        confirmColor="var(--color-accent-green)"
        details={[
          { label: 'Total Items', value: `${bulkReorderCount} critical products (< 3 days supply)` },
          { label: 'Stores Affected', value: `${visibleStores.filter(s => s.products.some(p => p.daysSupply < 3)).length} locations` },
          { label: 'Qty Per Item', value: '2-week supply (auto-calculated)' },
        ]}
        warning="All draft POs will require individual manager approval before submission."
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-surface-card border border-accent-green/30 shadow-2xl animate-[fadeIn_150ms_ease-out]">
          <p className="text-[13px] font-medium text-accent-green">{toastMsg}</p>
        </div>
      )}
    </div>
  );
}
