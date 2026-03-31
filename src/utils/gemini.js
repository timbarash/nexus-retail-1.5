/**
 * Gemini API Service — shared LLM client for all agents
 *
 * Calls a Cloudflare Worker proxy that holds the API key server-side.
 * Zero API keys in client-side code.
 */

import { brandImg } from './helpers';

const PROXY_URL = 'https://sa-gemini-proxy.dutchie-dev.workers.dev';

/**
 * Call Gemini with a system instruction and user prompt.
 * Returns the text response or null on failure.
 */
export async function callGemini({ system, prompt, temperature = 0.7, maxTokens = 1024 }) {
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: system ? { parts: [{ text: system }] } : undefined,
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Gemini] API error:', res.status, err);
      return null;
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = parts?.find(p => !p.thought)?.text || parts?.[0]?.text;
    return text || null;
  } catch (err) {
    console.error('[Gemini] Network error:', err);
    return null;
  }
}

/**
 * Call Gemini and parse JSON from the response.
 * Returns parsed object or null on failure.
 */
export async function callGeminiJSON({ system, prompt, temperature = 0.4, maxTokens = 2048 }) {
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: system ? { parts: [{ text: system }] } : undefined,
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Gemini] API error:', res.status, err);
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.find(p => !p.thought)?.text
      || data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const cleaned = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[Gemini] JSON parse/network error:', err);
    return null;
  }
}

/**
 * Check whether the Gemini proxy is available.
 */
export function isGeminiAvailable() {
  return true;
}

/* ─── Nexus Chat ────────────────────────────────────────── */

const CUSTOMER_BRIDGE_SYSTEM = `You are Nexus Chat, an expert B2B support agent for Dutchie — the leading cannabis dispensary technology platform. You help dispensary operators with questions about Dutchie's products: Ecommerce (online ordering, menus, storefronts), POS (point-of-sale, registers, hardware), Payments (Dutchie Pay, ACH, fees), Compliance (METRC, state reporting, purchase limits), Integrations (Leafly, Weedmaps, loyalty platforms, accounting), Marketing (promotions, SMS, email, loyalty programs), and Operations (delivery, inventory, multi-location).

Rules:
- Be conversational and knowledgeable — like a senior support agent who knows the product inside and out.
- Give direct, actionable answers. Lead with the answer, then provide steps if needed.
- When troubleshooting, be empathetic and provide numbered steps.
- Keep responses concise (3-6 sentences for simple questions, longer for how-to guides).
- Reference specific Dutchie Admin navigation paths (e.g., "Go to Settings > Delivery").
- Do NOT make up features that don't exist. Stick to what's in the provided knowledge base context.
- If the knowledge base context doesn't cover the question, say so honestly and suggest contacting support.
- Never use markdown headers (#). Use plain text with line breaks.`;

export async function generateBridgeResponse(query, kbArticles) {
  const kbContext = kbArticles.map(a =>
    `[${a.id}] ${a.title} (${a.category})\n${a.content}`
  ).join('\n\n---\n\n');

  const prompt = `Knowledge base articles for context:\n\n${kbContext}\n\n---\n\nCustomer question: "${query}"\n\nProvide a helpful, conversational answer grounded in the knowledge base articles above. If the question is about troubleshooting, include numbered steps. Keep it concise but thorough.`;

  return callGemini({ system: CUSTOMER_BRIDGE_SYSTEM, prompt, temperature: 0.5, maxTokens: 800 });
}

/* ─── Marketing Agent ────────────────────────────────────────── */

const MARKETING_SYSTEM = `You are the Dutchie Marketing AI Agent. You help cannabis dispensary operators create, optimize, and analyze marketing campaigns. You have deep expertise in cannabis retail marketing, customer segmentation, SMS/email campaigns, loyalty programs, and promotional strategy.

Rules:
- Be creative but data-driven. Reference specific metrics and projections.
- Understand cannabis marketing compliance (age gating, opt-in requirements, state advertising rules).
- Suggest specific copy, subject lines, and CTAs when asked.
- Keep responses conversational and actionable.
- Never use markdown headers (#). Use plain text with line breaks.`;

