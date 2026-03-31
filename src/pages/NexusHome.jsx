import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../contexts/StoreContext';
import { useDateRange } from '../contexts/DateRangeContext';
import { usePersona } from '../contexts/PersonaContext';
import { locations } from '../data/mockData';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
  ZAxis, Cell, BarChart, Bar, AreaChart, Area,
  PieChart, Pie,
} from 'recharts';
import {
  TrendingUp, AlertTriangle, ShoppingBag, Package, DollarSign,
  Star, MessageSquare, BarChart3, Send, Sparkles, ChevronRight,
  MapPin, ThumbsUp, ThumbsDown, Mic, AlertCircle, ArrowUpRight,
  ArrowDownRight, Minus, CheckCircle2, Smartphone, QrCode, Monitor,
  Layers, Radio, Activity, Percent, Receipt, Store, Globe, Shield,
  Megaphone, ShoppingCart, ChevronDown, Rocket, ArrowRightLeft, Check, Lock,
  Building2, Truck, Users, RefreshCw, FileText, Clipboard, Target, Eye, Calendar, X,
} from 'lucide-react';
import NexusIcon from '../components/NexusIcon';
import ConfirmationDrawer from '../components/common/ConfirmationDrawer';

// ---------------------------------------------------------------------------
// Per-store metrics — deterministically generated for all 39 Ascend stores
// State-based parameters from real MSO dispensary data (2024 earnings)
// Revenue in thousands per month; ranges reflect limited-license vs saturated markets
// ---------------------------------------------------------------------------

function _seedRng(seed) {
  let s = seed | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// State-level parameters: monthly revenue (thousands), basket ($), margin (%)
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

  // Revenue: outlets get bottom of range, flagships get top
  const tierShift = isOutlet ? -0.30 : (rng() > 0.6 ? 0.25 : 0);
  const baseRev = sp.revMid + (rng() - 0.5) * (sp.revHigh - sp.revLow) * 0.6;
  const revenue = Math.round(Math.max(sp.revLow * 0.8, baseRev * (1 + tierShift)) * 10) / 10;

  // Basket: drawn from state range with small noise
  const avgBasket = Math.round((sp.basketLow + rng() * (sp.basketHigh - sp.basketLow) + (isOutlet ? -3 : 0)) * 100) / 100;

  // Transactions: derived from revenue / basket (keeps the math consistent)
  const transactions = Math.round((revenue * 1000) / avgBasket);

  // Margin: from state range, outlets get -1 to -2 pp
  const margin = Math.round((sp.gmLow + rng() * (sp.gmHigh - sp.gmLow) + (isOutlet ? -(1 + rng()) : 0)) * 10) / 10;

  const sentimentScore = Math.round(50 + rng() * 40);
  const sentimentDelta = Math.round((rng() * 20 - 10) * 10) / 10;
  const sentimentFlag = sentimentDelta <= -6 ? 'alert' : sentimentDelta >= 6 ? 'improving' : sentimentDelta <= -3 ? 'watch' : null;
  const vsBenchmark = Math.round((rng() * 30 - 8) * 10) / 10;
  return {
    name: loc.name, state: loc.state, city: loc.city,
    revenue, transactions, avgBasket, margin,
    sentimentScore, sentimentDelta, sentimentFlag, vsBenchmark,
    revenueWeight: Math.round((revenue / 1000) * 100) / 100,
  };
});

// ---------------------------------------------------------------------------
// Mock Nexus data — blending existing sentiment data with Nexus tile metrics
// ---------------------------------------------------------------------------

