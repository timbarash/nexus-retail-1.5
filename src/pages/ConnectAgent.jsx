import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot, Sparkles, Send, ArrowLeft, ChevronRight, Zap, TrendingUp,
  ShoppingBag, Package, Truck, AlertTriangle, CheckCircle2, Clock,
  DollarSign, BarChart3, Star, Hash, ArrowUpDown, RefreshCw,
  ChevronDown, ChevronUp, Check, X, Search, Filter, Store,
  Layers, Box, ShoppingCart, Award, Percent, Heart, Eye,
  Building2, Phone, Mail, Globe, MapPin, Calendar, ArrowRight,
  PackageCheck, PackageX, TrendingDown, CircleDollarSign
} from 'lucide-react';
import { generateConnectResponse, generateConnectAnalysis, isGeminiAvailable } from '../utils/gemini';
import ConfirmationDrawer from '../components/common/ConfirmationDrawer';
import { brandImg } from '../utils/helpers';

/* ═══════════════════════════════════════════════════════════════════
   ICON MAP & RESOLVER
   ═══════════════════════════════════════════════════════════════════ */

const ICON_MAP = {
  PackageX, CircleDollarSign, RefreshCw, TrendingDown, TrendingUp,
  Building2, Truck, Package, ShoppingBag, ShoppingCart, Clock,
  DollarSign, BarChart3, Star, Award, Percent, Heart, Zap,
  Sparkles, Eye, Store, Layers, Box, MapPin, Calendar, Search,
  AlertTriangle, CheckCircle2, PackageCheck, Mail, Phone, Globe,
};

function resolveIcon(icon) {
  if (typeof icon === 'function') return icon;
  return ICON_MAP[icon] || Sparkles;
}

/* ═══════════════════════════════════════════════════════════════════
   BRAND DATA
   ═══════════════════════════════════════════════════════════════════ */

const BRANDS = {
  jeeter: { name: 'Jeeter', color: '#7B2D8E', category: 'Pre-Rolls & Vapes' },
  stiiizy: { name: 'STIIIZY', color: '#000000', category: 'Vapes & Pods' },
  rawgarden: { name: 'Raw Garden', color: '#4CAF50', category: 'Live Resin' },
  kiva: { name: 'Kiva', color: '#8B4513', category: 'Edibles' },
  plusproducts: { name: 'PLUS', color: '#FF6B35', category: 'Edibles' },
  alienlabs: { name: 'Alien Labs', color: '#00BCD4', category: 'Flower & Pre-Rolls' },
  cookies: { name: 'Cookies', color: '#2196F3', category: 'Flower' },
  wyld: { name: 'Wyld', color: '#E91E63', category: 'Edibles' },
  papabarkley: { name: 'Papa & Barkley', color: '#2E7D32', category: 'Topicals' },
};

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT CATALOG DATA
   ═══════════════════════════════════════════════════════════════════ */

const OUT_OF_STOCK_PRODUCTS = [
  {
    id: 'stz-001',
    brand: 'STIIIZY',
    name: 'STIIIZY OG Kush Pod',
    type: 'Vape Pod · 1g',
    thc: '86%',
    lastPrice: '$45.00',
    avgWeeklySales: 42,
    daysOutOfStock: 3,
    urgency: 'high',
    supplier: 'STIIIZY Direct',
    leadTime: '2-3 days',
    paymentTerms: 'Net 15',
    brandColor: '#1a1a1a',
    image: brandImg('/brands/stiiizy-pods.png'),
    recommendedQty: 36,
  },
  {
    id: 'kv-001',
    brand: 'Kiva',
    name: 'Camino Pineapple Habanero Gummies',
    type: 'Edible · 100mg',
    thc: '10mg/pc',
    lastPrice: '$22.00',
    avgWeeklySales: 55,
    daysOutOfStock: 1,
    urgency: 'high',
    supplier: 'Kiva Sales Inc.',
    leadTime: '3-5 days',
    paymentTerms: 'Net 30',
    brandColor: '#8B4513',
    image: brandImg('/brands/kiva-camino.jpg'),
    recommendedQty: 24,
  },
  {
    id: 'rg-001',
    brand: 'Raw Garden',
    name: 'Refined Live Resin Cart — Slippery Susan',
    type: 'Vape Cart · 1g',
    thc: '82%',
    lastPrice: '$40.00',
    avgWeeklySales: 28,
    daysOutOfStock: 5,
    urgency: 'medium',
    supplier: 'Raw Garden LLC',
    leadTime: '3-4 days',
    paymentTerms: 'COD',
    brandColor: '#4CAF50',
    image: brandImg('/brands/raw-garden-cart.webp'),
    recommendedQty: 18,
  },
  {
    id: 'wy-001',
    brand: 'Wyld',
    name: 'Elderberry Gummies — Indica',
    type: 'Edible · 100mg',
    thc: '10mg/pc',
    lastPrice: '$18.00',
    avgWeeklySales: 35,
    daysOutOfStock: 2,
    urgency: 'medium',
    supplier: 'Wyld Distribution',
    leadTime: '4-5 days',
    paymentTerms: 'Net 30',
    brandColor: '#E91E63',
    image: brandImg('/brands/wyld-elderberry.png'),
    recommendedQty: 18,
  },
  {
    id: 'jt-001',
    brand: 'Jeeter',
    name: 'Baby Jeeter Infused — Churros',
    type: '5pk Pre-Rolls · 2.5g',
    thc: '46%',
    lastPrice: '$35.00',
    avgWeeklySales: 62,
    daysOutOfStock: 0,
    urgency: 'low',
    supplier: 'DreamFields (Jeeter)',
    leadTime: '2-3 days',
    paymentTerms: 'Net 7',
    note: 'Low stock — 8 units remaining',
    brandColor: '#7B2D8E',
    image: brandImg('/brands/jeeter-baby-churros.webp'),
    recommendedQty: 48,
  },
];

