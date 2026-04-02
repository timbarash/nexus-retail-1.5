import NexusIcon from '../components/NexusIcon';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useNexusState } from '../contexts/NexusStateContext';
import { TiltCard } from '../components/common/TiltCard';
import {
  Bot, Sparkles, Send, ArrowLeft, Megaphone, UserX, Cake, Clock,
  Target, Mail, Smartphone, Bell, BarChart3, Users, DollarSign,
  CheckCircle2, ChevronRight, Zap, TrendingUp, Gift, Star, Hash,
  ShoppingBag, Heart, Calendar, MapPin, Tag, Settings, Sliders,
  Shield, Eye, Copy, FlaskConical, ChevronDown, ChevronUp, Store,
  Percent, Award, AlertCircle, Lock, Globe, Image, Type, ToggleLeft,
  Layers, Filter, X, Check, RefreshCw, Package, AlertTriangle,
  Maximize2, Save, ExternalLink, GitBranch, MessageSquare, Leaf,
  FileDown
} from 'lucide-react';
// import { generateMarketingResponse, generateMarketingCampaignPlan, isGeminiAvailable } from '../utils/gemini';
import { brandImg } from '../utils/helpers';
import ConfirmationDrawer from '../components/common/ConfirmationDrawer';
import { useActionLog } from '../contexts/ActionLogContext';

/* ═══════════════════════════════════════════════════════════════════
   ICON MAP & RESOLVER
   ═══════════════════════════════════════════════════════════════════ */

const ICON_MAP = {
  Star, Heart, Cake, Zap, Calendar, Package, Gift, Megaphone,
  ShoppingBag, Tag, Sparkles, Target, Mail, Smartphone, Bell,
  TrendingUp, DollarSign, BarChart3, Award, Percent, RefreshCw,
  Users, MapPin, Shield, Clock, Eye, Store, Filter, Layers,
};

