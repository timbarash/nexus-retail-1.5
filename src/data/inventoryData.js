// ---------------------------------------------------------------------------
// Shared Inventory Data — used by InventoryActions + InventoryAnalytics pages
// ---------------------------------------------------------------------------
import { locations } from './mockData';

// ---------------------------------------------------------------------------
// Seeded RNG (same algo as NexusHome)
// ---------------------------------------------------------------------------
export function _seedRng(seed) {
  let s = seed | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function fmtDollar(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${Math.round(v).toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Product Catalog — 25 cannabis products across 6 categories
// ---------------------------------------------------------------------------
export const PRODUCT_CATALOG = [
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
export function generateStoreInventory(loc, storeIndex) {
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

    // Last Sold Date + Days OOS for OOS products
    const oosRng = _seedRng(storeIndex * 5113 + pi * 331);
    const daysOOS = floor === 0 ? Math.round(3 + oosRng() * 42) : 0;
    const lastSoldDate = floor === 0
      ? new Date(Date.now() - daysOOS * 86400000).toISOString().split('T')[0]
      : null;

    // Margin per unit
    const MARGIN_RATE_BY_CAT = { Flower: 0.45, Vapes: 0.52, Edibles: 0.55, 'Pre-Rolls': 0.48, Concentrates: 0.50, Topicals: 0.58 };
    const marginRate = MARGIN_RATE_BY_CAT[product.category] ?? 0.48;
    const marginPerUnit = Math.round(product.price * marginRate * 100) / 100;

    // Days until reorder point for OK items
    const reorderPointDays = 7;
    const daysUntilReorder = status === 'ok' ? Math.max(0, Math.round((daysSupply - reorderPointDays) * 10) / 10) : null;

    // Est. at risk per day for Critical items
    const estAtRiskPerDay = status === 'critical' ? Math.round((avgWeekly / 7) * product.price * 100) / 100 : 0;

    // METRC package tag
    const tagNum = String(4060300000 + storeIndex * 1000 + pi + 1).padStart(21, '0');
    const metrcPkg = `1A4${tagNum}`;

    // Per-product enriched metrics
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
      lastSoldDate,
      daysOOS,
      marginPerUnit,
      daysUntilReorder,
      estAtRiskPerDay,
    };
  });
}

// ---------------------------------------------------------------------------
// Build all store data
// ---------------------------------------------------------------------------
export const ALL_STORE_INVENTORY = locations.map((loc, i) => {
  const products = generateStoreInventory(loc, i);
  const oosCount = products.filter(p => p.status === 'oos').length;
  const lowCount = products.filter(p => p.status === 'low' || p.status === 'critical').length;
  const totalLost = products.reduce((sum, p) => sum + p.estLostPerDay, 0);
  const vaultReady = products.filter(p => p.floor === 0 && p.vault > 0).length;
  return { ...loc, products, oosCount, lowCount, totalLost, vaultReady };
});

// State list from locations
export const ALL_STATES = [...new Set(locations.map(l => l.state))].sort();

// ---------------------------------------------------------------------------
// Calendar-Aware Holiday Data
// ---------------------------------------------------------------------------
export const CALENDAR_EVENTS = [
  { name: '4/20 (Cannabis Day)', date: '2026-04-20', daysAway: 20, multiplier: 3.2, categories: ['Flower', 'Pre-Rolls', 'Vapes', 'Edibles'], icon: '420' },
  { name: 'Green Wednesday', date: '2026-04-19', daysAway: 19, multiplier: 2.1, categories: ['Flower', 'Pre-Rolls', 'Edibles'], icon: 'GW' },
  { name: 'Memorial Day Weekend', date: '2026-05-23', daysAway: 53, multiplier: 1.6, categories: ['Edibles', 'Pre-Rolls', 'Vapes'], icon: 'MD' },
  { name: 'Independence Day', date: '2026-07-04', daysAway: 95, multiplier: 1.8, categories: ['Flower', 'Pre-Rolls', 'Edibles'], icon: 'J4' },
];

// ---------------------------------------------------------------------------
// Proactive Reorder Mock Data
// ---------------------------------------------------------------------------
export function generateReorderSuggestions(stores) {
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
        let urgency;
        if (product.daysSupply <= 0 || product.status === 'oos') {
          urgency = 'critical';
        } else if (product.daysSupply <= safetyStockDays) {
          urgency = 'overdue';
        } else {
          urgency = 'upcoming';
        }
        const marginRate = { Flower: 0.45, Vapes: 0.52, Edibles: 0.55, 'Pre-Rolls': 0.48, Concentrates: 0.50, Topicals: 0.58 }[product.category] ?? 0.48;
        const estMarginOnPO = Math.round(reorderQty * product.price * marginRate);
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
          estMarginOnPO,
        });
      }
    });
  });
  return suggestions.sort((a, b) => {
    const order = { critical: 0, overdue: 1, upcoming: 2 };
    return order[a.urgency] - order[b.urgency];
  }).slice(0, 12);
}

// ---------------------------------------------------------------------------
// Demand Forecast Mock Data
// ---------------------------------------------------------------------------
export function generateDemandForecasts(stores) {
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