const MARKETING_CAMPAIGN_SYSTEM = `You are the Dutchie Marketing AI Agent. Generate a complete marketing campaign plan as JSON for a cannabis dispensary called Ascend.

CRITICAL: The campaign MUST be specifically about the brand, product, or theme the user requests. If they ask for a Wyld campaign, feature Wyld products. If they ask for edibles, feature edible products. If they ask for STIIIZY, feature STIIIZY products. NEVER default to Jeeter unless the user specifically asks for Jeeter. The title, subtitle, featuredProducts, content, smsMessages, and all campaign details must reflect the user's actual request.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation. The JSON must match this exact schema:
{
  "workflowType": "product_launch | re_engagement | automated_flow | flash_sale | seasonal",
  "title": "Campaign title (short, punchy)",
  "subtitle": "One-line campaign description",
  "heroTag": "Category tag like 'Product Launch', 'Flash Sale', 'Seasonal', 'Re-Engagement', 'Event'",
  "icon": "Star | Heart | Cake | Zap | Calendar | Package | Gift | Megaphone | ShoppingBag | Tag | Sparkles | Target",
  "accentFrom": "Primary hex color for the campaign theme gradient",
  "accentTo": "Secondary hex color for the campaign theme gradient",
  "audience": {
    "size": "Estimated reach as string like '8,400'",
    "description": "1-2 sentence audience description",
    "segments": [
      { "name": "Segment name", "count": "Size as string", "desc": "Short description" }
    ]
  },
  "channels": [
    { "name": "SMS or Email or Push", "icon": "Smartphone | Mail | Bell", "reach": "Number as string", "rate": "Expected rate like '92%'", "metric": "open rate or tap rate", "cost": "Cost per msg" }
  ],
  "content": {
    "headline": "Email/SMS headline",
    "preheader": "Email preheader text",
    "body": "2-3 sentence campaign message body",
    "cta": "Call to action button text",
    "smsPreview": "Full SMS message text (under 160 chars)",
    "offer": "The promotional offer",
    "finePrint": "Legal disclaimer"
  },
  "smsMessages": ["First SMS bubble text", "Reply STOP to opt out"],
  "schedule": {
    "launch": "Launch date/time",
    "duration": "Campaign duration",
    "optimalSend": "Send time strategy",
    "followUp": "Follow-up strategy"
  },
  "projections": {
    "revenue": "Estimated revenue range",
    "orders": "Estimated order range",
    "roi": "Projected ROI like '5.2x'",
    "aov": "Average order value",
    "redemptionRate": "Expected redemption rate",
    "reactivated": "Estimated reactivations (optional)"
  },
  "compliance": [
    { "label": "Age gate verified (21+)", "status": "pass" },
    { "label": "Opt-in consent validated", "status": "pass" },
    { "label": "State cannabis advertising rules", "status": "pass" },
    { "label": "Disclaimer included", "status": "pass" },
    { "label": "Unsubscribe mechanism present", "status": "pass" }
  ],
  "abTests": [
    { "variant": "A", "subject": "Subject line variant A", "split": 50 },
    { "variant": "B", "subject": "Subject line variant B", "split": 50 }
  ],
  "featuredProducts": [
    { "name": "Product name", "type": "Product type", "price": "$XX.XX", "badgeText": "BEST SELLER or NEW or POPULAR", "badgeColor": "#hex", "category": "Product category", "strain": "Strain name (optional)", "thc": "THC percentage (optional)" }
  ],
  "personalizedProducts": [
    { "name": "Group name", "items": ["Product 1", "Product 2", "Product 3"] }
  ],
  "tierRewards": [
    { "tier": "Standard", "reward": "Free Pre-Roll", "discount": "15% off entire order", "color": "#hex" }
  ],
  "locationTargeting": [
    { "name": "Location name", "id": "location-id", "count": "customer count string" }
  ],
  "budget": {
    "totalCost": "$XXX.XX",
    "costPerConversion": "$X.XX"
  }
}

WORKFLOW TYPE RULES:
- product_launch: Always include featuredProducts (3-5 products with category, strain, thc). Include smsMessages.
- re_engagement: Always include personalizedProducts (2 groups). Include escalating offer in schedule.followUp.
- automated_flow: Always include tierRewards (3 tiers with color). Audience size should be per-month format.
- flash_sale: Always include featuredProducts (3-5 products). Emphasize urgency in content.
- seasonal: Always include featuredProducts (3-5 products). Include seasonal theme in content.

For product_launch and flash_sale, include detailed product info with badgeText, badgeColor, category, strain, and thc.
For re_engagement, include personalizedProducts with "Based on your history" and "New since you left" groups.
For automated_flow, include tierRewards with Standard/Gold/VIP tiers.

Available brands: Jeeter, STIIIZY, Kiva, Raw Garden, Cookies, Alien Labs, Wyld, PLUS
Store has ~68,000 customers, 39 locations across 7 states (IL, MD, MA, MI, NJ, OH, PA).
Product categories: Flower, Pre-Rolls, Edibles, Vape Cartridges, Concentrates, Topicals, Tinctures, Beverages.`;

export async function generateMarketingResponse(query, campaignContext = '') {
  const prompt = campaignContext
    ? `Campaign context:\n${campaignContext}\n\n---\n\nUser request: "${query}"\n\nProvide a helpful, creative marketing response.`
    : `User request: "${query}"\n\nProvide a helpful, creative marketing response for a cannabis dispensary.`;

  return callGemini({ system: MARKETING_SYSTEM, prompt, temperature: 0.7, maxTokens: 800 });
}