const NEW_PRODUCTS = [
  {
    id: 'al-new-001',
    brand: 'Alien Labs',
    name: 'Xeno — Live Resin Disposable',
    type: 'Disposable Vape · 1g',
    thc: '88%',
    wholesalePrice: '$28.00',
    suggestedRetail: '$48.00',
    margin: '42%',
    trending: true,
    rating: 4.8,
    brandColor: '#00BCD4',
    description: 'New live resin disposable. Top seller across CA dispensaries last 30 days.',
    image: brandImg('/brands/alien-xeno.png'),
  },
  {
    id: 'ck-new-001',
    brand: 'Cookies',
    name: 'Gary Payton — 3.5g Flower',
    type: 'Flower · 3.5g',
    thc: '28%',
    wholesalePrice: '$32.00',
    suggestedRetail: '$55.00',
    margin: '42%',
    trending: true,
    rating: 4.9,
    brandColor: '#2196F3',
    description: 'Iconic strain. Consistent top-5 seller in NYC metro dispensaries.',
    image: brandImg('/brands/cookies-gary-payton.png'),
  },
  {
    id: 'ps-new-001',
    brand: 'PLUS',
    name: 'Dual Chamber Gummies — Uplift/Chill',
    type: 'Edible · 200mg',
    thc: '10mg/pc',
    wholesalePrice: '$14.00',
    suggestedRetail: '$28.00',
    margin: '50%',
    trending: false,
    rating: 4.6,
    brandColor: '#FF6B35',
    description: 'Two-flavor gummy pack. Great for cross-selling to edible customers.',
    image: brandImg('/brands/plus-gummies.jpg'),
  },
  {
    id: 'rg-new-001',
    brand: 'Raw Garden',
    name: 'Refined Live Resin — Lemon Glaze',
    type: 'Vape Cart · 1g',
    thc: '85%',
    wholesalePrice: '$24.00',
    suggestedRetail: '$42.00',
    margin: '43%',
    trending: false,
    rating: 4.7,
    brandColor: '#4CAF50',
    description: 'New strain addition. Pairs well with existing Raw Garden inventory.',
    image: brandImg('/brands/raw-garden-cart.webp'),
  },
  {
    id: 'wy-new-001',
    brand: 'Wyld',
    name: 'Raspberry Gummies — Sativa',
    type: 'Edible · 100mg',
    thc: '10mg/pc',
    wholesalePrice: '$11.00',
    suggestedRetail: '$22.00',
    margin: '50%',
    trending: true,
    rating: 4.9,
    brandColor: '#E91E63',
    description: 'America\'s #1 selling cannabis gummy. Real fruit, sativa-enhanced terpenes for uplifting energy.',
    image: brandImg('/brands/wyld-raspberry.png'),
  },
  {
    id: 'pb-new-001',
    brand: 'Papa & Barkley',
    name: 'Releaf Balm 1:3 — THC Rich',
    type: 'Topical · 50ml',
    thc: '300mg THC',
    wholesalePrice: '$24.00',
    suggestedRetail: '$48.00',
    margin: '50%',
    trending: false,
    rating: 4.8,
    brandColor: '#2E7D32',
    description: 'Award-winning topical for deep muscle relief. Solventless, full-spectrum cannabis infusion.',
    image: brandImg('/brands/papa-barkley-balm.jpg'),
  },
];

const REORDER_RECOMMENDATIONS = [
  { brand: 'Jeeter', product: 'Baby Jeeter Churros 5pk', qty: 48, reason: 'Sells out within 4 days avg', unitPrice: 18.00, avgWeeklySales: 62 },
  { brand: 'STIIIZY', product: 'OG Kush Pod 1g', qty: 36, reason: 'Currently out of stock, high demand', unitPrice: 24.00, avgWeeklySales: 42 },
  { brand: 'Kiva', product: 'Camino Pineapple Habanero', qty: 24, reason: '1 day out of stock, trending up', unitPrice: 10.00, avgWeeklySales: 55 },
  { brand: 'Wyld', product: 'Elderberry Indica Gummies', qty: 18, reason: '2 days out of stock', unitPrice: 8.00, avgWeeklySales: 35 },
];

/* Brand Funded Discounts — only brands with active co-op programs */
const BRAND_DISCOUNT_RATES = {
  'Jeeter':       15,
  'Kiva':          8,
  'Wyld':         12,
};