function resolveIcon(icon) {
  if (typeof icon === 'function') return icon;
  return ICON_MAP[icon] || Sparkles;
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT INVENTORY — used to check stock before campaign launch
   ═══════════════════════════════════════════════════════════════════ */

const PRODUCT_INVENTORY = [
  { brand: 'Jeeter', name: 'Baby Jeeter Infused', strain: 'Churros', currentStock: 8, avgWeeklySales: 56 },
  { brand: 'Jeeter', name: 'Baby Jeeter Infused', strain: 'Honeydew', currentStock: 14, avgWeeklySales: 34 },
  { brand: 'Jeeter', name: 'Jeeter Juice', strain: 'Blue Zkittlez', currentStock: 22, avgWeeklySales: 28 },
  { brand: 'Jeeter', name: 'Jeeter XL Infused', strain: 'Horchata', currentStock: 6, avgWeeklySales: 18 },
  { brand: 'STIIIZY', name: 'STIIIZY OG Kush Pod', strain: null, currentStock: 0, avgWeeklySales: 42 },
  { brand: 'Kiva', name: 'Camino Pineapple Habanero Gummies', strain: null, currentStock: 0, avgWeeklySales: 38 },
  { brand: 'Raw Garden', name: 'Refined Live Resin Cart', strain: 'Slippery Susan', currentStock: 0, avgWeeklySales: 28 },
  { brand: 'Wyld', name: 'Elderberry Gummies', strain: 'Indica', currentStock: 0, avgWeeklySales: 22 },
  { brand: 'Cookies', name: 'Gary Payton', strain: null, currentStock: 18, avgWeeklySales: 24 },
  { brand: 'PLUS', name: 'Dual Chamber Gummies', strain: null, currentStock: 32, avgWeeklySales: 16 },
];

function getInventoryForProducts(featuredProducts) {
  if (!featuredProducts) return [];
  return featuredProducts.map(fp => {
    const match = PRODUCT_INVENTORY.find(inv =>
      fp.name.includes(inv.name) || inv.name.includes(fp.name)
    );
    if (!match) return null;
    const dailySales = match.avgWeeklySales / 7;
    const daysOfSupply = dailySales > 0 ? Math.round(match.currentStock / dailySales) : 999;
    return { ...fp, ...match, daysOfSupply, dailySales };
  }).filter(p => p && p.daysOfSupply < 30);
}

/* ═══════════════════════════════════════════════════════════════════
   CAMPAIGN DATA
   ═══════════════════════════════════════════════════════════════════ */

export const CAMPAIGNS = {
  jeeter: {
    title: 'Brand Funded Discount: Jeeter',
    subtitle: 'Brand-sponsored promotion with Jeeter-funded discount for your most engaged customers',
    icon: 'Star',
    accentFrom: '#7B2D8E',
    accentTo: '#4F46E5',
    heroGradient: 'from-purple-900/60 via-indigo-900/40 to-violet-900/60',
    heroBorder: 'border-purple-500/30',
    heroTag: 'Brand Funded',
    campaignType: 'one-time',
    triggerType: null,
    heroImage: brandImg('/brands/jeeter-infused-cover.webp'),
    audience: {
      size: '12,847',
      description: 'Customers who have purchased Jeeter products in the past 90 days, most commonly bought category is pre-rolls, or total spend > $200. Segmented using AND/OR logic.',
      segments: [
        { name: 'Jeeter Loyalists', count: '4,210', desc: 'Most commonly bought brand: Jeeter' },
        { name: 'Pre-Roll Enthusiasts', count: '5,890', desc: 'Most commonly bought category: pre-rolls' },
        { name: 'High-Spend Browsers', count: '2,747', desc: 'Total spend > $200, avg days between purchases < 30' },
      ],
    },
    channels: [
      { name: 'Email', icon: 'Mail', reach: '11,400', rate: '38%', metric: 'open rate', cost: '$0.003/msg', status: 'GA' },
      { name: 'SMS', icon: 'Smartphone', reach: '9,200', rate: '94%', metric: 'open rate', cost: '$0.015/msg', complianceNote: 'TCPA compliant — opt-in verified' },
      { name: 'Push Notification', icon: 'Bell', reach: '6,100', rate: '12%', metric: 'tap rate', cost: 'Free', note: 'Via Dutchie mobile app' },
    ],
    isWaterfall: false,
    schedule: {
      sendType: 'Schedule for later',
      launch: 'Friday, March 6 · 10:00 AM PT',
      duration: '7 days',
      smartSending: 'Optimize per customer timezone',
      followUp: 'Non-openers get SMS reminder on Day 3. Non-converters get "last chance" on Day 6.',
    },
    discountType: 'Sale',
    discountDetail: '15% off — Brand Funded by Jeeter',
    content: {
      headline: 'The Jeeter Drop You\'ve Been Waiting For 🔥',
      preheader: 'Baby Jeeter Churros + new Jeeter Juice flavors just landed',
      body: 'New Baby Jeeter Infused pre-rolls in Churros and Honeydew just hit the shelves at Ascend — plus Jeeter Juice Liquid Diamonds in Blue Zkittlez. As a Jeeter fan, you get early access and 15% off your first Jeeter pickup this weekend.',
      cta: 'Shop Jeeter Now →',
      offer: '15% off all Jeeter products — Brand Funded Sale discount — code JEETER15 — valid 7 days',
      finePrint: 'Limit one use per customer. Cannot be combined with other offers. Must be 21+.',
      smsPreview: 'Ascend: New Jeeter just dropped 🔥 Baby Jeeter Churros + Jeeter Juice Blue Zkittlez. Get 15% off with code JEETER15.',
    },
    smsMessages: [
      'Ascend: New Jeeter just dropped 🔥 Baby Jeeter Churros + Jeeter Juice Blue Zkittlez. Get 15% off this weekend with code JEETER15. Shop now → ascendwellness.com/jeeter',
      'Reply STOP to opt out',
    ],
    featuredProducts: [
      {
        name: 'Baby Jeeter Infused',
        type: '5pk Pre-Rolls · 2.5g',
        strain: 'Churros',
        thc: '46%',
        price: '$25.00',
        category: 'Infused Pre-Roll',
        badgeColor: '#9333EA',
        badgeText: 'BEST SELLER',
        image: brandImg('/brands/jeeter-baby-churros.webp'),
      },
      {
        name: 'Jeeter Juice',
        type: 'Liquid Diamonds · 1g Cart',
        strain: 'Blue Zkittlez',
        thc: '84%',
        price: '$45.00',
        category: 'Vape Cartridge',
        badgeColor: '#2563EB',
        badgeText: 'NEW',
        image: brandImg('/brands/jeeter-juice.webp'),
      },
      {
        name: 'Baby Jeeter Infused',
        type: '5pk Pre-Rolls · 2.5g',
        strain: 'Honeydew',
        thc: '41%',
        price: '$25.00',
        category: 'Infused Pre-Roll',
        badgeColor: '#16A34A',
        badgeText: 'POPULAR',
        image: brandImg('/brands/jeeter-baby-honeydew.webp'),
      },
      {
        name: 'Jeeter XL Infused',
        type: 'Pre-Roll · 2g',
        strain: 'Horchata',
        thc: '38%',
        price: '$22.00',
        category: 'Infused Pre-Roll',
        badgeColor: '#EA580C',
        badgeText: 'STAFF PICK',
        image: brandImg('/brands/jeeter-xl-horchata.webp'),
      },
    ],
    abTests: [
      { variant: 'A', subject: 'The Jeeter Drop You\'ve Been Waiting For 🔥', split: 50 },
      { variant: 'B', subject: 'New Baby Jeeter Churros Just Landed — 15% Off', split: 50 },
    ],
    projections: {
      revenue: '$18,400 — $24,200',
      orders: '340 — 480',
      roi: '2.8x',
      reactivated: '~120 lapsed customers',
      aov: '$52.40',
      redemptionRate: '14.2%',
    },
    locationTargeting: [
      { name: 'Ascend — Logan Square', id: 'logan-square', count: '4,200' },
      { name: 'Ascend — Fort Lee', id: 'fort-lee', count: '3,600' },
      { name: 'Ascend — Boston', id: 'boston', count: '3,100' },
      { name: 'Ascend — Detroit', id: 'detroit', count: '2,800' },
    ],
  },

  winback: {
    title: 'Win Back: "We Miss You" Re-Engagement',
    subtitle: 'Automated re-engagement triggered when customers enter the lapsed segment',
    icon: 'Heart',
    accentFrom: '#DC2626',
    accentTo: '#EA580C',
    heroGradient: 'from-red-900/60 via-orange-900/40 to-amber-900/60',
    heroBorder: 'border-red-500/30',
    heroTag: 'EnteredSegment Trigger',
    campaignType: 'automated',
    triggerType: 'EnteredSegment',
    triggerSegment: 'Lapsed Customers',
    audience: {
      size: '4,312',
      description: 'Triggers when customers enter the "Lapsed" segment — avg days between purchases exceeded by 2x, total spend > $80, 2+ orders. Uses AND logic combining behavioral and demographic rules.',
      segments: [
        { name: '60-90 Day Lapsed', count: '2,840', desc: 'Avg days between purchases exceeded, total spend > $80' },
        { name: '90-120 Day Lapsed', count: '1,472', desc: 'Lapsed VIP / win-back segment, high historical AOV' },
        { name: 'VIP Lapsed', count: '380', desc: '10+ lifetime orders, loyalty tier: VIP, is loyalty member' },
      ],
    },
    channels: [
      { name: 'Email', icon: 'Mail', reach: '4,100', rate: '28%', metric: 'open rate', cost: '$0.003/msg', status: 'GA' },
      { name: 'SMS', icon: 'Smartphone', reach: '3,800', rate: '91%', metric: 'open rate', cost: '$0.015/msg', complianceNote: 'TCPA compliant — opt-in verified' },
      { name: 'Push Notification', icon: 'Bell', reach: '2,200', rate: '8%', metric: 'tap rate', cost: 'Free', note: 'Via Dutchie mobile app' },
    ],
    isWaterfall: true,
    waterfallOrder: 'Email → SMS → Push cascade',
    schedule: {
      sendType: 'Automated — on segment entry',
      timeDelay: '2 hours after entering segment',
      duration: '14 days (3-touch escalation)',
      smartSending: 'Optimize per customer timezone',
      followUp: 'Day 1: 10% off → Day 7: 20% off → Day 12: 25% off + free delivery',
    },
    discountType: 'Advanced',
    discountDetail: 'Escalating discount: 10% → 20% → 25% off + free delivery',
    content: {
      headline: 'It\'s Been a While — We Saved Something for You',
      preheader: 'Your favorites are waiting + a special offer inside',
      body: 'Hey {first_name}, we noticed it\'s been a minute! Since your last visit, we\'ve added 40+ new products including top-rated Kiva edibles, new STIIIZY pods, and fresh flower drops. Here\'s a personalized offer based on what you used to love:',
      cta: 'See What\'s New →',
      offer: 'Escalating: 10% → 20% → 25% off + free delivery',
      finePrint: 'Offers valid for single use. Each escalation replaces the previous. Must be 21+.',
      smsPreview: 'Hey! 👋 It\'s been a while since your last visit to Ascend. We\'ve got 40+ new products — plus here\'s 20% off your next order.',
    },
    smsMessages: [
      'Hey! 👋 It\'s been a while since your last visit to Ascend. We\'ve got 40+ new products — plus here\'s 20% off your next order. See what\'s new → ascendwellness.com/welcome-back',
      'Reply STOP to opt out',
    ],
    personalizedProducts: [
      { name: 'Based on your history', items: ['STIIIZY OG Kush Pod', 'Kiva Camino Gummies', 'Raw Garden Refined Live Resin'] },
      { name: 'New since you left', items: ['Alien Labs Xeno', 'Jeeter Juice Liquid Diamonds', 'PLUS Dual Chamber Gummies'] },
    ],
    abTests: [
      { variant: 'A', subject: 'It\'s Been a While — We Saved Something for You', split: 33 },
      { variant: 'B', subject: 'Your 20% Off is About to Expire ⏰', split: 33 },
      { variant: 'C', subject: '{first_name}, We Miss You at Ascend', split: 34 },
    ],
    projections: {
      revenue: '$9,800 — $14,600',
      orders: '210 — 340',
      roi: '2.2x',
      reactivated: '~280 customers',
      aov: '$48.20',
      redemptionRate: '11.8%',
    },
    locationTargeting: [
      { name: 'Ascend — Logan Square', id: 'logan-square', count: '1,400' },
      { name: 'Ascend — Fort Lee', id: 'fort-lee', count: '1,200' },
      { name: 'Ascend — Boston', id: 'boston', count: '980' },
      { name: 'Ascend — Detroit', id: 'detroit', count: '732' },
    ],
  },

  birthday: {
    title: 'Birthday Rewards: Loyalty Celebration',
    subtitle: 'Automated UpcomingBirthday trigger with tier-based loyalty rewards',
    icon: 'Cake',
    accentFrom: '#EC4899',
    accentTo: '#8B5CF6',
    heroGradient: 'from-pink-900/60 via-fuchsia-900/40 to-purple-900/60',
    heroBorder: 'border-pink-500/30',
    heroTag: 'UpcomingBirthday Trigger',
    campaignType: 'automated',
    triggerType: 'UpcomingBirthday',
    audience: {
      size: '~890/month',
      description: 'Active loyalty members with verified birthdays on file. UpcomingBirthday trigger fires 3 days before each customer\'s birthday. Filtered by: is loyalty member = true, loyalty tier, point balance > 0. Rewards scale by tier — Standard, Gold, and VIP.',
      segments: [
        { name: 'Standard Members', count: '~520/mo', desc: 'Loyalty tier: Standard, point balance > 0' },
        { name: 'Gold Members', count: '~290/mo', desc: 'Loyalty tier: Gold, total spend > $500' },
        { name: 'VIP Members', count: '~80/mo', desc: 'Loyalty tier: VIP, 10+ lifetime orders' },
      ],
    },
    channels: [
      { name: 'Email', icon: 'Mail', reach: '870/mo', rate: '52%', metric: 'open rate', cost: '$0.003/msg', status: 'GA' },
      { name: 'SMS', icon: 'Smartphone', reach: '820/mo', rate: '96%', metric: 'open rate', cost: '$0.015/msg', complianceNote: 'TCPA compliant — opt-in verified' },
      { name: 'Push Notification', icon: 'Bell', reach: '540/mo', rate: '18%', metric: 'tap rate', cost: 'Free', note: 'Via Dutchie mobile app' },
    ],
    isWaterfall: true,
    waterfallOrder: 'Email → SMS → Push cascade',
    schedule: {
      sendType: 'Automated — UpcomingBirthday trigger',
      timeDelay: '3 days before birthday',
      duration: '10-day redemption window',
      smartSending: '10:00 AM customer local time',
      followUp: 'Birthday day: "Happy Birthday!" · Day 8: "2 days left to redeem"',
    },
    discountType: 'Loyalty Award',
    discountDetail: 'Tier-based: Loyalty Multiplier + free product by tier',
    content: {
      headline: 'Happy Birthday, {first_name}! 🎂 Your Gift is Ready',
      preheader: 'A special birthday reward from Ascend — just for you',
      body: 'Your birthday is almost here and we want to celebrate with you! As a {tier_name} loyalty member, here\'s your exclusive birthday reward — on us. Stop by any Ascend location within the next 10 days to claim it.',
      cta: 'Claim My Birthday Gift →',
      offer: 'Tier-based: Free pre-roll to free 1/4oz + 15-30% off',
      finePrint: 'One birthday reward per member per year. Must present loyalty card or app. Must be 21+.',
      smsPreview: 'Happy early birthday! 🎂 Your gift from Ascend is ready: a FREE pre-roll + 15% off your entire order.',
    },
    smsMessages: [
      'Happy early birthday! 🎂 Your gift from Ascend is ready: a FREE pre-roll + 15% off your entire order. Valid for 10 days. Claim it → ascendwellness.com/birthday',
      'Reply STOP to opt out',
    ],
    tierRewards: [
      { tier: 'Standard', reward: 'Free Pre-Roll', discount: '15% off entire order', color: 'var(--color-text-secondary)' },
      { tier: 'Gold', reward: 'Free 1/8th', discount: '20% off entire order', color: 'var(--color-accent-gold)' },
      { tier: 'VIP', reward: 'Free 1/4oz + Merch Pack', discount: '30% off entire order', color: 'var(--color-accent-purple)' },
    ],
    abTests: [
      { variant: 'A', subject: 'Happy Birthday, {first_name}! 🎂 Your Gift is Ready', split: 50 },
      { variant: 'B', subject: '🎁 {first_name}, Unwrap Your Birthday Reward', split: 50 },
    ],
    projections: {
      revenue: '$6,200 — $8,400/mo',
      orders: '180 — 260/mo',
      roi: '3.5x',
      reactivated: '~45 first-time loyalty redemptions/mo',
      aov: '$62.30',
      redemptionRate: '34.5%',
    },
    locationTargeting: [
      { name: 'Ascend — Logan Square', id: 'logan-square', count: '280/mo' },
      { name: 'Ascend — Fort Lee', id: 'fort-lee', count: '250/mo' },
      { name: 'Ascend — Boston', id: 'boston', count: '210/mo' },
      { name: 'Ascend — Detroit', id: 'detroit', count: '150/mo' },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════
   CAMPAIGN BASELINES — numeric values for dynamic projection engine
   ═══════════════════════════════════════════════════════════════════ */

const CAMPAIGN_BASELINES = {
  jeeter: {
    baseAudienceSize: 12847,
    baseRevenueLow: 18400, baseRevenueHigh: 24200,
    baseOrdersLow: 340, baseOrdersHigh: 480,
    baseROI: 2.8, baseAOV: 52.40,
    channelCosts: { SMS: 0.015, Email: 0.003, Push: 0, 'Push Notification': 0 },
    channelReach: { SMS: 0.716, Email: 0.887, Push: 0.475, 'Push Notification': 0.475 },
    channelConversionRate: { SMS: 0.038, Email: 0.012, Push: 0.006, 'Push Notification': 0.006 },
    locationWeights: { 'logan-square': 0.33, 'fort-lee': 0.30, boston: 0.21, detroit: 0.16 },
  },
  winback: {
    baseAudienceSize: 4312,
    baseRevenueLow: 9800, baseRevenueHigh: 14600,
    baseOrdersLow: 210, baseOrdersHigh: 340,
    baseROI: 2.2, baseAOV: 48.20,
    channelCosts: { SMS: 0.015, Email: 0.003, Push: 0, 'Push Notification': 0 },
    channelReach: { SMS: 0.881, Email: 0.950, Push: 0.510, 'Push Notification': 0.510 },
    channelConversionRate: { SMS: 0.032, Email: 0.009, Push: 0.004, 'Push Notification': 0.004 },
    locationWeights: { 'logan-square': 0.32, 'fort-lee': 0.28, boston: 0.23, detroit: 0.17 },
  },
  birthday: {
    baseAudienceSize: 890,
    baseRevenueLow: 6200, baseRevenueHigh: 8400,
    baseOrdersLow: 180, baseOrdersHigh: 260,
    baseROI: 3.5, baseAOV: 62.30,
    channelCosts: { SMS: 0.015, Email: 0.003, Push: 0, 'Push Notification': 0 },
    channelReach: { SMS: 0.921, Email: 0.978, Push: 0.607, 'Push Notification': 0.607 },
    channelConversionRate: { SMS: 0.042, Email: 0.018, Push: 0.008, 'Push Notification': 0.008 },
    locationWeights: { 'logan-square': 0.31, 'fort-lee': 0.28, boston: 0.24, detroit: 0.17 },
  },
};

/* ═══════════════════════════════════════════════════════════════════
   UNIFIED PRODUCT CARD
   ═══════════════════════════════════════════════════════════════════ */

function ProductCard({ product, accentColor }) {
  const accent = accentColor || product.badgeColor || 'var(--color-accent-purple)';
  return (
    <div className="bg-surface-bg rounded-lg border border-surface-border overflow-hidden transition-all duration-200 group hover:border-accent-green/30">
      {/* Product visual */}
      <div className="relative h-36 overflow-hidden" style={{ background: product.image ? '#1a0a2e' : `linear-gradient(135deg, color-mix(in srgb, ${accent} 13%, transparent), color-mix(in srgb, ${accent} 7%, transparent))` }}>
        {product.image ? (
          <img src={product.image} alt={`${product.name} ${product.strain || ''}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-10 h-10" style={{ color: `color-mix(in srgb, ${accent} 25%, transparent)` }} />
          </div>
        )}
        {/* Badge */}
        {product.badgeText && (
          <div className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white shadow-lg" style={{ background: product.badgeColor || accent }}>
            {product.badgeText}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5">
        {product.category && <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: accent }}>{product.category}</p>}
        <p className="text-[13px] font-semibold text-text-primary">{product.name}</p>
        <p className="text-[11px] text-text-secondary mt-0.5">{product.type}</p>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-surface-divider">
          <div className="flex items-center gap-2">
            {product.strain && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}>{product.strain}</span>}
            {product.thc && <span className="text-[10px] text-text-muted font-medium">THC {product.thc}</span>}
          </div>
          {product.price && <span className="text-[13px] font-bold text-text-primary">{product.price}</span>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PHONE MOCKUP for SMS preview
   ═══════════════════════════════════════════════════════════════════ */

function PhoneMockup({ messages, brandColor }) {
  return (
    <div className="relative mx-auto" style={{ width: '220px' }}>
      {/* Phone bezel */}
      <div className="rounded-[24px] border-2 border-surface-border bg-surface-bg p-2 shadow-2xl">
        {/* Notch */}
        <div className="flex justify-center mb-1">
          <div className="w-16 h-4 rounded-full bg-surface-bg" />
        </div>
        {/* Screen */}
        <div className="bg-surface-bg rounded-[16px] p-3 min-h-[240px]">
          <div className="text-center mb-3">
            <p className="text-[9px] text-text-secondary">Today 10:02 AM</p>
          </div>
          {messages.map((msg, i) => (
            <div key={i} className="mb-2">
              <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-[11px] leading-relaxed" style={{
                background: `color-mix(in srgb, ${brandColor || 'var(--color-accent-purple)'} 13%, transparent)`,
                border: `1px solid color-mix(in srgb, ${brandColor || 'var(--color-accent-purple)'} 20%, transparent)`,
                color: 'var(--color-text-primary)',
              }}>
                {msg}
              </div>
            </div>
          ))}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-7 rounded-full bg-surface-card border border-surface-border" />
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: brandColor || 'var(--color-accent-purple)' }}>
              <ChevronRight className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EMAIL PREVIEW MOCKUP
   ═══════════════════════════════════════════════════════════════════ */

function EmailPreview({ data }) {
  const c = data;
  const content = c.content || {};
  return (
    <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
      {/* Email client chrome */}
      <div className="px-4 py-2.5 border-b border-surface-divider flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-red" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-green" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-text-secondary">Ascend &lt;hello@ascendwellness.com&gt;</span>
        </div>
      </div>
      {/* Subject */}
      <div className="px-4 py-2 border-b border-surface-divider">
        <p className="text-xs font-semibold text-text-primary">{content.headline || ''}</p>
        <p className="text-xs text-text-secondary">{content.preheader || ''}</p>
      </div>
      {/* Body */}
      <div className="p-4">
        {/* Hero banner */}
        <div className="rounded-lg overflow-hidden mb-3 h-28 flex items-center justify-center relative" style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${c.accentFrom || 'var(--color-accent-purple)'} 27%, transparent), color-mix(in srgb, ${c.accentTo || 'var(--color-accent-blue)'} 27%, transparent))`,
        }}>
          {c.heroImage ? (
            <img src={c.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          ) : (
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, ${c.accentFrom || 'var(--color-accent-purple)'} 0%, transparent 50%)`,
            }} />
          )}
          <div className="relative text-center">
            <p className="text-2xl font-bold text-text-primary">{(content.headline || '').replace(/ 🔥| 🎂/g, '')}</p>
            <p className="text-[10px] text-text-secondary mt-1">{content.offer || ''}</p>
          </div>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{(content.body || '').substring(0, 120)}...</p>
        <div className="text-center">
          <span className="inline-block text-[11px] px-5 py-2 rounded-full font-semibold text-white" style={{
            background: `linear-gradient(135deg, ${c.accentFrom || 'var(--color-accent-purple)'}, ${c.accentTo || 'var(--color-accent-blue)'})`,
          }}>{content.cta || 'Shop Now'}</span>
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
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 hover:bg-surface-hover transition-colors"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${iconColor || 'var(--color-accent-green)'} 10%, transparent)` }}>
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: iconColor }} />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {badge && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green uppercase tracking-wider">{badge}</span>}
        <div className="ml-auto">
          {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>
      {open && <div className="px-3.5 pb-3 border-t border-surface-divider pt-2.5">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOW STOCK ALERT — warns when featured products have < 30 days supply
   ═══════════════════════════════════════════════════════════════════ */

function LowStockAlert({ featuredProducts }) {
  const lowStockItems = useMemo(() => getInventoryForProducts(featuredProducts), [featuredProducts]);
  const [dismissed, setDismissed] = useState(false);

  if (!lowStockItems.length || dismissed) return null;

  return (
    <div className="bg-accent-gold/[0.08] border border-accent-gold/30 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-accent-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-3.5 h-3.5 text-accent-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-accent-gold">Low Inventory Alert</h3>
            <button onClick={() => setDismissed(true)} className="text-text-muted hover:text-text-secondary transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-text-primary mb-3">
            {lowStockItems.length} featured product{lowStockItems.length !== 1 ? 's have' : ' has'} less than 30 days of inventory. If this campaign is successful, you could run out of stock.
          </p>
          <div className="space-y-2 mb-4">
            {lowStockItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-bg/60 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />
                  <span className="text-xs text-text-primary font-medium truncate">{item.name}{item.strain ? ` — ${item.strain}` : ''}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-text-secondary">{item.currentStock} units left</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    item.daysOfSupply <= 3 ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-gold/15 text-accent-gold'
                  }`}>
                    {item.daysOfSupply === 0 ? 'Out of stock' : `~${item.daysOfSupply}d supply`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/agents/connect"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-gold hover:brightness-110 text-white shadow-sm shadow-accent-gold/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reorder low stock so you don't run out
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CAMPAIGN PLAN VIEW (unified — handles both preset and AI data)
   ═══════════════════════════════════════════════════════════════════ */

export function CampaignPlan({ data, onBack }) {
  const { logAction } = useActionLog();
  const c = data;
  const Icon = resolveIcon(c.icon);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState(['all']);
  const [abEnabled, setAbEnabled] = useState(true);
  const [testSent, setTestSent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  // Full-screen modal editable fields
  const [fsName, setFsName] = useState(c.title || '');
  const [fsSubtitle, setFsSubtitle] = useState(c.subtitle || '');

  // Editable campaign fields
  const [editAudienceSize, setEditAudienceSize] = useState(c.audience?.size || '0');
  const [editAudienceDesc, setEditAudienceDesc] = useState(c.audience?.description || '');
  const [editSegments, setEditSegments] = useState(() => (c.audience?.segments || []).map(s => ({ ...s })));
  const [editOffer, setEditOffer] = useState(c.content?.offer || '');
  const [editSchedule, setEditSchedule] = useState(() => ({ ...(c.schedule || {}) }));
  const [enabledChannels, setEnabledChannels] = useState(() => new Set((c.channels || []).map(ch => ch.name)));
  const [editRefinement, setEditRefinement] = useState(() => ({
    minAge: '21+', state: 'All States', minTotalSpend: '$0', avgDaysBetween: '< 60 days', loyaltyTier: 'Any', engagementFilter: 'Email open rate > 10%',
  }));
  const [editSmsPreview, setEditSmsPreview] = useState(c.content?.smsPreview || c.smsMessages?.[0] || 'Check out our latest deals!');

  // Detect campaign key for baselines
  const campaignKey = Object.keys(CAMPAIGNS).find(k => CAMPAIGNS[k].title === c.title);
  const baseline = CAMPAIGN_BASELINES[campaignKey] || CAMPAIGN_BASELINES.jeeter;

  // Dynamic projection engine
  const dynamicProjections = useMemo(() => {
    // Parse audience size (remove commas, ~/mo suffixes)
    const parsedAudience = parseInt(String(editAudienceSize).replace(/[^0-9]/g, '')) || baseline.baseAudienceSize;
    const audienceScale = parsedAudience / baseline.baseAudienceSize;

    // Location scale
    let locationScale = 1.0;
    if (!selectedLocations.includes('all') && selectedLocations.length > 0) {
      locationScale = selectedLocations.reduce((sum, locId) => sum + (baseline.locationWeights[locId] || 0), 0);
    } else if (selectedLocations.length === 0) {
      locationScale = 0;
    }

    // Per-channel math
    let totalChannelCost = 0;
    let totalConversions = 0;
    const channelNames = ['SMS', 'Email', 'Push', 'Push Notification'];
    channelNames.forEach(ch => {
      if (!enabledChannels.has(ch)) return;
      const reach = (baseline.channelReach[ch] || 0) * parsedAudience * locationScale;
      const cost = reach * (baseline.channelCosts[ch] || 0);
      const conversions = reach * (baseline.channelConversionRate[ch] || 0);
      totalChannelCost += cost;
      totalConversions += conversions;
    });

    const ordersLow = Math.round(totalConversions * 0.75);
    const ordersHigh = Math.round(totalConversions * 1.15);
    const aov = baseline.baseAOV;
    const revenueLow = ordersLow * aov;
    const revenueHigh = ordersHigh * aov;
    const roi = totalChannelCost > 0 ? ((revenueLow + revenueHigh) / 2) / totalChannelCost : 0;
    const reactivated = Math.round(totalConversions * 0.35);

    const fmt = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const fmtCost = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return {
      revenue: `${fmt(revenueLow)} — ${fmt(revenueHigh)}`,
      orders: `${ordersLow.toLocaleString()} — ${ordersHigh.toLocaleString()}`,
      roi: `${roi.toFixed(1)}x`,
      aov: fmtCost(aov),
      redemptionRate: `${(totalConversions / (parsedAudience * locationScale || 1) * 100).toFixed(1)}%`,
      reactivated: `~${reactivated} customers`,
      noChannels: enabledChannels.size === 0,
      noLocations: selectedLocations.length === 0,
    };
  }, [editAudienceSize, enabledChannels, selectedLocations, baseline]);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      logAction({
        type: 'campaign',
        agent: 'Marketing Agent',
        description: `Campaign package created — ${c.title}`,
        detail: `${editAudienceSize} customers, ${enabledChannels.size} channel${enabledChannels.size !== 1 ? 's' : ''}, 4 system objects`,
      });
    }, 2200);
  };

  const smsMessages = c.smsMessages || [c.content?.smsPreview || 'Check out our latest deals!', 'Reply STOP to opt out'];

  // Hero styling: use Tailwind gradient classes if available (hardcoded presets), otherwise inline styles
  const hasHeroGradient = !!c.heroGradient;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* back */}
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </button>
      )}

      {/* AI attribution */}
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-accent-green" />
        </div>
        <div>
          <p className="text-xs text-text-secondary">
            <span className="text-text-primary font-semibold">Dutchie Agent</span> generated this campaign plan based on your customer data and purchase history
          </p>
        </div>
      </div>

      {/* ───── hero ───── */}
      <div className="relative rounded-xl border border-surface-border overflow-hidden bg-surface-card" style={{ borderColor: `color-mix(in srgb, ${c.accentFrom || 'var(--color-accent-purple)'} 25%, transparent)` }}>
        {c.heroImage ? (
          <img src={c.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        ) : null}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${c.accentFrom || 'var(--color-accent-green)'} 15%, transparent), color-mix(in srgb, ${c.accentTo || 'var(--color-accent-gold)'} 10%, transparent))` }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 60%, transparent)' }} />
        <div className="relative px-3.5 py-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-full border border-white/10 text-text-secondary uppercase tracking-widest bg-surface-bg/30 backdrop-blur-sm">{c.heroTag}</span>
            {!hasHeroGradient && <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-accent-purple/15 text-accent-purple uppercase tracking-wider">AI Generated</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c.accentFrom || 'var(--color-accent-green)'}, ${c.accentTo || 'var(--color-accent-green)'})` }}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-text-primary">{fsName || c.title}</h1>
              <p className="text-xs text-text-secondary mt-0.5">{fsSubtitle || c.subtitle}</p>
            </div>
            <button
              onClick={() => setShowFullScreen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-bg/50 backdrop-blur-sm text-text-secondary border border-surface-border hover:text-text-primary hover:bg-surface-hover transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Expand
            </button>
          </div>
        </div>
      </div>

      {/* ───── Featured Products ───── */}
      {c.featuredProducts && c.featuredProducts.length > 0 && (
        <Section title="Featured Products" icon={Package} iconColor="var(--color-accent-purple)" badge={`${c.featuredProducts.length} SKUs`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {c.featuredProducts.map((p, i) => <ProductCard key={i} product={p} accentColor={c.accentFrom} />)}
          </div>
        </Section>
      )}

      {/* ───── Low Stock Alert ───── */}
      <LowStockAlert featuredProducts={c.featuredProducts} />

      {/* ───── Personalized Recommendations (re_engagement / winback) ───── */}
      {c.personalizedProducts && c.personalizedProducts.length > 0 && (
        <Section title="Personalized Product Recommendations" icon={Sparkles} iconColor="var(--color-accent-red)" badge="ML-powered">
          <p className="text-xs text-text-secondary mb-4">Each customer receives product recommendations based on their purchase history and browsing behavior.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {c.personalizedProducts.map((group, i) => (
              <div key={i} className="bg-surface-bg rounded-lg p-4 border border-surface-border">
                <p className="text-xs font-medium text-text-primary mb-3 flex items-center gap-2">
                  {i === 0 ? <Heart className="w-3.5 h-3.5 text-accent-red" /> : <Sparkles className="w-3.5 h-3.5 text-accent-gold" />}
                  {group.name}
                </p>
                {group.items.map((item, j) => {
                  const accentVar = ['var(--color-accent-red)', 'var(--color-accent-blue)', 'var(--color-accent-green)'][j % 3];
                  return (
                  <div key={j} className="flex items-center gap-2 py-1.5 border-b border-surface-divider last:border-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                      background: `linear-gradient(135deg, color-mix(in srgb, ${accentVar} 13%, transparent), color-mix(in srgb, ${accentVar} 7%, transparent))`,
                    }}>
                      <Package className="w-3.5 h-3.5" style={{ color: accentVar }} />
                    </div>
                    <span className="text-xs text-text-primary">{item}</span>
                  </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ───── Tier Rewards (automated_flow / birthday) ───── */}
      {c.tierRewards && c.tierRewards.length > 0 && (
        <Section title="Tier-Based Birthday Rewards" icon={Gift} iconColor="var(--color-accent-red)" badge={`${c.tierRewards.length} tiers`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {c.tierRewards.map((t, i) => (
              <div key={i} className="bg-surface-bg rounded-lg p-3 border border-surface-border text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: t.color }} />
                <div className="w-7 h-7 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: `color-mix(in srgb, ${t.color} 10%, transparent)` }}>
                  <Award className="w-4 h-4" style={{ color: t.color }} />
                </div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t.tier}</p>
                <p className="text-sm font-bold mt-1" style={{ color: t.color }}>{t.reward}</p>
                <p className="text-[11px] text-text-secondary mt-1">+ {t.discount}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ───── audience ───── */}
      <Section title="Target Audience" icon={Target} iconColor="var(--color-accent-blue)">
        <div className="flex items-center justify-between mb-4 gap-3">
          <input
            type="text"
            value={editAudienceDesc}
            onChange={(e) => setEditAudienceDesc(e.target.value)}
            className="text-sm text-text-primary leading-relaxed flex-1 bg-surface-bg border border-surface-border rounded-lg px-3 py-2 focus:border-accent-green focus:outline-none transition-colors"
          />
          <input
            type="text"
            value={editAudienceSize}
            onChange={(e) => setEditAudienceSize(e.target.value)}
            className="text-sm font-mono text-accent-blue bg-accent-blue/10 px-3 py-1.5 rounded-full whitespace-nowrap w-32 text-center border border-transparent focus:border-accent-green focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {editSegments.map((s, idx) => {
            const segColors = ['var(--color-accent-blue)', 'var(--color-accent-purple)', 'var(--color-accent-green)'];
            const segColor = segColors[idx % segColors.length];
            return (
            <div key={idx} className="bg-surface-bg rounded-xl p-4 border border-surface-border relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: segColor }} />
              <div className="flex items-center justify-between mb-2 gap-2">
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => { const next = [...editSegments]; next[idx] = { ...next[idx], name: e.target.value }; setEditSegments(next); }}
                  className="text-xs font-semibold text-text-primary bg-transparent border-b border-transparent focus:border-accent-green focus:outline-none flex-1 min-w-0"
                />
                <input
                  type="text"
                  value={s.count}
                  onChange={(e) => { const next = [...editSegments]; next[idx] = { ...next[idx], count: e.target.value }; setEditSegments(next); }}
                  className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full text-center w-20 focus:outline-none"
                  style={{ background: `color-mix(in srgb, ${segColor} 10%, transparent)`, color: segColor, borderBottom: '1px solid transparent' }}
                />
              </div>
              <input
                type="text"
                value={s.desc}
                onChange={(e) => { const next = [...editSegments]; next[idx] = { ...next[idx], desc: e.target.value }; setEditSegments(next); }}
                className="text-[11px] text-text-secondary bg-transparent border-b border-transparent focus:border-accent-green focus:outline-none w-full"
              />
            </div>
            );
          })}
        </div>
        {/* Audience refinement controls */}
        <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-accent-blue/10 flex items-center justify-center">
              <Filter className="w-3 h-3 text-accent-blue" />
            </div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Audience Refinement (AND/OR Rules)</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Min Age', key: 'minAge', icon: Users },
              { label: 'State', key: 'state', icon: MapPin },
              { label: 'Min Total Spend', key: 'minTotalSpend', icon: DollarSign },
              { label: 'Avg Days Between Purchases', key: 'avgDaysBetween', icon: Calendar },
              { label: 'Loyalty Tier', key: 'loyaltyTier', icon: Award },
              { label: 'Engagement Filter', key: 'engagementFilter', icon: Eye },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface-card border border-surface-border">
                <f.icon className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">{f.label}</p>
                  <input
                    type="text"
                    value={editRefinement[f.key]}
                    onChange={(e) => setEditRefinement(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="text-xs text-text-primary font-medium bg-transparent border-b border-transparent focus:border-accent-green focus:outline-none w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── channels ───── */}
      <Section title="Channel Strategy" icon={Megaphone} iconColor="var(--color-accent-purple)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {(c.channels || []).map((ch) => {
            const ChannelIcon = resolveIcon(ch.icon);
            const isEnabled = enabledChannels.has(ch.name);
            const channelColors = { Email: 'var(--color-accent-blue)', SMS: 'var(--color-accent-green)', 'Push Notification': 'var(--color-accent-purple)' };
            const chColor = channelColors[ch.name] || 'var(--color-accent-purple)';
            return (
              <div key={ch.name} className={`bg-surface-bg rounded-xl p-4 border transition-all duration-200 ${isEnabled ? 'border-surface-border' : 'border-surface-border opacity-40'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${chColor} 10%, transparent)` }}>
                      <ChannelIcon className="w-4 h-4" style={{ color: chColor }} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-primary">{ch.name}</span>
                      {ch.status && <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-green/10 text-accent-green">{ch.status}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setEnabledChannels(prev => {
                      const next = new Set(prev);
                      if (next.has(ch.name)) next.delete(ch.name); else next.add(ch.name);
                      return next;
                    })}
                    className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${isEnabled ? 'bg-accent-green/30 justify-end' : 'bg-surface-border justify-start'}`}
                  >
                    <div className={`w-3 h-3 rounded-full transition-colors ${isEnabled ? 'bg-accent-green' : 'bg-surface-card'}`} />
                  </button>
                </div>
                <p className="text-lg font-bold text-text-primary">{ch.reach}</p>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mt-0.5">{ch.name === 'SMS' ? 'Opted-in Subscribers' : 'Reachable'}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-divider">
                  <p className="text-xs text-text-secondary">{ch.rate} {ch.metric}</p>
                  <p className="text-[10px] text-text-muted font-medium">{ch.cost}</p>
                </div>
                {ch.complianceNote && <p className="text-[10px] text-accent-gold mt-2 flex items-center gap-1.5"><Shield className="w-3 h-3" />{ch.complianceNote}</p>}
                {ch.note && <p className="text-[10px] text-text-muted mt-1">{ch.note}</p>}
              </div>
            );
          })}
        </div>
        {/* Waterfall toggle */}
        {c.isWaterfall !== undefined && (
          <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-accent-purple" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Waterfall Delivery</p>
                  <p className="text-[11px] text-text-secondary">
                    {c.isWaterfall
                      ? `Cascade: ${c.waterfallOrder || 'Email → SMS → Push'} — delivers to next channel if customer doesn't engage`
                      : 'Send on all enabled channels simultaneously'}
                  </p>
                </div>
              </div>
              <div className={`w-8 h-4 rounded-full flex items-center px-0.5 ${c.isWaterfall ? 'bg-accent-purple/30 justify-end' : 'bg-surface-border justify-start'}`}>
                <div className={`w-3 h-3 rounded-full ${c.isWaterfall ? 'bg-accent-purple' : 'bg-surface-card'}`} />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ───── creative preview ───── */}
      <Section title="Creative Preview" icon={Image} iconColor="var(--color-accent-red)" badge="Editable">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* SMS Preview */}
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" /> SMS Preview
            </p>
            <textarea
              value={editSmsPreview}
              onChange={(e) => setEditSmsPreview(e.target.value)}
              rows={2}
              className="w-full text-xs text-text-primary bg-surface-bg border border-surface-border rounded-lg px-3 py-2 mb-2 focus:border-accent-green focus:outline-none resize-none"
            />
            {/* SMS Character Counter */}
            {(() => {
              const smsChars = editSmsPreview?.length || 0;
              const smsSegments = Math.ceil(smsChars / 160) || 1;
              const smsReach = parseInt(String((c.channels || []).find(ch => ch.name === 'SMS')?.reach || '0').replace(/[^0-9]/g, '')) || 0;
              return (
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className={`text-[10px] font-mono ${smsChars > 160 ? 'text-accent-gold' : 'text-text-muted'}`}>
                    {smsChars}/160 chars ({smsSegments} segment{smsSegments !== 1 ? 's' : ''})
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    Est. cost: ${(smsReach * 0.015 * smsSegments).toFixed(2)}
                  </span>
                </div>
              );
            })()}
            <PhoneMockup messages={[editSmsPreview, 'Reply STOP to opt out']} brandColor={c.accentFrom} />
            {/* TCPA compliance lock */}
            <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-bg border border-surface-border">
              <Lock className="w-3 h-3 text-accent-gold flex-shrink-0" />
              <span className="text-[9px] text-text-muted">"Reply STOP to opt out" — System-required — cannot be removed</span>
            </div>
          </div>
          {/* Email Content Brief */}
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email Content Brief
            </p>
            <div className="rounded-xl border border-surface-border bg-surface-bg p-3.5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent-blue" />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email Content Brief</span>
                </div>
                <span className="text-[10px] text-text-muted">Visual design in Email Designer</span>
              </div>
              {[
                { label: 'Subject Line', value: c.channels?.email?.subjectLine || c.content?.headline || c.title, max: 60 },
                { label: 'Preview Text', value: c.channels?.email?.previewText || c.content?.preheader || 'New products just dropped — shop now', max: 90 },
                { label: 'Headline', value: c.channels?.email?.headline || c.content?.headline || c.title, max: null },
                { label: 'Body Copy', value: c.channels?.email?.bodyCopy || c.content?.body || c.description || '', max: null },
                { label: 'CTA Button', value: c.channels?.email?.cta || c.content?.cta || 'Shop Now', max: 30 },
                { label: 'Offer Text', value: editOffer || c.content?.offer || '', max: null },
              ].map(field => (
                <div key={field.label} className="mb-2.5 last:mb-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{field.label}</span>
                    {field.max && <span className={`text-[9px] font-mono ${(field.value?.length || 0) > field.max ? 'text-accent-red' : 'text-text-muted'}`}>{field.value?.length || 0}/{field.max}</span>}
                  </div>
                  <div className="text-sm text-text-primary bg-surface-card rounded-lg px-3 py-2 border border-surface-border">
                    {field.value}
                  </div>
                </div>
              ))}
              <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-semibold hover:bg-accent-blue/15 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Email Designer (BEE Free)
              </button>
            </div>
          </div>
        </div>

        {/* Push Notification Preview */}
        <div className="mt-3 rounded-xl border border-surface-border bg-surface-bg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-accent-purple" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Push Notification</span>
          </div>
          {/* iOS-style notification mockup */}
          {(() => {
            const pushTitle = c.content?.headline?.replace(/ 🔥| 🎂/g, '').substring(0, 50) || c.title || 'New deals available';
            const pushBody = c.content?.preheader || c.content?.body?.substring(0, 150) || c.subtitle || 'Check out our latest offers';
            return (
              <>
                <div className="rounded-xl bg-surface-card border border-surface-border p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded bg-accent-green/20 flex items-center justify-center">
                      <Leaf className="w-3 h-3 text-accent-green" />
                    </div>
                    <span className="text-[10px] font-semibold text-text-secondary">Dutchie</span>
                    <span className="text-[10px] text-text-muted ml-auto">now</span>
                  </div>
                  <div className="text-sm font-semibold text-text-primary mb-0.5">{pushTitle}</div>
                  <div className="text-xs text-text-secondary line-clamp-2">{pushBody}</div>
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-text-muted">
                  <span>Title: {pushTitle?.length || 0}/50 chars</span>
                  <span>Body: {pushBody?.length || 0}/150 chars</span>
                </div>
              </>
            );
          })()}
        </div>
      </Section>

      {/* ───── A/B testing ───── */}
      {c.abTests && c.abTests.length > 0 && (
        <Section title="A/B Testing" icon={FlaskConical} iconColor="var(--color-accent-gold)" defaultOpen={false}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-text-secondary">Test multiple subject lines to optimize open rates</p>
            <button
              onClick={() => setAbEnabled(!abEnabled)}
              className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${abEnabled ? 'bg-accent-green justify-end' : 'bg-surface-border justify-start'}`}
            >
              <div className="w-4 h-4 rounded-full bg-surface-card shadow" />
            </button>
          </div>
          {abEnabled && (
            <div className="space-y-3">
              {c.abTests.map((t) => (
                <div key={t.variant} className="flex items-center gap-3 bg-surface-bg rounded-xl p-4 border border-surface-border">
                  <span className="text-xs font-bold text-accent-gold bg-accent-gold/10 w-8 h-8 rounded-lg flex items-center justify-center">{t.variant}</span>
                  <p className="text-xs text-text-primary flex-1 font-medium">{t.subject}</p>
                  <span className="text-[10px] font-bold text-text-secondary bg-surface-card px-2 py-0.5 rounded-full">{t.split}%</span>
                </div>
              ))}
              <p className="text-[10px] text-text-muted mt-1">Winner determined after 2 hours based on open rate. Remaining sends use winning variant.</p>
            </div>
          )}
        </Section>
      )}

      {/* ───── campaign type & trigger ───── */}
      {(c.campaignType || c.triggerType || c.discountType) && (
        <Section title="Campaign Configuration" icon={Settings} iconColor="var(--color-accent-blue)" defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {c.campaignType && (
              <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-accent-blue/10 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-accent-blue" />
                  </div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Campaign Type</p>
                </div>
                <p className="text-sm font-bold text-text-primary capitalize">{c.campaignType === 'one-time' ? 'One-Time Blast' : 'Automated'}</p>
                {c.campaignType === 'one-time' && <p className="text-[10px] text-text-secondary mt-0.5">Send now or schedule for later</p>}
              </div>
            )}
            {c.triggerType && (
              <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-accent-purple/10 flex items-center justify-center">
                    <Target className="w-3 h-3 text-accent-purple" />
                  </div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Trigger</p>
                </div>
                <p className="text-sm font-bold text-accent-purple">{c.triggerType}</p>
                {c.triggerSegment && <p className="text-[10px] text-text-secondary mt-0.5">Segment: {c.triggerSegment}</p>}
              </div>
            )}
            {c.discountType && (
              <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-accent-gold/10 flex items-center justify-center">
                    <Tag className="w-3 h-3 text-accent-gold" />
                  </div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Discount Type</p>
                </div>
                <p className="text-sm font-bold text-text-primary">{c.discountType}</p>
                {c.discountDetail && <p className="text-[10px] text-text-secondary mt-0.5">{c.discountDetail}</p>}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ───── schedule & timing ───── */}
      <Section title="Schedule & Timing" icon={Clock} iconColor="var(--color-accent-gold)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-3">
            {Object.entries(editSchedule).map(([key, val]) => (
              <div key={key} className="flex items-start gap-3 bg-surface-bg rounded-lg px-3 py-2.5 border border-surface-border">
                <div className="w-2 h-2 rounded-full bg-accent-gold mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setEditSchedule(prev => ({ ...prev, [key]: e.target.value }))}
                    className="text-xs text-text-primary font-medium bg-transparent border-b border-transparent focus:border-accent-green focus:outline-none w-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
            <p className="text-xs font-medium text-text-secondary mb-3">
              {c.campaignType === 'automated' ? 'Smart Sending' : 'Send Window'}
            </p>
            <div className="space-y-2">
              {c.campaignType === 'automated' ? (
                <>
                  {['Immediate (on trigger)', '2 hours delay', '1 day delay', '3 days delay', '1 week delay'].map((w, i) => (
                    <div key={w} className="flex items-center gap-2">
                      <div className={`flex-1 h-3 rounded-full ${i < 3 ? 'bg-accent-purple/30' : 'bg-surface-border'}`}>
                        <div className="h-3 rounded-full bg-accent-purple" style={{ width: [90, 75, 50, 25, 10][i] + '%' }} />
                      </div>
                      <span className="text-[10px] text-text-secondary w-28 text-right">{w}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-text-muted mt-2">Time delay configurable in minutes, hours, days, or weeks</p>
                </>
              ) : (
                <>
                  {['9 AM — 12 PM', '12 PM — 3 PM', '3 PM — 6 PM', '6 PM — 9 PM'].map((w, i) => (
                    <div key={w} className="flex items-center gap-2">
                      <div className={`flex-1 h-3 rounded-full ${i < 3 ? 'bg-accent-green/30' : 'bg-surface-border'}`}>
                        <div className="h-3 rounded-full bg-accent-green" style={{ width: [85, 70, 45, 0][i] + '%' }} />
                      </div>
                      <span className="text-[10px] text-text-secondary w-24 text-right">{w}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-text-muted mt-2">Smart Sending optimizes per customer timezone</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ───── multi-location targeting ───── */}
      {c.locationTargeting && c.locationTargeting.length > 0 && (
        <Section title="Location Targeting" icon={Store} iconColor="var(--color-accent-blue)" defaultOpen={false}>
          <div className="space-y-2">
            <div
              onClick={() => setSelectedLocations(prev => prev.includes('all') ? [] : ['all'])}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-bg border border-surface-border cursor-pointer hover:border-surface-border transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                selectedLocations.includes('all') ? 'bg-accent-green border-accent-green' : 'border-surface-border'
              }`}>
                {selectedLocations.includes('all') && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-text-primary flex-1">All Locations</span>
              <span className="text-xs text-text-secondary font-mono">{c.audience?.size || '0'}</span>
            </div>
            {c.locationTargeting.map((loc) => (
              <div
                key={loc.id}
                onClick={() => {
                  setSelectedLocations(prev => {
                    const without = prev.filter(id => id !== 'all');
                    return without.includes(loc.id) ? without.filter(id => id !== loc.id) : [...without, loc.id];
                  });
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-bg border border-surface-border cursor-pointer hover:border-surface-border transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedLocations.includes(loc.id) || selectedLocations.includes('all') ? 'bg-accent-green border-accent-green' : 'border-surface-border'
                }`}>
                  {(selectedLocations.includes(loc.id) || selectedLocations.includes('all')) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-text-primary flex-1">{loc.name}</span>
                <span className="text-xs text-text-secondary font-mono">{loc.count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ───── projected performance ───── */}
      <Section title="Projected Performance" icon={TrendingUp} iconColor="var(--color-accent-green)">
        {(dynamicProjections.noChannels || dynamicProjections.noLocations) && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-accent-gold/[0.08] border border-accent-gold/20">
            <AlertTriangle className="w-4 h-4 text-accent-gold flex-shrink-0" />
            <span className="text-xs text-accent-gold">
              {dynamicProjections.noChannels && 'No channels selected — projections are zero. '}
              {dynamicProjections.noLocations && 'No locations selected — projections are zero.'}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Est. Revenue', value: dynamicProjections.revenue, icon: DollarSign, color: 'var(--color-accent-green)' },
            { label: 'Est. Orders', value: dynamicProjections.orders, icon: ShoppingBag, color: 'var(--color-accent-blue)' },
            { label: 'Projected ROI', value: dynamicProjections.roi, icon: TrendingUp, color: 'var(--color-accent-purple)' },
            { label: 'Avg Order Value', value: dynamicProjections.aov, icon: BarChart3, color: 'var(--color-accent-gold)' },
            { label: 'Redemption Rate', value: dynamicProjections.redemptionRate, icon: Percent, color: 'var(--color-accent-red)' },
            { label: 'Reactivated', value: dynamicProjections.reactivated, icon: RefreshCw, color: 'var(--color-accent-red)' },
          ].filter(m => m.value && m.value !== '—').map((m) => (
            <div key={m.label} className="rounded-xl border border-surface-border bg-surface-bg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{m.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${m.color} 10%, transparent)` }}>
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-lg font-bold text-text-primary">{m.value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ───── campaign package — system handoff ───── */}
      {(() => {
        const smsCharsHandoff = editSmsPreview?.length || 0;
        const smsSegmentsHandoff = Math.ceil(smsCharsHandoff / 160) || 1;
        const smsReachHandoff = parseInt(String((c.channels || []).find(ch => ch.name === 'SMS')?.reach || '0').replace(/[^0-9]/g, '')) || 0;
        const smsCostHandoff = (smsReachHandoff * 0.015 * smsSegmentsHandoff).toFixed(2);
        const promoCode = c.content?.offer?.match(/code\s+(\w+)/i)?.[1] || 'PROMO';
        const discountPct = c.content?.offer?.match(/(\d+)%/)?.[1] || c.discountDetail?.match(/(\d+)%/)?.[1] || '15';
        const validDays = c.schedule?.duration?.match(/(\d+)/)?.[1] || '7';
        return (
          <div className="rounded-xl border border-accent-green/20 bg-accent-green/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-accent-green" />
              <span className="text-sm font-semibold text-text-primary">Campaign Package — System Handoff</span>
            </div>
            <p className="text-xs text-text-secondary mb-3">The agent will create the following objects across Dutchie's systems:</p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { system: 'Email Designer', icon: Mail, color: 'blue', status: 'Draft — requires visual design', items: ['Subject line & preview text', 'Body copy & CTA', `Offer: ${discountPct}% off (${promoCode})`] },
                { system: 'SMS Pipeline', icon: MessageSquare, color: 'green', status: 'Ready to schedule', items: [`Message: ${smsCharsHandoff}/160 chars`, 'TCPA compliance verified', `Est. cost: $${smsCostHandoff}`] },
                { system: 'Push Service', icon: Bell, color: 'purple', status: 'Ready to schedule', items: ['Title + body copy', 'Deep link to products', 'Free delivery'] },
                { system: 'POS / Discounts', icon: Tag, color: 'gold', status: 'Auto-created on launch', items: [`Code: ${promoCode}`, `Type: ${c.discountType || 'Sale'} — ${discountPct}% off`, `Valid: ${validDays} days`] },
              ].map(h => (
                <div key={h.system} className="rounded-lg border border-surface-border bg-surface-card p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <h.icon className={`w-3.5 h-3.5 text-accent-${h.color}`} />
                    <span className="text-xs font-semibold text-text-primary">{h.system}</span>
                  </div>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${h.status.includes('Draft') ? 'bg-accent-gold/10 text-accent-gold' : 'bg-accent-green/10 text-accent-green'}`}>{h.status}</span>
                  <ul className="mt-2 space-y-0.5">
                    {h.items.map(item => (
                      <li key={item} className="text-[10px] text-text-secondary flex items-start gap-1">
                        <span className="text-text-muted mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Audience segments */}
            <div className="mt-2 rounded-lg border border-surface-border bg-surface-card p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-accent-blue" />
                <span className="text-xs font-semibold text-text-primary">Audience Segments</span>
                <span className="text-[9px] bg-accent-green/10 text-accent-green px-1.5 py-0.5 rounded-full font-medium ml-auto">Auto-synced</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(c.audience?.segments || c.audienceSegments || []).map(seg => (
                  <span key={seg.name || seg} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-bg border border-surface-border text-text-secondary">{seg.name || seg}</span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ───── send controls ───── */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-3.5">
        {sent ? (
          <div className="animate-fade-in space-y-4 py-4">
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle2 className="w-6 h-6 text-accent-green" />
              <div>
                <p className="text-text-primary font-semibold">Campaign package created — 4 system objects queued</p>
                <p className="text-sm text-text-secondary">{c.title} will begin sending on {c.schedule?.launch || 'schedule TBD'}</p>
              </div>
            </div>
            <div className="mx-auto max-w-md rounded-xl border border-surface-border bg-surface-bg divide-y divide-surface-divider">
              {[
                { icon: Mail, label: 'Email Designer', status: 'Draft created', color: 'text-accent-blue' },
                { icon: MessageSquare, label: 'SMS Pipeline', status: 'Scheduled', color: 'text-accent-green' },
                { icon: Bell, label: 'Push Service', status: 'Scheduled', color: 'text-accent-purple' },
                { icon: Tag, label: 'POS / Discounts', status: 'Discount code created', color: 'text-accent-gold' },
              ].map(sys => (
                <div key={sys.label} className="flex items-center gap-3 px-4 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
                  <sys.icon className={`w-3.5 h-3.5 ${sys.color} flex-shrink-0`} />
                  <span className="text-[12px] font-medium text-text-primary flex-1">{sys.label}</span>
                  <span className="text-[11px] text-text-secondary">{sys.status}</span>
                </div>
              ))}
            </div>
            <div className="mx-auto max-w-md rounded-xl border border-surface-border bg-surface-bg divide-y divide-surface-divider">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Audience</span>
                <span className="text-[12px] font-medium text-text-primary">{editAudienceSize} customers</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Channels</span>
                <span className="text-[12px] font-medium text-text-primary">{[...enabledChannels].join(', ') || 'None'}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">Scheduled</span>
                <span className="text-[12px] font-medium text-text-primary">{c.schedule?.launch || 'Immediate'}</span>
              </div>
            </div>
            <p className="text-center text-[11px] text-accent-blue cursor-pointer hover:underline" onClick={() => { const btn = document.querySelector('[aria-label="Action log"]'); if (btn) btn.click(); }}>
              View in Action Log
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(dynamicProjections.noChannels || dynamicProjections.noLocations) && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent-gold/[0.08] border border-accent-gold/20">
                <AlertTriangle className="w-4 h-4 text-accent-gold flex-shrink-0" />
                <span className="text-xs text-accent-gold">
                  {dynamicProjections.noChannels ? 'Enable at least one channel to launch.' : 'Select at least one location to launch.'}
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div>
                <p className="text-text-primary font-medium">Ready to create the campaign package?</p>
                <p className="text-sm text-text-secondary">
                  This will push content to 4 systems for {editAudienceSize} customers across {enabledChannels.size} channel{enabledChannels.size !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-surface-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button
                  onClick={() => { setTestSent(true); setTimeout(() => setTestSent(false), 3000); }}
                  disabled={testSent}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-surface-border text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {testSent ? <><Check className="w-4 h-4 text-accent-green" /> Exported!</> : <><FileDown className="w-4 h-4" /> Export as Brief</>}
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={sending || dynamicProjections.noChannels || dynamicProjections.noLocations}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 shadow-lg bg-accent-green"
                >
                  {sending ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                  ) : (
                    <><Package className="w-4 h-4" /> Create Campaign Package</>
                  )}
                </button>
                <ConfirmationDrawer
                  open={showConfirm}
                  onCancel={() => setShowConfirm(false)}
                  onConfirm={() => { setShowConfirm(false); handleSend(); }}
                  title={`Create Package: ${c.title}`}
                  description={`Push campaign to 4 systems for ${editAudienceSize} customers`}
                  icon={Package}
                  confirmLabel="Create Campaign Package"
                  confirmColor="var(--color-accent-green)"
                  details={[
                    { label: 'Audience', value: `${editAudienceSize} customers` },
                    { label: 'Systems', value: 'Email Designer, SMS Pipeline, Push Service, POS' },
                    { label: 'Channels', value: [...enabledChannels].join(', ') || 'None' },
                    { label: 'Projected ROI', value: `${dynamicProjections.roi}` },
                  ]}
                  warning="This will create draft objects in each system. Email requires visual design before sending. SMS and Push will be scheduled."
                />
              </div>
            </div>
            <p className="text-[10px] text-text-muted">
              {c.content?.finePrint || ''}
            </p>
          </div>
        )}
      </div>

      {/* ───── Preview Modal ───── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-divider sticky top-0 bg-surface-card z-10 rounded-t-2xl">
              <h3 className="text-sm font-semibold text-text-primary">Customer Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* SMS Preview */}
              <div>
                <p className="text-xs font-medium text-text-secondary mb-3 flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" /> SMS — as received by customer
                </p>
                {(() => {
                  const modalSmsChars = editSmsPreview?.length || 0;
                  const modalSmsSegments = Math.ceil(modalSmsChars / 160) || 1;
                  return (
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className={`text-[10px] font-mono ${modalSmsChars > 160 ? 'text-accent-gold' : 'text-text-muted'}`}>
                        {modalSmsChars}/160 chars ({modalSmsSegments} segment{modalSmsSegments !== 1 ? 's' : ''})
                      </span>
                    </div>
                  );
                })()}
                <PhoneMockup messages={[editSmsPreview, 'Reply STOP to opt out']} brandColor={c.accentFrom} />
                <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-bg border border-surface-border">
                  <Lock className="w-3 h-3 text-accent-gold flex-shrink-0" />
                  <span className="text-[9px] text-text-muted">"Reply STOP to opt out" — System-required — cannot be removed</span>
                </div>
              </div>
              {/* Email Content Brief */}
              <div>
                <p className="text-xs font-medium text-text-secondary mb-3 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Content Brief
                </p>
                <div className="rounded-xl border border-surface-border bg-surface-bg p-3.5">
                  {[
                    { label: 'Subject Line', value: c.content?.headline || c.title, max: 60 },
                    { label: 'Preview Text', value: c.content?.preheader || 'New products just dropped — shop now', max: 90 },
                    { label: 'Body Copy', value: c.content?.body || '', max: null },
                    { label: 'CTA Button', value: c.content?.cta || 'Shop Now', max: 30 },
                    { label: 'Offer Text', value: editOffer || c.content?.offer || '', max: null },
                  ].map(field => (
                    <div key={field.label} className="mb-2 last:mb-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{field.label}</span>
                        {field.max && <span className={`text-[9px] font-mono ${(field.value?.length || 0) > field.max ? 'text-accent-red' : 'text-text-muted'}`}>{field.value?.length || 0}/{field.max}</span>}
                      </div>
                      <div className="text-sm text-text-primary bg-surface-card rounded-lg px-3 py-2 border border-surface-border">
                        {field.value}
                      </div>
                    </div>
                  ))}
                  <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-semibold hover:bg-accent-blue/15 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Email Designer (BEE Free)
                  </button>
                </div>
              </div>
            </div>
            {/* Push Notification Preview */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-3 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" /> Push Notification
              </p>
              {(() => {
                const modalPushTitle = c.content?.headline?.replace(/ 🔥| 🎂/g, '').substring(0, 50) || c.title || 'New deals available';
                const modalPushBody = c.content?.preheader || c.content?.body?.substring(0, 150) || c.subtitle || 'Check out our latest offers';
                return (
                  <div className="rounded-xl bg-surface-card border border-surface-border p-3 max-w-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded bg-accent-green/20 flex items-center justify-center">
                        <Leaf className="w-3 h-3 text-accent-green" />
                      </div>
                      <span className="text-[10px] font-semibold text-text-secondary">Dutchie</span>
                      <span className="text-[10px] text-text-muted ml-auto">now</span>
                    </div>
                    <div className="text-sm font-semibold text-text-primary mb-0.5">{modalPushTitle}</div>
                    <div className="text-xs text-text-secondary line-clamp-2">{modalPushBody}</div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ───── Full-Screen Edit Modal (portaled to body) ───── */}
      {showFullScreen && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-bg animate-fade-in">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-divider bg-surface-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c.accentFrom || 'var(--color-accent-green)'}, ${c.accentTo || 'var(--color-accent-green)'})` }}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <input
                type="text"
                value={fsName}
                onChange={(e) => setFsName(e.target.value)}
                className="text-2xl font-bold text-text-primary bg-transparent border-b border-transparent focus:border-accent-green focus:outline-none min-w-0 flex-1"
              />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowFullScreen(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent-green text-white hover:brightness-110 transition-all"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button onClick={() => setShowFullScreen(false)} className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-surface-hover">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">

              {/* Campaign Name & Subtitle */}
              <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Campaign Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Campaign Name</label>
                    <input
                      type="text"
                      value={fsName}
                      onChange={(e) => setFsName(e.target.value)}
                      className="w-full text-sm text-text-primary bg-surface-bg border border-surface-border rounded-lg px-3 py-2.5 focus:border-accent-green focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Subtitle</label>
                    <input
                      type="text"
                      value={fsSubtitle}
                      onChange={(e) => setFsSubtitle(e.target.value)}
                      className="w-full text-sm text-text-primary bg-surface-bg border border-surface-border rounded-lg px-3 py-2.5 focus:border-accent-green focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Audience */}
              <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Target Audience</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-3">
                      <label className="text-xs text-text-muted mb-1 block">Audience Description</label>
                      <textarea
                        value={editAudienceDesc}
                        onChange={(e) => setEditAudienceDesc(e.target.value)}
                        rows={2}
                        className="w-full text-sm text-text-primary bg-surface-bg border border-surface-border rounded-lg px-3 py-2.5 focus:border-accent-green focus:outline-none transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Audience Size</label>
                      <input
                        type="text"
                        value={editAudienceSize}
                        onChange={(e) => setEditAudienceSize(e.target.value)}
                        className="w-full text-sm font-mono text-text-primary bg-surface-bg border border-surface-border rounded-lg px-3 py-2.5 focus:border-accent-green focus:outline-none text-center transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Segments</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {editSegments.map((s, idx) => (
                        <div key={idx} className="rounded-xl border border-surface-border bg-surface-bg p-3">
                          <input
                            type="text"
                            value={s.name}
                            onChange={(e) => { const next = [...editSegments]; next[idx] = { ...next[idx], name: e.target.value }; setEditSegments(next); }}
                            className="text-xs font-medium text-text-primary bg-transparent border-b border-surface-divider focus:border-accent-green focus:outline-none w-full mb-1"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={s.desc}
                              onChange={(e) => { const next = [...editSegments]; next[idx] = { ...next[idx], desc: e.target.value }; setEditSegments(next); }}
                              className="text-[11px] text-text-secondary bg-transparent border-b border-transparent focus:border-accent-green focus:outline-none flex-1"
                            />
                            <input
                              type="text"
                              value={s.count}
                              onChange={(e) => { const next = [...editSegments]; next[idx] = { ...next[idx], count: e.target.value }; setEditSegments(next); }}
                              className="text-xs font-mono text-accent-green bg-transparent border-b border-transparent focus:border-accent-green focus:outline-none w-16 text-right"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Audience Refinement Filters</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Min Age', key: 'minAge', icon: Users },
                        { label: 'State', key: 'state', icon: MapPin },
                        { label: 'Min Total Spend', key: 'minTotalSpend', icon: DollarSign },
                        { label: 'Avg Days Between Purchases', key: 'avgDaysBetween', icon: Calendar },
                        { label: 'Loyalty Tier', key: 'loyaltyTier', icon: Award },
                        { label: 'Engagement Filter', key: 'engagementFilter', icon: Eye },
                      ].map((f) => (
                        <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-bg border border-surface-border">
                          <f.icon className="w-3 h-3 text-text-muted flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-text-muted">{f.label}</p>
                            <input
                              type="text"
                              value={editRefinement[f.key]}
                              onChange={(e) => setEditRefinement(prev => ({ ...prev, [f.key]: e.target.value }))}
                              className="text-xs text-text-primary font-medium bg-transparent border-b border-transparent focus:border-accent-green focus:outline-none w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel Selection */}
              <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Channel Strategy</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  {(c.channels || []).map((ch) => {
                    const ChannelIcon = resolveIcon(ch.icon);
                    const isEnabled = enabledChannels.has(ch.name);
                    const fsChannelColors = { Email: 'var(--color-accent-blue)', SMS: 'var(--color-accent-green)', 'Push Notification': 'var(--color-accent-purple)' };
                    const fsChColor = fsChannelColors[ch.name] || 'var(--color-accent-purple)';
                    return (
                      <div key={ch.name} className={`rounded-xl border bg-surface-bg p-4 transition-all duration-200 ${isEnabled ? 'border-surface-border' : 'border-surface-border opacity-40'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${fsChColor} 10%, transparent)` }}>
                              <ChannelIcon className="w-4 h-4" style={{ color: fsChColor }} />
                            </div>
                            <span className="text-sm font-semibold text-text-primary">{ch.name}</span>
                          </div>
                          <button
                            onClick={() => setEnabledChannels(prev => {
                              const next = new Set(prev);
                              if (next.has(ch.name)) next.delete(ch.name); else next.add(ch.name);
                              return next;
                            })}
                            className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${isEnabled ? 'bg-accent-green/30 justify-end' : 'bg-surface-border justify-start'}`}
                          >
                            <div className={`w-3 h-3 rounded-full transition-colors ${isEnabled ? 'bg-accent-green' : 'bg-surface-card'}`} />
                          </button>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{ch.reach}</p>
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mt-0.5">{ch.name === 'SMS' ? 'Opted-in Subscribers' : 'Reachable'}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-divider">
                          <p className="text-xs text-text-secondary">{ch.rate} {ch.metric}</p>
                          <p className="text-[10px] text-text-muted font-medium">{ch.cost}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Waterfall toggle */}
                {c.isWaterfall !== undefined && (
                  <div className="rounded-xl border border-surface-border bg-surface-bg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                          <Layers className="w-4 h-4 text-accent-purple" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-primary">Waterfall Delivery</p>
                          <p className="text-[11px] text-text-secondary">
                            {c.isWaterfall
                              ? `Cascade: ${c.waterfallOrder || 'Email -> SMS -> Push'}`
                              : 'Send on all enabled channels simultaneously'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-8 h-4 rounded-full flex items-center px-0.5 ${c.isWaterfall ? 'bg-accent-purple/30 justify-end' : 'bg-surface-border justify-start'}`}>
                        <div className={`w-3 h-3 rounded-full ${c.isWaterfall ? 'bg-accent-purple' : 'bg-surface-card'}`} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule & Timing */}
              <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Schedule & Timing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-3">
                    {Object.entries(editSchedule).map(([key, val]) => (
                      <div key={key}>
                        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => setEditSchedule(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full text-xs text-text-primary bg-surface-bg border border-surface-border rounded-lg px-3 py-2 focus:border-accent-green focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-surface-border bg-surface-bg p-4">
                    <p className="text-xs font-medium text-text-secondary mb-3">
                      {c.campaignType === 'automated' ? 'Smart Sending' : 'Send Window'}
                    </p>
                    <div className="space-y-2">
                      {c.campaignType === 'automated' ? (
                        <>
                          {['Immediate (on trigger)', '2 hours delay', '1 day delay', '3 days delay', '1 week delay'].map((w, i) => (
                            <div key={w} className="flex items-center gap-2">
                              <div className={`flex-1 h-3 rounded-full ${i < 3 ? 'bg-accent-purple/30' : 'bg-surface-border'}`}>
                                <div className="h-3 rounded-full bg-accent-purple" style={{ width: [90, 75, 50, 25, 10][i] + '%' }} />
                              </div>
                              <span className="text-[10px] text-text-secondary w-28 text-right">{w}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {['9 AM - 12 PM', '12 PM - 3 PM', '3 PM - 6 PM', '6 PM - 9 PM'].map((w, i) => (
                            <div key={w} className="flex items-center gap-2">
                              <div className={`flex-1 h-3 rounded-full ${i < 3 ? 'bg-accent-green/30' : 'bg-surface-border'}`}>
                                <div className="h-3 rounded-full bg-accent-green" style={{ width: [85, 70, 45, 0][i] + '%' }} />
                              </div>
                              <span className="text-[10px] text-text-secondary w-24 text-right">{w}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Creative Preview — SMS & Email */}
              <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Creative Preview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* SMS */}
                  <div>
                    <label className="text-xs text-text-muted mb-2 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5" /> SMS Content
                    </label>
                    <textarea
                      value={editSmsPreview}
                      onChange={(e) => setEditSmsPreview(e.target.value)}
                      rows={3}
                      className="w-full text-xs text-text-primary bg-surface-bg border border-surface-border rounded-lg px-3 py-2 mb-2 focus:border-accent-green focus:outline-none resize-none transition-colors"
                    />
                    {(() => {
                      const fsSmsChars = editSmsPreview?.length || 0;
                      const fsSmsSegments = Math.ceil(fsSmsChars / 160) || 1;
                      return (
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className={`text-[10px] font-mono ${fsSmsChars > 160 ? 'text-accent-gold' : 'text-text-muted'}`}>
                            {fsSmsChars}/160 chars ({fsSmsSegments} segment{fsSmsSegments !== 1 ? 's' : ''})
                          </span>
                        </div>
                      );
                    })()}
                    <PhoneMockup messages={[editSmsPreview, 'Reply STOP to opt out']} brandColor={c.accentFrom} />
                    <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-bg border border-surface-border">
                      <Lock className="w-3 h-3 text-accent-gold flex-shrink-0" />
                      <span className="text-[9px] text-text-muted">"Reply STOP to opt out" — System-required — cannot be removed</span>
                    </div>
                  </div>
                  {/* Email Content Brief */}
                  <div>
                    <label className="text-xs text-text-muted mb-2 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> Email Content Brief
                    </label>
                    <input
                      type="text"
                      value={editOffer}
                      onChange={(e) => setEditOffer(e.target.value)}
                      placeholder="Offer text..."
                      className="w-full text-xs text-text-primary bg-surface-bg border border-surface-border rounded-lg px-3 py-2 mb-3 focus:border-accent-green focus:outline-none transition-colors"
                    />
                    <div className="rounded-xl border border-surface-border bg-surface-bg p-3.5">
                      {[
                        { label: 'Subject Line', value: c.content?.headline || c.title, max: 60 },
                        { label: 'Preview Text', value: c.content?.preheader || 'New products just dropped — shop now', max: 90 },
                        { label: 'Body Copy', value: c.content?.body || '', max: null },
                        { label: 'CTA Button', value: c.content?.cta || 'Shop Now', max: 30 },
                        { label: 'Offer Text', value: editOffer || c.content?.offer || '', max: null },
                      ].map(field => (
                        <div key={field.label} className="mb-2 last:mb-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{field.label}</span>
                            {field.max && <span className={`text-[9px] font-mono ${(field.value?.length || 0) > field.max ? 'text-accent-red' : 'text-text-muted'}`}>{field.value?.length || 0}/{field.max}</span>}
                          </div>
                          <div className="text-sm text-text-primary bg-surface-card rounded-lg px-3 py-2 border border-surface-border">
                            {field.value}
                          </div>
                        </div>
                      ))}
                      <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-semibold hover:bg-accent-blue/15 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in Email Designer (BEE Free)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* A/B Testing */}
              {c.abTests && c.abTests.length > 0 && (
                <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">A/B Testing</h3>
                    <button
                      onClick={() => setAbEnabled(!abEnabled)}
                      className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${abEnabled ? 'bg-accent-green justify-end' : 'bg-surface-border justify-start'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-surface-card shadow" />
                    </button>
                  </div>
                  {abEnabled && (
                    <div className="space-y-3">
                      {c.abTests.map((t) => (
                        <div key={t.variant} className="flex items-center gap-3 bg-surface-bg rounded-xl p-3 border border-surface-border">
                          <span className="text-xs font-bold text-accent-gold bg-accent-gold/10 w-7 h-7 rounded-lg flex items-center justify-center">{t.variant}</span>
                          <p className="text-xs text-text-primary flex-1">{t.subject}</p>
                          <span className="text-xs text-text-secondary">{t.split}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Location Targeting */}
              {c.locationTargeting && c.locationTargeting.length > 0 && (
                <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Location Targeting</h3>
                  <div className="space-y-2">
                    <div
                      onClick={() => setSelectedLocations(prev => prev.includes('all') ? [] : ['all'])}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-bg border border-surface-border cursor-pointer hover:bg-surface-hover transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        selectedLocations.includes('all') ? 'bg-accent-green border-accent-green' : 'border-surface-border'
                      }`}>
                        {selectedLocations.includes('all') && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs text-text-primary flex-1">All Locations</span>
                      <span className="text-xs text-text-secondary font-mono">{c.audience?.size || '0'}</span>
                    </div>
                    {c.locationTargeting.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocations(prev => {
                            const without = prev.filter(id => id !== 'all');
                            return without.includes(loc.id) ? without.filter(id => id !== loc.id) : [...without, loc.id];
                          });
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-bg border border-surface-border cursor-pointer hover:bg-surface-hover transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          selectedLocations.includes(loc.id) || selectedLocations.includes('all') ? 'bg-accent-green border-accent-green' : 'border-surface-border'
                        }`}>
                          {(selectedLocations.includes(loc.id) || selectedLocations.includes('all')) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs text-text-primary flex-1">{loc.name}</span>
                        <span className="text-xs text-text-secondary font-mono">{loc.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projected Performance */}
              <div className="bg-surface-card rounded-xl border border-surface-border shadow-card p-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Projected Performance</h3>
                {(dynamicProjections.noChannels || dynamicProjections.noLocations) && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-accent-gold/[0.08] border border-accent-gold/20">
                    <AlertTriangle className="w-4 h-4 text-accent-gold flex-shrink-0" />
                    <span className="text-xs text-accent-gold">
                      {dynamicProjections.noChannels && 'No channels selected. '}
                      {dynamicProjections.noLocations && 'No locations selected.'}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Est. Revenue', value: dynamicProjections.revenue, icon: DollarSign, color: 'var(--color-accent-green)' },
                    { label: 'Est. Orders', value: dynamicProjections.orders, icon: ShoppingBag, color: 'var(--color-accent-blue)' },
                    { label: 'Projected ROI', value: dynamicProjections.roi, icon: TrendingUp, color: 'var(--color-accent-purple)' },
                    { label: 'Avg Order Value', value: dynamicProjections.aov, icon: BarChart3, color: 'var(--color-accent-gold)' },
                    { label: 'Redemption Rate', value: dynamicProjections.redemptionRate, icon: Percent, color: 'var(--color-accent-red)' },
                    { label: 'Reactivated', value: dynamicProjections.reactivated, icon: RefreshCw, color: 'var(--color-accent-red)' },
                  ].filter(m => m.value && m.value !== '—').map((m) => (
                    <div key={m.label} className="rounded-xl border border-surface-border bg-surface-bg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{m.label}</p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${m.color} 10%, transparent)` }}>
                          <m.icon className="w-4 h-4" style={{ color: m.color }} />
                        </div>
                      </div>
                      <p className="text-lg font-bold text-text-primary">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
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
    key: 'jeeter-spotlight',
    label: 'Jeeter Brand Funded Discount',
    prompt: 'Create a Jeeter brand funded discount campaign with their top pre-rolls and vapes, targeting loyal pre-roll buyers',
    description: 'Brand-sponsored Sale discount on Baby Jeeter Churros, Jeeter Juice, and XL Infused — one-time blast to engaged customers',
    icon: Star,
    accentVar: 'var(--color-accent-purple)',
    tag: 'One-Time Blast',
    tagColor: 'var(--color-accent-purple)',
    confidence: 'high',
  },
  {
    key: 'winback-lapsed',
    label: 'Win-Back Lapsed Segment',
    prompt: 'Design a win-back campaign using EnteredSegment trigger for customers who haven\'t visited in 60+ days with escalating discounts',
    description: 'Automated EnteredSegment trigger for lapsed customers — waterfall email/SMS/push with escalating Advanced discounts',
    icon: Heart,
    accentVar: 'var(--color-accent-red)',
    tag: 'EnteredSegment',
    tagColor: 'var(--color-accent-red)',
    confidence: 'high',
  },
  {
    key: 'retention-program',
    label: 'Build a Retention Program',
    prompt: 'Design a multi-touch retention strategy targeting slowing and at-risk customer segments based on purchase history, frequency trends, and loyalty tier — include re-engagement offers, loyalty point multipliers, and win-back sequences',
    description: 'Multi-touch retention strategy for at-risk segments — re-engagement offers, loyalty multipliers, and automated win-back sequences',
    icon: Heart,
    accentVar: 'var(--color-accent-red)',
    tag: 'Retention',
    tagColor: 'var(--color-accent-red)',
    confidence: 'high',
  },
  {
    key: 'flash-sale-edibles',
    label: 'Flash Sale — Edibles BOGO',
    prompt: 'Create a 48-hour flash sale campaign for edibles featuring Kiva, Wyld, and PLUS gummies with BOGO and Bundle discounts to drive urgency',
    description: 'One-time blast with BOGO and Bundle discounts on Kiva, Wyld, and PLUS gummies — send now or schedule',
    icon: Zap,
    accentVar: 'var(--color-accent-gold)',
    tag: 'One-Time Blast',
    tagColor: 'var(--color-accent-gold)',
  },
  {
    key: 'new-customer-welcome',
    label: 'New Customer Welcome',
    prompt: 'Design a NewCustomer automated welcome campaign with a Mix and Match discount and loyalty enrollment CTA',
    description: 'NewCustomer trigger — welcome series with Mix and Match discount + AfterLoyaltyEnrollment follow-up',
    icon: Package,
    accentVar: 'var(--color-accent-blue)',
    tag: 'NewCustomer',
    tagColor: 'var(--color-accent-blue)',
  },
  {
    key: 'post-purchase-referral',
    label: 'Post-Purchase + Referral',
    prompt: 'Create a PostPurchase automated campaign with a referral program tie-in and Loyalty Multiplier reward for successful referrals',
    description: 'PostPurchase trigger with ReferralSuccess follow-up — Loyalty Multiplier reward and push notification cascade',
    icon: Calendar,
    accentVar: 'var(--color-accent-green)',
    tag: 'PostPurchase',
    tagColor: 'var(--color-accent-green)',
  },
  {
    key: 'acquire-lookalikes',
    label: 'Find More Champions',
    prompt: 'Identify and target new customers who match the behavioral profile of our top 22% highest-value Champions segment — use purchase frequency, basket size, category preferences, and loyalty engagement to build a lookalike acquisition campaign',
    description: 'Lookalike acquisition targeting customers who match your Champions profile — 22% of customers drive 78% of revenue',
    icon: Target,
    accentVar: 'var(--color-accent-purple)',
    tag: 'Acquisition',
    tagColor: 'var(--color-accent-purple)',
    confidence: 'high',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function MarketingCampaigns() {
  const { startThinking, stopThinking } = useNexusState();

  const [view, setView] = useState('idle');
  const [campaignData, setCampaignData] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  const location = useLocation();

  // Handle inbound navigation from Customer Intelligence → create-workflow
  useEffect(() => {
    const ns = location.state;
    if (ns && ns.action === 'create-workflow') {
      const camp = ns.campaign || {};
      const trigger = ns.trigger || 'win_back';
      const channels = ns.channels || ['email', 'sms'];
      const channelStr = channels.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
      const segmentLabel = ns.segment ? ns.segment.charAt(0).toUpperCase() + ns.segment.slice(1).replace(/-/g, ' ') : '';
      const prompt = `Create an automated ${camp.triggerType || trigger} workflow${segmentLabel ? ` for the "${segmentLabel}" segment` : ''}: ${camp.name || 'Campaign'}. ${camp.description || ''}${camp.suggestedDiscount ? ` Suggested discount: ${camp.suggestedDiscount}.` : ''}${camp.loyaltyAction ? ` Loyalty action: ${camp.loyaltyAction}.` : ''} Channels: ${channelStr}.`;
      window.history.replaceState({}, '');
      setMessages([{ role: 'user', text: prompt }]);
      setView('typing');
      setTimeout(() => {
        setView('idle');
        const triggerLabel = { NewCustomer: 'New Customer Welcome', VisitMilestone: 'Visit Milestone', LoyaltyTierSegment: 'Loyalty Tier', WinBack: 'Win-Back / Lapsed', PostPurchase: 'Post-Purchase Follow-Up' }[camp.triggerType] || camp.triggerType || trigger;
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `I'll build an **automated ${triggerLabel} workflow**${segmentLabel ? ` targeting your **${segmentLabel}** segment` : ''}.\n\n**Campaign:** ${camp.name || 'Custom Campaign'}\n**Trigger:** ${triggerLabel}${camp.dormancyDays ? ` (${camp.dormancyDays}-day dormancy)` : ''}${camp.visitCount ? ` (visit #${camp.visitCount})` : ''}${camp.tier ? ` (${camp.tier} tier)` : ''}\n**Channels:** ${channelStr} ${channels.length >= 3 ? '(waterfall cascade)' : ''}\n${camp.suggestedDiscount ? `**Suggested Offer:** ${camp.suggestedDiscount}\n` : ''}${camp.loyaltyAction ? `**Loyalty Action:** ${camp.loyaltyAction}\n` : ''}\n${camp.description || ''}\n\nGenerating your campaign plan now...`,
        }]);
        // Build workflow-specific campaign
        setTimeout(() => {
          const isWaterfall = channels.length >= 3;
          const workflowCampaign = {
            title: camp.name || 'Automated Workflow',
            subtitle: camp.description || `Automated ${triggerLabel} campaign`,
            icon: trigger === 'win_back' ? 'Heart' : trigger === 'new_customer_welcome' ? 'Gift' : trigger === 'loyalty_tier' ? 'Award' : trigger === 'visit_milestone' ? 'Target' : 'Zap',
            accentFrom: trigger === 'win_back' ? '#DC2626' : trigger === 'new_customer_welcome' ? '#7C3AED' : '#059669',
            accentTo: trigger === 'win_back' ? '#EA580C' : trigger === 'new_customer_welcome' ? '#2563EB' : '#0891B2',
            heroGradient: trigger === 'win_back' ? 'from-red-900/60 via-orange-900/40 to-amber-900/60' : trigger === 'new_customer_welcome' ? 'from-purple-900/60 via-blue-900/40 to-indigo-900/60' : 'from-green-900/60 via-teal-900/40 to-cyan-900/60',
            heroBorder: trigger === 'win_back' ? 'border-red-500/30' : trigger === 'new_customer_welcome' ? 'border-purple-500/30' : 'border-green-500/30',
            heroTag: `${triggerLabel} Trigger`,
            campaignType: 'automated',
            triggerType: camp.triggerType || trigger,
            heroImage: null,
            audience: {
              size: segmentLabel === 'Champions' ? '2,840' : segmentLabel === 'Loyal' ? '4,120' : segmentLabel === 'New' ? '2,680' : segmentLabel === 'At risk' ? '1,840' : segmentLabel === 'Lost' ? '2,700' : '3,200',
              description: camp.description || `Target audience for ${camp.name || 'campaign'}`,
              segments: [
                { name: segmentLabel || 'Target Segment', count: segmentLabel === 'Champions' ? '2,840' : segmentLabel === 'New' ? '2,680' : '2,400', desc: camp.description ? camp.description.split('.')[0] : 'Primary audience' },
              ],
            },
            channels: channels.map(ch => ({
              name: ch === 'email' ? 'Email' : ch === 'sms' ? 'SMS' : 'Push Notification',
              icon: ch === 'email' ? 'Mail' : ch === 'sms' ? 'Smartphone' : 'Bell',
              reach: ch === 'email' ? '8,400' : ch === 'sms' ? '6,200' : '3,800',
              rate: ch === 'email' ? '38%' : ch === 'sms' ? '94%' : '12%',
              metric: ch === 'push' ? 'tap rate' : 'open rate',
              cost: ch === 'sms' ? '$0.015/msg' : 'Free',
              ...(ch === 'sms' ? { complianceNote: 'TCPA compliant — opt-in verified' } : {}),
              ...(ch === 'push' ? { note: 'Via Dutchie mobile app' } : {}),
            })),
            isWaterfall,
            schedule: {
              sendType: 'Automated trigger',
              launch: `Triggers on ${camp.triggerType === 'WinBack' ? `${camp.dormancyDays || 45}-day dormancy` : camp.triggerType === 'NewCustomer' ? 'first purchase' : camp.triggerType === 'VisitMilestone' ? `visit #${camp.visitCount || 3}` : camp.triggerType === 'LoyaltyTierSegment' ? `${camp.tier || 'Gold'} tier entry` : 'segment entry'}`,
              duration: 'Ongoing (automated)',
              smartSending: 'Optimize per customer timezone',
              followUp: isWaterfall ? 'Waterfall: Email first, SMS if no open after 48h, Push if no engagement after 72h' : 'Follow-up on non-engagement after 48h',
            },
            discountType: camp.suggestedDiscount ? 'Sale' : 'Loyalty Points',
            discountDetail: camp.suggestedDiscount || camp.loyaltyAction || 'Loyalty points bonus',
            content: {
              headline: camp.name || 'Automated Campaign',
              preheader: camp.description ? camp.description.split('.')[0] : '',
              body: camp.description || '',
              cta: trigger === 'win_back' ? 'Come Back & Save' : trigger === 'new_customer_welcome' ? 'Explore Your Rewards' : 'View Exclusive Offer',
              offer: camp.suggestedDiscount || camp.loyaltyAction || '',
              finePrint: 'Limit one use per customer. Must be 21+.',
              smsPreview: `Ascend: ${camp.name || 'Special offer'} — ${camp.suggestedDiscount || 'exclusive rewards'} waiting for you!`,
            },
            smsMessages: [
              `Ascend: ${camp.suggestedDiscount || camp.loyaltyAction || 'Special offer'} — ${camp.name || 'Your exclusive reward'}. Shop now at ascendwellness.com`,
              'Reply STOP to opt out',
            ],
            featuredProducts: [],
            abTest: { enabled: true, variants: [
              { name: 'A', subject: camp.name || 'Your Exclusive Offer', split: 50 },
              { name: 'B', subject: camp.suggestedDiscount ? `${camp.suggestedDiscount} — Just for You` : 'Don\'t Miss Out', split: 50 },
            ], winnerCriteria: 'Highest open rate after 4 hours' },
            projection: { estRevenue: '$12,800', estOrders: '240', estROI: '4.2x', estAOV: '$53' },
          };
          setCampaignData(workflowCampaign);
          setView('plan');
          setMessages(prev => [...prev, {
            role: 'agent',
            text: `Here's your **${camp.name || 'automated workflow'}** campaign plan. It uses ${isWaterfall ? 'a waterfall cascade across ' : ''}${channelStr}${camp.triggerType ? `, triggered by **${triggerLabel}**` : ''}. Review the details and launch when ready.`,
          }]);
        }, 2000);
      }, 1500);
    }
  }, [location.state]);

  // Handle inbound navigation from BFD accept → campaign creation
  useEffect(() => {
    const ns = location.state;
    if (ns && ns.action === 'bfd-campaign') {
      // Auto-trigger a campaign generation for this BFD
      const prompt = `Create a marketing campaign promoting ${ns.brand} ${ns.discount} on ${ns.products} across ${ns.locations} locations. The brand-funded discount runs until ${ns.endDate} with a $${ns.fundingLimit?.toLocaleString() || '5,000'} funding cap. Drive awareness and maximize redemptions before funding runs out.`;
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, '');
      // Set the prompt as a user message and trigger the flow
      setMessages([{ role: 'user', text: prompt }]);
      setView('typing');
      setTimeout(() => {
        setView('idle');
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `Great — I'll build a campaign to promote **${ns.brand} ${ns.discount}** across your ${ns.locations} locations.\n\nSince this is a **brand-funded discount**, the brand covers the discount cost up to **$${ns.fundingLimit?.toLocaleString() || '5,000'}**. Your goal is to maximize redemptions before the funding cap is reached or the offer expires on **${ns.endDate}**.\n\nI'm generating a multi-channel campaign plan with SMS, email, and push notifications targeting your ${ns.brand} buyers and similar customers. One moment...`,
        }]);
        // After another delay, build a BFD-specific campaign plan
        setTimeout(() => {
          const brand = ns.brand || 'Brand';
          const disc = ns.discount || '20% off';
          const prods = ns.products || 'all products';
          const locs = ns.locations || 5;
          const endDt = ns.endDate || 'Apr 30';
          const fundCap = ns.fundingLimit ? '$' + ns.fundingLimit.toLocaleString() : '$5,000';
          const code = brand.toUpperCase().replace(/\s/g, '') + (disc.match(/\d+/) || ['20'])[0];

          // Build a fresh campaign object customized to this BFD
          const bfdCampaign = {
            title: brand + ' ' + disc + ' — Brand Funded Campaign',
            subtitle: 'Promote ' + brand + ' brand-funded discount across ' + locs + ' locations before ' + endDt,
            icon: 'Tag',
            accentFrom: '#059669',
            accentTo: '#0891B2',
            heroGradient: 'from-green-900/60 via-teal-900/40 to-cyan-900/60',
            heroBorder: 'border-green-500/30',
            heroTag: 'Brand Funded',
            campaignType: 'one-time',
            triggerType: null,
            heroImage: null,
            audience: {
              size: Math.round(locs * 2400).toLocaleString(),
              description: 'Customers who have purchased ' + brand + ' products in the past 90 days, plus lookalike segments from similar category buyers.',
              segments: [
                { name: brand + ' Buyers', count: Math.round(locs * 840).toLocaleString(), desc: 'Purchased ' + brand + ' in last 90 days' },
                { name: 'Category Enthusiasts', count: Math.round(locs * 1100).toLocaleString(), desc: 'Buy similar products but haven\'t tried ' + brand },
                { name: 'High-Value Browsers', count: Math.round(locs * 460).toLocaleString(), desc: 'Browsed ' + brand + ' online but haven\'t purchased' },
              ],
            },
            channels: [
              { name: 'Email', icon: 'Mail', reach: Math.round(locs * 2100).toLocaleString(), rate: '38%', metric: 'open rate', cost: '$0.003/msg', status: 'GA' },
              { name: 'SMS', icon: 'Smartphone', reach: Math.round(locs * 1700).toLocaleString(), rate: '94%', metric: 'open rate', cost: '$0.015/msg', complianceNote: 'TCPA compliant — opt-in verified' },
              { name: 'Push Notification', icon: 'Bell', reach: Math.round(locs * 1100).toLocaleString(), rate: '12%', metric: 'tap rate', cost: 'Free', note: 'Via Dutchie mobile app' },
            ],
            isWaterfall: false,
            schedule: {
              sendType: 'Schedule for later',
              launch: 'Tomorrow · 10:00 AM PT',
              duration: 'Until ' + endDt + ' or funding cap reached',
              smartSending: 'Optimize per customer timezone',
              followUp: 'Non-openers get SMS reminder on Day 3. Non-converters get "last chance" 3 days before ' + endDt + '.',
            },
            discountType: 'Sale',
            discountDetail: disc + ' — Brand Funded by ' + brand + ' (cap: ' + fundCap + ')',
            content: {
              headline: brand + ' ' + disc + ' — Limited Time 🔥',
              preheader: 'Brand-funded savings on ' + prods + ' while funding lasts',
              body: brand + ' is funding ' + disc + ' on ' + prods + ' at your Ascend locations. This deal runs until ' + endDt + ' or until the ' + fundCap + ' funding cap is reached — whichever comes first. Don\'t miss out on savings the brand is paying for.',
              cta: 'Shop ' + brand + ' Now →',
              offer: disc + ' on ' + prods + ' — Brand Funded by ' + brand + ' — code ' + code + ' — valid until ' + endDt,
              finePrint: 'Brand-funded discount. Limit one use per customer. While funding lasts. Must be 21+.',
              smsPreview: 'Ascend: ' + brand + ' is funding ' + disc + ' on ' + prods + '! Use code ' + code + ' before ' + endDt + '. Shop now → ascendwellness.com',
            },
            smsMessages: [
              'Ascend: ' + brand + ' ' + disc + ' on ' + prods + '! Brand-funded savings — use code ' + code + ' before ' + endDt + '. Shop → ascendwellness.com/' + brand.toLowerCase().replace(/\s/g, '-'),
              'Reply STOP to opt out',
            ],
            featuredProducts: [],
            abTest: {
              enabled: true,
              variants: [
                { name: 'A', subject: brand + ' ' + disc + ' — Brand-Funded Savings', split: 50 },
                { name: 'B', subject: 'Save on ' + prods + ' — ' + brand + ' is buying ' + disc, split: 50 },
              ],
              winnerCriteria: 'Highest open rate after 4 hours',
            },
            projection: {
              estRevenue: '$' + Math.round(locs * 4200).toLocaleString(),
              estOrders: Math.round(locs * 180).toLocaleString(),
              estROI: '12.4x',
              estAOV: '$' + Math.round(23 + locs).toLocaleString(),
            },
          };

          setCampaignData(bfdCampaign);
          setView('plan');
          setMessages(prev => [...prev, {
            role: 'agent',
            text: 'Here\'s your campaign plan promoting **' + brand + ' ' + disc + '** on ' + prods + '. The audience targets existing ' + brand + ' buyers plus lookalike segments across ' + locs + ' locations. All copy references the brand-funded discount and the **' + code + '** code to drive urgency before **' + endDt + '**.',
          }]);
        }, 2000);
      }, 1500);
    }
  }, [location.state]);


  // Sync NexusIcon thinking state with view
  useEffect(() => {
    if (view === 'typing') startThinking();
    else stopThinking();
    return () => stopThinking();
  }, [view, startThinking, stopThinking]);

  const handleSuggestionClick = async (key) => {
    const suggestion = SUGGESTIONS.find((s) => s.key === key);
    setMessages((prev) => [...prev, { role: 'user', text: suggestion.label }]);
    setView('typing');

    // Immediately show preset/fallback campaign (no waiting for AI)
    const presetMap = {
      'jeeter-spotlight': 'jeeter', 'winback-lapsed': 'winback', 'birthday-rewards': 'birthday',
      'flash-sale-edibles': 'jeeter', 'new-customer-welcome': 'jeeter', 'post-purchase-referral': 'birthday',
    };
    const presetKey = presetMap[key] || 'jeeter';
    const presetCampaign = CAMPAIGNS[presetKey];
    setCampaignData(presetCampaign);

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: 'agent',
        text: `I've built a comprehensive **${presetCampaign.title}** campaign based on your customer data. Here's the full plan:`
      }]);
      setView('plan');
    }, 800);

    // Then try to enhance with AI-generated campaign in the background
    if (isGeminiAvailable()) {
      try {
        const plan = await generateMarketingCampaignPlan(suggestion.prompt);
        if (plan && plan.title) {
          setCampaignData(plan);
          setMessages((prev) => {
            const updated = [...prev];
            const lastAgentIdx = updated.map(m => m.role).lastIndexOf('agent');
            if (lastAgentIdx >= 0) {
              updated[lastAgentIdx] = {
                role: 'agent',
                text: `I've analyzed your customer data and built a comprehensive **${plan.title}** campaign. Here's the full plan with creative, targeting, and projected performance:`
              };
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('[MarketingCampaigns] AI enhancement failed:', err);
        // Preset campaign is already showing — no action needed
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

    // Show fallback preset campaign immediately
    const lower = text.toLowerCase();
    let matchKey = null;
    if (lower.includes('win back') || lower.includes('lost') || lower.includes('lapsed') || lower.includes('re-engage') || lower.includes('inactive') || lower.includes('churn') || lower.includes('haven\'t visited') || lower.includes('dormant') || lower.includes('entered segment') || lower.includes('enteredsegment')) matchKey = 'winback';
    else if (lower.includes('birthday') || lower.includes('bday') || lower.includes('upcomingbirthday') || lower.includes('loyalty award') || lower.includes('loyalty multiplier') || lower.includes('tier') || lower.includes('4/20') || lower.includes('holiday') || lower.includes('seasonal') || lower.includes('event')) matchKey = 'birthday';
    else if (lower.includes('jeeter') || lower.includes('brand funded') || lower.includes('brand spotlight') || lower.includes('bogo') || lower.includes('bundle') || lower.includes('sale') || lower.includes('mix and match')) matchKey = 'jeeter';
    else if (lower.includes('new customer') || lower.includes('welcome') || lower.includes('newcustomer') || lower.includes('post purchase') || lower.includes('postpurchase') || lower.includes('referral') || lower.includes('abandoned') || lower.includes('abandonedcart')) matchKey = 'jeeter';
    else matchKey = 'winback';

    const presetCampaign = CAMPAIGNS[matchKey];
    setCampaignData(presetCampaign);
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: 'agent',
        text: `Great idea! I've built a comprehensive **${presetCampaign.title}** campaign based on your customer data. Take a look at the full plan:`
      }]);
      setView('plan');
    }, 800);

    // Then try to enhance with AI in the background
    if (isGeminiAvailable()) {
      try {
        const plan = await generateMarketingCampaignPlan(text);
        if (plan && plan.title) {
          setCampaignData(plan);
          setMessages((prev) => {
            const updated = [...prev];
            const lastAgentIdx = updated.map(m => m.role).lastIndexOf('agent');
            if (lastAgentIdx >= 0) {
              updated[lastAgentIdx] = {
                role: 'agent',
                text: `I've generated a complete **${plan.title}** campaign plan based on your request. Here's the full plan with targeting, creative, and projected performance:`
              };
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('[MarketingCampaigns] AI enhancement failed:', err);
      }
    }
  };

  const handleBack = () => { setView('idle'); setCampaignData(null); };

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
          <Megaphone className="w-4 h-4 text-accent-green" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Growth Agent</h1>
          <p className="text-xs text-text-secondary">Campaign Builder — Dutchie AI</p>
        </div>
      </div>

      {/* chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && view === 'idle' && (
          <div className="flex flex-col items-center justify-center py-6 lg:py-12" style={{ minHeight: 200 }}>
            <div className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center mb-4" style={{ background: 'var(--color-surface-bg)', boxShadow: '0 0 24px color-mix(in srgb, var(--color-accent-gold) 15%, transparent), 0 0 8px color-mix(in srgb, var(--color-accent-gold) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-gold) 20%, transparent)' }}>
              <NexusIcon size={30} />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-1.5 text-center">Growth Agent</h2>
            <p className="text-[13px] text-text-secondary text-center max-w-[400px] leading-relaxed">
              Build targeted campaigns with AI-powered audience segmentation, multi-channel delivery, and real-time optimization.
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
            <div className={`rounded-2xl px-5 py-3 max-w-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent-gold/15 border border-accent-gold/20 text-text-primary rounded-tr-sm'
                : 'bg-surface-card/80 border border-surface-border/60 text-text-primary rounded-tl-sm'
            }`}>
              <span className="whitespace-pre-wrap">{msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}</span>
            </div>
          </div>
        ))}

        {view === 'typing' && <TypingIndicator />}

        {view === 'plan' && campaignData && (
          <div className="max-w-[780px] mx-auto rounded-xl border border-surface-border bg-surface-card overflow-hidden overflow-x-auto">
            <div className="p-1">
              <CampaignPlan data={campaignData} onBack={handleBack} />
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
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${s.accentVar} 12%, transparent)` }}>
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
            placeholder="Describe a campaign — e.g. PostPurchase upsell, AbandonedCart recovery, NewCustomer welcome..."
            className="flex-1 bg-transparent text-base lg:text-sm text-text-primary placeholder-text-muted outline-none"
            disabled={view === 'typing'}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || view === 'typing'}
            className="w-9 h-9 rounded-xl bg-accent-green flex items-center justify-center text-white disabled:opacity-30 hover:brightness-110 transition-all disabled:hover:brightness-100 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