function normalizeMarketingPlan(raw) {
  if (!raw) return null;
  const plan = { ...raw };

  // Default workflowType
  if (!plan.workflowType) plan.workflowType = 'product_launch';

  // Ensure title and subtitle
  if (!plan.title) plan.title = 'Marketing Campaign';
  if (!plan.subtitle) plan.subtitle = 'AI-generated campaign plan';
  if (!plan.heroTag) plan.heroTag = plan.workflowType === 'flash_sale' ? 'Flash Sale' : plan.workflowType === 're_engagement' ? 'Re-Engagement' : plan.workflowType === 'automated_flow' ? 'Automated Flow' : plan.workflowType === 'seasonal' ? 'Seasonal' : 'Product Launch';

  // Ensure accentFrom/accentTo exist (fall back from accentColor)
  if (!plan.accentFrom) plan.accentFrom = plan.accentColor || '#0EA5E9';
  if (!plan.accentTo) plan.accentTo = plan.accentFrom;

  // Ensure icon is a string
  if (!plan.icon) plan.icon = 'Sparkles';

  // ── Ensure audience is a full object ──
  if (!plan.audience || typeof plan.audience !== 'object') {
    plan.audience = {};
  }
  plan.audience.size = plan.audience.size || '68,000';
  plan.audience.description = plan.audience.description || 'All active customers in our database';
  if (!Array.isArray(plan.audience.segments) || plan.audience.segments.length === 0) {
    plan.audience.segments = [
      { name: 'Active Customers', count: '12,000', desc: 'Purchased in last 90 days' },
      { name: 'VIP Members', count: '3,200', desc: 'Top 20% by lifetime spend' },
      { name: 'New Customers', count: '2,800', desc: 'First purchase in last 30 days' },
    ];
  }
  // Ensure each segment has all fields
  plan.audience.segments = plan.audience.segments.map((s, i) => ({
    name: s.name || `Segment ${i + 1}`,
    count: s.count || '—',
    desc: s.desc || s.description || '',
  }));

  // ── Ensure channels is a full array ──
  if (!Array.isArray(plan.channels) || plan.channels.length === 0) {
    plan.channels = [
      { name: 'SMS', icon: 'Smartphone', reach: '8,400', rate: '92%', metric: 'open rate', cost: '$0.015/msg' },
      { name: 'Email', icon: 'Mail', reach: '14,200', rate: '38%', metric: 'open rate', cost: '$0.003/msg' },
      { name: 'Push', icon: 'Bell', reach: '6,100', rate: '12%', metric: 'tap rate', cost: 'Free' },
    ];
  }
  plan.channels = plan.channels.map(ch => ({
    name: ch.name || 'Channel',
    icon: ch.icon || 'Mail',
    reach: ch.reach || '—',
    rate: ch.rate || '—',
    metric: ch.metric || 'open rate',
    cost: ch.cost || '—',
  }));

  // ── Ensure content is a full object ──
  if (!plan.content || typeof plan.content !== 'object') {
    plan.content = {};
  }
  plan.content.headline = plan.content.headline || plan.title;
  plan.content.preheader = plan.content.preheader || plan.subtitle;
  plan.content.body = plan.content.body || 'Check out our latest offerings at Ascend. Visit us in-store or order online for the best selection in your area.';
  plan.content.cta = plan.content.cta || 'Shop Now';
  plan.content.smsPreview = plan.content.smsPreview || 'Check out our latest deals at Ascend! Shop now → ascendwellness.com';
  plan.content.offer = plan.content.offer || 'Exclusive offer for our valued customers';
  plan.content.finePrint = plan.content.finePrint || 'Must be 21+. Valid at all Ascend locations. Cannot be combined with other offers. While supplies last.';

  // ── Ensure schedule is a full object ──
  if (!plan.schedule || typeof plan.schedule !== 'object') {
    plan.schedule = {};
  }
  plan.schedule.launch = plan.schedule.launch || 'Tomorrow, 10:00 AM EST';
  plan.schedule.duration = plan.schedule.duration || '7 days';
  plan.schedule.optimalSend = plan.schedule.optimalSend || 'AI-optimized per customer timezone';
  plan.schedule.followUp = plan.schedule.followUp || 'Automated follow-up after 48 hours to non-openers';

  // ── Ensure projections is a full object ──
  if (!plan.projections || typeof plan.projections !== 'object') {
    plan.projections = {};
  }
  plan.projections.revenue = plan.projections.revenue || '$4,200 – $6,800';
  plan.projections.orders = plan.projections.orders || '120 – 180';
  plan.projections.roi = plan.projections.roi || '4.2x';
  plan.projections.aov = plan.projections.aov || '$52';
  plan.projections.redemptionRate = plan.projections.redemptionRate || '8.4%';
  if (!plan.projections.reactivated) plan.projections.reactivated = '—';

  // Derive smsMessages from smsPreview if missing
  if (!plan.smsMessages || !Array.isArray(plan.smsMessages) || plan.smsMessages.length === 0) {
    plan.smsMessages = [plan.content.smsPreview, 'Reply STOP to opt out'];
  }

  // Normalize compliance items to { label, status } objects
  if (Array.isArray(plan.compliance)) {
    plan.compliance = plan.compliance.map(item =>
      typeof item === 'string' ? { label: item, status: 'pass' } : { label: item.label || String(item), status: item.status || 'pass' }
    );
  } else {
    plan.compliance = [
      { label: 'Age gate verified (21+)', status: 'pass' },
      { label: 'Opt-in consent validated', status: 'pass' },
      { label: 'State cannabis advertising rules', status: 'pass' },
      { label: 'Disclaimer included', status: 'pass' },
      { label: 'Unsubscribe mechanism present', status: 'pass' },
    ];
  }

  // Normalize abTests (accept both abTest and abTests)
  if (!plan.abTests && plan.abTest) {
    plan.abTests = plan.abTest;
    delete plan.abTest;
  }
  if (!Array.isArray(plan.abTests)) plan.abTests = [];

  // Normalize locationTargeting to array of objects
  if (Array.isArray(plan.locationTargeting)) {
    plan.locationTargeting = plan.locationTargeting.map((loc) => {
      if (typeof loc === 'string') {
        return { name: `Ascend — ${loc}`, id: loc.toLowerCase().replace(/\s+/g, '-'), count: '—' };
      }
      return { name: loc.name || 'Location', id: loc.id || loc.name?.toLowerCase().replace(/\s+/g, '-') || 'loc', count: loc.count || '—' };
    });
  } else {
    plan.locationTargeting = [
      { name: 'Ascend — Logan Square', id: 'logan-square', count: '4,200' },
      { name: 'Ascend — Fort Lee', id: 'fort-lee', count: '3,890' },
      { name: 'Ascend — Boston', id: 'boston', count: '2,640' },
      { name: 'Ascend — Detroit', id: 'detroit', count: '2,117' },
    ];
  }

  // Resolve product images from available assets based on brand/name keywords
  const PRODUCT_IMAGE_MAP = [
    { keywords: ['jeeter', 'churros'], image: brandImg('/brands/jeeter-baby-churros.webp') },
    { keywords: ['jeeter', 'juice'], image: brandImg('/brands/jeeter-juice.webp') },
    { keywords: ['jeeter', 'honeydew'], image: brandImg('/brands/jeeter-baby-honeydew.webp') },
    { keywords: ['jeeter', 'horchata'], image: brandImg('/brands/jeeter-xl-horchata.webp') },
    { keywords: ['jeeter', 'gelato'], image: brandImg('/brands/jeeter-baby-gelato.webp') },
    { keywords: ['jeeter', 'cannon'], image: brandImg('/brands/jeeter-cannon.webp') },
    { keywords: ['jeeter', 'vape'], image: brandImg('/brands/jeeter-vape.png') },
    { keywords: ['jeeter'], image: brandImg('/brands/jeeter-baby-churros.webp') },
    { keywords: ['wyld', 'elderberry'], image: brandImg('/brands/wyld-elderberry.png') },
    { keywords: ['wyld', 'raspberry'], image: brandImg('/brands/wyld-raspberry.png') },
    { keywords: ['wyld'], image: brandImg('/brands/wyld-elderberry.png') },
    { keywords: ['stiiizy'], image: brandImg('/brands/stiiizy-pods.png') },
    { keywords: ['kiva', 'camino'], image: brandImg('/brands/kiva-camino.jpg') },
    { keywords: ['kiva'], image: brandImg('/brands/kiva-camino.jpg') },
    { keywords: ['cookies', 'gary payton'], image: brandImg('/brands/cookies-gary-payton.png') },
    { keywords: ['cookies'], image: brandImg('/brands/cookies-gary-payton.png') },
    { keywords: ['raw garden'], image: brandImg('/brands/raw-garden-cart.webp') },
    { keywords: ['alien labs', 'xeno'], image: brandImg('/brands/alien-xeno.png') },
    { keywords: ['alien labs'], image: brandImg('/brands/alien-xeno.png') },
    { keywords: ['plus', 'gummies'], image: brandImg('/brands/plus-gummies.jpg') },
    { keywords: ['plus'], image: brandImg('/brands/plus-gummies.jpg') },
    { keywords: ['papa', 'barkley'], image: brandImg('/brands/papa-barkley-balm.jpg') },
  ];

  function resolveProductImage(product) {
    if (product.image) return product.image;
    const text = `${product.name || ''} ${product.brand || ''} ${product.strain || ''}`.toLowerCase();
    for (const entry of PRODUCT_IMAGE_MAP) {
      if (entry.keywords.every(kw => text.includes(kw))) return entry.image;
    }
    return null;
  }

  // Resolve heroImage from campaign title/subtitle if not set
  if (!plan.heroImage) {
    const titleText = `${plan.title || ''} ${plan.subtitle || ''}`.toLowerCase();
    for (const entry of PRODUCT_IMAGE_MAP) {
      if (entry.keywords.every(kw => titleText.includes(kw))) {
        plan.heroImage = entry.image;
        break;
      }
    }
  }

  // Normalize featuredProducts
  if (Array.isArray(plan.featuredProducts)) {
    plan.featuredProducts = plan.featuredProducts.map(p => ({
      ...p,
      name: p.name || 'Product',
      type: p.type || '',
      price: p.price || '',
      badgeText: p.badgeText || p.badge || '',
      badgeColor: p.badgeColor || plan.accentFrom,
      image: resolveProductImage(p),
    }));
  }

  // Normalize personalizedProducts
  if (Array.isArray(plan.personalizedProducts)) {
    plan.personalizedProducts = plan.personalizedProducts.map(g => ({
      name: g.name || 'Recommendations',
      items: Array.isArray(g.items) ? g.items : [],
    }));
  }

  // Normalize tierRewards
  if (Array.isArray(plan.tierRewards)) {
    const tierColors = ['#9333EA', '#D4A03A', '#EC4899'];
    plan.tierRewards = plan.tierRewards.map((t, i) => ({
      tier: t.tier || `Tier ${i + 1}`,
      reward: t.reward || 'Special Reward',
      discount: t.discount || '10% off',
      color: t.color || tierColors[i % tierColors.length],
    }));
  }

  // Ensure budget exists
  if (!plan.budget || typeof plan.budget !== 'object') {
    plan.budget = { totalCost: '$186.40', costPerConversion: '$0.48' };
  }
  plan.budget.totalCost = plan.budget.totalCost || '$186.40';
  plan.budget.costPerConversion = plan.budget.costPerConversion || '$0.48';

  return plan;
}

