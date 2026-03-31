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
    { name: 'Edibles', revenue: 2_401_000, pct: 17.6, units: 82_000, margin: 55.0, marketShare: 19, color: '#B598E8' },
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
  { key: 'avgBasket', label: 'Avg Basket', color: '#B598E8', format: v => `$${v}`, benchKey: null },
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
          className="flex items-center gap-1 rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00B07A]"
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

// ---------------------------------------------------------------------------
// Individual Tiles
// ---------------------------------------------------------------------------

function SentimentTile() {
  const { selectedStoreNames } = useStores();
  const { dateMultiplier, periodLabel, rangeLabel } = useDateRange();

  // Dynamic location sentiment from selected stores
  const filteredLocationSentiment = useMemo(() => {
    const active = STORE_METRICS.filter(s => selectedStoreNames.has(s.name));
    const sorted = [...active].sort((a, b) => {
      const flagOrder = { alert: 0, watch: 1, improving: 2 };
      const aF = a.sentimentFlag ? flagOrder[a.sentimentFlag] ?? 3 : 3;
      const bF = b.sentimentFlag ? flagOrder[b.sentimentFlag] ?? 3 : 3;
      if (aF !== bF) return aF - bF;
      return Math.abs(b.sentimentDelta) - Math.abs(a.sentimentDelta);
    });
    return sorted.slice(0, 4).map(s => ({
      location: `${s.name}, ${s.state}`,
      score: s.sentimentScore,
      delta: s.sentimentDelta,
      flag: s.sentimentFlag,
    }));
  }, [selectedStoreNames]);

  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <ArrowUpRight size={12} className="text-accent-green" />;
    if (trend === 'down') return <ArrowDownRight size={12} className="text-accent-red" />;
    return <Minus size={12} className="text-text-muted" />;
  };

  const priorityStyles = {
    high: 'border-surface-border bg-[rgba(232,112,104,0.12)]',
    medium: 'border-surface-border bg-[rgba(212,160,58,0.12)]',
    low: 'border-surface-border bg-[rgba(100,168,224,0.12)]',
  };
  const priorityDot = { high: 'bg-accent-red', medium: 'bg-accent-gold', low: 'bg-accent-blue' };

  return (
    <NexusTile span={2}>
      <TileHeader
        icon={MessageSquare}
        title="Consumer Sentiment"
        subtitle={`${Math.round(NEXUS_DATA.unifiedPipeline.totalSignals * dateMultiplier).toLocaleString()} signals across ${NEXUS_DATA.unifiedPipeline.channelScores.length} channels — ${rangeLabel}`}
        iconBg="bg-accent-green/10 text-accent-green"
        action={() => navigate('/agents/bridge')}
        actionLabel="Deep Dive"
        badge={{ count: 2, color: 'bg-accent-gold' }}
      />
      <div className="p-6">
        {/* Top row — score gauge + key metrics + source breakdown */}
        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          {/* Score gauge */}
          <div className="flex items-center gap-5">
            <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="var(--color-surface-border)" strokeWidth="8" />
                <circle cx="48" cy="48" r="40" fill="none" stroke="#00E08E" strokeWidth="8"
                  strokeDasharray={`${(NEXUS_DATA.overallSentiment / 100) * 251.3} 251.3`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-2xl font-bold text-text-primary">{NEXUS_DATA.overallSentiment}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Overall Sentiment</p>
              <p className="flex items-center gap-1 text-xs text-accent-green font-medium">
                <TrendingUp size={12} />
                +{NEXUS_DATA.sentimentDelta} pts {periodLabel}
              </p>
              <div className="mt-2 flex gap-3">
                <div>
                  <p className="text-lg font-bold text-text-primary">{NEXUS_DATA.npsScore}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">NPS</p>
                </div>
                <div className="border-l border-surface-border pl-3">
                  <p className="text-lg font-bold text-accent-green">+{NEXUS_DATA.npsDelta}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">{periodLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Review volume breakdown */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Review Volume</p>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-2xl font-bold text-text-primary">{Math.round(NEXUS_DATA.totalReviews * dateMultiplier)}</span>
              <span className="text-xs text-text-muted mb-1">{rangeLabel.toLowerCase()}</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full">
              <div className="bg-accent-green" style={{ width: `${(NEXUS_DATA.positiveReviews / NEXUS_DATA.totalReviews) * 100}%` }} />
              <div className="bg-surface-card" style={{ width: `${(NEXUS_DATA.neutralReviews / NEXUS_DATA.totalReviews) * 100}%` }} />
              <div className="bg-accent-red" style={{ width: `${(NEXUS_DATA.negativeReviews / NEXUS_DATA.totalReviews) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px]">
              <span className="flex items-center gap-1 text-accent-green"><ThumbsUp size={10} /> {Math.round(NEXUS_DATA.positiveReviews * dateMultiplier)} positive</span>
              <span className="text-text-muted">{Math.round(NEXUS_DATA.neutralReviews * dateMultiplier)} neutral</span>
              <span className="flex items-center gap-1 text-accent-red"><ThumbsDown size={10} /> {Math.round(NEXUS_DATA.negativeReviews * dateMultiplier)} negative</span>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Response rate: <span className="font-semibold text-text-primary">{NEXUS_DATA.responseRate}%</span>
            </p>
          </div>

          {/* Source breakdown */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">By Platform</p>
            <div className="space-y-2">
              {NEXUS_DATA.sentimentBySrc.map((s) => (
                <div key={s.source} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{s.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">{Math.round(s.reviews * dateMultiplier)} reviews</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={10} className={star <= Math.round(s.avg) ? 'text-accent-green fill-[#00C27C]' : 'text-text-muted'} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-text-primary w-6 text-right">{s.avg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle row — Topic sentiment + Location sentiment */}
        <div className="grid gap-6 sm:grid-cols-2 mb-6">
          {/* Topic sentiment bars */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Topic Breakdown</p>
            <div className="space-y-2.5">
              {NEXUS_DATA.sentimentTopics.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <TrendIcon trend={t.trend} />
                      <span className="text-sm text-text-primary">{t.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted">{Math.round(t.reviews * dateMultiplier)} mentions</span>
                      <span className={`text-xs font-bold ${t.score >= 60 ? 'text-accent-green' : 'text-accent-red'}`}>{t.score}</span>
                      <span className={`text-[11px] font-medium ${t.delta > 0 ? 'text-accent-green' : t.delta < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                        {t.delta > 0 ? '+' : ''}{t.delta}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-card">
                    <div
                      className={`h-full rounded-full transition-all ${t.score >= 70 ? 'bg-accent-green' : t.score >= 50 ? 'bg-accent-gold' : 'bg-accent-red'}`}
                      style={{ width: `${t.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location sentiment */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">By Location</p>
            <div className="space-y-2">
              {filteredLocationSentiment.map((loc) => (
                <div key={loc.location} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                  loc.flag === 'alert' ? 'bg-[rgba(232,112,104,0.12)] border border-surface-border' :
                  loc.flag === 'watch' ? 'bg-[rgba(212,160,58,0.12)] border border-surface-border' :
                  loc.flag === 'improving' ? 'bg-[rgba(0,194,124,0.12)] border border-surface-border' :
                  'bg-surface-bg border border-surface-border'
                }`}>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className={
                      loc.flag === 'alert' ? 'text-accent-red' :
                      loc.flag === 'watch' ? 'text-accent-gold' :
                      loc.flag === 'improving' ? 'text-accent-green' :
                      'text-text-muted'
                    } />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{loc.location}</p>
                      {loc.flag === 'alert' && <p className="text-[10px] text-accent-red font-medium uppercase">Needs attention</p>}
                      {loc.flag === 'improving' && <p className="text-[10px] text-accent-green font-medium uppercase">Improving</p>}
                      {loc.flag === 'watch' && <p className="text-[10px] text-accent-gold font-medium uppercase">Watch</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${loc.score >= 65 ? 'text-text-primary' : 'text-accent-red'}`}>{loc.score}</span>
                    <p className={`text-xs font-medium ${loc.delta >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {loc.delta >= 0 ? '+' : ''}{loc.delta} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row — AI Suggestions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-accent-green" />
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">AI-Powered Suggestions</p>
          </div>
          <div className="space-y-2">
            {NEXUS_DATA.sentimentActions.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${priorityStyles[item.priority]}`}>
                <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${priorityDot[item.priority]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{item.action}</p>
                  <p className="mt-0.5 text-xs text-text-muted font-medium">{item.impact}</p>
                </div>
                <button onClick={() => navigate('/agents/bridge')} className="flex-shrink-0 rounded-lg bg-surface-card border border-surface-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover transition-colors">
                  Execute
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NexusTile>
  );
}

// ---------------------------------------------------------------------------
// Omnichannel Sentiment Collection Tile
// ---------------------------------------------------------------------------

function OmnichannelTile() {
  const [activeTab, setActiveTab] = useState('sms');
  const { dateMultiplier, rangeLabel } = useDateRange();
  const dm = dateMultiplier;
  const tabs = [
    { id: 'sms', label: 'SMS Surveys', icon: Smartphone },
    { id: 'ecomm', label: 'Ecomm/Kiosk', icon: Monitor },
    { id: 'voice', label: 'Voice CSAT', icon: Mic },
    { id: 'qr', label: 'QR Captures', icon: QrCode },
  ];

  return (
    <NexusTile span={2}>
      <TileHeader
        icon={Radio}
        title="Omnichannel Sentiment Collection"
        subtitle={`Proprietary first-party signals — ${rangeLabel.toLowerCase()}`}
        iconBg="bg-[rgba(163,113,247,0.12)] text-accent-purple"
        action={() => navigate('/agents/bridge')}
        actionLabel="Configure Channels"
      />
      <div className="p-6">
        {/* Channel summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {tabs.map(({ id, label, icon: TabIcon }) => {
            const isActive = activeTab === id;
            const stats = {
              sms: { signals: Math.round(NEXUS_DATA.smsChannel.responded * dm), rate: `${NEXUS_DATA.smsChannel.responseRate}%`, rateLabel: 'response' },
              ecomm: { signals: Math.round(NEXUS_DATA.ecommChannel.totalReactions * dm), rate: `${NEXUS_DATA.ecommChannel.freeTextRate}%`, rateLabel: 'w/ text' },
              voice: { signals: Math.round(NEXUS_DATA.voiceSurveyChannel.completed * dm), rate: `${NEXUS_DATA.voiceSurveyChannel.avgCsat}/5`, rateLabel: 'avg CSAT' },
              qr: { signals: Math.round(NEXUS_DATA.qrChannel.completed * dm), rate: `${NEXUS_DATA.qrChannel.scanRate}%`, rateLabel: 'scan rate' },
            }[id];
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isActive
                    ? 'border-[#B598E8] bg-[rgba(163,113,247,0.12)] ring-1 ring-[#B598E8]/30'
                    : 'border-surface-border bg-surface-card hover:border-[#B598E8]/40 hover:bg-[rgba(163,113,247,0.06)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TabIcon size={14} className={isActive ? 'text-accent-purple' : 'text-text-muted'} />
                  <span className={`text-xs font-semibold ${isActive ? 'text-accent-purple' : 'text-text-muted'}`}>{label}</span>
                </div>
                <p className="text-xl font-bold text-text-primary">{stats.signals.toLocaleString()}</p>
                <p className="text-[11px] text-text-muted">{stats.rate} {stats.rateLabel}</p>
              </button>
            );
          })}
        </div>

        {/* SMS Tab */}
        {activeTab === 'sms' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Live Conversation Feed</p>
              <div className="space-y-3">
                {NEXUS_DATA.smsChannel.recentConversations.map((convo, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${
                    convo.sentiment === 'positive' ? 'border-surface-border bg-[rgba(0,194,124,0.12)]/30' : 'border-surface-border bg-[rgba(232,112,104,0.12)]/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-text-muted" />
                        <span className="text-xs font-medium text-text-primary">{convo.store}</span>
                      </div>
                      <span className="text-[11px] text-text-muted">{convo.time}</span>
                    </div>
                    {convo.messages.map((msg, j) => (
                      <div key={j} className={`flex ${msg.from === 'system' ? 'justify-start' : 'justify-end'} mb-1`}>
                        <div className={`rounded-lg px-3 py-1.5 text-xs max-w-[85%] ${
                          msg.from === 'system'
                            ? 'bg-surface-bg text-white'
                            : convo.sentiment === 'positive' ? 'bg-[rgba(0,194,124,0.12)] text-accent-green' : 'bg-[rgba(232,112,104,0.12)] text-accent-red'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {convo.mappedTo && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {convo.mappedTo.budtender && (
                          <span className="rounded-full bg-surface-card border border-surface-border px-2 py-0.5 text-[10px] text-text-muted">
                            Staff: {convo.mappedTo.budtender}
                          </span>
                        )}
                        {convo.mappedTo.product && (
                          <span className="rounded-full bg-surface-card border border-surface-border px-2 py-0.5 text-[10px] text-text-muted">
                            Product: {convo.mappedTo.product}
                          </span>
                        )}
                        <span className="rounded-full bg-surface-card border border-surface-border px-2 py-0.5 text-[10px] text-text-muted">
                          {convo.mappedTo.txnId}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Channel Stats</p>
              <div className="space-y-2 mb-4">
                <StatRow label="Surveys Sent" value={Math.round(NEXUS_DATA.smsChannel.sent * dm).toLocaleString()} sub={rangeLabel.toLowerCase()} />
                <StatRow label="Responses" value={Math.round(NEXUS_DATA.smsChannel.responded * dm).toLocaleString()} sub={`${NEXUS_DATA.smsChannel.responseRate}% rate`} />
                <StatRow label="Avg Sentiment" value={NEXUS_DATA.smsChannel.avgSentiment} trend={NEXUS_DATA.smsChannel.sentimentDelta} />
                <StatRow label="Today" value={`${NEXUS_DATA.smsChannel.todayResponded}/${NEXUS_DATA.smsChannel.todaySent}`} sub="responded/sent" />
              </div>
              <div className="rounded-xl bg-[rgba(163,113,247,0.08)] border border-[#B598E8]/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-accent-purple" />
                  <span className="text-xs font-semibold text-accent-purple">AI Insight</span>
                </div>
                <p className="text-xs text-accent-purple/80">{NEXUS_DATA.smsChannel.topInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ecomm/Kiosk Tab */}
        {activeTab === 'ecomm' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Reaction Distribution</p>
              <div className="space-y-3 mb-4">
                {NEXUS_DATA.ecommChannel.breakdown.map((r) => (
                  <div key={r.emoji}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{r.emoji}</span>
                        <span className="text-sm text-text-primary">{r.label}</span>
                      </div>
                      <span className="text-sm font-bold text-text-primary">{r.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-card">
                      <div
                        className={`h-full rounded-full transition-all ${
                          r.emoji === '😍' ? 'bg-accent-green' :
                          r.emoji === '😊' ? 'bg-accent-green' :
                          r.emoji === '😐' ? 'bg-accent-gold' :
                          'bg-accent-red'
                        }`}
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                <span className="font-semibold text-text-primary">{NEXUS_DATA.ecommChannel.withFreeText.toLocaleString()}</span> reactions included free-text feedback ({NEXUS_DATA.ecommChannel.freeTextRate}%)
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Product-Level Sentiment</p>
              <div className="space-y-3 mb-4">
                {NEXUS_DATA.ecommChannel.topProductSentiment.map((p) => (
                  <div key={p.product} className="rounded-lg border border-surface-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">{p.product}</span>
                      <span className={`text-sm font-bold ${p.score >= 75 ? 'text-accent-green' : p.score >= 60 ? 'text-accent-gold' : 'text-accent-red'}`}>
                        {p.score}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-text-muted">
                      <span>😍 {p.loves}</span>
                      <span>😊 {p.goods}</span>
                      <span>😐 {p.mehs}</span>
                      <span>😒 {p.bads}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-[rgba(163,113,247,0.08)] border border-[#B598E8]/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-accent-purple" />
                  <span className="text-xs font-semibold text-accent-purple">AI Insight</span>
                </div>
                <p className="text-xs text-accent-purple/80">{NEXUS_DATA.ecommChannel.topInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Voice CSAT Tab */}
        {activeTab === 'voice' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">CSAT Distribution</p>
              <div className="flex items-end gap-6 mb-4">
                <div>
                  <p className="text-4xl font-bold text-text-primary">{NEXUS_DATA.voiceSurveyChannel.avgCsat}</p>
                  <p className="text-xs text-text-muted">Avg CSAT (1–5)</p>
                  <p className="text-xs font-medium text-accent-green">+{NEXUS_DATA.voiceSurveyChannel.csatDelta} this month</p>
                </div>
                <div className="flex-1">
                  {NEXUS_DATA.voiceSurveyChannel.distribution.map((d) => (
                    <div key={d.rating} className="flex items-center gap-2 mb-1">
                      <span className="w-4 text-xs text-right text-text-muted">{d.rating}</span>
                      <div className="flex-1 h-3 overflow-hidden rounded-full bg-surface-card">
                        <div
                          className={`h-full rounded-full ${
                            d.rating >= 4 ? 'bg-accent-green' : d.rating === 3 ? 'bg-accent-gold' : 'bg-accent-red'
                          }`}
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-xs text-text-muted text-right">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 text-xs text-text-muted">
                <span>Surveyed: <span className="font-semibold text-text-primary">{Math.round(NEXUS_DATA.voiceSurveyChannel.surveyed * dm)}</span></span>
                <span>Completed: <span className="font-semibold text-text-primary">{Math.round(NEXUS_DATA.voiceSurveyChannel.completed * dm)}</span></span>
                <span>Rate: <span className="font-semibold text-text-primary">{NEXUS_DATA.voiceSurveyChannel.completionRate}%</span></span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Recent Verbatim</p>
              <div className="space-y-3 mb-4">
                {NEXUS_DATA.voiceSurveyChannel.recentVerbatim.map((v, i) => (
                  <div key={i} className={`rounded-lg border p-3 ${
                    v.rating >= 4 ? 'border-surface-border bg-[rgba(0,194,124,0.12)]/30' : v.rating <= 2 ? 'border-surface-border bg-[rgba(232,112,104,0.12)]/30' : 'border-surface-border'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={10} className={s <= v.rating ? 'text-accent-green fill-[#00C27C]' : 'text-text-muted'} />
                        ))}
                      </div>
                      <span className="text-[11px] text-text-muted">{v.store}</span>
                    </div>
                    <p className="text-xs text-text-primary italic">"{v.text}"</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-[rgba(163,113,247,0.08)] border border-[#B598E8]/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-accent-purple" />
                  <span className="text-xs font-semibold text-accent-purple">AI Insight</span>
                </div>
                <p className="text-xs text-accent-purple/80">{NEXUS_DATA.voiceSurveyChannel.topInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* QR Tab */}
        {activeTab === 'qr' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Budtender Leaderboard</p>
              <div className="space-y-2 mb-4">
                {NEXUS_DATA.qrChannel.budtenderLeaderboard.map((b, i) => (
                  <div key={b.name} className={`rounded-lg border p-3 ${
                    i === 0 ? 'border-accent-green/20 bg-accent-green/5' : 'border-surface-border'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          i === 0 ? 'bg-accent-green text-white' : i === 1 ? 'bg-surface-card text-white' : 'bg-orange-300 text-white'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-text-primary">{b.name}</span>
                          <span className="text-[11px] text-text-muted ml-2">{b.store}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">{b.surveys} surveys</span>
                        <span className={`text-sm font-bold ${b.avgScore >= 4 ? 'text-accent-green' : b.avgScore >= 3 ? 'text-accent-gold' : 'text-accent-red'}`}>
                          {b.avgScore}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-muted italic ml-8">"{b.topComment}"</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Channel Stats</p>
              <div className="space-y-2 mb-4">
                <StatRow label="QR Codes Printed" value={Math.round(NEXUS_DATA.qrChannel.printed * dm).toLocaleString()} />
                <StatRow label="Scans" value={Math.round(NEXUS_DATA.qrChannel.scanned * dm)} sub={`${NEXUS_DATA.qrChannel.scanRate}% scan rate`} />
                <StatRow label="Completions" value={Math.round(NEXUS_DATA.qrChannel.completed * dm)} sub={`${NEXUS_DATA.qrChannel.completionRate}% completion`} />
                <StatRow label="Avg Score" value={`${NEXUS_DATA.qrChannel.avgScore}/5`} />
              </div>
              <div className="flex gap-3 mb-4">
                <div className="flex-1 rounded-lg border border-surface-border bg-[rgba(0,194,124,0.12)]/30 p-2.5 text-center">
                  <p className="text-xs text-text-muted">Best scan rate</p>
                  <p className="text-sm font-bold text-accent-green">{NEXUS_DATA.qrChannel.topStore.name}</p>
                  <p className="text-xs text-accent-green">{NEXUS_DATA.qrChannel.topStore.scanRate}%</p>
                </div>
                <div className="flex-1 rounded-lg border border-surface-border bg-[rgba(232,112,104,0.12)]/30 p-2.5 text-center">
                  <p className="text-xs text-text-muted">Lowest scan rate</p>
                  <p className="text-sm font-bold text-accent-red">{NEXUS_DATA.qrChannel.worstStore.name}</p>
                  <p className="text-xs text-accent-red">{NEXUS_DATA.qrChannel.worstStore.scanRate}%</p>
                </div>
              </div>
              <div className="rounded-xl bg-[rgba(163,113,247,0.08)] border border-[#B598E8]/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-accent-purple" />
                  <span className="text-xs font-semibold text-accent-purple">AI Insight</span>
                </div>
                <p className="text-xs text-accent-purple/80">{NEXUS_DATA.qrChannel.topInsight}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </NexusTile>
  );
}

// ---------------------------------------------------------------------------
// Unified Sentiment Pipeline Tile
// ---------------------------------------------------------------------------

function UnifiedPipelineTile() {
  const { dateMultiplier, rangeLabel } = useDateRange();
  const d = NEXUS_DATA.unifiedPipeline;
  const firstParty = d.channelScores.filter((c) => c.type === 'first-party');
  const thirdParty = d.channelScores.filter((c) => c.type === 'third-party');

  const channelIcons = {
    sms: Smartphone, ecomm: Monitor, voice: Mic, qr: QrCode,
    google: Star, leafly: Star, weedmaps: Star, reddit: MessageSquare, dutchie: Star,
  };

  return (
    <NexusTile span={2}>
      <TileHeader
        icon={Layers}
        title="Unified Sentiment Pipeline"
        subtitle={`${Math.round(d.totalSignals * dateMultiplier).toLocaleString()} signals from ${d.channelScores.length} channels — ${rangeLabel.toLowerCase()}`}
        iconBg="bg-[rgba(100,168,224,0.12)] text-accent-blue"
      />
      <div className="p-6">
        {/* Hero insight */}
        <div className="rounded-xl bg-surface-bg p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-green">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-accent-green mb-1">The Unified View</p>
              <p className="text-sm text-text-primary/70 leading-relaxed">{d.keyInsight}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Unified score */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center mb-3">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="48" fill="none" stroke="var(--color-surface-border)" strokeWidth="10" />
                <circle cx="56" cy="56" r="48" fill="none" stroke="#00E08E" strokeWidth="10"
                  strokeDasharray={`${(d.unifiedScore / 100) * 301.6} 301.6`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-3xl font-bold text-text-primary">{d.unifiedScore}</span>
            </div>
            <p className="text-sm font-semibold text-text-primary">Unified Sentiment Score</p>
            <p className="text-xs font-medium text-accent-green">+{d.unifiedDelta} pts this month</p>
            <div className="mt-3 flex gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-accent-purple">{d.firstPartyPct}%</p>
                <p className="text-[10px] text-text-muted uppercase">First-party</p>
              </div>
              <div className="border-l border-surface-border pl-4">
                <p className="text-lg font-bold text-accent-blue">{(100 - d.firstPartyPct).toFixed(1)}%</p>
                <p className="text-[10px] text-text-muted uppercase">Third-party</p>
              </div>
            </div>
          </div>

          {/* Channel breakdown */}
          <div className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* First-party */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-accent-purple" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-purple">First-Party (Proprietary)</p>
                </div>
                <div className="space-y-2">
                  {firstParty.map((c) => {
                    const Icon = channelIcons[c.icon];
                    return (
                      <div key={c.channel} className="flex items-center justify-between rounded-lg border border-[#B598E8]/20 bg-[rgba(163,113,247,0.06)] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Icon size={12} className="text-accent-purple" />
                          <span className="text-sm text-text-primary">{c.channel}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-text-muted">{Math.round(c.signals * dateMultiplier).toLocaleString()}</span>
                          <span className={`text-sm font-bold ${c.score >= 70 ? 'text-accent-green' : c.score >= 55 ? 'text-accent-gold' : 'text-accent-red'}`}>
                            {c.score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Third-party */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-accent-blue" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Third-Party (Scraped)</p>
                </div>
                <div className="space-y-2">
                  {thirdParty.map((c) => {
                    const Icon = channelIcons[c.icon];
                    return (
                      <div key={c.channel} className="flex items-center justify-between rounded-lg border border-surface-border bg-[rgba(100,168,224,0.12)]/30 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Icon size={12} className="text-accent-blue" />
                          <span className="text-sm text-text-primary">{c.channel}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-text-muted">{Math.round(c.signals * dateMultiplier).toLocaleString()}</span>
                          <span className={`text-sm font-bold ${c.score >= 70 ? 'text-accent-green' : c.score >= 55 ? 'text-accent-gold' : 'text-accent-red'}`}>
                            {c.score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signal Divergences */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-accent-gold" />
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Signal Divergences — Where First-Party ≠ Third-Party</p>
          </div>
          <div className="space-y-2">
            {d.divergences.map((div, i) => (
              <div key={i} className="rounded-xl border border-surface-border bg-[rgba(212,160,58,0.12)]/30 px-4 py-3">
                <div className="flex items-center gap-4 mb-1.5">
                  <span className="text-sm font-semibold text-text-primary">{div.store}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-[rgba(163,113,247,0.15)] px-2 py-0.5 text-accent-purple font-medium">1st: {div.firstParty}</span>
                    <span className="rounded-full bg-[rgba(100,168,224,0.15)] px-2 py-0.5 text-accent-blue font-medium">3rd: {div.thirdParty}</span>
                    <span className={`font-bold ${div.delta > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {div.delta > 0 ? '+' : ''}{div.delta} gap
                    </span>
                  </div>
                </div>
                <p className="text-xs text-accent-gold">{div.insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NexusTile>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   INVENTORY
   ═══════════════════════════════════════════════════════════════════ */

function InventoryTile() {
  const { isAllSelected, selectionLabel } = useStores();
  const scaledAlerts = isAllSelected ? NEXUS_DATA.lowStockAlerts : Math.max(1, Math.round(NEXUS_DATA.lowStockAlerts * 0.5));
  const scaledRisk = isAllSelected ? NEXUS_DATA.stockoutRisk : Math.max(1, Math.round(NEXUS_DATA.stockoutRisk * 0.5));
  return (
    <NexusTile>
      <TileHeader
        icon={Package}
        title="Inventory & Reordering"
        subtitle={`${scaledAlerts} low-stock alerts — ${selectionLabel}`}
        iconBg="bg-[rgba(255,166,87,0.12)] text-[#FFA657]"
        action={() => navigate('/agents/bridge')}
        actionLabel="Draft Reorder"
        badge={{ count: scaledRisk, color: 'bg-accent-red' }}
      />
      <div className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(232,112,104,0.12)]">
            <AlertTriangle size={24} className="text-accent-red" />
          </div>
          <div>
            <p className="text-2xl font-bold text-accent-red">{scaledRisk}</p>
            <p className="text-xs text-text-muted">Products at stockout risk</p>
          </div>
        </div>
        <div className="space-y-3">
          {NEXUS_DATA.topLowStock.map((item) => (
            <div key={item.product} className="flex items-center justify-between rounded-lg border border-[#FFA657]/20 bg-[rgba(255,166,87,0.06)] px-3 py-2">
              <div>
                <p className="text-sm font-medium text-text-primary">{item.product}</p>
                <p className="text-xs text-text-muted">{item.store}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${item.daysLeft <= 1 ? 'text-accent-red' : 'text-[#FFA657]'}`}>
                  {item.daysLeft}d left
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </NexusTile>
  );
}

function PricingTile() {
  const navigate = useNavigate();
  const { rangeLabel } = useDateRange();

  const MiniTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const gapStr = `${d.gap >= 0 ? '+' : ''}${d.gap.toFixed(1)}%`;
    return (
      <div className="bg-surface-hover border border-surface-border rounded-lg px-3 py-2 shadow-xl text-xs" style={{ minWidth: 140 }}>
        <p className="text-text-primary font-semibold">{d.name}</p>
        <p className="text-text-secondary text-[10px] mb-1">{d.brand}</p>
        <div className="flex justify-between gap-3">
          <span className="text-text-muted">You</span>
          <span className="text-text-primary font-medium">${d.y}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-text-muted">Market</span>
          <span className="text-text-secondary">${d.x}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-text-muted">Gap</span>
          <span className={`font-bold ${d.gap > 3 ? 'text-accent-gold' : d.gap < -3 ? 'text-accent-blue' : 'text-text-secondary'}`}>{gapStr}</span>
        </div>
      </div>
    );
  };

  return (
    <NexusTile>
      <TileHeader
        icon={DollarSign}
        title="Pricing & Discounts"
        subtitle={`Your price vs market — ${rangeLabel.toLowerCase()}`}
        iconBg="bg-accent-green/10 text-accent-green"
        action={() => navigate('/agents/pricing')}
        actionLabel="Optimize"
        badge={{ count: NEXUS_DATA.underperformingPromos, color: 'bg-accent-gold' }}
      />
      <div className="px-4 pt-3 pb-2">
        {/* Mini legend */}
        <div className="flex items-center justify-end gap-3 text-[10px] text-text-secondary mb-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-gold" /> Above</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8B949E]" /> At</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-blue" /> Below</span>
        </div>

        {/* Mini scatterplot — click navigates to full pricing page */}
        <div
          className="h-[180px] cursor-pointer rounded-lg hover:bg-surface-hover transition-colors"
          onClick={() => navigate('/agents/pricing')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" />
              <XAxis
                type="number" dataKey="x" name="Market Avg"
                domain={[MINI_PRICE_MIN, MINI_PRICE_MAX]}
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                tickFormatter={v => `$${v}`}
                label={{ value: 'Market', position: 'bottom', offset: 0, fill: 'var(--color-text-secondary)', fontSize: 9 }}
                stroke="var(--color-surface-border)"
              />
              <YAxis
                type="number" dataKey="y" name="Your Price"
                domain={[MINI_PRICE_MIN, MINI_PRICE_MAX]}
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                tickFormatter={v => `$${v}`}
                label={{ value: 'You', angle: -90, position: 'insideLeft', offset: 8, fill: 'var(--color-text-secondary)', fontSize: 9 }}
                stroke="var(--color-surface-border)"
                width={32}
              />
              <ZAxis type="number" dataKey="z" range={[40, 200]} name="Weekly Units" />
              <RechartsTooltip content={<MiniTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#484F58' }} />
              <ReferenceLine
                segment={[{ x: MINI_PRICE_MIN, y: MINI_PRICE_MIN }, { x: MINI_PRICE_MAX, y: MINI_PRICE_MAX }]}
                stroke="#484F58" strokeDasharray="5 3" strokeWidth={1}
              />
              <Scatter data={MINI_SCATTER_DATA}>
                {MINI_SCATTER_DATA.map((entry, index) => (
                  <Cell
                    key={`mc-${index}`}
                    fill={entry.gap > 3 ? '#D4A03A' : entry.gap < -3 ? '#64A8E0' : '#8B949E'}
                    fillOpacity={0.85}
                    stroke={entry.gap > 3 ? '#D4A03A' : entry.gap < -3 ? '#64A8E0' : '#8B949E'}
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats below chart */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-text-secondary">Gap:</span>
            <span className="text-accent-gold font-semibold">{NEXUS_DATA.marketPriceGap}</span>
            <span className="text-text-muted">above avg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-secondary">Wasted:</span>
            <span className="text-accent-red font-semibold">{fmtDollar(NEXUS_DATA.discountWaste)}</span>
          </div>
        </div>
      </div>
    </NexusTile>
  );
}

// ---------------------------------------------------------------------------
// Sales Reporting Tile
// ---------------------------------------------------------------------------

function SalesReportingTile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [chartMetric, setChartMetric] = useState('revenue');
  const { selectedStoreNames, isAllSelected, selectionLabel } = useStores();
  const { selectedRange, dateMultiplier, trendScale, rateOffset, periodLabel, rangeLabel } = useDateRange();

  // Map global date range to the closest sales period + an extra multiplier for quarter/year
  const period = selectedRange === 'last_week' ? 'week' : 'month';
  const salesMultiplier = selectedRange === 'last_quarter' ? 3 : selectedRange === 'last_year' ? 12 : 1;

  // Filter stores to selection
  const activeStores = useMemo(() =>
    STORE_METRICS.filter(s => selectedStoreNames.has(s.name)).sort((a, b) => b.revenue - a.revenue),
    [selectedStoreNames]);

  // Revenue ratio for scaling aggregate KPIs
  const storeRatio = useMemo(() => {
    if (isAllSelected) return 1;
    const totalRev = STORE_METRICS.reduce((sum, s) => sum + s.revenue, 0);
    const selRev = activeStores.reduce((sum, s) => sum + s.revenue, 0);
    return totalRev > 0 ? selRev / totalRev : 0;
  }, [activeStores, isAllSelected]);

  // Scaled period KPIs (store ratio + date range sales multiplier + trend/rate adjustments)
  const d = useMemo(() => {
    const base = SALES_DATA.periods[period];
    const sr = isAllSelected ? 1 : storeRatio;
    const sm = salesMultiplier;
    return {
      ...base,
      revenue: Math.round(base.revenue * sr * sm),
      revenueGoal: Math.round(base.revenueGoal * sr * sm),
      transactions: Math.round(base.transactions * sr * sm),
      revenueDelta: Math.round(base.revenueDelta * trendScale * 10) / 10,
      transactionsDelta: Math.round(base.transactionsDelta * trendScale * 10) / 10,
      avgBasket: Math.round((base.avgBasket * (1 + rateOffset)) * 100) / 100,
      avgBasketDelta: Math.round(base.avgBasketDelta * trendScale * 10) / 10,
      grossMargin: Math.round((base.grossMargin + rateOffset * 50) * 10) / 10,
      grossMarginDelta: Math.round(base.grossMarginDelta * trendScale * 10) / 10,
      marketBenchmark: {
        ...base.marketBenchmark,
        revenue: Math.round(base.marketBenchmark.revenue * sr * sm),
        transactions: Math.round(base.marketBenchmark.transactions * sr * sm),
      },
    };
  }, [period, storeRatio, isAllSelected, salesMultiplier, trendScale, rateOffset]);

  const bench = d.marketBenchmark;

  // Scaled timeseries for chart
  const scaledTimeseries = useMemo(() => {
    const series = SALES_TIMESERIES[period];
    const sr = isAllSelected ? 1 : storeRatio;
    const sm = salesMultiplier;
    return series.map(pt => ({
      ...pt,
      revenue: Math.round(pt.revenue * sr * sm),
      transactions: Math.round(pt.transactions * sr * sm),
      marketRevenue: Math.round(pt.marketRevenue * sr * sm),
    }));
  }, [period, storeRatio, isAllSelected, salesMultiplier]);

  // Store list for the stores tab
  const displayStores = useMemo(() => {
    const stores = activeStores.slice(0, 10);
    const totalRev = stores.reduce((sum, s) => sum + s.revenue, 0);
    return stores.map(s => ({
      name: s.name, revenue: Math.round(s.revenue * 1000),
      pct: totalRev > 0 ? Math.round((s.revenue / totalRev) * 1000) / 10 : 0,
      transactions: s.transactions, avgBasket: s.avgBasket, margin: s.margin,
      vsBenchmark: Math.round(s.vsBenchmark),
    }));
  }, [activeStores]);

  const activeCM = CHART_METRICS.find(m => m.key === chartMetric);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'categories', label: 'Categories' },
    { key: 'brands', label: 'Brands' },
    { key: 'stores', label: 'Stores' },
  ];

  const kpis = [
    {
      label: 'Revenue', value: fmtDollar(d.revenue), delta: d.revenueDelta,
      bench: fmtDollar(bench.revenue), benchLabel: 'Market avg',
      icon: DollarSign, color: '#00C27C',
      sub: `Goal: ${fmtDollar(d.revenueGoal)}`,
    },
    {
      label: 'Transactions', value: d.transactions.toLocaleString(), delta: d.transactionsDelta,
      bench: bench.transactions.toLocaleString(), benchLabel: 'Market avg',
      icon: Receipt, color: '#64A8E0',
    },
    {
      label: 'Avg Basket', value: `$${d.avgBasket.toFixed(2)}`, delta: d.avgBasketDelta,
      bench: `$${bench.avgBasket}`, benchLabel: 'Market avg',
      icon: ShoppingBag, color: '#B598E8',
    },
    {
      label: 'Gross Margin', value: `${d.grossMargin}%`, delta: d.grossMarginDelta,
      bench: `${bench.margin}%`, benchLabel: 'Market avg',
      icon: Percent, color: '#D4A03A',
    },
  ];

  // Custom bar tooltip
  const CatTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-surface-hover border border-surface-border rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="text-text-primary font-semibold mb-1">{d.name}</p>
        <div className="space-y-0.5">
          <div className="flex justify-between gap-4"><span className="text-text-muted">Revenue</span><span className="text-text-primary">{fmtDollar(d.revenue)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-text-muted">Your Share</span><span className="text-text-primary">{d.yourShare}%</span></div>
          <div className="flex justify-between gap-4"><span className="text-text-muted">Market Share</span><span className="text-text-secondary">{d.marketShare}%</span></div>
          <div className="flex justify-between gap-4"><span className="text-text-muted">Margin</span><span className="text-accent-green">{d.margin}%</span></div>
        </div>
      </div>
    );
  };

  return (
    <NexusTile span={2}>
      {/* Header with period selector */}
      <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(100,168,224,0.12)] text-accent-blue">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Sales Reporting</h3>
            <p className="text-xs text-text-muted">Performance vs market benchmarks — {rangeLabel} — {selectionLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-surface-bg px-3 py-1.5">
          <span className="text-xs font-medium text-text-primary">{rangeLabel}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-surface-border px-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-[#64A8E0] text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-grid">
              {kpis.map(k => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className="bg-surface-bg rounded-xl border border-surface-border border-l-[3px] p-4 hover:brightness-110 transition-all" style={{ borderLeftColor: k.color, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${k.color}18` }}>
                        <Icon size={16} style={{ color: k.color }} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-text-primary">{k.value}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-secondary">{k.label}</span>
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${k.delta >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {k.delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {k.delta >= 0 ? '+' : ''}{k.delta}%
                      </span>
                    </div>
                    {k.sub && <p className="text-text-muted text-[10px] mt-1">{k.sub}</p>}
                    <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(56,51,43,0.4)' }}>
                      <span className="text-[10px] text-text-secondary">{k.benchLabel}: {k.bench}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: k.delta >= 0 ? '#00C27C' : '#E87068', background: k.delta >= 0 ? 'rgba(0,194,124,0.07)' : 'rgba(232,112,104,0.07)' }}>
                        {k.delta >= 0 ? 'Above' : 'Below'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sales trend chart with metric toggle */}
            <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Sales Trend</p>
                <div className="flex items-center gap-1 rounded-lg bg-surface-card p-0.5">
                  {CHART_METRICS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setChartMetric(m.key)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${chartMetric === m.key ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                      style={chartMetric === m.key ? { background: `${m.color}20`, color: m.color } : {}}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-2 text-[10px] text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-[2px] rounded-full" style={{ background: activeCM.color }} />
                  {activeCM.label}
                </span>
                {activeCM.benchKey && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-[2px] rounded-full bg-surface-card" style={{ borderTop: '2px dashed #484F58' }} />
                    Market Benchmark
                  </span>
                )}
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scaledTimeseries} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                    <defs>
                      <linearGradient id={`grad-${chartMetric}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeCM.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={activeCM.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} stroke="var(--color-surface-border)" />
                    <YAxis
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} stroke="var(--color-surface-border)"
                      tickFormatter={activeCM.format}
                      width={52}
                    />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: '#8B949E', marginBottom: 4 }}
                      formatter={(value, name) => {
                        const m = CHART_METRICS.find(cm => cm.key === name) || (name === 'marketRevenue' ? { format: v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K` } : null);
                        return [m ? m.format(value) : value, name === 'marketRevenue' ? 'Market' : activeCM.label];
                      }}
                      cursor={{ stroke: '#484F58', strokeDasharray: '3 3' }}
                    />
                    {activeCM.benchKey && (
                      <Area
                        type="monotone" dataKey={activeCM.benchKey}
                        stroke="#484F58" strokeWidth={1.5} strokeDasharray="5 3"
                        fill="none" dot={false}
                      />
                    )}
                    <Area
                      type="monotone" dataKey={chartMetric}
                      stroke={activeCM.color} strokeWidth={2}
                      fill={`url(#grad-${chartMetric})`}
                      dot={{ r: 3, fill: activeCM.color, stroke: 'var(--color-surface-bg)', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: activeCM.color, stroke: 'var(--color-surface-bg)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue progress bar */}
            <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-xs font-medium">Revenue vs Goal</span>
                <span className="text-text-primary text-sm font-bold">{Math.round((d.revenue / d.revenueGoal) * 100)}%</span>
              </div>
              <div className="h-3 bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (d.revenue / d.revenueGoal) * 100)}%`,
                    background: d.revenue >= d.revenueGoal ? '#00C27C' : d.revenue >= d.revenueGoal * 0.85 ? '#D4A03A' : '#E87068',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-text-muted">
                <span>{fmtDollar(d.revenue)}</span>
                <span>Goal: {fmtDollar(d.revenueGoal)}</span>
              </div>
            </div>

            {/* Quick category + store summary side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category mini breakdown */}
              <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Revenue by Category</p>
                  <button onClick={() => setActiveTab('categories')} className="text-accent-blue text-[10px] hover:underline">Details</button>
                </div>
                <div className="space-y-2">
                  {SALES_DATA.categories.map(c => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <span className="text-text-secondary text-xs w-20 truncate">{c.name}</span>
                      <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color, opacity: 0.8 }} />
                      </div>
                      <span className="text-text-primary text-xs font-medium w-12 text-right">{c.pct}%</span>
                      <span className="text-text-muted text-[10px] w-16 text-right">${(c.revenue / 1000).toFixed(1)}k</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Store mini breakdown */}
              <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Revenue by Store</p>
                  <button onClick={() => setActiveTab('stores')} className="text-accent-blue text-[10px] hover:underline">Details</button>
                </div>
                <div className="space-y-2">
                  {displayStores.map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <MapPin size={10} className="text-text-muted flex-shrink-0" />
                      <span className="text-text-secondary text-xs w-32 truncate">{s.name}</span>
                      <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-accent-blue" style={{ width: `${s.pct}%`, opacity: 0.7 }} />
                      </div>
                      <span className="text-text-primary text-xs font-medium w-12 text-right">{s.pct}%</span>
                      <span className={`text-[10px] font-bold w-10 text-right ${s.vsBenchmark >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {s.vsBenchmark >= 0 ? '+' : ''}{s.vsBenchmark}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Categories Tab ── */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            {/* Bar chart: Your share vs market share */}
            <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Your Mix vs Market Mix</p>
                <div className="flex items-center gap-3 text-[10px] text-text-secondary">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent-blue" /> You</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-surface-card" /> Market</span>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CATEGORY_BAR_DATA} margin={{ top: 4, right: 4, bottom: 4, left: 4 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} stroke="var(--color-surface-border)" />
                    <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} stroke="var(--color-surface-border)" tickFormatter={v => `${v}%`} />
                    <RechartsTooltip content={<CatTooltip />} cursor={{ fill: 'rgba(100,168,224,0.06)' }} />
                    <Bar dataKey="yourShare" name="Your Share" fill="#64A8E0" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="marketShare" name="Market Share" fill="#484F58" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category detail table */}
            <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left text-text-secondary font-medium px-4 py-2.5">Category</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Revenue</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Units</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Your %</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Market %</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {SALES_DATA.categories.map(c => (
                    <tr key={c.name} className="border-b border-surface-border hover:bg-surface-card transition-colors">
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                        <span className="text-text-primary font-medium">{c.name}</span>
                      </td>
                      <td className="text-right px-4 py-2.5 text-text-primary font-medium">{fmtDollar(c.revenue)}</td>
                      <td className="text-right px-4 py-2.5 text-text-secondary">{c.units}</td>
                      <td className="text-right px-4 py-2.5 text-text-primary font-medium">{c.pct}%</td>
                      <td className="text-right px-4 py-2.5 text-text-secondary">{c.marketShare}%</td>
                      <td className="text-right px-4 py-2.5">
                        <span className={c.margin >= 50 ? 'text-accent-green font-bold' : 'text-accent-gold font-medium'}>{c.margin}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Brands Tab ── */}
        {activeTab === 'brands' && (
          <div className="space-y-4">
            <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left text-text-secondary font-medium px-4 py-2.5">#</th>
                    <th className="text-left text-text-secondary font-medium px-4 py-2.5">Brand</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Revenue</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Units</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Avg Price</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Margin</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {SALES_DATA.brands.map(b => (
                    <tr key={b.name} className="border-b border-surface-border hover:bg-surface-card transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${b.rank <= 3 ? 'bg-[rgba(212,160,58,0.15)] text-accent-gold' : 'bg-surface-hover text-text-muted'}`}>
                          {b.rank}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-primary font-semibold">{b.name}</td>
                      <td className="text-right px-4 py-2.5 text-text-primary font-medium">{fmtDollar(b.revenue)}</td>
                      <td className="text-right px-4 py-2.5 text-text-secondary">{b.units}</td>
                      <td className="text-right px-4 py-2.5 text-text-secondary">${b.avgPrice.toFixed(2)}</td>
                      <td className="text-right px-4 py-2.5">
                        <span className={b.margin >= 50 ? 'text-accent-green font-bold' : 'text-accent-gold font-medium'}>{b.margin}%</span>
                      </td>
                      <td className="text-right px-4 py-2.5">
                        <span className={`font-bold flex items-center justify-end gap-0.5 ${b.trend >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {b.trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {b.trend >= 0 ? '+' : ''}{b.trend}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Brand insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Top Revenue</p>
                <p className="text-text-primary text-lg font-bold">Jeeter</p>
                <p className="text-accent-green text-xs font-semibold">$8,420 · +12.3%</p>
              </div>
              <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Best Margin</p>
                <p className="text-text-primary text-lg font-bold">Wyld</p>
                <p className="text-accent-gold text-xs font-semibold">55.6% margin · +15.2% trending</p>
              </div>
              <div className="bg-surface-bg rounded-xl border border-surface-border p-4">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Declining</p>
                <p className="text-text-primary text-lg font-bold">Cookies</p>
                <p className="text-accent-red text-xs font-semibold">-3.2% · Lowest margin at 41.8%</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Stores Tab ── */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left text-text-secondary font-medium px-4 py-2.5">Store</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Revenue</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Transactions</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Avg Basket</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">Margin</th>
                    <th className="text-right text-text-secondary font-medium px-4 py-2.5">vs Benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStores.map(s => (
                    <tr key={s.name} className="border-b border-surface-border hover:bg-surface-card transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-text-muted" />
                          <span className="text-text-primary font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-2.5 text-text-primary font-medium">{fmtDollar(s.revenue)}</td>
                      <td className="text-right px-4 py-2.5 text-text-secondary">{s.transactions}</td>
                      <td className="text-right px-4 py-2.5 text-text-secondary">${s.avgBasket.toFixed(2)}</td>
                      <td className="text-right px-4 py-2.5">
                        <span className={s.margin >= 48 ? 'text-accent-green font-bold' : 'text-accent-gold font-medium'}>{s.margin}%</span>
                      </td>
                      <td className="text-right px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.vsBenchmark >= 0 ? 'bg-[rgba(0,194,124,0.12)] text-accent-green' : 'bg-[rgba(232,112,104,0.12)] text-accent-red'}`}>
                          {s.vsBenchmark >= 0 ? '+' : ''}{s.vsBenchmark}% vs market
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Store insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-[rgba(0,194,124,0.06)] rounded-xl border border-[rgba(0,194,124,0.15)] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight size={14} className="text-accent-green" />
                  <span className="text-accent-green text-xs font-semibold">Top Performer</span>
                </div>
                <p className="text-text-primary text-sm font-medium">{displayStores[0]?.name || 'Top Store'}</p>
                <p className="text-text-secondary text-xs mt-1">${((displayStores[0]?.revenue || 0) / 1000).toFixed(1)}k revenue · {displayStores[0]?.margin || 0}% margin · +{displayStores[0]?.vsBenchmark || 0}% vs market benchmark.</p>
              </div>
              <div className="bg-[rgba(232,112,104,0.06)] rounded-xl border border-[rgba(232,112,104,0.15)] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownRight size={14} className="text-accent-red" />
                  <span className="text-accent-red text-xs font-semibold">Needs Attention</span>
                </div>
                <p className="text-text-primary text-sm font-medium">{displayStores[displayStores.length - 1]?.name || 'Store'}</p>
                <p className="text-text-secondary text-xs mt-1">${((displayStores[displayStores.length - 1]?.revenue || 0) / 1000).toFixed(1)}k revenue · {displayStores[displayStores.length - 1]?.vsBenchmark || 0}% vs benchmark.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </NexusTile>
  );
}

// ---------------------------------------------------------------------------
// v3 NEW COMPONENTS
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ─── AI MORNING BRIEFING ─── //

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
          <p className="text-[13px] text-[#C8C3BA] leading-[1.7] italic">
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

function LiveTicker() {
  const catQueries = {
    sale: (e) => `Tell me about recent sales at ${e.text.split(' ').slice(-2).join(' ')}`,
    inventory: (e) => `Show me inventory updates — ${e.text}`,
    review: (e) => `Show me the latest customer reviews`,
    marketing: (e) => `Show me marketing campaign performance`,
  };
  return (
    <NexusTile className="animate-fade-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border">
        <span className="relative flex h-2 w-2">
          <span className="absolute h-full w-full animate-ping rounded-full bg-accent-green opacity-40" />
          <span className="h-2 w-2 rounded-full bg-accent-green" />
        </span>
        <span className="text-[11px] font-semibold text-text-primary">Live Activity</span>
        <span className="text-[10px] text-text-muted ml-auto">{TICKER_EVENTS.length} events</span>
      </div>
      <div className="divide-y divide-surface-border/60 max-h-[340px] overflow-y-auto">
        {TICKER_EVENTS.map((e, i) => (
          <div
            key={i}
            onClick={() => navigate('/agents/bridge')}
            className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <span className="text-base flex-shrink-0">{e.icon}</span>
            <span className="text-[11px] text-[#C8C3BA] font-medium flex-1 truncate">{e.text}</span>
            <span className="text-[10px] text-text-muted flex-shrink-0">{e.time}</span>
          </div>
        ))}
      </div>
    </NexusTile>
  );
}

// ─── NEXUS COMMAND BAR ─── //

const COMMAND_ACTIONS_BY_PERSONA = {
  ceo: [
    { key: 'reorder', label: 'Reorder Stock', desc: 'Low & out-of-stock items', query: 'Reorder out of stock and low stock items', icon: Package, color: '#E87068' },
    { key: 'flash', label: 'Today\'s Sales', desc: 'Real-time all stores', query: 'How are all stores doing on sales today vs last week?', icon: Activity, color: '#D4A03A' },
    { key: 'winback', label: 'Win-Back Campaign', desc: 'Re-engage lapsed customers', query: 'Run a marketing campaign to win back lapsed customers', icon: Megaphone, color: '#00C27C' },
    { key: 'brands', label: 'Top Brands', desc: 'Best sellers MSO-wide', query: 'What are our top selling brands by revenue?', icon: Star, color: '#64A8E0' },
    { key: 'pricing', label: 'Price Check', desc: 'Us vs competitors', query: 'Compare our prices vs market average', icon: DollarSign, color: '#B598E8' },
    { key: 'sentiment', label: 'Customer Feedback', desc: 'Reviews & NPS', query: 'What is our customer sentiment and NPS score?', icon: MessageSquare, color: '#0EA5E9' },
  ],
  vp_retail: [
    { key: 'reorder', label: 'Reorder Stock', desc: 'Low & out-of-stock items', query: 'Reorder out of stock and low inventory items', icon: Package, color: '#E87068' },
    { key: 'winback', label: 'Win-Back Campaign', desc: 'Re-engage lapsed customers', query: 'Launch a marketing campaign to win back lapsed customers', icon: Megaphone, color: '#00C27C' },
    { key: 'pricing', label: 'Price Check', desc: 'Us vs competitors', query: 'Compare our prices vs market average', icon: DollarSign, color: '#D4A03A' },
    { key: 'performance', label: 'Store Performance', desc: 'Sales & rankings', query: 'How are all stores doing on sales this week?', icon: BarChart3, color: '#64A8E0' },
    { key: 'sentiment', label: 'Customer Feedback', desc: 'Reviews & NPS', query: 'What is customer sentiment across our stores?', icon: MessageSquare, color: '#B598E8' },
    { key: 'brands', label: 'Top Brands', desc: 'Best sellers', query: 'What are our best selling brands by revenue?', icon: Star, color: '#0EA5E9' },
  ],
  regional_mgr: [
    { key: 'reorder', label: 'Reorder Stock', desc: 'What\'s running low', query: 'Reorder out of stock and low stock products across my stores', icon: Package, color: '#E87068' },
    { key: 'winback', label: 'Win-Back Campaign', desc: 'Re-engage lapsed customers', query: 'Run a marketing campaign for lapsed customers', icon: Megaphone, color: '#00C27C' },
    { key: 'flash', label: 'Today\'s Sales', desc: 'Real-time vs last week', query: 'How are my stores doing on sales today?', icon: Activity, color: '#D4A03A' },
    { key: 'pricing', label: 'Price Check', desc: 'Us vs market', query: 'How do our prices compare to competitors?', icon: DollarSign, color: '#64A8E0' },
    { key: 'sentiment', label: 'Customer Feedback', desc: 'Reviews & NPS', query: 'What are customers saying about my stores?', icon: MessageSquare, color: '#B598E8' },
    { key: 'brands', label: 'Top Brands', desc: 'Best sellers', query: 'What are the best selling brands across my stores?', icon: Star, color: '#0EA5E9' },
  ],
  store_mgr: [
    { key: 'reorder', label: 'Reorder Stock', desc: 'Low & out-of-stock', query: 'Reorder out of stock and low stock items', icon: Package, color: '#E87068' },
    { key: 'winback', label: 'Win-Back Campaign', desc: 'Re-engage lapsed', query: 'Run a win-back campaign for lapsed customers', icon: Megaphone, color: '#00C27C' },
    { key: 'flash', label: 'Today\'s Sales', desc: 'Real-time vs last week', query: 'How are we doing on sales today compared to last week?', icon: Activity, color: '#D4A03A' },
    { key: 'pricing', label: 'Price Check', desc: 'Us vs competitors', query: 'Compare our prices vs competitors', icon: DollarSign, color: '#B598E8' },
    { key: 'sentiment', label: 'Customer Reviews', desc: 'Feedback & NPS', query: 'What is our customer sentiment this month?', icon: MessageSquare, color: '#64A8E0' },
    { key: 'brands', label: 'Top Sellers', desc: 'Best-moving products', query: 'What are our top selling products this week?', icon: Star, color: '#0EA5E9' },
  ],
  compliance: [
    { key: 'reorder', label: 'Reorder Stock', desc: 'Low & out-of-stock', query: 'Reorder out of stock and low stock items', icon: Package, color: '#E87068' },
    { key: 'winback', label: 'Win-Back Campaign', desc: 'Re-engage lapsed', query: 'Launch a marketing campaign to win back lapsed customers', icon: Megaphone, color: '#00C27C' },
    { key: 'flash', label: 'Today\'s Sales', desc: 'Real-time status', query: 'How are sales doing today across all stores?', icon: Activity, color: '#D4A03A' },
    { key: 'pricing', label: 'Price Check', desc: 'Market comparison', query: 'Compare our prices vs market average', icon: DollarSign, color: '#64A8E0' },
    { key: 'sentiment', label: 'Customer Feedback', desc: 'Reviews & NPS', query: 'What is our customer sentiment and NPS?', icon: MessageSquare, color: '#B598E8' },
    { key: 'brands', label: 'Top Brands', desc: 'Best sellers', query: 'What brands are selling best?', icon: Star, color: '#0EA5E9' },
  ],
};

function NexusCommandBar({ onAction }) {
  const [inputValue, setInputValue] = useState('');
  const { selectedPersonaId } = usePersona();
  const COMMAND_ACTIONS = COMMAND_ACTIONS_BY_PERSONA[selectedPersonaId] || COMMAND_ACTIONS_BY_PERSONA.ceo;
  return (
    <div className="rounded-2xl border overflow-hidden animate-fade-up" style={{ background: 'var(--color-surface-card)', borderColor: 'rgba(212,160,58,0.12)', animationDelay: '200ms' }}>
      <div className="px-4 py-3 border-b border-surface-border/60 flex items-center gap-2.5" style={{ background: '#1A1810' }}>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,160,58,0.1)', border: '1px solid rgba(212,160,58,0.15)' }}>
          <NexusIcon size={15} />
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-text-primary">Nexus</span>
          <span className="text-[10px] text-text-muted ml-2">What can I help with?</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5"><span className="absolute h-full w-full animate-ping rounded-full bg-accent-green opacity-40" /><span className="h-1.5 w-1.5 rounded-full bg-accent-green" /></span>
          <span className="text-[10px] text-accent-green font-medium">Ready</span>
        </div>
      </div>
      <div className="px-5 py-4">
        <form onSubmit={(e) => { e.preventDefault(); if (inputValue.trim()) { onAction(inputValue.trim()); setInputValue(''); } }} className="mb-4">
          <div className="flex items-center gap-3 bg-surface-bg border border-surface-border rounded-xl px-4 py-2.5 focus-within:border-[rgba(212,160,58,0.3)] transition-colors">
            <NexusIcon size={16} className="flex-shrink-0" />
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="What would you like to do?" className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none" />
            <span className="text-[10px] text-text-muted bg-[#2E2D2A] px-1.5 py-0.5 rounded font-mono hidden sm:block">\u2318K</span>
            <button type="submit" disabled={!inputValue.trim()} className="w-7 h-7 rounded-lg bg-accent-green flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#00B07A] transition-colors ml-1">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 stagger-grid">
          {COMMAND_ACTIONS.map(a => (
            <button key={a.key} onClick={() => onAction(a.query)} className="group text-left rounded-xl border border-surface-border hover:border-[rgba(212,160,58,0.15)] bg-surface-bg p-3 transition-all hover:brightness-110 hover:scale-[1.01] active:scale-[0.98]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${a.color}14` }}>
                  <a.icon className="w-3 h-3" style={{ color: a.color }} />
                </div>
                <span className="text-xs font-semibold text-text-primary">{a.label}</span>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed pl-8">{a.desc}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-text-muted">
          Recent: <span onClick={() => onAction("Show me stockout report")} className="text-text-secondary cursor-pointer hover:text-text-primary">"Stockout report"</span> &middot; <span onClick={() => onAction("Reprice Blue Dream")} className="text-text-secondary cursor-pointer hover:text-text-primary">"Market prices"</span>
        </div>
      </div>
    </div>
  );
}

// ─── SMART ALERTS & ACTIONS FEED ─── //

/* ═══════════════════════════════════════════════════════════════════
   SMART ALERTS — Mixed feed with vault-to-floor METRC transfer workflow
   ═══════════════════════════════════════════════════════════════════ */

const BASE = import.meta.env.BASE_URL || '/';

// Store Manager alerts (original single-store vault transfers)
const STORE_MGR_ALERTS = [
  {
    id: 'vtf-1', type: 'transfer', severity: 'CRITICAL', color: '#E87068', time: '2m ago',
    title: 'Blue Dream 3.5g — out of stock, 45 units in vault',
    ai: 'Floor empty for 3 days. $1,140 estimated lost sales. 45 units in vault at Logan Square ready for immediate transfer. METRC package 1A40603-BD35.',
    product: 'Blue Dream 3.5g', brand: 'Jeeter', store: 'Logan Square, IL', trackSystem: 'METRC',
    floor: 0, vault: 45, avgWeekly: 38, daysOOS: 3, recQty: 38,
    metrcPkg: '1A4060300003BD35', metrcSrc: 'Storage Vault A', metrcDest: 'Sales Floor',
    img: 'brands/jeeter-baby-churros.webp',
  },
  {
    id: 'vtf-2', type: 'transfer', severity: 'CRITICAL', color: '#E87068', time: '18m ago',
    title: 'Kiva Lost Farm Gummies — 2 days out of stock',
    ai: '60 units in vault, customers asking at counter. Transfer 28 units (weekly avg) to floor. METRC package 1A40603-KL60.',
    product: 'Kiva Lost Farm Gummies', brand: 'Kiva', store: 'Logan Square, IL', trackSystem: 'METRC',
    floor: 0, vault: 60, avgWeekly: 28, daysOOS: 2, recQty: 28,
    metrcPkg: '1A4060300003KL60', metrcSrc: 'Storage Vault A', metrcDest: 'Sales Floor',
    img: 'brands/kiva-camino.jpg',
  },
  {
    id: 'low-1', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '30m ago',
    title: 'Stiiizy Pod LR — floor stock running low (4 units)',
    ai: 'At current velocity, depletes by 3 PM. 18 units available in vault. Transfer before afternoon rush.',
    actions: ['View Inventory'],
  },
  {
    id: 'promo-1', type: 'standard', severity: 'OPPORTUNITY', color: '#00C27C', time: '1h ago',
    title: "Today's promo: Happy Hour 15% Off (3–6 PM)",
    ai: 'Last week this promo drove +23% afternoon traffic. Ensure adequate floor stock for pre-rolls and edibles before 3 PM.',
    actions: ['View Sales'],
  },
  {
    id: 'queue-1', type: 'standard', severity: 'INSIGHT', color: '#64A8E0', time: '2h ago',
    title: 'Expected traffic spike: 920 customers today',
    ai: 'Tuesday avg is 780. +18% projected from March Madness campaign. 62% of sales after 4 PM. Consider 40/60 staff split.',
    actions: ['View Sales'],
  },
];

// CEO alerts (aggregated, strategic)
const CEO_ALERTS = [
  {
    id: 'ceo-1', type: 'standard', severity: 'CRITICAL', color: '#E87068', time: '15m ago',
    title: 'Revenue anomaly: 3 MI stores down 15%+ vs forecast',
    ai: 'Ann Arbor (-18%), Morenci (-23%), and Grand Rapids (-15%) are underperforming. MI market saturation increasing — 4 new competitor openings in Q1. Recommend pricing review and targeted campaigns.',
    actions: ['View Details'],
  },
  {
    id: 'ceo-2', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '30m ago',
    title: 'Compliance risk: OH METRC reconciliation overdue at 2 stores',
    ai: 'Columbus and Cleveland stores have pending METRC reconciliations >24h overdue. State deadline is 48h. Escalated to compliance officer.',
    actions: ['View OH Stores'],
  },
  {
    id: 'ceo-3', type: 'standard', severity: 'OPPORTUNITY', color: '#00C27C', time: '1h ago',
    title: 'Brand opportunity: Jeeter sentiment up 34% — 2 stores don\'t carry',
    ai: 'Jeeter is trending across IL and NJ. Morenci MI and Grand Rapids MI don\'t stock Jeeter yet. Estimated incremental revenue: $42K/month if added.',
    actions: ['Draft PO', 'View Data'],
  },
  {
    id: 'ceo-4', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '2h ago',
    title: 'Portfolio inventory: $42K in aging stock (>60 days) across 8 stores',
    ai: 'Highest concentration in MA ($14K) and PA ($11K). Recommend markdown strategy or cross-store redistribution to higher-velocity locations.',
    actions: ['View Breakdown'],
  },
  {
    id: 'ceo-5', type: 'standard', severity: 'INSIGHT', color: '#64A8E0', time: '4h ago',
    title: 'IL margin expanding: 48.2% → 49.1% this quarter',
    ai: 'Pricing optimization in IL is working. If replicated in NJ and OH, projected +$180K in quarterly gross profit across portfolio.',
    actions: ['View Margins'],
  },
];

// VP Retail alerts (comparative, regional)
const VP_ALERTS = [
  {
    id: 'vp-1', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '10m ago',
    title: 'Store ranking: Logan Square +22% vs IL avg, Naperville -18% vs IL avg',
    ai: 'Naperville declining 3rd consecutive week. Basket size down 12%. Staff turnover may be contributing — 2 experienced budtenders left this month.',
    actions: ['View Stores'],
  },
  {
    id: 'vp-2', type: 'standard', severity: 'CRITICAL', color: '#E87068', time: '25m ago',
    title: 'Inventory rebalance: Blue Dream OOS at Logan Square, 22-day supply at Naperville',
    ai: 'Logan Square lost $1,140 in 3 days. Naperville has 89 units (22-day supply). Recommend inter-store transfer of 40 units. METRC transfer manifest ready.',
    actions: ['View Inventory'],
  },
  {
    id: 'vp-3', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '1h ago',
    title: 'Staffing: Schaumburg overtime budget exceeded by 12%',
    ai: 'Overtime hours: 148 vs 132 budget. Primary driver: 2 sick calls not backfilled. Adjacent stores (Naperville, Arlington Heights) have coverage capacity.',
    actions: ['View Sales'],
  },
  {
    id: 'vp-4', type: 'standard', severity: 'OPPORTUNITY', color: '#00C27C', time: '2h ago',
    title: 'Best practice: Wicker Park pre-roll attach rate 40% vs IL avg 22%',
    ai: 'Wicker Park\'s checkout display placement drives 1.8x more pre-roll add-ons. Replicating this at other IL stores could add $24K/month in pre-roll revenue.',
    actions: ['View Details'],
  },
  {
    id: 'vp-5', type: 'standard', severity: 'INSIGHT', color: '#64A8E0', time: '3h ago',
    title: 'Cross-market pricing: Stiiizy Pod priced $10 higher in NJ vs IL',
    ai: 'IL: $45 (12/day avg), NJ: $55 (6/day avg). NJ price elasticity analysis suggests $48 would increase volume to 10/day — net revenue positive.',
    actions: ['View Pricing'],
  },
];

// Regional Manager alerts (operational, state-level)
const REGIONAL_ALERTS = [
  {
    id: 'reg-1', type: 'transfer', severity: 'CRITICAL', color: '#E87068', time: '2m ago',
    title: 'Blue Dream 3.5g — OOS at Logan Square, 45 in vault',
    ai: 'Floor empty for 3 days. $1,140 estimated lost sales. Transfer immediately via METRC.',
    product: 'Blue Dream 3.5g', brand: 'Jeeter', store: 'Logan Square, IL', trackSystem: 'METRC',
    floor: 0, vault: 45, avgWeekly: 38, daysOOS: 3, recQty: 38,
    metrcPkg: '1A4060300003BD35', metrcSrc: 'Storage Vault A', metrcDest: 'Sales Floor',
    img: 'brands/jeeter-baby-churros.webp',
  },
  {
    id: 'reg-2', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '20m ago',
    title: 'Vault-to-floor status: 32 complete, 2 pending across IL',
    ai: 'Naperville: 1 transfer pending (Kiva Gummies, 24 units). Springfield: 1 transfer pending (Stiiizy Pods, 18 units). Both within METRC transfer window.',
    actions: ['View All'],
  },
  {
    id: 'reg-3', type: 'standard', severity: 'OPPORTUNITY', color: '#00C27C', time: '45m ago',
    title: 'Delivery arriving: 14 packages expected at Springfield today',
    ai: '42 SKUs from DreamFields (Jeeter) arriving 2:30 PM. Includes 48x Baby Jeeter Churros, 72x Infused Pre-Rolls. Receiving dock B. METRC manifest verified.',
    actions: ['View Inventory'],
  },
  {
    id: 'reg-4', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '1h ago',
    title: 'Cash reconciliation: 2 flags from last night close',
    ai: 'Schaumburg: $47 over (drawer 3). Arlington Heights: $12 short (drawer 1). Both within tolerance but trend at Schaumburg is 3 overs in 5 days.',
    actions: ['View Sales'],
  },
  {
    id: 'reg-5', type: 'standard', severity: 'INSIGHT', color: '#64A8E0', time: '2h ago',
    title: 'Springfield revenue: +18% WoW, basket size up $12',
    ai: 'New checkout display and staff training showing results. Consider sharing playbook with other IL stores. Springfield now #2 in state behind Logan Square.',
    actions: ['View Report'],
  },
];

// Compliance Officer alerts (risk-focused, cross-state)
const COMPLIANCE_ALERTS = [
  {
    id: 'comp-1', type: 'standard', severity: 'CRITICAL', color: '#E87068', time: '5m ago',
    title: 'OH METRC reconciliation overdue at Columbus (28h)',
    ai: 'State requires reconciliation within 48h. Columbus last synced 28h ago. 4 packages pending verification. Auto-reminder sent to store manager.',
    actions: ['View OH Stores'],
  },
  {
    id: 'comp-2', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '12m ago',
    title: 'NJ METRC: Newark sync delay cleared (12 min, no data loss)',
    ai: 'METRC API timeout at 8:42 AM. Retried at 8:54 AM. All 4 NJ stores now green. No data loss detected.',
    actions: ['View NJ Stores'],
  },
  {
    id: 'comp-3', type: 'standard', severity: 'WARNING', color: '#D4A03A', time: '1h ago',
    title: '3 product batches expiring within 30 days across 3 states',
    ai: 'Ozone Cart batch #2847 (14 units, IL), Camino Gummies batch #1923 (8 units, NJ), Simply Herb batch #3401 (22 units, MA). METRC destruction events required.',
    actions: ['View Inventory'],
  },
  {
    id: 'comp-4', type: 'standard', severity: 'OPPORTUNITY', color: '#00C27C', time: '2h ago',
    title: 'State sync status: IL METRC ✓, NJ METRC ✓, OH METRC ⚠, MA METRC ✓, MD METRC ✓, MI METRC ✓, PA Leaf Data ✓',
    ai: '38/39 stores fully synced. Only Columbus OH has a pending item. All other states green. Average sync latency: 3.2 minutes.',
    actions: ['View All Stores'],
  },
  {
    id: 'comp-5', type: 'standard', severity: 'INSIGHT', color: '#64A8E0', time: '4h ago',
    title: 'License tracker: IL renewal due Apr 15, MD renewal due Jun 30',
    ai: 'IL renewal paperwork 80% complete — pending final inspection schedule. MD renewal process not yet started (120 days out). All other licenses current.',
    actions: ['View Details'],
  },
  {
    id: 'comp-6', type: 'standard', severity: 'INSIGHT', color: '#B598E8', time: '6h ago',
    title: 'Regulatory update: OH proposing new inventory audit frequency',
    ai: 'Ohio Cannabis Control Board draft rule would increase audit frequency from quarterly to monthly for stores >$500K/month. 4 of our 6 OH stores would be affected.',
    actions: ['View OH Stores'],
  },
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
      <div key={a.id} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors" style={done ? { background: 'rgba(0,194,124,0.03)' } : undefined}>
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
      <div key={a.id} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
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
          <button onClick={() => setConfirmTransfer('bulk')} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-accent-red bg-accent-red/10 border border-[#E87068]/20 hover:bg-accent-red/15 transition-colors">
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

// ─── CROSS-STORE INTELLIGENCE ─── //

function CrossStoreIntelligence() {
  const { showCrossStore } = usePersona();
  if (!showCrossStore) return null;

  const rebalanceItems = [
    { product: 'Blue Dream 3.5g', from: 'Naperville, IL', fromQty: 89, fromDays: 22, to: 'Logan Square, IL', toQty: 0, toDays: 0, recTransfer: 40, estRevRecovery: '$1,140/wk' },
    { product: 'Wyld Elderberry Gummies', from: 'Springfield, IL', fromQty: 44, fromDays: 18, to: 'River North, IL', toQty: 0, toDays: 0, recTransfer: 22, estRevRecovery: '$396/wk' },
    { product: 'Stiiizy Live Resin Pod', from: 'Boston, MA', fromQty: 62, fromDays: 28, to: 'Worcester, MA', toQty: 3, toDays: 1, recTransfer: 24, estRevRecovery: '$720/wk' },
  ];

  const bestPractices = [
    { store: 'Wicker Park, IL', metric: 'Pre-roll attach rate', value: '40%', avg: '22%', insight: 'Checkout display placement drives 1.8x more pre-roll add-ons', action: 'Replicate at 8 IL stores' },
    { store: 'Fort Lee, NJ', metric: 'Online order pickup time', value: '4.2 min', avg: '8.1 min', insight: 'Dedicated pickup counter reduces wait by 48%', action: 'Deploy at high-volume stores' },
  ];

  const crossPricing = [
    { product: 'Stiiizy Pod 1g', ilPrice: 45, ilVol: 12, njPrice: 55, njVol: 6, optimalNJ: 48, projVol: 10, projLift: '+$840/wk' },
    { product: 'Cookies Gary Payton', ilPrice: 52, ilVol: 8, njPrice: 58, njVol: 4, optimalNJ: 54, projVol: 6, projLift: '+$360/wk' },
  ];

  return (
    <NexusTile className="animate-fade-up" style={{ animationDelay: '350ms' }}>
      <div className="px-5 py-3 flex justify-between items-center border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-accent-purple" />
          <span className="text-xs font-semibold text-text-primary">Cross-Store Intelligence</span>
          <span className="text-[9px] px-1.5 py-px rounded-full bg-accent-purple/10 text-accent-purple font-bold">AI</span>
        </div>
      </div>
      <div className="p-5 space-y-5">
        {/* Inventory Rebalancing */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-3.5 h-3.5 text-accent-blue" />
            <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">Inventory Rebalancing</span>
          </div>
          <div className="space-y-2">
            {rebalanceItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-bg px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-text-primary">{item.product}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-accent-red">{item.to}: {item.toQty} units ({item.toDays}d supply)</span>
                    <span className="text-text-muted">←</span>
                    <span className="text-accent-green">{item.from}: {item.fromQty} units ({item.fromDays}d supply)</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-accent-green font-semibold">{item.estRevRecovery}</p>
                  <button onClick={() => navigate('/agents/bridge')} className="mt-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-white bg-accent-blue hover:brightness-110 transition-colors">
                    Transfer {item.recTransfer}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Practice Sharing */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent-green" />
            <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">Best Practice Sharing</span>
          </div>
          <div className="space-y-2">
            {bestPractices.map((bp, i) => (
              <div key={i} className="rounded-xl border border-surface-border bg-surface-bg px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-text-primary">{bp.store} — {bp.metric}: <span className="text-accent-green font-bold">{bp.value}</span></span>
                  <span className="text-[10px] text-text-muted">vs avg {bp.avg}</span>
                </div>
                <p className="text-[10px] text-text-secondary">{bp.insight}</p>
                <button onClick={() => navigate('/agents/bridge')} className="mt-2 px-2.5 py-1 rounded-md text-[10px] font-semibold text-accent-green bg-accent-green/10 border border-accent-green/20 hover:bg-accent-green/20 transition-colors">
                  {bp.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Market Pricing */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-3.5 h-3.5 text-accent-gold" />
            <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">Cross-Market Pricing</span>
          </div>
          <div className="space-y-2">
            {crossPricing.map((cp, i) => (
              <div key={i} className="rounded-xl border border-surface-border bg-surface-bg px-4 py-3">
                <p className="text-[12px] font-medium text-text-primary mb-1">{cp.product}</p>
                <div className="flex items-center gap-4 text-[10px] flex-wrap">
                  <span className="text-text-secondary">IL: ${cp.ilPrice} ({cp.ilVol}/day)</span>
                  <span className="text-text-secondary">NJ: ${cp.njPrice} ({cp.njVol}/day)</span>
                  <span className="text-accent-gold font-semibold">Optimal NJ: ${cp.optimalNJ} → {cp.projVol}/day</span>
                  <span className="text-accent-green font-bold">{cp.projLift}</span>
                </div>
                <button onClick={() => navigate('/agents/bridge')} className="mt-2 px-2.5 py-1 rounded-md text-[10px] font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors">
                  Optimize Price
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
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
                    className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-bg px-2.5 py-2 hover:bg-white/[0.03] transition-colors cursor-pointer"
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
                    className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-surface-bg px-3 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
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

const COMPLIANCE_ITEMS = [
  { id: 'c1', severity: 'URGENT', color: '#E87068', state: 'OH', title: 'METRC reconciliation overdue — Columbus', detail: '28h behind deadline. 4 packages pending reconciliation.', query: 'Show me the OH METRC reconciliation status' },
  { id: 'c2', severity: 'ACTION', color: '#D4A03A', state: 'IL/NJ/MA', title: '3 product batches expiring within 30 days', detail: 'Batch #2847 (IL), #1923 (NJ), #3401 (MA) — METRC destruction events required.', query: 'Which product batches are expiring soon?' },
  { id: 'c3', severity: 'ACTION', color: '#D4A03A', state: 'All', title: '14 packages awaiting METRC tags', detail: 'Avg tagging time 12 min. 3 packages over 2 hours old.', query: 'Show me the METRC package queue' },
  { id: 'c4', severity: 'REVIEW', color: '#64A8E0', state: 'IL', title: 'License renewal due Apr 15 — 28 days', detail: '80% of paperwork complete. Missing: updated floor plan, staff roster.', query: 'What regulatory changes and license renewals are coming up?' },
  { id: 'c5', severity: 'REVIEW', color: '#64A8E0', state: 'IL', title: 'New edible potency testing rules — Apr 1', detail: 'Vendor intake process needs updating before enforcement date.', query: 'What regulatory changes and license renewals are coming up?' },
  { id: 'c6', severity: 'REVIEW', color: '#64A8E0', state: 'PA', title: 'MJ Freeway API v3 migration — May 1', detail: 'Dev team integration update required. Current API deprecated.', query: 'Show me compliance status for PA stores' },
  { id: 'c7', severity: 'REVIEW', color: '#64A8E0', state: 'MD', title: 'License renewal due Jun 30 — not started', detail: 'Renewal paperwork has not been initiated. 104 days remaining.', query: 'What regulatory changes and license renewals are coming up?' },
  { id: 'c8', severity: 'REVIEW', color: '#64A8E0', state: 'OH', title: 'OH proposing monthly audit frequency', detail: 'For stores >$500K/mo. Currently quarterly. Public comment period open.', query: 'What regulatory changes and license renewals are coming up?' },
];

function ComplianceCommandCenter() {
  const urgentCount = COMPLIANCE_ITEMS.filter(i => i.severity === 'URGENT').length;
  const actionCount = COMPLIANCE_ITEMS.filter(i => i.severity === 'ACTION').length;

  return (
    <NexusTile className="animate-fade-up" style={{ animationDelay: '350ms' }}>
      {/* Header */}
      <div className="px-5 py-3 flex justify-between items-center border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent-blue" />
          <span className="text-xs font-semibold text-text-primary">Compliance &amp; Regulatory</span>
          <span className="text-[10px] text-text-muted">{COMPLIANCE_ITEMS.length} items</span>
        </div>
        <div className="flex items-center gap-2">
          {urgentCount > 0 && <span className="px-1.5 py-px rounded-full text-[8px] font-bold bg-accent-red/15 text-accent-red">{urgentCount} URGENT</span>}
          {actionCount > 0 && <span className="px-1.5 py-px rounded-full text-[8px] font-bold bg-accent-gold/15 text-accent-gold">{actionCount} ACTION</span>}
        </div>
      </div>

      {/* Item list */}
      <div className="divide-y divide-surface-border/60 max-h-[340px] overflow-y-auto">
        {COMPLIANCE_ITEMS.map(item => (
          <div key={item.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate('/agents/bridge')}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-[8px] font-bold px-1.5 py-px rounded-full" style={{ color: item.color, background: `${item.color}14` }}>
                  {item.severity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-text-primary">{item.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] px-1.5 py-px rounded font-bold text-text-muted bg-surface-hover">{item.state}</span>
                  <span className="text-[10px] text-text-muted">{item.detail}</span>
                </div>
              </div>
              <ChevronRight size={12} className="text-surface-border flex-shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </NexusTile>
  );
}

// ─── MAIN v3 LAYOUT ─── //

export default function NexusHome() {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="space-y-5">
      {/* 1. AI Morning Briefing */}
      <MorningBriefing />

      {/* 2. Nexus Command Bar */}
      <NexusCommandBar onAction={() => navigate('/agents/bridge')} />

      {/* 3. Smart Alerts (includes vault-to-floor transfers) */}
      <SmartAlertsFeed onAction={(q) => navigate('/agents/bridge')} />

      {/* 4. Store Health Matrix */}
      <StoreHealthMatrix />

      {/* 4.5 Compliance + Live Activity — side by side */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ComplianceCommandCenter />
        <LiveTicker />
      </div>

      {/* 5. Cross-Store Intelligence (CEO/VP/Regional only) */}
      <CrossStoreIntelligence />

      {/* 7. Sales Reporting — kept from v2 */}
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-[1.5px] mt-1">Performance</p>
      <SalesReportingTile />

      {/* 8. Pricing */}
      <PricingTile />

      {/* Show more toggle */}
      {!showMore && (
        <button onClick={() => setShowMore(true)} className="w-full py-2.5 rounded-xl border border-surface-border bg-surface-card text-xs text-text-secondary hover:text-text-primary hover:brightness-110 transition-all flex items-center justify-center gap-2">
          <ChevronDown className="w-3.5 h-3.5" /> More channels & details
        </button>
      )}

      {showMore && (
        <div className="grid gap-5 lg:grid-cols-2 stagger-grid">
          <UnifiedPipelineTile />
          <InventoryTile />
        </div>
      )}
    </div>
  );
}