const NEXUS_DATA = {
  // Contextualized Insights (base = 30-day period)
  todaySales: 13_640_000,
  salesGoal: 15_000_000,
  salesVsGoalPct: -8,
  topStore: 'Logan Square, Chicago',
  topStoreRevenue: 750_000,
  underperformer: 'Morenci, MI',
  underperformerDelta: -23,
  traffic: { today: 175_500, yesterday: 169_200, trend: 'up' },

  // Inventory
  lowStockAlerts: 7,
  stockoutRisk: 3,
  topLowStock: [
    { product: 'Ozone Cake Mints 3.5g', store: 'Logan Square', daysLeft: 1.5 },
    { product: 'Simply Herb Gummies 100mg', store: 'Fort Lee', daysLeft: 2 },
    { product: 'Tunnel Vision 5-Pack', store: 'Boston', daysLeft: 0.5 },
  ],

  // Loyalty
  activeMembers: 18_420,
  atRiskCustomers: 1_247,
  loyaltyScore: 72,
  loyaltyTrend: -3,
  avgVisitFreq: 2.4,

  // Pricing & Discounts
  discountWaste: 127_400,
  underperformingPromos: 3,
  marketPriceGap: '+6%',
  topWastedPromo: '20% Off Edibles (Mon)',

  // Brand Awareness
  topBrand: 'Ozone',
  topBrandScore: 82,
  brandFundingAvailable: 2_150,
  brandTrend: 'up',

  // Voice AI
  voiceCalls: 200,
  voiceOrders: 67,
  voiceRevenue: 6_843,
  voiceAvgOrder: 102,
  voiceSentiment: 0.31,
  voiceResolution: 78,

  // Sentiment (from consumer intelligence)
  overallSentiment: 68,
  sentimentTrend: 'up',
  sentimentDelta: +4,
  positiveReviews: 220,
  neutralReviews: 89,
  negativeReviews: 135,
  totalReviews: 444,
  topPositiveTopic: 'Staff Friendliness',
  topNegativeTopic: 'Wait Times',
  npsScore: 34,
  npsDelta: +6,
  responseRate: 42,

  // Topic-level sentiment
  sentimentTopics: [
    { topic: 'Staff Friendliness', score: 84, delta: +7, reviews: 62, trend: 'up' },
    { topic: 'Product Quality', score: 76, delta: +2, reviews: 58, trend: 'up' },
    { topic: 'Store Cleanliness', score: 73, delta: 0, reviews: 31, trend: 'flat' },
    { topic: 'Wait Times', score: 38, delta: -5, reviews: 74, trend: 'down' },
    { topic: 'Online Ordering', score: 61, delta: +12, reviews: 45, trend: 'up' },
    { topic: 'Product Selection', score: 70, delta: -1, reviews: 40, trend: 'flat' },
  ],

  // Location sentiment
  locationSentiment: [
    { location: 'Logan Square, Chicago', score: 78, delta: +6, flag: null },
    { location: 'Fort Lee, NJ', score: 72, delta: +8, flag: 'improving' },
    { location: 'Boston, MA', score: 65, delta: -3, flag: 'watch' },
    { location: 'Morenci, MI', score: 52, delta: -9, flag: 'alert' },
  ],

  // Source breakdown
  sentimentBySrc: [
    { source: 'Google', reviews: 168, avg: 3.9 },
    { source: 'Leafly', reviews: 112, avg: 4.1 },
    { source: 'Weedmaps', reviews: 87, avg: 3.6 },
    { source: 'Dutchie', reviews: 77, avg: 4.3 },
  ],

  // AI suggestions
  sentimentActions: [
    { priority: 'high', action: 'Morenci MI: SMS surveys + QR data show wait time complaints in 68% of negative feedback — add 2 afternoon staff', impact: 'Est. +8pt unified sentiment lift' },
    { priority: 'high', action: 'Voice CSAT at Morenci is 3.1 vs 4.5 elsewhere — speech recognition model needs tuning for regional accent variations', impact: 'Est. +1.2 CSAT improvement' },
    { priority: 'medium', action: 'Logan Square first-party score (82) is 8pts above Google Reviews (74) — prompt happy SMS respondents to leave public reviews', impact: 'Est. +0.4 Google star rating' },
    { priority: 'medium', action: 'Reddit sentiment on Ozone Reserve brand dropped 15% — confirmed by 23% of SMS respondents mentioning "expensive"', impact: 'Price adjustment or promotion needed' },
    { priority: 'low', action: 'Kiosk reactions capture 3.2x more data than ecomm — move emoji prompt to the "order confirmed" screen on ecomm', impact: 'Est. +40% reaction capture rate' },
  ],

  // -------------------------------------------------------------------------
  // Omnichannel First-Party Sentiment Collection
  // -------------------------------------------------------------------------

  // Post-Purchase SMS Micro-Surveys
  smsChannel: {
    sent: 1_842,
    responded: 926,
    responseRate: 50.3,
    avgSentiment: 74,
    sentimentDelta: +6,
    todaySent: 48,
    todayResponded: 26,
    topInsight: 'Budtender recommendations driving repeat purchases — 62% of positive SMS mentions staff by name.',
    recentConversations: [
      {
        store: 'Logan Square',
        time: '2:34 PM',
        messages: [
          { from: 'system', text: 'How was your experience at Logan Square today? Reply with a quick thought.' },
          { from: 'customer', text: 'Great! Marcus recommended the Ozone gummies and they\'re exactly what I needed. Will be back.' },
        ],
        sentiment: 'positive',
        mappedTo: { budtender: 'Marcus T.', product: 'Ozone Cake Mints Gummies', txnId: 'TXN-8834' },
      },
      {
        store: 'Fort Lee',
        time: '1:12 PM',
        messages: [
          { from: 'system', text: 'How was your visit to Fort Lee today? We\'d love to hear.' },
          { from: 'customer', text: 'Waited 20 min even though I ordered ahead online. Pretty frustrating.' },
        ],
        sentiment: 'negative',
        mappedTo: { budtender: 'Jamie R.', product: null, txnId: 'TXN-8821' },
      },
      {
        store: 'Boston',
        time: '11:45 AM',
        messages: [
          { from: 'system', text: 'How was your pickup at Boston today? Quick reply is all we need!' },
          { from: 'customer', text: 'Smooth and fast. Love the new online ordering flow too.' },
        ],
        sentiment: 'positive',
        mappedTo: { budtender: 'Alex K.', product: null, txnId: 'TXN-8807' },
      },
    ],
  },

  // In-Menu Embedded Sentiment (Ecomm/Kiosk)
  ecommChannel: {
    totalReactions: 3_214,
    withFreeText: 486,
    freeTextRate: 15.1,
    reactionsToday: 87,
    breakdown: [
      { emoji: '😍', label: 'Love it', count: 1_286, pct: 40 },
      { emoji: '😊', label: 'Good', count: 1_028, pct: 32 },
      { emoji: '😐', label: 'Meh', count: 579, pct: 18 },
      { emoji: '😒', label: 'Not great', count: 321, pct: 10 },
    ],
    topProductSentiment: [
      { product: 'Ozone Cake Mints 3.5g', loves: 84, goods: 31, mehs: 5, bads: 2, score: 91 },
      { product: 'Ozone Reserve Elite Cart 1g', loves: 62, goods: 28, mehs: 12, bads: 8, score: 74 },
      { product: 'Simply Herb Gummies', loves: 44, goods: 38, mehs: 18, bads: 14, score: 63 },
    ],
    topInsight: 'Kiosk users leave 3.2x more reactions than ecomm — place feedback prompt on the "order confirmed" screen for maximum capture.',
  },

  // AI Voice Survey (Post-Call CSAT)
  voiceSurveyChannel: {
    surveyed: 156,
    completed: 141,
    completionRate: 90.4,
    avgCsat: 4.2,
    csatDelta: +0.3,
    distribution: [
      { rating: 5, count: 68, pct: 48.2 },
      { rating: 4, count: 39, pct: 27.7 },
      { rating: 3, count: 19, pct: 13.5 },
      { rating: 2, count: 10, pct: 7.1 },
      { rating: 1, count: 5, pct: 3.5 },
    ],
    recentVerbatim: [
      { rating: 5, text: 'The AI was super helpful, got my order placed in like 30 seconds. Way better than waiting on hold.', store: 'Boston' },
      { rating: 2, text: 'Couldn\'t understand me when I asked about strain effects. Had to repeat myself three times.', store: 'Morenci' },
      { rating: 4, text: 'Quick and easy. Would be nice if it remembered my usual order though.', store: 'Fort Lee' },
    ],
    topInsight: 'Voice CSAT at Morenci is 3.1 vs 4.5 at other stores — speech recognition model needs tuning for regional accent variations.',
  },

  // QR Code "Moment of Truth"
  qrChannel: {
    printed: 5_420,
    scanned: 423,
    completed: 287,
    scanRate: 7.8,
    completionRate: 67.8,
    avgScore: 4.1,
    topStore: { name: 'Logan Square', scanRate: 12.3 },
    worstStore: { name: 'Morenci', scanRate: 3.1 },
    budtenderLeaderboard: [
      { name: 'Marcus T.', store: 'Logan Square', surveys: 34, avgScore: 4.8, topComment: 'Always knows exactly what to recommend' },
      { name: 'Alex K.', store: 'Fort Lee', surveys: 28, avgScore: 4.6, topComment: 'Super patient and knowledgeable' },
      { name: 'Jamie R.', store: 'Morenci', surveys: 19, avgScore: 3.2, topComment: 'Seemed rushed, didn\'t answer my questions' },
    ],
    topInsight: 'QR surveys with budtender auto-mapping reveal Jamie R. at Morenci is tied to 68% of negative feedback — coaching opportunity.',
  },

  // Unified Pipeline — first-party + third-party merged
  unifiedPipeline: {
    totalSignals: 5_314,
    firstPartySignals: 2_380,
    thirdPartySignals: 2_934,
    firstPartyPct: 44.8,
    unifiedScore: 71,
    unifiedDelta: +5,
    channelScores: [
      { channel: 'SMS Micro-Surveys', type: 'first-party', signals: 926, score: 74, icon: 'sms' },
      { channel: 'Ecomm/Kiosk Reactions', type: 'first-party', signals: 3_214, score: 72, icon: 'ecomm', note: 'weighted by free-text' },
      { channel: 'Voice AI CSAT', type: 'first-party', signals: 141, score: 76, icon: 'voice' },
      { channel: 'QR Receipt Surveys', type: 'first-party', signals: 287, score: 68, icon: 'qr' },
      { channel: 'Google Reviews', type: 'third-party', signals: 168, score: 64, icon: 'google' },
      { channel: 'Leafly', type: 'third-party', signals: 112, score: 72, icon: 'leafly' },
      { channel: 'Weedmaps', type: 'third-party', signals: 87, score: 58, icon: 'weedmaps' },
      { channel: 'Reddit', type: 'third-party', signals: 203, score: 52, icon: 'reddit' },
      { channel: 'Dutchie Reviews', type: 'third-party', signals: 77, score: 78, icon: 'dutchie' },
    ],
    divergences: [
      { store: 'Morenci, MI', firstParty: 48, thirdParty: 61, delta: -13, insight: 'In-store NPS is 48, but Google Reviews show 61 — customers leaving positive public reviews but negative private feedback about wait times.' },
      { store: 'Logan Square, Chicago', firstParty: 82, thirdParty: 74, delta: +8, insight: 'First-party signals 8pts higher — happy customers not leaving public reviews. Prompt top SMS respondents to post on Google.' },
    ],
    keyInsight: 'Your in-store NPS is 72, but Reddit sentiment on your Ozone Reserve brand dropped 15% this month — price complaints on r/ILTrees driving it. First-party SMS data confirms: 23% of Ozone Reserve purchasers mention "expensive" in post-purchase feedback.',
  },
};

// Mini pricing scatter data — mirrors PricingAgent's PRICING_PRODUCTS
const MINI_PRICING_PRODUCTS = [
  { id: 'pp-1', name: 'Baby Jeeter Churros', brand: 'Jeeter', grossPrice: 35, marketAvg: 33, weeklyUnits: 62 },
  { id: 'pp-2', name: 'OG Kush Pod 1g', brand: 'STIIIZY', grossPrice: 45, marketAvg: 42, weeklyUnits: 42 },
  { id: 'pp-3', name: 'Camino Pineapple Habanero', brand: 'Kiva', grossPrice: 22, marketAvg: 22, weeklyUnits: 55 },
  { id: 'pp-4', name: 'Slippery Susan Cart 1g', brand: 'Raw Garden', grossPrice: 40, marketAvg: 38, weeklyUnits: 28 },
  { id: 'pp-5', name: 'Elderberry Indica Gummies', brand: 'Wyld', grossPrice: 18, marketAvg: 18, weeklyUnits: 35 },
  { id: 'pp-6', name: 'Gary Payton 3.5g', brand: 'Cookies', grossPrice: 55, marketAvg: 52, weeklyUnits: 18 },
  { id: 'pp-7', name: 'Atomic Apple 3.5g', brand: 'Alien Labs', grossPrice: 50, marketAvg: 48, weeklyUnits: 22 },
  { id: 'pp-8', name: 'Sour Watermelon Gummies', brand: 'PLUS', grossPrice: 20, marketAvg: 19, weeklyUnits: 30 },
];