export async function generateMarketingCampaignPlan(query) {
  const prompt = `User request: "${query}"\n\nCreate a complete marketing campaign plan that is specifically tailored to the above request. The campaign title, featured products, messaging, and all details MUST match what the user asked for — do NOT substitute a different brand or product. Return ONLY the JSON object, nothing else.`;
  const raw = await callGeminiJSON({ system: MARKETING_CAMPAIGN_SYSTEM, prompt, temperature: 0.6, maxTokens: 3072 });
  return normalizeMarketingPlan(raw);
}

/* ─── Connect Agent ──────────────────────────────────────────── */

const CONNECT_SYSTEM = `You are the Dutchie Connect Agent — a purchasing and inventory intelligence assistant for cannabis dispensaries. You help operators make smart purchasing decisions: restocking out-of-stock items, discovering trending new products, optimizing order quantities, negotiating with suppliers, and reducing dead stock.

Rules:
- Be analytical and data-driven. Reference sales velocity, margins, lead times, and market trends.
- Provide specific, actionable recommendations with numbers.
- Understand cannabis industry supply chain (brands like Jeeter, STIIIZY, Kiva, Raw Garden, Cookies, Alien Labs, Wyld, PLUS).
- Keep responses conversational and concise.
- Never use markdown headers (#). Use plain text with line breaks.`;

