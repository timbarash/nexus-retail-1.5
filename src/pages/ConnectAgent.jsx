import NexusIcon from '../components/NexusIcon';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNexusState } from '../contexts/NexusStateContext';
import { TiltCard } from '../components/common/TiltCard';
import {
  Bot, Sparkles, Send, ArrowLeft, ChevronRight, Zap, TrendingUp,
  ShoppingBag, Package, Truck, AlertTriangle, CheckCircle2, Clock,
  DollarSign, BarChart3, Star, Hash, ArrowUpDown, RefreshCw,
  ChevronDown, ChevronUp, Check, X, Search, Filter, Store,
  Layers, Box, ShoppingCart, Award, Percent, Heart, Eye,
  Building2, Phone, Mail, Globe, MapPin, Calendar, ArrowRight,
  PackageCheck, PackageX, TrendingDown, CircleDollarSign,
  Maximize2, Pencil, ArrowRightLeft, Clipboard, FileText,
  Inbox, XCircle, Tag, ShieldCheck, Replace,
Megaphone, Bell, Printer, ExternalLink, Info, } from 'lucide-react';
import {
  ALL_STORE_INVENTORY,
  _seedRng,
} from '../data/inventoryData';
import { generateConnectResponse, generateConnectAnalysis, isGeminiAvailable } from '../utils/gemini';
import ConfirmationDrawer from '../components/common/ConfirmationDrawer';
import { useActionLog } from '../contexts/ActionLogContext';
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
   TRANSPARENCY / PROVENANCE PANEL
   ═══════════════════════════════════════════════════════════════════ */

const DATA_SOURCE_STYLES = {
  POS: 'bg-accent-blue/15 text-accent-blue',
  METRC: 'bg-accent-green/15 text-accent-green',
  Connect: 'bg-accent-purple/15 text-accent-purple',
  Forecast: 'bg-accent-gold/15 text-accent-gold',
};