const MINI_SCATTER_DATA = MINI_PRICING_PRODUCTS.map(p => ({
  x: p.marketAvg,
  y: p.grossPrice,
  z: p.weeklyUnits,
  name: p.name,
  brand: p.brand,
  gap: ((p.grossPrice - p.marketAvg) / p.marketAvg * 100),
}));

const MINI_PRICE_MIN = Math.min(...MINI_PRICING_PRODUCTS.map(p => Math.min(p.marketAvg, p.grossPrice))) - 3;
const MINI_PRICE_MAX = Math.max(...MINI_PRICING_PRODUCTS.map(p => Math.max(p.marketAvg, p.grossPrice))) + 3;

// ---------------------------------------------------------------------------
// Sales Reporting Data
// ---------------------------------------------------------------------------

const SALES_DATA = {
  periods: {
    today: {
      revenue: 454_700, revenueGoal: 500_000, revenueDelta: -8,
      transactions: 5_460, transactionsDelta: +7.5,
      avgBasket: 83.28, avgBasketDelta: -2.1,
      grossMargin: 48.2, grossMarginDelta: +0.8,
      marketBenchmark: { revenue: 418_000, avgBasket: 78, margin: 45.6, transactions: 5_120 },
    },
    week: {
      revenue: 3_183_000, revenueGoal: 3_500_000, revenueDelta: +3.2,
      transactions: 38_220, transactionsDelta: +5.1,
      avgBasket: 83.30, avgBasketDelta: -0.4,
      grossMargin: 47.8, grossMarginDelta: +1.2,
      marketBenchmark: { revenue: 2_926_000, avgBasket: 79, margin: 44.9, transactions: 35_800 },
    },
    month: {
      revenue: 13_640_000, revenueGoal: 15_000_000, revenueDelta: +6.8,
      transactions: 163_700, transactionsDelta: +8.3,
      avgBasket: 83.32, avgBasketDelta: +1.5,
      grossMargin: 47.4, grossMarginDelta: +0.6,
      marketBenchmark: { revenue: 12_540_000, avgBasket: 80, margin: 44.2, transactions: 152_000 },
    },
  },
  categories: [
    { name: 'Flower', revenue: 5_196_000, pct: 38.1, units: 62_400, margin: 42.9, marketShare: 35, color: '#E87068' },
    { name: 'Vapes', revenue: 3_093_000, pct: 22.7, units: 49_600, margin: 45.9, marketShare: 24, color: '#00BCD4' },
    { name: 'Edibles', revenue: 2_401_000, pct: 17.6, units: 82_000, margin: 55.0, marketShare: 19, color: 'var(--color-accent-purple)' },
    { name: 'Pre-Rolls', revenue: 1_610_000, pct: 11.8, units: 31_200, margin: 48.6, marketShare: 12, color: '#FF6B35' },
    { name: 'Concentrates', revenue: 887_000, pct: 6.5, units: 15_600, margin: 44.7, marketShare: 7, color: '#E91E63' },
    { name: 'Other', revenue: 453_000, pct: 3.2, units: 12_800, margin: 52.3, marketShare: 3, color: '#8B949E' },
  ],
  brands: [
    { name: 'Jeeter', revenue: 2_401_000, units: 48_200, margin: 48.6, avgPrice: 34.94, trend: +12.3, rank: 1 },
    { name: 'STIIIZY', revenue: 1_951_000, units: 30_400, margin: 46.7, avgPrice: 45.00, trend: +5.1, rank: 2 },
    { name: 'Cookies', revenue: 1_506_000, units: 19_200, margin: 41.8, avgPrice: 55.00, trend: -3.2, rank: 3 },
    { name: 'Kiva', revenue: 1_318_000, units: 42_000, margin: 54.5, avgPrice: 22.00, trend: +8.7, rank: 4 },
    { name: 'Raw Garden', revenue: 1_119_000, units: 19_600, margin: 45.0, avgPrice: 40.00, trend: +1.4, rank: 5 },
    { name: 'Wyld', revenue: 899_000, units: 35_000, margin: 55.6, avgPrice: 18.00, trend: +15.2, rank: 6 },
  ],
  stores: STORE_METRICS.sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((s, i, arr) => {
    const totalRev = arr.reduce((sum, x) => sum + x.revenue, 0);
    return {
      name: s.name.replace('Ascend ', ''), revenue: Math.round(s.revenue * 1000),
      pct: Math.round((s.revenue / totalRev) * 1000) / 10,
      transactions: s.transactions, avgBasket: s.avgBasket, margin: s.margin, vsBenchmark: Math.round(s.vsBenchmark),
    };
  }),
};

// Category bar chart data for recharts
const CATEGORY_BAR_DATA = SALES_DATA.categories.map(c => ({
  name: c.name,
  revenue: c.revenue,
  marketShare: c.marketShare,
  yourShare: c.pct,
  margin: c.margin,
  color: c.color,
}));

// Time-series data for the sales line chart — keyed by period
const SALES_TIMESERIES = {
  today: [
    { time: '9 AM',  revenue: 22_700, transactions: 273, avgBasket: 83, margin: 49.1, marketRevenue: 20_800 },
    { time: '10 AM', revenue: 68_200, transactions: 819, avgBasket: 83, margin: 48.6, marketRevenue: 62_700 },
    { time: '11 AM', revenue: 136_400, transactions: 1_638, avgBasket: 83, margin: 48.2, marketRevenue: 125_300 },
    { time: '12 PM', revenue: 204_600, transactions: 2_457, avgBasket: 83, margin: 47.8, marketRevenue: 188_000 },
    { time: '1 PM',  revenue: 272_800, transactions: 3_276, avgBasket: 83, margin: 48.0, marketRevenue: 250_800 },
    { time: '2 PM',  revenue: 318_300, transactions: 3_822, avgBasket: 83, margin: 48.3, marketRevenue: 292_500 },
    { time: '3 PM',  revenue: 363_800, transactions: 4_368, avgBasket: 83, margin: 48.1, marketRevenue: 334_200 },
    { time: '4 PM',  revenue: 400_100, transactions: 4_806, avgBasket: 83, margin: 48.0, marketRevenue: 367_700 },
    { time: '5 PM',  revenue: 431_900, transactions: 5_187, avgBasket: 83, margin: 48.2, marketRevenue: 396_800 },
    { time: '6 PM',  revenue: 454_700, transactions: 5_460, avgBasket: 83, margin: 48.2, marketRevenue: 418_000 },
  ],
  week: [
    { time: 'Mon', revenue: 409_200, transactions: 4_914, avgBasket: 83, margin: 47.2, marketRevenue: 376_200 },
    { time: 'Tue', revenue: 418_000, transactions: 5_024, avgBasket: 83, margin: 47.6, marketRevenue: 384_200 },
    { time: 'Wed', revenue: 459_200, transactions: 5_520, avgBasket: 83, margin: 48.1, marketRevenue: 422_200 },
    { time: 'Thu', revenue: 440_800, transactions: 5_298, avgBasket: 83, margin: 47.8, marketRevenue: 405_200 },
    { time: 'Fri', revenue: 500_200, transactions: 6_010, avgBasket: 83, margin: 48.4, marketRevenue: 459_800 },
    { time: 'Sat', revenue: 527_300, transactions: 6_336, avgBasket: 83, margin: 48.2, marketRevenue: 484_600 },
    { time: 'Sun', revenue: 428_300, transactions: 5_118, avgBasket: 84, margin: 46.8, marketRevenue: 393_800 },
  ],
  month: [
    { time: 'Week 1',  revenue: 3_092_000, transactions: 37_200, avgBasket: 83, margin: 47.1, marketRevenue: 2_840_000 },
    { time: 'Week 2',  revenue: 3_274_000, transactions: 39_390, avgBasket: 83, margin: 47.4, marketRevenue: 3_008_000 },
    { time: 'Week 3',  revenue: 3_592_000, transactions: 43_200, avgBasket: 83, margin: 47.8, marketRevenue: 3_302_000 },
    { time: 'Week 4',  revenue: 3_682_000, transactions: 44_310, avgBasket: 83, margin: 47.2, marketRevenue: 3_390_000 },
  ],
};