const CONNECT_ANALYSIS_SYSTEM = `You are the Dutchie Connect purchasing intelligence agent. Generate a structured purchasing analysis as JSON for Ascend dispensary.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.

First, classify the user's intent into one of these workflowTypes:
- "reorder": restocking out-of-stock or low-stock items
- "explore": discovering new products, trending items, catalog expansion
- "recommendations": general purchasing optimization, margin analysis, vendor comparison, forecasting

Then generate JSON matching the schema for that workflowType:

FOR workflowType "reorder":
{
  "workflowType": "reorder",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "lostRevenue": "$X,XXX/week",
  "products": [
    {
      "id": "unique-id",
      "brand": "Brand name",
      "name": "Full product name",
      "type": "Product type · size",
      "thc": "THC percentage",
      "lastPrice": "$XX.XX",
      "avgWeeklySales": 42,
      "daysOutOfStock": 3,
      "urgency": "high | medium | low",
      "supplier": "Supplier name",
      "leadTime": "X-Y days",
      "brandColor": "#hex",
      "recommendedQty": 36
    }
  ],
  "recommendations": [
    { "brand": "Brand", "product": "Product name", "qty": 36, "reason": "Why to reorder", "cost": "$XXX.XX" }
  ]
}

FOR workflowType "explore":
{
  "workflowType": "explore",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "products": [
    {
      "id": "unique-id",
      "brand": "Brand name",
      "name": "Full product name",
      "type": "Product type · size",
      "thc": "THC percentage",
      "wholesalePrice": "$XX.XX",
      "suggestedRetail": "$XX.XX",
      "margin": "XX%",
      "trending": true,
      "rating": 4.8,
      "brandColor": "#hex",
      "description": "Why this product is worth stocking"
    }
  ],
  "brandPerformance": [
    { "name": "Brand", "revenue": "$XX,XXX/mo", "growth": "+XX%", "color": "#hex", "pct": 85 }
  ],
  "categoryGaps": [
    { "category": "Category name", "gap": "XX% under-indexed", "opportunity": "+$X,XXX/mo", "color": "#hex" }
  ]
}

FOR workflowType "recommendations":
{
  "workflowType": "recommendations",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "metrics": [
    { "label": "Metric name", "value": "Current value", "change": "+X% or -$XXX", "iconName": "PackageX | CircleDollarSign | RefreshCw | TrendingDown" }
  ],
  "actionItems": [
    { "action": "Specific action to take", "reason": "Data-driven reasoning", "priority": "High | Medium | Low" }
  ]
}

Current inventory context:
- Out of stock: STIIIZY OG Kush Pod (3 days, 42/wk sales), Kiva Camino Pineapple Habanero (1 day, 38/wk), Raw Garden Slippery Susan cart (5 days, 28/wk), Wyld Elderberry Indica (2 days, 22/wk)
- Low stock: Jeeter Baby Churros (8 units left, 56/wk sales)
- Top brands by revenue: Jeeter ($12.4K/mo), STIIIZY ($10.8K/mo), Kiva ($8.2K/mo), Raw Garden ($7.6K/mo), Cookies ($6.1K/mo)
- Avg margin: 43.1%, Stockout rate: 6.2%, Inventory turns: 4.8x
- Categories under-indexed vs regional market: Disposable Vapes (-32%), Topicals (-28%), Beverages (-45%)`;

export async function generateConnectResponse(query, inventoryContext = '') {
  const prompt = inventoryContext
    ? `Inventory context:\n${inventoryContext}\n\n---\n\nUser request: "${query}"\n\nProvide a helpful purchasing/inventory response.`
    : `User request: "${query}"\n\nProvide a helpful purchasing/inventory response for a cannabis dispensary called Ascend.`;

  return callGemini({ system: CONNECT_SYSTEM, prompt, temperature: 0.6, maxTokens: 800 });
}