function TransparencyPanel({ title, methodology, sources, timestamp, confidence }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-3 rounded-lg border border-surface-border bg-surface-bg/50 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-text-muted hover:text-text-secondary transition-colors">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-medium">{title}</span>
        <span className="flex-1" />
        {sources.map(s => (
          <span key={s} className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${DATA_SOURCE_STYLES[s] || 'bg-surface-hover text-text-muted'}`}>{s}</span>
        ))}
        <span className="text-[9px] text-text-muted flex-shrink-0">{timestamp}</span>
        <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-surface-divider">
          <p className="text-[11px] text-text-secondary leading-[1.7] whitespace-pre-line">{methodology}</p>
          {confidence != null && (
            <div className="mt-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${confidence >= 85 ? 'bg-accent-green' : confidence >= 60 ? 'bg-accent-gold' : 'bg-accent-red'}`} />
              <span className="text-[10px] font-semibold text-text-muted">Confidence: {confidence}%</span>
              <span className="text-[9px] text-text-muted">
                {confidence >= 85 ? '— stable velocity, strong historical data' :
                 confidence >= 60 ? '— some variance in recent sales patterns' :
                 '— limited data, new product or high variance'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ConfidenceDot — a small colored indicator shown before product names.
 * Confidence is derived deterministically from the product's data.
 */
function ConfidenceDot({ velocity, daysOfData, isNew }) {
  let confidence;
  if (isNew || (daysOfData != null && daysOfData < 30)) {
    confidence = 45 + Math.round((velocity || 0) * 2);
    if (confidence > 58) confidence = 58;
  } else if (velocity != null && velocity >= 3) {
    confidence = 87 + Math.min(8, Math.round(velocity));
  } else if (velocity != null && velocity >= 1) {
    confidence = 65 + Math.round(velocity * 6);
  } else {
    confidence = 55;
  }
  confidence = Math.max(20, Math.min(99, confidence));

  const color = confidence >= 85 ? 'bg-accent-green' : confidence >= 60 ? 'bg-accent-gold' : 'bg-accent-red';
  const reason = confidence >= 85 ? 'High confidence — stable velocity, strong data'
    : confidence >= 60 ? 'Medium confidence — some variance or limited history'
    : 'Low confidence — new product or high variance';

  return (
    <span className="relative group flex-shrink-0">
      <span className={`inline-block w-[6px] h-[6px] rounded-full ${color}`} />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-surface-card border border-surface-border shadow-lg text-[9px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
        {confidence}% — {reason}
      </span>
    </span>
  );
}

const TRANSPARENCY_TIMESTAMP = 'Data as of: Mar 31, 2026 11:42 AM';

/* ═══════════════════════════════════════════════════════════════════
   STATE COMPLIANCE CONFIG — traceability system requirements by state
   ═══════════════════════════════════════════════════════════════════ */
export const STATE_COMPLIANCE = {
  IL: { system: 'BioTrack', vaultToFloor: 'Room-to-room adjustment in BioTrack', crossStore: 'Requires licensed transport agent credentials + BioTrack manifest', agentInCharge: true, strictness: 'high' },
  MI: { system: 'METRC', vaultToFloor: 'Package room transfer in METRC', crossStore: 'METRC transfer manifest required', agentInCharge: false, strictness: 'medium' },
  OH: { system: 'METRC', vaultToFloor: 'Package room transfer in METRC', crossStore: 'METRC manifest + documented justification required', agentInCharge: false, strictness: 'very_high' },
  NJ: { system: 'METRC', vaultToFloor: 'Package room transfer in METRC', crossStore: 'METRC transfer manifest required (new system — verify procedures)', agentInCharge: false, strictness: 'high' },
  PA: { system: 'MJ Freeway', vaultToFloor: 'Inventory adjustment in MJ Freeway', crossStore: 'MJ Freeway manifest + DOH transport compliance required (medical program)', agentInCharge: false, strictness: 'very_high' },
};

function getStateCompliance(stateCode) {
  return STATE_COMPLIANCE[stateCode] || { system: 'METRC', vaultToFloor: 'Package room transfer in METRC', crossStore: 'METRC transfer manifest required', agentInCharge: false, strictness: 'medium' };
}

function ComplianceSystemBadge({ system, size = 'sm' }) {
  const colors = {
    'METRC': { bg: 'color-mix(in srgb, var(--color-accent-green) 15%, transparent)', text: 'var(--color-accent-green)' },
    'BioTrack': { bg: 'color-mix(in srgb, var(--color-accent-blue) 15%, transparent)', text: 'var(--color-accent-blue)' },
    'MJ Freeway': { bg: 'color-mix(in srgb, var(--color-accent-purple) 15%, transparent)', text: 'var(--color-accent-purple)' },
  };
  const c = colors[system] || colors['METRC'];
  const textSize = size === 'xs' ? 'text-[8px]' : 'text-[9px]';
  return (
    <span className={`${textSize} font-bold px-1.5 py-px rounded`} style={{ background: c.bg, color: c.text }}>{system}</span>
  );
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

/* Inventory classification labels (real Dutchie statuses) */
const INVENTORY_STATUS = {
  Expired: { label: 'Expired', color: 'var(--color-text-muted)', bg: 'color-mix(in srgb, var(--color-text-muted) 12%, transparent)' },
  Healthy: { label: 'Healthy', color: 'var(--color-accent-green)', bg: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' },
  LowStock: { label: 'LowStock', color: 'var(--color-accent-gold)', bg: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' },
  OutOfStock: { label: 'OutOfStock', color: 'var(--color-accent-red)', bg: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)' },
  Overstocked: { label: 'Overstocked', color: 'var(--color-accent-blue)', bg: 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)' },
};

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
    inventoryStatus: 'OutOfStock',
    supplier: 'STIIIZY Direct',
    leadTime: '2-3 days',
    paymentTerms: 'Net 15',
    moq: 12,
    casePack: 12,
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
    inventoryStatus: 'OutOfStock',
    supplier: 'Kiva Sales Inc.',
    leadTime: '3-5 days',
    paymentTerms: 'Net 30',
    moq: 6,
    casePack: 6,
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
    inventoryStatus: 'OutOfStock',
    supplier: 'Raw Garden LLC',
    leadTime: '3-4 days',
    paymentTerms: 'COD',
    moq: 6,
    casePack: 6,
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
    inventoryStatus: 'OutOfStock',
    supplier: 'Wyld Distribution',
    leadTime: '4-5 days',
    paymentTerms: 'Net 30',
    moq: 12,
    casePack: 12,
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
    inventoryStatus: 'LowStock',
    supplier: 'DreamFields (Jeeter)',
    leadTime: '2-3 days',
    paymentTerms: 'Net 7',
    note: 'Low stock — 8 units remaining',
    moq: 24,
    casePack: 24,
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
    availability: 'In Stock',
    moq: 6,
    casePack: 6,
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
    availability: 'In Stock',
    moq: 12,
    casePack: 12,
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
    availability: 'In Stock',
    moq: 12,
    casePack: 12,
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
    availability: 'In Stock',
    moq: 6,
    casePack: 6,
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
    availability: 'In Stock',
    moq: 6,
    casePack: 6,
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
    availability: 'Unavailable',
    moq: 6,
    casePack: 6,
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
  return { brand, pct, label: `${brand} ${pct}% Brand Funded Discount` };
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT CARDS
   ═══════════════════════════════════════════════════════════════════ */

function OutOfStockCard({ product, selected, onToggle, quantity, onQuantityChange, discount, discountApplied, onToggleDiscount, subtotal, formulaQty, daysOnHand }) {
  const unitPrice = parseFloat((product.lastPrice || '$0').replace('$', '')) || 0;
  const lineSubtotal = subtotal != null ? subtotal : unitPrice * quantity;
  const statusInfo = product.inventoryStatus ? INVENTORY_STATUS[product.inventoryStatus] : null;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        selected ? 'border-accent-green/40 shadow-card' : 'border-surface-border hover:border-surface-border/80'
      }`}
      style={selected ? { background: 'color-mix(in srgb, var(--color-accent-green) 4%, var(--color-surface-bg))' } : { background: 'var(--color-surface-bg)' }}
    >
      <div className="flex items-start gap-3">
        {/* checkbox */}
        <div
          className={`w-[20px] h-[20px] rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all cursor-pointer ${
            selected ? 'bg-accent-green border-accent-green shadow-sm' : 'border-surface-border hover:border-text-muted'
          }`}
          onClick={onToggle}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
        {/* product thumbnail */}
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--color-accent-green) 12%, transparent), color-mix(in srgb, var(--color-accent-blue) 8%, transparent))` }}>
          {product.image ? (
            <img src={product.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-bg">
              <Package className="w-5 h-5 text-text-muted/30" />
            </div>
          )}
        </div>
        {/* product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white tracking-wide" style={{ background: product.brandColor }}>{product.brand}</span>
            {statusInfo && <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>}
            {product.urgency === 'high' && <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-0.5" style={{ background: 'color-mix(in srgb, var(--color-accent-red) 15%, transparent)', color: 'var(--color-accent-red)' }}><AlertTriangle className="w-2.5 h-2.5" /> Urgent</span>}
            {product.note && <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)' }}>{product.note}</span>}
          </div>
          <p className="text-[13px] font-semibold text-text-primary leading-snug flex items-center gap-1.5">
            <ConfidenceDot velocity={(product.avgWeeklySales || 0) / 7} daysOfData={product.daysOutOfStock > 14 ? 14 : 60} />
            {product.name}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">{product.type} · THC {product.thc}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-text-muted flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> ~{Math.round((product.avgWeeklySales || 0) / 7)}/day</span>
            <span className="text-[10px] font-medium" style={{ color: product.daysOutOfStock > 0 ? 'var(--color-accent-red)' : 'var(--color-accent-gold)' }}>{product.daysOutOfStock > 0 ? `${product.daysOutOfStock}d out` : 'Low stock'}</span>
            <span className="text-[10px] text-text-muted flex items-center gap-1"><Truck className="w-2.5 h-2.5" /> {product.leadTime}</span>
            {product.moq && <span className="text-[10px] font-medium text-accent-gold">MOQ: {product.moq}</span>}
          </div>
          {discount && (
            <button
              onClick={onToggleDiscount}
              className="mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 transition-colors cursor-pointer border"
              style={discountApplied
                ? { background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)', borderColor: 'color-mix(in srgb, var(--color-accent-green) 25%, transparent)' }
                : { background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-surface-border)' }
              }
            >
              <Percent className="w-2.5 h-2.5" />
              {discount.label}
            </button>
          )}
          {formulaQty != null && daysOnHand != null && (
            <p className="text-[10px] text-text-muted mt-1">
              {formulaQty} units for {daysOnHand}d coverage
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0 space-y-2">
          <p className="text-sm font-bold text-text-primary">{product.lastPrice}<span className="text-[10px] font-normal text-text-muted ml-0.5">/ea</span></p>
          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              className="w-6 h-6 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center justify-center text-xs transition-colors"
            >−</button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 h-6 text-center text-[11px] font-bold text-text-primary bg-surface-card border border-surface-border rounded-lg focus:border-accent-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-6 h-6 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center justify-center text-xs transition-colors"
            >+</button>
          </div>
          {selected && (
            <p className="text-[11px] font-semibold text-text-primary">
              ${lineSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              {discount && discountApplied && <span className="ml-1 text-accent-green">(-{discount.pct}%)</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NewProductCard({ product }) {
  const isAvailable = product.availability !== 'Unavailable';
  return (
    <div className={`bg-surface-bg rounded-xl border border-surface-border hover:border-surface-border/80 p-3 transition-all ${!isAvailable ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: product.brandColor }}>{product.brand}</span>
        {product.trending && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green font-medium flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> Trending</span>}
        {/* Availability indicator */}
        {product.availability && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 border"
            style={isAvailable
              ? { background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)', borderColor: 'color-mix(in srgb, var(--color-accent-green) 18%, transparent)' }
              : { background: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)', color: 'var(--color-accent-red)', borderColor: 'color-mix(in srgb, var(--color-accent-red) 18%, transparent)' }
            }
          >
            {isAvailable ? <CheckCircle2 className="w-2 h-2" /> : <PackageX className="w-2 h-2" />}
            {product.availability}
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <Star className="w-3 h-3 text-accent-gold fill-accent-gold" />
          <span className="text-[11px] text-accent-gold font-medium">{product.rating}</span>
        </div>
      </div>
      {/* product visual */}
      <div className="h-32 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden" style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${product.brandColor} 13%, transparent), color-mix(in srgb, ${product.brandColor} 7%, transparent))`,
      }}>
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--color-accent-green) 10%, transparent), color-mix(in srgb, var(--color-accent-gold) 8%, transparent))` }}>
          <span className="text-2xl font-bold text-text-muted/20">{product.brand?.[0] || 'P'}</span>
          <Package className="w-6 h-6 text-text-muted/20 mt-1" />
        </div>
      </div>
      {/* info */}
      <p className="text-sm font-medium text-text-primary">{product.name}</p>
      <p className="text-xs text-text-secondary mb-2">{product.type}</p>
      <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{product.description}</p>
      {/* pricing */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-divider">
        <div>
          <p className="text-[10px] text-text-muted">Wholesale/unit</p>
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
      {/* MOQ & Case Pack */}
      {(product.moq || product.casePack) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-surface-divider/50">
          {product.moq && (
            <span className="text-[10px] text-text-secondary flex items-center gap-1">
              <Hash className="w-2.5 h-2.5 text-accent-gold" /> MOQ: {product.moq}
            </span>
          )}
          {product.casePack && (
            <span className="text-[10px] text-text-secondary flex items-center gap-1">
              <Box className="w-2.5 h-2.5 text-accent-green" /> Case Pack: {product.casePack}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COLLAPSIBLE SECTION
   ═══════════════════════════════════════════════════════════════════ */

function Section({ title, icon: Icon, iconColor, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2.5 px-3.5 py-3 hover:bg-surface-hover/50 transition-colors">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${iconColor} 12%, transparent)` }}>
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: iconColor }} />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `color-mix(in srgb, ${iconColor} 10%, transparent)`, color: iconColor }}>{badge}</span>}
        <div className="ml-auto">{open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}</div>
      </button>
      {open && <div className="px-3.5 pb-3 border-t border-surface-divider pt-2.5">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FULL-SCREEN EDIT MODAL
   ═══════════════════════════════════════════════════════════════════ */

function FullScreenModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', handler); };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-bg animate-fade-in">
      {/* header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
            <Pencil className="w-4 h-4 text-accent-green" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            <p className="text-[10px] text-text-muted">Full screen edit mode</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-surface-hover text-text-secondary border border-surface-border hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" /> Close
        </button>
      </div>
      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FULL-SCREEN REORDER CONTENT
   ═══════════════════════════════════════════════════════════════════ */

function FullScreenReorderContent({ products, selected, toggle, quantities, setQuantities, recommendations, recQuantities, setRecQuantities, costBreakdown, discountsApplied, setDiscountsApplied, recDiscountsApplied, setRecDiscountsApplied, daysOnHand, setDaysOnHand }) {
  const [editingHeader, setEditingHeader] = useState({});

  return (
    <div className="space-y-6">
      {/* editable PO header */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-accent-gold" />
          <h3 className="text-sm font-semibold text-text-primary">Purchase Order Header</h3>
          <span className="text-[9px] px-1.5 py-px rounded-full font-medium" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)' }}>Editable</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...new Map(products.filter(p => selected.has(p.id)).map(p => [p.supplier, p])).values()].map((p) => (
            <div key={p.supplier} className="rounded-xl border border-surface-border bg-surface-bg p-4 space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-secondary block mb-1">Vendor</label>
                <input
                  type="text"
                  defaultValue={editingHeader[p.supplier]?.vendor || p.supplier}
                  onChange={(e) => setEditingHeader(prev => ({ ...prev, [p.supplier]: { ...prev[p.supplier], vendor: e.target.value } }))}
                  className="w-full text-xs font-medium text-text-primary bg-surface-card border border-surface-border rounded-lg px-3 py-2 focus:border-accent-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-secondary block mb-1">PO Title</label>
                <input
                  type="text"
                  defaultValue={editingHeader[p.supplier]?.title || `Reorder — ${p.brand} (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`}
                  onChange={(e) => setEditingHeader(prev => ({ ...prev, [p.supplier]: { ...prev[p.supplier], title: e.target.value } }))}
                  className="w-full text-xs font-medium text-text-primary bg-surface-card border border-surface-border rounded-lg px-3 py-2 focus:border-accent-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-secondary block mb-1">Expected Arrival</label>
                <input
                  type="date"
                  defaultValue={editingHeader[p.supplier]?.arrival || new Date(Date.now() + (parseInt(p.leadTime) || 3) * 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setEditingHeader(prev => ({ ...prev, [p.supplier]: { ...prev[p.supplier], arrival: e.target.value } }))}
                  className="w-full text-xs font-medium text-text-primary bg-surface-card border border-surface-border rounded-lg px-3 py-2 focus:border-accent-gold focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target weeks */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-accent-gold" />
          <span className="text-xs font-medium text-text-primary">Target Days on Hand</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)' }}>
            {daysOnHand} {daysOnHand === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-secondary w-6 text-center">7d</span>
          <input type="range" min="7" max="180" step="1" value={daysOnHand} onChange={(e) => setDaysOnHand(parseInt(e.target.value))} className="flex-1 h-1.5 rounded-full appearance-none bg-surface-border accent-[var(--color-accent-gold)] cursor-pointer" />
          <span className="text-[10px] text-text-secondary w-8 text-center">180d</span>
        </div>
      </div>

      {/* full product table */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-divider">
          <h3 className="text-sm font-semibold text-text-primary">Line Items — Edit Quantities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-divider">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Select</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Sales/wk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-divider">
              {products.map((p) => {
                const isSelected = selected.has(p.id);
                const price = parseFloat((p.lastPrice || '$0').replace('$', '')) || 0;
                const qty = quantities[p.id] || 0;
                const disc = getBrandDiscount(p.brand);
                const discApplied = !!discountsApplied[p.id];
                const raw = price * qty;
                const sub = disc && discApplied ? raw * (1 - disc.pct / 100) : raw;
                return (
                  <tr key={p.id} className={`transition-colors ${isSelected ? 'bg-accent-green/5' : 'hover:bg-surface-hover'}`}>
                    <td className="px-4 py-3">
                      <div
                        className={`w-[18px] h-[18px] rounded border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-accent-green border-accent-green' : 'border-surface-border'}`}
                        onClick={() => toggle(p.id)}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-text-primary">{p.brand} — {p.name}</p>
                      <p className="text-[10px] text-text-secondary">{p.type}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{
                        background: INVENTORY_STATUS[p.inventoryStatus]?.bg || 'transparent',
                        color: INVENTORY_STATUS[p.inventoryStatus]?.color || 'var(--color-text-muted)'
                      }}>{p.inventoryStatus || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{p.avgWeeklySales || 0}</td>
                    <td className="px-4 py-3 text-xs text-text-primary">{p.lastPrice}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setQuantities(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))} className="w-6 h-6 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors">−</button>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => setQuantities(prev => ({ ...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-14 h-6 text-center text-xs font-bold text-text-primary bg-surface-bg border border-surface-border rounded focus:border-accent-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button onClick={() => setQuantities(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))} className="w-6 h-6 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-xs font-medium text-text-primary">${sub.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      {disc && discApplied && <p className="text-[9px] text-accent-green">-{disc.pct}%</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* recommendations table */}
      {recommendations.length > 0 && (
        <div className="bg-surface-card rounded-xl border border-surface-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-divider">
            <h3 className="text-sm font-semibold text-text-primary">Also Recommended</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-divider">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Price/ea</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-divider">
                {recommendations.map((r, i) => {
                  const lineCost = (r.unitPrice || 0) * (recQuantities[i] || 0);
                  const disc = getBrandDiscount(r.brand);
                  const discApplied = !!recDiscountsApplied[i];
                  const finalCost = disc && discApplied ? lineCost * (1 - disc.pct / 100) : lineCost;
                  return (
                    <tr key={i} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{r.brand} — {r.product}</p>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-text-secondary max-w-[200px]">{r.reason}</td>
                      <td className="px-4 py-3 text-xs text-text-primary">${(r.unitPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setRecQuantities(prev => { const next = [...prev]; next[i] = Math.max(0, next[i] - 1); return next; })} className="w-6 h-6 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors">−</button>
                          <input
                            type="number"
                            value={recQuantities[i]}
                            onChange={(e) => setRecQuantities(prev => { const next = [...prev]; next[i] = Math.max(0, parseInt(e.target.value) || 0); return next; })}
                            className="w-14 h-6 text-center text-xs font-bold text-text-primary bg-surface-bg border border-surface-border rounded focus:border-accent-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => setRecQuantities(prev => { const next = [...prev]; next[i] = next[i] + 1; return next; })} className="w-6 h-6 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors">+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-xs font-medium text-text-primary">${finalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        {disc && discApplied && <p className="text-[9px] text-accent-green">-{disc.pct}%</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* totals */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Selected ({selected.size})</span>
            <span className="text-xs text-text-primary">${costBreakdown.productsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Recommended ({recommendations.length})</span>
            <span className="text-xs text-text-primary">${costBreakdown.recsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {costBreakdown.totalSavings > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-accent-green flex items-center gap-1"><Percent className="w-3 h-3" /> Brand Funded Discounts</span>
              <span className="text-xs text-accent-green">-${costBreakdown.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-surface-divider">
            <span className="text-sm font-semibold text-text-primary">Grand Total</span>
            <span className="text-lg font-bold text-accent-gold">${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FULL-SCREEN EXPLORE CONTENT
   ═══════════════════════════════════════════════════════════════════ */

function FullScreenExploreContent({ products, brandPerformance, categoryGaps }) {
  const [editQtys, setEditQtys] = useState(() => products.reduce((acc, p) => ({ ...acc, [p.id]: p.moq || 6 }), {}));

  return (
    <div className="space-y-6">
      {/* products table */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-divider">
          <h3 className="text-sm font-semibold text-text-primary">Product Catalog — Edit Order Quantities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-divider">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Wholesale</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Retail</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Margin</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Order Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-divider">
              {products.map((p) => {
                const isAvailable = p.availability !== 'Unavailable';
                return (
                  <tr key={p.id} className={`transition-colors ${!isAvailable ? 'opacity-50' : 'hover:bg-surface-hover'}`}>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-text-primary">{p.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: p.brandColor }}>{p.brand}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{p.type}</td>
                    <td className="px-4 py-3 text-xs text-text-primary">{p.wholesalePrice}</td>
                    <td className="px-4 py-3 text-xs text-text-primary">{p.suggestedRetail}</td>
                    <td className="px-4 py-3 text-xs text-accent-green">{p.margin}</td>
                    <td className="px-4 py-3">
                      {isAvailable && (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditQtys(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))} className="w-6 h-6 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors">−</button>
                          <input
                            type="number"
                            value={editQtys[p.id] || 0}
                            onChange={(e) => setEditQtys(prev => ({ ...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-14 h-6 text-center text-xs font-bold text-text-primary bg-surface-bg border border-surface-border rounded focus:border-accent-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => setEditQtys(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))} className="w-6 h-6 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors">+</button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded border" style={isAvailable
                        ? { background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)', borderColor: 'color-mix(in srgb, var(--color-accent-green) 18%, transparent)' }
                        : { background: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)', color: 'var(--color-accent-red)', borderColor: 'color-mix(in srgb, var(--color-accent-red) 18%, transparent)' }
                      }>{p.availability}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* brand performance */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Brand Performance</h3>
        <div className="space-y-3">
          {brandPerformance.map((b) => (
            <div key={b.name} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${b.color} 20%, transparent)` }}>
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
      </div>

      {/* category gaps */}
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Category Gap Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {categoryGaps.map((c) => (
            <div key={c.category} className="rounded-xl border border-surface-border bg-surface-bg p-4">
              <p className="text-xs font-medium text-text-primary mb-1">{c.category}</p>
              <p className="text-[11px] text-text-secondary mb-2">{c.gap}</p>
              <p className="text-sm font-bold" style={{ color: c.color }}>{c.opportunity}</p>
              <p className="text-[10px] text-text-muted">est. revenue opportunity</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RESULT VIEWS
   ═══════════════════════════════════════════════════════════════════ */

export function ReorderView({ data, onBack }) {
  const { logAction } = useActionLog();
  const products = data?.products || OUT_OF_STOCK_PRODUCTS;
  const recommendations = data?.recommendations || REORDER_RECOMMENDATIONS;
  const newBrandItems = data?.newBrandItems || [];

  const [selected, setSelected] = useState(() => new Set(products.filter(p => p.urgency === 'high').map(p => p.id)));
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [daysOnHand, setDaysOnHand] = useState(28);
  const [poPhase, setPoPhase] = useState(null); // null | 'header' | 'lines'
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

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

  // Formula-driven quantities: avgWeeklySales / 7 × daysOnHand
  const formulaQuantities = useMemo(() => {
    const q = {};
    products.forEach(p => { q[p.id] = Math.ceil((p.avgWeeklySales || 0) / 7 * daysOnHand); });
    return q;
  }, [products, daysOnHand]);

  const formulaRecQuantities = useMemo(() => {
    return recommendations.map(r => Math.ceil((r.avgWeeklySales || 0) / 7 * daysOnHand));
  }, [recommendations, daysOnHand]);

  const [quantities, setQuantities] = useState(() => {
    const q = {};
    products.forEach(p => { q[p.id] = p.recommendedQty || Math.ceil((p.avgWeeklySales || 0) / 7 * 28); });
    return q;
  });
  const [recQuantities, setRecQuantities] = useState(() => recommendations.map(r => r.qty || Math.ceil((r.avgWeeklySales || 0) / 7 * 28)));

  // Reset quantities when daysOnHand changes
  useEffect(() => {
    setQuantities(() => {
      const q = {};
      products.forEach(p => { q[p.id] = Math.ceil((p.avgWeeklySales || 0) / 7 * daysOnHand) || p.recommendedQty || 0; });
      return q;
    });
    setRecQuantities(recommendations.map(r => Math.ceil((r.avgWeeklySales || 0) / 7 * daysOnHand) || r.qty || 0));
  }, [daysOnHand, products, recommendations]);

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

  const supplierCount = [...new Set(products.filter(p => selected.has(p.id)).map(p => p.supplier))].length;

  const handleOrder = () => {
    setOrdering(true);
    setTimeout(() => {
      setOrdering(false);
      setOrdered(true);
      logAction({
        type: 'purchase_order',
        agent: 'Inventory Agent',
        description: `Purchase Order generated — $${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`,
        detail: `${selected.size + recommendations.length} items from ${supplierCount} supplier${supplierCount !== 1 ? 's' : ''}`,
      });
    }, 2200);
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
    <div className="space-y-3 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      {/* inventory summary */}
      <div className="rounded-xl border overflow-hidden bg-surface-card" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-gold) 20%, var(--color-surface-border))' }}>
        <div className="px-3.5 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' }}>
            <Package className="w-4 h-4 text-accent-gold" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-text-primary">{heroTitle}</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              <span className="font-medium text-accent-red">{products.filter((p) => p.daysOutOfStock > 0).length} out of stock</span> · est. <span className="font-medium text-accent-gold">{lostRevenue}</span> lost/wk
            </p>
          </div>
          <button
            onClick={() => setFullScreenOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold bg-surface-hover text-text-secondary border border-surface-border hover:text-text-primary hover:bg-surface-bg transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Expand
          </button>
        </div>
      </div>

      {/* Target Days on Hand slider */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' }}>
            <BarChart3 className="w-3.5 h-3.5 text-accent-gold" />
          </div>
          <span className="text-sm font-semibold text-text-primary">Target Days on Hand</span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)' }}>
            {daysOnHand} {daysOnHand === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-muted font-medium w-6 text-center">7d</span>
          <input
            type="range"
            min="1"
            max="52"
            step="1"
            value={daysOnHand}
            onChange={(e) => setDaysOnHand(parseInt(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-surface-border accent-[var(--color-accent-gold)] cursor-pointer"
          />
          <span className="text-[10px] text-text-muted font-medium w-8 text-center">52d</span>
        </div>
        <p className="text-[10px] text-text-muted mt-2">
          Based on avg weekly sales — quantities adjust automatically
        </p>
      </div>

      {/* Transparency / provenance panel */}
      <TransparencyPanel
        title="How quantities are calculated"
        sources={['POS', 'METRC', 'Connect', 'Forecast']}
        timestamp={TRANSPARENCY_TIMESTAMP}
        confidence={92}
        methodology={`Reorder Qty = (Target Days on Hand \u00d7 Avg Daily Velocity) \u2212 Current Stock\n\u2022 Avg Daily Velocity: 28-day rolling average from POS transaction data\n\u2022 Current Stock: Floor + Vault from last METRC sync (11:42 AM today)\n\u2022 Lead Time: Vendor-reported avg from last 5 deliveries via Connect\n\u2022 Safety Stock: 3 days buffer (configurable)\nConfidence: 92% (based on velocity stability \u2014 low variance products)`}
      />

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
              daysOnHand={daysOnHand}
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
              <div key={i} className="bg-surface-bg rounded-xl p-3.5 border border-surface-border transition-colors hover:border-surface-border/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' }}>
                    <Package className="w-4 h-4 text-accent-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[11px] font-medium text-text-primary">{r.brand} — {r.product}</p>
                      {disc && (
                        <button
                          onClick={() => setRecDiscountsApplied(prev => ({ ...prev, [i]: !prev[i] }))}
                          className="text-[9px] px-1.5 py-px rounded-full font-medium flex items-center gap-0.5 transition-colors cursor-pointer border"
                          style={discApplied
                            ? { background: 'color-mix(in srgb, var(--color-accent-green) 15%, transparent)', color: 'var(--color-accent-green)', borderColor: 'color-mix(in srgb, var(--color-accent-green) 25%, transparent)' }
                            : { background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-surface-border)' }
                          }
                        >
                          <Percent className="w-2 h-2" />
                          {disc.label}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-text-secondary">{r.reason}</p>
                    {r.avgWeeklySales != null && r.unitPrice != null && (
                      <p className="text-[9px] text-text-muted mt-0.5">
                        {formulaRecQuantities[i]} for {daysOnHand}d · ${(r.unitPrice || 0).toFixed(2)}/ea
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
                        <p className="text-[9px]" style={{ color: 'var(--color-accent-green)' }}>-{disc.pct}%</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Itemized cost breakdown — invoice-style */}
        <div className="mt-3 rounded-lg border border-surface-border bg-surface-bg p-3 space-y-2">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Order Summary</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Selected items ({selected.size})</span>
            <span className="text-xs font-medium text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>${costBreakdown.productsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Recommended ({recommendations.length})</span>
            <span className="text-xs font-medium text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>${costBreakdown.recsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {costBreakdown.newItemsSubtotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-accent-purple font-medium">New items ({newItemsAdded.size})</span>
              <span className="text-xs font-medium text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>${costBreakdown.newItemsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {costBreakdown.totalSavings > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-accent-green font-medium flex items-center gap-1">
                <Percent className="w-3 h-3" /> Brand Funded Discounts
              </span>
              <span className="text-xs font-semibold text-accent-green" style={{ fontVariantNumeric: 'tabular-nums' }}>-${costBreakdown.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-surface-divider">
            <span className="text-sm font-semibold text-text-primary">Grand Total</span>
            <span className="text-base font-bold text-accent-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
            {newBrandItems[0]?.brand} products not currently in your store. Add them to this PO with a <span className="text-accent-green font-semibold">15% brand-funded intro discount</span>.
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
                        <span className="text-[9px] px-1.5 py-px rounded-full font-medium flex items-center gap-0.5 border" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)', borderColor: 'color-mix(in srgb, var(--color-accent-green) 18%, transparent)' }}>
                          <Percent className="w-2 h-2" />15% Brand Funded Discount
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary">{item.category} · Retail ${item.retailPrice} · Wholesale ${item.wholesalePrice.toFixed(2)} · <span className="text-accent-green">{margin}% margin</span></p>
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
                            <p className="text-[9px] text-accent-green">-15%</p>
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
            <div key={p.supplier} className="bg-surface-bg rounded-lg p-3 border border-surface-border">
              <p className="text-sm font-semibold text-text-primary mb-1.5">{p.supplier}</p>
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

      {/* order CTA — two-phase: PO header then line items */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-3.5">
        {ordered ? (
          <div className="animate-fade-in space-y-4 py-4">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
                <CheckCircle2 className="w-5 h-5 text-accent-green" />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">Purchase Orders Submitted</p>
                <p className="text-sm text-text-secondary">{selected.size + recommendations.length} items sent to {supplierCount} supplier{supplierCount !== 1 ? 's' : ''}.</p>
              </div>
            </div>
            <div className="mx-auto max-w-sm rounded-xl border border-surface-border bg-surface-bg divide-y divide-surface-divider">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">PO Number</span>
                <span className="text-[12px] font-semibold text-accent-green">PO-2026-0847</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Total</span>
                <span className="text-[12px] font-medium text-text-primary">${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Est. Delivery</span>
                <span className="text-[12px] font-medium text-text-primary">{new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            <p className="text-center text-[11px] text-accent-blue cursor-pointer hover:underline" onClick={() => { const btn = document.querySelector('[aria-label="Action log"]'); if (btn) btn.click(); }}>
              View in Action Log
            </p>
          </div>
        ) : poPhase === 'header' ? (
          /* Phase 1: PO Header — vendor, title, expected arrival */
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
                <Package className="w-4 h-4 text-accent-green" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">PO Header — Review Before Submitting</h3>
            </div>
            <div className="bg-surface-bg rounded-lg border border-surface-border p-4 space-y-3">
              {[...new Map(products.filter(p => selected.has(p.id)).map(p => [p.supplier, p])).values()].map((p) => (
                <div key={p.supplier} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-text-primary">{p.supplier}</p>
                    <p className="text-[10px] text-text-secondary">PO Title: Reorder — {p.brand} ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted">Expected Arrival</p>
                    <p className="text-[11px] font-medium text-text-primary flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-accent-gold" />
                      {new Date(Date.now() + (parseInt(p.leadTime) || 3) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <span className="text-text-muted">({p.leadTime})</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPoPhase(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary border border-surface-border hover:bg-surface-hover transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={() => setPoPhase('lines')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-accent-green transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Review Line Items <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : poPhase === 'lines' ? (
          /* Phase 2: Line Items summary + confirm */
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
                <Layers className="w-4 h-4 text-accent-green" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">PO Line Items</h3>
            </div>
            <div className="bg-surface-bg rounded-xl border border-surface-border divide-y divide-surface-divider overflow-hidden">
              {products.filter(p => selected.has(p.id)).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-[11px] font-medium text-text-primary">{p.brand} — {p.name}</p>
                    <p className="text-[10px] text-text-secondary">{p.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-text-primary">x{quantities[p.id] || 0} @ {p.lastPrice}</p>
                    <p className="text-[10px] text-text-muted">${getProductSubtotal(p).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
              {recommendations.map((r, i) => (
                <div key={`rec-${i}`} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-[11px] font-medium text-text-primary">{r.brand} — {r.product}</p>
                    <p className="text-[10px] text-text-secondary">Recommended</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-text-primary">x{recQuantities[i] || 0} @ ${(r.unitPrice || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-text-muted">${((r.unitPrice || 0) * (recQuantities[i] || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-text-primary">Grand Total</span>
              <span className="text-base font-bold text-accent-gold">${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {costBreakdown.totalSavings > 0 && (
              <p className="text-[11px] text-accent-green">
                Includes ${costBreakdown.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })} in Brand Funded Discounts
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPoPhase('header')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary border border-surface-border hover:bg-surface-hover transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> PO Header
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={ordering}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-accent-green transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
              >
                {ordering ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Submit PO — ${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                )}
              </button>
            </div>
            <ConfirmationDrawer
              open={showConfirm}
              onCancel={() => setShowConfirm(false)}
              onConfirm={() => { setShowConfirm(false); handleOrder(); }}
              title="Confirm Purchase Orders"
              description={`Sending POs to ${[...new Map(products.filter(p => selected.has(p.id)).map(p => [p.supplier, p])).values()].length} suppliers`}
              icon={ShoppingCart}
              confirmLabel={`Submit PO — $${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              confirmColor="var(--color-accent-green)"
              details={[
                { label: 'Items', value: `${selected.size} selected + ${recommendations.length} recommended` },
                { label: 'Subtotal', value: `$${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                ...(costBreakdown.totalSavings > 0 ? [{ label: 'Brand Funded Discounts', value: `-$${costBreakdown.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }] : []),
                { label: 'Est. Delivery', value: '2-5 business days' },
              ]}
              warning="Purchase orders will be sent to suppliers immediately upon confirmation."
            />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
                <ShoppingCart className="w-4 h-4 text-accent-green" />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">Generate PO for {selected.size} item{selected.size !== 1 ? 's' : ''}{recommendations.length > 0 ? ` + ${recommendations.length} recommended` : ''}</p>
                <p className="text-sm text-text-secondary mt-0.5">Review PO header and line items before submitting to suppliers.
                  {costBreakdown.totalSavings > 0 && <span className="text-accent-green font-medium"> Saving ${costBreakdown.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} with Brand Funded Discounts.</span>}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPoPhase('header')}
              disabled={selected.size === 0}
              className="flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-white bg-accent-green transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg text-sm flex-shrink-0"
            >
              <ShoppingCart className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /> Generate PO — ${costBreakdown.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </button>
          </div>
        )}
      </div>

      {/* Full-screen edit modal */}
      <FullScreenModal open={fullScreenOpen} onClose={() => setFullScreenOpen(false)} title={heroTitle}>
        <FullScreenReorderContent
          products={products}
          selected={selected}
          toggle={toggle}
          quantities={quantities}
          setQuantities={setQuantities}
          recommendations={recommendations}
          recQuantities={recQuantities}
          setRecQuantities={setRecQuantities}
          costBreakdown={costBreakdown}
          discountsApplied={discountsApplied}
          setDiscountsApplied={setDiscountsApplied}
          recDiscountsApplied={recDiscountsApplied}
          setRecDiscountsApplied={setRecDiscountsApplied}
          daysOnHand={daysOnHand}
          setDaysOnHand={setDaysOnHand}
        />
      </FullScreenModal>
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
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

  const heroTitle = data?.title || 'Explore New Products from Top Brands';
  const heroSubtitle = data?.subtitle || `${products.length} recommended products based on market trends and catalog gap analysis`;

  return (
    <div className="space-y-3 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-green) 15%, transparent)' }}>
          <Bot className="w-4 h-4 text-accent-green" />
        </div>
        <div>
          <p className="text-sm text-text-secondary leading-relaxed">
            <span className="text-text-primary font-medium">Connect Agent</span> curated these from the <span className="text-accent-blue font-medium">Connect Marketplace</span> brand menus, based on your sales data, trending products in the NYC market, and gap analysis of your current catalog
          </p>
        </div>
      </div>

      {/* hero */}
      <div className="relative rounded-xl border overflow-hidden bg-surface-card" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-blue) 25%, transparent)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent-blue) 10%, transparent), color-mix(in srgb, var(--color-accent-purple) 5%, transparent), color-mix(in srgb, var(--color-accent-purple) 8%, transparent))' }} />
        <div className="relative px-3.5 py-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-blue) 20%, transparent)' }}>
                <Sparkles className="w-4 h-4 text-accent-blue" />
              </div>
              <div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-surface-border text-text-muted uppercase tracking-wider">Connect Marketplace</span>
                <h1 className="text-base font-bold text-text-primary mt-1.5">{heroTitle}</h1>
                <p className="text-xs text-text-secondary mt-0.5">{heroSubtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setFullScreenOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold bg-surface-hover text-text-secondary border border-surface-border hover:text-text-primary transition-colors flex-shrink-0"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Expand
            </button>
          </div>
        </div>
      </div>

      {/* trending products from Brand Menus */}
      <Section title="Recommended from Brand Menus" icon={TrendingUp} iconColor="var(--color-accent-green)" badge={`${products.length} products`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${b.color} 20%, transparent)` }}>
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
      <Section title="Category Gap Analysis" icon={Layers} iconColor="var(--color-accent-purple)" defaultOpen={false}>
        <p className="text-xs text-text-secondary mb-3">Categories where your store is under-indexed compared to NYC market average.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {categoryGaps.map((c) => (
            <div key={c.category} className="bg-surface-bg rounded-lg p-3 border border-surface-border">
              <p className="text-xs font-medium text-text-primary mb-1">{c.category}</p>
              <p className="text-[11px] text-text-secondary mb-2">{c.gap}</p>
              <p className="text-sm font-bold" style={{ color: c.color }}>{c.opportunity}</p>
              <p className="text-[10px] text-text-muted">est. revenue opportunity</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Full-screen edit modal */}
      <FullScreenModal open={fullScreenOpen} onClose={() => setFullScreenOpen(false)} title={heroTitle}>
        <FullScreenExploreContent
          products={products}
          brandPerformance={brandPerformance}
          categoryGaps={categoryGaps}
        />
      </FullScreenModal>
    </div>
  );
}

export function RecommendationsView({ data, onBack }) {
  const metrics = data?.metrics || [
    { label: 'Avg Days on Hand', value: '22', change: '+3.5', iconName: 'BarChart3', color: 'var(--color-accent-gold)', changeColor: 'var(--color-accent-green)' },
    { label: 'Avg Margin', value: '43.1%', change: '+2.4%', iconName: 'CircleDollarSign', color: 'var(--color-accent-green)', changeColor: 'var(--color-accent-green)' },
    { label: 'Inventory Turns', value: '4.8x', change: '+0.3', iconName: 'RefreshCw', color: 'var(--color-accent-blue)', changeColor: 'var(--color-accent-green)' },
    { label: 'OutOfStock SKUs', value: '4', change: '-2', iconName: 'PackageX', color: 'var(--color-accent-red)', changeColor: 'var(--color-accent-green)' },
  ];
  const actionItems = data?.actionItems || [
    { action: 'Increase Jeeter Baby Jeeter Churros order qty from 36 to 48 units', reason: 'Consistently sells out 2 days before restock. Lost ~$840/mo in revenue.', priority: 'High' },
    { action: 'Add Alien Labs Xeno Disposable to catalog', reason: 'Top trending disposable in NYC. 42% margin. No disposable vapes currently in catalog.', priority: 'High' },
    { action: 'Reduce Wyld Elderberry order from 24 to 14 units', reason: 'Sales velocity dropped 30% last month. Current qty leads to 60+ days on hand (Overstocked).', priority: 'Medium' },
    { action: 'Negotiate bulk pricing with STIIIZY for OG Kush pods', reason: 'Your #2 seller. Increasing order to 48+ units may unlock tier 2 pricing (~8% savings).', priority: 'Medium' },
    { action: 'Consider dropping Select Elite cartridge line', reason: 'Below 2 units/week avg sales. $380 in Expired/Overstocked inventory. Shelf space better used for Raw Garden expansion.', priority: 'Low' },
  ];

  const heroTitle = data?.title || 'Purchasing Recommendations';
  const heroSubtitle = data?.subtitle || 'Maximize margins and reduce stockouts with data-driven ordering';

  const priorityColors = { High: 'var(--color-accent-red)', Medium: 'var(--color-accent-gold)', Low: 'var(--color-accent-blue)' };

  return (
    <div className="space-y-3 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-green) 15%, transparent)' }}>
          <Bot className="w-4 h-4 text-accent-green" />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          <span className="text-text-primary font-medium">Connect Agent</span> analyzed your inventory performance over the last 90 days. Here are actionable purchasing recommendations:
        </p>
      </div>

      {/* hero */}
      <div className="relative rounded-xl border overflow-hidden bg-surface-card" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-green) 25%, transparent)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent-green) 10%, transparent), color-mix(in srgb, var(--color-accent-green) 4%, transparent), color-mix(in srgb, var(--color-accent-blue) 6%, transparent))' }} />
        <div className="relative px-3.5 py-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-green) 20%, transparent)' }}>
            <Zap className="w-4 h-4 text-accent-green" />
          </div>
          <div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-surface-border text-text-muted uppercase tracking-wider">Smart Purchasing</span>
            <h1 className="text-base font-bold text-text-primary mt-1.5">{heroTitle}</h1>
            <p className="text-xs text-text-secondary mt-0.5">{heroSubtitle}</p>
          </div>
        </div>
      </div>

      {/* key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {metrics.map((m) => {
          const MIcon = resolveIcon(m.iconName || m.icon);
          const mColor = m.color || 'var(--color-accent-blue)';
          return (
            <div key={m.label} className="rounded-xl border border-surface-border bg-surface-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${mColor} 12%, transparent)` }}>
                  <MIcon className="w-3.5 h-3.5" style={{ color: mColor }} />
                </div>
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">{m.label}</p>
              </div>
              <p className="text-lg font-bold text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.value}</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: m.changeColor || 'var(--color-accent-green)' }}>{m.change} vs last month</p>
            </div>
          );
        })}
      </div>

      {/* recommendations */}
      <Section title="Action Items" icon={Zap} iconColor="var(--color-accent-gold)" badge={`${actionItems.length} recommendations`}>
        <div className="space-y-3">
          {actionItems.map((r, i) => {
            const color = priorityColors[r.priority] || 'var(--color-text-muted)';
            return (
              <div key={i} className="bg-surface-bg rounded-lg p-3 border border-surface-border hover:border-surface-border/80 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                    <Zap className="w-3 h-3" style={{ color }} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `color-mix(in srgb, ${color} 13%, transparent)`, color }}>{r.priority}</span>
                </div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">{r.action}</p>
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
   VENDOR GROUPS + PRODUCT CATALOGS (for Multi-Vendor Reorder)
   ═══════════════════════════════════════════════════════════════════ */

// Deterministic hash from product name string
function _hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

// Velocity ranges by category (units/day)
const VELOCITY_RANGE = { Flower: [3, 8], 'Pre-Rolls': [4, 10], Edibles: [2, 5], Vapes: [1, 4], Concentrates: [1, 3] };
// Par ranges by category
const PAR_RANGE = { Flower: [8, 15], 'Pre-Rolls': [10, 20], Edibles: [12, 24], Vapes: [6, 12], Concentrates: [4, 8] };

const VENDOR_PRODUCT_CATALOG = {
  Jeeter: [
    { name: 'Baby Jeeter Infused PR 5pk', category: 'Pre-Rolls', unitCost: 18.00, retailPrice: 40.00 },
    { name: 'Jeeter Juice LR Cart 1g', category: 'Vapes', unitCost: 22.00, retailPrice: 48.00 },
    { name: 'Jeeter Liquid Diamonds 0.5g', category: 'Concentrates', unitCost: 20.00, retailPrice: 45.00 },
    { name: 'Baby Jeeter Churros 5pk', category: 'Pre-Rolls', unitCost: 17.00, retailPrice: 38.00 },
    { name: 'Jeeter XL PR 2g', category: 'Pre-Rolls', unitCost: 14.00, retailPrice: 30.00 },
    { name: 'Jeeter Infused Mini PR 10pk', category: 'Pre-Rolls', unitCost: 28.00, retailPrice: 55.00 },
    { name: 'Jeeter Juice LR Disposable 0.5g', category: 'Vapes', unitCost: 16.00, retailPrice: 35.00 },
    { name: 'Jeeter Blunt 2g', category: 'Pre-Rolls', unitCost: 12.00, retailPrice: 25.00 },
  ],
  Wyld: [
    { name: 'Wyld Elderberry Gummies 10pk', category: 'Edibles', unitCost: 8.00, retailPrice: 18.00 },
    { name: 'Wyld Raspberry Gummies 10pk', category: 'Edibles', unitCost: 8.00, retailPrice: 18.00 },
    { name: 'Wyld Strawberry CBD Gummies', category: 'Edibles', unitCost: 9.00, retailPrice: 20.00 },
    { name: 'Wyld Pear Gummies 10pk', category: 'Edibles', unitCost: 8.00, retailPrice: 18.00 },
    { name: 'Wyld Marionberry Indica', category: 'Edibles', unitCost: 8.00, retailPrice: 18.00 },
    { name: 'Wyld Sour Watermelon Hybrid', category: 'Edibles', unitCost: 8.50, retailPrice: 19.00 },
  ],
  STIIIZY: [
    { name: 'Stiiizy Pod OG Kush 1g', category: 'Vapes', unitCost: 24.00, retailPrice: 55.00 },
    { name: 'Stiiizy Pod Skywalker 0.5g', category: 'Vapes', unitCost: 16.00, retailPrice: 35.00 },
    { name: 'Stiiizy Disposable Blue Dream 1g', category: 'Vapes', unitCost: 20.00, retailPrice: 45.00 },
    { name: 'Stiiizy Live Resin Pod 1g', category: 'Vapes', unitCost: 28.00, retailPrice: 60.00 },
    { name: 'Stiiizy CDT Pod Biscotti', category: 'Vapes', unitCost: 18.00, retailPrice: 40.00 },
    { name: 'Stiiizy Edibles 100mg', category: 'Edibles', unitCost: 10.00, retailPrice: 22.00 },
  ],
  Kiva: [
    { name: 'Kiva Lost Farm Gummies', category: 'Edibles', unitCost: 10.00, retailPrice: 24.00 },
    { name: 'Kiva Camino Pineapple Habanero', category: 'Edibles', unitCost: 10.00, retailPrice: 22.00 },
    { name: 'Kiva Terra Bites Espresso Beans', category: 'Edibles', unitCost: 9.00, retailPrice: 20.00 },
    { name: 'Kiva Camino Midnight Blueberry', category: 'Edibles', unitCost: 10.00, retailPrice: 22.00 },
    { name: 'Kiva Lost Farm Chews Grape', category: 'Edibles', unitCost: 10.50, retailPrice: 24.00 },
  ],
  Cookies: [
    { name: 'Cookies Gary Payton 3.5g', category: 'Flower', unitCost: 32.00, retailPrice: 55.00 },
    { name: 'Cookies Cereal Milk 3.5g', category: 'Flower', unitCost: 30.00, retailPrice: 52.00 },
    { name: 'Cookies Collins Ave 3.5g', category: 'Flower', unitCost: 30.00, retailPrice: 50.00 },
    { name: 'Cookies Cheetah Piss PR 1g', category: 'Pre-Rolls', unitCost: 10.00, retailPrice: 18.00 },
    { name: 'Cookies Grandiflora 3.5g', category: 'Flower', unitCost: 35.00, retailPrice: 60.00 },
    { name: 'Cookies Berner Cookies Cart 1g', category: 'Vapes', unitCost: 24.00, retailPrice: 50.00 },
  ],
};

// Generate deterministic per-product inventory data using seeded RNG
function generateVendorProductData(vendorName, productDef, storeIndex) {
  const seed = _hashStr(vendorName + productDef.name + String(storeIndex));
  const rng = _seedRng(seed);
  const cat = productDef.category;
  const [vLo, vHi] = VELOCITY_RANGE[cat] || [1, 4];
  const dailyVelocity = Math.round((vLo + rng() * (vHi - vLo)) * 10) / 10;
  const [pLo, pHi] = PAR_RANGE[cat] || [6, 12];
  const par = pLo + Math.floor(rng() * (pHi - pLo + 1));
  const roll = rng();
  let floor, vault;
  if (roll < 0.18) {
    // OOS
    floor = Math.floor(rng() * 4); // 0-3
    vault = 15 + Math.floor(rng() * 66); // 15-80
  } else if (roll < 0.40) {
    // Low stock (below half of par)
    floor = 1 + Math.floor(rng() * Math.max(1, Math.floor(par / 2) - 1));
    vault = 15 + Math.floor(rng() * 66);
  } else {
    // Healthy — above reorder but still interesting
    floor = Math.floor(par * (0.5 + rng() * 0.8));
    vault = 15 + Math.floor(rng() * 40);
  }
  const currentOnHand = floor + vault;
  const safetyStock = Math.ceil(dailyVelocity * 7); // 7 days safety
  const belowReorder = currentOnHand < safetyStock * 2;
  return {
    ...productDef,
    vendor: vendorName,
    dailyVelocity,
    par,
    floor,
    vault,
    currentOnHand,
    safetyStock,
    belowReorder,
  };
}

const VENDOR_GROUPS = [
  { vendor: 'Jeeter', minOrder: 1000, leadTime: '5-7 days', bfdActive: true, bfdPct: 15, bfdExpiry: 'Apr 15' },
  { vendor: 'Wyld', minOrder: 750, leadTime: '3-5 days', bfdActive: false },
  { vendor: 'STIIIZY', minOrder: 1500, leadTime: '7-10 days', bfdActive: true, bfdPct: 20, bfdExpiry: 'Apr 1' },
  { vendor: 'Kiva', minOrder: 500, leadTime: '3-5 days', bfdActive: false },
  { vendor: 'Cookies', minOrder: 2000, leadTime: '10-14 days', bfdActive: true, bfdPct: 10, bfdExpiry: 'Apr 30' },
];

function getVendorGroup(brandName) {
  return VENDOR_GROUPS.find(v => v.vendor.toLowerCase() === brandName.toLowerCase()) || null;
}

const BFD_EXCLUDED_STATES = ['OH', 'PA'];

const PO_APPROVAL_CONFIG = {
  threshold: 2000, // Dollar amount - POs above this require approval
  approver: { name: 'Katie Goodwin', role: 'Regional Buyer', email: 'katie.g@ascendwellness.com' },
};


/* ═══════════════════════════════════════════════════════════════════
   TRANSFER WORKSHEET VIEW
   ═══════════════════════════════════════════════════════════════════ */

export function TransferWorksheetView({ data, onBack }) {
  const navigate = useNavigate();
  const storeName = data?.store || 'Store';
  const triggeredProduct = data?.triggeredProduct || null;
  const storeState = data?.storeState || 'IL';

  // Find store index for deterministic seeding
  const storeIndex = useMemo(() => {
    const idx = ALL_STORE_INVENTORY.findIndex(s => s.name === storeName);
    return idx >= 0 ? idx : 0;
  }, [storeName]);

  // Find all products at this store with realistic floor/par/vault and velocity
  const allProducts = useMemo(() => {
    const storeData = ALL_STORE_INVENTORY.find(s => s.name === storeName);
    if (!storeData) return [];
    return storeData.products.map((p, pi) => {
      const seed = _hashStr(storeName + p.name + String(pi));
      const rng = _seedRng(seed);
      const cat = p.category;
      // Daily velocity
      const [vLo, vHi] = VELOCITY_RANGE[cat] || [1, 4];
      const dailyVelocity = Math.round((vLo + rng() * (vHi - vLo)) * 10) / 10;
      // Par level by category
      const [pLo, pHi] = PAR_RANGE[cat] || [6, 12];
      const par = pLo + Math.floor(rng() * (pHi - pLo + 1));
      // Floor: OOS or low stock
      let floor;
      const floorRoll = rng();
      if (floorRoll < 0.25) {
        floor = Math.floor(rng() * 4); // 0-3 (OOS range)
      } else if (floorRoll < 0.55) {
        floor = 1 + Math.floor(rng() * Math.max(1, Math.floor(par / 2) - 1)); // low stock
      } else {
        floor = Math.floor(par * (0.6 + rng() * 0.6)); // nearPar
      }
      // Vault: always meaningful for transfer candidates
      const vault = 15 + Math.floor(rng() * 66); // 15-80
      const suggestedPull = Math.max(0, Math.min(par - floor, vault));
      const parTargetDays = 7;
      return {
        ...p,
        dailyVelocity,
        par,
        floor,
        vault,
        suggestedPull,
        parTargetDays,
      };
    });
  }, [storeName]);

  // Triggered product row
  const triggerRow = useMemo(() => {
    if (!triggeredProduct) return allProducts[0] || null;
    return allProducts.find(p => p.name === triggeredProduct.name) || allProducts[0] || null;
  }, [allProducts, triggeredProduct]);

  // Other products needing restocking (floor < par AND vault > 0), excluding triggered
  const restockCandidates = useMemo(() => {
    return allProducts
      .filter(p => p.floor < p.par && p.vault > 0 && (!triggerRow || p.name !== triggerRow.name))
      .sort((a, b) => {
        if (a.floor === 0 && b.floor !== 0) return -1;
        if (b.floor === 0 && a.floor !== 0) return 1;
        return (b.par - b.floor) - (a.par - a.floor);
      });
  }, [allProducts, triggerRow]);

  // Completely out of stock products (0 vault + 0 floor)
  const completelyOOS = useMemo(() => {
    return allProducts.filter(p => p.floor === 0 && p.vault === 0);
  }, [allProducts]);

  // Selection & quantities state
  const [checkedItems, setCheckedItems] = useState(() => {
    const initial = new Set();
    restockCandidates.slice(0, 5).forEach(p => initial.add(p.name));
    return initial;
  });
  const [quantities, setQuantities] = useState(() => {
    const q = {};
    if (triggerRow) q[triggerRow.name] = triggerRow.suggestedPull;
    restockCandidates.forEach(p => { q[p.name] = p.suggestedPull; });
    return q;
  });
  const [transferCreated, setTransferCreated] = useState(false);
  const [transferToast, setTransferToast] = useState(null);
  const showTransferToast = (msg) => { setTransferToast(msg); setTimeout(() => setTransferToast(null), 3000); };

  // State-specific compliance config
  const stateCompliance = getStateCompliance(storeState);
  const complianceSystem = stateCompliance.system;

  // Trigger row qty
  const triggerQty = triggerRow ? (quantities[triggerRow.name] ?? triggerRow.suggestedPull) : 0;

  // Summary calculations
  const selectedProducts = restockCandidates.filter(p => checkedItems.has(p.name));
  const totalProducts = (triggerRow ? 1 : 0) + selectedProducts.length;
  const totalUnits = triggerQty + selectedProducts.reduce((sum, p) => sum + (quantities[p.name] ?? p.suggestedPull), 0);
  const totalRetailValue = (triggerRow ? triggerQty * triggerRow.price : 0) +
    selectedProducts.reduce((sum, p) => sum + (quantities[p.name] ?? p.suggestedPull) * p.price, 0);

  const toggleCheck = (name) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  // State-specific compliance note
  const complianceNote = stateCompliance.vaultToFloor + ' for each item';

  // Render helper for reasoning text
  const renderReasoning = (p) => (
    <p className="text-[9px] text-text-muted mt-0.5 italic">
      Based on {p.dailyVelocity} units/day velocity x {p.parTargetDays} day par target
    </p>
  );

  if (!triggerRow) {
    return (
      <div className="space-y-3 animate-fade-in p-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Agent
          </button>
        )}
        <div className="text-center py-8 text-text-muted">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No transfer data available for this store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      {/* Header */}
      <div className="rounded-xl border overflow-hidden bg-surface-card" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-blue) 20%, var(--color-surface-border))' }}>
        <div className="px-3.5 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)' }}>
            <ArrowRightLeft className="w-4 h-4 text-accent-blue" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-text-primary">Floor Restock — {storeName}</h2>
            <p className="text-xs text-text-secondary mt-0.5">Vault-to-floor transfers for products below par level</p>
          </div>
        </div>
      </div>

      {/* Transparency / provenance panel */}
      <TransparencyPanel
        title="How transfer suggestions work"
        sources={['POS', 'METRC']}
        timestamp={TRANSPARENCY_TIMESTAMP}
        methodology={`Suggested Pull = Par Level \u2212 Current Floor Stock\n\u2022 Par Levels: Set by store manager, last updated Mar 15\n\u2022 Floor/Vault Counts: From last METRC room inventory sync\n\u2022 Priority: OOS products first, then by revenue impact ($/day lost)\n\u2022 $/Day Lost = Avg Daily Units Sold \u00d7 Retail Price (28-day avg from POS)`}
      />

      {/* Triggered product — highlighted */}
      <div className="rounded-xl border-2 border-accent-blue/40 bg-surface-card overflow-hidden" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 4%, var(--color-surface-card))' }}>
        <div className="px-3.5 py-1.5 border-b border-accent-blue/15">
          <span className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider">Triggered Product</span>
        </div>
        <div className="px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-text-primary flex items-center gap-1.5">
                <ConfidenceDot velocity={triggerRow.dailyVelocity} />
                {triggerRow.name}
              </p>
              <p className="text-[11px] text-text-secondary">{triggerRow.brand} · {triggerRow.category} · ${triggerRow.price}/ea</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center">
                  <p className={`text-[13px] font-bold ${triggerRow.floor === 0 ? 'text-accent-red' : 'text-text-primary'}`}>{triggerRow.floor}</p>
                  <p className="text-[9px] text-text-muted uppercase">Floor</p>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-accent-gold">{triggerRow.par}</p>
                  <p className="text-[9px] text-text-muted uppercase">Par</p>
                </div>
                <div className="text-center">
                  <p className={`text-[13px] font-bold ${triggerRow.vault > 0 ? 'text-accent-blue' : 'text-accent-red'}`}>{triggerRow.vault}</p>
                  <p className="text-[9px] text-text-muted uppercase">Vault</p>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-accent-green">{triggerRow.suggestedPull}</p>
                  <p className="text-[9px] text-text-muted uppercase">Pull Qty</p>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-text-primary">{triggerRow.dailyVelocity}</p>
                  <p className="text-[9px] text-text-muted uppercase">Units/Day</p>
                </div>
              </div>
              {renderReasoning(triggerRow)}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuantities(prev => ({ ...prev, [triggerRow.name]: Math.max(0, (prev[triggerRow.name] ?? triggerRow.suggestedPull) - 1) }))}
                  className="w-6 h-6 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
                >-</button>
                <input
                  type="number"
                  value={triggerQty}
                  onChange={(e) => setQuantities(prev => ({ ...prev, [triggerRow.name]: Math.max(0, Math.min(triggerRow.vault, parseInt(e.target.value) || 0)) }))}
                  className="w-14 h-7 text-center text-[13px] font-bold text-text-primary bg-surface-card border border-accent-blue/30 rounded-lg focus:border-accent-blue focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQuantities(prev => ({ ...prev, [triggerRow.name]: Math.min(triggerRow.vault, (prev[triggerRow.name] ?? triggerRow.suggestedPull) + 1) }))}
                  className="w-6 h-6 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
                >+</button>
              </div>
              <span className="text-[10px] text-text-muted">${(triggerQty * triggerRow.price).toLocaleString()} retail value</span>
            </div>
          </div>
        </div>
      </div>

      {/* Also needs restocking section */}
      {restockCandidates.length > 0 && (
        <Section title="Also Needs Restocking" icon={ArrowUpDown} iconColor="var(--color-accent-gold)" badge={`${restockCandidates.length} items`}>
          <div className="space-y-1.5">
            {restockCandidates.map((p) => {
              const isChecked = checkedItems.has(p.name);
              const qty = quantities[p.name] ?? p.suggestedPull;
              return (
                <div key={p.name} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${isChecked ? 'border-accent-gold/30 bg-accent-gold/5' : 'border-surface-border bg-surface-bg'}`}>
                  <div
                    className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                      isChecked ? 'bg-accent-gold border-accent-gold' : 'border-surface-border hover:border-text-muted'
                    }`}
                    onClick={() => toggleCheck(p.name)}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ConfidenceDot velocity={p.dailyVelocity} />
                      <p className="text-[12px] font-semibold text-text-primary truncate">{p.name}</p>
                      {p.floor === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-red/15 text-accent-red border border-accent-red/20">OOS</span>}
                      {p.floor > 0 && p.floor < Math.floor(p.par / 2) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/20">Low</span>}
                    </div>
                    <p className="text-[10px] text-text-muted">
                      {p.brand} · Floor: {p.floor} / Par: {p.par} / Vault: {p.vault} · ${p.price}/ea · {p.dailyVelocity}/day
                    </p>
                    {renderReasoning(p)}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQuantities(prev => ({ ...prev, [p.name]: Math.max(0, (prev[p.name] ?? p.suggestedPull) - 1) }))}
                        className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
                      >-</button>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQuantities(prev => ({ ...prev, [p.name]: Math.max(0, Math.min(p.vault, parseInt(e.target.value) || 0)) }))}
                        className="w-10 h-5 text-center text-[11px] font-bold text-text-primary bg-surface-card border border-surface-border rounded focus:border-accent-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQuantities(prev => ({ ...prev, [p.name]: Math.min(p.vault, (prev[p.name] ?? p.suggestedPull) + 1) }))}
                        className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
                      >+</button>
                    </div>
                    {isChecked && <span className="text-[9px] text-text-muted">${(qty * p.price).toLocaleString()}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Summary bar — units AND retail value */}
      <div className="rounded-xl border border-surface-border bg-surface-card px-3.5 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-[12px] text-text-secondary">
            <span className="text-text-primary font-semibold">{totalProducts}</span> products, <span className="text-accent-blue font-semibold">{totalUnits}</span> units to transfer
          </div>
          <div className="text-[12px]">
            <span className="text-text-muted">Retail value: </span>
            <span className="text-accent-green font-bold">${totalRetailValue.toLocaleString()}</span>
          </div>
        </div>
        <p className="text-[10px] text-text-muted mt-1">{complianceNote}</p>
      </div>

      {/* Create Transfer button / success */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-3.5">
        {transferCreated ? (
          <div className="animate-fade-in space-y-3 py-3">
            {/* Toast */}
            {transferToast && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] px-4 py-2.5 rounded-xl bg-surface-card border border-accent-green/30 shadow-xl animate-fade-in">
                <span className="text-xs font-medium text-text-primary">{transferToast}</span>
              </div>
            )}
            <div className="flex items-center gap-3 justify-center">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
                <CheckCircle2 className="w-5 h-5 text-accent-green" />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">Transfer Logged</p>
                <p className="text-sm text-text-secondary">Pick list ready for vault manager. {totalProducts} products, {totalUnits} units.</p>
              </div>
            </div>
            <div className="mx-auto max-w-sm rounded-xl border border-surface-border bg-surface-bg divide-y divide-surface-divider">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Transfer #</span>
                <span className="text-[12px] font-semibold text-accent-green">TRF-2026-{String(_hashStr(storeName) % 9000 + 1000)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Compliance</span>
                <span className="text-[12px] font-medium text-text-primary flex items-center gap-1.5 flex-wrap justify-end">
                  <ComplianceSystemBadge system={complianceSystem} />
                  {stateCompliance.vaultToFloor}. No manifest required.
                </span>
              </div>
              {stateCompliance.agentInCharge && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-text-muted">Agent-in-Charge Approval</span>
                  <span className="text-[12px] font-semibold text-accent-gold">Required — pending signature</span>
                </div>
              )}
              {stateCompliance.strictness === 'very_high' && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-text-muted">Transfer Justification</span>
                  <span className="text-[12px] font-medium text-text-primary italic">Floor restock based on par levels</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Retail value</span>
                <span className="text-[12px] font-medium text-text-primary">${totalRetailValue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Status</span>
                <span className="text-[12px] font-semibold text-accent-blue flex items-center gap-1">
                  <Clipboard className="w-3 h-3" /> Pick list ready
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <button
                onClick={() => showTransferToast('Pick list sent to printer.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border border-accent-blue/20 transition-colors"
              >
                <Printer className="w-3 h-3" /> Print Pick List
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-surface-hover text-text-secondary hover:text-text-primary border border-surface-border transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Inventory
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)' }}>
                <ArrowRightLeft className="w-4 h-4 text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Create Transfer — {totalProducts} products, {totalUnits} units (${totalRetailValue.toLocaleString()} retail)</p>
                <p className="text-[11px] text-text-secondary mt-0.5">Vault-to-floor room change. {complianceNote}.</p>
              </div>
            </div>
            <button
              onClick={() => setTransferCreated(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-accent-blue transition-all hover:scale-105 active:scale-95 shadow-lg text-sm flex-shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4" /> Create Transfer
            </button>
          </div>
        )}
      </div>

      {/* Completely OOS callout */}
      {completelyOOS.length > 0 && (
        <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-3.5 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-red flex-shrink-0" />
            <p className="text-[12px] text-text-primary">
              <span className="font-semibold text-accent-red">{completelyOOS.length} product{completelyOOS.length > 1 ? 's are' : ' is'} completely out of stock</span> (0 vault + 0 floor) —{' '}
              <button
                onClick={() => {
                  const first = completelyOOS[0];
                  if (onBack) onBack();
                  navigate('/agents/connect', { state: { action: 'reorder', store: storeName, product: first.name, brand: first.brand, vendor: first.brand } });
                }}
                className="text-accent-green font-semibold underline hover:no-underline cursor-pointer"
              >
                Draft PO
              </button>
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {completelyOOS.map(p => (
              <span key={p.name} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/15 font-medium">{p.name}</span>
            ))}
          </div>
          {/* Cross-store transfer compliance warning */}
          <div className="mt-3 rounded-lg border border-accent-gold/25 bg-accent-gold/5 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />
              <span className="text-[11px] font-semibold text-accent-gold">Cross-Store Transfer — Additional Compliance Required</span>
            </div>
            <p className="text-[10px] text-text-secondary mb-2">This would transfer product between licensed premises.</p>
            <div className="flex items-center gap-2 text-[10px] mb-1.5">
              <ComplianceSystemBadge system={stateCompliance.system} size="xs" />
              <span className="text-text-primary font-medium">{stateCompliance.crossStore}</span>
            </div>
            {stateCompliance.strictness === 'very_high' && (
              <div className="rounded px-2 py-1.5 mb-2" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 25%, transparent)' }}>
                <span className="text-[10px] font-semibold text-accent-gold">
                  {storeState === 'OH' ? 'Ohio requires documented justification for all transfers' : 'Pennsylvania DOH transport regulations apply (medical program)'}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted">
                Estimated processing: {['MI', 'NJ'].includes(storeState) ? 'Same-day' : '24-48h'}
              </span>
              <button
                onClick={() => {
                  if (onBack) onBack();
                  navigate('/inventory');
                }}
                className="text-[10px] font-semibold text-accent-gold hover:underline flex items-center gap-1"
              >
                Initiate Cross-Store Transfer <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MULTI-VENDOR REORDER VIEW
   ═══════════════════════════════════════════════════════════════════ */

export function MultiVendorReorderView({ data, onBack }) {
  const { logAction } = useActionLog();
  const storeName = data?.store || 'Store';
  const triggeredVendor = data?.vendor || null;
  const triggeredProduct = data?.product || null;
  const storeState = data?.storeState || 'IL';
  const bfdExcluded = BFD_EXCLUDED_STATES.includes(storeState);

  // Find store index
  const storeIndex = useMemo(() => {
    const idx = ALL_STORE_INVENTORY.findIndex(s => s.name === storeName);
    return idx >= 0 ? idx : 0;
  }, [storeName]);

  // Count IL stores and total stores
  const ilStoreCount = useMemo(() => ALL_STORE_INVENTORY.filter(s => s.state === 'IL').length, []);
  const totalStoreCount = ALL_STORE_INVENTORY.length;

  // Scope state: 'this' | 'state:IL' | 'all'
  const [scope, setScope] = useState('this');
  const [scopeOpen, setScopeOpen] = useState(false);

  const scopeLabel = scope === 'this' ? `This Store (${storeName.replace('Ascend ', '')})`
    : scope.startsWith('state:') ? `All ${scope.replace('state:', '')} Stores (${ALL_STORE_INVENTORY.filter(s => s.state === scope.replace('state:', '')).length})`
    : `All Stores (${totalStoreCount})`;

  const scopeStoreCount = scope === 'this' ? 1
    : scope.startsWith('state:') ? ALL_STORE_INVENTORY.filter(s => s.state === scope.replace('state:', '')).length
    : totalStoreCount;

  // Build vendor-grouped products from vendor catalog with full data
  const vendorSections = useMemo(() => {
    const sections = [];
    const vendorNames = Object.keys(VENDOR_PRODUCT_CATALOG);

    vendorNames.forEach(vendorName => {
      const vg = getVendorGroup(vendorName);
      const catalog = VENDOR_PRODUCT_CATALOG[vendorName] || [];

      // Generate inventory data for each product
      const allVendorProducts = catalog.map(productDef => {
        if (scope === 'this') {
          // Single store
          return generateVendorProductData(vendorName, productDef, storeIndex);
        } else {
          // Multi-store aggregation
          const stores = scope === 'all' ? ALL_STORE_INVENTORY : ALL_STORE_INVENTORY.filter(s => s.state === scope.replace('state:', ''));
          let totalOnHand = 0, totalVelocity = 0;
          const perStore = stores.map((st, si) => {
            const d = generateVendorProductData(vendorName, productDef, si);
            totalOnHand += d.currentOnHand;
            totalVelocity += d.dailyVelocity;
            return { storeName: st.name, state: st.state, ...d };
          });
          const aggSafetyStock = Math.ceil(totalVelocity * 7);
          return {
            ...productDef,
            vendor: vendorName,
            dailyVelocity: Math.round(totalVelocity * 10) / 10,
            currentOnHand: totalOnHand,
            safetyStock: aggSafetyStock,
            belowReorder: totalOnHand < aggSafetyStock * 2,
            perStoreBreakdown: perStore,
          };
        }
      });

      // Split into "Needs Reorder" and "Also Available"
      const needsReorder = allVendorProducts.filter(p => p.belowReorder)
        .sort((a, b) => a.currentOnHand - b.currentOnHand);
      const alsoAvailable = allVendorProducts.filter(p => !p.belowReorder);

      if (needsReorder.length === 0 && !triggeredVendor) return; // skip vendor if nothing low

      sections.push({
        vendor: vendorName,
        vendorGroup: vg,
        needsReorder,
        alsoAvailable,
        allProducts: allVendorProducts,
        bfdActive: vg ? vg.bfdActive : false,
        bfdPct: vg ? vg.bfdPct : 0,
        bfdExpiry: vg ? vg.bfdExpiry : null,
        minOrder: vg ? vg.minOrder : 0,
        leadTime: vg ? vg.leadTime : '3-5 days',
      });
    });

    return sections.sort((a, b) => {
      if (triggeredVendor && a.vendor.toLowerCase() === triggeredVendor.toLowerCase()) return -1;
      if (triggeredVendor && b.vendor.toLowerCase() === triggeredVendor.toLowerCase()) return 1;
      return b.needsReorder.length - a.needsReorder.length;
    });
  }, [storeName, storeIndex, triggeredVendor, bfdExcluded, scope]);

  // Expand state
  const [expanded, setExpanded] = useState(() => {
    const e = {};
    vendorSections.forEach((vs, i) => { e[vs.vendor] = i === 0; });
    return e;
  });

  // Per-vendor days-on-hand slider
  const [vendorDaysOnHand, setVendorDaysOnHand] = useState(() => {
    const d = {};
    vendorSections.forEach(vs => { d[vs.vendor] = 28; });
    return d;
  });

  // Product selection (needs reorder = pre-checked, also available = unchecked)
  const [selectedProducts, setSelectedProducts] = useState(() => {
    const s = new Set();
    vendorSections.forEach(vs => {
      vs.needsReorder.forEach(p => s.add(`${vs.vendor}::${p.name}`));
    });
    return s;
  });

  // Per-product quantity overrides
  const [quantities, setQuantities] = useState(() => {
    const q = {};
    const defaultDOH = 28;
    vendorSections.forEach(vs => {
      [...vs.needsReorder, ...vs.alsoAvailable].forEach(p => {
        const suggested = Math.max(0, Math.ceil(p.dailyVelocity * defaultDOH) - p.currentOnHand);
        q[`${vs.vendor}::${p.name}`] = suggested;
      });
    });
    return q;
  });

  // Per-store expansion state
  const [expandedStoreRows, setExpandedStoreRows] = useState(new Set());

  // Recalculate quantities when days-on-hand changes for a vendor
  const handleDaysOnHandChange = (vendor, newDays) => {
    setVendorDaysOnHand(prev => ({ ...prev, [vendor]: newDays }));
    const vs = vendorSections.find(v => v.vendor === vendor);
    if (!vs) return;
    setQuantities(prev => {
      const next = { ...prev };
      [...vs.needsReorder, ...vs.alsoAvailable].forEach(p => {
        const key = `${vendor}::${p.name}`;
        next[key] = Math.max(0, Math.ceil(p.dailyVelocity * newDays) - p.currentOnHand);
      });
      return next;
    });
  };

  const toggleProduct = (key) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Per-vendor generated state
  const [generatedPOs, setGeneratedPOs] = useState(new Set());
  const [allGenerated, setAllGenerated] = useState(false);

  // Review step state
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewVendorFilter, setReviewVendorFilter] = useState(null); // null = all vendors, string = single vendor
  const [submittedPOs, setSubmittedPOs] = useState(null);
  const [heldPOsList, setHeldPOsList] = useState(null);
  const [expandedReviewPOs, setExpandedReviewPOs] = useState(new Set());
  const [heldPOs, setHeldPOs] = useState(new Set());
  const [approvalNotes, setApprovalNotes] = useState({});
  const [poSuccessToast, setPOSuccessToast] = useState(null);
  const showPOToast = (msg) => { setPOSuccessToast(msg); setTimeout(() => setPOSuccessToast(null), 3000); };

  const toggleExpand = (vendor) => {
    setExpanded(prev => ({ ...prev, [vendor]: !prev[vendor] }));
  };

  // Compute per-vendor live totals
  const getVendorTotals = (vs) => {
    let subtotal = 0, selectedCount = 0, totalRetail = 0;
    [...vs.needsReorder, ...vs.alsoAvailable].forEach(p => {
      const key = `${vs.vendor}::${p.name}`;
      if (!selectedProducts.has(key)) return;
      const qty = quantities[key] || 0;
      subtotal += qty * p.unitCost;
      totalRetail += qty * p.retailPrice;
      if (qty > 0) selectedCount++;
    });
    const bfd = vs.bfdActive && !bfdExcluded ? subtotal * (vs.bfdPct / 100) : 0;
    const net = subtotal - bfd;
    const margin = totalRetail > 0 ? ((totalRetail - net) / totalRetail * 100) : 0;
    return { subtotal, bfd, net, selectedCount, totalRetail, margin, minMet: subtotal >= vs.minOrder, minProgress: Math.min(100, (subtotal / Math.max(1, vs.minOrder)) * 100) };
  };

  // Session totals
  const sessionTotals = useMemo(() => {
    let totalPOs = vendorSections.length;
    let totalValue = 0;
    let totalBFD = 0;
    vendorSections.forEach(vs => {
      const t = getVendorTotals(vs);
      totalValue += t.net;
      totalBFD += t.bfd;
    });
    return { totalPOs, totalValue, totalBFD };
  }, [vendorSections, quantities, selectedProducts, bfdExcluded]);

  const handleGeneratePO = (vendor) => {
    setReviewVendorFilter(vendor);
    setReviewMode(true);
    setHeldPOs(new Set());
    // Auto-expand all POs for this vendor
    const pos = buildReviewPOs(vendor);
    setExpandedReviewPOs(new Set(pos.map(po => po.poNumber)));
  };

  const handleGenerateAll = () => {
    setReviewVendorFilter(null);
    setReviewMode(true);
    setHeldPOs(new Set());
    // Auto-expand first PO only
    const pos = buildReviewPOs(null);
    if (pos.length > 0) setExpandedReviewPOs(new Set([pos[0].poNumber]));
  };

  const handleSubmitAllPOs = () => {
    const pos = buildReviewPOs(reviewVendorFilter);
    const activePOs = pos.filter(po => !heldPOs.has(po.poNumber));
    const heldList = pos.filter(po => heldPOs.has(po.poNumber));
    setSubmittedPOs(activePOs);
    setHeldPOsList(heldList.length > 0 ? heldList : null);
    setReviewMode(false);

    // Mark vendors as generated
    if (reviewVendorFilter) {
      setGeneratedPOs(prev => new Set([...prev, reviewVendorFilter]));
    } else {
      setAllGenerated(true);
      vendorSections.forEach(vs => {
        setGeneratedPOs(prev => new Set([...prev, vs.vendor]));
      });
    }

    logAction({
      type: 'purchase_order',
      agent: 'Inventory Agent',
      description: `${activePOs.length} Purchase Order${activePOs.length !== 1 ? 's' : ''} submitted`,
      detail: `Multi-vendor reorder at ${scopeLabel} — $${Math.round(activePOs.reduce((s, po) => s + po.netTotal, 0)).toLocaleString()} total${heldPOs.size > 0 ? ` (${heldPOs.size} held)` : ''}`,
    });
  };

  const handleBackToEdit = () => {
    setReviewMode(false);
    setReviewVendorFilter(null);
  };

  // Build per-store PO breakdown for the review step
  const poCounter = useRef(847);
  const buildReviewPOs = (vendorFilter) => {
    const sections = vendorFilter
      ? vendorSections.filter(vs => vs.vendor === vendorFilter)
      : vendorSections;
    const pos = [];
    const isMultiStore = scope !== 'this';

    // Determine target stores
    const targetStores = scope === 'this'
      ? [ALL_STORE_INVENTORY[storeIndex]]
      : scope === 'all'
        ? ALL_STORE_INVENTORY
        : ALL_STORE_INVENTORY.filter(s => s.state === scope.replace('state:', ''));

    sections.forEach(vs => {
      const selectedItems = [...vs.needsReorder, ...vs.alsoAvailable].filter(p => {
        const key = `${vs.vendor}::${p.name}`;
        return selectedProducts.has(key) && (quantities[key] || 0) > 0;
      });

      if (selectedItems.length === 0) return;

      const doh = vendorDaysOnHand[vs.vendor] || 28;

      targetStores.forEach((store, si) => {
        const storeIdx = ALL_STORE_INVENTORY.findIndex(s => s.name === store.name);
        const poNum = `PO-2026-${String(poCounter.current++).padStart(4, '0')}`;
        const stateAbbr = store.state || storeState;
        const licenseNum = `D-${stateAbbr}-2024-${String(Math.abs(_hashStr(store.name + vs.vendor)) % 10000).padStart(4, '0')}`;

        // Generate line items for this store
        const lineItems = selectedItems.map(p => {
          const key = `${vs.vendor}::${p.name}`;
          const totalQty = quantities[key] || 0;
          let storeQty;

          if (isMultiStore && p.perStoreBreakdown) {
            const psData = p.perStoreBreakdown.find(ps => ps.storeName === store.name);
            if (psData) {
              storeQty = Math.max(0, Math.ceil(psData.dailyVelocity * doh) - psData.currentOnHand);
            } else {
              storeQty = Math.ceil(totalQty / targetStores.length);
            }
          } else {
            storeQty = totalQty;
          }

          if (storeQty <= 0) return null;

          const lineCost = storeQty * p.unitCost;
          const bfdPct = vs.bfdActive && !bfdExcluded ? vs.bfdPct : 0;
          const lineBfd = lineCost * (bfdPct / 100);
          return {
            product: p.name,
            category: p.category,
            qty: storeQty,
            uom: 'units',
            unitCost: p.unitCost,
            bfdPct,
            lineCost,
            lineBfd,
            lineNet: lineCost - lineBfd,
          };
        }).filter(Boolean);

        if (lineItems.length === 0) return;

        const subtotal = lineItems.reduce((s, li) => s + li.lineCost, 0);
        const bfdSavings = lineItems.reduce((s, li) => s + li.lineBfd, 0);
        const netTotal = subtotal - bfdSavings;
        const minMet = subtotal >= vs.minOrder;

        // Determine delivery method — Connect vendors are Jeeter, STIIIZY, Kiva
        const connectVendors = ['Jeeter', 'STIIIZY', 'Kiva'];
        const isConnect = connectVendors.includes(vs.vendor);

        // Expected arrival: lead time from now
        const leadDays = vs.leadTime || '3-5 days';
        const leadMin = parseInt(leadDays) || 3;
        const leadMax = parseInt(leadDays.split('-')[1]) || leadMin + 2;
        const arrivalStart = new Date();
        arrivalStart.setDate(arrivalStart.getDate() + leadMin);
        const arrivalEnd = new Date();
        arrivalEnd.setDate(arrivalEnd.getDate() + leadMax);
        const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        pos.push({
          poNumber: poNum,
          vendor: vs.vendor,
          storeName: store.name,
          storeState: stateAbbr,
          licenseNumber: licenseNum,
          expectedArrival: `${fmtDate(arrivalStart)}-${fmtDate(arrivalEnd)}`,
          lineItems,
          subtotal,
          bfdSavings,
          netTotal,
          minOrder: vs.minOrder,
          minMet,
          isConnect,
          leadTime: vs.leadTime,
        });
      });
    });

    // Reset counter for consistent numbering
    poCounter.current = 847;
    return pos;
  };

  // Render a product row
  const renderProductRow = (vs, p, isReorder) => {
    const key = `${vs.vendor}::${p.name}`;
    const isSelected = selectedProducts.has(key);
    const qty = quantities[key] || 0;
    const lineTotal = qty * p.unitCost;
    const lineBFD = vs.bfdActive && !bfdExcluded ? lineTotal * (vs.bfdPct / 100) : 0;
    const lineNet = lineTotal - lineBFD;
    const doh = vendorDaysOnHand[vs.vendor] || 28;
    const isMultiStore = scope !== 'this';
    const showPerStore = isMultiStore && expandedStoreRows.has(key);

    return (
      <div key={p.name}>
        <div className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isSelected ? (isReorder ? 'bg-accent-gold/5' : 'bg-accent-green/5') : 'hover:bg-surface-muted'}`}>
          {/* Checkbox */}
          <div
            className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
              isSelected ? (isReorder ? 'bg-accent-gold border-accent-gold' : 'bg-accent-green border-accent-green') : 'border-surface-border hover:border-text-muted'
            }`}
            onClick={() => toggleProduct(key)}
          >
            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          {/* Product info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ConfidenceDot velocity={p.dailyVelocity} />
              <p className="text-[12px] font-medium text-text-primary truncate">{p.name}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-hover text-text-muted font-medium">{p.category}</span>
              {isReorder && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-red/15 text-accent-red border border-accent-red/20">Below Safety</span>}
              {vs.bfdActive && !bfdExcluded && isSelected && qty > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-green/12 text-accent-green border border-accent-green/18">
                  {vs.bfdPct}% BFD -${Math.round(lineBFD)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted flex-wrap">
              <span>{isMultiStore ? 'Total' : ''} On-hand: <span className="font-medium text-text-secondary">{p.currentOnHand}</span></span>
              <span>Velocity: <span className="font-medium text-text-secondary">{p.dailyVelocity}/day</span></span>
              <span>Cost: <span className="font-medium text-text-secondary">${p.unitCost.toFixed(2)}</span></span>
              <span>Retail: <span className="font-medium text-text-secondary">${p.retailPrice.toFixed(2)}</span></span>
            </div>
            {isMultiStore && p.perStoreBreakdown && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedStoreRows(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; }); }}
                className="text-[9px] text-accent-blue font-medium mt-0.5 hover:underline"
              >
                {showPerStore ? 'Hide' : 'Show'} per-store breakdown ({p.perStoreBreakdown.length} locations)
              </button>
            )}
          </div>
          {/* Qty + line total */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setQuantities(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) }))}
              className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
            >-</button>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQuantities(prev => ({ ...prev, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
              className="w-12 h-5 text-center text-[11px] font-bold text-text-primary bg-surface-card border border-surface-border rounded focus:border-accent-gold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => setQuantities(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))}
              className="w-5 h-5 rounded border border-surface-border text-text-secondary hover:text-text-primary flex items-center justify-center text-xs transition-colors"
            >+</button>
            {isSelected && <span className="text-[11px] font-medium text-text-primary w-16 text-right">${Math.round(lineNet).toLocaleString()}</span>}
          </div>
        </div>
        {/* Per-store breakdown */}
        {showPerStore && p.perStoreBreakdown && (
          <div className="bg-surface-bg border-t border-surface-divider/50 px-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {p.perStoreBreakdown.map(ps => {
                const psQty = Math.max(0, Math.ceil(ps.dailyVelocity * doh) - ps.currentOnHand);
                return (
                  <div key={ps.storeName} className="flex items-center justify-between text-[10px] py-0.5 px-2 rounded hover:bg-surface-hover">
                    <span className="text-text-secondary truncate">{ps.storeName.replace('Ascend ', '')}</span>
                    <span className="text-text-primary font-medium ml-2 flex-shrink-0">OH: {ps.currentOnHand} / Alloc: {psQty}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Submitted POs success state (lifecycle-aware) ---
  if (submittedPOs) {
    const totalSubmitted = submittedPOs.length;
    const totalSubmittedValue = submittedPOs.reduce((s, po) => s + po.netTotal, 0);
    const approvalPOsInSuccess = submittedPOs.filter(po => po.netTotal > PO_APPROVAL_CONFIG.threshold);
    const directPOsInSuccess = submittedPOs.filter(po => po.netTotal <= PO_APPROVAL_CONFIG.threshold);

    // Compute expected delivery window across all POs
    const allArrivals = submittedPOs.map(po => po.expectedArrival).filter(Boolean);
    const deliveryRange = allArrivals.length > 0 ? allArrivals[0] + (allArrivals.length > 1 ? ' through ' + allArrivals[allArrivals.length - 1].split('-').pop() : '') : 'Apr 5-10';

    // PO lifecycle timeline component
    const POLifecycleTimeline = ({ needsApproval }) => {
      const steps = needsApproval
        ? [
            { label: 'Draft', done: true },
            { label: 'Pending Approval', active: true },
            { label: 'Submitted', done: false },
            { label: 'Awaiting Vendor', done: false },
            { label: 'Shipped', done: false },
            { label: 'Delivered', done: false },
            { label: 'Received', done: false },
          ]
        : [
            { label: 'Draft', done: true },
            { label: 'Submitted', done: true },
            { label: 'Awaiting Vendor', active: true },
            { label: 'Shipped', done: false },
            { label: 'Delivered', done: false },
            { label: 'Received', done: false },
          ];
      return (
        <div className="flex items-center gap-0 w-full overflow-x-auto py-1">
          {steps.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 0 }}>
                <div className={`w-[10px] h-[10px] rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? 'bg-accent-green' : step.active ? 'bg-accent-gold ring-[3px] ring-accent-gold/20 animate-pulse' : 'bg-surface-border'
                }`}>
                  {step.done && <Check className="w-[7px] h-[7px] text-white" strokeWidth={3} />}
                </div>
                <span className={`text-[8px] mt-0.5 whitespace-nowrap leading-tight ${
                  step.done ? 'text-accent-green font-semibold' : step.active ? 'text-accent-gold font-semibold' : 'text-text-muted'
                }`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[1.5px] mx-0.5 mt-[-10px] min-w-[8px] ${
                  step.done ? 'bg-accent-green' : 'bg-surface-border'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-3 animate-fade-in">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Agent
          </button>
        )}

        {/* Toast */}
        {poSuccessToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] px-4 py-2.5 rounded-xl bg-surface-card border border-accent-green/30 shadow-xl animate-fade-in">
            <span className="text-xs font-medium text-text-primary">{poSuccessToast}</span>
          </div>
        )}

        <div className="rounded-xl border overflow-hidden bg-surface-card" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-green) 30%, var(--color-surface-border))' }}>
          {/* Header */}
          <div className="px-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
              <CheckCircle2 className="w-7 h-7 text-accent-green" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">{totalSubmitted} Purchase Order{totalSubmitted !== 1 ? 's' : ''} Created</h2>
            <p className="text-sm text-text-secondary mt-1">Total value: ${Math.round(totalSubmittedValue).toLocaleString()}</p>
          </div>

          {/* Per-PO lifecycle cards */}
          <div className="border-t border-surface-divider divide-y divide-surface-divider">
            {submittedPOs.map(po => {
              const needsApproval = po.netTotal > PO_APPROVAL_CONFIG.threshold;
              return (
                <div key={po.poNumber} className={`px-4 py-3 ${needsApproval ? 'bg-accent-gold/5' : ''}`}>
                  {/* PO header row */}
                  <div className="flex items-center gap-3 text-[12px] mb-2">
                    {needsApproval
                      ? <span className="text-base flex-shrink-0" role="img" aria-label="pending">&#9203;</span>
                      : <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-text-primary">{po.poNumber}</span>
                      <span className="text-text-muted mx-1.5">&rarr;</span>
                      <span className="font-medium text-text-primary">{po.vendor}</span>
                      <span className="text-text-muted ml-1.5 text-[11px]">${Math.round(po.netTotal).toLocaleString()}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${needsApproval ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : po.isConnect ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-surface-hover text-text-muted border border-surface-border'}`}>
                      {needsApproval ? 'Pending Approval' : po.isConnect ? 'Via Connect' : 'Manual'}
                    </span>
                  </div>
                  {/* Lifecycle timeline */}
                  <div className="ml-7 mr-1">
                    <POLifecycleTimeline needsApproval={needsApproval} />
                  </div>
                  {/* Expected timeline note */}
                  <p className="text-[10px] text-text-muted mt-1.5 ml-7">
                    {needsApproval
                      ? <>Awaiting {PO_APPROVAL_CONFIG.approver.name} ({PO_APPROVAL_CONFIG.approver.role}). Once approved, vendor typically confirms within 24h. Est. delivery: {po.expectedArrival}.</>
                      : <>Vendor typically confirms within 24h. Est. delivery: {po.expectedArrival}. You'll be notified when the vendor ships.</>
                    }
                  </p>
                  {/* Contextual action buttons */}
                  <div className="flex items-center gap-1.5 mt-2 ml-7">
                    {po.isConnect && !needsApproval && (
                      <button
                        onClick={() => showPOToast('Opening Connect to track vendor response...')}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-accent-green bg-accent-green/8 hover:bg-accent-green/15 border border-accent-green/15 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> Track on Connect
                      </button>
                    )}
                    <button
                      onClick={() => showPOToast(`Delivery alert set for ${po.poNumber}. You'll be notified when ${po.vendor} ships.`)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-text-secondary hover:text-text-primary bg-surface-hover border border-surface-border transition-colors"
                    >
                      <Bell className="w-2.5 h-2.5" /> Set Delivery Alert
                    </button>
                    <button
                      onClick={() => showPOToast('When delivery arrives, go to Inventory > Incoming Inventory to receive against this PO or the METRC manifest.')}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-text-secondary hover:text-text-primary bg-surface-hover border border-surface-border transition-colors"
                    >
                      <PackageCheck className="w-2.5 h-2.5" /> Prepare Receiving
                    </button>
                  </div>
                </div>
              );
            })}
            {heldPOsList && heldPOsList.map(po => (
              <div key={po.poNumber} className="px-4 py-2.5 flex items-center gap-3 text-[12px] opacity-50">
                <span className="w-4 h-4 flex-shrink-0 text-text-muted text-center">&mdash;</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-text-primary">{po.poNumber}</span>
                  <span className="text-text-muted mx-1.5">&rarr;</span>
                  <span className="font-medium text-text-muted">Held &mdash; not submitted</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-surface-border">Held</span>
              </div>
            ))}
          </div>

          {/* Portfolio Summary footer */}
          <div className="px-4 py-3 bg-surface-bg border-t border-surface-divider">
            {approvalPOsInSuccess.length > 0 && (
              <p className="text-[11px] text-accent-gold font-medium mb-2">
                {approvalPOsInSuccess.length} PO{approvalPOsInSuccess.length !== 1 ? 's' : ''} sent to {PO_APPROVAL_CONFIG.approver.name} for approval. Estimated review: same business day.
              </p>
            )}
            <div className="rounded-lg bg-surface-card border border-surface-border px-3 py-2.5 mb-3">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-text-muted">{totalSubmitted} PO{totalSubmitted !== 1 ? 's' : ''} submitted</span>
                <span className="font-semibold text-text-primary">${Math.round(totalSubmittedValue).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-text-muted">Expected deliveries</span>
                <span className="font-medium text-text-primary">{submittedPOs[0]?.expectedArrival || 'Apr 5-10'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Next step</span>
                <span className="font-medium text-accent-green">Monitor vendor confirmations on Connect</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSubmittedPOs(null); setHeldPOsList(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-surface-hover text-text-secondary hover:text-text-primary border border-surface-border transition-colors"
              >
                <Clipboard className="w-3 h-3" /> View in Action Log
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-surface-hover text-text-secondary hover:text-text-primary border border-surface-border transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Inventory
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Review Mode ---
  if (reviewMode) {
    const reviewPOs = buildReviewPOs(reviewVendorFilter);
    const activePOs = reviewPOs.filter(po => !heldPOs.has(po.poNumber));
    const uniqueStores = [...new Set(reviewPOs.map(po => po.storeName))];
    const uniqueVendors = [...new Set(reviewPOs.map(po => po.vendor))];
    const totalReviewValue = activePOs.reduce((s, po) => s + po.netTotal, 0);
    const totalReviewBFD = activePOs.reduce((s, po) => s + po.bfdSavings, 0);
    const approvalCount = activePOs.filter(po => po.netTotal > PO_APPROVAL_CONFIG.threshold).length;
    const directCount = activePOs.length - approvalCount;
    const submitButtonLabel = activePOs.length === 0
      ? 'No POs to Submit'
      : approvalCount === 0
        ? `Submit All POs`
        : directCount === 0
          ? `Submit All for Approval`
          : `Submit ${directCount} PO${directCount !== 1 ? 's' : ''} + ${approvalCount} for Approval`;

    return (
      <div className="space-y-3 animate-fade-in">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Agent
          </button>
        )}

        {/* Session Summary Header */}
        <div className="rounded-xl border overflow-hidden bg-surface-card" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-gold) 25%, var(--color-surface-border))' }}>
          <div className="px-3.5 py-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' }}>
              <FileText className="w-4 h-4 text-accent-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-text-primary">Review Purchase Orders</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                <span className="font-semibold text-text-primary">{reviewPOs.length} PO{reviewPOs.length !== 1 ? 's' : ''}</span> across{' '}
                <span className="font-semibold text-text-primary">{uniqueStores.length} store{uniqueStores.length !== 1 ? 's' : ''}</span> to{' '}
                <span className="font-semibold text-text-primary">{uniqueVendors.length} vendor{uniqueVendors.length !== 1 ? 's' : ''}</span>
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-accent-gold">${Math.round(totalReviewValue).toLocaleString()}</p>
              {totalReviewBFD > 0 && (
                <p className="text-[10px] font-semibold text-accent-green">BFD Savings: ${Math.round(totalReviewBFD).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Individual PO Cards */}
        {reviewPOs.map(po => {
          const isExpPO = expandedReviewPOs.has(po.poNumber);
          const isHeld = heldPOs.has(po.poNumber);
          const poNeedsApproval = po.netTotal > PO_APPROVAL_CONFIG.threshold;
          return (
            <div key={po.poNumber} className={`rounded-xl border overflow-hidden bg-surface-card transition-colors ${isHeld ? 'border-surface-border opacity-60' : 'border-accent-gold/20'}`}>
              {/* PO Header - clickable */}
              <button
                onClick={() => setExpandedReviewPOs(prev => { const n = new Set(prev); if (n.has(po.poNumber)) n.delete(po.poNumber); else n.add(po.poNumber); return n; })}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-surface-muted transition-colors"
              >
                {isExpPO ? <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-bold text-accent-gold">{po.poNumber}</span>
                    {poNeedsApproval && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/25">Requires Approval</span>
                    )}
                    <span className="text-[11px] text-text-muted">&mdash;</span>
                    <span className="text-[12px] font-semibold text-text-primary">{po.vendor}</span>
                    <span className="text-[11px] text-text-muted">&rarr;</span>
                    <span className="text-[12px] text-text-secondary">{po.storeName} ({po.storeState})</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted flex-wrap">
                    <span>License: <span className="font-medium text-text-secondary">{po.licenseNumber}</span></span>
                    <span>Expected: <span className="font-medium text-text-secondary">{po.expectedArrival}</span></span>
                    <span className={`font-bold px-1.5 py-0.5 rounded-full ${po.isConnect ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-surface-hover text-text-muted border border-surface-border'}`}>
                      {po.isConnect ? 'via Dutchie Connect' : 'Manual — email/call vendor'}
                    </span>
                  </div>
                  {poNeedsApproval && (
                    <p className="text-[10px] text-accent-gold mt-1">
                      Exceeds ${PO_APPROVAL_CONFIG.threshold.toLocaleString()} threshold &rarr; routes to {PO_APPROVAL_CONFIG.approver.name} ({PO_APPROVAL_CONFIG.approver.role})
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isHeld && <span className="text-[10px] font-bold text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full border border-accent-gold/20">HELD</span>}
                  <span className="text-[12px] font-bold text-text-primary">${Math.round(po.netTotal).toLocaleString()}</span>
                </div>
              </button>

              {/* Expanded PO details */}
              {isExpPO && (
                <div className="border-t border-surface-divider">
                  {/* Line items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-surface-bg text-text-muted">
                          <th className="text-left px-3 py-1.5 font-semibold">Product</th>
                          <th className="text-right px-2 py-1.5 font-semibold">Qty</th>
                          <th className="text-right px-2 py-1.5 font-semibold">UOM</th>
                          <th className="text-right px-2 py-1.5 font-semibold">Unit Cost</th>
                          <th className="text-right px-2 py-1.5 font-semibold">BFD %</th>
                          <th className="text-right px-3 py-1.5 font-semibold">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-divider/50">
                        {po.lineItems.map((li, liIdx) => (
                          <tr key={liIdx} className="hover:bg-surface-muted/50">
                            <td className="px-3 py-1.5 text-text-primary font-medium">{li.product}</td>
                            <td className="text-right px-2 py-1.5 text-text-primary font-semibold">{li.qty}</td>
                            <td className="text-right px-2 py-1.5 text-text-muted">{li.uom}</td>
                            <td className="text-right px-2 py-1.5 text-text-secondary">${li.unitCost.toFixed(2)}</td>
                            <td className="text-right px-2 py-1.5">
                              {li.bfdPct > 0 ? <span className="text-accent-green font-semibold">-{li.bfdPct}%</span> : <span className="text-text-muted">--</span>}
                            </td>
                            <td className="text-right px-3 py-1.5 text-text-primary font-semibold">${Math.round(li.lineNet).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PO Totals */}
                  <div className="bg-surface-bg px-3.5 py-2.5 border-t border-surface-divider">
                    <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1 text-[11px]">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-text-muted">Subtotal: <span className="font-bold text-text-primary">${Math.round(po.subtotal).toLocaleString()}</span></span>
                        {po.bfdSavings > 0 && (
                          <span className="text-text-muted">BFD Savings: <span className="font-bold text-accent-green">-${Math.round(po.bfdSavings).toLocaleString()}</span></span>
                        )}
                        <span className="text-text-muted">Net Total: <span className="font-bold text-accent-gold">${Math.round(po.netTotal).toLocaleString()}</span></span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${po.minMet ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'}`}>
                        Min Order: {po.minMet ? 'Met' : 'Not Met'}
                        {!po.minMet && <span className="ml-1">(${po.minOrder.toLocaleString()} required)</span>}
                      </span>
                    </div>
                    {!po.minMet && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-accent-red">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Below minimum order of ${po.minOrder.toLocaleString()} — vendor may reject or delay this PO</span>
                      </div>
                    )}
                  </div>

                  {/* Approval note textarea */}
                  {poNeedsApproval && (
                    <div className="px-3.5 py-2 border-t border-surface-divider">
                      <label className="text-[10px] font-medium text-accent-gold block mb-1">Note to approver</label>
                      <textarea
                        value={approvalNotes[po.poNumber] || ''}
                        onChange={(e) => setApprovalNotes(prev => ({ ...prev, [po.poNumber]: e.target.value }))}
                        placeholder="Add urgency context..."
                        className="w-full text-[11px] text-text-primary bg-surface-bg border border-surface-border rounded-lg px-2.5 py-1.5 resize-none focus:border-accent-gold focus:outline-none placeholder:text-text-muted/50"
                        rows={2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Per-PO Hold/Submit toggle */}
                  <div className="px-3.5 py-2 border-t border-surface-divider flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setHeldPOs(prev => { const n = new Set(prev); if (n.has(po.poNumber)) n.delete(po.poNumber); else n.add(po.poNumber); return n; }); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${isHeld ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : 'bg-surface-hover text-text-muted border border-surface-border hover:text-text-secondary'}`}
                    >
                      {isHeld ? <><Check className="w-3 h-3" /> Held — click to include</> : <><X className="w-3 h-3" /> Hold this PO</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Action buttons */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <button
              onClick={handleBackToEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-text-secondary hover:text-text-primary border border-surface-border hover:bg-surface-hover transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit
            </button>
            <div className="flex items-center gap-2">
              {heldPOs.size > 0 && (
                <span className="text-[10px] text-text-muted">{heldPOs.size} PO{heldPOs.size !== 1 ? 's' : ''} held</span>
              )}
              <button
                onClick={handleSubmitAllPOs}
                disabled={activePOs.length === 0}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all shadow-lg text-sm flex-shrink-0 ${activePOs.length === 0 ? 'bg-surface-border cursor-not-allowed' : 'bg-accent-green hover:scale-105 active:scale-95'}`}
              >
                <ShoppingCart className="w-4 h-4" /> {submitButtonLabel} — ${Math.round(totalReviewValue).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      {/* Scope Selector */}
      <div className="rounded-xl border border-surface-border bg-surface-card px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)' }}>
            <Store className="w-3.5 h-3.5 text-accent-blue" />
          </div>
          <span className="text-[12px] font-semibold text-text-primary">Reorder Scope:</span>
          <div className="relative">
            <button
              onClick={() => setScopeOpen(!scopeOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-bg text-[12px] font-medium text-text-primary hover:bg-surface-hover transition-colors"
            >
              {scopeLabel}
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>
            {scopeOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 w-56 rounded-xl border border-surface-border bg-surface-card shadow-lg py-1">
                {[
                  { val: 'this', label: `This Store (${storeName.replace('Ascend ', '')})` },
                  { val: `state:${storeState}`, label: `All ${storeState} Stores (${ALL_STORE_INVENTORY.filter(s => s.state === storeState).length})` },
                  { val: 'all', label: `All Stores (${totalStoreCount})` },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => { setScope(opt.val); setScopeOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-[12px] hover:bg-surface-hover transition-colors ${scope === opt.val ? 'font-semibold text-accent-green' : 'text-text-primary'}`}
                  >
                    {scope === opt.val && <Check className="w-3 h-3 inline mr-1.5 text-accent-green" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {scope !== 'this' && (
            <span className="text-[10px] text-text-muted">
              Ship to: {scopeStoreCount} location{scopeStoreCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="rounded-xl border overflow-hidden bg-surface-card" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-green) 20%, var(--color-surface-border))' }}>
        <div className="px-3.5 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
            <FileText className="w-4 h-4 text-accent-green" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-text-primary">Multi-Vendor Reorder — {scope === 'this' ? storeName : scopeLabel}</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {vendorSections.length} vendors with products below reorder point
              {triggeredProduct && <> · Triggered by <span className="font-medium text-text-primary">{triggeredProduct}</span></>}
            </p>
          </div>
        </div>
      </div>

      {/* Transparency / provenance panel */}
      <TransparencyPanel
        title="How this reorder session was built"
        sources={['POS', 'METRC', 'Connect', 'Forecast']}
        timestamp={TRANSPARENCY_TIMESTAMP}
        confidence={87}
        methodology={`Products shown: All SKUs below reorder point at selected store(s)\n\u2022 Reorder Point = (Lead Time Days + Safety Buffer) \u00d7 Avg Daily Velocity\n\u2022 Grouped by vendor for PO consolidation\n\u2022 BFD offers sourced from Dutchie Connect (real-time)\n\u2022 Min Order thresholds from vendor catalog on Connect\nConfidence: High (87%) \u2014 based on 28-day velocity with <15% variance`}
      />

      {/* Vendor sections */}
      {vendorSections.map((vs, idx) => {
        const isExpanded = expanded[vs.vendor];
        const isGenerated = generatedPOs.has(vs.vendor);
        const isTriggered = idx === 0 && triggeredVendor;
        const totals = getVendorTotals(vs);
        const doh = vendorDaysOnHand[vs.vendor] || 28;

        return (
          <div key={vs.vendor} className={`rounded-xl border overflow-hidden bg-surface-card ${isTriggered ? 'border-accent-green/30' : 'border-surface-border'}`}>
            {/* Vendor header */}
            <button
              onClick={() => toggleExpand(vs.vendor)}
              className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-surface-muted transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />}
              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-text-primary">{vs.vendor}</span>
                {isTriggered && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-green/15 text-accent-green border border-accent-green/20">TRIGGERED</span>}
                <span className="text-[10px] text-text-muted">
                  {vs.needsReorder.length} needs reorder · {vs.alsoAvailable.length} available
                </span>
                <span className="text-[10px] font-semibold text-accent-gold">${Math.round(totals.subtotal).toLocaleString()} est.</span>
                {vs.bfdActive && !bfdExcluded && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-green/15 text-accent-green border border-accent-green/20">
                    {vs.bfdPct}% BFD
                  </span>
                )}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${totals.minMet ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 'bg-accent-red/10 text-accent-red border-accent-red/20'}`}>
                  Min {totals.minMet ? 'Met' : 'Not Met'} (${vs.minOrder.toLocaleString()})
                </span>
              </div>
              {isGenerated && (
                <span className="text-[10px] font-bold text-accent-green flex items-center gap-1 flex-shrink-0"><CheckCircle2 className="w-3 h-3" /> PO Sent</span>
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-surface-divider">
                {/* Days-on-Hand slider */}
                <div className="px-4 py-3 bg-surface-bg border-b border-surface-divider">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-accent-gold" />
                    <span className="text-[11px] font-semibold text-text-primary">Target Days on Hand</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)' }}>
                      {doh} days
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-text-muted font-medium w-6 text-center">7d</span>
                    <input
                      type="range"
                      min="7"
                      max="90"
                      step="1"
                      value={doh}
                      onChange={(e) => handleDaysOnHandChange(vs.vendor, parseInt(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-surface-border accent-[var(--color-accent-gold)] cursor-pointer"
                    />
                    <span className="text-[10px] text-text-muted font-medium w-8 text-center">90d</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">
                    Target: {doh} days on hand — quantities adjust automatically
                  </p>
                </div>

                {/* Needs Reorder group */}
                {vs.needsReorder.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-accent-red/5 border-b border-surface-divider">
                      <span className="text-[10px] font-bold text-accent-red uppercase tracking-wider">Needs Reorder ({vs.needsReorder.length})</span>
                    </div>
                    <div className="divide-y divide-surface-divider">
                      {vs.needsReorder.map(p => renderProductRow(vs, p, true))}
                    </div>
                  </div>
                )}

                {/* Also Available group */}
                {vs.alsoAvailable.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-surface-hover border-b border-surface-divider border-t">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Also Available from {vs.vendor} ({vs.alsoAvailable.length})</span>
                    </div>
                    <div className="divide-y divide-surface-divider">
                      {vs.alsoAvailable.map(p => renderProductRow(vs, p, false))}
                    </div>
                  </div>
                )}

                {/* Per-vendor PO summary */}
                <div className="bg-surface-bg px-4 py-3 border-t border-surface-divider">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[11px]">
                    <div>
                      <span className="text-text-muted">Items</span>
                      <p className="font-bold text-text-primary">{totals.selectedCount} selected</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Subtotal</span>
                      <p className="font-bold text-text-primary">${Math.round(totals.subtotal).toLocaleString()}</p>
                    </div>
                    {totals.bfd > 0 && (
                      <div>
                        <span className="text-text-muted">BFD Savings</span>
                        <p className="font-bold text-accent-green">-${Math.round(totals.bfd).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-text-muted">Net Total</span>
                      <p className="font-bold text-accent-gold">${Math.round(totals.net).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Est. Margin</span>
                      <p className="font-bold text-accent-green">{totals.margin.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Minimum order progress bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-text-muted">Minimum order: ${vs.minOrder.toLocaleString()}</span>
                      <span className={`font-semibold ${totals.minMet ? 'text-accent-green' : 'text-accent-red'}`}>
                        {totals.minMet ? 'Met' : `${Math.round(totals.minProgress)}%`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${totals.minProgress}%`,
                          background: totals.minMet ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                        }}
                      />
                    </div>
                  </div>

                  {vs.bfdActive && bfdExcluded && (
                    <p className="text-[10px] text-text-muted mt-2 italic">(BFDs not available in {storeState})</p>
                  )}

                  {scope !== 'this' && (
                    <p className="text-[10px] text-text-muted mt-2 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Ship to: {scopeStoreCount} locations · Est. delivery: {vs.leadTime}
                    </p>
                  )}

                  {/* Per-vendor Generate PO button */}
                  <div className="mt-3">
                    {isGenerated ? (
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-accent-green">
                        <CheckCircle2 className="w-4 h-4" /> PO sent to {vs.vendor}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleGeneratePO(vs.vendor)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Generate PO — ${Math.round(totals.net).toLocaleString()}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Session total */}
      <div className="rounded-xl border border-surface-border bg-surface-card px-3.5 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-[12px] text-text-secondary">
            <span className="text-text-primary font-semibold">{sessionTotals.totalPOs} vendor POs</span>,{' '}
            <span className="text-accent-gold font-semibold">${Math.round(sessionTotals.totalValue).toLocaleString()} total</span>
            {sessionTotals.totalBFD > 0 && <>, <span className="text-accent-green font-semibold">${Math.round(sessionTotals.totalBFD).toLocaleString()} in BFD savings</span></>}
          </div>
          {scope !== 'this' && (
            <span className="text-[10px] text-text-muted">
              Shipping to {scopeStoreCount} locations
            </span>
          )}
        </div>
      </div>

      {/* Generate All POs button */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-3.5">
        {allGenerated ? (
          <div className="animate-fade-in flex items-center gap-3 justify-center py-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
              <CheckCircle2 className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">All POs Submitted</p>
              <p className="text-sm text-text-secondary">{sessionTotals.totalPOs} vendor POs totaling ${Math.round(sessionTotals.totalValue).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' }}>
                <ShoppingCart className="w-4 h-4 text-accent-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Generate All POs — {sessionTotals.totalPOs} vendors</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Creates one PO per vendor. Total: ${Math.round(sessionTotals.totalValue).toLocaleString()}
                  {sessionTotals.totalBFD > 0 && <span className="text-accent-green font-medium"> (saving ${Math.round(sessionTotals.totalBFD).toLocaleString()} with BFDs)</span>}
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateAll}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-accent-green transition-all hover:scale-105 active:scale-95 shadow-lg text-sm flex-shrink-0"
            >
              <ShoppingCart className="w-4 h-4" /> Generate All POs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONNECT INBOX VIEW
   ═══════════════════════════════════════════════════════════════════ */

export function ConnectInboxView({ onBack }) {
  const navigate = useNavigate();
  const [expandedPO, setExpandedPO] = useState(null);
  const [poActions, setPoActions] = useState({});
  const [bfdActions, setBfdActions] = useState({});
  const [bfdConfirming, setBfdConfirming] = useState(null);

  const pendingPOs = [
    {
      id: 'PO-KGP5GPE', brand: 'Jeeter', store: 'Ascend Logan Square', state: 'IL',
      license: 'D-IL-2024-0847', status: 'needs_attention', expectedArrival: 'Apr 5-7',
      changeNote: 'Jeeter confirmed 6 of 8 items. 2 items zeroed out (distributor out of stock).',
      items: [
        { product: 'Jeeter Infused PR 1g', requestedQty: 56, confirmedQty: 56, status: 'confirmed', unitCost: 12, total: 672 },
        { product: 'Jeeter Liquid Diamonds 0.5g', requestedQty: 28, confirmedQty: 28, status: 'confirmed', unitCost: 18, total: 504 },
        { product: 'Jeeter Live Resin Cart 1g', requestedQty: 40, confirmedQty: 40, status: 'confirmed', unitCost: 22, total: 880 },
        { product: 'Jeeter Baby PR Churros 5pk', requestedQty: 20, confirmedQty: 20, status: 'confirmed', unitCost: 28, total: 560 },
        { product: 'Jeeter Juice LR Blue Zkittlez', requestedQty: 24, confirmedQty: 24, status: 'confirmed', unitCost: 20, total: 480 },
        { product: 'Jeeter Diamond PR 1g', requestedQty: 16, confirmedQty: 16, status: 'confirmed', unitCost: 25, total: 400 },
        { product: 'Jeeter Infused PR Honeydew', requestedQty: 30, confirmedQty: 0, status: 'zeroed', unitCost: 12, total: 0, reason: 'Out of stock at distributor' },
        { product: 'Jeeter XL PR 2g Churros', requestedQty: 12, confirmedQty: 0, status: 'zeroed', unitCost: 18, total: 0, reason: 'Discontinued by manufacturer' },
      ],
      subtotal: 3496, confirmedTotal: 3496,
    },
    {
      id: 'PO-QR47PLT', brand: 'Kiva Confections', store: 'Ascend Morenci', state: 'MI',
      license: 'D-MI-2024-1203', status: 'needs_attention', expectedArrival: 'Apr 3',
      changeNote: 'Kiva substituted Terra Bites for Lost Farm Gummies (out of stock at processor).',
      items: [
        { product: 'Kiva Camino Pineapple Habanero', requestedQty: 24, confirmedQty: 24, status: 'confirmed', unitCost: 14, total: 336 },
        { product: 'Kiva Camino Midnight Blueberry', requestedQty: 18, confirmedQty: 18, status: 'confirmed', unitCost: 14, total: 252 },
        { product: 'Kiva Lost Farm Gummies', requestedQty: 20, confirmedQty: 0, status: 'substituted', unitCost: 16, total: 0, substitutedWith: 'Kiva Terra Bites Dark Chocolate', subQty: 20, subCost: 15, subTotal: 300 },
      ],
      subtotal: 908, confirmedTotal: 888,
    },
  ];

  const bfdOffers = [
    { id: 'BFD-001', brand: 'Jeeter', type: '20% off', products: 'All Jeeter Live Resin carts', locations: 5, fundingLimit: 5000, startDate: 'Apr 1', endDate: 'Apr 30', estMonthlySavings: 840, marginImpact: '+8pp on LR carts (42% → 50%)' },
    { id: 'BFD-002', brand: 'Wyld', type: '$3 off', products: 'Wyld CBD Gummies 500mg', locations: 12, fundingLimit: 8000, startDate: 'Apr 7', endDate: 'May 7', estMonthlySavings: 1200, marginImpact: '+6pp on CBD Gummies (38% → 44%)' },
  ];

  const statusBadge = (status) => {
    const map = {
      confirmed: { label: 'Confirmed', bg: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)' },
      zeroed: { label: 'Zeroed', bg: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)', color: 'var(--color-accent-red)' },
      substituted: { label: 'Substituted', bg: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)' },
    };
    const s = map[status] || map.confirmed;
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      {/* Header */}
      <div className="relative rounded-xl border overflow-hidden bg-surface-card" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-blue) 25%, transparent)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent-blue) 10%, transparent), color-mix(in srgb, var(--color-accent-purple) 5%, transparent))' }} />
        <div className="relative px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-blue) 20%, transparent)' }}>
              <Inbox className="w-4 h-4 text-accent-blue" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary">Connect Inbox</h1>
              <p className="text-xs text-text-secondary mt-0.5">Review inbound purchase orders and brand discount offers from Dutchie Connect</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transparency / provenance panel */}
      <TransparencyPanel
        title="How inbox items are sourced"
        sources={['Connect', 'METRC']}
        timestamp={TRANSPARENCY_TIMESTAMP}
        methodology={`Purchase Orders: Inbound PO confirmations and change notices from vendors via Dutchie Connect\n\u2022 Item status (confirmed/zeroed/substituted) provided by vendor in real-time\n\u2022 License numbers validated against METRC active license registry\nBrand-Funded Discounts: Promotional offers from brand partners via Connect\n\u2022 Margin impact calculated from current retail price vs. discounted wholesale cost\n\u2022 Monthly savings estimated from 28-day trailing POS unit volume`}
      />

      {/* Purchase Orders Needing Review */}
      <Section title="Purchase Orders Needing Review" icon={Package} iconColor="var(--color-accent-gold)" badge={`${pendingPOs.length} POs`}>
        <div className="space-y-3">
          {pendingPOs.map((po) => {
            const isExpanded = expandedPO === po.id;
            const action = poActions[po.id];

            if (action === 'accepted') {
              return (
                <div key={po.id} className="rounded-xl border border-surface-border bg-surface-bg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent-green" />
                    <span className="text-sm font-medium text-text-primary">{po.id}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)' }}>
                      Accepted
                    </span>
                    <span className="text-xs text-text-secondary ml-auto">{po.brand} &middot; {po.store}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Changes accepted. PO confirmed for delivery {po.expectedArrival}.</p>
                </div>
              );
            }
            if (action === 'counter') {
              return (
                <div key={po.id} className="rounded-xl border bg-surface-bg p-3" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-gold) 25%, transparent)' }}>
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-accent-gold" />
                    <span className="text-sm font-medium text-text-primary">{po.id}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)' }}>Counter-Proposal Sent</span>
                    <span className="text-xs text-text-secondary ml-auto">{po.brand} &middot; {po.store}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Your counter-proposal has been sent to {po.brand}. They will review and respond.</p>
                </div>
              );
            }
            if (action === 'rejected') {
              return (
                <div key={po.id} className="rounded-xl border bg-surface-bg p-3 opacity-60" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-red) 25%, transparent)' }}>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-accent-red" />
                    <span className="text-sm font-medium text-text-primary">{po.id}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)', color: 'var(--color-accent-red)' }}>Rejected</span>
                    <span className="text-xs text-text-secondary ml-auto">{po.brand} &middot; {po.store}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">PO rejected. {po.brand} has been notified.</p>
                </div>
              );
            }

            return (
              <div key={po.id} className="rounded-xl border border-surface-border bg-surface-bg overflow-hidden">
                {/* PO Header */}
                <button
                  onClick={() => setExpandedPO(isExpanded ? null : po.id)}
                  className="w-full text-left px-3.5 py-3 hover:bg-surface-hover/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">{po.id}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)' }}>
                          Needs Attention
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="font-medium">{po.brand}</span>
                        <span>&middot;</span>
                        <span>{po.store}, {po.state}</span>
                        <span>&middot;</span>
                        <span className="text-text-muted">{po.license}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        <AlertTriangle className="w-3 h-3 inline mr-1" style={{ color: 'var(--color-accent-gold)' }} />
                        {po.changeNote}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <div className="text-right">
                        <p className="text-xs text-text-muted">ETA</p>
                        <p className="text-xs font-medium text-text-primary">{po.expectedArrival}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </div>
                  </div>
                </button>

                {/* Expanded: Line Items Table */}
                {isExpanded && (
                  <div className="border-t border-surface-divider px-3.5 py-3 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-text-muted border-b border-surface-divider">
                            <th className="text-left pb-2 font-medium">Product</th>
                            <th className="text-right pb-2 font-medium">Requested</th>
                            <th className="text-right pb-2 font-medium">Confirmed</th>
                            <th className="text-center pb-2 font-medium">Status</th>
                            <th className="text-right pb-2 font-medium">Unit Cost</th>
                            <th className="text-right pb-2 font-medium">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {po.items.map((item, idx) => (
                            <React.Fragment key={idx}>
                              <tr className={`border-b border-surface-divider/50 ${item.status === 'zeroed' ? 'opacity-60' : ''}`}>
                                <td className="py-2 pr-3 text-text-primary font-medium">{item.product}</td>
                                <td className="py-2 text-right text-text-secondary">{item.requestedQty}</td>
                                <td className="py-2 text-right text-text-primary font-medium">{item.confirmedQty}</td>
                                <td className="py-2 text-center">{statusBadge(item.status)}</td>
                                <td className="py-2 text-right text-text-secondary">${item.unitCost}</td>
                                <td className="py-2 text-right text-text-primary font-medium">{item.total > 0 ? `$${item.total.toLocaleString()}` : '—'}</td>
                              </tr>
                              {item.status === 'zeroed' && item.reason && (
                                <tr>
                                  <td colSpan={6} className="pb-2 pt-0.5 pl-2">
                                    <p className="text-[10px] text-text-muted">{item.reason}</p>
                                    <p className="text-[10px] italic mt-0.5" style={{ color: 'var(--color-accent-blue)' }}>
                                      <Sparkles className="w-3 h-3 inline mr-0.5" />
                                      This product stocks out in ~4 days. Alternative suppliers available on Connect.
                                    </p>
                                  </td>
                                </tr>
                              )}
                              {item.status === 'substituted' && (
                                <tr>
                                  <td colSpan={6} className="pb-2 pt-0.5 pl-2">
                                    <div className="flex items-center gap-2 text-[10px]">
                                      <span className="text-text-muted line-through">{item.product} (${item.unitCost} x {item.requestedQty})</span>
                                      <ArrowRight className="w-3 h-3 text-accent-gold" />
                                      <span className="font-medium text-text-primary">{item.substitutedWith} (${item.subCost} x {item.subQty} = ${item.subTotal})</span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-surface-border">
                            <td colSpan={5} className="py-2 text-right font-semibold text-text-secondary">Confirmed Total</td>
                            <td className="py-2 text-right font-bold text-text-primary">${po.confirmedTotal.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setPoActions(prev => ({ ...prev, [po.id]: 'accepted' }))}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-colors"
                        style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)', border: '1px solid color-mix(in srgb, var(--color-accent-green) 25%, transparent)' }}
                      >
                        <Check className="w-3.5 h-3.5" /> Accept Changes
                      </button>
                      <button
                        onClick={() => setPoActions(prev => ({ ...prev, [po.id]: 'counter' }))}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-colors"
                        style={{ background: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', color: 'var(--color-accent-gold)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 25%, transparent)' }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Counter-Propose
                      </button>
                      <button
                        onClick={() => setPoActions(prev => ({ ...prev, [po.id]: 'rejected' }))}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-colors"
                        style={{ color: 'var(--color-accent-red)', border: '1px solid color-mix(in srgb, var(--color-accent-red) 25%, transparent)' }}
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Brand Funded Discount Offers */}
      <Section title="Brand Funded Discount Offers" icon={Tag} iconColor="var(--color-accent-blue)" badge={`${bfdOffers.length} offers`}>
        <div className="space-y-3">
          {bfdOffers.map((offer) => {
            const action = bfdActions[offer.id];

            if (action === 'accepted') {
              return (
                <div key={offer.id} className="rounded-xl border bg-surface-bg p-3 space-y-2" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-green) 30%, transparent)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent-green" />
                    <span className="text-sm font-medium text-text-primary">{offer.brand} — {offer.type}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)' }}>
                      Active — auto-applying at POS
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{offer.products} &middot; {offer.locations} locations &middot; {offer.startDate} – {offer.endDate}</p>
                  <div className="rounded-lg p-2.5" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-blue) 15%, transparent)' }}>
                    <p className="text-[11px] text-text-secondary mb-2">This discount is now live at POS. Want to drive traffic to these products?</p>
                    <button
                      onClick={() => navigate('/agents/marketing', { state: { action: 'bfd-campaign', brand: offer.brand, discount: offer.type, products: offer.products, locations: offer.locations, endDate: offer.endDate, fundingLimit: offer.fundingLimit } })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                      style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)', color: 'var(--color-accent-blue)', border: '1px solid color-mix(in srgb, var(--color-accent-blue) 25%, transparent)' }}
                    >
                      <Megaphone className="w-3.5 h-3.5" /> Create Campaign for This Deal
                    </button>
                  </div>
                </div>
              );
            }
            if (action === 'declined') {
              return (
                <div key={offer.id} className="rounded-xl border bg-surface-bg p-3 opacity-50" style={{ borderColor: 'color-mix(in srgb, var(--color-accent-red) 20%, transparent)' }}>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-accent-red" />
                    <span className="text-sm font-medium text-text-muted line-through">{offer.brand} — {offer.type}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)', color: 'var(--color-accent-red)' }}>Declined</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={offer.id} className="rounded-xl border border-surface-border bg-surface-bg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{offer.brand}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)', color: 'var(--color-accent-blue)' }}>
                        {offer.type}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{offer.products}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-text-muted">Funding Cap</p>
                    <p className="text-sm font-bold text-text-primary">${offer.fundingLimit.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-card rounded-lg p-2 border border-surface-border">
                    <p className="text-[10px] text-text-muted">Locations</p>
                    <p className="text-xs font-semibold text-text-primary">{offer.locations} stores</p>
                  </div>
                  <div className="bg-surface-card rounded-lg p-2 border border-surface-border">
                    <p className="text-[10px] text-text-muted">Period</p>
                    <p className="text-xs font-semibold text-text-primary">{offer.startDate} – {offer.endDate}</p>
                  </div>
                  <div className="bg-surface-card rounded-lg p-2 border border-surface-border">
                    <p className="text-[10px] text-text-muted">Est. Savings</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--color-accent-green)' }}>${offer.estMonthlySavings.toLocaleString()}/mo</p>
                  </div>
                </div>

                {/* Agent insight */}
                <div className="flex items-start gap-2 bg-surface-card rounded-lg p-2 border border-surface-border">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent-blue)' }} />
                  <p className="text-[10px] text-text-secondary">
                    <span className="font-semibold text-text-primary">Agent insight:</span> Est. <span className="font-semibold" style={{ color: 'var(--color-accent-green)' }}>${offer.estMonthlySavings.toLocaleString()}/mo</span> savings &middot; {offer.marginImpact}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setBfdConfirming(bfdConfirming === offer.id ? null : offer.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-colors"
                    style={{ background: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', color: 'var(--color-accent-green)', border: '1px solid color-mix(in srgb, var(--color-accent-green) 25%, transparent)' }}
                  >
                    <Check className="w-3.5 h-3.5" /> {bfdConfirming === offer.id ? 'Cancel' : 'Accept'}
                  </button>
                  <button
                    onClick={() => setBfdActions(prev => ({ ...prev, [offer.id]: 'declined' }))}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-colors"
                    style={{ color: 'var(--color-accent-red)', border: '1px solid color-mix(in srgb, var(--color-accent-red) 25%, transparent)' }}
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>

                {/* BFD Confirmation Panel */}
                {bfdConfirming === offer.id && (
                  <div className="rounded-xl p-3 space-y-2 animate-fade-in" style={{ background: 'color-mix(in srgb, var(--color-accent-green) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-green) 15%, transparent)' }}>
                    <p className="text-xs font-semibold text-text-primary">Confirm BFD Acceptance</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div><span className="text-text-muted">Brand:</span> <span className="font-medium text-text-primary">{offer.brand}</span></div>
                      <div><span className="text-text-muted">Discount:</span> <span className="font-medium text-text-primary">{offer.type}</span></div>
                      <div><span className="text-text-muted">Funding Cap:</span> <span className="font-medium text-text-primary">${offer.fundingLimit.toLocaleString()}</span></div>
                      <div><span className="text-text-muted">Period:</span> <span className="font-medium text-text-primary">{offer.startDate} – {offer.endDate}</span></div>
                    </div>
                    <div className="space-y-1 text-[10px] text-text-secondary">
                      <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-accent-green" /> Discount auto-applies at POS, ecommerce, kiosk, and delivery</div>
                      <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-accent-green" /> Brand funds the discount — no cost to you</div>
                      <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-accent-green" /> Customers see the discount on your menu immediately</div>
                      <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-accent-green" /> Auto-shutoff when ${offer.fundingLimit.toLocaleString()} funding cap reached</div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => { setBfdActions(prev => ({ ...prev, [offer.id]: 'accepted' })); setBfdConfirming(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-accent-green text-white hover:brightness-110 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept & Go Live
                      </button>
                      <button
                        onClick={() => {
                          setBfdActions(prev => ({ ...prev, [offer.id]: 'accepted' }));
                          setBfdConfirming(null);
                          navigate('/agents/marketing', { state: { action: 'bfd-campaign', brand: offer.brand, discount: offer.type, products: offer.products, locations: offer.locations, endDate: offer.endDate, fundingLimit: offer.fundingLimit } });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                        style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)', color: 'var(--color-accent-blue)', border: '1px solid color-mix(in srgb, var(--color-accent-blue) 25%, transparent)' }}
                      >
                        <Megaphone className="w-3.5 h-3.5" /> Accept & Create Campaign
                      </button>
                    </div>
                  </div>
                )}
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
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-bg)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 20%, transparent)' }}>
        <NexusIcon size={16} />
      </div>
      <div className="bg-surface-card/80 border border-surface-border/60 rounded-2xl rounded-tl-sm px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent-green/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent-green/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="text-[10px] text-text-muted ml-1 font-medium">Analyzing...</span>
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
    accentVar: '--color-accent-red',
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
    accentVar: '--color-accent-blue',
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
    accentVar: '--color-accent-green',
    tag: 'Optimization',
    tagColor: 'var(--color-accent-green)',
    confidence: 'high',
  },
  {
    key: 'margin-analysis',
    label: 'Vendor Cost Analysis',
    prompt: 'Perform a deep-dive margin analysis across all product categories and brands, identifying the highest and lowest margin items and opportunities to improve profitability',
    description: 'Analyze vendor costs, COGS margins, and negotiation leverage on buy-side pricing — find profit opportunities and underperformers',
    icon: CircleDollarSign,
    accentVar: '--color-accent-green',
    tag: 'Profitability',
    tagColor: 'var(--color-accent-green)',
  },
  {
    key: 'vendor-comparison',
    label: 'Vendor Comparison',
    prompt: 'Compare our current suppliers on pricing, lead times, reliability, and minimum order quantities, and recommend which vendors to consolidate or negotiate with',
    description: 'Compare suppliers on pricing, lead times, reliability, and negotiation leverage',
    icon: Building2,
    accentVar: '--color-accent-purple',
    tag: 'Suppliers',
    tagColor: 'var(--color-accent-purple)',
  },
  {
    key: 'seasonal-forecast',
    label: 'Seasonal Forecast',
    prompt: 'Generate a seasonal inventory forecast for the next 3 months including 4/20 holiday planning, summer trends, and recommended stock-up quantities by category',
    description: 'Plan ahead for 4/20, summer trends, and seasonal demand shifts with stock-up recommendations',
    icon: Calendar,
    accentVar: '--color-accent-gold',
    tag: 'Planning',
    tagColor: 'var(--color-accent-gold)',
  },
  {
    key: 'connect-inbox',
    label: 'Connect Inbox',
    description: 'Review inbound POs and brand discount offers',
    icon: Inbox,
    tag: 'Connect',
    tagColor: 'var(--color-accent-blue)',
    accentVar: 'var(--color-accent-blue)',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function ConnectAgent() {
  const location = useLocation();
  const { startThinking, stopThinking } = useNexusState();
  const [view, setView] = useState('idle');
  const [activeView, setActiveView] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const [navStateHandled, setNavStateHandled] = useState(false);

  // Sync NexusIcon thinking state with view
  useEffect(() => {
    if (view === 'typing') startThinking();
    else stopThinking();
    return () => stopThinking();
  }, [view, startThinking, stopThinking]);

  // Auto-trigger views when navigated from Inventory page with state
  useEffect(() => {
    if (navStateHandled) return;
    const ns = location.state;
    if (!ns) return;

    // --- Review PO action: show ConnectInboxView ---
    if (ns.action === 'review-po') {
      setNavStateHandled(true);
      setActiveView('connect-inbox');
      setMessages([{ role: 'user', text: 'Review inbound purchase orders' }]);
      setView('typing');
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'agent', text: 'Here are your pending purchase orders and brand discount offers from Connect.' }]);
        setView('result');
      }, 800);
      return;
    }

    if (!ns.product || !ns.store) return;
    setNavStateHandled(true);

    // --- Transfer action: show TransferWorksheetView ---
    if (ns.action === 'transfer') {
      const storeData = ALL_STORE_INVENTORY.find(s => s.name === ns.store);
      const storeState = storeData ? storeData.state : 'IL';
      const transferData = {
        store: ns.store,
        storeState,
        triggeredProduct: { name: ns.product, brand: ns.brand },
      };
      const contextMsg = `Transfer ${ns.product} (${ns.brand}) from vault to floor at ${ns.store}`;
      setMessages([{ role: 'user', text: contextMsg }]);
      setView('typing');
      setActiveView('transfer');
      setAiAnalysis(transferData);
      setTimeout(() => {
        const productData = storeData?.products?.find(p => p.name === ns.product);
        const vaultQty = productData ? productData.vault : 0;
        const otherNeeding = storeData ? storeData.products.filter(p => {
          const par = Math.ceil((p.avgWeekly || 10) / 7 * 7);
          return p.floor < par && p.vault > 0 && p.name !== ns.product;
        }).length : 0;
        let msg = `I've prepared a floor restock transfer for **${ns.product}** at **${ns.store}**.`;
        if (vaultQty > 0) msg += ` There are **${vaultQty} units in vault** ready to move.`;
        if (otherNeeding > 0) msg += ` I also found **${otherNeeding} other product${otherNeeding > 1 ? 's' : ''}** that need restocking — top 5 are pre-selected.`;
        setMessages(prev => [...prev, { role: 'agent', text: msg }]);
        setView('result');
      }, 1200);
      return;
    }

    // --- Reorder action: show MultiVendorReorderView ---
    if (ns.action === 'reorder') {
      const storeData = ALL_STORE_INVENTORY.find(s => s.name === ns.store);
      const storeState = storeData ? storeData.state : 'IL';
      const reorderData = {
        store: ns.store,
        storeState,
        product: ns.product,
        vendor: ns.vendor || ns.brand,
      };
      const contextMsg = `Draft multi-vendor reorder PO for ${ns.product} (${ns.brand}) at ${ns.store}`;
      setMessages([{ role: 'user', text: contextMsg }]);
      setView('typing');
      setActiveView('multi-vendor-reorder');
      setAiAnalysis(reorderData);
      setTimeout(() => {
        // Count vendors with products below reorder
        const vendorCount = storeData ? new Set(
          storeData.products.filter(p => p.daysSupply < 7 || p.status !== 'ok').map(p => p.brand)
        ).size : 0;
        let msg = `I've prepared a multi-vendor reorder session for **${ns.store}**, triggered by **${ns.product}** (${ns.brand}).`;
        if (vendorCount > 1) msg += ` Found **${vendorCount} vendors** with products below reorder point. The triggered vendor is expanded at top.`;
        msg += ` Review quantities per vendor and generate POs individually or all at once.`;
        setMessages(prev => [...prev, { role: 'agent', text: msg }]);
        setView('result');
      }, 1200);
      return;
    }

    // --- Default (legacy): focused single-product reorder ---
    {
      const houseBrands = ['Ozone', 'Ozone Reserve', 'Simply Herb', 'Common Goods', 'Tunnel Vision'];
      const isHouse = houseBrands.includes(ns.brand);
      const suggestedQty = (ns.avgWeekly || 10) * 4;
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
        note: ns.floor === 0 ? `Out of stock · ${ns.vault || 0} in vault (Move Inventory)` : `${ns.floor} on floor · ${ns.vault || 0} in vault`,
      };

      const sameBrandRecs = (ns.sameBrandItems || []).map(item => ({
        brand: item.brand,
        product: `${item.name} — ${item.storeName}`,
        qty: (item.avgWeekly || 10) * 4,
        reason: item.status === 'oos'
          ? `Out of stock at ${item.storeName} · ${item.avgWeekly}/wk avg sales`
          : `${item.status === 'critical' ? 'Critical' : 'Low'} stock at ${item.storeName} · ${(item.daysSupply / 7)?.toFixed(1)}wk on hand`,
        unitPrice: (item.price || 0) * 0.55,
        avgWeeklySales: item.avgWeekly || 10,
      }));

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
          text: `I've prepared a focused reorder PO for **${ns.product}** (${ns.brand}) at **${ns.store}**. Suggested quantity: **${suggestedQty} units** (28 days on hand based on ${ns.avgWeekly || '~10'}/wk avg sales).${extraMsg} Adjust the Target Days on Hand below to dial in quantities, then generate the PO.`
        }]);
        setView('result');
      }, 1500);
    }
  }, [location.state, navStateHandled]);

  const handleSuggestionClick = async (key) => {
    const suggestion = SUGGESTIONS.find((s) => s.key === key);
    setMessages((prev) => [...prev, { role: 'user', text: suggestion.label }]);

    // Immediately show preset/fallback view with static data (no waiting for AI)
    const presetMap = {
      'reorder-oos': 'reorder', 'explore-new': 'explore', 'purchasing-recs': 'recommendations',
      'margin-analysis': 'recommendations', 'vendor-comparison': 'recommendations', 'seasonal-forecast': 'recommendations',
      'connect-inbox': 'connect-inbox',
    };
    const presetKey = presetMap[key] || 'recommendations';
    const responseTexts = {
      reorder: `I've scanned your inventory and found **5 items** that need immediate attention. Here's a detailed breakdown with recommended order quantities:`,
      explore: `I've analyzed NYC market trends and your catalog to curate **${NEW_PRODUCTS.length} recommended products** from top brands. Here's what I found:`,
      recommendations: `I've completed a 90-day inventory analysis for Ascend. Here are **5 actionable recommendations** to optimize your purchasing:`,
      'connect-inbox': `Here are your pending purchase orders and brand discount offers from Connect.`,
    };

    // Show fallback view immediately
    setActiveView(presetKey);
    setAiAnalysis(null);
    setView('typing');

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'agent', text: responseTexts[presetKey] }]);
      setView('result');
    }, 800);

    // Then try to enhance with AI in the background
    if (isGeminiAvailable()) {
      try {
        const analysis = await generateConnectAnalysis(suggestion.prompt);
        if (analysis && analysis.title) {
          const wf = analysis.workflowType || 'recommendations';
          setActiveView(wf);
          setAiAnalysis(analysis);
          setMessages((prev) => {
            // Replace the last agent message with enhanced one
            const updated = [...prev];
            const lastAgentIdx = updated.map(m => m.role).lastIndexOf('agent');
            if (lastAgentIdx >= 0) {
              updated[lastAgentIdx] = {
                role: 'agent',
                text: `I've completed a **${analysis.title}** analysis based on your inventory data. Here's a detailed breakdown with actionable recommendations:`
              };
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('[ConnectAgent] AI enhancement failed:', err);
        // Fallback view is already showing — no action needed
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setView('typing');

    // Show fallback view immediately based on keyword matching
    const lower = text.toLowerCase();
    let matchKey = null;
    if (lower.includes('reorder') || lower.includes('out of stock') || lower.includes('restock') || lower.includes('low stock') || lower.includes('stockout') || lower.includes('replenish') || lower.includes('running low')) matchKey = 'reorder';
    else if (lower.includes('new product') || lower.includes('explore') || lower.includes('discover') || lower.includes('trending') || lower.includes('catalog') || lower.includes('add to menu') || lower.includes('new brand') || lower.includes('what should we stock')) matchKey = 'explore';
    else if (lower.includes('recommend') || lower.includes('optimiz') || lower.includes('margin') || lower.includes('dead stock') || lower.includes('purchas') || lower.includes('vendor') || lower.includes('supplier') || lower.includes('forecast') || lower.includes('seasonal') || lower.includes('comparison') || lower.includes('negotiate') || lower.includes('inventory') || lower.includes('order')) matchKey = 'recommendations';
    matchKey = matchKey || 'recommendations';

    setActiveView(matchKey);
    setAiAnalysis(null);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'agent', text: `Let me pull that together for you. Here's what I found:` }]);
      setView('result');
    }, 800);

    // Then try to enhance with AI in the background
    if (isGeminiAvailable()) {
      try {
        const analysis = await generateConnectAnalysis(text);
        if (analysis && analysis.title) {
          const wf = analysis.workflowType || 'recommendations';
          setActiveView(wf);
          setAiAnalysis(analysis);
          setMessages((prev) => {
            const updated = [...prev];
            const lastAgentIdx = updated.map(m => m.role).lastIndexOf('agent');
            if (lastAgentIdx >= 0) {
              updated[lastAgentIdx] = {
                role: 'agent',
                text: `I've completed an analysis for your request. Here's a detailed breakdown with actionable recommendations:`
              };
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('[ConnectAgent] AI enhancement failed:', err);
      }
    }
  };

  const handleBack = () => { setView('idle'); setActiveView(null); setAiAnalysis(null); };

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col flex-1 min-h-0 animate-fade-in">
      {/* header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center">
          <ShoppingCart className="w-4 h-4 text-accent-green" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Inventory Agent</h1>
          <p className="text-xs text-text-secondary">Purchasing & Inventory — Dutchie AI</p>
        </div>
      </div>

      {/* chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {/* centered landing state */}
        {messages.length === 0 && view === 'idle' && (
          <div className="flex flex-col items-center justify-center py-6 lg:py-12" style={{ minHeight: 200 }}>
            <div className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center mb-4" style={{ background: 'var(--color-surface-bg)', boxShadow: '0 0 24px color-mix(in srgb, var(--color-accent-gold) 15%, transparent), 0 0 8px color-mix(in srgb, var(--color-accent-gold) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 20%, transparent)' }}>
              <NexusIcon size={30} />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-1.5 text-center">Inventory Agent</h2>
            <p className="text-[13px] text-text-secondary text-center max-w-[400px] leading-relaxed">
              Restock, discover products, and optimize purchasing across all your stores.
            </p>
          </div>
        )}

        {/* messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'agent' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-bg)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 20%, transparent)' }}>
                <NexusIcon size={16} />
              </div>
            )}
            <div className={`rounded-2xl px-5 py-3 max-w-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-accent-gold/15 border border-accent-gold/20 text-text-primary rounded-tr-sm'
                : 'bg-surface-card/80 border border-surface-border/60 text-text-primary rounded-tl-sm'
            }`}>
              {msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong> : part)}
            </div>
          </div>
        ))}

        {view === 'typing' && <TypingIndicator />}

        {view === 'result' && activeView && (
          <div className="max-w-[780px] mx-auto rounded-xl border border-surface-border bg-surface-card overflow-hidden overflow-x-auto">
            <div className="p-1">
              {activeView === 'reorder' && <ReorderView data={aiAnalysis} onBack={handleBack} />}
              {activeView === 'explore' && <ExploreView data={aiAnalysis} onBack={handleBack} />}
              {activeView === 'recommendations' && <RecommendationsView data={aiAnalysis} onBack={handleBack} />}
              {activeView === 'transfer' && <TransferWorksheetView data={aiAnalysis} onBack={handleBack} />}
              {activeView === 'multi-vendor-reorder' && <MultiVendorReorderView data={aiAnalysis} onBack={handleBack} />}
              {activeView === 'connect-inbox' && <ConnectInboxView onBack={handleBack} />}
            </div>
          </div>
        )}

        {/* suggestion tiles */}
        {view === 'idle' && messages.length === 0 && (
          <div className="pt-2 animate-fade-in">
            <p className="text-xs text-text-secondary mb-3 ml-11">Try one of these scenarios</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <TiltCard key={s.key}>
                  <button
                    onClick={() => handleSuggestionClick(s.key)}
                    className="group text-left w-full bg-surface-card border border-surface-border rounded-xl p-4 transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, var(${s.accentVar}) 12%, transparent)` }}>
                        <s.icon className="w-4 h-4 text-text-primary" />
                      </div>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-surface-border" style={{ color: s.tagColor }}>{s.tag}</span>
                    </div>
                    <p className="text-sm font-medium text-text-primary">{s.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{s.description}</p>
                  </button>
                </TiltCard>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* input bar */}
      <form onSubmit={handleSubmit} className="sticky bottom-0 pb-16 lg:pb-2">
        <div className="nexus-input-glass flex items-center gap-3 bg-surface-card border border-surface-border rounded-2xl px-5 py-3.5 shadow-card focus-within:border-accent-green/50 transition-all duration-200">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about inventory, products, or purchasing..."
            className="flex-1 bg-transparent text-base lg:text-sm text-text-primary placeholder-text-muted outline-none"
            disabled={view === 'typing'}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || view === 'typing'}
            className="w-9 h-9 rounded-xl bg-accent-green flex items-center justify-center text-white disabled:opacity-30 hover:brightness-110 transition-all disabled:hover:bg-accent-green shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
