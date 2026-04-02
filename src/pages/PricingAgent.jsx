import NexusIcon from '../components/NexusIcon';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNexusState } from '../contexts/NexusStateContext';
import { TiltCard } from '../components/common/TiltCard';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, ZAxis, Cell
} from 'recharts';
import {
  Bot, Sparkles, Send, ArrowLeft, ChevronRight, Zap, TrendingUp,
  DollarSign, BarChart3, Scale, CircleDollarSign, Percent,
  Calculator, ArrowUpDown, Check, X, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Star, Package, Tag, Megaphone,
  ShoppingBag, Store, MapPin, Eye, Award, Target, Info,
  ArrowRight, TrendingDown, Shield, Clock, Layers, Plus
} from 'lucide-react';
import { generatePricingResponse, generatePricingAnalysis, generateMarketingCampaignPlan, isGeminiAvailable } from '../utils/gemini';
import ConfirmationDrawer from '../components/common/ConfirmationDrawer';
import { useActionLog } from '../contexts/ActionLogContext';
import { CampaignPlan } from './MarketingCampaigns';
import { useStores } from '../contexts/StoreContext';
import { locations } from '../data/mockData';

// Per-store revenue weights (mirrors NexusHome's STORE_METRICS generation)
function _seedRng(seed) {
  let s = seed | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const STORE_WEIGHTS = locations.map((loc, i) => {
  const rng = _seedRng(i * 7919 + 31);
  const isOutlet = loc.name.includes('Outlet');
  return { name: loc.name, weight: isOutlet ? 600 + rng() * 600 : 800 + rng() * 1200 };
});
const TOTAL_WEIGHT = STORE_WEIGHTS.reduce((sum, s) => sum + s.weight, 0);

/* ═══════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════ */

const PRICING_PRODUCTS = [
  { id: 'pp-1', brand: 'Jeeter', name: 'Baby Jeeter Churros', category: 'Pre-Rolls', grossPrice: 35, cost: 18, netPerUnit: 17, margin: 48.6, marketAvg: 33, marketLow: 30, marketHigh: 38, weeklyUnits: 62, brandColor: '#7B2D8E' },
  { id: 'pp-2', brand: 'STIIIZY', name: 'OG Kush Pod 1g', category: 'Vapes', grossPrice: 45, cost: 24, netPerUnit: 21, margin: 46.7, marketAvg: 42, marketLow: 38, marketHigh: 48, weeklyUnits: 42, brandColor: '#1a1a1a' },
  { id: 'pp-3', brand: 'Kiva', name: 'Camino Pineapple Habanero', category: 'Edibles', grossPrice: 22, cost: 10, netPerUnit: 12, margin: 54.5, marketAvg: 22, marketLow: 19, marketHigh: 25, weeklyUnits: 55, brandColor: '#8B4513' },
  { id: 'pp-4', brand: 'Raw Garden', name: 'Slippery Susan Cart 1g', category: 'Vapes', grossPrice: 40, cost: 22, netPerUnit: 18, margin: 45.0, marketAvg: 38, marketLow: 35, marketHigh: 42, weeklyUnits: 28, brandColor: '#4CAF50' },
  { id: 'pp-5', brand: 'Wyld', name: 'Elderberry Indica Gummies', category: 'Edibles', grossPrice: 18, cost: 8, netPerUnit: 10, margin: 55.6, marketAvg: 18, marketLow: 16, marketHigh: 20, weeklyUnits: 35, brandColor: '#E91E63' },
  { id: 'pp-6', brand: 'Cookies', name: 'Gary Payton 3.5g', category: 'Flower', grossPrice: 55, cost: 32, netPerUnit: 23, margin: 41.8, marketAvg: 52, marketLow: 48, marketHigh: 58, weeklyUnits: 18, brandColor: '#2196F3' },
  { id: 'pp-7', brand: 'Alien Labs', name: 'Atomic Apple 3.5g', category: 'Flower', grossPrice: 50, cost: 28, netPerUnit: 22, margin: 44.0, marketAvg: 48, marketLow: 45, marketHigh: 55, weeklyUnits: 22, brandColor: '#00BCD4' },
  { id: 'pp-8', brand: 'PLUS', name: 'Sour Watermelon Gummies', category: 'Edibles', grossPrice: 20, cost: 9, netPerUnit: 11, margin: 55.0, marketAvg: 19, marketLow: 17, marketHigh: 22, weeklyUnits: 30, brandColor: '#FF6B35' },
];

const CATEGORY_PRICING = [
  { category: 'Flower', avgGross: 52.50, avgCost: 30.00, avgNet: 22.50, marketAvg: 49.00, monthlyRevenue: '$28,500', margin: 42.9, color: 'var(--color-accent-red)' },
  { category: 'Vapes', avgGross: 42.50, avgCost: 23.00, avgNet: 19.50, marketAvg: 40.00, monthlyRevenue: '$22,300', margin: 45.9, color: 'var(--color-accent-blue)' },
  { category: 'Edibles', avgGross: 20.00, avgCost: 9.00, avgNet: 11.00, marketAvg: 19.67, monthlyRevenue: '$18,400', margin: 55.0, color: 'var(--color-accent-purple)' },
  { category: 'Pre-Rolls', avgGross: 35.00, avgCost: 18.00, avgNet: 17.00, marketAvg: 33.00, monthlyRevenue: '$15,200', margin: 48.6, color: 'var(--color-accent-red)' },
  { category: 'Concentrates', avgGross: 38.00, avgCost: 21.00, avgNet: 17.00, marketAvg: 36.00, monthlyRevenue: '$12,100', margin: 44.7, color: 'var(--color-accent-red)' },
  { category: 'Tinctures', avgGross: 32.00, avgCost: 14.50, avgNet: 17.50, marketAvg: 30.00, monthlyRevenue: '$5,100', margin: 54.7, color: 'var(--color-accent-blue)' },
  { category: 'Topicals', avgGross: 28.00, avgCost: 11.75, avgNet: 16.25, marketAvg: 27.00, monthlyRevenue: '$4,200', margin: 58.0, color: 'var(--color-accent-green)' },
  { category: 'Beverages', avgGross: 12.00, avgCost: 6.25, avgNet: 5.75, marketAvg: 11.00, monthlyRevenue: '$3,200', margin: 47.9, color: 'var(--color-accent-gold)' },
];

const PROMOTIONS = [
  { name: 'Happy Hour 15% Off', type: 'Time-based', discountAmount: '15% off', spend: '$2,100', redemptions: 342, grossRevenue: '$8,420', incrementalRevenue: '$3,200', roi: 1.5, verdict: 'Keep' },
  { name: 'First-Time 20% Off', type: 'New Customer', discountAmount: '20% off first order', spend: '$3,400', redemptions: 189, grossRevenue: '$12,600', incrementalRevenue: '$8,100', roi: 2.4, verdict: 'Keep' },
  { name: 'BOGO Edibles', type: 'Category', discountAmount: 'Buy 1 get 1 free', spend: '$4,800', redemptions: 156, grossRevenue: '$6,200', incrementalRevenue: '$1,400', roi: 0.3, verdict: 'Kill' },
  { name: 'Loyalty 10% Off', type: 'Loyalty', discountAmount: '10% off for members', spend: '$1,900', redemptions: 420, grossRevenue: '$9,800', incrementalRevenue: '$4,600', roi: 2.4, verdict: 'Keep' },
  { name: 'Weekend Bundle', type: 'Bundle', discountAmount: '$10 off $60+', spend: '$2,200', redemptions: 78, grossRevenue: '$3,900', incrementalRevenue: '$920', roi: 0.4, verdict: 'Optimize' },
];

/* ═══════════════════════════════════════════════════════════════════
   SUGGESTION CARDS
   ═══════════════════════════════════════════════════════════════════ */

const SUGGESTIONS = [
  { id: 'price_scenarios', icon: Calculator, color: 'var(--color-accent-purple)', label: 'What-If Pricing', desc: 'Model price changes and see projected impact on revenue and margin', tag: 'Modeling', tagColor: 'var(--color-accent-purple)' },
  { id: 'market_comparison', icon: Scale, color: 'var(--color-accent-blue)', label: 'Market Price Comparison', desc: 'See how your prices compare to market in your region', confidence: 'high', tag: 'Intelligence', tagColor: 'var(--color-accent-blue)' },
  { id: 'discount_review', icon: Percent, color: 'var(--color-accent-gold)', label: 'Discount & Promo Review', desc: 'Performance of all active discounts — connects to your portfolio discount rate', confidence: 'medium', tag: 'Review', tagColor: 'var(--color-accent-gold)' },
  { id: 'price_cost_overview', icon: DollarSign, color: 'var(--color-accent-green)', label: 'Price & Cost Overview', desc: 'Gross prices, costs, and net revenue by product', tag: 'Analysis', tagColor: 'var(--color-accent-green)' },
  { id: 'change_prices', icon: ArrowUpDown, color: 'var(--color-accent-blue)', label: 'Change Prices', desc: 'Select products and update prices now', confidence: 'high', tag: 'Action', tagColor: 'var(--color-accent-blue)' },
  { id: 'create_discount', icon: Plus, color: 'var(--color-accent-red)', label: 'Create New Discount', desc: 'Set up a new promo and optionally launch a campaign', tag: 'Action', tagColor: 'var(--color-accent-red)' },
];

/* ═══════════════════════════════════════════════════════════════════
   VIEW COMPONENTS (exported for reuse in CustomerBridge)
   ═══════════════════════════════════════════════════════════════════ */

// ─── Market Price Comparison ───
export function MarketComparisonView({ data, onBack }) {
  const products = data?.products?.length ? data.products : PRICING_PRODUCTS.map(p => ({
    id: p.id, name: p.name, brand: p.brand, category: p.category,
    yourPrice: p.grossPrice, marketAvg: p.marketAvg, marketLow: p.marketLow, marketHigh: p.marketHigh,
    gap: `${((p.grossPrice - p.marketAvg) / p.marketAvg * 100) >= 0 ? '+' : ''}${((p.grossPrice - p.marketAvg) / p.marketAvg * 100).toFixed(1)}%`,
    recommendation: p.grossPrice > p.marketAvg * 1.08 ? 'lower' : p.grossPrice < p.marketAvg * 0.95 ? 'raise' : 'keep',
    reason: p.grossPrice > p.marketAvg * 1.08 ? 'Above regional average — consider lowering to stay competitive' : p.grossPrice < p.marketAvg * 0.95 ? 'Below market — room to increase without losing customers' : 'In line with market in your region',
  }));
  const categoryComparison = data?.categoryComparison?.length ? data.categoryComparison : CATEGORY_PRICING.map(c => ({
    category: c.category, yourAvg: c.avgGross, marketAvg: c.marketAvg,
    gap: `${((c.avgGross - c.marketAvg) / c.marketAvg * 100) >= 0 ? '+' : ''}${((c.avgGross - c.marketAvg) / c.marketAvg * 100).toFixed(1)}%`,
    color: c.color,
  }));

  const recColor = { raise: 'var(--color-accent-green)', lower: 'var(--color-accent-red)', keep: 'var(--color-text-muted)' };
  const recBg = { raise: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', lower: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)', keep: 'color-mix(in srgb, var(--color-text-muted) 8%, transparent)' };

  return (
    <div className="space-y-3">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent-blue/12 flex items-center justify-center">
          <Scale className="w-4 h-4 text-accent-blue" />
        </div>
        <div>
          <h3 className="text-text-primary font-semibold text-sm">{data?.title || 'Market Price Comparison'}</h3>
          <p className="text-text-secondary text-xs">{data?.subtitle || 'Your prices vs the market in your region'}</p>
        </div>
      </div>

      {/* Category comparison */}
      <div className="bg-surface-bg rounded-lg border border-surface-border p-3">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">Category Avg Price vs Regional Market</p>
        <div className="space-y-2.5">
          {categoryComparison.map((c) => {
            const gapNum = parseFloat(c.gap);
            return (
              <div key={c.category} className="flex items-center gap-3">
                <span className="text-text-secondary text-sm w-24 flex-shrink-0 truncate">{c.category}</span>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-28">
                    <span className="text-text-primary text-sm font-medium">${c.yourAvg.toFixed(2)}</span>
                    <span className="text-text-muted text-xs">you</span>
                  </div>
                  <div className="flex items-center gap-1.5 w-28">
                    <span className="text-text-secondary text-sm">${c.marketAvg.toFixed(2)}</span>
                    <span className="text-text-muted text-xs">market</span>
                  </div>
                  <span className={`text-xs font-bold ${gapNum > 3 ? 'text-accent-gold' : gapNum < -3 ? 'text-accent-blue' : 'text-text-secondary'}`}>{c.gap}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product table */}
      <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-divider">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Product</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Your Price</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Market Avg</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Market Range</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Gap</th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-surface-divider hover:bg-surface-card transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-text-primary font-medium">{p.name}</span>
                    <span className="text-text-secondary text-xs ml-2">{p.brand}</span>
                  </td>
                  <td className="text-right px-4 py-3 text-text-primary font-medium">${typeof p.yourPrice === 'number' ? p.yourPrice.toFixed(2) : p.yourPrice}</td>
                  <td className="text-right px-4 py-3 text-text-secondary">${typeof p.marketAvg === 'number' ? p.marketAvg.toFixed(2) : p.marketAvg}</td>
                  <td className="text-right px-4 py-3 text-text-muted text-xs">${typeof p.marketLow === 'number' ? p.marketLow.toFixed(2) : p.marketLow} – ${typeof p.marketHigh === 'number' ? p.marketHigh.toFixed(2) : p.marketHigh}</td>
                  <td className="text-right px-4 py-3">
                    <span className={`font-medium ${parseFloat(p.gap) > 0 ? 'text-accent-gold' : parseFloat(p.gap) < 0 ? 'text-accent-blue' : 'text-text-secondary'}`}>{p.gap}</span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ color: recColor[p.recommendation], background: recBg[p.recommendation] }}>
                      {p.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data?.summary && (
        <div className="bg-accent-blue/[0.08] rounded-xl p-4 border border-accent-blue/20">
          <p className="text-accent-blue text-sm">{data.summary}</p>
        </div>
      )}
    </div>
  );
}

// ─── Price & Cost Overview ───
export function PriceCostView({ data, onBack }) {
  const products = data?.products?.length ? data.products : PRICING_PRODUCTS.map(p => ({
    name: p.name, brand: p.brand, category: p.category,
    grossPrice: p.grossPrice, cost: p.cost, netPerUnit: p.netPerUnit, margin: p.margin,
    weeklyUnits: p.weeklyUnits,
    weeklyRevenue: p.grossPrice * p.weeklyUnits,
    weeklyCost: p.cost * p.weeklyUnits,
    weeklyNet: p.netPerUnit * p.weeklyUnits,
  }));
  const categoryBreakdown = data?.categoryBreakdown?.length ? data.categoryBreakdown : CATEGORY_PRICING.map(c => ({
    category: c.category, avgGrossPrice: c.avgGross, avgCost: c.avgCost, avgNet: c.avgNet,
    monthlyRevenue: c.monthlyRevenue, margin: c.margin, color: c.color,
  }));
  const suggestions = data?.suggestions?.length ? data.suggestions : [
    { action: 'Raise Flower prices $2-3 — your avg is $52.50 vs $49 market, but premium brands support it', impact: '+$1,800/mo', effort: 'Low' },
    { action: 'Negotiate Cookies wholesale cost — $32 is high for the category', impact: '+$864/mo net', effort: 'Medium' },
    { action: 'Edibles have best net per unit at 55% margin — consider expanding selection', impact: '+$2,200/mo', effort: 'Medium' },
  ];

  return (
    <div className="space-y-3">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent-green/12 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-accent-green" />
        </div>
        <div>
          <h3 className="text-text-primary font-semibold text-sm">{data?.title || 'Price & Cost Overview'}</h3>
          <p className="text-text-secondary text-xs">{data?.subtitle || 'Gross prices, costs, and net revenue by product'}</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-surface-bg rounded-lg border border-surface-border p-3">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">Category Pricing Breakdown</p>
        <div className="space-y-2.5">
          {categoryBreakdown.map((c) => (
            <div key={c.category} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <span className="text-text-secondary text-sm w-24 flex-shrink-0 truncate">{c.category}</span>
              <div className="flex-1 flex items-center gap-4 text-xs">
                <div className="w-20"><span className="text-text-muted">Gross </span><span className="text-text-primary font-medium">${c.avgGrossPrice.toFixed(2)}</span></div>
                <div className="w-20"><span className="text-text-muted">Cost </span><span className="text-text-secondary">${c.avgCost.toFixed(2)}</span></div>
                <div className="w-20"><span className="text-text-muted">Net </span><span className="text-accent-green font-medium">${c.avgNet.toFixed(2)}</span></div>
                <span className="text-text-muted">{c.margin}% margin</span>
              </div>
              <span className="text-text-muted text-xs w-24 text-right flex-shrink-0">{c.monthlyRevenue}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product table */}
      <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-divider">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Product</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Gross Price</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Cost</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Net / Unit</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Weekly Units</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3">Weekly Net</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} className="border-b border-surface-divider hover:bg-surface-card transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-text-primary font-medium">{p.name}</span>
                    <span className="text-text-secondary text-xs ml-2">{p.brand}</span>
                  </td>
                  <td className="text-right px-4 py-3 text-text-primary font-medium">${p.grossPrice.toFixed(2)}</td>
                  <td className="text-right px-4 py-3 text-text-secondary">${p.cost.toFixed(2)}</td>
                  <td className="text-right px-4 py-3 text-accent-green font-medium">${p.netPerUnit.toFixed(2)}</td>
                  <td className="text-right px-4 py-3 text-text-secondary">{p.weeklyUnits}</td>
                  <td className="text-right px-4 py-3 text-text-primary font-bold">${p.weeklyNet.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-surface-bg rounded-lg border border-surface-border p-3">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">Pricing Suggestions</p>
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-3 py-2.5 border-b border-surface-divider last:border-0">
            <CheckCircle2 className="w-4 h-4 text-accent-green mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-text-primary text-sm">{s.action}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-accent-green text-xs font-semibold">{s.impact}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${s.effort === 'Low' ? 'bg-accent-green/12 text-accent-green' : s.effort === 'High' ? 'bg-accent-red/12 text-accent-red' : 'bg-accent-gold/12 text-accent-gold'}`}>
                  {s.effort} effort
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Discount & Promo Review ───
export function DiscountReviewView({ data, onBack }) {
  const totalSpend = data?.totalDiscountSpend || '$14,400';
  const wastedSpend = data?.wastedSpend || '$4,320';
  const avgROI = data?.avgROI || '1.4x';
  const promotions = data?.promotions?.length ? data.promotions : PROMOTIONS;
  const recommendations = data?.recommendations?.length ? data.recommendations : [
    'Kill BOGO Edibles — 0.3x ROI, cannibalizing full-price sales',
    'Optimize Weekend Bundle — reduce to $5 off $60+ and track incremental lift',
    'First-Time 20% Off has highest ROI at 2.4x — consider increasing budget',
  ];

  const verdictColor = { Keep: 'var(--color-accent-green)', Optimize: 'var(--color-accent-gold)', Kill: 'var(--color-accent-red)' };
  const verdictBg = { Keep: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)', Optimize: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)', Kill: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)' };

  return (
    <div className="space-y-3">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent-gold/12 flex items-center justify-center">
          <Percent className="w-4 h-4 text-accent-gold" />
        </div>
        <div>
          <h3 className="text-text-primary font-semibold text-sm">{data?.title || 'Discount & Promo Review'}</h3>
          <p className="text-text-secondary text-xs">{data?.subtitle || 'Performance of all your active discounts'}</p>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-bg rounded-lg border border-surface-border p-3 text-center">
          <p className="text-text-secondary text-xs mb-1">Total Discount Spend</p>
          <p className="text-text-primary text-lg font-bold">{totalSpend}</p>
          <p className="text-text-muted text-[10px]">per month</p>
        </div>
        <div className="bg-surface-bg rounded-lg border border-surface-border p-3 text-center">
          <p className="text-text-secondary text-xs mb-1">Wasted Spend</p>
          <p className="text-accent-red text-lg font-bold">{wastedSpend}</p>
          <p className="text-text-muted text-[10px]">no measurable ROI</p>
        </div>
        <div className="bg-surface-bg rounded-lg border border-surface-border p-3 text-center">
          <p className="text-text-secondary text-xs mb-1">Avg ROI</p>
          <p className="text-accent-gold text-lg font-bold">{avgROI}</p>
          <p className="text-text-muted text-[10px]">across all promos</p>
        </div>
      </div>

      {/* Promo cards */}
      <div className="space-y-3">
        {promotions.map((p, i) => (
          <div key={i} className="bg-surface-bg rounded-lg border border-surface-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-text-primary font-medium">{p.name}</span>
                <span className="text-text-muted text-xs ml-2">{p.type}</span>
                {p.discountAmount && <span className="text-accent-blue text-xs ml-2">{p.discountAmount}</span>}
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: verdictColor[p.verdict], background: verdictBg[p.verdict] }}>
                {p.verdict}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><span className="text-text-muted">Spend</span><p className="text-text-primary font-medium">{p.spend}</p></div>
              <div><span className="text-text-muted">Redemptions</span><p className="text-text-primary font-medium">{p.redemptions}</p></div>
              <div><span className="text-text-muted">Incremental Rev</span><p className="text-text-primary font-medium">{p.incrementalRevenue}</p></div>
              <div><span className="text-text-muted">ROI</span><p className={`font-bold ${p.roi >= 1.5 ? 'text-accent-green' : p.roi < 1 ? 'text-accent-red' : 'text-accent-gold'}`}>{p.roi}x</p></div>
            </div>
            {p.reason && <p className="text-text-secondary text-xs mt-2">{p.reason}</p>}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-accent-gold/[0.08] rounded-xl p-4 border border-accent-gold/20">
          <p className="text-accent-gold text-xs font-semibold uppercase tracking-wider mb-2">Recommendations</p>
          <ul className="space-y-1.5">
            {recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-accent-gold/80">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── What-If Pricing Scenarios ───
export function PriceScenariosView({ data, onBack }) {
  const scenarios = data?.scenarios?.length ? data.scenarios : [
    {
      name: 'Conservative Growth', strategy: 'Raise premium brands $1-2 where you\'re already at or below market',
      recommended: true, riskLevel: 'Low',
      projections: { revenueChange: '+$3,200/mo', netProfitChange: '+$3,200/mo', customerImpact: 'Minimal — targets products already priced competitively' },
      changes: [
        { product: 'Cookies Gary Payton', currentPrice: 55, newPrice: 57, change: '+3.6%' },
        { product: 'Alien Labs Atomic Apple', currentPrice: 50, newPrice: 52, change: '+4.0%' },
        { product: 'Jeeter Baby Churros', currentPrice: 35, newPrice: 36, change: '+2.9%' },
      ],
    },
    {
      name: 'Market Alignment', strategy: 'Move all products to within 3% of regional market average',
      recommended: false, riskLevel: 'Medium',
      projections: { revenueChange: '+$1,800/mo', netProfitChange: '+$1,400/mo', customerImpact: 'Balanced — some prices up, some down' },
      changes: [
        { product: 'STIIIZY OG Kush Pod', currentPrice: 45, newPrice: 43, change: '-4.4%' },
        { product: 'Cookies Gary Payton', currentPrice: 55, newPrice: 53, change: '-3.6%' },
        { product: 'PLUS Sour Watermelon', currentPrice: 20, newPrice: 19, change: '-5.0%' },
      ],
    },
    {
      name: 'Aggressive Growth', strategy: 'Raise all products to top of regional market range',
      recommended: false, riskLevel: 'High',
      projections: { revenueChange: '+$8,400/mo', netProfitChange: '+$8,400/mo', customerImpact: 'May lose 5-8% of price-sensitive customers' },
      changes: [
        { product: 'STIIIZY OG Kush Pod', currentPrice: 45, newPrice: 48, change: '+6.7%' },
        { product: 'Raw Garden Cart', currentPrice: 40, newPrice: 42, change: '+5.0%' },
        { product: 'Cookies Gary Payton', currentPrice: 55, newPrice: 58, change: '+5.5%' },
        { product: 'Alien Labs Atomic Apple', currentPrice: 50, newPrice: 55, change: '+10.0%' },
      ],
    },
  ];

  const [expandedScenario, setExpandedScenario] = useState(null);
  const [applied, setApplied] = useState(null);
  const riskColor = { Low: 'var(--color-accent-green)', Medium: 'var(--color-accent-gold)', High: 'var(--color-accent-red)' };

  return (
    <div className="space-y-3">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent-purple/12 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-accent-purple" />
        </div>
        <div>
          <h3 className="text-text-primary font-semibold text-sm">{data?.title || 'What-If Pricing Scenarios'}</h3>
          <p className="text-text-secondary text-xs">{data?.subtitle || 'Model price changes and see projected revenue impact'}</p>
        </div>
      </div>

      {scenarios.map((s, i) => (
        <div key={i} className={`bg-surface-bg rounded-lg border ${s.recommended ? 'border-accent-green' : 'border-surface-border'} p-3 hover:border-surface-border transition-colors`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-text-primary font-semibold">{s.name}</span>
              {s.recommended && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-green/[0.15] text-accent-green">RECOMMENDED</span>
              )}
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ color: riskColor[s.riskLevel], background: `color-mix(in srgb, ${riskColor[s.riskLevel]} 12%, transparent)` }}>
              {s.riskLevel} Risk
            </span>
          </div>
          <p className="text-text-secondary text-sm mb-3">{s.strategy}</p>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-surface-card rounded-lg p-2.5 text-center">
              <p className="text-text-muted text-[10px]">Gross Revenue</p>
              <p className="text-accent-green font-bold text-sm">{s.projections.revenueChange}</p>
            </div>
            <div className="bg-surface-card rounded-lg p-2.5 text-center">
              <p className="text-text-muted text-[10px]">Net Profit</p>
              <p className="text-accent-blue font-bold text-sm">{s.projections.netProfitChange}</p>
            </div>
            <div className="bg-surface-card rounded-lg p-2.5 text-center">
              <p className="text-text-muted text-[10px]">Customer Impact</p>
              <p className="text-text-secondary font-medium text-xs">{s.projections.customerImpact}</p>
            </div>
          </div>

          <button onClick={() => setExpandedScenario(expandedScenario === i ? null : i)} className="text-accent-blue text-xs flex items-center gap-1 mb-2 hover:underline">
            {expandedScenario === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expandedScenario === i ? 'Hide' : 'Show'} {s.changes.length} price changes
          </button>

          {expandedScenario === i && (
            <div className="space-y-1.5 mb-3">
              {s.changes.map((c, j) => (
                <div key={j} className="flex items-center justify-between bg-surface-card rounded-lg px-3 py-2 text-xs">
                  <span className="text-text-primary">{c.product}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted">${c.currentPrice}</span>
                    <ArrowRight className="w-3 h-3 text-text-muted" />
                    <span className="text-text-primary font-medium">${c.newPrice}</span>
                    <span className={`font-bold ${c.change.startsWith('+') ? 'text-accent-green' : 'text-accent-red'}`}>{c.change}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setApplied(i)}
            disabled={applied === i}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${applied === i ? 'bg-accent-green/[0.15] text-accent-green cursor-default' : 'bg-accent-green text-white hover:bg-accent-green/85'}`}
          >
            {applied === i ? (
              <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Prices Updated</span>
            ) : 'Apply This Scenario'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Change Prices ───
export function ChangePricesView({ data, onBack }) {
  const { logAction } = useActionLog();
  const initialChanges = data?.changes?.length ? data.changes : PRICING_PRODUCTS.filter(p => Math.abs(p.grossPrice - p.marketAvg) / p.marketAvg > 0.03).map(p => {
    const target = p.grossPrice > p.marketAvg ? Math.round(p.marketAvg * 1.02) : Math.round(p.marketAvg * 0.98);
    const diff = target - p.grossPrice;
    return {
      id: p.id, name: p.name, brand: p.brand, category: p.category,
      currentPrice: p.grossPrice, newPrice: target,
      changePercent: `${diff >= 0 ? '+' : ''}${((diff / p.grossPrice) * 100).toFixed(1)}%`,
      weeklyUnits: p.weeklyUnits,
      revenueImpact: `${diff >= 0 ? '+' : '-'}$${Math.abs(diff * p.weeklyUnits)}/wk`,
      netImpact: `${diff >= 0 ? '+' : '-'}$${Math.abs(diff * p.weeklyUnits)}/wk`,
    };
  });

  const [selected, setSelected] = useState(new Set(initialChanges.map(c => c.id)));
  const [applied, setApplied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const activeChanges = initialChanges.filter(c => selected.has(c.id));
  const totalRevenueImpact = data?.totalRevenueImpact || (() => {
    const total = activeChanges.reduce((sum, c) => {
      const match = c.revenueImpact.match(/[+-]?\$?([\d,]+)/);
      const val = match ? parseInt(match[1].replace(',', '')) : 0;
      return sum + (c.revenueImpact.startsWith('-') ? -val : val);
    }, 0) * 4;
    return `${total >= 0 ? '+' : '-'}$${Math.abs(total).toLocaleString()}/mo`;
  })();

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent-blue/12 flex items-center justify-center">
          <ArrowUpDown className="w-4 h-4 text-accent-blue" />
        </div>
        <div>
          <h3 className="text-text-primary font-semibold text-sm">{data?.title || 'Change Prices'}</h3>
          <p className="text-text-secondary text-xs">{data?.subtitle || 'Select products, preview impact, and apply changes'}</p>
        </div>
      </div>

      <div className="space-y-2">
        {initialChanges.map((c) => (
          <div
            key={c.id}
            onClick={() => !applied && toggleSelect(c.id)}
            className={`bg-surface-bg rounded-lg border p-3 transition-all cursor-pointer ${selected.has(c.id) ? 'border-accent-green bg-accent-green/[0.04]' : 'border-surface-border hover:border-surface-border'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(c.id) ? 'bg-accent-green border-accent-green' : 'border-surface-border'}`}>
                {selected.has(c.id) && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-text-primary font-medium text-sm">{c.name}</span>
                    <span className="text-text-secondary text-xs ml-2">{c.brand}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted">${c.currentPrice}</span>
                    <ArrowRight className="w-3 h-3 text-text-muted" />
                    <span className="text-text-primary font-bold">${c.newPrice}</span>
                    <span className={`text-xs font-bold ${c.changePercent.startsWith('+') ? 'text-accent-green' : 'text-accent-red'}`}>{c.changePercent}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                  <span>{c.weeklyUnits} units/wk</span>
                  <span className={c.revenueImpact.startsWith('+') ? 'text-accent-green' : 'text-accent-red'}>Gross: {c.revenueImpact}</span>
                  <span className={c.netImpact.startsWith('+') ? 'text-accent-green' : 'text-accent-red'}>Net: {c.netImpact}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Check */}
      <div className="mt-4 p-3 rounded-xl border border-surface-border bg-surface-bg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-accent-blue" />
          <span className="text-xs font-semibold text-accent-blue">Compliance Check</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3.5 h-3.5 rounded-full bg-accent-green/20 flex items-center justify-center"><span className="text-[8px] text-accent-green">✓</span></div>
            <span className="text-text-primary">Price within state maximum markup</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3.5 h-3.5 rounded-full bg-accent-green/20 flex items-center justify-center"><span className="text-[8px] text-accent-green">✓</span></div>
            <span className="text-text-primary">No minimum price violation</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3.5 h-3.5 rounded-full bg-accent-green/20 flex items-center justify-center"><span className="text-[8px] text-accent-green">✓</span></div>
            <span className="text-text-primary">Tax calculation updated automatically</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3.5 h-3.5 rounded-full bg-accent-blue/20 flex items-center justify-center"><span className="text-[8px] text-accent-blue">i</span></div>
            <span className="text-text-secondary">Price change reported in next METRC sync</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-card rounded-xl border border-surface-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-text-secondary text-sm">{activeChanges.length} products selected</span>
          <span className="text-accent-green font-bold text-sm">Est. {totalRevenueImpact} revenue</span>
        </div>
        {!applied ? (
          <>
            <button onClick={() => setShowConfirm(true)} disabled={activeChanges.length === 0}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-accent-green text-white hover:bg-accent-green/85 transition-colors disabled:opacity-50">
              Apply Changes
            </button>
            <ConfirmationDrawer
              open={showConfirm}
              onCancel={() => setShowConfirm(false)}
              onConfirm={() => {
                setShowConfirm(false);
                setApplied(true);
                logAction({
                  type: 'price_change',
                  agent: 'Pricing Agent',
                  description: `Price changes applied — ${activeChanges.length} products updated`,
                  detail: `Est. revenue impact: ${totalRevenueImpact}`,
                });
              }}
              title="Confirm Price Changes"
              description={`Updating prices for ${activeChanges.length} products across all stores`}
              icon={DollarSign}
              confirmLabel="Apply Price Changes"
              confirmColor="var(--color-accent-green)"
              details={[
                { label: 'Products', value: `${activeChanges.length} selected` },
                { label: 'Est. Revenue Impact', value: totalRevenueImpact },
                ...activeChanges.slice(0, 3).map(c => ({ label: `${c.brand} ${c.name}`, value: `$${c.currentPrice} → $${c.newPrice} (${c.changePercent})` })),
                ...(activeChanges.length > 3 ? [{ label: 'And more...', value: `+${activeChanges.length - 3} products` }] : []),
              ]}
              warning="Price changes will be pushed to POS systems at all locations immediately."
            />
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-2 text-accent-green font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Prices Updated
            </span>
            <div className="rounded-xl border border-surface-border bg-surface-bg divide-y divide-surface-divider">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Products Updated</span>
                <span className="text-[12px] font-medium text-text-primary">{activeChanges.length}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Est. Revenue Impact</span>
                <span className="text-[12px] font-semibold text-accent-green">{totalRevenueImpact}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Pushed to POS</span>
                <span className="text-[12px] font-medium text-text-primary">All locations</span>
              </div>
            </div>
            <p className="text-[11px] text-accent-blue cursor-pointer hover:underline" onClick={() => { const btn = document.querySelector('[aria-label="Action log"]'); if (btn) btn.click(); }}>
              View in Action Log
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create New Discount ───
export function CreateDiscountView({ data, onBack }) {
  const discountData = data?.discount || null;
  const [name, setName] = useState(discountData?.name || '');
  const [type, setType] = useState(discountData?.type || 'Percentage');
  const [amount, setAmount] = useState(discountData?.amount || '');
  const [appliesTo, setAppliesTo] = useState(discountData?.appliesTo || 'All Products');
  const [schedule, setSchedule] = useState(discountData?.schedule || 'Always active');
  const [created, setCreated] = useState(false);
  const [showCampaignPrompt, setShowCampaignPrompt] = useState(false);
  const [campaignData, setCampaignData] = useState(null);
  const [generatingCampaign, setGeneratingCampaign] = useState(false);

  const handleCreate = () => {
    setCreated(true);
    setShowCampaignPrompt(true);
  };

  const handleLaunchCampaign = async () => {
    setShowCampaignPrompt(false);
    setGeneratingCampaign(true);
    const discountDesc = `${name || 'New discount'}: ${amount || type} — applies to ${appliesTo}, ${schedule}`;
    const plan = await generateMarketingCampaignPlan(
      `Create a marketing campaign to promote a new discount at Ascend: ${discountDesc}. Highlight the savings and drive customer traffic.`
    );
    setCampaignData(plan);
    setGeneratingCampaign(false);
  };

  const hasPreset = !!discountData;

  return (
    <div className="space-y-3">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent-red/12 flex items-center justify-center">
          <Plus className="w-4 h-4 text-accent-red" />
        </div>
        <div>
          <h3 className="text-text-primary font-semibold text-sm">{data?.title || 'Create New Discount'}</h3>
          <p className="text-text-secondary text-xs">{data?.subtitle || 'Set up a new promo and optionally launch a marketing campaign'}</p>
        </div>
      </div>

      {!created ? (
        <div className="bg-surface-bg rounded-xl border border-surface-border p-3.5 space-y-3">
          <div>
            <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">Discount Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Sale 15% Off"
              className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-green transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-green">
                <option>Percentage</option>
                <option>Dollar Off</option>
                <option>BOGO</option>
                <option>Bundle</option>
              </select>
            </div>
            <div>
              <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">Amount</label>
              <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 15% off or $5 off"
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-green" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">Applies To</label>
              <select value={appliesTo} onChange={e => setAppliesTo(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-green">
                <option>All Products</option>
                <option>Flower</option>
                <option>Edibles</option>
                <option>Vapes</option>
                <option>Pre-Rolls</option>
                <option>Concentrates</option>
              </select>
            </div>
            <div>
              <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider block mb-1.5">Schedule</label>
              <select value={schedule} onChange={e => setSchedule(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-green">
                <option>Always active</option>
                <option>Weekdays 4-7pm</option>
                <option>Weekends only</option>
                <option>Limited time (7 days)</option>
                <option>Limited time (30 days)</option>
              </select>
            </div>
          </div>

          {hasPreset && discountData && (
            <div className="bg-surface-card rounded-lg p-3 grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-text-muted">Est. Redemptions</span><p className="text-text-primary font-medium">{discountData.estimatedRedemptions}/mo</p></div>
              <div><span className="text-text-muted">Est. Cost</span><p className="text-text-primary font-medium">{discountData.estimatedCost}/mo</p></div>
              <div><span className="text-text-muted">Projected ROI</span><p className="text-accent-green font-bold">{discountData.projectedROI}</p></div>
            </div>
          )}

          <button onClick={handleCreate} disabled={!name.trim() || !amount.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-accent-green text-white hover:bg-accent-green/85 transition-colors disabled:opacity-50">
            Create Discount
          </button>
        </div>
      ) : (
        <div className="bg-accent-green/[0.08] rounded-xl border border-accent-green/20 p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-accent-green" />
            <span className="text-accent-green font-semibold">Discount Created</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-1">
            <div><span className="text-text-muted">Name: </span><span className="text-text-primary">{name || 'New Discount'}</span></div>
            <div><span className="text-text-muted">Amount: </span><span className="text-text-primary">{amount || type}</span></div>
            <div><span className="text-text-muted">Applies to: </span><span className="text-text-primary">{appliesTo}</span></div>
            <div><span className="text-text-muted">Schedule: </span><span className="text-text-primary">{schedule}</span></div>
          </div>
        </div>
      )}

      {/* Campaign prompt */}
      {showCampaignPrompt && (
        <div className="bg-surface-card rounded-xl border border-accent-blue p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-5 h-5 text-accent-blue" />
            <span className="text-text-primary font-semibold">Promote this discount?</span>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            Would you like to use the <span className="text-accent-blue font-medium">Marketing Agent</span> to create a campaign highlighting this new discount to relevant customers?
          </p>
          <div className="flex items-center gap-3">
            <button onClick={handleLaunchCampaign}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-accent-blue text-white hover:bg-accent-blue/85 transition-colors flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Yes, Create Campaign
            </button>
            <button onClick={() => setShowCampaignPrompt(false)}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-surface-muted border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
              No, Skip
            </button>
          </div>
        </div>
      )}

      {generatingCampaign && (
        <div className="flex items-center gap-3 text-text-secondary text-sm p-4">
          <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          Creating campaign to promote your new discount...
        </div>
      )}

      {campaignData && (
        <div className="mt-2">
          <p className="text-text-primary font-medium text-sm mb-2">Here's a campaign to promote your new discount:</p>
          <CampaignPlan data={campaignData} onBack={null} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRICING DASHBOARD (mode === 'dashboard')
   ═══════════════════════════════════════════════════════════════════ */

function PricingDashboard() {
  const navigate = useNavigate();
  const [editingProduct, setEditingProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceApplied, setPriceApplied] = useState(null);
  const { selectedStoreNames, isAllSelected, selectionLabel } = useStores();

  // Compute store weight ratio for scaling volume metrics
  const weightRatio = useMemo(() => {
    if (isAllSelected) return 1;
    const selWeight = STORE_WEIGHTS.filter(s => selectedStoreNames.has(s.name)).reduce((sum, s) => sum + s.weight, 0);
    return TOTAL_WEIGHT > 0 ? selWeight / TOTAL_WEIGHT : 0;
  }, [selectedStoreNames, isAllSelected]);

  // Prepare scatter data: x = market avg, y = your price, z = weekly units (bubble size) — scaled by store selection
  const scatterData = useMemo(() => PRICING_PRODUCTS.map(p => ({
    x: p.marketAvg,
    y: p.grossPrice,
    z: Math.round(p.weeklyUnits * weightRatio),
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    gap: ((p.grossPrice - p.marketAvg) / p.marketAvg * 100),
    cost: p.cost,
    netPerUnit: p.netPerUnit,
    brandColor: p.brandColor,
  })), [weightRatio]);

  const minPrice = Math.min(...PRICING_PRODUCTS.map(p => Math.min(p.marketAvg, p.grossPrice))) - 5;
  const maxPrice = Math.max(...PRICING_PRODUCTS.map(p => Math.max(p.marketAvg, p.grossPrice))) + 5;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const gapStr = `${d.gap >= 0 ? '+' : ''}${d.gap.toFixed(1)}%`;
    return (
      <div className="bg-surface-hover border border-surface-border rounded-xl px-4 py-3 shadow-xl" style={{ minWidth: 200 }}>
        <p className="text-text-primary font-semibold text-sm">{d.name}</p>
        <p className="text-text-secondary text-xs mb-2">{d.brand} · {d.category}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-text-muted">Your Price</span>
          <span className="text-text-primary font-medium text-right">${d.y.toFixed(2)}</span>
          <span className="text-text-muted">Market Avg</span>
          <span className="text-text-secondary text-right">${d.x.toFixed(2)}</span>
          <span className="text-text-muted">Gap</span>
          <span className={`font-bold text-right ${d.gap > 3 ? 'text-accent-gold' : d.gap < -3 ? 'text-accent-blue' : 'text-text-secondary'}`}>{gapStr}</span>
          <span className="text-text-muted">Net / Unit</span>
          <span className="text-accent-green font-medium text-right">${d.netPerUnit.toFixed(2)}</span>
          <span className="text-text-muted">Weekly Units</span>
          <span className="text-text-secondary text-right">{d.z}</span>
        </div>
        <p className="text-accent-blue text-[10px] mt-2 font-medium">Click to adjust price</p>
      </div>
    );
  };

  const handleDotClick = (entry) => {
    const p = PRICING_PRODUCTS.find(pr => pr.id === entry.id);
    if (p) {
      setEditingProduct(p);
      const target = p.grossPrice > p.marketAvg ? Math.round(p.marketAvg * 1.02) : p.grossPrice;
      setNewPrice(String(target));
      setPriceApplied(null);
    }
  };

  const handleApplyPrice = () => {
    setPriceApplied(editingProduct.id);
    setTimeout(() => {
      setEditingProduct(null);
      setPriceApplied(null);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-green/12 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-green" />
            </div>
            Pricing Tool
          </h1>
          <p className="text-sm text-text-secondary mt-1">Understand your pricing, compare to market, and make changes fast — {selectionLabel}</p>
        </div>
        <Link to="/agents/pricing" className="px-4 py-2 rounded-lg bg-accent-green text-white font-semibold text-sm hover:bg-accent-green/85 transition-colors flex items-center gap-2">
          <Bot className="w-4 h-4" /> Open Pricing Agent
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Gross Price', value: '$35.63', sub: 'Across all products', icon: DollarSign, color: 'var(--color-accent-green)' },
          { label: 'vs Market', value: '+6%', sub: 'Above regional average', icon: Scale, color: 'var(--color-accent-blue)' },
          { label: 'Active Discounts', value: '5', sub: '3 healthy, 2 underperforming', icon: Percent, color: 'var(--color-accent-gold)' },
          { label: 'Monthly Discount Spend', value: `$${Math.round(14400 * weightRatio).toLocaleString()}`, sub: `$${Math.round(4320 * weightRatio).toLocaleString()} with no ROI`, icon: TrendingDown, color: 'var(--color-accent-red)' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface-card rounded-xl border border-surface-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${kpi.color} 8%, transparent)` }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
            <p className="text-text-muted text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Scatter Plot: Your Price vs Market */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-text-primary font-semibold text-lg">Your Price vs Market</h2>
            <p className="text-text-muted text-xs mt-0.5">Products above the line are priced higher than market — click any dot to adjust</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-gold" /> Above market</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-text-muted" /> At market</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-blue" /> Below market</span>
          </div>
        </div>
        <div className="h-[320px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-divider)" />
              <XAxis
                type="number" dataKey="x" name="Market Avg"
                domain={[minPrice, maxPrice]}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                tickFormatter={v => `$${v}`}
                label={{ value: 'Market Avg Price', position: 'bottom', offset: 0, fill: 'var(--color-text-secondary)', fontSize: 11 }}
                stroke="var(--color-surface-divider)"
              />
              <YAxis
                type="number" dataKey="y" name="Your Price"
                domain={[minPrice, maxPrice]}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                tickFormatter={v => `$${v}`}
                label={{ value: 'Your Price', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--color-text-secondary)', fontSize: 11 }}
                stroke="var(--color-surface-divider)"
              />
              <ZAxis type="number" dataKey="z" range={[80, 400]} name="Weekly Units" />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-text-muted)' }} />
              <ReferenceLine
                segment={[{ x: minPrice, y: minPrice }, { x: maxPrice, y: maxPrice }]}
                stroke="var(--color-text-muted)" strokeDasharray="6 4" strokeWidth={1.5}
                label={{ value: 'Market parity', position: 'end', fill: 'var(--color-text-secondary)', fontSize: 10 }}
              />
              <Scatter data={scatterData} cursor="pointer" onClick={handleDotClick}>
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.gap > 3 ? 'var(--color-accent-gold)' : entry.gap < -3 ? 'var(--color-accent-blue)' : 'var(--color-text-muted)'}
                    fillOpacity={0.85}
                    stroke={entry.gap > 3 ? 'var(--color-accent-gold)' : entry.gap < -3 ? 'var(--color-accent-blue)' : 'var(--color-text-muted)'}
                    strokeWidth={2}
                    strokeOpacity={0.4}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inline price editor modal */}
      {editingProduct && (
        <div className="bg-surface-card rounded-xl border-2 border-accent-blue p-5 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${editingProduct.brandColor}20` }}>
                <ArrowUpDown className="w-4 h-4" style={{ color: editingProduct.brandColor }} />
              </div>
              <div>
                <p className="text-text-primary font-semibold">{editingProduct.name}</p>
                <p className="text-text-secondary text-xs">{editingProduct.brand} · {editingProduct.category}</p>
              </div>
            </div>
            <button onClick={() => setEditingProduct(null)} className="text-text-secondary hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-surface-bg rounded-lg p-3 text-center">
              <p className="text-text-muted text-[10px] mb-1">Current Price</p>
              <p className="text-text-primary font-bold text-lg">${editingProduct.grossPrice.toFixed(2)}</p>
            </div>
            <div className="bg-surface-bg rounded-lg p-3 text-center">
              <p className="text-text-muted text-[10px] mb-1">Market Avg</p>
              <p className="text-text-secondary font-bold text-lg">${editingProduct.marketAvg.toFixed(2)}</p>
            </div>
            <div className="bg-surface-bg rounded-lg p-3 text-center">
              <p className="text-text-muted text-[10px] mb-1">Market Range</p>
              <p className="text-text-secondary font-medium text-sm mt-1">${editingProduct.marketLow} – ${editingProduct.marketHigh}</p>
            </div>
            <div className="bg-surface-bg rounded-lg p-3 text-center">
              <p className="text-text-muted text-[10px] mb-1">New Price</p>
              <input
                type="number"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="w-full bg-transparent text-accent-blue font-bold text-lg text-center outline-none"
                step="1"
                min="1"
              />
            </div>
          </div>
          {newPrice && (
            <div className="flex items-center justify-between bg-surface-bg rounded-lg px-4 py-3 mb-4">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-text-muted">Change:</span>
                <span className={`font-bold ${(parseFloat(newPrice) - editingProduct.grossPrice) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {(parseFloat(newPrice) - editingProduct.grossPrice) >= 0 ? '+' : ''}{(parseFloat(newPrice) - editingProduct.grossPrice).toFixed(2)}
                  ({(((parseFloat(newPrice) - editingProduct.grossPrice) / editingProduct.grossPrice) * 100).toFixed(1)}%)
                </span>
                <span className="text-text-muted">New net/unit:</span>
                <span className="text-accent-green font-bold">${(parseFloat(newPrice) - editingProduct.cost).toFixed(2)}</span>
                <span className="text-text-muted">Weekly impact:</span>
                <span className={`font-bold ${(parseFloat(newPrice) - editingProduct.grossPrice) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {(parseFloat(newPrice) - editingProduct.grossPrice) >= 0 ? '+' : ''}${((parseFloat(newPrice) - editingProduct.grossPrice) * Math.round(editingProduct.weeklyUnits * weightRatio)).toFixed(0)}/wk
                </span>
              </div>
              {priceApplied === editingProduct.id ? (
                <span className="flex items-center gap-2 text-accent-green font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Updated
                </span>
              ) : (
                <button onClick={handleApplyPrice}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-accent-green text-white hover:bg-accent-green/85 transition-colors">
                  Apply
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Product pricing vs market */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6">
        <h2 className="text-text-primary font-semibold text-lg mb-4">Your Prices vs Regional Market</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-divider">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2">Product</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2">Category</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2">Your Price</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2">Market Avg</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2">Cost</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2">Net / Unit</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_PRODUCTS.map((p) => {
                const gap = ((p.grossPrice - p.marketAvg) / p.marketAvg * 100);
                return (
                  <tr key={p.id} className="border-b border-surface-divider hover:bg-surface-bg transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="text-text-primary font-medium">{p.name}</span>
                      <span className="text-text-muted text-xs ml-2">{p.brand}</span>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary text-xs">{p.category}</td>
                    <td className="text-right px-4 py-2.5 text-text-primary font-medium">${p.grossPrice.toFixed(2)}</td>
                    <td className="text-right px-4 py-2.5 text-text-secondary">${p.marketAvg.toFixed(2)}</td>
                    <td className="text-right px-4 py-2.5 text-text-muted">${p.cost.toFixed(2)}</td>
                    <td className="text-right px-4 py-2.5 text-accent-green font-medium">${p.netPerUnit.toFixed(2)}</td>
                    <td className="text-right px-4 py-2.5">
                      <span className={`font-medium text-xs ${gap > 3 ? 'text-accent-gold' : gap < -3 ? 'text-accent-blue' : 'text-text-secondary'}`}>
                        {gap >= 0 ? '+' : ''}{gap.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active discounts + Category pricing side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active discounts */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-4">Active Discounts</h2>
          <div className="space-y-3">
            {PROMOTIONS.map((p) => {
              const vc = { Keep: 'var(--color-accent-green)', Optimize: 'var(--color-accent-gold)', Kill: 'var(--color-accent-red)' };
              return (
                <div key={p.name} className="flex items-center justify-between py-2 border-b border-surface-divider last:border-0">
                  <div>
                    <span className="text-text-primary font-medium text-sm">{p.name}</span>
                    <p className="text-text-muted text-xs">{p.discountAmount} · {p.redemptions} redemptions</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`font-bold text-sm ${p.roi >= 1.5 ? 'text-accent-green' : p.roi < 1 ? 'text-accent-red' : 'text-accent-gold'}`}>{p.roi}x ROI</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: vc[p.verdict], background: `color-mix(in srgb, ${vc[p.verdict]} 12%, transparent)` }}>{p.verdict}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category pricing */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-4">Category Pricing vs Market</h2>
          <div className="space-y-3">
            {CATEGORY_PRICING.map((c) => {
              const gap = ((c.avgGross - c.marketAvg) / c.marketAvg * 100);
              return (
                <div key={c.category} className="flex items-center gap-3 py-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-text-secondary text-sm w-24 flex-shrink-0">{c.category}</span>
                  <div className="flex-1 flex items-center gap-3 text-xs">
                    <span className="text-text-primary font-medium w-14">${c.avgGross.toFixed(2)}</span>
                    <span className="text-text-muted">vs ${c.marketAvg.toFixed(2)}</span>
                    <span className={`font-bold ${gap > 3 ? 'text-accent-gold' : gap < -3 ? 'text-accent-blue' : 'text-text-secondary'}`}>
                      {gap >= 0 ? '+' : ''}{gap.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-text-muted text-xs w-24 text-right">{c.monthlyRevenue}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-accent-green/[0.06] rounded-xl border border-accent-green/[0.15] p-6">
        <h2 className="text-accent-green font-semibold text-lg mb-3 flex items-center gap-2"><Zap className="w-5 h-5" /> Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-text-primary font-medium text-sm">Adjust Prices Above Market</p>
            <p className="text-text-secondary text-xs">3 products are 8%+ above regional average — review and align</p>
            <Link to="/agents/pricing" className="text-accent-green text-xs font-semibold hover:underline inline-flex items-center gap-1">Open Agent <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-1">
            <p className="text-text-primary font-medium text-sm">Cut Underperforming Discounts</p>
            <p className="text-text-secondary text-xs">$4,320/mo spent on discounts with sub-1x ROI</p>
            <Link to="/agents/pricing" className="text-accent-green text-xs font-semibold hover:underline inline-flex items-center gap-1">Open Agent <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-1">
            <p className="text-text-primary font-medium text-sm">Create a New Discount</p>
            <p className="text-text-secondary text-xs">Set up a new promo and launch a marketing campaign</p>
            <Link to="/agents/pricing" className="text-accent-green text-xs font-semibold hover:underline inline-flex items-center gap-1">Open Agent <ArrowRight className="w-3 h-3" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRICING AGENT CHAT (mode === 'agent')
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

function PricingAgentChat() {
  const { startThinking, stopThinking } = useNexusState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync NexusIcon thinking state with isTyping
  useEffect(() => {
    if (isTyping) startThinking();
    else stopThinking();
    return () => stopThinking();
  }, [isTyping, startThinking, stopThinking]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const viewComponents = {
    market_comparison: MarketComparisonView,
    price_cost_overview: PriceCostView,
    discount_review: DiscountReviewView,
    price_scenarios: PriceScenariosView,
    change_prices: ChangePricesView,
    create_discount: CreateDiscountView,
  };

  const handleSuggestion = async (suggestion) => {
    setMessages(prev => [...prev, { role: 'user', text: suggestion.label }]);
    setIsTyping(true);

    // Show fallback view immediately with static data after brief UX delay
    await new Promise(r => setTimeout(r, 800));
    setIsTyping(false);
    setMessages(prev => [...prev, {
      role: 'agent',
      text: `Here's your **${suggestion.label}** based on current data:`,
      component: suggestion.id,
      data: null,
    }]);

    // Then try to enhance with AI data in the background
    if (isGeminiAvailable()) {
      try {
        const analysis = await generatePricingAnalysis(suggestion.label);
        if (analysis && analysis.title) {
          setMessages(prev => {
            // Replace the last agent message with AI-enhanced version
            const updated = [...prev];
            const lastAgentIdx = updated.map(m => m.role).lastIndexOf('agent');
            if (lastAgentIdx >= 0) {
              updated[lastAgentIdx] = {
                role: 'agent',
                text: `Here's your **${analysis.title}** analysis:`,
                component: analysis.workflowType,
                data: analysis,
              };
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('[PricingAgent] AI enhancement failed:', err);
        // Fallback view is already showing — no action needed
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 600));

    // Show fallback view immediately based on keywords
    const lower = text.toLowerCase();
    let fallbackComponent = 'market_comparison';
    if (/cost|net|gross|revenue per/.test(lower)) fallbackComponent = 'price_cost_overview';
    else if (/discount|promo|coupon|roi|deal/.test(lower)) fallbackComponent = 'discount_review';
    else if (/scenario|what.if|model|simul/.test(lower)) fallbackComponent = 'price_scenarios';
    else if (/change|raise|lower|adjust|update.*price/.test(lower)) fallbackComponent = 'change_prices';
    else if (/create|new|add.*discount|new.*promo|set up/.test(lower)) fallbackComponent = 'create_discount';

    setIsTyping(false);
    setMessages(prev => [...prev, {
      role: 'agent',
      text: `Here's a pricing analysis based on your current data:`,
      component: fallbackComponent,
      data: null,
    }]);

    // Then try to enhance with AI in the background
    if (isGeminiAvailable()) {
      try {
        const analysis = await generatePricingAnalysis(text);
        if (analysis && analysis.title) {
          setMessages(prev => {
            const updated = [...prev];
            const lastAgentIdx = updated.map(m => m.role).lastIndexOf('agent');
            if (lastAgentIdx >= 0) {
              updated[lastAgentIdx] = {
                role: 'agent',
                text: `Here's your **${analysis.title}** analysis:`,
                component: analysis.workflowType,
                data: analysis,
              };
            }
            return updated;
          });
          return;
        }

        // Fall back to text response if structured analysis failed
        const responseText = await generatePricingResponse(text);
        if (responseText) {
          setMessages(prev => {
            const updated = [...prev];
            const lastAgentIdx = updated.map(m => m.role).lastIndexOf('agent');
            if (lastAgentIdx >= 0) {
              updated[lastAgentIdx] = { role: 'agent', text: responseText };
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('[PricingAgent] AI enhancement failed:', err);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col flex-1 min-h-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center">
          <CircleDollarSign className="w-4 h-4 text-accent-green" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Pricing Agent</h1>
          <p className="text-xs text-text-secondary">Pricing & Margins — Dutchie AI</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center py-6 lg:py-12" style={{ minHeight: 200 }}>
            <div className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center mb-4" style={{ background: 'var(--color-surface-bg)', boxShadow: '0 0 24px color-mix(in srgb, var(--color-accent-gold) 15%, transparent), 0 0 8px color-mix(in srgb, var(--color-accent-gold) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 20%, transparent)' }}>
              <NexusIcon size={30} />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-1.5 text-center">Pricing Agent</h2>
            <p className="text-[13px] text-text-secondary text-center max-w-[400px] leading-relaxed">
              Optimize margins with market intelligence, competitive pricing, and dynamic discount strategies.
            </p>
          </div>
        )}

        {!isTyping && messages.length === 0 && (
          <div className="pt-2 animate-fade-in">
            <p className="text-xs text-text-secondary mb-3 ml-11">Try one of these scenarios</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <TiltCard key={s.id}>
                  <button
                    onClick={() => handleSuggestion(s)}
                    className="group text-left w-full bg-surface-card border border-surface-border rounded-xl p-4 transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}>
                        <s.icon className="w-4 h-4 text-text-primary" />
                      </div>
                      {s.tag && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-surface-border" style={{ color: s.tagColor }}>{s.tag}</span>}
                    </div>
                    <p className="text-sm font-medium text-text-primary">{s.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{s.desc}</p>
                  </button>
                </TiltCard>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'agent' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-bg)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 20%, transparent)' }}>
                <NexusIcon size={16} />
              </div>
            )}
            <div className={`max-w-2xl ${msg.role === 'user' ? '' : ''}`}>
              <div className={`rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-accent-gold/15 border border-accent-gold/20 text-text-primary rounded-tr-sm'
                  : 'bg-surface-card/80 border border-surface-border/60 text-text-primary rounded-tl-sm'
              }`}>
              {msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong> : part)}
              </div>
              {msg.component && viewComponents[msg.component] && (
                <div className="mt-3">
                  <div className="max-w-[780px] mx-auto rounded-xl border border-surface-border bg-surface-card overflow-hidden overflow-x-auto">
                    <div className="p-1">
                      {React.createElement(viewComponents[msg.component], { data: msg.data, onBack: null })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="nexus-input-glass flex items-center gap-3 bg-surface-card border border-surface-border rounded-2xl px-5 py-3.5 shadow-card focus-within:border-accent-green/50 transition-all duration-200 mb-14 lg:mb-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your prices, discounts, market comparison..."
          className="flex-1 bg-transparent text-base lg:text-sm text-text-primary placeholder-text-muted outline-none"
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-9 h-9 rounded-xl bg-accent-green flex items-center justify-center text-white disabled:opacity-30 hover:brightness-110 transition-all disabled:hover:bg-accent-green shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════ */

export default function PricingAgent({ mode = 'agent' }) {
  if (mode === 'dashboard') return <PricingDashboard />;
  return <PricingAgentChat />;
}