function normalizeConnectAnalysis(raw) {
  if (!raw) return null;
  const analysis = { ...raw };

  // Default workflowType
  if (!analysis.workflowType) analysis.workflowType = 'recommendations';

  // Ensure title/subtitle
  if (!analysis.title) analysis.title = analysis.workflowType === 'reorder' ? 'Reorder Analysis' : analysis.workflowType === 'explore' ? 'Product Discovery' : 'Purchasing Recommendations';
  if (!analysis.subtitle) analysis.subtitle = 'AI-generated analysis based on your inventory data';

  // Normalize products (used by reorder and explore views)
  if (Array.isArray(analysis.products)) {
    analysis.products = analysis.products.map((p, i) => ({
      ...p,
      id: p.id || `ai-${i}`,
      brand: p.brand || 'Brand',
      name: p.name || 'Product',
      type: p.type || '',
      brandColor: p.brandColor || '#64A8E0',
      // Reorder-specific fields
      lastPrice: p.lastPrice || p.price || '$0.00',
      avgWeeklySales: typeof p.avgWeeklySales === 'number' ? p.avgWeeklySales : parseInt(p.avgWeeklySales) || 20,
      daysOutOfStock: typeof p.daysOutOfStock === 'number' ? p.daysOutOfStock : parseInt(p.daysOutOfStock) || 0,
      urgency: p.urgency || 'medium',
      supplier: p.supplier || 'Distributor',
      leadTime: p.leadTime || '3-5 days',
      recommendedQty: typeof p.recommendedQty === 'number' ? p.recommendedQty : parseInt(p.recommendedQty) || 24,
      // Explore-specific fields
      wholesalePrice: p.wholesalePrice || p.lastPrice || '$0.00',
      suggestedRetail: p.suggestedRetail || p.price || '$0.00',
      margin: p.margin || '40%',
      rating: typeof p.rating === 'number' ? p.rating : parseFloat(p.rating) || 4.5,
    }));
  }

  // Normalize recommendations for reorder view
  if (Array.isArray(analysis.recommendations)) {
    analysis.recommendations = analysis.recommendations.map(r => ({
      brand: r.brand || 'Brand',
      product: r.product || r.name || 'Product',
      qty: typeof r.qty === 'number' ? r.qty : parseInt(r.qty) || 24,
      reason: r.reason || 'Based on sales velocity analysis',
      cost: r.cost || '$0.00',
    }));
  }

  // Ensure metrics have iconName
  if (Array.isArray(analysis.metrics)) {
    const defaultIcons = ['PackageX', 'CircleDollarSign', 'RefreshCw', 'TrendingDown'];
    analysis.metrics = analysis.metrics.map((m, i) => ({
      ...m,
      label: m.label || 'Metric',
      value: m.value || '—',
      change: m.change || '—',
      iconName: m.iconName || m.icon || defaultIcons[i % defaultIcons.length],
    }));
  }

  // Normalize actionItems for recommendations view
  if (Array.isArray(analysis.actionItems)) {
    analysis.actionItems = analysis.actionItems.map(a => ({
      action: a.action || 'Review inventory',
      reason: a.reason || 'Based on data analysis',
      priority: a.priority || 'Medium',
    }));
  }

  // Ensure brandPerformance items have pct
  if (Array.isArray(analysis.brandPerformance)) {
    analysis.brandPerformance = analysis.brandPerformance.map((b, i) => ({
      ...b,
      name: b.name || 'Brand',
      revenue: b.revenue || '—',
      growth: b.growth || '—',
      pct: b.pct || Math.max(20, 90 - i * 15),
      color: b.color || '#64A8E0',
    }));
  }

  // Ensure categoryGaps items have color
  if (Array.isArray(analysis.categoryGaps)) {
    const gapColors = ['#64A8E0', '#B598E8', '#00C27C'];
    analysis.categoryGaps = analysis.categoryGaps.map((c, i) => ({
      ...c,
      category: c.category || 'Category',
      gap: c.gap || '—',
      opportunity: c.opportunity || '—',
      color: c.color || gapColors[i % gapColors.length],
    }));
  }

  return analysis;
}

export async function generateConnectAnalysis(query) {
  const prompt = `Generate a purchasing analysis for this request: "${query}"\n\nReturn ONLY the JSON object, nothing else.`;
  const raw = await callGeminiJSON({ system: CONNECT_ANALYSIS_SYSTEM, prompt, temperature: 0.5, maxTokens: 3072 });
  return normalizeConnectAnalysis(raw);
}

/* ─── Pricing Agent ─────────────────────────────────────────── */

const PRICING_SYSTEM = `You are the Dutchie Pricing Agent — an AI-powered pricing and discount management assistant for cannabis dispensaries. You help operators understand their gross and net pricing, see how their prices compare to regional market averages, review discount/promo performance, and make quick pricing and discount changes.

Rules:
- Focus on gross prices (what customers pay) and net prices (after cost). Reference margins only as secondary context.
- NEVER name specific competitors. Always refer to market data as "market in your region" or "regional average".
- Understand cannabis retail pricing dynamics: regulatory constraints, brand pricing power, and consumer price sensitivity.
- Give direct, actionable recommendations with projected revenue impact.
- Keep responses conversational and concise.
- Never use markdown headers (#). Use plain text with line breaks.`;