function getBrandDiscount(brand) {
  const pct = BRAND_DISCOUNT_RATES[brand];
  if (!pct) return null;
  return { brand, pct, label: `${brand} ${pct}% Brand Funded` };
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT CARDS
   ═══════════════════════════════════════════════════════════════════ */

function OutOfStockCard({ product, selected, onToggle, quantity, onQuantityChange, discount, discountApplied, onToggleDiscount, subtotal, formulaQty, daysOfCoverage }) {
  const unitPrice = parseFloat((product.lastPrice || '$0').replace('$', '')) || 0;
  const lineSubtotal = subtotal != null ? subtotal : unitPrice * quantity;

  return (
    <div
      className={`bg-surface-bg rounded-lg border p-3 transition-all ${
        selected ? 'border-accent-green/50 bg-accent-green/5' : 'border-surface-border'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* checkbox */}
        <div
          className={`w-4.5 h-4.5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors cursor-pointer ${
            selected ? 'bg-accent-green border-accent-green' : 'border-surface-border'
          }`}
          style={{ width: 18, height: 18 }}
          onClick={onToggle}
        >
          {selected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        {/* product thumbnail */}
        {product.image && (
          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-surface-border" style={{ background: `${product.brandColor}15` }}>
            <img src={product.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {/* product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[9px] font-bold px-1.5 py-px rounded text-white" style={{ background: product.brandColor }}>{product.brand}</span>
            {product.urgency === 'high' && <span className="text-[9px] px-1.5 py-px rounded bg-red-500/20 text-red-400 font-medium flex items-center gap-0.5"><AlertTriangle className="w-2 h-2" /> Urgent</span>}
            {product.note && <span className="text-[9px] px-1.5 py-px rounded bg-amber-500/20 text-amber-400 font-medium">{product.note}</span>}
            {discount && (
              <button
                onClick={onToggleDiscount}
                className={`text-[9px] px-1.5 py-px rounded-full font-medium flex items-center gap-0.5 transition-colors cursor-pointer ${
                  discountApplied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-surface-border text-text-secondary border border-surface-border'
                }`}
              >
                <Percent className="w-2 h-2" />
                {discount.label}
              </button>
            )}
          </div>
          <p className="text-xs font-medium text-text-primary">{product.name}</p>
          <p className="text-[10px] text-text-secondary">{product.type} · THC {product.thc}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-text-secondary">~{Math.round((product.avgWeeklySales || 0) / 7)}/day</span>
            <span className="text-[10px] text-text-secondary">{product.daysOutOfStock > 0 ? `${product.daysOutOfStock}d out` : 'Low stock'}</span>
            <span className="text-[10px] text-text-secondary">{product.leadTime}</span>
          </div>
          {formulaQty != null && daysOfCoverage != null && (
            <p className="text-[9px] text-text-muted mt-1">
              {formulaQty} units for {daysOfCoverage}d coverage
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0 space-y-1.5">
          <p className="text-xs font-bold text-text-primary">{product.lastPrice}<span className="text-[9px] font-normal text-text-muted">/ea</span></p>
          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
            >−</button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-10 h-5 text-center text-[11px] font-bold text-text-primary bg-surface-card border border-surface-border rounded focus:border-accent-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
            >+</button>
          </div>
          {selected && (
            <p className="text-[10px] font-medium text-text-primary">
              ${lineSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              {discount && discountApplied && <span className="text-emerald-400 ml-1">(-{discount.pct}%)</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NewProductCard({ product }) {
  return (
    <div className="bg-surface-bg rounded-xl border border-surface-border hover:border-surface-border p-4 transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: product.brandColor }}>{product.brand}</span>
        {product.trending && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green font-medium flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> Trending</span>}
        <div className="ml-auto flex items-center gap-0.5">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-[11px] text-amber-400 font-medium">{product.rating}</span>
        </div>
      </div>
      {/* product visual */}
      <div className="h-32 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden" style={{
        background: `linear-gradient(135deg, ${product.brandColor}22, ${product.brandColor}11)`,
      }}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 70% 30%, ${product.brandColor} 0%, transparent 60%)`,
            }} />
            <div className="relative text-center">
              {product.type.includes('Flower') ? (
                <div className="w-12 h-12 rounded-full mx-auto mb-1" style={{ background: `radial-gradient(circle, #4a7c3f, #2d5a27, #1a3a17)` }} />
              ) : product.type.includes('Vape') || product.type.includes('Disposable') ? (
                <div className="relative mx-auto w-5">
                  <div className="w-5 h-16 rounded-full mx-auto" style={{ background: `linear-gradient(to bottom, ${product.brandColor}88, ${product.brandColor}44)` }} />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-4 rounded-b-lg bg-surface-card" />
                </div>
              ) : (
                <div className="w-14 h-10 rounded-lg mx-auto" style={{ background: `linear-gradient(135deg, ${product.brandColor}66, ${product.brandColor}33)`, border: `1px solid ${product.brandColor}44` }} />
              )}
            </div>
          </>
        )}
      </div>
      {/* info */}
      <p className="text-sm font-medium text-text-primary">{product.name}</p>
      <p className="text-xs text-text-secondary mb-2">{product.type}</p>
      <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{product.description}</p>
      {/* pricing */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-border">
        <div>
          <p className="text-[10px] text-text-muted">Wholesale</p>
          <p className="text-sm font-bold text-text-primary">{product.wholesalePrice}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Retail</p>
          <p className="text-sm font-bold text-text-primary">{product.suggestedRetail}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Margin</p>
          <p className="text-sm font-bold text-accent-green">{product.margin}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COLLAPSIBLE SECTION
   ═══════════════════════════════════════════════════════════════════ */

function Section({ title, icon: Icon, iconColor, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-hover transition-colors">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
        <h2 className="text-xs font-semibold text-text-primary">{title}</h2>
        {badge && <span className="text-[9px] px-1.5 py-px rounded-full bg-accent-green/10 text-accent-green font-medium">{badge}</span>}
        <div className="ml-auto">{open ? <ChevronUp className="w-3.5 h-3.5 text-text-secondary" /> : <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />}</div>
      </button>
      {open && <div className="px-4 pb-4 border-t border-surface-border pt-3">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RESULT VIEWS
   ═══════════════════════════════════════════════════════════════════ */

export function ReorderView({ data, onBack }) {
  const products = data?.products || OUT_OF_STOCK_PRODUCTS;
  const recommendations = data?.recommendations || REORDER_RECOMMENDATIONS;
  const newBrandItems = data?.newBrandItems || [];

  const [selected, setSelected] = useState(() => new Set(products.filter(p => p.urgency === 'high').map(p => p.id)));
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [daysOfCoverage, setDaysOfCoverage] = useState(14);

  // New brand items: track which are added to PO and their quantities
  const [newItemsAdded, setNewItemsAdded] = useState(() => new Set());
  const [newItemQtys, setNewItemQtys] = useState(() => newBrandItems.reduce((acc, _, i) => ({ ...acc, [i]: 12 }), {}));

  // Per-product brand discount toggles (default on for eligible items)
  const [discountsApplied, setDiscountsApplied] = useState(() => {
    const d = {};
    products.forEach(p => { if (getBrandDiscount(p.brand)) d[p.id] = true; });
    return d;
  });
  const [recDiscountsApplied, setRecDiscountsApplied] = useState(() => {
    const d = {};
    recommendations.forEach((r, i) => { if (getBrandDiscount(r.brand)) d[i] = true; });
    return d;
  });

  // Formula-driven quantities: (avgWeeklySales / 7) × daysOfCoverage
  const avgDailySales = (weekly) => (weekly || 0) / 7;
  const formulaQuantities = useMemo(() => {
    const q = {};
    products.forEach(p => { q[p.id] = Math.ceil(avgDailySales(p.avgWeeklySales) * daysOfCoverage); });
    return q;
  }, [products, daysOfCoverage]);

  const formulaRecQuantities = useMemo(() => {
    return recommendations.map(r => Math.ceil(avgDailySales(r.avgWeeklySales) * daysOfCoverage));
  }, [recommendations, daysOfCoverage]);

  const [quantities, setQuantities] = useState(() => {
    const q = {};
    products.forEach(p => { q[p.id] = p.recommendedQty || Math.ceil(avgDailySales(p.avgWeeklySales) * 14); });
    return q;
  });
  const [recQuantities, setRecQuantities] = useState(() => recommendations.map(r => r.qty || Math.ceil(avgDailySales(r.avgWeeklySales) * 14)));

  // Reset quantities when daysOfCoverage changes
  useEffect(() => {
    setQuantities(() => {
      const q = {};
      products.forEach(p => { q[p.id] = Math.ceil(avgDailySales(p.avgWeeklySales) * daysOfCoverage) || p.recommendedQty || 0; });
      return q;
    });
    setRecQuantities(recommendations.map(r => Math.ceil(avgDailySales(r.avgWeeklySales) * daysOfCoverage) || r.qty || 0));
  }, [daysOfCoverage, products, recommendations]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  // Unified cost calculation: selected out-of-stock products + recommendations
  const costBreakdown = useMemo(() => {
    // Out-of-stock products subtotal
    let productsSubtotal = 0;
    let productsSavings = 0;
    products.filter(p => selected.has(p.id)).forEach(p => {
      const price = parseFloat((p.lastPrice || '$0').replace('$', '')) || 0;
      const qty = quantities[p.id] || 0;
      const raw = price * qty;
      const disc = getBrandDiscount(p.brand);
      if (disc && discountsApplied[p.id]) {
        const saving = raw * (disc.pct / 100);
        productsSavings += saving;
        productsSubtotal += raw - saving;
      } else {
        productsSubtotal += raw;
      }
    });

    // Recommendations subtotal
    let recsSubtotal = 0;
    let recsSavings = 0;
    recommendations.forEach((r, i) => {
      const price = r.unitPrice || 0;
      const qty = recQuantities[i] || 0;
      const raw = price * qty;
      const disc = getBrandDiscount(r.brand);
      if (disc && recDiscountsApplied[i]) {
        const saving = raw * (disc.pct / 100);
        recsSavings += saving;
        recsSubtotal += raw - saving;
      } else {
        recsSubtotal += raw;
      }
    });

    // New brand items subtotal (always get brand-funded discount)
    let newItemsSubtotal = 0;
    let newItemsSavings = 0;
    newBrandItems.forEach((item, i) => {
      if (!newItemsAdded.has(i)) return;
      const raw = (item.wholesalePrice || 0) * (newItemQtys[i] || 0);
      // New items always get a 15% brand-funded intro discount
      const saving = raw * 0.15;
      newItemsSavings += saving;
      newItemsSubtotal += raw - saving;
    });

    const totalSavings = productsSavings + recsSavings + newItemsSavings;
    const grandTotal = productsSubtotal + recsSubtotal + newItemsSubtotal;

    return { productsSubtotal, recsSubtotal, newItemsSubtotal, totalSavings, grandTotal, newItemsSavings };
  }, [products, selected, quantities, discountsApplied, recommendations, recQuantities, recDiscountsApplied, newBrandItems, newItemsAdded, newItemQtys]);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleOrder = () => {
    setOrdering(true);
    setTimeout(() => { setOrdering(false); setOrdered(true); }, 2200);
  };

  const heroTitle = data?.title || 'Reorder Out-of-Stock & Low-Stock Items';
  const lostRevenue = data?.lostRevenue || '$2,340/week';

  // Helper to compute per-product subtotal
  const getProductSubtotal = (p) => {
    const price = parseFloat((p.lastPrice || '$0').replace('$', '')) || 0;
    const qty = quantities[p.id] || 0;
    const raw = price * qty;
    const disc = getBrandDiscount(p.brand);
    if (disc && discountsApplied[p.id]) return raw * (1 - disc.pct / 100);
    return raw;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      {/* inventory summary */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-accent-gold/15 flex items-center justify-center flex-shrink-0">
            <Package className="w-3.5 h-3.5 text-accent-gold" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{heroTitle}</h2>
            <p className="text-[11px] text-text-secondary">
              {products.filter((p) => p.daysOutOfStock > 0).length} out of stock · est. {lostRevenue} lost/wk
            </p>
          </div>
        </div>
      </div>

      {/* days-of-stock slider */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-accent-gold" />
          <span className="text-xs font-medium text-text-primary">How many days of stock?</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-gold/10 text-accent-gold font-medium">
            {daysOfCoverage} days
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-secondary w-5 text-center">7d</span>
          <input
            type="range"
            min="7"
            max="42"
            step="1"
            value={daysOfCoverage}
            onChange={(e) => setDaysOfCoverage(parseInt(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-surface-border accent-[var(--color-accent-gold)] cursor-pointer"
          />
          <span className="text-[10px] text-text-secondary w-5 text-center">42d</span>
        </div>
        <p className="text-[10px] text-text-muted mt-1.5">
          Based on avg daily sales — quantities adjust automatically
        </p>
      </div>

      {/* out of stock items */}
      <Section title="Needs Reorder" icon={PackageX} iconColor="var(--color-accent-red)" badge={`${products.length} items`}>
        <div className="space-y-3">
          {products.map((p) => (
            <OutOfStockCard
              key={p.id}
              product={p}
              selected={selected.has(p.id)}
              onToggle={() => toggle(p.id)}
              quantity={quantities[p.id] || 0}
              onQuantityChange={(val) => setQuantities(prev => ({ ...prev, [p.id]: val }))}
              discount={getBrandDiscount(p.brand)}
              discountApplied={!!discountsApplied[p.id]}
              onToggleDiscount={() => setDiscountsApplied(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
              subtotal={getProductSubtotal(p)}
              formulaQty={formulaQuantities[p.id]}
              daysOfCoverage={daysOfCoverage}
            />
          ))}
        </div>
      </Section>

      {/* smart reorder quantities */}
      {recommendations.length > 0 && <Section
        title={products.length === 1 ? `Other ${products[0].brand} Items — Low / OOS` : 'Also Recommended'}
        icon={BarChart3}
        iconColor="var(--color-accent-gold)"
        badge={`${recommendations.length} item${recommendations.length > 1 ? 's' : ''}`}
      >
        <p className="text-[10px] text-text-secondary mb-3">
          {products.length === 1
            ? `Other ${products[0].brand} products that are low or out of stock. Include them in this PO?`
            : 'Based on recent sales trends. Adjust quantities as needed.'}
        </p>
        <div className="space-y-2">
          {recommendations.map((r, i) => {
            const lineCost = (r.unitPrice || 0) * (recQuantities[i] || 0);
            const disc = getBrandDiscount(r.brand);
            const discApplied = !!recDiscountsApplied[i];
            const finalCost = disc && discApplied ? lineCost * (1 - disc.pct / 100) : lineCost;

            return (
              <div key={i} className="bg-surface-bg rounded-lg p-2.5 border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent-gold/10">
                    <Package className="w-3.5 h-3.5 text-accent-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[11px] font-medium text-text-primary">{r.brand} — {r.product}</p>
                      {disc && (
                        <button
                          onClick={() => setRecDiscountsApplied(prev => ({ ...prev, [i]: !prev[i] }))}
                          className={`text-[9px] px-1.5 py-px rounded-full font-medium flex items-center gap-0.5 transition-colors cursor-pointer ${
                            discApplied
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-surface-border text-text-secondary border border-surface-border'
                          }`}
                        >
                          <Percent className="w-2 h-2" />
                          {disc.label}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-text-secondary">{r.reason}</p>
                    {r.avgWeeklySales != null && r.unitPrice != null && (
                      <p className="text-[9px] text-text-muted mt-0.5">
                        {formulaRecQuantities[i]} for {daysOfCoverage}d · ${(r.unitPrice || 0).toFixed(2)}/ea
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setRecQuantities(prev => { const next = [...prev]; next[i] = Math.max(0, next[i] - 1); return next; })}
                        className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
                      >−</button>
                      <input
                        type="number"
                        value={recQuantities[i]}
                        onChange={(e) => setRecQuantities(prev => { const next = [...prev]; next[i] = Math.max(0, parseInt(e.target.value) || 0); return next; })}
                        className="w-10 h-5 text-center text-[11px] font-bold text-text-primary bg-surface-card border border-surface-border rounded focus:border-accent-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setRecQuantities(prev => { const next = [...prev]; next[i] = next[i] + 1; return next; })}
                        className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
                      >+</button>
                    </div>
                    <div className="text-right w-16">
                      <p className="text-[11px] font-medium text-text-primary">
                        ${finalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      {disc && discApplied && (
                        <p className="text-[9px] text-emerald-400">-{disc.pct}%</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Itemized cost breakdown */}
        <div className="mt-3 pt-3 border-t border-surface-border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">Selected ({selected.size})</span>
            <span className="text-[11px] text-text-primary">${costBreakdown.productsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">Recommended ({recommendations.length})</span>
            <span className="text-[11px] text-text-primary">${costBreakdown.recsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {costBreakdown.newItemsSubtotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-accent-purple">New items ({newItemsAdded.size})</span>
              <span className="text-[11px] text-text-primary">${costBreakdown.newItemsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {costBreakdown.totalSavings > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Percent className="w-2.5 h-2.5" /> Brand discounts
              </span>
              <span className="text-[11px] text-emerald-400">-${costBreakdown.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-surface-border">
            <span className="text-xs font-medium text-text-primary">Total</span>
            <span className="text-base font-bold text-accent-gold">${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </Section>}

      {/* New brand items the store doesn't carry */}
      {newBrandItems.length > 0 && (
        <Section
          title={`New from ${newBrandItems[0]?.brand || 'Brand'} — Start Carrying`}
          icon={Sparkles}
          iconColor="var(--color-accent-purple)"
          badge="Brand Funded"
          defaultOpen={true}
        >
          <p className="text-[10px] text-text-secondary mb-3">
            {newBrandItems[0]?.brand} products not currently in your store. Add them to this PO with a <span className="text-emerald-400 font-semibold">15% brand-funded intro discount</span>.
          </p>
          <div className="space-y-2">
            {newBrandItems.map((item, i) => {
              const isAdded = newItemsAdded.has(i);
              const qty = newItemQtys[i] || 12;
              const lineCost = (item.wholesalePrice || 0) * qty;
              const discounted = lineCost * 0.85;
              const margin = item.retailPrice > 0 ? Math.round(((item.retailPrice - item.wholesalePrice * 0.85) / item.retailPrice) * 100) : 0;
              return (
                <div key={i} className={`bg-surface-bg rounded-lg p-3 border transition-all ${isAdded ? 'border-accent-purple/40 bg-accent-purple/5' : 'border-surface-border'}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-[18px] h-[18px] rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                        isAdded ? 'bg-accent-purple border-accent-purple' : 'border-surface-border'
                      }`}
                      onClick={() => setNewItemsAdded(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; })}
                    >
                      {isAdded && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent-purple/10 flex-shrink-0">
                      <Package className="w-3.5 h-3.5 text-accent-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[11px] font-medium text-text-primary">{item.name}</p>
                        <span className="text-[9px] px-1.5 py-px rounded-full bg-accent-purple/15 text-accent-purple font-medium border border-accent-purple/20">NEW</span>
                        <span className="text-[9px] px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20 flex items-center gap-0.5">
                          <Percent className="w-2 h-2" />15% Brand Funded
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary">{item.category} · Retail ${item.retailPrice} · Wholesale ${item.wholesalePrice.toFixed(2)} · <span className="text-emerald-400">{margin}% margin</span></p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isAdded && (
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => setNewItemQtys(prev => ({ ...prev, [i]: Math.max(1, (prev[i] || 12) - 1) }))} className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors">−</button>
                          <input type="number" value={qty} onChange={(e) => setNewItemQtys(prev => ({ ...prev, [i]: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-10 h-5 text-center text-[11px] font-bold text-text-primary bg-surface-card border border-surface-border rounded focus:border-accent-purple focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <button onClick={() => setNewItemQtys(prev => ({ ...prev, [i]: (prev[i] || 12) + 1 }))} className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors">+</button>
                        </div>
                      )}
                      <div className="text-right w-16">
                        {isAdded ? (
                          <>
                            <p className="text-[11px] font-medium text-text-primary">${discounted.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p className="text-[9px] text-emerald-400">-15%</p>
                          </>
                        ) : (
                          <p className="text-[10px] text-text-muted">${lineCost.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* supplier info */}
      <Section title="Supplier Details" icon={Building2} iconColor="var(--color-accent-blue)" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...new Map(products.map((p) => [p.supplier, p])).values()].map((p) => (
            <div key={p.supplier} className="bg-surface-bg rounded-lg p-4 border border-surface-border">
              <p className="text-sm font-medium text-text-primary mb-1">{p.supplier}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <Truck className="w-3 h-3" /> Lead time: {p.leadTime}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <DollarSign className="w-3 h-3" /> Payment terms: {p.paymentTerms}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <Phone className="w-3 h-3" /> Account rep on file
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <CheckCircle2 className="w-3 h-3 text-accent-green" /> Verified supplier
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* order CTA */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6">
        {ordered ? (
          <div className="flex items-center gap-3 justify-center py-4 animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-accent-green" />
            <div>
              <p className="text-text-primary font-semibold">Purchase Orders Submitted</p>
              <p className="text-sm text-text-secondary">{selected.size} orders sent to suppliers. Estimated delivery in 2-5 business days.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div>
              <p className="text-text-primary font-medium">Place reorder for {selected.size} item{selected.size !== 1 ? 's' : ''}{recommendations.length > 0 ? ` + ${recommendations.length} recommended` : ''}?</p>
              <p className="text-sm text-text-secondary">Purchase orders will be sent to respective suppliers.
                {costBreakdown.totalSavings > 0 && <span className="text-emerald-400"> Saving ${costBreakdown.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} with brand funded discounts.</span>}
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={ordering || selected.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-blue to-blue-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
            >
              {ordering ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><ShoppingCart className="w-4 h-4" /> Place Orders — ${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
              )}
            </button>
            <ConfirmationDrawer
              open={showConfirm}
              onCancel={() => setShowConfirm(false)}
              onConfirm={() => { setShowConfirm(false); handleOrder(); }}
              title="Confirm Purchase Orders"
              description={`Sending POs to ${[...new Map(products.filter(p => selected.has(p.id)).map(p => [p.supplier, p])).values()].length} suppliers`}
              icon={ShoppingCart}
              confirmLabel={`Place Orders — $${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              confirmColor="#2563EB"
              details={[
                { label: 'Items', value: `${selected.size} selected + ${recommendations.length} recommended` },
                { label: 'Subtotal', value: `$${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                ...(costBreakdown.totalSavings > 0 ? [{ label: 'Brand Discounts', value: `-$${costBreakdown.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }] : []),
                { label: 'Est. Delivery', value: '2-5 business days' },
              ]}
              warning="Purchase orders will be sent to suppliers immediately upon confirmation."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ExploreView({ data, onBack }) {
  const products = data?.products || NEW_PRODUCTS;
  const brandPerformance = data?.brandPerformance || [
    { name: 'Jeeter', revenue: '$12,400/mo', growth: '+18%', color: '#7B2D8E', pct: 85 },
    { name: 'STIIIZY', revenue: '$10,800/mo', growth: '+12%', color: '#1a1a1a', pct: 74 },
    { name: 'Kiva', revenue: '$8,200/mo', growth: '+8%', color: '#8B4513', pct: 56 },
    { name: 'Raw Garden', revenue: '$7,600/mo', growth: '+5%', color: '#4CAF50', pct: 52 },
    { name: 'Cookies', revenue: '$6,100/mo', growth: '+22%', color: '#2196F3', pct: 42 },
  ];
  const categoryGaps = data?.categoryGaps || [
    { category: 'Disposable Vapes', gap: '32% under-indexed', opportunity: '+$4,200/mo', color: 'var(--color-accent-blue)' },
    { category: 'Topicals & Tinctures', gap: '28% under-indexed', opportunity: '+$1,800/mo', color: 'var(--color-accent-purple)' },
    { category: 'Beverages', gap: '45% under-indexed', opportunity: '+$2,100/mo', color: 'var(--color-accent-green)' },
  ];
  const [cart, setCart] = useState(new Set());

  const heroTitle = data?.title || 'Explore New Products from Top Brands';
  const heroSubtitle = data?.subtitle || `${products.length} recommended products based on market trends and catalog gap analysis`;

  return (
    <div className="space-y-4 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-accent-blue" />
        </div>
        <div>
          <p className="text-sm text-text-secondary">
            <span className="text-text-primary font-medium">Connect Agent</span> curated these products based on your sales data, trending products in the NYC market, and gap analysis of your current catalog
          </p>
        </div>
      </div>

      {/* hero */}
      <div className="relative rounded-2xl border border-blue-500/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-purple-900/40" />
        <div className="relative px-8 py-6">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-surface-border text-text-muted uppercase tracking-wider">Product Discovery</span>
          <h1 className="text-xl font-bold text-text-primary mt-2">{heroTitle}</h1>
          <p className="text-sm text-text-secondary mt-1">{heroSubtitle}</p>
        </div>
      </div>

      {/* trending products */}
      <Section title="Recommended for Your Store" icon={TrendingUp} iconColor="var(--color-accent-green)" badge={`${products.length} products`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <NewProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      {/* brand performance */}
      <Section title="Your Top Brands by Revenue" icon={Award} iconColor="var(--color-accent-gold)" defaultOpen={false}>
        <div className="space-y-2">
          {brandPerformance.map((b) => (
            <div key={b.name} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: b.color + '33' }}>
                <span className="text-[10px] font-bold text-text-primary">{b.name[0]}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-primary">{b.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{b.revenue}</span>
                    <span className="text-[10px] text-accent-green">{b.growth}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-surface-border">
                  <div className="h-1.5 rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* category analysis */}
      <Section title="Category Gap Analysis" icon={Layers} iconColor="#EC4899" defaultOpen={false}>
        <p className="text-xs text-text-secondary mb-4">Categories where your store is under-indexed compared to NYC market average.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {categoryGaps.map((c) => (
            <div key={c.category} className="bg-surface-bg rounded-lg p-4 border border-surface-border">
              <p className="text-xs font-medium text-text-primary mb-1">{c.category}</p>
              <p className="text-[11px] text-text-secondary mb-2">{c.gap}</p>
              <p className="text-sm font-bold" style={{ color: c.color }}>{c.opportunity}</p>
              <p className="text-[10px] text-text-muted">est. revenue opportunity</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function RecommendationsView({ data, onBack }) {
  const metrics = data?.metrics || [
    { label: 'Stockout Rate', value: '6.2%', change: '-1.8%', iconName: 'PackageX', color: 'var(--color-accent-red)', changeColor: 'var(--color-accent-green)' },
    { label: 'Avg Margin', value: '43.1%', change: '+2.4%', iconName: 'CircleDollarSign', color: 'var(--color-accent-green)', changeColor: 'var(--color-accent-green)' },
    { label: 'Inventory Turns', value: '4.8x', change: '+0.3', iconName: 'RefreshCw', color: 'var(--color-accent-blue)', changeColor: 'var(--color-accent-green)' },
    { label: 'Dead Stock', value: '$1,240', change: '-$680', iconName: 'TrendingDown', color: 'var(--color-accent-gold)', changeColor: 'var(--color-accent-green)' },
  ];
  const actionItems = data?.actionItems || [
    { action: 'Increase Jeeter Baby Jeeter Churros order qty from 36 to 48 units', reason: 'Consistently sells out 2 days before restock. Lost ~$840/mo in revenue.', priority: 'High' },
    { action: 'Add Alien Labs Xeno Disposable to catalog', reason: 'Top trending disposable in NYC. 42% margin. No disposable vapes currently in catalog.', priority: 'High' },
    { action: 'Reduce Wyld Elderberry order from 24 to 14 units', reason: 'Sales velocity dropped 30% last month. Current qty leads to 6+ days overstock.', priority: 'Medium' },
    { action: 'Negotiate bulk pricing with STIIIZY for OG Kush pods', reason: 'Your #2 seller. Increasing order to 48+ units may unlock tier 2 pricing (~8% savings).', priority: 'Medium' },
    { action: 'Consider dropping Select Elite cartridge line', reason: 'Below 2 units/week avg sales. $380 in dead stock. Shelf space better used for Raw Garden expansion.', priority: 'Low' },
  ];

  const heroTitle = data?.title || 'Purchasing Recommendations';
  const heroSubtitle = data?.subtitle || 'Maximize margins and reduce stockouts with data-driven ordering';

  const priorityColors = { High: 'var(--color-accent-red)', Medium: 'var(--color-accent-gold)', Low: 'var(--color-accent-blue)' };

  return (
    <div className="space-y-4 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-accent-blue" />
        </div>
        <p className="text-sm text-text-secondary">
          <span className="text-text-primary font-medium">Connect Agent</span> analyzed your inventory performance over the last 90 days. Here are actionable purchasing recommendations:
        </p>
      </div>

      {/* hero */}
      <div className="relative rounded-2xl border border-green-500/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-emerald-900/20 to-teal-900/40" />
        <div className="relative px-8 py-6">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-surface-border text-text-muted uppercase tracking-wider">Smart Purchasing</span>
          <h1 className="text-xl font-bold text-text-primary mt-2">{heroTitle}</h1>
          <p className="text-sm text-text-secondary mt-1">{heroSubtitle}</p>
        </div>
      </div>

      {/* key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const MIcon = resolveIcon(m.iconName || m.icon);
          return (
            <div key={m.label} className="bg-surface-card rounded-xl border border-surface-border p-4">
              <MIcon className="w-4 h-4 mb-2" style={{ color: m.color || 'var(--color-accent-blue)' }} />
              <p className="text-[10px] text-text-muted">{m.label}</p>
              <p className="text-lg font-bold text-text-primary">{m.value}</p>
              <p className="text-[10px] font-medium" style={{ color: m.changeColor || 'var(--color-accent-green)' }}>{m.change} vs last month</p>
            </div>
          );
        })}
      </div>

      {/* recommendations */}
      <Section title="Action Items" icon={Zap} iconColor="var(--color-accent-gold)" badge={`${actionItems.length} recommendations`}>
        <div className="space-y-3">
          {actionItems.map((r, i) => {
            const color = priorityColors[r.priority] || '#8B949E';
            return (
              <div key={i} className="bg-surface-bg rounded-lg p-4 border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: color + '22', color }}>{r.priority}</span>
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">{r.action}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{r.reason}</p>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TYPING INDICATOR
   ═══════════════════════════════════════════════════════════════════ */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-accent-blue" />
      </div>
      <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUGGESTION DATA
   ═══════════════════════════════════════════════════════════════════ */

const SUGGESTIONS = [
  {
    key: 'reorder-oos',
    label: 'Reorder Out-of-Stock',
    prompt: 'Analyze our out-of-stock products and generate optimal reorder quantities with supplier details and cost estimates',
    description: 'Scan inventory for stockouts and low-stock items, generate optimal reorder quantities with cost estimates',
    icon: PackageX,
    gradient: 'from-red-600/20 to-orange-600/20',
    border: 'hover:border-red-500/40',
    tag: 'Urgent',
    tagColor: 'var(--color-accent-red)',
    confidence: 'high',
  },
  {
    key: 'explore-new',
    label: 'Explore New Products',
    prompt: 'Identify trending products in the NYC cannabis market that we should add to our catalog, with margin analysis',
    description: 'Discover trending products from top brands based on NYC market data and your catalog gaps',
    icon: Sparkles,
    gradient: 'from-blue-600/20 to-indigo-600/20',
    border: 'hover:border-blue-500/40',
    tag: 'Discovery',
    tagColor: 'var(--color-accent-blue)',
    confidence: 'medium',
  },
  {
    key: 'purchasing-recs',
    label: 'Purchasing Recommendations',
    prompt: 'Generate purchasing optimization recommendations: reorder quantities, dead stock reduction, margin improvement, and supplier negotiation opportunities',
    description: 'AI-powered order optimization: adjust quantities, negotiate pricing, reduce dead stock',
    icon: TrendingUp,
    gradient: 'from-green-600/20 to-emerald-600/20',
    border: 'hover:border-green-500/40',
    tag: 'Optimization',
    tagColor: 'var(--color-accent-green)',
    confidence: 'high',
  },
  {
    key: 'margin-analysis',
    label: 'Margin Analysis',
    prompt: 'Perform a deep-dive margin analysis across all product categories and brands, identifying the highest and lowest margin items and opportunities to improve profitability',
    description: 'Deep-dive into margins by category and brand — find profit opportunities and underperformers',
    icon: CircleDollarSign,
    gradient: 'from-emerald-600/20 to-green-600/20',
    border: 'hover:border-emerald-500/40',
    tag: 'Profitability',
    tagColor: 'var(--color-accent-green)',
  },
  {
    key: 'vendor-comparison',
    label: 'Vendor Comparison',
    prompt: 'Compare our current suppliers on pricing, lead times, reliability, and minimum order quantities, and recommend which vendors to consolidate or negotiate with',
    description: 'Compare suppliers on pricing, lead times, reliability, and negotiation leverage',
    icon: Building2,
    gradient: 'from-indigo-600/20 to-purple-600/20',
    border: 'hover:border-indigo-500/40',
    tag: 'Suppliers',
    tagColor: 'var(--color-accent-purple)',
  },
  {
    key: 'seasonal-forecast',
    label: 'Seasonal Forecast',
    prompt: 'Generate a seasonal inventory forecast for the next 3 months including 4/20 holiday planning, summer trends, and recommended stock-up quantities by category',
    description: 'Plan ahead for 4/20, summer trends, and seasonal demand shifts with stock-up recommendations',
    icon: Calendar,
    gradient: 'from-amber-600/20 to-orange-600/20',
    border: 'hover:border-amber-500/40',
    tag: 'Planning',
    tagColor: 'var(--color-accent-gold)',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function ConnectAgent() {
  const location = useLocation();
  const [view, setView] = useState('idle');
  const [activeView, setActiveView] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const [navStateHandled, setNavStateHandled] = useState(false);

  // Auto-trigger reorder view when navigated from Inventory Analytics with state
  useEffect(() => {
    if (navStateHandled) return;
    const ns = location.state;
    if (ns && ns.product && ns.store) {
      setNavStateHandled(true);

      // Build a focused single-product aiAnalysis so ReorderView shows only this item
      const houseBrands = ['Ozone', 'Ozone Reserve', 'Simply Herb', 'Common Goods', 'Tunnel Vision'];
      const isHouse = houseBrands.includes(ns.brand);
      const suggestedQty = (ns.avgWeekly || 10) * 2;
      const dailySales = (ns.avgWeekly || 10) / 7;
      const lostPerWeek = ns.status === 'oos' ? Math.round(dailySales * (ns.price || 30) * 7) : 0;

      const focusedProduct = {
        id: `inv-${ns.metrcPkg || Date.now()}`,
        brand: ns.brand,
        name: ns.product,
        type: `${ns.category || 'Product'}`,
        thc: '—',
        lastPrice: `$${(ns.price || 0).toFixed(2)}`,
        avgWeeklySales: ns.avgWeekly || 10,
        daysOutOfStock: ns.status === 'oos' ? Math.max(1, Math.ceil(ns.daysSupply || 1)) : 0,
        urgency: ns.status === 'oos' || ns.status === 'critical' ? 'high' : 'medium',
        supplier: isHouse ? `Internal Allocation (${ns.brand})` : `${ns.brand} Distribution`,
        leadTime: isHouse ? '1-2 days' : '3-5 days',
        paymentTerms: isHouse ? 'Internal' : 'Net 30',
        brandColor: 'var(--color-accent-blue)',
        image: null,
        recommendedQty: suggestedQty,
        note: ns.floor === 0 ? `Out of stock · ${ns.vault || 0} in vault` : `${ns.floor} on floor · ${ns.vault || 0} in vault`,
      };

      // Map same-brand low/OOS items into recommendations
      const sameBrandRecs = (ns.sameBrandItems || []).map(item => ({
        brand: item.brand,
        product: `${item.name} — ${item.storeName}`,
        qty: (item.avgWeekly || 10) * 2,
        reason: item.status === 'oos'
          ? `Out of stock at ${item.storeName} · ${item.avgWeekly}/wk avg sales`
          : `${item.status === 'critical' ? 'Critical' : 'Low'} stock at ${item.storeName} · ${item.daysSupply?.toFixed(1)}d supply`,
        unitPrice: (item.price || 0) * 0.55,
        avgWeeklySales: item.avgWeekly || 10,
      }));

      // Map new brand items the store doesn't carry yet
      const newItems = (ns.newBrandItems || []).map(item => ({
        name: item.name,
        brand: item.brand,
        category: item.category,
        retailPrice: item.price,
        wholesalePrice: Math.round(item.price * 0.55 * 100) / 100,
        suggestedQty: 12,
      }));

      const focusedAnalysis = {
        title: `Reorder PO — ${ns.product}`,
        lostRevenue: lostPerWeek > 0 ? `$${lostPerWeek.toLocaleString()}/week` : 'N/A',
        products: [focusedProduct],
        recommendations: sameBrandRecs,
        newBrandItems: newItems,
      };

      const otherCount = sameBrandRecs.length;
      const newCount = newItems.length;
      const contextMsg = `Draft a reorder PO for ${ns.product} (${ns.brand}) at ${ns.store}`;
      setMessages([{ role: 'user', text: contextMsg }]);
      setView('typing');
      setActiveView('reorder');
      setAiAnalysis(focusedAnalysis);
      setTimeout(() => {
        let extraMsg = '';
        if (otherCount > 0) extraMsg += ` I also found **${otherCount} other ${ns.brand} item${otherCount > 1 ? 's' : ''}** that ${otherCount > 1 ? 'are' : 'is'} low or out of stock.`;
        if (newCount > 0) extraMsg += ` Plus **${newCount} ${ns.brand} product${newCount > 1 ? 's' : ''}** you don't currently carry — with brand-funded discounts available.`;
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `I've prepared a focused reorder PO for **${ns.product}** (${ns.brand}) at **${ns.store}**. Suggested quantity: **${suggestedQty} units** (2-week supply based on ${ns.avgWeekly || '~10'}/wk avg sales).${extraMsg} Adjust quantities and days of coverage below, then submit.`
        }]);
        setView('result');
      }, 1500);
    }
  }, [location.state, navStateHandled]);

  const handleSuggestionClick = async (key) => {
    const suggestion = SUGGESTIONS.find((s) => s.key === key);
    setMessages((prev) => [...prev, { role: 'user', text: suggestion.label }]);
    setView('typing');

    if (isGeminiAvailable()) {
      const analysis = await generateConnectAnalysis(suggestion.prompt);
      if (analysis && analysis.title) {
        const wf = analysis.workflowType || 'recommendations';
        setActiveView(wf);
        setAiAnalysis(analysis);
        setMessages((prev) => [...prev, {
          role: 'agent',
          text: `I've completed a **${analysis.title}** analysis based on your inventory data. Here's a detailed breakdown with actionable recommendations:`
        }]);
        setView('result');
        return;
      }
      // Gemini JSON failed — fall through to preset view below
    }

    // Fallback: preset view (always shows proper card/table)
    const presetMap = {
      'reorder-oos': 'reorder', 'explore-new': 'explore', 'purchasing-recs': 'recommendations',
      'margin-analysis': 'recommendations', 'vendor-comparison': 'recommendations', 'seasonal-forecast': 'recommendations',
    };
    const presetKey = presetMap[key] || 'recommendations';
    setActiveView(presetKey);
    setAiAnalysis(null);
    const responseTexts = {
      reorder: `I've scanned your inventory and found **5 items** that need immediate attention. Here's a detailed breakdown with recommended order quantities:`,
      explore: `I've analyzed NYC market trends and your catalog to curate **${NEW_PRODUCTS.length} recommended products** from top brands. Here's what I found:`,
      recommendations: `I've completed a 90-day inventory analysis for Ascend. Here are **5 actionable recommendations** to optimize your purchasing:`,
    };
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'agent', text: responseTexts[presetKey] }]);
      setView('result');
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setView('typing');

    // Gemini first — always try AI generation
    if (isGeminiAvailable()) {
      const analysis = await generateConnectAnalysis(text);
      if (analysis && analysis.title) {
        const wf = analysis.workflowType || 'recommendations';
        setActiveView(wf);
        setAiAnalysis(analysis);
        setMessages((prev) => [...prev, {
          role: 'agent',
          text: `I've completed an analysis for your request. Here's a detailed breakdown with actionable recommendations:`
        }]);
        setView('result');
        return;
      }
      // JSON failed — fall back to text
      const inventoryContext = `Store: Ascend\nOut-of-stock: ${OUT_OF_STOCK_PRODUCTS.map(p => `${p.brand} ${p.name}`).join(', ')}\nBrands: Jeeter, STIIIZY, Kiva, Raw Garden, Cookies, Alien Labs, Wyld, PLUS`;
      const textResponse = await generateConnectResponse(text, inventoryContext);
      if (textResponse) {
        setMessages((prev) => [...prev, { role: 'agent', text: textResponse }]);
        setView('idle');
        return;
      }
    }

    // No Gemini key — graceful degradation via keyword matching to presets
    const lower = text.toLowerCase();
    let matchKey = null;
    if (lower.includes('reorder') || lower.includes('out of stock') || lower.includes('restock') || lower.includes('low stock') || lower.includes('stockout') || lower.includes('replenish') || lower.includes('running low')) matchKey = 'reorder';
    else if (lower.includes('new product') || lower.includes('explore') || lower.includes('discover') || lower.includes('trending') || lower.includes('catalog') || lower.includes('add to menu') || lower.includes('new brand') || lower.includes('what should we stock')) matchKey = 'explore';
    else if (lower.includes('recommend') || lower.includes('optimiz') || lower.includes('margin') || lower.includes('dead stock') || lower.includes('purchas') || lower.includes('vendor') || lower.includes('supplier') || lower.includes('forecast') || lower.includes('seasonal') || lower.includes('comparison') || lower.includes('negotiate') || lower.includes('inventory') || lower.includes('order')) matchKey = 'recommendations';

    // Always show a preset — default to recommendations if no specific match
    matchKey = matchKey || 'recommendations';
    setActiveView(matchKey);
    setAiAnalysis(null);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'agent', text: `Let me pull that together for you. Here's what I found:` }]);
      setView('result');
    }, 1500);
  };

  const handleBack = () => { setView('idle'); setActiveView(null); setAiAnalysis(null); };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-blue-600 flex items-center justify-center shadow-lg shadow-accent-blue/20">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Connect</h1>
          <p className="text-xs text-text-secondary">Purchasing & Inventory Agent</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20">
          <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
          <span className="text-xs text-accent-blue font-medium">Online</span>
        </div>
      </div>

      {/* Inventory at a Glance */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-grid">
        {[
          { label: 'Stock Health', value: '32/39', sub: 'stores fully stocked', color: 'var(--color-accent-green)', subColor: 'var(--color-accent-green)' },
          { label: 'Urgent', value: '3', sub: 'SKUs at stockout risk', color: 'var(--color-accent-red)', subColor: 'var(--color-accent-red)' },
          { label: 'Pending POs', value: '1', sub: 'draft ready · $2,847', color: 'var(--color-accent-gold)', subColor: 'var(--color-text-secondary)' },
          { label: 'Last Reorder', value: '2d ago', sub: 'All items received', color: 'var(--color-text-primary)', subColor: 'var(--color-accent-green)' },
        ].map(k => (
          <div key={k.label} className="p-3 rounded-xl border border-surface-border border-l-[3px] bg-surface-card hover:brightness-110 transition-all" style={{ borderLeftColor: k.color }}>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px]" style={{ color: k.subColor }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {/* welcome */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-accent-blue" />
          </div>
          <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl">
            <p className="text-sm text-text-primary leading-relaxed">
              Hey! I'm your Connect purchasing agent. I can help you restock out-of-stock items,
              discover new products from top brands, and optimize your purchasing strategy — all powered by your real sales data.
            </p>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              Select an action below or tell me what you need.
            </p>
          </div>
        </div>

        {/* messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'agent' && (
              <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-accent-blue" />
              </div>
            )}
            <div className={`rounded-2xl px-5 py-3 max-w-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-accent-blue text-white rounded-tr-sm'
                : 'bg-surface-card border border-surface-border text-text-primary rounded-tl-sm'
            }`}>
              {msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}
            </div>
          </div>
        ))}

        {view === 'typing' && <TypingIndicator />}

        {view === 'result' && activeView === 'reorder' && <ReorderView data={aiAnalysis} onBack={handleBack} />}
        {view === 'result' && activeView === 'explore' && <ExploreView data={aiAnalysis} onBack={handleBack} />}
        {view === 'result' && activeView === 'recommendations' && <RecommendationsView data={aiAnalysis} onBack={handleBack} />}

        {/* suggestions */}
        {view === 'idle' && (
          <div className="pt-2 animate-fade-in">
            <p className="text-xs text-text-secondary mb-3 ml-11">Quick actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-11 stagger-grid">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleSuggestionClick(s.key)}
                  className={`group text-left bg-surface-card border border-surface-border ${s.border} rounded-xl p-4 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                      <s.icon className="w-4 h-4 text-text-primary" />
                    </div>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border border-surface-border" style={{ color: s.tagColor }}>{s.tag}</span>
                    {s.confidence === 'high' && <span className="text-[9px] font-semibold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded border border-accent-green/30">High Confidence</span>}
                    {s.confidence === 'medium' && <span className="text-[9px] font-semibold text-accent-gold bg-accent-gold/10 px-1.5 py-0.5 rounded border border-dashed border-accent-gold/30">Review Suggested</span>}
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">{s.label}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{s.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap className="w-3 h-3" /> Analyze <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* input bar */}
      <form onSubmit={handleSubmit} className="sticky bottom-0 pb-2">
        <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-2xl px-4 py-3 focus-within:border-accent-blue/50 transition-colors">
          <Search className="w-5 h-5 text-text-secondary flex-shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about inventory, products, or purchasing..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
            disabled={view === 'typing'}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || view === 'typing'}
            className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center text-white disabled:opacity-30 hover:brightness-110 transition-colors disabled:hover:bg-accent-blue"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-text-muted mt-2">
          Connect Agent uses real-time inventory data and market analytics. Review all orders before confirming.
        </p>
      </form>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