const CHART_METRICS = [
  { key: 'revenue', label: 'Revenue', color: '#00C27C', format: v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`, benchKey: 'marketRevenue' },
  { key: 'transactions', label: 'Transactions', color: '#64A8E0', format: v => v.toLocaleString(), benchKey: null },
  { key: 'avgBasket', label: 'Avg Basket', color: 'var(--color-accent-purple)', format: v => `$${v}`, benchKey: null },
  { key: 'margin', label: 'Margin %', color: '#D4A03A', format: v => `${v}%`, benchKey: null },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDollar(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Tile Components
// ---------------------------------------------------------------------------

function NexusTile({ children, className = '', span = 1, onClick }) {
  const spanClass = span === 2 ? 'lg:col-span-2' : span === 3 ? 'lg:col-span-3' : '';
  return (
    <div
      className={`rounded-2xl border border-surface-border bg-surface-card transition-all duration-200 ${onClick ? 'hover:brightness-110' : ''} overflow-hidden ${spanClass} ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)', cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function TileHeader({ icon: Icon, title, subtitle, action, actionLabel, iconBg = 'bg-accent-green/10 text-accent-green', badge }) {
  return (
    <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} />
          {badge && (
            <span className={`absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${badge.color || 'bg-accent-red'}`}>
              {badge.count}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={action}
          className="flex items-center gap-1 rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-110"
        >
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function StatRow({ label, value, sub, trend, color }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="text-right">
        <span className={`text-lg font-bold ${color || 'text-text-primary'}`}>{value}</span>
        {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
        {trend !== undefined && (
          <span className={`ml-2 text-xs font-medium ${trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}


function MorningBriefing() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
  const { selectedStoreNames, isAllSelected, selectionLabel } = useStores();
  const { dateMultiplier, rangeLabel, trendScale } = useDateRange();
  const { selectedPersona, isCEO, isVP, isRegional, isStoreMgr, isCompliance } = usePersona();

  const storeRatio = useMemo(() => {
    if (isAllSelected) return 1;
    const totalRev = STORE_METRICS.reduce((sum, s) => sum + s.revenue, 0);
    const selRev = STORE_METRICS.filter(s => selectedStoreNames.has(s.name)).reduce((sum, s) => sum + s.revenue, 0);
    return totalRev > 0 ? selRev / totalRev : 0;
  }, [selectedStoreNames, isAllSelected]);

  const scaledRevenue = Math.round(NEXUS_DATA.todaySales * storeRatio * dateMultiplier);
  const scaledTraffic = Math.round(NEXUS_DATA.traffic.today * storeRatio * dateMultiplier);
  const scaledStockouts = Math.max(1, Math.round(NEXUS_DATA.lowStockAlerts * storeRatio));
  const scaledCritical = Math.max(1, Math.round(NEXUS_DATA.stockoutRisk * storeRatio));

  const briefingText = useMemo(() => {
    if (isCEO) return '"Portfolio revenue $1.2M yesterday, +6.8% same-store growth vs last year. IL and NJ leading at +9% and +7% SSG. MI flat — 3 stores dragging avg. Inventory turnover at 4.2x (target 5x). 87 SKUs currently out of stock across 8 stores — estimated $112K in missed sales yesterday. Margin holding at 48.2%."';
    if (isVP) return '"Your 23 stores did $720K yesterday. Same-store growth +5.1% YoY. Logan Square top performer at $48.2K. Morenci down 23% — foot traffic declining 3 weeks straight, may need local campaign. 34 out-of-stock SKUs across your region — $48K in estimated missed sales. Avg basket $118, up $4 WoW."';
    if (isRegional) return '"IL revenue $280K yesterday, +4.2% WoW. Springfield leading at +18%. 2 vault-to-floor transfers pending at Naperville — Kiva Gummies and Stiiizy Pods both have demand on floor. 34 SKUs received yesterday, all checked in. Schaumburg running a flash promo today (15% off 3-6 PM)."';
    if (isStoreMgr) return '"Logan Square did $48.2K yesterday, 8% above target. 2 products out of stock on floor — Blue Dream 3.5g (45 units in vault, ready to transfer) and Kiva Gummies (60 in vault). Stiiizy Pod LR down to 4 units on floor, transfer before afternoon rush. Happy Hour promo starts at 3 PM. No pending reorders to review."';
    if (isCompliance) return '"All 39 stores synced with state track-and-trace systems. 0 active discrepancies. NJ METRC sync delay cleared at Newark (12 min, no data loss). 3 product batches expiring within 30 days need METRC destruction events filed. Next scheduled audit: IL Mar 24."';
    return '"Yesterday was your best Friday this quarter. Springfield IL drove 34% of revenue. 3 items need reordering."';
  }, [isCEO, isVP, isRegional, isStoreMgr, isCompliance]);

  const metrics = useMemo(() => {
    if (isCEO) return [
      { label: 'Portfolio Rev', value: '$1.2M', trend: '+6.8% SSG', up: true },
      { label: 'Inv Turnover', value: '4.2x', trend: 'target 5x', up: false },
      { label: 'OOS Lost Sales', value: '$112K', trend: '87 SKUs', up: false },
      { label: 'Margin', value: '48.2%', trend: '+0.8pp', up: true },
    ];
    if (isVP) return [
      { label: 'Regional Rev', value: '$720K', trend: '+5.1% SSG', up: true },
      { label: 'Avg Basket', value: '$118', trend: '+$4 WoW', up: true },
      { label: 'OOS Lost Sales', value: '$48K', trend: '34 SKUs', up: false },
      { label: 'Flagged', value: '1 store', trend: 'Morenci -23%', up: false },
    ];
    if (isRegional) return [
      { label: 'IL Revenue', value: '$280K', trend: '+4.2% WoW', up: true },
      { label: 'Transfers', value: '32 done', trend: '2 pending', up: false },
      { label: 'Received', value: '34 SKUs', trend: 'All verified', up: true },
      { label: 'Promos Today', value: '1 active', trend: 'Schaumburg', up: true },
    ];
    if (isStoreMgr) return [
      { label: 'Revenue', value: '$48.2K', trend: '+8% vs target', up: true },
      { label: 'OOS Floor', value: '2 items', trend: 'Vault ready', up: false },
      { label: 'Low Stock', value: '1 item', trend: '4 units left', up: false },
      { label: 'Promo', value: '3 PM', trend: 'Happy Hour', up: true },
    ];
    if (isCompliance) return [
      { label: 'Sync Status', value: '39/39', trend: 'All green', up: true },
      { label: 'Discrepancies', value: '0', trend: 'Clear', up: true },
      { label: 'Expiring', value: '3 batches', trend: '30 days', up: false },
      { label: 'Next Audit', value: 'Mar 24', trend: 'IL', up: true },
    ];
    return [
      { label: 'Revenue', value: fmtDollar(scaledRevenue), trend: `+${(4.2 * trendScale).toFixed(1)}%`, up: true },
      { label: 'Traffic', value: scaledTraffic.toLocaleString(), trend: `+${(3.7 * trendScale).toFixed(1)}%`, up: true },
      { label: 'Avg Rating', value: '4.6\u2605', trend: '+0.2', up: true },
      { label: 'Stockouts', value: String(scaledStockouts), trend: `${scaledCritical} critical`, up: false },
    ];
  }, [isCEO, isVP, isRegional, isStoreMgr, isCompliance, scaledRevenue, scaledTraffic, scaledStockouts, scaledCritical, trendScale]);

  const Icon = selectedPersona.icon;

  return (
    <div className="rounded-2xl border overflow-hidden animate-fade-up" style={{ background: 'linear-gradient(135deg, var(--color-surface-card) 0%, var(--color-surface-bg) 50%, var(--color-surface-card) 100%)', borderColor: 'rgba(212,160,58,0.12)' }}>
      <div className="px-6 py-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A1710 0%, #2A2318 100%)', boxShadow: '0 0 20px rgba(212,160,58,0.25)', border: '1px solid rgba(212,160,58,0.2)' }}>
            <NexusIcon size={22} />
          </div>
          <div>
            <p className="text-xs text-text-muted">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} &middot; {rangeLabel} &middot; {selectedPersona.label}</p>
            <h1 className="text-xl font-bold text-text-primary">Good {greeting}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(212,160,58,0.08)', border: '1px solid rgba(212,160,58,0.12)' }}>
          <Icon className="w-3.5 h-3.5 text-accent-gold" />
          <span className="text-[10px] font-semibold text-accent-gold">{selectedPersona.shortLabel}</span>
        </div>
      </div>
      <div className="px-6 pb-4">
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(212,160,58,0.04)', border: '1px solid rgba(212,160,58,0.1)' }}>
          <p className="text-[13px] text-text-secondary leading-[1.7] italic">
            {briefingText}
          </p>
        </div>
        <div className="flex gap-5 flex-wrap">
          {metrics.map(m => (
            <div key={m.label} className="min-w-[72px]">
              <p className="text-[9px] uppercase tracking-[1px] text-text-muted font-semibold mb-1">{m.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
                {m.trend && <span className={`text-[11px] font-semibold ${m.up ? 'text-accent-green' : 'text-accent-red'}`}>{m.trend}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LIVE ACTIVITY TICKER ─── //

const TICKER_EVENTS = [
  { icon: '\uD83D\uDCB0', text: '$156 sale Springfield IL', time: '2m', cat: 'sale' },
  { icon: '\uD83D\uDCE6', text: 'PO #4421 received Hoboken NJ', time: '5m', cat: 'inventory' },
  { icon: '\u2B50', text: '5-star Google review Detroit MI', time: '8m', cat: 'review' },
  { icon: '\uD83D\uDCF1', text: 'SMS opt-in x12 Chicago IL', time: '11m', cat: 'marketing' },
  { icon: '\uD83C\uDFAF', text: 'Campaign click x47 "Spring Sale"', time: '15m', cat: 'marketing' },
  { icon: '\uD83D\uDCB0', text: '$89 sale Ann Arbor MI', time: '18m', cat: 'sale' },
  { icon: '\uD83D\uDCB0', text: '$221 sale Fort Lee NJ', time: '22m', cat: 'sale' },
  { icon: '\u2B50', text: '4-star Leafly review Boston MA', time: '25m', cat: 'review' },
  { icon: '\uD83D\uDCE6', text: 'Delivery checked in Springfield IL', time: '28m', cat: 'inventory' },
  { icon: '\uD83D\uDCB0', text: '$78 sale Morenci MI', time: '32m', cat: 'sale' },
  { icon: '\uD83D\uDCF1', text: 'SMS survey response x8 Springfield', time: '35m', cat: 'marketing' },
  { icon: '\uD83D\uDCB0', text: '$312 sale Logan Square IL', time: '38m', cat: 'sale' },
];

function getAlertsForPersona(personaId) {
  switch (personaId) {
    case 'ceo': return CEO_ALERTS;
    case 'vp_retail': return VP_ALERTS;
    case 'regional_mgr': return REGIONAL_ALERTS;
    case 'store_mgr': return STORE_MGR_ALERTS;
    case 'compliance': return COMPLIANCE_ALERTS;
    default: return STORE_MGR_ALERTS;
  }
}

const STATUS_UPDATES_BY_PERSONA = {
  ceo: [
    { text: 'NJ METRC sync delay cleared at Newark (12 min, no action needed)', icon: 'compliance' },
    { text: 'METRC reconciliation passed — 0 discrepancies across 39 stores', icon: 'compliance' },
    { text: 'March Madness campaign performing +18% above forecast', icon: 'campaign' },
    { text: 'IL wholesale delivery received on schedule — 42 SKUs checked in', icon: 'reorder' },
  ],
  vp_retail: [
    { text: 'Springfield receiving complete — all packages verified in METRC', icon: 'transfer' },
    { text: 'Morenci staffing gap filled — coverage confirmed for evening shift', icon: 'campaign' },
    { text: 'METRC reconciliation passed — 0 discrepancies (IL+MI+OH)', icon: 'compliance' },
    { text: 'Naperville foot traffic recovering — up 6% vs yesterday', icon: 'reorder' },
  ],
  regional_mgr: [
    { text: 'Springfield receiving complete — 42 SKUs verified in METRC', icon: 'transfer' },
    { text: 'METRC reconciliation passed — 0 discrepancies across IL', icon: 'compliance' },
    { text: 'Schaumburg afternoon rush cleared — no stockouts reported', icon: 'reorder' },
  ],
  store_mgr: [
    { text: 'Morning METRC reconciliation passed — 0 discrepancies', icon: 'compliance' },
    { text: 'March Madness promo active — 23 redemptions so far today', icon: 'campaign' },
    { text: 'Yesterday\'s cash close balanced — all drawers within tolerance', icon: 'transfer' },
  ],
  compliance: [
    { text: 'NJ METRC sync delay cleared at Newark (12 min, no data loss)', icon: 'compliance' },
    { text: 'METRC reconciliation passed across all IL stores — 0 discrepancies', icon: 'compliance' },
    { text: 'PA Leaf Data sync verified — all 3 stores green', icon: 'compliance' },
    { text: 'Batch #2847 approaching 30-day expiry — flagged for review', icon: 'reorder' },
  ],
};

function SmartAlertsFeed({ onAction }) {
  const [transferState, setTransferState] = useState({});
  const [expanded, setExpanded] = useState({});
  const [actionDone, setActionDone] = useState({});
  const [confirmTransfer, setConfirmTransfer] = useState(null); // alert object or 'bulk'
  const { selectedPersonaId, selectedPersona } = usePersona();

  const SMART_ALERTS = useMemo(() => getAlertsForPersona(selectedPersonaId), [selectedPersonaId]);
  const transferAlerts = SMART_ALERTS.filter(a => a.type === 'transfer');
  const oosCount = transferAlerts.filter(a => a.floor === 0 && !transferState[a.id]).length;

  /* ── Transfer workflow ── */
  const startTransfer = (id) => {
    setTransferState(prev => ({ ...prev, [id]: { step: 1, scanning: true } }));
    setTimeout(() => {
      setTransferState(prev => ({ ...prev, [id]: { step: 2 } }));
    }, 1400);
  };

  const completeTransfer = (id) => {
    setTransferState(prev => ({ ...prev, [id]: { step: 3 } }));
  };

  const handleBulkTransfer = () => {
    transferAlerts.filter(a => a.floor === 0 && !transferState[a.id]).forEach((a, i) => {
      setTimeout(() => {
        setTransferState(prev => ({ ...prev, [a.id]: { step: 1, scanning: true } }));
        setTimeout(() => {
          setTransferState(prev => ({ ...prev, [a.id]: { step: 3 } }));
        }, 1200 + i * 300);
      }, i * 500);
    });
  };

  /* ── Standard alert action handler ── */
  /* Map each alert+action to a natural-language query that routes correctly through detectIntent */
  const handleAction = (alertId, action, alertTitle) => {
    setActionDone(prev => ({ ...prev, [`${alertId}-${action}`]: true }));
    const alertActionQueries = {
      // Store manager
      'low-1::View Inventory': 'Check inventory levels for Stiiizy Pod LR running low',
      'promo-1::View Sales': 'How are sales doing today vs last week?',
      'queue-1::View Sales': 'How are sales doing today vs last week?',
      // CEO
      'ceo-1::View Details': 'Show me revenue performance across MI stores this week',
      'ceo-2::View OH Stores': 'Show me revenue performance across OH stores this week',
      'ceo-3::Draft PO': 'Reorder Jeeter products for stores that don\'t carry them yet',
      'ceo-3::View Data': 'What are our top selling brands by revenue?',
      'ceo-4::View Breakdown': 'Show me inventory analysis for aging and dead stock',
      'ceo-5::View Margins': 'Show me revenue and margin performance across IL stores',
      // VP Retail
      'vp-1::View Stores': 'Show me sales performance across all stores this week',
      'vp-2::View Inventory': 'Check inventory levels for Blue Dream across all stores',
      'vp-3::View Sales': 'Show me sales performance at Schaumburg this week',
      'vp-4::View Details': 'Show me top sellers at Wicker Park this week',
      'vp-5::View Pricing': 'Compare my pricing for Stiiizy Pod across IL and NJ',
      // Regional
      'reg-2::View All': 'Check inventory levels across all IL stores',
      'reg-3::View Inventory': 'Check inventory and reorder status for Springfield',
      'reg-4::View Sales': 'Show me sales performance at Schaumburg and Arlington Heights',
      'reg-5::View Report': 'Show me revenue performance at Springfield this week',
      // Compliance
      'comp-1::View OH Stores': 'Show me revenue performance across OH stores',
      'comp-2::View NJ Stores': 'Show me revenue performance across NJ stores',
      'comp-3::View Inventory': 'Check inventory for expiring products across all stores',
      'comp-4::View All Stores': 'Show me revenue performance across all stores this week',
      'comp-5::View Details': 'Show me revenue performance across all stores this week',
      'comp-6::View OH Stores': 'Show me revenue performance across OH stores',
    };
    const query = alertActionQueries[`${alertId}::${action}`] || `Show me details about ${alertTitle}`;
    if (onAction) onAction(query);
  };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  /* ── Render a compact transfer alert row ── */
  const renderTransferAlert = (a) => {
    const ts = transferState[a.id];
    const done = ts?.step === 3;
    const scanning = ts?.step === 1 && ts?.scanning;
    const confirming = ts?.step === 2;
    const isExpanded = expanded[a.id];

    return (
      <div key={a.id} className="px-4 py-2.5 hover:bg-surface-hover/50 transition-colors" style={done ? { background: 'rgba(0,194,124,0.03)' } : undefined}>
        {/* Compact row */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-surface-hover">
            <img src={`${BASE}${a.img}`} alt={a.brand} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(a.id)}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ color: done ? '#00C27C' : a.color, background: done ? '#00C27C14' : `${a.color}14` }}>
                {done ? 'DONE' : a.severity}
              </span>
              <span className="text-[12px] font-medium text-text-primary truncate">{a.product}</span>
              <span className="text-[10px] text-text-muted flex-shrink-0">{a.time}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-text-muted mt-0.5">
              <span>{a.store}</span>
              <span>Floor: <span className="font-semibold" style={{ color: a.floor === 0 ? '#E87068' : '#D4A03A' }}>{a.floor}</span></span>
              <span>Vault: <span className="font-semibold text-accent-green">{a.vault}</span></span>
              {a.trackSystem && <span className="px-1 py-px rounded text-[8px] font-bold" style={{ background: a.trackSystem === 'METRC' ? 'rgba(100,168,224,0.15)' : 'rgba(0,194,124,0.15)', color: a.trackSystem === 'METRC' ? '#64A8E0' : '#00C27C' }}>{a.trackSystem}</span>}
              <span className="flex items-center gap-0.5"><Lock size={8} />{a.metrcPkg.slice(-8)}</span>
            </div>
          </div>
          {/* Action area */}
          <div className="flex-shrink-0">
            {done ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-accent-green"><Check size={12} />{a.recQty} moved</span>
            ) : scanning ? (
              <div className="flex items-center gap-1.5 text-[10px] text-accent-gold">
                <div className="w-4 h-4 rounded-full border border-surface-border relative"><div className="absolute inset-0 rounded-full border border-t-[#D4A03A] animate-spin" /></div>
                Scanning...
              </div>
            ) : confirming ? (
              <button onClick={() => completeTransfer(a.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-accent-green text-white hover:brightness-110 transition-colors">
                <Check size={11} />Confirm
              </button>
            ) : (
              <button onClick={() => setConfirmTransfer(a)} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors">
                <ArrowRightLeft size={11} />Transfer {a.recQty}
              </button>
            )}
          </div>
        </div>

        {/* Expanded detail (click to toggle) */}
        {isExpanded && (
          <div className="mt-2 ml-11 text-[11px] rounded-lg px-3 py-2 border border-surface-border bg-surface-bg">
            <p className="text-text-secondary mb-1.5">{a.ai}</p>
            {done && (
              <div className="flex flex-wrap gap-x-3 text-[10px] text-text-muted">
                <span className="text-accent-green">METRC manifest created</span>
                <span>{a.metrcSrc} → {a.metrcDest}</span>
                <span>Pkg: {a.metrcPkg}</span>
              </div>
            )}
            {!done && !scanning && !confirming && (
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span>{a.metrcSrc} → {a.metrcDest}</span>
                <span>Rec: {a.recQty} units</span>
                {a.daysOOS > 0 && <span className="text-accent-red">{a.daysOOS}d OOS</span>}
              </div>
            )}
            {confirming && (
              <div className="flex items-center gap-2 text-[10px]">
                <Check size={11} className="text-accent-green" />
                <span className="text-accent-green">METRC tag {a.metrcPkg.slice(-8)} verified</span>
                <span className="text-text-muted">{a.recQty} units · {a.metrcSrc} → {a.metrcDest}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── Render a compact standard alert row ── */
  const renderStandardAlert = (a) => {
    const isExpanded = expanded[a.id];
    return (
      <div key={a.id} className="px-4 py-2.5 hover:bg-surface-hover/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}10` }}>
            {a.severity === 'CRITICAL' && <AlertCircle size={14} style={{ color: a.color }} />}
            {a.severity === 'WARNING' && <AlertTriangle size={14} style={{ color: a.color }} />}
            {a.severity === 'OPPORTUNITY' && <TrendingUp size={14} style={{ color: a.color }} />}
            {a.severity === 'INSIGHT' && <Sparkles size={14} style={{ color: a.color }} />}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(a.id)}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{ color: a.color, background: `${a.color}14` }}>
                {a.severity}
              </span>
              <span className="text-[12px] font-medium text-text-primary truncate">{a.title}</span>
              <span className="text-[10px] text-text-muted flex-shrink-0">{a.time}</span>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {a.actions.map((act, j) => {
              const isDone = actionDone[`${a.id}-${act}`];
              return (
                <button
                  key={j}
                  onClick={() => handleAction(a.id, act, a.title)}
                  disabled={isDone}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                    isDone ? 'text-accent-green bg-accent-green/10 cursor-default'
                    : j === 0 ? 'text-white hover:brightness-110' : 'text-text-secondary border border-surface-border hover:text-text-primary'
                  }`}
                  style={!isDone && j === 0 ? { background: a.color } : undefined}
                >
                  {isDone ? <span className="flex items-center gap-1"><Check size={10} />Done</span> : act}
                </button>
              );
            })}
          </div>
        </div>
        {isExpanded && (
          <div className="mt-2 ml-11 text-[11px] rounded-lg px-3 py-2 border border-surface-border bg-surface-bg">
            <p className="text-text-secondary">{a.ai}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <NexusTile className="animate-fade-up" style={{ animationDelay: '300ms' }}>
      <div className="px-4 py-2.5 flex justify-between items-center border-b border-surface-border">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent-gold" />
          <span className="text-xs font-semibold text-text-primary">Smart Alerts</span>
          <span className="text-[10px] text-text-muted">{SMART_ALERTS.length} active &middot; {selectedPersona.shortLabel}</span>
        </div>
        {oosCount > 0 && (
          <button onClick={() => setConfirmTransfer('bulk')} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-accent-red bg-accent-red/10 border border-accent-red/20 hover:bg-accent-red/15 transition-colors">
            <ArrowRightLeft size={11} /> Transfer {oosCount} OOS
          </button>
        )}
      </div>

      <div className="divide-y divide-surface-border/60">
        {SMART_ALERTS.map(a => a.type === 'transfer' ? renderTransferAlert(a) : renderStandardAlert(a))}
      </div>

      {/* Status updates footer */}
      <div className="px-4 py-2 border-t border-surface-border" style={{ background: 'rgba(0,194,124,0.03)' }}>
        <p className="text-[10px] font-medium text-text-muted mb-1">Status Updates</p>
        {(STATUS_UPDATES_BY_PERSONA[selectedPersonaId] || STATUS_UPDATES_BY_PERSONA.store_mgr).map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-0.5">
            {r.icon === 'transfer' && <ArrowRightLeft className="w-3 h-3 text-accent-green" />}
            {r.icon === 'campaign' && <Rocket className="w-3 h-3 text-accent-green" />}
            {r.icon === 'compliance' && <Lock className="w-3 h-3 text-accent-green" />}
            {r.icon === 'reorder' && <Package className="w-3 h-3 text-accent-green" />}
            {r.text}
          </div>
        ))}
      </div>
      {/* Transfer confirmation drawer */}
      {confirmTransfer && confirmTransfer !== 'bulk' && (
        <ConfirmationDrawer
          open={true}
          onCancel={() => setConfirmTransfer(null)}
          onConfirm={() => { const id = confirmTransfer.id; setConfirmTransfer(null); startTransfer(id); }}
          title="Confirm Vault-to-Floor Transfer"
          description={`Move ${confirmTransfer.product} to sales floor`}
          icon={ArrowRightLeft}
          confirmLabel={`Transfer ${confirmTransfer.recQty} Units`}
          confirmColor="#D4A03A"
          details={[
            { label: 'Product', value: confirmTransfer.product },
            { label: 'Store', value: confirmTransfer.store },
            { label: 'Quantity', value: `${confirmTransfer.recQty} units` },
            { label: 'From → To', value: `${confirmTransfer.metrcSrc} → ${confirmTransfer.metrcDest}` },
            { label: 'METRC Package', value: confirmTransfer.metrcPkg },
            { label: 'Days OOS', value: `${confirmTransfer.daysOOS} days` },
          ]}
          warning="This will create a METRC manifest and update inventory records."
        />
      )}
      {confirmTransfer === 'bulk' && (
        <ConfirmationDrawer
          open={true}
          onCancel={() => setConfirmTransfer(null)}
          onConfirm={() => { setConfirmTransfer(null); handleBulkTransfer(); }}
          title="Confirm Bulk Transfer"
          description={`Transfer ${oosCount} out-of-stock items from vault to floor`}
          icon={ArrowRightLeft}
          confirmLabel={`Transfer All ${oosCount} Items`}
          confirmColor="#E87068"
          details={transferAlerts.filter(a => a.floor === 0 && !transferState[a.id]).map(a => ({
            label: a.product,
            value: `${a.recQty} units · ${a.metrcPkg.slice(-8)}`,
          }))}
          warning="This will create METRC manifests for all items and update inventory records."
        />
      )}
    </NexusTile>
  );
}

// ─── STORE HEALTH MATRIX ─── //

function StoreHealthMatrix() {
  const { selectedStoreNames } = useStores();
  const { isStoreMgr, isCompliance, selectedPersona } = usePersona();

  const stores = useMemo(() => {
    return STORE_METRICS.filter(s => selectedStoreNames.has(s.name)).slice(0, 12).map(s => {
      const rng = _seedRng(s.name.length * 31);
      const revScore = Math.min(100, Math.round((s.revenue / 750) * 100));
      const sentScore = s.sentimentScore;
      const stockScore = Math.round(70 + rng() * 30);
      const compScore = Math.round(75 + rng() * 25);
      const mktScore = Math.round(50 + rng() * 40);
      const composite = Math.round(revScore * 0.3 + sentScore * 0.25 + stockScore * 0.2 + compScore * 0.15 + mktScore * 0.1);
      const alerts = s.sentimentFlag === 'alert' ? 3 : s.sentimentFlag === 'watch' ? 1 : 0;
      return { ...s, composite, alerts, stockScore, compScore };
    }).sort((a, b) => b.composite - a.composite);
  }, [selectedStoreNames]);

  // Generate alerts & insights for a store based on its data
  const getStoreInsights = useCallback((s) => {
    const insights = [];
    // Sentiment alerts
    if (s.sentimentFlag === 'alert') {
      insights.push({ severity: 'ALERT', color: '#E87068', text: `Sentiment dropped ${Math.abs(s.sentimentDelta)}% — negative reviews trending`, query: `What's driving negative sentiment at ${s.name}?` });
      insights.push({ severity: 'ALERT', color: '#E87068', text: `3 unresolved customer complaints this week`, query: `Show me the recent complaints at ${s.name}` });
      insights.push({ severity: 'ACTION', color: '#D4A03A', text: `Consider staff coaching on customer experience`, query: `What customer experience improvements can we make at ${s.name}?` });
    } else if (s.sentimentFlag === 'watch') {
      insights.push({ severity: 'WATCH', color: '#D4A03A', text: `Sentiment ${s.sentimentDelta >= 0 ? 'up' : 'down'} ${Math.abs(s.sentimentDelta)}% — monitoring`, query: `What's the sentiment trend at ${s.name}?` });
    }
    // Stock alerts
    if (s.stockScore < 80) {
      insights.push({ severity: 'ALERT', color: '#E87068', text: `Stock score ${s.stockScore}/100 — ${Math.round((100 - s.stockScore) / 10)} products low or OOS`, query: `Which products are out of stock at ${s.name}?` });
    } else if (s.stockScore < 90) {
      insights.push({ severity: 'WATCH', color: '#D4A03A', text: `Stock score ${s.stockScore}/100 — minor replenishment needed`, query: `What needs reordering at ${s.name}?` });
    }
    // Compliance
    if (s.compScore < 85) {
      insights.push({ severity: 'ACTION', color: '#D4A03A', text: `Compliance score ${s.compScore}/100 — review METRC sync`, query: `Show METRC compliance status for ${s.name}` });
    }
    // Revenue
    if (s.revenue < 300) {
      insights.push({ severity: 'WATCH', color: '#D4A03A', text: `Revenue ${fmtDollar(s.revenue * 1000)} MTD — below $300K threshold`, query: `What's driving low revenue at ${s.name}?` });
    }
    // Margin
    if (s.margin < 38) {
      insights.push({ severity: 'WATCH', color: '#D4A03A', text: `Margin at ${s.margin}% — below 38% floor`, query: `What's dragging down margin at ${s.name}?` });
    }
    // Always add a positive or neutral insight
    if (insights.length === 0) {
      insights.push({ severity: 'OK', color: '#00C27C', text: `Store performing well — composite ${s.composite}/100`, query: `Give me a full performance summary for ${s.name}` });
    }
    return insights;
  }, []);

  // Store detail modal state
  const [selectedStore, setSelectedStore] = useState(null);

  // Close on Escape
  useEffect(() => {
    if (!selectedStore) return;
    const handler = (e) => { if (e.key === 'Escape') setSelectedStore(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedStore]);

  // Store Manager: single-store deep dive
  if (isStoreMgr) {
    return (
      <NexusTile className="animate-fade-up" style={{ animationDelay: '400ms' }}>
        <div className="px-5 py-3 flex justify-between items-center border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-accent-gold" />
            <span className="text-xs font-semibold text-text-primary">Logan Square — Store Dashboard</span>
          </div>
          <span className="text-[9px] px-1.5 py-px rounded-full bg-accent-green/10 text-accent-green font-bold">METRC Synced</span>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Vault Items', value: '142', sub: '12 pending transfer', color: '#D4A03A' },
              { label: 'Floor SKUs', value: '284', sub: '2 OOS', color: '#E87068' },
              { label: 'Staff On Duty', value: '8', sub: '3 budtenders', color: '#64A8E0' },
              { label: 'Revenue Today', value: '$34.2K', sub: '+8% vs target', color: '#00C27C' },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-surface-border bg-surface-bg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px] text-text-muted">{m.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Transactions', value: '312', trend: '+7.1%', up: true },
              { label: 'Avg Basket', value: '$110', trend: '+$4', up: true },
              { label: 'CSAT Score', value: '4.6', trend: '+0.2', up: true },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-surface-border bg-surface-bg p-3 text-center">
                <p className="text-[10px] text-text-muted mb-1">{m.label}</p>
                <p className="text-base font-bold text-text-primary">{m.value}</p>
                <p className={`text-[10px] font-medium ${m.up ? 'text-accent-green' : 'text-accent-red'}`}>{m.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </NexusTile>
    );
  }

  // Compliance Officer: compliance status grid per state
  if (isCompliance) {
    const stateCompliance = [
      { state: 'IL', system: 'METRC', stores: 8, synced: 8, lastSync: '4m ago', status: 'green', discrepancies: 0, nextAudit: 'Mar 24' },
      { state: 'NJ', system: 'METRC', stores: 5, synced: 5, lastSync: '8m ago', status: 'green', discrepancies: 0, nextAudit: 'Apr 12' },
      { state: 'OH', system: 'METRC', stores: 6, synced: 5, lastSync: '28h ago', status: 'warning', discrepancies: 1, nextAudit: 'May 1' },
      { state: 'MA', system: 'METRC', stores: 4, synced: 4, lastSync: '6m ago', status: 'green', discrepancies: 0, nextAudit: 'Jun 15' },
      { state: 'MI', system: 'METRC', stores: 7, synced: 7, lastSync: '3m ago', status: 'green', discrepancies: 0, nextAudit: 'Apr 30' },
      { state: 'MD', system: 'METRC', stores: 4, synced: 4, lastSync: '5m ago', status: 'green', discrepancies: 0, nextAudit: 'Jun 30' },
      { state: 'PA', system: 'MJ Freeway', stores: 5, synced: 5, lastSync: '7m ago', status: 'green', discrepancies: 0, nextAudit: 'May 15' },
    ];
    return (
      <NexusTile className="animate-fade-up" style={{ animationDelay: '400ms' }}>
        <div className="px-5 py-3 flex justify-between items-center border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-semibold text-text-primary">Compliance Status by State</span>
          </div>
          <span className="text-[10px] text-accent-green font-semibold">38/39 stores synced</span>
        </div>
        <div className="px-5 py-4 space-y-2">
          {stateCompliance.map(sc => {
            const statusColor = sc.status === 'green' ? '#00C27C' : sc.status === 'warning' ? '#D4A03A' : '#E87068';
            return (
              <div key={sc.state} className="flex items-center gap-4 rounded-xl border border-surface-border bg-surface-bg px-4 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: `${statusColor}14`, color: statusColor }}>
                  {sc.state}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-text-primary">{sc.stores} stores</span>
                    <span className="px-1.5 py-px rounded text-[8px] font-bold" style={{ background: `${statusColor}15`, color: statusColor }}>{sc.system}</span>
                  </div>
                  <p className="text-[10px] text-text-muted">Last sync: {sc.lastSync} &middot; Next audit: {sc.nextAudit}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs font-bold" style={{ color: statusColor }}>{sc.synced}/{sc.stores}</p>
                    <p className="text-[9px] text-text-muted">synced</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold ${sc.discrepancies > 0 ? 'text-accent-red' : 'text-accent-green'}`}>{sc.discrepancies}</p>
                    <p className="text-[9px] text-text-muted">disc.</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full`} style={{ background: statusColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </NexusTile>
    );
  }

  // Default: Multi-store health matrix for CEO/VP/Regional
  return (
    <>
    <NexusTile className="animate-fade-up" style={{ animationDelay: '400ms' }}>
      <div className="px-5 py-3 flex justify-between items-center border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-accent-gold" />
          <span className="text-xs font-semibold text-text-primary">Store Health Matrix</span>
          <span className="text-[10px] text-text-muted">{selectedPersona.shortLabel} view</span>
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="text-accent-green">{'\u25CF'} {'\u2265'}75</span>
          <span className="text-accent-gold">{'\u25CF'} {'\u2265'}55</span>
          <span className="text-accent-red">{'\u25CF'} &lt;55</span>
        </div>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stores.map(s => {
          const color = s.composite >= 75 ? '#00C27C' : s.composite >= 55 ? '#D4A03A' : '#E87068';
          const deg = s.composite * 3.6;
          return (
            <div key={s.name} onClick={() => setSelectedStore(s)} className="rounded-xl border border-surface-border bg-surface-bg p-3 text-center hover:brightness-110 transition-all cursor-pointer">
              <div className="w-11 h-11 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `conic-gradient(${color} ${deg}deg, var(--color-surface-border) 0deg)` }}>
                <div className="w-8 h-8 rounded-full bg-surface-bg flex items-center justify-center text-xs font-bold" style={{ color }}>{s.composite}</div>
              </div>
              <p className="text-[11px] font-semibold text-text-primary truncate">{s.name}</p>
              <p className="text-[10px] text-text-muted">{s.state} &middot; {fmtDollar(s.revenue * 1000)}</p>
              <div className="flex justify-center gap-2 mt-1">
                <span className={`text-[10px] font-medium ${s.sentimentDelta >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{s.sentimentDelta >= 0 ? '+' : ''}{s.sentimentDelta}%</span>
                {s.alerts > 0 && <span className="text-[10px] text-accent-red">{s.alerts} alert{s.alerts > 1 ? 's' : ''}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </NexusTile>

    {/* Store Detail Modal */}
    {selectedStore && (() => {
      const s = selectedStore;
      const color = s.composite >= 75 ? '#00C27C' : s.composite >= 55 ? '#D4A03A' : '#E87068';
      const deg = s.composite * 3.6;
      const insights = getStoreInsights(s);
      const rng = _seedRng(s.name.length * 31);
      rng(); rng(); // consume stockScore + compScore calls
      const revScore = Math.min(100, Math.round((s.revenue / 750) * 100));
      const sentScore = s.sentimentScore;
      const mktScore = Math.round(50 + rng() * 40);
      const oosCount = Math.round((100 - s.stockScore) / 10);
      const staffOn = Math.round(4 + rng() * 5);
      const staffTotal = staffOn + Math.round(1 + rng() * 3);
      const waitMin = (2 + rng() * 6).toFixed(1);
      const syncAgo = Math.round(1 + rng() * 15);
      const topProduct = ['Blue Dream 3.5g', 'Stiiizy Pod 1g', 'Jeeter Baby Js', 'Wyld Gummies', 'Kiva Camino'][Math.floor(rng() * 5)];
      const topUnits = Math.round(12 + rng() * 30);
      const opsStats = [
        { icon: '🏆', label: 'Top Seller', value: `${topProduct} — ${topUnits} units`, query: `What are the top selling products at ${s.name}?` },
        { icon: '⏱', label: 'Avg Wait', value: `${waitMin} min`, warn: parseFloat(waitMin) > 5, query: `Show me customer wait time data for ${s.name}` },
        { icon: '👥', label: 'Staff On Shift', value: `${staffOn} of ${staffTotal}`, query: `Show me budtender performance at ${s.name}` },
        { icon: '📦', label: 'Out of Stock', value: oosCount > 0 ? `${oosCount} products` : 'Fully stocked', warn: oosCount > 2, query: `Which products are out of stock at ${s.name}?` },
        { icon: '🔗', label: 'METRC Sync', value: `${syncAgo}m ago`, warn: syncAgo > 10, query: `Show METRC compliance status for ${s.name}` },
        { icon: '📊', label: 'vs Target', value: revScore >= 80 ? `+${revScore - 75}% ahead` : `${75 - revScore}% behind`, warn: revScore < 75, query: `Show me ${s.name} performance vs target` },
      ];
      return (
        <>
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" onClick={() => setSelectedStore(null)} />
          <div className="fixed z-[91] bottom-0 left-0 right-0 sm:bottom-auto sm:top-[50%] sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-surface-card border border-surface-border shadow-2xl overflow-hidden animate-[slideUp_200ms_ease-out] sm:animate-[fadeIn_150ms_ease-out] max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-surface-card z-10 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `conic-gradient(${color} ${deg}deg, var(--color-surface-border) 0deg)` }}>
                  <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center text-xs font-bold" style={{ color }}>{s.composite}</div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{s.name}</h3>
                  <p className="text-[11px] text-text-muted">{s.state} &middot; {fmtDollar(s.revenue * 1000)} MTD &middot; {s.transactions} txns</p>
                </div>
              </div>
              <button onClick={() => setSelectedStore(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Key Metrics */}
            <div className="px-5 pt-4 grid grid-cols-4 gap-2">
              {[
                { label: 'Revenue', value: fmtDollar(s.revenue * 1000), color: '#00C27C' },
                { label: 'Margin', value: `${s.margin}%`, color: s.margin >= 38 ? '#00C27C' : '#D4A03A' },
                { label: 'Avg Basket', value: `$${s.avgBasket}`, color: '#64A8E0' },
                { label: 'Sentiment', value: `${s.sentimentScore}`, color: s.sentimentDelta >= 0 ? '#00C27C' : '#E87068' },
              ].map(m => (
                <div key={m.label} className="rounded-lg border border-surface-border bg-surface-bg p-2 text-center">
                  <p className="text-[9px] text-text-muted uppercase">{m.label}</p>
                  <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Operations Snapshot */}
            <div className="px-5 pt-4">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Right Now</p>
              <div className="grid grid-cols-2 gap-1.5">
                {opsStats.map(op => (
                  <div
                    key={op.label}
                    onClick={() => { setSelectedStore(null); navigate('/agents/bridge'); }}
                    className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-bg px-2.5 py-2 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm flex-shrink-0">{op.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-text-muted uppercase">{op.label}</p>
                      <p className={`text-[11px] font-semibold truncate ${op.warn ? 'text-accent-red' : 'text-text-secondary'}`}>{op.value}</p>
                    </div>
                    <ChevronRight size={10} className="text-surface-border flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts & Insights */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Alerts & Insights</p>
              <div className="space-y-1.5">
                {insights.map((ins, i) => (
                  <div
                    key={i}
                    onClick={() => { setSelectedStore(null); navigate('/agents/bridge'); }}
                    className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-surface-bg px-3 py-2.5 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                  >
                    <span className="text-[8px] font-bold px-1.5 py-px rounded-full mt-0.5 flex-shrink-0" style={{ color: ins.color, background: `${ins.color}14` }}>
                      {ins.severity}
                    </span>
                    <span className="text-[11px] text-text-secondary flex-1">{ins.text}</span>
                    <ChevronRight size={12} className="text-surface-border flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Deep dive button */}
            <div className="p-5">
              <button
                onClick={() => { setSelectedStore(null); navigate('/agents/bridge'); }}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: '#D4A03A' }}
              >
                <MessageSquare size={14} />
                Deep Dive in Nexus Chat
              </button>
            </div>
          </div>
        </>
      );
    })()}
    </>
  );
}

// ─── COMPLIANCE COMMAND CENTER ─── //
// Action-oriented: only shows things that need attention, no green "all good" status


export default function NexusHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <MorningBriefing />
      <SmartAlertsFeed onAction={() => navigate('/agents/bridge')} />
      <StoreHealthMatrix />
    </div>
  );
}