const PRICING_ANALYSIS_SYSTEM = `You are the Dutchie Pricing Agent. Generate a structured pricing analysis as JSON for Ascend dispensary.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.
CRITICAL: NEVER name specific competitors. Use "market in your region" or "regional market" instead. All market data should be anonymous regional averages.

First, classify the user's intent into one of these workflowTypes:
- "market_comparison": how your prices compare to regional market averages by product, brand, and category
- "price_cost_overview": gross prices, wholesale costs, net revenue per product with margin as secondary
- "discount_review": all active discounts/promos with performance metrics and ROI
- "price_scenarios": what-if modeling for price changes with projected impact
- "change_prices": specific price changes to apply
- "create_discount": set up a new discount or promo

Then generate JSON matching the schema for that workflowType:

FOR workflowType "market_comparison":
{
  "workflowType": "market_comparison",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "products": [
    { "id": "unique-id", "name": "Product name", "brand": "Brand", "category": "Category", "yourPrice": 45.00, "marketAvg": 42.00, "marketLow": 38.00, "marketHigh": 48.00, "gap": "+7.1%", "recommendation": "raise | lower | keep", "reason": "Why" }
  ],
  "categoryComparison": [
    { "category": "Category name", "yourAvg": 42.00, "marketAvg": 39.00, "gap": "+7.7%", "color": "#hex" }
  ],
  "summary": "Overall market comparison summary — never name specific competitors"
}

FOR workflowType "price_cost_overview":
{
  "workflowType": "price_cost_overview",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "products": [
    { "name": "Product", "brand": "Brand", "category": "Category", "grossPrice": 45.00, "cost": 24.00, "netPerUnit": 21.00, "margin": 46.7, "weeklyUnits": 42, "weeklyRevenue": 1890, "weeklyCost": 1008, "weeklyNet": 882 }
  ],
  "categoryBreakdown": [
    { "category": "Category name", "avgGrossPrice": 42.00, "avgCost": 22.00, "avgNet": 20.00, "monthlyRevenue": "$XX,XXX", "margin": 47.6, "color": "#hex" }
  ],
  "suggestions": [
    { "action": "What to do", "impact": "+$X,XXX/mo", "effort": "Low | Medium | High" }
  ]
}

FOR workflowType "discount_review":
{
  "workflowType": "discount_review",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "totalDiscountSpend": "$XX,XXX",
  "wastedSpend": "$X,XXX",
  "avgROI": "X.Xx",
  "promotions": [
    { "name": "Promo name", "type": "Type", "discountAmount": "15% off or $5 off", "spend": "$X,XXX", "redemptions": 245, "grossRevenue": "$XX,XXX", "incrementalRevenue": "$X,XXX", "roi": 2.4, "verdict": "Keep | Optimize | Kill", "reason": "Why" }
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

FOR workflowType "price_scenarios":
{
  "workflowType": "price_scenarios",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "scenarios": [
    { "name": "Scenario name", "strategy": "Brief description", "recommended": true, "riskLevel": "Low | Medium | High", "projections": { "revenueChange": "+$X,XXX/mo", "netProfitChange": "+$X,XXX/mo", "customerImpact": "Description" }, "changes": [
      { "product": "Product name", "currentPrice": 45.00, "newPrice": 48.00, "change": "+6.7%" }
    ]}
  ]
}

FOR workflowType "change_prices":
{
  "workflowType": "change_prices",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "changes": [
    { "id": "unique-id", "name": "Product name", "brand": "Brand", "category": "Category", "currentPrice": 45.00, "newPrice": 48.00, "changePercent": "+6.7%", "weeklyUnits": 42, "revenueImpact": "+$126/wk", "netImpact": "+$126/wk" }
  ],
  "totalRevenueImpact": "+$X,XXX/mo",
  "totalNetImpact": "+$X,XXX/mo"
}

FOR workflowType "create_discount":
{
  "workflowType": "create_discount",
  "title": "Analysis title",
  "subtitle": "One-line description",
  "discount": {
    "name": "Discount name",
    "type": "Percentage | Dollar Off | BOGO | Bundle",
    "amount": "15% off or $5 off",
    "appliesTo": "All Products | Category | Brand | Specific Products",
    "targetProducts": ["Product names if specific"],
    "schedule": "Always active | Weekdays 4-7pm | Weekends only",
    "estimatedRedemptions": 200,
    "estimatedCost": "$X,XXX/mo",
    "projectedIncrementalRevenue": "$X,XXX/mo",
    "projectedROI": "2.4x"
  }
}

Current pricing context for Ascend:
- Average gross price: $35.63 across all products, regional market average: $33.60
- Average margin: 43.1% (secondary metric)
- 5 active promotions, $14,400/mo total discount spend, $4,320/mo with no ROI impact
- Top categories by gross revenue: Flower ($28.5K/mo, avg price $52.50), Vapes ($22.3K/mo, avg price $42.50), Edibles ($18.4K/mo, avg price $20.00), Pre-Rolls ($15.2K/mo, avg price $35.00)
- Key products with cost: Jeeter Baby Churros ($35 gross, $18 cost, $17 net, 62 units/wk), STIIIZY OG Kush Pod ($45 gross, $24 cost, $21 net, 42 units/wk), Kiva Camino Gummies ($22 gross, $10 cost, $12 net, 55 units/wk), Raw Garden Cart ($40 gross, $22 cost, $18 net, 28 units/wk), Wyld Elderberry Gummies ($18 gross, $8 cost, $10 net, 35 units/wk), Cookies Gary Payton ($55 gross, $32 cost, $23 net, 18 units/wk), Alien Labs Atomic Apple ($50 gross, $28 cost, $22 net, 22 units/wk), PLUS Sour Watermelon ($20 gross, $9 cost, $11 net, 30 units/wk)`;

export async function generatePricingResponse(query) {
  const prompt = `User request: "${query}"\n\nProvide a helpful, data-driven pricing/revenue management response for a cannabis dispensary called Ascend.`;
  return callGemini({ system: PRICING_SYSTEM, prompt, temperature: 0.6, maxTokens: 800 });
}

function normalizePricingAnalysis(raw) {
  if (!raw) return null;
  const analysis = { ...raw };

  if (!analysis.workflowType) analysis.workflowType = 'market_comparison';
  if (!analysis.title) analysis.title = 'Pricing Analysis';
  if (!analysis.subtitle) analysis.subtitle = 'AI-generated pricing analysis';

  const toNum = (v, fallback = 0) => typeof v === 'number' ? v : parseFloat(v) || fallback;
  const toInt = (v, fallback = 0) => typeof v === 'number' ? v : parseInt(v) || fallback;
  const colors = ['#00C27C', '#64A8E0', '#B598E8', '#D4A03A', '#E87068', '#FF6B35', '#E91E63', '#00BCD4'];

  // Normalize products (used by market_comparison and price_cost_overview)
  if (Array.isArray(analysis.products)) {
    analysis.products = analysis.products.map((p, i) => ({
      ...p,
      id: p.id || `p-${i}`,
      name: p.name || 'Product',
      brand: p.brand || 'Brand',
      category: p.category || '',
      yourPrice: toNum(p.yourPrice),
      grossPrice: toNum(p.grossPrice || p.yourPrice),
      cost: toNum(p.cost),
      netPerUnit: toNum(p.netPerUnit),
      marketAvg: toNum(p.marketAvg),
      marketLow: toNum(p.marketLow),
      marketHigh: toNum(p.marketHigh),
      gap: p.gap || '0%',
      recommendation: p.recommendation || 'keep',
      reason: p.reason || '',
      margin: toNum(p.margin),
      weeklyUnits: toInt(p.weeklyUnits),
      weeklyRevenue: toNum(p.weeklyRevenue),
      weeklyCost: toNum(p.weeklyCost),
      weeklyNet: toNum(p.weeklyNet),
      currentPrice: toNum(p.currentPrice),
      newPrice: toNum(p.newPrice),
      changePercent: p.changePercent || '0%',
      revenueImpact: p.revenueImpact || '$0',
      netImpact: p.netImpact || p.marginImpact || '0%',
    }));
  }

  // Normalize changes (change_prices workflow)
  if (Array.isArray(analysis.changes)) {
    analysis.changes = analysis.changes.map((c, i) => ({
      ...c,
      id: c.id || `c-${i}`,
      name: c.name || 'Product',
      brand: c.brand || 'Brand',
      category: c.category || '',
      currentPrice: toNum(c.currentPrice),
      newPrice: toNum(c.newPrice),
      changePercent: c.changePercent || '0%',
      weeklyUnits: toInt(c.weeklyUnits),
      revenueImpact: c.revenueImpact || '$0',
      netImpact: c.netImpact || c.marginImpact || '$0',
    }));
  }

  // Normalize categoryComparison / categoryBreakdown
  if (Array.isArray(analysis.categoryComparison)) {
    analysis.categoryComparison = analysis.categoryComparison.map((c, i) => ({
      category: c.category || 'Category',
      yourAvg: toNum(c.yourAvg),
      marketAvg: toNum(c.marketAvg),
      gap: c.gap || '0%',
      color: c.color || colors[i % colors.length],
    }));
  }
  if (Array.isArray(analysis.categoryBreakdown)) {
    analysis.categoryBreakdown = analysis.categoryBreakdown.map((c, i) => ({
      category: c.category || 'Category',
      avgGrossPrice: toNum(c.avgGrossPrice),
      avgCost: toNum(c.avgCost),
      avgNet: toNum(c.avgNet),
      monthlyRevenue: c.monthlyRevenue || '$0',
      margin: toNum(c.margin),
      color: c.color || colors[i % colors.length],
    }));
  }

  // Normalize suggestions
  if (Array.isArray(analysis.suggestions)) {
    analysis.suggestions = analysis.suggestions.map(s => ({
      action: s.action || 'Review pricing', impact: s.impact || '$0', effort: s.effort || 'Medium',
    }));
  }

  // Normalize promotions (discount_review)
  if (Array.isArray(analysis.promotions)) {
    analysis.promotions = analysis.promotions.map(p => ({
      ...p,
      name: p.name || 'Promotion',
      type: p.type || 'Discount',
      discountAmount: p.discountAmount || '',
      spend: p.spend || '$0',
      redemptions: toInt(p.redemptions),
      grossRevenue: p.grossRevenue || p.revenue || '$0',
      incrementalRevenue: p.incrementalRevenue || '$0',
      roi: toNum(p.roi),
      verdict: p.verdict || 'Optimize',
      reason: p.reason || '',
    }));
  }

  // Normalize scenarios (price_scenarios)
  if (Array.isArray(analysis.scenarios)) {
    analysis.scenarios = analysis.scenarios.map((s, i) => ({
      name: s.name || `Scenario ${i + 1}`,
      strategy: s.strategy || '',
      recommended: !!s.recommended,
      riskLevel: s.riskLevel || 'Medium',
      projections: {
        revenueChange: s.projections?.revenueChange || '$0',
        netProfitChange: s.projections?.netProfitChange || s.projections?.marginChange || '$0',
        customerImpact: s.projections?.customerImpact || '',
      },
      changes: Array.isArray(s.changes) ? s.changes.map(c => ({
        product: c.product || 'Product',
        currentPrice: toNum(c.currentPrice),
        newPrice: toNum(c.newPrice),
        change: c.change || '0%',
      })) : [],
    }));
  }

  // Normalize discount (create_discount)
  if (analysis.discount && typeof analysis.discount === 'object') {
    const d = analysis.discount;
    analysis.discount = {
      name: d.name || 'New Discount',
      type: d.type || 'Percentage',
      amount: d.amount || '10% off',
      appliesTo: d.appliesTo || 'All Products',
      targetProducts: Array.isArray(d.targetProducts) ? d.targetProducts : [],
      schedule: d.schedule || 'Always active',
      estimatedRedemptions: toInt(d.estimatedRedemptions),
      estimatedCost: d.estimatedCost || '$0',
      projectedIncrementalRevenue: d.projectedIncrementalRevenue || '$0',
      projectedROI: d.projectedROI || '0x',
    };
  }

  // Ensure arrays
  if (!Array.isArray(analysis.recommendations)) analysis.recommendations = [];

  return analysis;
}

export async function generatePricingAnalysis(query) {
  const prompt = `Generate a pricing analysis for this request: "${query}"\n\nReturn ONLY the JSON object, nothing else.`;
  const raw = await callGeminiJSON({ system: PRICING_ANALYSIS_SYSTEM, prompt, temperature: 0.5, maxTokens: 3072 });
  return normalizePricingAnalysis(raw);
}
