import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import { useStores } from '../contexts/StoreContext';
import {
  Sparkles, Send, ChevronRight, Zap, TrendingUp,
  CheckCircle2, Clock, DollarSign, BarChart3, Star,
  ChevronDown, ChevronUp, Check, X, Search,
  ShoppingCart, Eye,
  Package, AlertTriangle, MessageSquare,
  BookOpen, Rocket, Factory, Shield, CreditCard,
  Smartphone, Monitor, ExternalLink,
  FileText, Tag, Ticket, Bug, Lightbulb, Settings,
  Layers, PanelRight, Megaphone,
  Upload, Image, Info, MapPin, User, Hash,
  ArrowRightLeft, Truck, Users, RefreshCw, Globe,
  Activity, Receipt, Clipboard,
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { generateBridgeResponse, generateMarketingCampaignPlan, generateConnectAnalysis, generatePricingAnalysis, isGeminiAvailable } from '../utils/gemini';
import { CampaignPlan, CAMPAIGNS } from './MarketingCampaigns';
import { ReorderView, ExploreView, RecommendationsView } from './ConnectAgent';
import { MarketComparisonView, PriceCostView, DiscountReviewView, PriceScenariosView, ChangePricesView, CreateDiscountView } from './PricingAgent';
import { reviews as allReviews, sources as allSources, brands as allBrands, categories as allCategories } from '../data/mockData';
import { avgSentiment, sentimentDistribution, monthlyTrend, calculateNPS, categorySentiment, groupBy, filterReviews, brandImg } from '../utils/helpers';
import NexusIcon from '../components/NexusIcon';

/* ═══════════════════════════════════════════════════════════════════
   DEX — PRODUCT CONTEXT (Feature Flags)
   ═══════════════════════════════════════════════════════════════════ */

const DEFAULT_PRODUCTS = {
  ecommerce: { name: 'Dutchie Ecommerce', active: true, icon: ShoppingCart, color: 'var(--color-accent-green)', description: 'Online ordering & menu', tier: 'Core' },
  pos: { name: 'Dutchie POS', active: true, icon: Monitor, color: 'var(--color-accent-blue)', description: 'Point-of-sale system', tier: 'Core' },
  payments: { name: 'Dutchie Pay', active: true, icon: CreditCard, color: 'var(--color-accent-purple)', description: 'ACH payment processing', tier: 'Core' },
  payByBank: { name: 'Pay-by-Bank', active: false, icon: DollarSign, color: 'var(--color-accent-gold)', description: 'Zero-fee bank transfers', tier: 'Fintech', upsell: true, monthlyFee: '$0/mo', savings: 'Save 2.5-3.5% per transaction' },
  whiteLabel: { name: 'White Label App', active: false, icon: Smartphone, color: '#EC4899', description: 'Branded iOS & Android app', tier: 'Premium', upsell: true, monthlyFee: '$499/mo', savings: 'Own your brand in the App Store' },
  menuBoards: { name: 'Digital Menu Boards', active: false, icon: Monitor, color: '#0EA5E9', description: 'In-store digital displays', tier: 'Premium', upsell: true, monthlyFee: '$149/mo', savings: 'Dynamic pricing & promotions' },
  b2cAI: { name: 'B2C AI Suite', active: false, icon: Sparkles, color: '#F97316', description: 'AI-powered recommendations', tier: 'AI', upsell: true, monthlyFee: '$299/mo', savings: '+18% avg basket size' },
  analytics: { name: 'Advanced Analytics', active: true, icon: BarChart3, color: 'var(--color-accent-green)', description: 'Sales & customer insights', tier: 'Core' },
};

/* ═══════════════════════════════════════════════════════════════════
   KNOWLEDGE BASE — 55 articles covering all Dutchie product areas
   ═══════════════════════════════════════════════════════════════════ */

export const KNOWLEDGE_BASE = [
  // ── Ecommerce: Menu & Products ──
  { id: 'kb-001', title: 'How to Set Up Your Menu', category: 'Ecommerce', tags: ['menu', 'setup', 'products', 'categories', 'items', 'getting started'], navPath: 'Dutchie Admin > Menu Management', steps: ['Click "Add Category" to create sections (Flower, Edibles, Concentrates, Pre-Rolls)', 'Click "Add Product" within each category', 'Set pricing (rec/med), THC/CBD %, strain type, weight options', 'Upload product images (up to 5 per product)', 'Bulk-import via CSV under Menu > Import', 'Click "Publish" to make changes live'], content: 'Navigate to Dutchie Admin > Menu Management. Click "Add Category" to create sections (Flower, Edibles, Concentrates, Pre-Rolls, etc.), then "Add Product" within each category. For each product, set pricing (rec and med if applicable), THC/CBD percentages, strain type (Indica/Sativa/Hybrid), weight options, and upload product images. You can bulk-import products via CSV under Menu > Import. Publish changes to make them live on your storefront. Tip: organize categories in the order customers browse — Flower first, then Edibles, then Concentrates.', relatedArticles: ['kb-002', 'kb-003', 'kb-004'] },
  { id: 'kb-002', title: 'Adding & Optimizing Product Images', category: 'Ecommerce', tags: ['images', 'photos', 'product', 'upload', 'picture', 'optimization'], navPath: 'Menu > [Product] > Edit', steps: ['Select a product and click "Edit"', 'Use image uploader — up to 5 photos per product', 'Recommended: 1000x1000px, JPEG/PNG, under 2MB', 'Drag to reorder — first image shows on menu grid', 'Use lifestyle/close-up shots (40% better conversion)'], content: 'Navigate to Menu > select a product > click "Edit." Use the image uploader to add up to 5 photos per product. Recommended specs: 1000x1000px, JPEG or PNG, under 2MB. Best practices: use lifestyle shots and close-ups rather than packaging-only photos (these convert 40% better). Ensure good lighting and a clean background. Products with 3+ images see 25% more add-to-carts. You can drag to reorder — the first image is what shows on the menu grid.', relatedArticles: ['kb-001'] },
  { id: 'kb-003', title: 'Managing Product Categories & Subcategories', category: 'Ecommerce', tags: ['categories', 'subcategories', 'organize', 'menu', 'navigation', 'filter'], navPath: 'Menu > Categories', steps: ['Create top-level categories (Flower, Edibles, Concentrates, etc.)', 'Optionally add subcategories (e.g., Flower > Indica, Flower > Sativa)', 'Drag categories to reorder display on storefront', 'Toggle visibility to show/hide categories', 'Add a description for each category (shown on storefront)', 'Limit to 8-12 categories for best navigation'], content: 'Go to Menu > Categories. Create top-level categories (Flower, Edibles, Concentrates) and optional subcategories (e.g., Flower > Indica, Flower > Sativa). You can set category display order by dragging, show/hide categories by toggling visibility, and assign custom icons. Each category can have a description shown on the storefront. Subcategories appear as filter tabs within the parent category. Limit categories to 8-12 for the best customer navigation experience.', relatedArticles: ['kb-001'] },
  { id: 'kb-004', title: 'SEO Settings for Your Storefront', category: 'Ecommerce', tags: ['seo', 'search', 'google', 'meta', 'description', 'title', 'traffic', 'organic'], navPath: 'Settings > SEO', steps: ['Set meta title (60 chars max) and meta description (155 chars max)', 'Upload Open Graph image for social sharing', 'Add alt text to all product images', 'Enable sitemap at Settings > SEO > Sitemap', 'Submit sitemap to Google Search Console', 'For embedded menus, ensure parent page has proper H1 tags'], content: 'Go to Settings > SEO. Set your store\'s meta title (60 chars max), meta description (155 chars max), and Open Graph image. Each product page automatically generates SEO-friendly URLs. Add alt text to product images for better Google Image ranking. Enable the sitemap (Settings > SEO > Sitemap) and submit it to Google Search Console. For embedded menus, ensure your parent page has proper H1 tags. Stores with optimized SEO see 30-50% more organic traffic within 3 months.', relatedArticles: ['kb-005'] },
  { id: 'kb-005', title: 'Embedded vs Hosted Storefronts', category: 'Ecommerce', tags: ['embedded', 'hosted', 'iframe', 'website', 'storefront', 'integration', 'custom domain'], navPath: 'Settings > Embed Code / Custom Domain', steps: ['Choose storefront type: Hosted (dutchie.com URL) or Embedded (iframe)', 'For Embedded: go to Settings > Embed Code and copy the iframe snippet', 'Paste the iframe code into your website HTML', 'For Hosted with custom domain: go to Settings > Custom Domain', 'Add CNAME record at your DNS provider', 'SSL certificate provisions automatically (up to 24 hours)'], content: 'Dutchie offers two storefront options: Hosted (yourstore.dutchie.com) — a turnkey storefront with its own URL, fully managed by Dutchie. Embedded (iframe) — embed the Dutchie menu directly into your existing website. To set up embedded, go to Settings > Embed Code, copy the iframe snippet, and paste it into your website HTML. For custom domains on hosted stores, go to Settings > Custom Domain, add your CNAME record, and Dutchie provisions the SSL certificate automatically (takes up to 24 hours).', relatedArticles: ['kb-004'] },
  { id: 'kb-006', title: 'Ordering Flows: Pickup, Delivery & Curbside', category: 'Ecommerce', tags: ['pickup', 'delivery', 'curbside', 'ordering', 'flow', 'checkout', 'order types'], navPath: 'Settings > Order Types', steps: ['Enable/disable Pickup, Delivery, and Curbside order types', 'For Pickup: set prep time estimates (default 15 min)', 'For Curbside: enable vehicle info collection at checkout', 'For Delivery: configure zones, minimums, and fees at Settings > Delivery', 'Set independent hours per order type if needed', 'Optionally set different menus/pricing per order type'], content: 'Go to Settings > Order Types to enable/disable Pickup, Delivery, and Curbside. For Pickup, set prep time estimates (default 15 min). For Curbside, enable vehicle info collection at checkout. For Delivery, configure zones, minimums, and fees under Settings > Delivery. Customers choose their order type at the start of checkout. You can set different menus or pricing per order type. Each type can have independent hours — e.g., delivery stops at 8 PM while pickup runs until 9 PM.', relatedArticles: ['kb-007', 'kb-008'] },
  { id: 'kb-007', title: 'Setting Up Online Ordering Hours', category: 'Ecommerce', tags: ['hours', 'schedule', 'ordering', 'open', 'close', 'time', 'after hours'], navPath: 'Settings > Store Hours', steps: ['Set ordering window for each day of the week', 'Set separate hours for pickup, delivery, and curbside if needed', 'Enable "After Hours" mode for next-day pre-orders', 'Set holiday hours at Settings > Store Hours > Holiday Schedule', 'Use "Pause Orders" button on dashboard for temporary stops'], content: 'Go to Settings > Store Hours. Set your ordering window for each day of the week independently. You can set separate hours for pickup, delivery, and curbside. Enable "After Hours" mode to accept pre-orders for the next business day — these orders queue up and appear when you open. Holiday hours can be set in advance under Settings > Store Hours > Holiday Schedule. Tip: if you close early, you can use the "Pause Orders" button on the dashboard to temporarily stop new orders without changing your schedule.', relatedArticles: ['kb-006'] },
  { id: 'kb-008', title: 'Managing Delivery Zones & Fees', category: 'Ecommerce', tags: ['delivery', 'zone', 'radius', 'area', 'fee', 'minimum', 'driver', 'dispatch'], navPath: 'Settings > Delivery', steps: ['Draw delivery zones using polygon tool or set radius from store address', 'Configure per-zone: minimum order, delivery fee, estimated time', 'Create multiple zones with different fee tiers', 'Set max orders per delivery window to prevent overload', 'Use Operations > Dispatch to assign and track deliveries'], content: 'Navigate to Settings > Delivery. Draw delivery zones on the map (polygon tool) or set a simple radius from your store address. For each zone, configure: minimum order amount, delivery fee (flat or tiered by distance), estimated delivery time. You can create multiple zones with different fees — e.g., free delivery within 5 miles, $5 fee for 5-10 miles. Set maximum orders per delivery window to prevent driver overload. Use the driver dispatch dashboard to assign and track active deliveries.', relatedArticles: ['kb-006', 'kb-043'] },
  { id: 'kb-009', title: 'Customizing Checkout Flow', category: 'Ecommerce', tags: ['checkout', 'customize', 'flow', 'fields', 'tips', 'notes', 'order'], navPath: 'Settings > Checkout', steps: ['Configure required fields (phone, email, medical card #)', 'Set tip amounts (preset 10/15/20% or custom)', 'Enable special instructions text box', 'Toggle medical vs recreational', 'Configure promo code field visibility', 'Add custom checkout banners for promotions'], content: 'Go to Settings > Checkout. You can customize: required fields (phone, email, medical card #), optional tip amounts (preset 10/15/20% or custom), special instructions text box, age verification prompt, medical vs recreational toggle, promo code field visibility. You can also add custom checkout banners (e.g., "First-time customers get 10% off!"). The checkout flow supports express reordering — returning customers can reorder previous purchases with one click.', relatedArticles: ['kb-006'] },

  // ── POS ──
  { id: 'kb-010', title: 'POS Register Setup & Configuration', category: 'POS', tags: ['pos', 'register', 'setup', 'terminal', 'configuration', 'station'], navPath: 'POS > Register Setup', steps: ['Name each register (e.g., "Register 1 — Front Counter")', 'Assign default printer, cash drawer, and payment terminal', 'Configure receipt format (digital, printed, or both)', 'Set up quick-access product buttons for top sellers', 'Assign to specific employee or leave as shared station', 'Test with a $0 test transaction before going live'], content: 'Go to POS > Register Setup. Name each register (e.g., "Register 1 — Front Counter"). Assign a default printer, cash drawer, and payment terminal. Configure receipt format (digital, printed, or both). Set up quick-access product buttons for your most popular items. Each register can be assigned to a specific employee or left as a shared station. You can run up to 10 registers simultaneously per location. Test the register with a $0 test transaction before going live.', relatedArticles: ['kb-011', 'kb-012'] },
  { id: 'kb-011', title: 'POS Hardware Compatibility', category: 'POS', tags: ['hardware', 'printer', 'scanner', 'drawer', 'receipt', 'barcode', 'ipad', 'terminal', 'compatible'], content: 'Dutchie POS supports: iPads (10th gen or newer recommended, minimum iOS 16), Star Micronics TSP143IV receipt printers (USB or Bluetooth), Socket Mobile barcode scanners, APG Vasario cash drawers, and Dejavoo Z11 payment terminals. Connect the receipt printer via USB or Bluetooth in POS > Settings > Hardware. For barcode scanning, pair the scanner in iPad Bluetooth settings — it works as a keyboard input. Cash drawers connect through the receipt printer\'s DK port (no separate driver needed).', relatedArticles: ['kb-010', 'kb-051'] },
  { id: 'kb-012', title: 'Cash Management & Drawer Reconciliation', category: 'POS', tags: ['cash', 'drawer', 'reconciliation', 'count', 'safe', 'drop', 'till'], navPath: 'POS > Cash Management', steps: ['At shift start: POS > Cash Management > Open Drawer, enter starting amount', 'During the day: POS > Cash Drop when drawer exceeds target', 'At end of day: POS > Close Drawer, count cash, enter total', 'System shows expected vs actual and any over/short discrepancy', 'Optionally enable blind counts (employee counts first)', 'Review all cash events in Reports > Cash Management'], content: 'At shift start, go to POS > Cash Management > Open Drawer, enter the starting cash amount. During the day, perform cash drops (POS > Cash Drop) when the drawer exceeds your target amount. At end of day, go to POS > Close Drawer, count the cash and enter the total. The system calculates the expected amount and shows any over/short discrepancy. You can also do blind counts (employee counts first, then system reveals expected). All cash events are logged in Reports > Cash Management.', relatedArticles: ['kb-010', 'kb-016'] },
  { id: 'kb-013', title: 'Applying Discounts & Promotions at POS', category: 'POS', tags: ['discount', 'promotion', 'coupon', 'deal', 'percent', 'dollar off', 'promo', 'sale'], navPath: 'POS > Checkout > Add Discount', steps: ['At checkout, tap "Add Discount"', 'Choose type: % off, $ off, BOGO, bundle, or promo code', 'Select item-level or cart-level discount', 'For reusable promos: Marketing > Promotions > Create', 'Set conditions, date ranges, and usage limits', 'Track all discounts in Reports > Discount Summary'], content: 'At checkout in POS, tap "Add Discount." Choose from: percentage off (e.g., 10%), dollar amount off (e.g., $5), BOGO, bundle deals, or enter a promo code. Discounts can be item-level or cart-level. To create reusable promotions, go to Marketing > Promotions > Create. Set conditions (minimum purchase, specific categories, first-time customers, etc.), date ranges, and usage limits. Promotions auto-apply at POS when conditions are met. All discounts are tracked in Reports > Discount Summary.', relatedArticles: ['kb-039'] },
  { id: 'kb-014', title: 'Processing Returns & Exchanges at POS', category: 'POS', tags: ['return', 'exchange', 'refund', 'pos', 'void', 'cancel'], navPath: 'POS > Orders > [Order] > Return', steps: ['Find the order in POS > Orders', 'Tap "Return" and select item(s) being returned', 'Select a return reason', 'For exchanges: process return first, then ring up new item', 'Choose refund method: original payment or store credit', 'To void (before completion): tap "Void" on active transaction'], content: 'Go to POS > Orders > find the order > tap "Return." Select the item(s) being returned and the reason. For exchanges, process the return first, then ring up the new item. Returns adjust inventory automatically and sync to METRC (if applicable). Note: cannabis return policies vary by state — some states prohibit returns of opened products. Refunds can go back to original payment method or store credit. Void an order (before completion) by tapping "Void" on the active transaction — this cancels entirely with no inventory adjustment.', relatedArticles: ['kb-019'] },
  { id: 'kb-015', title: 'Employee Management & Permissions', category: 'POS', tags: ['employee', 'staff', 'permissions', 'roles', 'pin', 'access', 'budtender', 'manager'], navPath: 'Settings > Employees', steps: ['Go to Settings > Employees > Add Employee', 'Set role: Budtender, Shift Lead, Manager, or Admin', 'Assign unique PIN for POS login', 'Customize permissions per role (discount limits, cash access, etc.)', 'Track performance in Reports > Employee Sales'], content: 'Go to Settings > Employees > Add Employee. Set their role: Budtender (basic POS access), Shift Lead (POS + cash management), Manager (full access minus admin), Admin (everything). Each employee gets a unique PIN for POS login. You can customize permissions per role — e.g., allow Budtenders to apply discounts up to 15% but require manager override above that. Track employee performance in Reports > Employee Sales — see transactions per hour, average ticket size, and discount usage.', relatedArticles: ['kb-010'] },
  { id: 'kb-016', title: 'End-of-Day Reconciliation', category: 'POS', tags: ['end of day', 'reconciliation', 'close', 'eod', 'settlement', 'daily report', 'z report'], navPath: 'POS > End of Day', steps: ['Close each register (count cash, reconcile drawer)', 'Review sales summary (total sales, tax, discounts)', 'Verify payment reconciliation (card vs processor settlement)', 'Check inventory adjustments', 'Generate Z-Report (daily summary)', 'Set up auto-email for nightly EOD report'], content: 'At close, go to POS > End of Day. The wizard walks through: 1) Close each register (count cash, reconcile drawer), 2) Review sales summary (total sales, tax collected, discounts given), 3) Verify payment reconciliation (card transactions match processor settlement), 4) Check inventory adjustments, 5) Generate the Z-Report (daily summary). The EOD report is automatically saved and can be exported as PDF or CSV. Set up auto-email to receive the EOD report every night at closing time.', relatedArticles: ['kb-012'] },

  // ── Payments ──
  { id: 'kb-017', title: 'Dutchie Pay (ACH) Setup', category: 'Payments', tags: ['dutchie pay', 'ach', 'setup', 'bank', 'payment', 'processing', 'cashless'], navPath: 'Settings > Payments > Dutchie Pay', steps: ['Complete merchant application (EIN, bank account, owner verification)', 'Wait for approval (2-3 business days)', 'Dutchie Pay appears as payment option at checkout', 'Customers link bank account via Plaid', 'Funds settle in 2-3 business days at 1.5% fee'], content: 'Go to Settings > Payments > Dutchie Pay. Complete the merchant application (requires EIN, bank account details, and owner verification). Approval typically takes 2-3 business days. Once approved, Dutchie Pay appears as a payment option at checkout. Customers link their bank account via Plaid and pay directly — funds settle to your account in 2-3 business days. Processing fee: 1.5% per transaction (significantly lower than card processing). Dutchie Pay works for both online orders and in-store POS transactions.', relatedArticles: ['kb-018', 'kb-019'] },
  { id: 'kb-018', title: 'Understanding Transaction Fees & Fee Optimization', category: 'Payments', tags: ['fees', 'transaction', 'credit card', 'processing', 'cost', 'charges', 'expensive', 'high fees', 'optimize'], content: 'Fee breakdown: Credit/Debit cards — 2.9% + $0.30 per transaction (standard interchange). Dutchie Pay (ACH) — 1.5% per transaction. Pay-by-Bank — 0% processing fee (customer pays directly from bank). Cash — no processing fee but has handling costs. To optimize: encourage Dutchie Pay adoption (saves ~1.4% per transaction), set minimum card transaction amounts where legal, review your monthly statement in Reports > Payment Summary for fee analysis. Contact your account manager to discuss volume-based rate negotiations for stores processing $100K+/month.', relatedArticles: ['kb-017'] },
  { id: 'kb-019', title: 'Processing Refunds', category: 'Payments', tags: ['refund', 'return', 'cancel', 'void', 'payment', 'money back', 'chargeback'], navPath: 'Orders > [Order] > Refund', steps: ['Find order in Orders and click "Refund"', 'Choose full or partial refund, select items', 'Add a reason for the refund', 'Dutchie Pay: 3-5 business days; Credit/Debit: 5-10 days', 'Cash: process in-store and mark in POS', 'For chargebacks: respond within 10 days with evidence'], content: 'Go to Orders > find the order > click "Refund." Choose full or partial refund, select items, and add a reason. Refund timelines by method: Dutchie Pay (ACH) — 3-5 business days. Credit/Debit — 5-10 business days. Cash — process in-store and mark in POS. Pay-by-Bank — 3-5 business days. For chargebacks, you\'ll receive an email notification — respond within 10 days with evidence (receipt, delivery confirmation, ID verification). Chargeback rate above 1% may trigger a review from the payment processor.', relatedArticles: ['kb-017'] },
  { id: 'kb-020', title: 'PCI Compliance & Payment Security', category: 'Payments', tags: ['pci', 'compliance', 'security', 'payment', 'data', 'encryption', 'safe'], content: 'Dutchie is PCI DSS Level 1 certified — the highest level of payment security. All card data is tokenized and never stored on your devices. For your part: never write down card numbers, ensure your WiFi network is secured with WPA3, keep POS devices updated to the latest software version, and restrict POS network access to authorized devices only. Dutchie handles quarterly security scans and annual audits automatically. Your SAQ (Self-Assessment Questionnaire) is simplified because Dutchie manages the payment infrastructure.', relatedArticles: ['kb-017'] },

  // ── Compliance ──
  { id: 'kb-021', title: 'METRC Integration Setup', category: 'Compliance', tags: ['metrc', 'compliance', 'tracking', 'seed to sale', 'integration', 'sync', 'api', 'connect'], navPath: 'Integrations > METRC', steps: ['Log into METRC → Admin > API Keys > Generate new key', 'Enter API key and facility license number in Dutchie', 'Select data to sync: inventory, sales, transfers, packages', 'Run initial sync (15-60 min depending on inventory size)', 'Check sync status dashboard daily at Integrations > METRC > Status', 'If sync fails, verify API key hasn\'t expired'], content: 'Go to Integrations > METRC. Steps: 1) Log into your METRC account and generate an API key (Admin > API Keys > Generate). 2) Enter the API key and your facility license number in Dutchie. 3) Select which data to sync: inventory, sales, transfers, packages. 4) Run initial sync (can take 15-60 min depending on inventory size). Dutchie automatically syncs sales in real-time and inventory every 15 minutes. Check the sync status dashboard (Integrations > METRC > Status) daily to catch discrepancies. Common issue: if sync fails, verify your API key hasn\'t expired and your METRC account is in good standing.', relatedArticles: ['kb-022', 'kb-023'] },
  { id: 'kb-022', title: 'State Compliance Reporting', category: 'Compliance', tags: ['state', 'reporting', 'compliance', 'regulatory', 'required', 'reports', 'tax'], navPath: 'Reports > Compliance', steps: ['Go to Reports > Compliance for auto-generated state reports', 'Review daily sales, tax summaries, and inventory movement logs', 'Schedule automatic report generation (daily/weekly/monthly)', 'For tax filing: use Reports > Tax Summary for state/local/excise breakdown', 'Export as CSV for accounting software import'], content: 'Go to Reports > Compliance. Dutchie auto-generates state-required reports including: daily sales by category, tax collection summaries, inventory movement logs, and destruction/waste reports. Reports are formatted to match your state\'s requirements (CO, CA, OR, WA, IL, MI, etc.). Schedule automatic report generation (daily, weekly, monthly) and email delivery. For tax filing, use Reports > Tax Summary which breaks down state, local, and excise taxes collected. Export as CSV for import into your accounting software.', relatedArticles: ['kb-021'] },
  { id: 'kb-023', title: 'Purchase Limits & Allotment Tracking', category: 'Compliance', tags: ['purchase limit', 'allotment', 'limit', 'maximum', 'quantity', 'daily limit', 'compliance'], navPath: 'Settings > Compliance > Purchase Limits', steps: ['Configure limits by product type (e.g., 1 oz flower, 8g concentrate)', 'System auto-enforces limits at both online checkout and POS', 'Set separate limits for medical patients (typically higher)', 'POS shows warning when customer approaches their limit', 'Exceeded limits block the transaction automatically', 'Allotment data syncs with METRC where applicable'], content: 'Go to Settings > Compliance > Purchase Limits. Dutchie enforces state-mandated purchase limits automatically at checkout (both online and POS). Configure limits by product type (e.g., 1 oz flower, 8g concentrate per transaction in CO). The system tracks daily allotments per customer using ID verification data. If a customer approaches their limit, POS shows a warning. Exceeded limits block the transaction. For medical patients, configure separate (typically higher) limits. Allotment data syncs with METRC where applicable.', relatedArticles: ['kb-024'] },
  { id: 'kb-024', title: 'ID Verification & Age Gate', category: 'Compliance', tags: ['id', 'verification', 'age', 'scan', 'identity', 'check', 'drivers license', '21'], navPath: 'Settings > Compliance > ID Verification', steps: ['Choose verification method: manual entry, barcode scan, or digital', 'For POS: scan barcode on back of driver\'s license', 'System validates age, expiration, and flags out-of-state IDs', 'Enable "scan required" for mandatory ID scan per transaction', 'Online orders verify at account creation and pickup/delivery'], content: 'Dutchie supports multiple ID verification methods: manual entry (DOB check), barcode scanning (via POS hardware), and digital verification (online orders). For POS, scan the barcode on the back of the driver\'s license — the system validates age, expiration, and flags out-of-state IDs for additional review. For online orders, customers verify age at account creation and again at pickup/delivery. Configure in Settings > Compliance > ID Verification. Enable "scan required" to mandate physical ID scan for every transaction (recommended for audit compliance).', relatedArticles: ['kb-023'] },
  { id: 'kb-025', title: 'Manifest Management & Transfers', category: 'Compliance', tags: ['manifest', 'transfer', 'transport', 'shipment', 'package', 'receiving', 'metrc'], navPath: 'Inventory > Transfers', steps: ['For receiving: scan METRC transfer manifest barcode', 'Verify package contents against the manifest', 'Accept or reject items (updates inventory + METRC)', 'For outbound: create transfer in Dutchie (auto-generates METRC manifest)', 'Print manifest for driver with package tags, quantities, route info', 'All transfers logged with timestamps and employee signatures'], content: 'Go to Inventory > Transfers to manage inbound and outbound manifests. For receiving: scan the METRC transfer manifest barcode, verify package contents against the manifest, accept or reject items, and the system updates inventory and METRC simultaneously. For outbound (store-to-store transfers), create a transfer in Dutchie which auto-generates the METRC manifest. Print the manifest for the driver — it includes package tags, quantities, and route info. All transfers are logged with timestamps and employee signatures for audit trails.', relatedArticles: ['kb-021'] },

  // ── Integrations ──
  { id: 'kb-026', title: 'Leafly Integration', category: 'Integrations', tags: ['leafly', 'integration', 'listing', 'marketplace', 'syndicate', 'menu sync'], navPath: 'Integrations > Leafly', steps: ['Go to Integrations > Leafly', 'Enter your Leafly API credentials to connect', 'Menu syncs automatically (inventory every 5 min, orders real-time)', 'Enable "Leafly Pickup" and "Leafly Delivery" for marketplace orders', 'Leafly orders appear in your Dutchie order queue'], content: 'Go to Integrations > Leafly. Connect your Leafly account by entering your Leafly API credentials. Once connected, your Dutchie menu syncs to Leafly automatically — prices, inventory, and product details update in real-time. Orders placed on Leafly flow directly into your Dutchie order queue. Enable "Leafly Pickup" and "Leafly Delivery" to accept orders through Leafly\'s marketplace. Sync frequency: every 5 minutes for inventory, real-time for orders. Tip: ensure product names match between platforms for the best customer experience.', relatedArticles: ['kb-027'] },
  { id: 'kb-027', title: 'Weedmaps Integration', category: 'Integrations', tags: ['weedmaps', 'integration', 'listing', 'marketplace', 'menu sync'], content: 'Go to Integrations > Weedmaps. Enter your Weedmaps listing ID to link your account. Dutchie pushes your menu, pricing, and inventory to Weedmaps. Weedmaps orders appear in your Dutchie dashboard alongside direct orders. You can differentiate order sources in Reports > Orders by Source. Sync happens every 10 minutes for menu data. Note: Weedmaps iFrame ordering uses your Dutchie checkout flow, maintaining a consistent customer experience.', relatedArticles: ['kb-026'] },
  { id: 'kb-028', title: 'Google Business Profile Integration', category: 'Integrations', tags: ['google', 'business', 'profile', 'maps', 'search', 'listing', 'gbp', 'local'], content: 'Go to Integrations > Google Business. Link your Google Business Profile to show real-time menu data, store hours, and an "Order Online" button directly in Google Search and Maps results. Dutchie sends your menu data to Google via their API. This drives significant organic traffic — dispensaries with GBP integration see 20-35% more online orders from Google Search. Ensure your address, phone, and hours match between Dutchie and Google for best SEO results.', relatedArticles: ['kb-004'] },
  { id: 'kb-029', title: 'Loyalty Platform Integrations (Alpine IQ, Springbig)', category: 'Integrations', tags: ['loyalty', 'alpine iq', 'springbig', 'integration', 'rewards', 'crm', 'points'], navPath: 'Integrations > Loyalty', steps: ['Go to Integrations > Loyalty', 'Enter API credentials for Alpine IQ, Springbig, or other platform', 'Customers auto-earn points on Dutchie purchases (online + POS)', 'Loyalty discounts auto-apply at checkout', 'Customer profiles sync bidirectionally', 'Customers see and redeem rewards at checkout or POS'], content: 'Go to Integrations > Loyalty. Dutchie integrates with Alpine IQ, Springbig, and other loyalty platforms. Enter your API credentials to connect. Once linked: customers earn points on Dutchie purchases (online and POS), loyalty discounts auto-apply at checkout, and customer profiles sync bidirectionally. Configure point-earning rules in your loyalty platform — they push to Dutchie via API. Customers can see and redeem rewards during online checkout or at POS when their profile is pulled up.', relatedArticles: ['kb-039'] },
  { id: 'kb-030', title: 'QuickBooks & Accounting Integrations', category: 'Integrations', tags: ['quickbooks', 'accounting', 'integration', 'financial', 'bookkeeping', 'export', 'sync'], navPath: 'Integrations > Accounting', steps: ['Go to Integrations > Accounting', 'Authenticate with your Intuit (QuickBooks) account', 'Dutchie syncs daily sales, taxes, refunds, and processing fees', 'Customize transaction mapping to your chart of accounts', 'Sync runs automatically daily at midnight', 'For other tools: export CSV from Reports > Financial'], content: 'Go to Integrations > Accounting. Connect QuickBooks Online by authenticating with your Intuit account. Dutchie syncs: daily sales summaries, tax collected by category, refunds, and payment processing fees. Transactions map to your QuickBooks chart of accounts (customizable mapping in Settings). Sync runs daily at midnight. For other accounting tools, export reports as CSV from Reports > Financial and import manually. Tip: set up the integration before month-end to have clean books from day one.', relatedArticles: [] },
  { id: 'kb-031', title: 'Available Integrations Overview', category: 'Integrations', tags: ['integrations', 'available', 'connect', 'third party', 'partners', 'api', 'supported'], content: 'Dutchie integrates with 40+ platforms across categories: Marketplaces (Leafly, Weedmaps, iHeartJane), Loyalty (Alpine IQ, Springbig, Sprout), Compliance (METRC, BioTrack, Leaf Data Systems), Accounting (QuickBooks, TREEZ), CRM (HubSpot via Zapier), Analytics (Google Analytics, Segment), Delivery (Onfleet, DoorDash Drive), Payments (various processors via Dutchie Pay). View all available integrations at Integrations > Marketplace. Most integrations are self-service — connect in under 10 minutes with your API credentials. Custom integrations are available via Dutchie\'s open API (contact your account manager for API access).', relatedArticles: ['kb-026', 'kb-027', 'kb-028'] },

  // ── Marketing ──
  { id: 'kb-039', title: 'Promotions & Deals Engine', category: 'Marketing', tags: ['promotion', 'deal', 'discount', 'bogo', 'sale', 'coupon', 'promo code', 'offer'], navPath: 'Marketing > Promotions > Create', steps: ['Choose promotion type: % off, $ off, BOGO, bundle, free item, or tiered', 'Set conditions: date range, categories, customer segments, minimums', 'Set usage limits (per customer or total)', 'Promotions auto-appear on deals page and auto-apply at checkout', 'Track in Reports > Promotion Performance (redemptions, revenue, margin)'], content: 'Go to Marketing > Promotions > Create. Promotion types: Percentage off, Dollar off, BOGO (buy one get one), Bundle deals, Free item with purchase, and Tiered discounts (spend $100, get 15% off). Set conditions: date range, product/category restrictions, customer segments (new vs returning), minimum purchase, usage limits (per customer or total). Promotions appear on your storefront\'s deals page and auto-apply at checkout (POS and online). Track performance in Reports > Promotion Performance — see redemptions, revenue impact, and margin effect.', relatedArticles: ['kb-013'] },
  { id: 'kb-040', title: 'SMS Marketing Campaigns', category: 'Marketing', tags: ['sms', 'text', 'campaign', 'marketing', 'message', 'opt in', 'blast', 'notification'], navPath: 'Marketing > SMS Campaigns', steps: ['Select customer segment (all, VIP, inactive, by purchase history)', 'Compose message with merge fields (first name, last purchase)', 'Include opt-out language ("Reply STOP to unsubscribe")', 'Schedule send time (avoid early morning/late night)', 'Add trackable short links', 'Review delivery rate, open rate, and resulting orders after send'], content: 'Go to Marketing > SMS Campaigns. Build SMS campaigns with: customer segments (all, VIP, inactive, by purchase history), personalized merge fields (first name, last purchase), scheduled send times (avoid early morning/late night), and trackable short links. Compliance: customers must opt in (collected at checkout or sign-up). Include opt-out language ("Reply STOP to unsubscribe") in every message. Character limit: 160 chars. Dutchie tracks delivery rate, open rate, and resulting orders. Best practice: 2-3 SMS campaigns per week maximum to avoid opt-out fatigue.', relatedArticles: ['kb-041'] },
  { id: 'kb-041', title: 'Email Marketing', category: 'Marketing', tags: ['email', 'marketing', 'campaign', 'newsletter', 'blast', 'template', 'automation'], navPath: 'Marketing > Email', steps: ['Create campaign using drag-and-drop templates or custom HTML', 'Add product showcases with live pricing', 'Set up automated flows (welcome series, win-back, birthday)', 'Segment audience by purchase frequency, AOV, preferences', 'A/B test subject lines', 'Authenticate domain (SPF/DKIM) at Settings > Email > Domain Verification'], content: 'Go to Marketing > Email. Create email campaigns using drag-and-drop templates or custom HTML. Features: product showcases with live pricing, personalized recommendations based on purchase history, automated flows (welcome series, win-back, birthday), and A/B testing subject lines. Segment by: purchase frequency, average order value, product preferences, last visit date. Track opens, clicks, and attributed revenue. Dutchie\'s email tool integrates with your customer database — no CSV exports needed. Deliver ability tip: authenticate your domain (SPF/DKIM) in Settings > Email > Domain Verification.', relatedArticles: ['kb-040'] },
  { id: 'kb-042', title: 'Customer Segmentation & Targeting', category: 'Marketing', tags: ['segment', 'target', 'customer', 'audience', 'group', 'personalize', 'cohort'], navPath: 'Customers > Segments', steps: ['Go to Customers > Segments > Create', 'Add filters: purchase history, spending tiers, visit frequency', 'Add product preference and engagement filters', 'Segments update automatically as customers meet criteria', 'Use segments for targeted promos, SMS/email, and POS alerts', 'Pre-built segments available: New, At Risk, Top Spenders, Loyalists'], content: 'Go to Customers > Segments. Create dynamic customer segments using filters: purchase history (bought product X in last 30 days), spending tiers (VIP = $500+/mo), visit frequency (weekly, monthly, lapsed), product preferences (flower lovers, edible enthusiasts), demographics, and engagement (opened last email, redeemed rewards). Segments update automatically as customers meet criteria. Use segments for targeted promotions, SMS/email campaigns, and in-store POS alerts (when a VIP customer checks in). Pre-built segments include: New Customers, At Risk, Top Spenders, and Product-Category Loyalists.', relatedArticles: ['kb-040', 'kb-041'] },
  { id: 'kb-032', title: 'Loyalty Program Setup', category: 'Marketing', tags: ['loyalty', 'rewards', 'points', 'program', 'members', 'discounts', 'earn', 'redeem'], navPath: 'Marketing > Loyalty Program', steps: ['Enable point earning (default: 1 point per $1)', 'Configure reward tiers (Bronze, Silver, Gold)', 'Set redemption options (dollars off, free products, exclusive access)', 'Enable double-point days or categories', 'Set up birthday rewards and referral bonuses', 'Choose enrollment method (auto at checkout or sign-up)'], content: 'Go to Marketing > Loyalty Program. Enable point earning (default: 1 point per $1 spent). Configure: reward tiers (Bronze, Silver, Gold with increasing benefits), redemption options (points for dollars off, free products, or exclusive access), double-point days or categories, birthday rewards, and referral bonuses. Customers enroll at checkout (auto-enrollment option available) or through your online store. Promote via in-store signage, receipt messages, and email. Track program metrics in Reports > Loyalty — see enrollment rate, redemption rate, and incremental revenue from loyalty members.', relatedArticles: ['kb-029'] },

  // ── Operations ──
  { id: 'kb-043', title: 'Delivery Zone Management & Driver Dispatch', category: 'Operations', tags: ['delivery', 'zone', 'driver', 'dispatch', 'route', 'tracking', 'fleet'], navPath: 'Settings > Delivery / Operations > Dispatch', steps: ['Create delivery zones using polygon map tool', 'Set per-zone rules: minimum order, delivery fee, estimated time', 'Set max concurrent deliveries per zone', 'Assign orders to drivers in Operations > Dispatch', 'Drivers use Dutchie Driver app (iOS/Android) for navigation + delivery', 'Customers get real-time tracking via SMS updates'], content: 'Go to Settings > Delivery. Create delivery zones using the polygon map tool — draw custom shapes to cover your service area precisely. Set per-zone rules: minimum order, delivery fee, estimated time, and max concurrent deliveries. For driver management, go to Operations > Dispatch. Assign orders to drivers, view real-time GPS tracking, and optimize routes. Drivers use the Dutchie Driver app (iOS/Android) to receive orders, navigate, confirm delivery, and collect signatures. Integrate with Onfleet for advanced fleet management. Customers get real-time delivery tracking via SMS updates.', relatedArticles: ['kb-008'] },
  { id: 'kb-044', title: 'Order Throttling & Capacity Management', category: 'Operations', tags: ['throttle', 'capacity', 'limit', 'orders', 'busy', 'queue', 'overflow', 'pause'], navPath: 'Settings > Order Management > Throttling', steps: ['Set max orders per time window (e.g., 20 per 30-min slot)', 'Configure separately for pickup, delivery, and curbside', 'When capacity reached, next available slot shown to customers', 'Use "Pause Orders" button for unexpected rushes', 'Set auto-throttle rules to extend prep times when queue exceeds threshold'], content: 'Go to Settings > Order Management > Throttling. Set maximum orders per time window (e.g., 20 orders per 30-minute slot for pickup). When capacity is reached, the next available time slot is shown to online customers. Configure separately for pickup, delivery, and curbside. Use the "Pause Orders" button on the dashboard during unexpected rushes — this temporarily stops new online orders with a custom message. Set up auto-throttle rules: if order queue exceeds X items, automatically extend prep times. This prevents kitchen/packing overload and maintains customer satisfaction.', relatedArticles: [] },
  { id: 'kb-045', title: 'Inventory Sync & Multi-Location Management', category: 'Operations', tags: ['inventory', 'sync', 'multi location', 'stock', 'transfer', 'multi store', 'warehouse'], navPath: 'Settings > Locations', steps: ['Go to Settings > Locations to manage all stores', 'Each location has independent inventory, menus, hours, and staff', 'Inventory syncs with POS in real-time (every sale, return, adjustment)', 'For METRC stores: inventory syncs bidirectionally with METRC', 'Transfer between locations at Inventory > Transfers', 'View consolidated reporting at Reports > Multi-Location Summary'], content: 'For multi-location operators: go to Settings > Locations to manage all stores from one admin account. Each location has independent inventory, menus, hours, and staff. Inventory syncs with your POS in real-time — every sale, return, and adjustment updates immediately. For METRC-connected stores, inventory also syncs bidirectionally with METRC. To transfer inventory between locations, go to Inventory > Transfers and create an inter-store transfer (auto-generates METRC manifest if applicable). View consolidated reporting across all locations in Reports > Multi-Location Summary.', relatedArticles: ['kb-021', 'kb-046'] },
  { id: 'kb-046', title: 'Inventory Adjustments & Audits', category: 'Operations', tags: ['inventory', 'adjustment', 'audit', 'count', 'discrepancy', 'shrinkage', 'cycle count'], navPath: 'Inventory > Adjustments / Inventory > Audit', steps: ['For manual adjustments: Inventory > Adjustments', 'Select reason code (breakage, samples, miscounts, vendor returns)', 'For full audits: Inventory > Audit > generate count sheet', 'Record physical counts — system highlights discrepancies', 'Schedule weekly cycle counts by category for high-value items', 'Track shrinkage trends in Reports > Inventory Variance'], content: 'Go to Inventory > Adjustments. Make manual adjustments for: breakage/damage, samples, miscounts, or vendor returns. Each adjustment requires a reason code and optional notes. For full audits, use Inventory > Audit — generate a count sheet, record physical counts, and the system highlights discrepancies. Cycle counts (partial audits) can be scheduled weekly by category. All adjustments create an audit trail and sync to METRC. Track shrinkage trends in Reports > Inventory Variance. Best practice: run cycle counts weekly on high-value items and full audits monthly.', relatedArticles: ['kb-045'] },

  // ── Troubleshooting ──
  { id: 'kb-047', title: 'METRC Sync Errors & Resolution', category: 'Troubleshooting', tags: ['metrc', 'sync', 'error', 'failed', 'api', 'connection', 'troubleshoot', 'fix'], navPath: 'Integrations > METRC > Sync Log', steps: ['"API Key Expired" → Regenerate in METRC admin, update in Dutchie', '"Package Not Found" → Verify tag exists in METRC directly', '"Duplicate Package" → Check your METRC receiving history', '"Rate Limit Exceeded" → Dutchie auto-retries in 15 minutes', '"Facility Mismatch" → Update license number in Settings'], content: 'Common METRC sync issues and fixes: 1) "API Key Expired" — regenerate in METRC admin and update in Dutchie (Integrations > METRC). 2) "Package Not Found" — the METRC package tag doesn\'t exist; verify the tag in METRC directly. 3) "Duplicate Package" — a package was already received; check your METRC history. 4) "Rate Limit Exceeded" — too many API calls; Dutchie auto-retries in 15 minutes. 5) "Facility Mismatch" — your license number in Dutchie doesn\'t match METRC; update in Settings. Check sync status at Integrations > METRC > Sync Log for detailed error messages and retry options.', relatedArticles: ['kb-021'] },
  { id: 'kb-048', title: 'Payment Processing Failures', category: 'Troubleshooting', tags: ['payment', 'failed', 'declined', 'error', 'processing', 'transaction', 'card', 'not working'], navPath: 'Reports > Failed Transactions', steps: ['"Card Declined" → Ask customer for another card', '"Terminal Not Responding" → Restart Dejavoo (hold power 10 sec)', '"Connection Error" → Check WiFi/internet connection', '"Dutchie Pay Failed" → Customer re-links bank account via Plaid', '"Processing Timeout" → Retry; if persistent, switch to cash', 'Check Reports > Failed Transactions for patterns'], content: 'Common payment failure causes: 1) "Card Declined" — customer\'s bank rejected the transaction; ask for another card. 2) "Terminal Not Responding" — restart the Dejavoo terminal (hold power 10 seconds). 3) "Connection Error" — check WiFi/internet; POS needs stable internet for card processing. 4) "Dutchie Pay Failed" — customer\'s bank account has insufficient funds or Plaid connection expired; customer needs to re-link. 5) "Processing Timeout" — retry the transaction; if persistent, switch to cash and contact support. Check Reports > Failed Transactions for patterns. For systematic failures, contact Dutchie Support immediately.', relatedArticles: ['kb-017'] },
  { id: 'kb-049', title: 'POS Showing Wrong Inventory Counts', category: 'Troubleshooting', tags: ['inventory', 'wrong', 'incorrect', 'mismatch', 'count', 'discrepancy', 'pos', 'sync', 'off'], navPath: 'POS > Settings > Sync Now', steps: ['Force a sync: POS > Settings > Sync Now', 'Check recent adjustments: Inventory > Audit Log', 'Verify METRC sync: Integrations > METRC > Sync Log', 'Check for pending orders (reserved items reduce available count)', 'Multi-location: verify you\'re viewing the correct location', 'If persistent: run cycle count at Inventory > Audit'], content: 'If POS shows incorrect inventory: 1) Force a sync — go to POS > Settings > Sync Now. 2) Check recent adjustments — Inventory > Audit Log for unexpected changes. 3) Verify METRC sync — if METRC-connected, discrepancies may come from the METRC side; check Integrations > METRC > Sync Log. 4) Check for pending orders — items in open/processing orders are reserved and reduce available count. 5) Multi-location check — ensure you\'re viewing the correct location\'s inventory. If the issue persists, run a cycle count (Inventory > Audit) for the affected products and submit a sync investigation request to Dutchie Support.', relatedArticles: ['kb-045', 'kb-047'] },
  { id: 'kb-050', title: 'Online Menu Not Updating', category: 'Troubleshooting', tags: ['menu', 'not updating', 'stale', 'cache', 'refresh', 'old', 'products', 'storefront'], navPath: 'Menu / Settings > Storefront > Clear Cache', steps: ['Verify changes were published (check "Publish" button in Menu)', 'Clear CDN cache: Settings > Storefront > Clear Cache', 'Have customers hard-refresh browser (Ctrl+Shift+R)', 'Verify product visibility (check eye icon in Menu)', 'Confirm products have category assignments', 'For embedded menus: verify iframe URL hasn\'t changed'], content: 'If your online menu isn\'t reflecting changes: 1) Verify changes were published — go to Menu and check for a "Publish" button (unpublished changes show a yellow indicator). 2) Clear CDN cache — Settings > Storefront > Clear Cache. 3) Check browser cache — have customers hard-refresh (Ctrl+Shift+R). 4) Verify product visibility — hidden products won\'t appear on the storefront (check the eye icon in Menu). 5) Check category assignment — products without a category don\'t display. 6) For embedded menus, ensure the iframe URL hasn\'t changed. Changes typically propagate in under 60 seconds; if longer, contact support.', relatedArticles: ['kb-001'] },
  { id: 'kb-051', title: 'Receipt Printer Not Working', category: 'Troubleshooting', tags: ['printer', 'receipt', 'not printing', 'hardware', 'connection', 'error', 'star', 'setup'], navPath: 'POS > Settings > Hardware', steps: ['Check connection — USB: cable fully seated; Bluetooth: verify pairing', 'Power cycle printer (unplug 10 sec, plug back in)', 'Check paper roll (print side facing up for thermal paper)', 'Verify printer shows "Connected" in POS > Settings > Hardware', 'Print test page from POS > Settings > Hardware > Test Print', 'Star TSP143IV: hold feed button during power-on for self-test'], content: 'Troubleshoot receipt printer: 1) Check the connection — USB: ensure cable is fully seated. Bluetooth: verify pairing in iPad Settings. 2) Power cycle the printer (unplug, wait 10 seconds, plug back in). 3) Check paper — open the cover and verify paper roll is loaded correctly (print side facing up for thermal paper). 4) In POS > Settings > Hardware, verify the printer is listed and shows "Connected." 5) Print a test page from POS > Settings > Hardware > Test Print. 6) For Star TSP143IV specifically: press and hold the feed button during power-on for a self-test. If the self-test prints but POS doesn\'t, the issue is the connection, not the printer.', relatedArticles: ['kb-011'] },
  { id: 'kb-052', title: 'Storefront Loading Slowly', category: 'Troubleshooting', tags: ['slow', 'loading', 'performance', 'speed', 'storefront', 'laggy', 'timeout'], content: 'If your storefront loads slowly: 1) Check product images — oversized images are the #1 cause; compress images to under 500KB each (Dutchie auto-compresses, but source images over 5MB may still slow things). 2) Reduce category count — stores with 20+ categories load slower; consolidate where possible. 3) For embedded storefronts — check your host website\'s performance; slow host = slow iframe. 4) Check browser extensions — ad blockers can interfere with menu loading. 5) Run a speed test on your store URL using Google PageSpeed Insights. Dutchie\'s CDN serves content from edge servers, so geography shouldn\'t be a factor. Contact support if issues persist.', relatedArticles: [] },

  // ── Storefront Customization ──
  { id: 'kb-033', title: 'Branding & Theme Customization', category: 'Customization', tags: ['logo', 'branding', 'design', 'customize', 'theme', 'colors', 'font', 'style'], navPath: 'Settings > Storefront Customization', steps: ['Upload logo (400x400px PNG with transparent background recommended)', 'Set primary brand color (buttons/highlights) and accent color (badges/links)', 'Choose font (6 options from modern to classic)', 'Select header style (sticky or scrollable) and card layout (grid or list)', 'Enable dark mode toggle for customers', 'Preview in real-time, then click "Publish"'], content: 'Go to Settings > Storefront Customization. Upload your logo (recommended: 400x400px PNG with transparent background). Configure: primary brand color (used for buttons and highlights), accent color (used for badges and links), font selection (6 options from modern to classic), header style (sticky or scrollable), and product card layout (grid or list). Enable dark mode toggle for customers. Changes preview in real-time on the right side of the screen and go live when you click "Publish." Stores with customized branding see 15% higher engagement than default themes.', relatedArticles: ['kb-004'] },
  { id: 'kb-034', title: 'Custom Banners & Announcements', category: 'Customization', tags: ['banner', 'announcement', 'alert', 'notification', 'header', 'message', 'promotion banner'], navPath: 'Settings > Storefront > Banners', steps: ['Go to Settings > Storefront > Banners', 'Add up to 3 rotating banners', 'Set custom text, background color/image, and link URL', 'Schedule with start/end dates', 'Configure rotation speed (3-10 seconds)', 'Banners auto-resize for mobile screens'], content: 'Go to Settings > Storefront > Banners. Add up to 3 rotating banners at the top of your storefront. Each banner supports: custom text, background color or image, link URL (e.g., link to a deals page), and scheduling (start/end dates). Use banners for: holiday announcements, flash sales, new product launches, or store policy updates (e.g., "Now offering curbside pickup!"). Banner rotation speed is configurable (3-10 seconds). Mobile-responsive — banners auto-resize for phone screens.', relatedArticles: ['kb-033'] },

  // ── Analytics & Reporting ──
  { id: 'kb-035', title: 'Sales Analytics & Dashboards', category: 'Analytics', tags: ['analytics', 'sales', 'dashboard', 'report', 'metrics', 'revenue', 'data', 'trends'], navPath: 'Reports > Sales Dashboard', steps: ['View key metrics: revenue, order count, AOV, top products, busiest hours', 'Filter by date range, location, and order source', 'Drill into any metric for detailed breakdowns', 'Compare periods (this week vs last, this month vs last)', 'Export as CSV or PDF', 'Set up scheduled daily/weekly email reports'], content: 'Go to Reports > Sales Dashboard. Key metrics at a glance: total revenue, order count, average order value (AOV), top-selling products, busiest hours, and revenue by order type (pickup/delivery/curbside). Filter by date range, location, and order source. Drill into any metric for detailed breakdowns. Compare periods (this week vs last week, this month vs last month). Export any report as CSV or PDF. Set up scheduled reports — automatic daily/weekly email with your key metrics. The dashboard updates in real-time as orders come in.', relatedArticles: ['kb-036'] },
  { id: 'kb-036', title: 'Customer Analytics & Retention', category: 'Analytics', tags: ['customer', 'analytics', 'retention', 'churn', 'cohort', 'lifetime value', 'repeat', 'new'], navPath: 'Reports > Customer Analytics', steps: ['Track new vs returning customer ratio and CLV', 'View purchase frequency and retention by cohort', 'Identify at-risk customers (no visit in 30+ days)', 'See top customers by revenue', 'Use cohort analysis to track behavior over time', 'Target at-risk customers with win-back campaigns'], content: 'Go to Reports > Customer Analytics. Track: new vs returning customer ratio, customer lifetime value (CLV), purchase frequency, retention rate by cohort (week, month), at-risk customers (haven\'t visited in 30+ days), and top customers by revenue. Use cohort analysis to understand how different customer groups behave over time. The "At Risk" report identifies customers likely to churn so you can target them with win-back campaigns. Average cannabis dispensary retention rate: 40-50%; top performers hit 65%+.', relatedArticles: ['kb-042'] },

  // ── In-Store ──
  { id: 'kb-037', title: 'Kiosk Mode Setup', category: 'In-Store', tags: ['kiosk', 'in-store', 'self-service', 'tablet', 'ipad', 'check in', 'self checkout'], navPath: 'Settings > Kiosk Configuration', steps: ['Install Dutchie Kiosk app on iPad (10th gen+) or Android tablet', 'Go to Settings > Kiosk Configuration', 'Configure check-in flow (ID scan or manual entry)', 'Set product browsing mode (full menu or curated)', 'Enable self-checkout if allowed in your state', 'Set idle screen branding and enable auto-lock for security'], content: 'Install the Dutchie Kiosk app on your iPad (iPad 10th gen or newer recommended) or Android tablet. Go to Settings > Kiosk Configuration. Configure: customer check-in flow (ID scan or manual entry), product browsing mode (full menu or curated selection), self-checkout option (if enabled in your state), loyalty enrollment prompt, and idle screen (your branding + "Tap to Start"). Mount the tablet at your entrance using a tablet stand. Kiosks reduce wait times by 40% and increase order accuracy. Enable auto-lock for after-hours security.', relatedArticles: [] },
  { id: 'kb-038', title: 'Digital Menu Boards Setup', category: 'In-Store', tags: ['menu board', 'digital display', 'tv', 'screen', 'signage', 'in-store display', 'monitor'], navPath: 'Settings > Menu Boards', steps: ['Go to Settings > Menu Boards (requires add-on)', 'Connect displays via Chromecast, Apple TV, or media player', 'Select categories to show and set rotation speed', 'Configure pricing display and promotion banners', 'Enable real-time inventory indicators (Low Stock / Sold Out)', 'Recommended: 43-55" at budtender stations, 65"+ for waiting areas'], content: 'Go to Settings > Menu Boards (requires Digital Menu Boards add-on). Connect your displays via Chromecast, Apple TV, or a dedicated media player. Configure: which categories to show, rotation speed, pricing display (show/hide by customer type), promotion banners, and real-time inventory indicators (show "Low Stock" or "Sold Out"). Menu boards update automatically when you change products or prices. Recommended: 43-55" displays at budtender stations, larger 65"+ for waiting areas. Content templates: menu list, product spotlight, and deals carousel.', relatedArticles: [] },

  // ── Advanced / Edge ──
  { id: 'kb-053', title: 'API Access & Custom Integrations', category: 'Advanced', tags: ['api', 'custom', 'integration', 'developer', 'webhook', 'rest', 'documentation'], navPath: 'Settings > API Access', steps: ['Request API access through account manager or Settings > API Access', 'Receive API key and documentation link', 'API supports: menu (read/write), orders, customers, inventory', 'Set up webhooks for real-time order events', 'Rate limits: 100 req/min standard, 500/min enterprise'], content: 'Dutchie offers a RESTful API for custom integrations. Request API access through your account manager or go to Settings > API Access. The API supports: menu management (read/write), order management (read), customer data (read, GDPR compliant), inventory (read), and webhooks for real-time order events. Rate limits: 100 requests/minute for standard, 500/minute for enterprise. API documentation is available at docs.dutchie.com (provided with your API key). Common custom integrations: internal BI dashboards, custom CRM flows, and third-party delivery dispatch systems.', relatedArticles: ['kb-031'] },
  { id: 'kb-054', title: 'Multi-Location Management Best Practices', category: 'Operations', tags: ['multi location', 'multi store', 'enterprise', 'chain', 'franchise', 'centralized'], navPath: 'Organization View (top-right dropdown)', steps: ['Use Organization view to switch locations or see consolidated data', 'Standardize menus: Menu > Copy to Location', 'Centralize promotions — create once, deploy to all locations', 'Set role-based access (store managers see only their location)', 'Compare performance: Reports > Multi-Location', 'Transfer inventory seamlessly between locations'], content: 'For multi-location operators: use the Organization view (top-right dropdown) to switch between locations or view consolidated data. Best practices: 1) Standardize menus across locations using the "Copy Menu" feature (Menu > Copy to Location). 2) Centralize promotions — create once, deploy to all locations. 3) Use role-based access — give store managers access only to their location. 4) Consolidated reporting — Reports > Multi-Location compares performance across stores. 5) Transfer inventory between locations seamlessly. Enterprise accounts get a dedicated account manager and priority support SLA.', relatedArticles: ['kb-045'] },
  { id: 'kb-055', title: 'White Label Mobile App Overview', category: 'Premium', tags: ['white label', 'app', 'mobile', 'ios', 'android', 'branded', 'app store', 'custom app', 'phone'], content: 'The White Label App gives you a fully branded iOS and Android app published under your dispensary name in the App Store and Google Play. Features: your logo, colors, and branding throughout; push notifications for deals and order updates; integrated loyalty program; express reordering from order history; biometric login (Face ID/Touch ID); and real-time order tracking. Dutchie handles app development, submission, updates, and hosting. Setup takes 4-6 weeks from kickoff to app store launch. Customers who use the app order 3x more frequently than web-only customers.', relatedArticles: [] },
];

/* ═══════════════════════════════════════════════════════════════════
   INTELLIGENT SEARCH ENGINE — Fuzzy matching, stemming & synonyms
   ═══════════════════════════════════════════════════════════════════ */

// Simple suffix-based stemmer for common English word endings
function stem(word) {
  if (word.length < 4) return word;
  return word
    .replace(/ies$/, 'y')
    .replace(/ing$/, '')
    .replace(/tion$/, 't')
    .replace(/sion$/, 's')
    .replace(/ment$/, '')
    .replace(/ness$/, '')
    .replace(/able$/, '')
    .replace(/ible$/, '')
    .replace(/ful$/, '')
    .replace(/ous$/, '')
    .replace(/ive$/, '')
    .replace(/ise$/, '')
    .replace(/ize$/, '')
    .replace(/ally$/, '')
    .replace(/ly$/, '')
    .replace(/er$/, '')
    .replace(/ed$/, '')
    .replace(/es$/, '')
    .replace(/s$/, '');
}

// Synonym groups — any word in a group matches any other word in that group
const SYNONYM_GROUPS = [
  ['tablet', 'kiosk', 'ipad', 'self service', 'check in'],
  ['app', 'mobile', 'phone', 'white label', 'branded app', 'ios', 'android'],
  ['fee', 'cost', 'price', 'charge', 'expensive', 'pricing'],
  ['menu', 'products', 'items', 'catalog', 'storefront'],
  ['delivery', 'driver', 'dispatch', 'fleet', 'transport'],
  ['discount', 'promotion', 'deal', 'coupon', 'sale', 'promo', 'offer'],
  ['employee', 'staff', 'budtender', 'worker', 'team member'],
  ['analytics', 'report', 'dashboard', 'metrics', 'data', 'insights'],
  ['compliance', 'regulatory', 'legal', 'regulation', 'state requirement'],
  ['metrc', 'seed to sale', 'track and trace', 'tracking system'],
  ['refund', 'return', 'money back', 'cancel order'],
  ['broken', 'not working', 'error', 'issue', 'problem', 'bug', 'glitch'],
  ['setup', 'set up', 'configure', 'install', 'getting started', 'how to start'],
  ['logo', 'branding', 'theme', 'customize', 'design', 'look and feel'],
  ['loyalty', 'rewards', 'points', 'members', 'membership'],
  ['sms', 'text message', 'text', 'messaging'],
  ['receipt', 'printer', 'print', 'printing'],
  ['inventory', 'stock', 'quantity', 'count', 'on hand'],
  ['order', 'purchase', 'buy', 'checkout', 'transaction'],
  ['integration', 'connect', 'link', 'sync', 'integrate', 'third party'],
  ['customer', 'client', 'shopper', 'buyer', 'patron'],
  ['hardware', 'device', 'equipment', 'terminal', 'scanner'],
  ['payment', 'pay', 'paying', 'cashless', 'card'],
];

function expandSynonyms(words) {
  const expanded = new Set(words);
  for (const word of words) {
    for (const group of SYNONYM_GROUPS) {
      if (group.some(syn => syn === word || word.includes(syn) || syn.includes(word))) {
        group.forEach(syn => expanded.add(syn));
      }
    }
  }
  return [...expanded];
}

export function searchKB(query) {
  const lower = query.toLowerCase().replace(/[?!.,]/g, '');
  const rawWords = lower.split(/\s+/).filter(w => w.length > 1);
  const stemmedQuery = rawWords.map(stem);
  const expandedWords = expandSynonyms(rawWords);

  // Phrases to detect (multi-word matches score higher)
  const phrases = [];
  for (let i = 0; i < rawWords.length - 1; i++) {
    phrases.push(rawWords.slice(i, i + 2).join(' '));
    if (i < rawWords.length - 2) {
      phrases.push(rawWords.slice(i, i + 3).join(' '));
    }
  }

  return KNOWLEDGE_BASE
    .map(article => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();
      const allText = `${titleLower} ${article.tags.join(' ')} ${contentLower}`;

      // Phrase matches (highest value)
      for (const phrase of phrases) {
        if (titleLower.includes(phrase)) score += 8;
        if (allText.includes(phrase)) score += 4;
      }

      // Direct word matches
      for (const word of rawWords) {
        if (titleLower.includes(word)) score += 5;
        if (article.tags.some(t => t.includes(word) || word.includes(t))) score += 4;
        if (contentLower.includes(word)) score += 1;
      }

      // Stemmed matches (catch "setting" → "setup", "configuring" → "configur")
      for (const s of stemmedQuery) {
        if (s.length < 3) continue;
        const titleStemmed = titleLower.split(/\s+/).map(stem).join(' ');
        if (titleStemmed.includes(s)) score += 3;
        if (article.tags.some(t => stem(t).includes(s) || s.includes(stem(t)))) score += 2;
      }

      // Synonym expansion matches
      for (const syn of expandedWords) {
        if (!rawWords.includes(syn)) { // Only score synonyms that weren't in the original query
          if (titleLower.includes(syn)) score += 3;
          if (article.tags.some(t => t.includes(syn))) score += 2;
          if (contentLower.includes(syn)) score += 0.5;
        }
      }

      // Category match bonus
      if (rawWords.some(w => article.category.toLowerCase().includes(w))) score += 2;

      return { ...article, score };
    })
    .filter(a => a.score > 2) // Higher threshold to filter noise
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Return up to 5 articles for richer responses
}

/* ═══════════════════════════════════════════════════════════════════
   INTENT RECOGNITION — Multi-signal with synonym awareness
   ═══════════════════════════════════════════════════════════════════ */

const UPSELL_TRIGGERS = {
  payByBank: ['fees', 'processing fee', 'transaction fee', 'expensive', 'cost', 'credit card', 'processing', 'save money', 'bank', 'ach', 'pay by bank', 'cheaper', 'lower fees', 'reduce cost', 'payment cost'],
  whiteLabel: ['brand', 'branding', 'app store', 'own app', 'white label', 'custom app', 'branded app', 'ios app', 'android app', 'mobile app', 'phone app', 'customers order from phone', 'order from their phone', 'order on phone', 'phone ordering', 'native app'],
  menuBoards: ['menu board', 'digital display', 'in-store display', 'signage', 'tv display', 'screen', 'digital menu', 'in store menu', 'waiting room', 'display menu'],
  b2cAI: ['ai recommend', 'recommendation', 'personalize', 'personalization', 'suggest products', 'artificial intelligence', 'smart recommend', 'automated suggest', 'basket size', 'upsell ai', 'cross-sell ai', 'ai powered'],
};

export function detectIntent(text, products) {
  const lower = text.toLowerCase();

  // ── Nexus Action routing — direct widget clicks to operational data views ──
  // Compliance / METRC / regulatory queries
  if (/\bmetrc reconciliation\b|reconciliation (overdue|status|behind)/.test(lower)) return { lane: 'nexus_action', action: 'metrc_recon' };
  if (/\bmetrc (package|tag) queue\b|\bpackages? awaiting\b|\bmetrc tags?\b/.test(lower)) return { lane: 'nexus_action', action: 'metrc_queue' };
  if (/\bbatche?s?.{0,12}expir(ing|e|ation)\b|\bdestruction manifest\b|\bexpiring.{0,8}batch/.test(lower)) return { lane: 'nexus_action', action: 'batch_expiry' };
  if (/\b(regulatory|license renewal|regulation|rule) (change|update|due|coming|upcoming)\b|\bregulatory changes\b|\blicense renewals?\b/.test(lower)) return { lane: 'nexus_action', action: 'regulatory' };
  if (/\bcompliance status\b|\bcompliance.{0,12}(store|state|all)\b|\bmetrc compliance\b/.test(lower)) return { lane: 'nexus_action', action: 'compliance_all' };
  // Cross-store transfer queries
  if (/\btransfer \d+ units?\b|\btransfer.{0,20}(from|to)\b|\bcross.?store transfer\b|\brebalance\b/.test(lower)) return { lane: 'nexus_action', action: 'cross_transfer' };
  // Best practice / replication queries
  if (/\breplicate (at|across)\b|\bdeploy (at|across)\b|\bbest practice\b|\bimplement.{0,10}(across|at other)\b/.test(lower)) return { lane: 'nexus_action', action: 'practices' };
  // Customer experience improvement queries
  if (/\bcustomer experience\b|\bcx improvement\b|\bimprove.{0,8}experience\b/.test(lower)) return { lane: 'nexus_action', action: 'cx_improvements' };
  // Marketing campaign performance (not launch — that goes to marketing lane)
  if (/\bmarketing campaigns? performing\b|\bcampaign performance\b|\bhow are.{0,6}campaigns?\b/.test(lower)) return { lane: 'nexus_action', action: 'daily_flash' };

  // Pricing / revenue management detection — trigger before marketing
  // Must require clear pricing-action intent; avoid grabbing how-to / KB queries
  // that merely mention pricing words in a support context
  const pricingActionPatterns = /\b(change.{0,8}prices?|raise.{0,8}prices?|lower.{0,8}prices?|adjust.{0,8}prices?|update.{0,8}prices?|set.{0,8}prices?|re-?price|create.{0,12}discount|new discount|discount roi|discount review|discount audit|discount waste|discount effectiveness|price benchmark|price comparison|price analysis|price scenarios?|compare.{0,8}(my |our )?(prices?|pricing)|my pricing|our pricing|my prices|our prices|my margins?|our margins?|my discounts?|our discounts?|review.{0,8}discounts?|overpriced|underpriced|gross price|net price|revenue management|price.{0,6}vs.{0,6}market|pricing (tool|agent|dashboard))\b/;
  if (pricingActionPatterns.test(lower)) {
    // Exclude how-to / integration / compliance KB queries
    // But allow possessive data questions like "how are my margins", "how are our prices"
    const isPossessiveDataQ = /\b(how are (my|our)|how do (my|our)|what are (my|our)|show me (my|our))\b/.test(lower);
    const isKBQuery = !isPossessiveDataQ && /\b(how (do|does|to|is|are)|set up|configure|integrate|integration|compliance|metrc|biotrack|leafdata|api|pos |point of sale)\b/.test(lower);
    if (!isKBQuery) {
      return { lane: 'pricing' };
    }
  }

  // Marketing campaign detection — trigger before bug/feature patterns
  const marketingPatterns = /\b(marketing campaign|run a campaign|launch a campaign|create a campaign|brand spotlight|flash sale|promotional campaign|email campaign|sms campaign|push campaign|promote|win.?back|re-?engage|lapsed customers|birthday campaign|loyalty campaign|4\/20 campaign|seasonal campaign|holiday campaign|product launch campaign)\b/;
  if (marketingPatterns.test(lower)) {
    return { lane: 'marketing' };
  }
  // Also catch brand-specific marketing requests
  if (/\b(campaign|marketing|promote)\b/.test(lower) && /\b(jeeter|stiiizy|kiva|wyld|cookies|raw garden|alien labs|plus gummies|edibles|pre.?rolls?|vapes?)\b/.test(lower)) {
    return { lane: 'marketing' };
  }

  // Review feed — specific review browsing requests (must be before broader sentiment lane)
  const reviewFeedPatterns = /\b(show me reviews?|recent reviews?|latest( customer)? reviews?|last week'?s? reviews?|this week'?s? reviews?|this month'?s? reviews?|last month'?s? reviews?|5[- ]star|4[- ]star|3[- ]star|2[- ]star|1[- ]star|read reviews?|pull up reviews?|find reviews?|reviews? (about|mentioning|for|from|with|containing)|worst reviews?|best reviews?|top rated|lowest rated|angry reviews?|bad reviews?|good reviews?|great reviews?|customer reviews?)\b/;
  if (reviewFeedPatterns.test(lower)) {
    return { lane: 'reviews' };
  }

  // Sentiment / NPS / aggregate analytics — broader sentiment dashboard
  const sentimentPatterns = /\b(sentiment|nps|net promoter|customer feedback|customer sentiment|what are (customers|people) saying|brand sentiment|brand perception|reputation|ratings|customer complaints?|complaints?|how do customers feel|happy customers?|unhappy customers?|satisfaction|customer satisfaction|csat|feedback trends?|review trends?|what do people think|word cloud|top words?|mentions)\b/;
  if (sentimentPatterns.test(lower)) {
    return { lane: 'sentiment' };
  }
  // Source-specific queries go to sentiment aggregate view
  if (/\b(reddit|leafly|weedmaps|google reviews?)\b/.test(lower) && !/\b(show|read|pull|find|recent|latest|last)\b/.test(lower)) {
    return { lane: 'sentiment' };
  }

  // Reporting / analytics / performance detection
  // Guard: how-to questions about reports/analytics tools go to KB, not reporting lane
  const reportingPatterns = /\b(sales|revenue|performance|performing|report|reporting|analytics|metrics|kpi|average order|aov|basket size|transactions|conversion|year over year|yoy|week over week|wow|month over month|mom|compare|vs market|versus market|market average|benchmark|how are we doing|how did we do|how are .{0,20} doing|how did .{0,20} do|how is .{0,20} doing|top sellers|best sellers|top selling|best selling|selling best|top products|worst products|bottom products|daily sales|weekly sales|monthly sales|quarterly|growth rate|trend|customer count|ticket average|units sold|gross margin|profit margin|net revenue|margins?)\b/;
  const isReportingHowTo = /\b(how (do|does|to|is|are)|set up|configure|integrate|integration|where.{0,10}find|export|pull.{0,6}report|run.{0,6}report|generate.{0,6}report)\b/.test(lower) && !/\b(how (are|is) .{0,20} (doing|performing)|how did .{0,20} do)\b/.test(lower);
  if (reportingPatterns.test(lower) && !isReportingHowTo) {
    return { lane: 'reporting' };
  }

  // Connect / inventory / purchasing detection — broad patterns
  // Guard: if query is a how-to about inventory processes (cycle counts, metrc, compliance), route to KB
  const isInventoryHowTo = /\b(how (do|does|to|is)|set up|configure|integrate|integration|compliance|metrc|biotrack|leafdata|cycle count|void|return)\b/.test(lower) && /\b(inventory|stock)\b/.test(lower);
  const connectPatterns = /\b(reorder(ing)?|re-?stock(ing)?|out of stock|stockout|low stock|low inventory|inventory analysis|inventory check|check inventory|inventory report|purchasing|explore new products|trending products|margin analysis|vendor comparison|supplier|dead stock|replenish|what should we stock|catalog gaps|order optimization|seasonal forecast|running low|run out|running out|don't run out|need to order|need more|stock up|keep stocked|well.?stocked|fully stocked|shelf|fill the shelves?|supply chain|purchase order|po for|place.?an? order|order more|what do (i|we) need|what should (i|we) (buy|order)|inventory$|inventory\b|stock level|stock check|top up)\b/;
  if (connectPatterns.test(lower) && !isInventoryHowTo) {
    return { lane: 'connect' };
  }
  // Brand + inventory/stock context → connect (not marketing)
  if (/\b(jeeter|stiiizy|kiva|wyld|cookies|raw garden|alien labs|plus|papa.?barkley)\b/.test(lower) && /\b(stock|inventory|order|supply|run out|running low|need more|reorder|enough)\b/.test(lower)) {
    return { lane: 'connect' };
  }

  // Bug / issue detection — look for problem language
  const bugPatterns = /\b(bug|broken|crash|error|glitch|lag|lagging|slow|not working|issue|problem|fix|doesn't work|won't load|stuck|freeze|freezing|down|outage|failing|fail)\b/;
  if (bugPatterns.test(lower)) {
    // Check if it's an inventory discrepancy (support, not bug)
    if (/inventory|stock|count|quantity/.test(lower) && /wrong|incorrect|off|mismatch|discrepancy/.test(lower)) {
      return { lane: 'support' };
    }
    return { lane: 'feedback', type: 'bug' };
  }

  // Feature request detection
  const featurePatterns = /\b(feature request|wish list|would be nice|suggest|idea|could you add|want to see|enhancement|new feature|please add|would love|be great if|can you build)\b/;
  if (featurePatterns.test(lower)) {
    return { lane: 'factory', type: 'feature' };
  }

  // Upsell detection — only trigger if the product isn't active
  for (const [product, triggers] of Object.entries(UPSELL_TRIGGERS)) {
    if (products && products[product] && products[product].active) continue; // Skip if already active
    if (triggers.some(t => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower))) {
      return { lane: 'upsell', product };
    }
  }

  // Default to support/KB
  return { lane: 'support' };
}

/* ═══════════════════════════════════════════════════════════════════
   RESPONSE SYNTHESIS ENGINE — Natural language answers
   ═══════════════════════════════════════════════════════════════════ */

export function synthesizeResponse(query, articles) {
  if (!articles || articles.length === 0) return null;

  const lower = query.toLowerCase();
  const topArticle = articles[0];
  const hasMultipleRelevant = articles.length > 1 && articles[1].score > articles[0].score * 0.4;

  // Build a conversational response based on what was asked
  let response = '';

  // Detect question type for framing
  const isHowTo = /\b(how|setup|set up|configure|connect|create|enable|start|install|add|change|update|manage)\b/i.test(lower);
  const isWhat = /\b(what|which|list|show|available|support|offer|overview|explain|tell me about)\b/i.test(lower);
  const isTroubleshoot = /\b(wrong|incorrect|not working|error|fail|issue|problem|fix|troubleshoot|help|broken|won't|can't|doesn't)\b/i.test(lower);
  const isCan = /\b(can i|can we|is it possible|do you support|does dutchie|able to|capability)\b/i.test(lower);

  if (isTroubleshoot) {
    // Troubleshooting response — empathetic, actionable
    response = `I understand that can be frustrating — let me help you resolve this. `;
    // Extract the key steps from the top article's content
    const content = topArticle.content;
    const steps = content.match(/\d\)[^.]+\./g) || content.match(/\d+\)[^.]+\./g);
    if (steps && steps.length > 0) {
      response += `Here are the most common fixes:\n\n`;
      steps.slice(0, 4).forEach(step => {
        response += `${step.trim()}\n`;
      });
      if (steps.length > 4) {
        response += `\n...and ${steps.length - 4} more steps in the full article below.`;
      }
    } else {
      // Just use first 2 sentences of content
      const sentences = content.split(/\.\s+/);
      response += sentences.slice(0, 3).join('. ') + '.';
    }
    if (hasMultipleRelevant) {
      response += `\n\nI've also pulled up ${articles.length - 1} related article${articles.length > 2 ? 's' : ''} that might help.`;
    }
  } else if (isHowTo) {
    // How-to response — direct instructions
    const sentences = topArticle.content.split(/\.\s+/);
    response = sentences.slice(0, 3).join('. ') + '.';
    if (sentences.length > 3) {
      response += ` See the full step-by-step guide below for complete details.`;
    }
    if (hasMultipleRelevant) {
      response += `\n\nI've included ${articles.length - 1} related article${articles.length > 2 ? 's' : ''} that cover additional aspects of this topic.`;
    }
  } else if (isWhat || isCan) {
    // Informational response — comprehensive
    if (isCan) {
      response = `Yes! `;
    }
    const sentences = topArticle.content.split(/\.\s+/);
    response += sentences.slice(0, 3).join('. ') + '.';
    if (hasMultipleRelevant) {
      response += `\n\nHere are ${articles.length} articles covering different aspects of this topic:`;
    }
  } else {
    // General response
    const sentences = topArticle.content.split(/\.\s+/);
    response += sentences.slice(0, 3).join('. ') + '.';
    if (hasMultipleRelevant) {
      response += `\n\nI found ${articles.length} related articles that should help:`;
    } else {
      response += `\n\nHere's the full article with all the details:`;
    }
  }

  return response;
}

/* ═══════════════════════════════════════════════════════════════════
   TICKET GENERATOR
   ═══════════════════════════════════════════════════════════════════ */

let ticketCounter = 4200;
export function generateTicketId() {
  ticketCounter += Math.floor(Math.random() * 10) + 1;
  return `CB-${ticketCounter}`;
}

/* ═══════════════════════════════════════════════════════════════════
   COLLAPSIBLE SECTION
   ═══════════════════════════════════════════════════════════════════ */

function Section({ title, icon: Icon, iconColor, children, defaultOpen = true, badge, badgeColor }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-surface-hover transition-colors">
        <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ color: iconColor }} />
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: (badgeColor || '#0EA5E9') + '18', color: badgeColor || '#0EA5E9' }}>{badge}</span>}
        <div className="ml-auto">{open ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}</div>
      </button>
      {open && <div className="px-5 pb-4 border-t border-surface-border pt-3">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   KB ARTICLE CARD
   ═══════════════════════════════════════════════════════════════════ */

export function KBArticleCard({ article }) {
  const [expanded, setExpanded] = useState(false);
  const categoryColors = {
    Ecommerce: 'var(--color-accent-green)', POS: 'var(--color-accent-blue)', Payments: 'var(--color-accent-purple)', Compliance: 'var(--color-accent-gold)',
    Integrations: '#0EA5E9', Marketing: '#EC4899', Operations: '#F97316',
    Troubleshooting: 'var(--color-accent-red)', Customization: '#8B5CF6', Analytics: 'var(--color-accent-green)',
    'In-Store': '#0EA5E9', Advanced: '#8B949E', Premium: '#EC4899',
  };
  const catColor = categoryColors[article.category] || '#0EA5E9';

  return (
    <div className="bg-surface-bg rounded-lg border border-surface-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-surface-hover transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: catColor + '18' }}>
            <BookOpen className="w-4 h-4" style={{ color: catColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">{article.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: catColor + '15', color: catColor }}>{article.category}</span>
              <span className="text-[10px] text-text-muted">{article.id}</span>
              {article.navPath && (
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <Settings className="w-2.5 h-2.5" /> {article.navPath}
                </span>
              )}
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-border pt-3 animate-fade-in space-y-3">
          {/* Navigation path breadcrumb */}
          {article.navPath && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card border border-surface-border">
              <Settings className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
              <div className="flex items-center gap-1 flex-wrap">
                {article.navPath.split(' > ').map((part, i, arr) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-[11px] font-medium text-text-primary">{part}</span>
                    {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-text-muted" />}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-step instructions */}
          {article.steps && article.steps.length > 0 && (
            <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
              <p className="text-[10px] font-semibold text-text-muted mb-2">Step-by-Step</p>
              <div className="space-y-1.5">
                {article.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: catColor + '20', color: catColor }}>{i + 1}</span>
                    <p className="text-xs text-text-primary leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full content */}
          <p className="text-xs text-text-secondary leading-relaxed">{article.content}</p>

          {/* Related articles */}
          {article.relatedArticles.length > 0 && (
            <div className="pt-2 border-t border-surface-border/50">
              <p className="text-[10px] text-text-muted mb-1.5">Related articles</p>
              <div className="flex gap-1.5 flex-wrap">
                {article.relatedArticles.map(id => {
                  const related = KNOWLEDGE_BASE.find(a => a.id === id);
                  return related ? (
                    <span key={id} className="text-[10px] px-2 py-0.5 rounded bg-[#0EA5E9]/10 text-[#0EA5E9]">{related.title}</span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   UPSELL PRODUCT CARD
   ═══════════════════════════════════════════════════════════════════ */

function UpsellCard({ productKey, product, onActivate, onDemoRequest }) {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleActivate = () => {
    setRequesting(true);
    setTimeout(() => {
      setRequesting(false);
      setRequested(true);
      onActivate(productKey);
      if (onDemoRequest) onDemoRequest(productKey, product);
    }, 1800);
  };

  const Icon = product.icon;

  return (
    <div className="bg-surface-bg rounded-xl border border-surface-border p-5 hover:border-surface-border transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: product.color + '20' }}>
          <Icon className="w-6 h-6" style={{ color: product.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-text-primary">{product.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: product.color + '18', color: product.color }}>{product.tier}</span>
          </div>
          <p className="text-sm text-text-secondary mb-3">{product.description}</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-accent-green" />
              <span className="text-xs text-text-primary font-medium">{product.monthlyFee}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span className="text-xs text-[#0EA5E9]">{product.savings}</span>
            </div>
          </div>
          {requested ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-green/10 border border-accent-green/20">
              <CheckCircle2 className="w-4 h-4 text-accent-green" />
              <span className="text-sm text-accent-green font-medium">Demo Requested — Your account manager will reach out within 24 hours</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleActivate}
                disabled={requesting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: `linear-gradient(135deg, ${product.color}, ${product.color}CC)` }}
              >
                {requesting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Requesting...</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Request Demo & Pricing</>
                )}
              </button>
              <button
                onClick={() => setShowLearnMore(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-card/5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> {showLearnMore ? 'Show Less' : 'Learn More'}
              </button>
            </div>
          )}
          {showLearnMore && (
            <div className="mt-3 p-3 rounded-lg bg-surface-card border border-surface-border text-sm text-text-secondary leading-relaxed">
              <p className="mb-2">{product.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-border text-text-primary">{product.tier}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green">{product.savings}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9]">{product.monthlyFee}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BUG REPORT CARD
   ═══════════════════════════════════════════════════════════════════ */

export function BugReportCard({ userMessage, ticketId }) {
  return (
    <div className="bg-surface-bg rounded-xl border border-amber-500/20 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <Ticket className="w-5 h-5 text-accent-gold" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-text-primary">Support Ticket Created</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent-gold/15 text-accent-gold font-medium">{ticketId}</span>
          </div>
          <p className="text-xs text-text-secondary">Routed to the Product Engineering team</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Issue Description</p>
          <p className="text-xs text-text-primary">"{userMessage}"</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
            <p className="text-[10px] text-text-muted">Priority</p>
            <p className="text-xs font-medium text-accent-gold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Medium</p>
          </div>
          <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
            <p className="text-[10px] text-text-muted">Status</p>
            <p className="text-xs font-medium text-[#0EA5E9] flex items-center gap-1"><Clock className="w-3 h-3" /> In Queue</p>
          </div>
          <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
            <p className="text-[10px] text-text-muted">Est. Response</p>
            <p className="text-xs font-medium text-text-secondary">Within 4 hrs</p>
          </div>
        </div>
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0EA5E9]/5 border border-[#0EA5E9]/10">
          <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#0EA5E9]">We'll email you at <span className="font-medium">admin@ascendwellness.com</span> when an engineer picks this up. You can reference <span className="font-medium">{ticketId}</span> in any follow-up.</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BUG DETAIL GATHERER — prompts user for extra info before ticket submit
   ═══════════════════════════════════════════════════════════════════ */

export function BugDetailGatherer({ userMessage, onSubmit }) {
  const [steps, setSteps] = useState('');
  const [browser, setBrowser] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [affectedUser, setAffectedUser] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [orderOrRegister, setOrderOrRegister] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [nudgeShown, setNudgeShown] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasDetails = steps.trim() || browser.trim() || screenshot || pageUrl.trim() || affectedUser.trim() || occurredAt.trim() || orderOrRegister.trim();
  const descriptionWordCount = userMessage.trim().split(/\s+/).length;
  const isLowEffort = descriptionWordCount <= 5 && !screenshot && !screenshotPreview;

  const handleSubmit = (extraDetails) => {
    if (isLowEffort && !nudgeShown) {
      setNudgeShown(true);
      return;
    }
    const contextFields = { pageUrl: pageUrl.trim(), affectedUser: affectedUser.trim(), occurredAt: occurredAt.trim(), orderOrRegister: orderOrRegister.trim() };
    if (extraDetails) {
      onSubmit({ ...extraDetails, ...contextFields });
    } else {
      onSubmit(contextFields);
    }
  };

  return (
    <div className="bg-surface-bg rounded-xl border border-amber-500/20 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <Bug className="w-5 h-5 text-accent-gold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Help us fix this faster</h3>
          <p className="text-xs text-text-secondary mt-0.5">A few extra details help our engineers reproduce and resolve the issue quickly. You can also skip and submit as-is.</p>
        </div>
      </div>

      <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
        <p className="text-[10px] font-medium text-text-secondary mb-1">Your Report</p>
        <p className="text-xs text-text-primary">"{userMessage}"</p>
      </div>

      {/* Low-effort nudge */}
      {nudgeShown && isLowEffort && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-accent-blue/8 border border-accent-blue/20">
          <AlertTriangle className="w-3.5 h-3.5 text-accent-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-accent-blue font-medium">A little more detail goes a long way</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Your description is pretty short — could you add a few more words about what happened, or attach a screenshot? It really helps our team track down the issue. If you'd rather submit as-is, just hit submit again.</p>
          </div>
        </div>
      )}

      {/* Page URL */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" />
          Page URL
          <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="Paste the link to the page where you're seeing this issue"
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-gold/50 transition-colors"
        />
      </div>

      {/* Affected user & time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
            <User className="w-3.5 h-3.5 text-text-secondary" />
            Affected user
            <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={affectedUser}
            onChange={(e) => setAffectedUser(e.target.value)}
            placeholder="e.g. jane@dispensary.com"
            className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-gold/50 transition-colors"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
            <Clock className="w-3.5 h-3.5 text-text-secondary" />
            When did it happen?
            <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            placeholder="e.g. Today at 2:30 PM, yesterday morning"
            className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-gold/50 transition-colors"
          />
        </div>
      </div>

      {/* Order / Register number */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
          <Hash className="w-3.5 h-3.5 text-text-secondary" />
          Order # or Register #
          <span className="text-[10px] text-text-muted font-normal ml-1">(if applicable)</span>
        </label>
        <input
          type="text"
          value={orderOrRegister}
          onChange={(e) => setOrderOrRegister(e.target.value)}
          placeholder="e.g. ORD-12345 or Register 3"
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-gold/50 transition-colors"
        />
      </div>

      {/* Steps to reproduce */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
          <FileText className="w-3.5 h-3.5 text-text-secondary" />
          Steps to reproduce
          <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="1. Go to the Orders page&#10;2. Click on a specific order&#10;3. The page shows a blank screen"
          rows={3}
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-gold/50 transition-colors resize-none"
        />
      </div>

      {/* Browser / Device */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
          <Monitor className="w-3.5 h-3.5 text-text-secondary" />
          Browser / Device
          <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={browser}
          onChange={(e) => setBrowser(e.target.value)}
          placeholder="e.g. Chrome on MacBook, Safari on iPad"
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-gold/50 transition-colors"
        />
      </div>

      {/* Screenshot upload */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
          <Image className="w-3.5 h-3.5 text-text-secondary" />
          Screenshot
          <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
        </label>
        {screenshotPreview ? (
          <div className="relative inline-block">
            <img src={screenshotPreview} alt="Screenshot" className="max-h-32 rounded-lg border border-surface-border" />
            <button
              onClick={removeScreenshot}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent-red text-white flex items-center justify-center hover:bg-accent-red transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-surface-card border border-dashed border-surface-border rounded-lg text-xs text-text-secondary hover:border-accent-gold/40 hover:text-accent-gold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload a screenshot
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Info nudge */}
      {!hasDetails && !nudgeShown && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent-gold/5 border border-accent-gold/10">
          <Info className="w-3.5 h-3.5 text-accent-gold flex-shrink-0 mt-0.5" />
          <p className="text-xs text-accent-gold/80">Adding steps to reproduce or a screenshot can cut resolution time by up to 50%.</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => handleSubmit({ steps: steps.trim(), browser: browser.trim(), screenshot: screenshot?.name || null, screenshotData: screenshotPreview || null })}
          className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-surface-bg text-xs font-semibold rounded-lg hover:bg-accent-gold transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {hasDetails ? 'Submit with Details' : nudgeShown ? 'Submit Anyway' : 'Submit Bug Report'}
        </button>
        {!hasDetails && !nudgeShown && (
          <button
            onClick={() => handleSubmit(null)}
            className="px-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip — submit without details
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FEATURE HELP CARD — KB articles + option to submit PF request
   ═══════════════════════════════════════════════════════════════════ */

function FeatureHelpCard({ userMessage, kbResults, onRequestForm }) {
  return (
    <div className="space-y-3">
      {kbResults.length > 0 && (
        <>
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0EA5E9]/5 border border-[#0EA5E9]/10">
            <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#0EA5E9]">Some of what you're describing may already be available. Check the articles below — it might save you the wait!</p>
          </div>
          {kbResults.map(article => (
            <KBArticleCard key={article.id} article={article} />
          ))}
        </>
      )}
      <div className="bg-surface-bg rounded-xl border border-accent-purple/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-accent-purple" />
            <p className="text-xs text-text-primary">{kbResults.length > 0 ? "Didn't find what you need?" : "We'd love to hear your idea."}</p>
          </div>
          <button
            onClick={onRequestForm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple/15 text-accent-purple text-xs font-medium rounded-lg hover:bg-accent-purple/25 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Submit a Feature Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FEATURE DETAIL GATHERER — form for submitting a PF request
   ═══════════════════════════════════════════════════════════════════ */

function FeatureDetailGatherer({ userMessage, onSubmit }) {
  const [useCase, setUseCase] = useState('');
  const [priority, setPriority] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const priorities = [
    { value: 'nice-to-have', label: 'Nice to Have', color: '#8B949E' },
    { value: 'important', label: 'Important', color: 'var(--color-accent-gold)' },
    { value: 'critical', label: 'Critical — Blocking Workflow', color: 'var(--color-accent-red)' },
  ];

  const hasDetails = useCase.trim() || priority || screenshot;

  return (
    <div className="bg-surface-bg rounded-xl border border-accent-purple/20 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-accent-purple" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Submit a Product Feature Request</h3>
          <p className="text-xs text-text-secondary mt-0.5">Tell us more so our product team can prioritize this properly. You can also submit as-is.</p>
        </div>
      </div>

      <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
        <p className="text-[10px] font-medium text-text-secondary mb-1">Your Idea</p>
        <p className="text-xs text-text-primary">"{userMessage}"</p>
      </div>

      {/* Use case / business impact */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
          <FileText className="w-3.5 h-3.5 text-text-secondary" />
          Use case / business impact
          <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          placeholder="e.g. Our budtenders spend 10 min per shift manually updating menu boards. An auto-sync feature would save us ~2 hours/week across 4 locations."
          rows={3}
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-purple/50 transition-colors resize-none"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
          <Tag className="w-3.5 h-3.5 text-text-secondary" />
          Priority
          <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
        </label>
        <div className="flex gap-2">
          {priorities.map(p => (
            <button
              key={p.value}
              onClick={() => setPriority(priority === p.value ? '' : p.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                priority === p.value
                  ? 'border-current bg-current/10'
                  : 'border-surface-border bg-surface-card text-text-secondary hover:border-surface-border'
              }`}
              style={priority === p.value ? { color: p.color, borderColor: p.color, backgroundColor: `${p.color}15` } : {}}
            >
              {priority === p.value && <Check className="w-3 h-3" />}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot / mockup upload */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary mb-1.5">
          <Image className="w-3.5 h-3.5 text-text-secondary" />
          Screenshot or mockup
          <span className="text-[10px] text-text-muted font-normal ml-1">(optional)</span>
        </label>
        {screenshotPreview ? (
          <div className="relative inline-block">
            <img src={screenshotPreview} alt="Attachment" className="max-h-32 rounded-lg border border-surface-border" />
            <button
              onClick={removeScreenshot}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent-red text-white flex items-center justify-center hover:bg-accent-red transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-surface-card border border-dashed border-surface-border rounded-lg text-xs text-text-secondary hover:border-accent-purple/40 hover:text-accent-purple transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload a screenshot or mockup
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onSubmit({ useCase: useCase.trim(), priority, screenshot: screenshot?.name || null, screenshotData: screenshotPreview || null })}
          className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white text-xs font-semibold rounded-lg hover:bg-accent-purple transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {hasDetails ? 'Submit with Details' : 'Submit Feature Request'}
        </button>
        {!hasDetails && (
          <button
            onClick={() => onSubmit(null)}
            className="px-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip — submit without details
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FEATURE REQUEST CARD
   ═══════════════════════════════════════════════════════════════════ */

function FeatureRequestCard({ userMessage, ticketId }) {
  const [sprintState, setSprintState] = useState('queued');

  useEffect(() => {
    const t1 = setTimeout(() => setSprintState('planning'), 1500);
    const t2 = setTimeout(() => setSprintState('accepted'), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="bg-surface-bg rounded-xl border border-purple-500/20 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
          <Factory className="w-5 h-5 text-accent-purple" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-text-primary">Feature Request Submitted</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent-purple/15 text-accent-purple font-medium">{ticketId}</span>
          </div>
          <p className="text-xs text-text-secondary">Sent to the Software Factory for triage</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Feature Request</p>
          <p className="text-xs text-text-primary">"{userMessage}"</p>
        </div>
        {/* Sprint pipeline */}
        <div className="bg-surface-card rounded-lg p-4 border border-surface-border">
          <p className="text-[10px] font-medium text-text-secondary mb-3">Development Pipeline</p>
          <div className="flex items-center gap-2">
            {[
              { key: 'queued', label: 'Queued', icon: Clock },
              { key: 'planning', label: 'Planning', icon: Lightbulb },
              { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
            ].map((step, i) => {
              const isActive = step.key === sprintState;
              const isDone = ['queued', 'planning', 'accepted'].indexOf(step.key) < ['queued', 'planning', 'accepted'].indexOf(sprintState);
              const StepIcon = step.icon;
              return (
                <React.Fragment key={step.key}>
                  {i > 0 && <div className={`flex-1 h-0.5 rounded ${isDone || isActive ? 'bg-accent-purple' : 'bg-surface-border'}`} />}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    isActive ? 'bg-accent-purple/15 text-accent-purple ring-1 ring-accent-purple/30' :
                    isDone ? 'bg-accent-green/10 text-accent-green' : 'bg-surface-card/5 text-text-muted'
                  }`}>
                    <StepIcon className="w-3 h-3" />
                    {step.label}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
        {sprintState === 'accepted' && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent-green/5 border border-accent-green/10 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-green flex-shrink-0 mt-0.5" />
            <p className="text-xs text-accent-green">Your feature request has been accepted into the next sprint planning cycle. A product manager will follow up with scoping details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT CATALOG SIDEBAR PANEL
   ═══════════════════════════════════════════════════════════════════ */

function ProductCatalogPanel({ products, onToggle, isOpen, onClose }) {
  const activeProducts = Object.entries(products).filter(([, p]) => p.active);
  const availableProducts = Object.entries(products).filter(([, p]) => !p.active && p.upsell);

  return (
    <div className={`fixed top-0 right-0 h-full w-80 bg-surface-bg border-l border-surface-border z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col shadow-2xl`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0EA5E9]" />
          <h2 className="text-sm font-semibold text-text-primary">Product Suite</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-card/5 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* active */}
        <div>
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2 px-1">Active Products ({activeProducts.length})</p>
          <div className="space-y-1.5">
            {activeProducts.map(([key, prod]) => {
              const Icon = prod.icon;
              return (
                <div key={key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-card border border-surface-border">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: prod.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{prod.name}</p>
                    <p className="text-[10px] text-text-muted">{prod.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-accent-green font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                    Active
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* available upgrades */}
        <div>
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2 px-1">Available Upgrades ({availableProducts.length})</p>
          <div className="space-y-1.5">
            {availableProducts.map(([key, prod]) => {
              const Icon = prod.icon;
              return (
                <div key={key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-card border border-surface-border hover:border-surface-border transition-colors">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: prod.color + '80' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-secondary truncate">{prod.name}</p>
                    <p className="text-[10px] text-text-muted">{prod.monthlyFee}</p>
                  </div>
                  <button
                    onClick={() => onToggle(key)}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
                    style={{ background: prod.color + '18', color: prod.color }}
                  >
                    Activate
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* footer */}
      <div className="p-4 border-t border-surface-border">
        <div className="bg-surface-card rounded-lg p-3 border border-surface-border">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-accent-green" />
            <span className="text-[10px] text-accent-green font-medium">Ascend — Enterprise Tier</span>
          </div>
          <p className="text-[10px] text-text-muted">Account Manager: Jessica Chen</p>
          <p className="text-[10px] text-text-muted">Next renewal: Sep 14, 2026</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REVIEW FEED — browse individual reviews by filters
   ═══════════════════════════════════════════════════════════════════ */

function buildReviewFeed(query) {
  const lower = query.toLowerCase();
  const filters = {};
  let sort = 'recent'; // recent | best | worst | helpful

  // Time filters — "last week", "this month", etc.
  const now = new Date();
  if (/last week|past week|this week|recent/i.test(lower)) {
    const start = new Date(now); start.setDate(start.getDate() - 7);
    filters.dateRange = [start.toISOString().split('T')[0], now.toISOString().split('T')[0]];
  } else if (/last month|past month|this month/i.test(lower)) {
    const start = new Date(now); start.setMonth(start.getMonth() - 1);
    filters.dateRange = [start.toISOString().split('T')[0], now.toISOString().split('T')[0]];
  } else if (/last 2 weeks|past 2 weeks|two weeks/i.test(lower)) {
    const start = new Date(now); start.setDate(start.getDate() - 14);
    filters.dateRange = [start.toISOString().split('T')[0], now.toISOString().split('T')[0]];
  } else if (/last 3 months|past 3 months|past quarter/i.test(lower)) {
    const start = new Date(now); start.setMonth(start.getMonth() - 3);
    filters.dateRange = [start.toISOString().split('T')[0], now.toISOString().split('T')[0]];
  }

  // Sentiment filters
  if (/\b(negative|bad|worst|angry|terrible|horrible|awful|1[- ]star|2[- ]star)\b/i.test(lower)) {
    filters.sentiments = ['negative'];
    if (!/(best|top rated)/i.test(lower)) sort = 'worst';
  } else if (/\b(positive|good|great|best|top rated|amazing|excellent|5[- ]star|4[- ]star)\b/i.test(lower)) {
    filters.sentiments = ['positive'];
    sort = 'best';
  } else if (/\b(neutral|mixed|3[- ]star)\b/i.test(lower)) {
    filters.sentiments = ['neutral'];
  }

  // Star rating filter
  const starMatch = lower.match(/(\d)[- ]star/);
  if (starMatch) {
    const starVal = parseInt(starMatch[1]);
    // Star rating doesn't map 1:1 to sentiment, so also filter by sentiment
    if (starVal >= 4) filters.sentiments = ['positive'];
    else if (starVal === 3) filters.sentiments = ['neutral'];
    else filters.sentiments = ['negative'];
  }

  // Source filters
  for (const source of allSources) {
    if (lower.includes(source.toLowerCase())) {
      filters.sources = [source];
      break;
    }
  }

  // Brand filters
  for (const brand of allBrands) {
    if (lower.includes(brand.toLowerCase())) {
      filters.brands = [brand];
      break;
    }
  }

  // Category filters
  for (const cat of allCategories) {
    if (lower.includes(cat.toLowerCase())) {
      filters.categories = [cat];
      break;
    }
  }

  // Free-text search — look for quoted terms or "about/mentioning/containing X"
  const quotedMatch = query.match(/"([^"]+)"|'([^']+)'/);
  if (quotedMatch) {
    filters.search = quotedMatch[1] || quotedMatch[2];
  } else {
    const aboutMatch = lower.match(/(?:about|mentioning|containing|for|with)\s+(\w[\w\s]{2,20}?)(?:\s+reviews?|\s*$)/);
    if (aboutMatch) {
      const term = aboutMatch[1].trim();
      // Don't use common query words as search terms
      if (!['the','recent','latest','last','this','some','all','any','me','my','our'].includes(term)) {
        filters.search = term;
      }
    }
  }

  // Sort
  if (/\b(best|top rated|highest)\b/i.test(lower)) sort = 'best';
  else if (/\b(worst|lowest|most negative)\b/i.test(lower)) sort = 'worst';
  else if (/\b(most helpful|popular)\b/i.test(lower)) sort = 'helpful';

  // Apply filters
  let results = filterReviews(allReviews, filters);

  // Sort
  if (sort === 'recent') results.sort((a, b) => b.date.localeCompare(a.date));
  else if (sort === 'best') results.sort((a, b) => b.sentimentScore - a.sentimentScore);
  else if (sort === 'worst') results.sort((a, b) => a.sentimentScore - b.sentimentScore);
  else if (sort === 'helpful') results.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));

  // Build filter description
  const parts = [];
  if (filters.sentiments) parts.push(filters.sentiments[0]);
  if (filters.sources) parts.push(filters.sources[0]);
  if (filters.brands) parts.push(filters.brands[0]);
  if (filters.categories) parts.push(filters.categories[0]);
  if (filters.search) parts.push(`"${filters.search}"`);
  if (filters.dateRange) {
    const start = new Date(filters.dateRange[0]);
    const daysDiff = Math.round((now - start) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) parts.push('last 7 days');
    else if (daysDiff <= 14) parts.push('last 2 weeks');
    else if (daysDiff <= 31) parts.push('last month');
    else parts.push('last 3 months');
  }
  const filterDesc = parts.length > 0 ? parts.join(' · ') : 'all reviews';

  return {
    reviews: results.slice(0, 10),
    totalMatching: results.length,
    filterDesc,
    sort,
    filters,
    avgScore: results.length > 0 ? avgSentiment(results) : 0,
    dist: results.length > 0 ? sentimentDistribution(results) : { positive: 0, neutral: 0, negative: 0 },
  };
}

const SOURCE_ICONS = { Reddit: '🟠', 'Google Reviews': '🔵', Leafly: '🟢', Weedmaps: '🟤' };

function ReviewFeed({ data }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? data.reviews : data.reviews.slice(0, 5);

  const scoreColor = (s) => s >= 0.2 ? 'var(--color-accent-green)' : s >= -0.2 ? 'var(--color-accent-gold)' : 'var(--color-accent-red)';
  const sentBg = (s) => s === 'positive' ? 'bg-accent-green/10 text-accent-green' : s === 'neutral' ? 'bg-accent-gold/10 text-accent-gold' : 'bg-accent-red/10 text-accent-red';

  return (
    <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-purple/20 to-[#0EA5E9]/20 flex items-center justify-center">
            <MessageSquare className="w-4.5 h-4.5 text-accent-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Customer Reviews</h3>
            <p className="text-[10px] text-text-muted">{data.totalMatching} matching · {data.filterDesc} · sorted by {data.sort}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${scoreColor(data.avgScore)}15`, color: scoreColor(data.avgScore) }}>
            avg {data.avgScore.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-surface-border bg-surface-card/50">
        <span className="text-[10px] text-accent-green">{data.dist.positive} positive</span>
        <span className="text-[10px] text-accent-gold">{data.dist.neutral} neutral</span>
        <span className="text-[10px] text-accent-red">{data.dist.negative} negative</span>
        <span className="text-[10px] text-text-muted ml-auto">{data.totalMatching} total</span>
      </div>

      {/* Reviews */}
      <div className="divide-y divide-[#30363D]">
        {visible.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-text-secondary">No reviews match those filters.</p>
          </div>
        )}
        {visible.map(r => (
          <ReviewCard key={r.id} review={r} scoreColor={scoreColor} sentBg={sentBg} />
        ))}
      </div>

      {/* Show more / footer */}
      <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between">
        {data.reviews.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] text-[#0EA5E9] hover:text-[#38BDF8] transition-colors flex items-center gap-1"
          >
            {showAll ? <><ChevronUp className="w-3 h-3" /> Show fewer</> : <><ChevronDown className="w-3 h-3" /> Show all {data.reviews.length} reviews</>}
          </button>
        )}
        <p className="text-[10px] text-text-muted ml-auto">Data from Dutchie AI</p>
      </div>
    </div>
  );
}

function ReviewCard({ review: r, scoreColor, sentBg }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = r.text.length > 180;
  const displayText = isLong && !expanded ? r.text.slice(0, 180) + '...' : r.text;

  return (
    <div className="px-5 py-3 hover:bg-surface-card/40 transition-colors">
      {/* Top row — source, date, score */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs">{SOURCE_ICONS[r.source] || '📝'}</span>
        <span className="text-[10px] font-medium text-text-primary">{r.source}</span>
        {r.rating && (
          <span className="text-[10px] text-accent-gold">
            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
          </span>
        )}
        <span className="text-[10px] text-text-muted">·</span>
        <span className="text-[10px] text-text-muted">{r.location}</span>
        <span className="text-[10px] text-text-muted ml-auto">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>

      {/* Review text */}
      <p className="text-xs text-text-primary leading-relaxed mb-2">
        {r.title && <span className="font-semibold text-text-primary">{r.title} — </span>}
        &ldquo;{displayText}&rdquo;
        {isLong && (
          <button onClick={() => setExpanded(!expanded)} className="text-[#0EA5E9] ml-1 hover:underline">
            {expanded ? 'less' : 'more'}
          </button>
        )}
      </p>

      {/* Bottom row — sentiment badge, score, categories, author */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sentBg(r.sentiment)}`}>
          {r.sentiment === 'positive' ? '↑' : r.sentiment === 'negative' ? '↓' : '→'} {r.sentimentScore.toFixed(1)}
        </span>
        {r.brand && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple">{r.brand}</span>
        )}
        {r.categories.slice(0, 2).map(cat => (
          <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-border text-text-secondary">{cat}</span>
        ))}
        <span className="text-[10px] text-text-muted ml-auto">by {r.author}</span>
        {r.helpful > 0 && <span className="text-[10px] text-text-muted">· {r.helpful} helpful</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SENTIMENT — pull real data from the sentiment analysis tool
   ═══════════════════════════════════════════════════════════════════ */

function buildSentimentData(query) {
  const lower = query.toLowerCase();

  // Determine focus from query
  let focus = 'overview';
  if (/brand|brands|brand sentiment|brand perception/i.test(lower)) focus = 'brands';
  else if (/source|reddit|leafly|weedmaps|google/i.test(lower)) focus = 'sources';
  else if (/category|categories|product quality|staff|wait time|pricing|atmosphere|selection/i.test(lower)) focus = 'categories';
  else if (/trend|over time|month|monthly|changing/i.test(lower)) focus = 'trend';
  else if (/negative|complaint|unhappy|bad|worst|low|poor/i.test(lower)) focus = 'negative';
  else if (/word|mention|talking about|saying|top words/i.test(lower)) focus = 'words';

  // Filter reviews if query mentions a specific brand or source
  let filtered = allReviews;
  let filterLabel = 'All Reviews';
  for (const brand of allBrands) {
    if (lower.includes(brand.toLowerCase())) {
      filtered = allReviews.filter(r => r.brand === brand);
      filterLabel = brand;
      if (focus === 'overview') focus = 'brands';
      break;
    }
  }
  for (const source of allSources) {
    if (lower.includes(source.toLowerCase())) {
      filtered = allReviews.filter(r => r.source === source);
      filterLabel = source;
      if (focus === 'overview') focus = 'sources';
      break;
    }
  }

  // Build data from real helpers
  const avg = avgSentiment(filtered);
  const dist = sentimentDistribution(filtered);
  const nps = calculateNPS(filtered);
  const trend = monthlyTrend(filtered);
  const catSentiment = categorySentiment(filtered);
  const bySource = groupBy(filtered, 'source');
  const byBrand = groupBy(filtered, 'brand');
  const total = filtered.length;

  // Normalized score 0-100
  const normalizedScore = Math.round(((avg + 1) / 2) * 100);

  // Source stats
  const sourceStats = Object.entries(bySource).map(([name, revs]) => ({
    name,
    count: revs.length,
    avg: avgSentiment(revs),
    ...sentimentDistribution(revs),
  })).sort((a, b) => b.count - a.count);

  // Brand stats
  const brandStats = Object.entries(byBrand)
    .filter(([name]) => name && name !== 'null' && name !== 'undefined')
    .map(([name, revs]) => ({
      name,
      count: revs.length,
      avg: avgSentiment(revs),
      normalized: Math.round(((avgSentiment(revs) + 1) / 2) * 100),
      ...sentimentDistribution(revs),
    }))
    .sort((a, b) => b.count - a.count);

  // Worst-rated categories
  const categoryRanked = [...catSentiment].sort((a, b) => a.avg - b.avg);

  // Sample negative reviews
  const negativeReviews = filtered
    .filter(r => r.sentiment === 'negative')
    .sort((a, b) => a.sentimentScore - b.sentimentScore)
    .slice(0, 3);

  // Top words (simple word frequency)
  const stopWords = new Set(['the','and','a','to','is','it','in','that','was','for','on','are','with','this','they','be','at','have','from','or','had','but','not','has','an','been','would','my','of','we','their','i','you','so','me','our','us','them','your','very','its','all','no','about','up','out','if','just','get','do','as','can','one','by','will','were','when','more','what','how','than','did','who','like','some']);
  const wordCounts = {};
  filtered.forEach(r => {
    r.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(w => {
      if (w.length > 2 && !stopWords.has(w)) wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
  });
  const topWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([text, value]) => ({ text, value }));

  return {
    focus,
    filterLabel,
    total,
    avg,
    normalizedScore,
    nps,
    dist,
    trend,
    catSentiment: catSentiment.slice(0, 6),
    categoryRanked,
    sourceStats,
    brandStats,
    negativeReviews,
    topWords,
  };
}

const SENTIMENT_COLORS = { positive: 'var(--color-accent-green)', neutral: 'var(--color-accent-gold)', negative: 'var(--color-accent-red)' };

function SentimentSnippet({ data }) {
  const [expanded, setExpanded] = useState(false);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-text-secondary mb-1 font-medium">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }} className="font-mono">{p.name}: {typeof p.value === 'number' && p.value < 10 ? p.value.toFixed(2) : p.value}</p>
        ))}
      </div>
    );
  };

  // Gauge color based on score
  const gaugeColor = data.normalizedScore >= 65 ? 'var(--color-accent-green)' : data.normalizedScore >= 40 ? 'var(--color-accent-gold)' : 'var(--color-accent-red)';
  const npsColor = data.nps >= 30 ? 'var(--color-accent-green)' : data.nps >= 0 ? 'var(--color-accent-gold)' : 'var(--color-accent-red)';

  // Donut data
  const donutData = [
    { name: 'Positive', value: data.dist.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: data.dist.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: data.dist.negative, color: SENTIMENT_COLORS.negative },
  ];

  return (
    <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-green/20 to-[#0EA5E9]/20 flex items-center justify-center">
            <Star className="w-4.5 h-4.5 text-accent-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Sentiment</h3>
            <p className="text-[10px] text-text-muted">{data.total} reviews · {data.filterLabel} · Ascend</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${gaugeColor}15`, color: gaugeColor }}>
          Score: {data.normalizedScore}/100
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 border-b border-surface-border px-4 py-1">
        {[
          { label: 'Avg Score', value: data.avg.toFixed(1), sub: `${data.normalizedScore}/100`, color: gaugeColor },
          { label: 'NPS', value: data.nps > 0 ? `+${data.nps}` : `${data.nps}`, sub: data.nps >= 30 ? 'Great' : data.nps >= 0 ? 'OK' : 'Needs Work', color: npsColor },
          { label: 'Positive', value: `${Math.round((data.dist.positive / data.total) * 100)}%`, sub: `${data.dist.positive} reviews`, color: 'var(--color-accent-green)' },
          { label: 'Negative', value: `${Math.round((data.dist.negative / data.total) * 100)}%`, sub: `${data.dist.negative} reviews`, color: 'var(--color-accent-red)' },
        ].map(kpi => (
          <div key={kpi.label} className="px-4 py-3 text-center">
            <p className="text-[10px] font-medium text-text-secondary mb-1">{kpi.label}</p>
            <p className="text-base font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[10px] text-text-muted">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Donut + Category breakdown side by side */}
      <div className="grid grid-cols-2 gap-4 border-b border-surface-border px-4">
        {/* Donut */}
        <div className="px-4 py-3">
          <p className="text-[10px] font-medium text-text-secondary mb-1">Distribution</p>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} strokeWidth={0}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 mt-1">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-text-secondary">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top categories */}
        <div className="px-4 py-3">
          <p className="text-[10px] font-medium text-text-secondary mb-2">By Category</p>
          <div className="space-y-1.5">
            {data.catSentiment.map(cat => {
              const catTotal = cat.positive + cat.neutral + cat.negative;
              const posPct = catTotal > 0 ? Math.round((cat.positive / catTotal) * 100) : 0;
              const neuPct = catTotal > 0 ? Math.round((cat.neutral / catTotal) * 100) : 0;
              const negPct = 100 - posPct - neuPct;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-text-primary truncate">{cat.category}</span>
                    <span className="text-[10px] text-text-secondary ml-2">{cat.avg.toFixed(1)}</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-surface-card">
                    <div style={{ width: `${posPct}%`, backgroundColor: 'var(--color-accent-green)' }} />
                    <div style={{ width: `${neuPct}%`, backgroundColor: 'var(--color-accent-gold)' }} />
                    <div style={{ width: `${negPct}%`, backgroundColor: 'var(--color-accent-red)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="px-5 pt-3 pb-2 border-b border-surface-border">
        <p className="text-[10px] font-medium text-text-secondary mb-2">Sentiment Trend — 12 Months</p>
        <div style={{ width: '100%', height: 130 }}>
          <ResponsiveContainer>
            <AreaChart data={data.trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-green)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-accent-green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#484F58', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v.split(' ')[0]} />
              <YAxis domain={[-1, 1]} tick={{ fill: '#484F58', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="avg" name="Avg Score" stroke="var(--color-accent-green)" strokeWidth={2} fill="url(#sentGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contextual focus sections */}
      <div className="px-5 py-3">
        {/* Sources */}
        {(data.focus === 'overview' || data.focus === 'sources') && (
          <div className={data.focus === 'overview' && !expanded ? '' : ''}>
            <p className="text-[10px] font-medium text-text-secondary mb-2">By Source</p>
            <div className="grid grid-cols-2 gap-2">
              {data.sourceStats.map(src => {
                const srcColor = src.avg >= 0.15 ? 'var(--color-accent-green)' : src.avg >= -0.15 ? 'var(--color-accent-gold)' : 'var(--color-accent-red)';
                return (
                  <div key={src.name} className="bg-surface-card rounded-lg p-2.5 border border-surface-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-primary">{src.name}</span>
                      <span className="text-[10px] font-semibold" style={{ color: srcColor }}>{src.avg.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-text-muted">{src.count} reviews</p>
                    <div className="flex gap-2 mt-1 text-[10px]">
                      <span className="text-accent-green">{src.positive}↑</span>
                      <span className="text-accent-gold">{src.neutral}→</span>
                      <span className="text-accent-red">{src.negative}↓</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Brands */}
        {(data.focus === 'brands') && (
          <div>
            <p className="text-[10px] font-medium text-text-secondary mb-2">Brand Sentiment</p>
            <div className="space-y-1.5">
              {data.brandStats.map(brand => {
                const brandColor = brand.normalized >= 65 ? 'var(--color-accent-green)' : brand.normalized >= 40 ? 'var(--color-accent-gold)' : 'var(--color-accent-red)';
                return (
                  <div key={brand.name} className="flex items-center gap-3 bg-surface-card rounded-lg px-3 py-2 border border-surface-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-text-primary">{brand.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>{brand.normalized}/100</span>
                      </div>
                      <p className="text-[10px] text-text-muted">{brand.count} reviews</p>
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-accent-green">{brand.positive}↑</span>
                      <span className="text-accent-gold">{brand.neutral}→</span>
                      <span className="text-accent-red">{brand.negative}↓</span>
                    </div>
                    <div className="w-16 h-2 rounded-full overflow-hidden bg-surface-hover flex">
                      <div style={{ width: `${Math.round((brand.positive / brand.count) * 100)}%`, backgroundColor: 'var(--color-accent-green)' }} />
                      <div style={{ width: `${Math.round((brand.neutral / brand.count) * 100)}%`, backgroundColor: 'var(--color-accent-gold)' }} />
                      <div style={{ width: `${Math.round((brand.negative / brand.count) * 100)}%`, backgroundColor: 'var(--color-accent-red)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Negative deep dive */}
        {data.focus === 'negative' && (
          <div>
            <p className="text-[10px] font-medium text-text-secondary mb-2">Worst-Rated Areas</p>
            <div className="space-y-1.5 mb-3">
              {data.categoryRanked.slice(0, 3).map(cat => (
                <div key={cat.category} className="flex items-center gap-2 bg-surface-card rounded-lg px-3 py-2 border border-accent-red/15">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-red flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">{cat.category}</p>
                    <p className="text-[10px] text-text-muted">Avg: {cat.avg.toFixed(1)} · {cat.negative} negative of {cat.positive + cat.neutral + cat.negative}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-medium text-text-secondary mb-2">Most Critical Reviews</p>
            {data.negativeReviews.map(r => (
              <div key={r.id} className="bg-surface-card rounded-lg p-3 border border-surface-border mb-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-red/10 text-accent-red font-semibold">{r.sentimentScore.toFixed(1)}</span>
                  <span className="text-[10px] text-text-muted">{r.source} · {r.location}</span>
                </div>
                <p className="text-xs text-text-primary leading-relaxed">&ldquo;{r.text.slice(0, 150)}{r.text.length > 150 ? '...' : ''}&rdquo;</p>
              </div>
            ))}
          </div>
        )}

        {/* Word cloud */}
        {data.focus === 'words' && (
          <div>
            <p className="text-[10px] font-medium text-text-secondary mb-3">Top Mentions</p>
            <div className="flex flex-wrap gap-1.5">
              {data.topWords.map((w, i) => {
                const size = Math.max(11, Math.min(18, 11 + (w.value / data.topWords[0].value) * 7));
                const colors = ['#0EA5E9', 'var(--color-accent-green)', 'var(--color-accent-purple)', 'var(--color-accent-gold)', '#EC4899', 'var(--color-accent-red)'];
                return (
                  <span
                    key={w.text}
                    className="px-2 py-1 rounded-lg bg-surface-card border border-surface-border font-medium transition-transform hover:scale-105 cursor-default"
                    style={{ fontSize: `${size}px`, color: colors[i % colors.length] }}
                    title={`${w.value} mentions`}
                  >
                    {w.text} <span className="text-[9px] text-text-muted">{w.value}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Expandable sections for overview */}
        {data.focus === 'overview' && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-3 text-[10px] text-[#0EA5E9] hover:text-[#38BDF8] transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Show less' : 'Show brand & source breakdown'}
          </button>
        )}
        {data.focus === 'overview' && expanded && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-[10px] font-medium text-text-secondary mb-2">Brand Sentiment</p>
              <div className="space-y-1.5">
                {data.brandStats.map(brand => {
                  const brandColor = brand.normalized >= 65 ? 'var(--color-accent-green)' : brand.normalized >= 40 ? 'var(--color-accent-gold)' : 'var(--color-accent-red)';
                  return (
                    <div key={brand.name} className="flex items-center gap-3 bg-surface-card rounded-lg px-3 py-2 border border-surface-border">
                      <p className="text-xs font-medium text-text-primary flex-1">{brand.name}</p>
                      <span className="text-[10px] font-medium" style={{ color: brandColor }}>{brand.normalized}/100</span>
                      <div className="w-16 h-2 rounded-full overflow-hidden bg-surface-hover flex">
                        <div style={{ width: `${Math.round((brand.positive / brand.count) * 100)}%`, backgroundColor: 'var(--color-accent-green)' }} />
                        <div style={{ width: `${Math.round((brand.neutral / brand.count) * 100)}%`, backgroundColor: 'var(--color-accent-gold)' }} />
                        <div style={{ width: `${Math.round((brand.negative / brand.count) * 100)}%`, backgroundColor: 'var(--color-accent-red)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-surface-border flex items-center justify-between">
        <p className="text-[10px] text-text-muted">Data from Dutchie AI · {data.total} reviews analyzed</p>
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <Eye className="w-3 h-3" /> Live
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REPORTING — mock data generation + inline report snippet
   ═══════════════════════════════════════════════════════════════════ */

function generateReportData(query) {
  const lower = query.toLowerCase();

  // Determine time frame from query
  let timeframe = 'week';
  if (/month|monthly|last month|this month|30 day/i.test(lower)) timeframe = 'month';
  else if (/quarter|quarterly|q[1-4]|90 day/i.test(lower)) timeframe = 'quarter';
  else if (/year|annual|yearly|yoy|12 month/i.test(lower)) timeframe = 'year';
  else if (/today|daily/i.test(lower)) timeframe = 'day';

  // Determine focus from query
  let focus = 'overview';
  if (/top (seller|product|selling)|best seller|popular/i.test(lower)) focus = 'top_products';
  else if (/category|categories|breakdown|by type/i.test(lower)) focus = 'categories';
  else if (/location|store|by store|per store/i.test(lower)) focus = 'locations';
  else if (/vs market|versus market|benchmark|compare.*market|market average/i.test(lower)) focus = 'market';

  const labels = {
    day: { label: 'Today', trendLabels: ['8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm'] },
    week: { label: 'Last 7 Days', trendLabels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
    month: { label: 'Last 30 Days', trendLabels: ['Wk 1','Wk 2','Wk 3','Wk 4'] },
    quarter: { label: 'This Quarter', trendLabels: ['Jan','Feb','Mar'] },
    year: { label: 'Last 12 Months', trendLabels: ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb'] },
  };

  const tf = labels[timeframe];

  // Seeded pseudo-random based on query length for consistency
  const seed = query.length;
  const r = (min, max) => min + ((seed * 7 + min * 13) % (max - min));

  const baseRevenue = { day: 8400, week: 62800, month: 248000, quarter: 710000, year: 2940000 }[timeframe];
  const baseOrders = { day: 145, week: 1080, month: 4200, quarter: 12400, year: 51200 }[timeframe];
  const baseAOV = 52.40 + (seed % 8);

  // Revenue trend
  const trendData = tf.trendLabels.map((label, i) => {
    const variance = 0.75 + (((seed * (i + 1) * 7) % 50) / 100);
    const periodRev = (baseRevenue / tf.trendLabels.length) * variance;
    const prevVariance = 0.68 + (((seed * (i + 2) * 11) % 45) / 100);
    const prevRev = (baseRevenue / tf.trendLabels.length) * prevVariance;
    return { label, current: Math.round(periodRev), previous: Math.round(prevRev) };
  });

  const totalCurrent = trendData.reduce((s, d) => s + d.current, 0);
  const totalPrevious = trendData.reduce((s, d) => s + d.previous, 0);
  const growthPct = (((totalCurrent - totalPrevious) / totalPrevious) * 100).toFixed(1);

  // Top products
  const topProducts = [
    { name: 'Baby Jeeter Churros', category: 'Pre-Rolls', units: 284 + r(0,80), revenue: 7100 + r(0,2000) },
    { name: 'STIIIZY OG Kush Pod', category: 'Vapes', units: 210 + r(0,60), revenue: 6300 + r(0,1500) },
    { name: 'Kiva Camino Gummies', category: 'Edibles', units: 195 + r(0,50), revenue: 3900 + r(0,1000) },
    { name: 'Raw Garden Refined LR', category: 'Concentrates', units: 142 + r(0,40), revenue: 5680 + r(0,1200) },
    { name: 'Wyld Elderberry Gummies', category: 'Edibles', units: 138 + r(0,35), revenue: 2760 + r(0,700) },
  ];

  // Category breakdown
  const categoryData = [
    { name: 'Pre-Rolls', revenue: Math.round(baseRevenue * 0.28), pct: 28, color: '#9333EA' },
    { name: 'Flower', revenue: Math.round(baseRevenue * 0.24), pct: 24, color: '#16A34A' },
    { name: 'Vapes', revenue: Math.round(baseRevenue * 0.20), pct: 20, color: '#0EA5E9' },
    { name: 'Edibles', revenue: Math.round(baseRevenue * 0.15), pct: 15, color: 'var(--color-accent-gold)' },
    { name: 'Concentrates', revenue: Math.round(baseRevenue * 0.08), pct: 8, color: 'var(--color-accent-red)' },
    { name: 'Other', revenue: Math.round(baseRevenue * 0.05), pct: 5, color: '#8B949E' },
  ];

  // Location breakdown — matches alert narratives for consistency
  const locationData = [
    { name: 'Logan Square, IL', revenue: Math.round(baseRevenue * 0.18), orders: Math.round(baseOrders * 0.17), aov: 55.80, trend: '+22%' },
    { name: 'Springfield, IL', revenue: Math.round(baseRevenue * 0.14), orders: Math.round(baseOrders * 0.14), aov: 52.40, trend: '+18%' },
    { name: 'Fort Lee, NJ', revenue: Math.round(baseRevenue * 0.12), orders: Math.round(baseOrders * 0.12), aov: 50.20, trend: '+7%' },
    { name: 'Wicker Park, IL', revenue: Math.round(baseRevenue * 0.11), orders: Math.round(baseOrders * 0.11), aov: 54.60, trend: '+12%' },
    { name: 'Schaumburg, IL', revenue: Math.round(baseRevenue * 0.10), orders: Math.round(baseOrders * 0.10), aov: 48.90, trend: '+3%' },
    { name: 'Ann Arbor, MI', revenue: Math.round(baseRevenue * 0.09), orders: Math.round(baseOrders * 0.09), aov: 46.20, trend: '-18%' },
    { name: 'Naperville, IL', revenue: Math.round(baseRevenue * 0.08), orders: Math.round(baseOrders * 0.08), aov: 44.80, trend: '-12%' },
    { name: 'Grand Rapids, MI', revenue: Math.round(baseRevenue * 0.06), orders: Math.round(baseOrders * 0.06), aov: 42.10, trend: '-15%' },
    { name: 'Morenci, MI', revenue: Math.round(baseRevenue * 0.05), orders: Math.round(baseOrders * 0.05), aov: 38.50, trend: '-23%' },
    { name: 'Other (31 stores)', revenue: Math.round(baseRevenue * 0.07), orders: Math.round(baseOrders * 0.08), aov: 49.20, trend: '+4%' },
  ];

  // Market comparison
  const marketData = {
    aov: { yours: baseAOV, market: 44.20, label: 'Avg Order Value', format: v => `$${v.toFixed(2)}` },
    conversionRate: { yours: 24.8, market: 18.5, label: 'Conversion Rate', format: v => `${v}%` },
    repeatRate: { yours: 38.2, market: 29.4, label: 'Repeat Purchase %', format: v => `${v}%` },
    basketSize: { yours: 2.8, market: 2.3, label: 'Items per Order', format: v => `${v}` },
    revenuePerSqft: { yours: 142, market: 98, label: 'Rev / sq ft (wk)', format: v => `$${v}` },
  };

  return {
    timeframe,
    timeframeLabel: tf.label,
    focus,
    revenue: totalCurrent,
    previousRevenue: totalPrevious,
    growthPct: parseFloat(growthPct),
    orders: baseOrders,
    aov: baseAOV,
    trendData,
    topProducts,
    categoryData,
    locationData,
    marketData,
  };
}

function formatCurrency(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function ReportSnippet({ data }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = data.growthPct >= 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-text-secondary mb-1 font-medium">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-mono">{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-surface-bg rounded-xl border border-surface-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0EA5E9]/20 to-accent-green/20 flex items-center justify-center">
            <BarChart3 className="w-4.5 h-4.5 text-[#0EA5E9]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Performance Report</h3>
            <p className="text-[10px] text-text-muted">{data.timeframeLabel} · Ascend — All Locations</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isPositive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
        }`}>
          {isPositive ? '↑' : '↓'} {Math.abs(data.growthPct)}% vs prior
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 border-b border-surface-border px-4 py-1">
        {[
          { label: 'Revenue', value: formatCurrency(data.revenue), icon: DollarSign, color: 'var(--color-accent-green)' },
          { label: 'Orders', value: data.orders.toLocaleString(), icon: ShoppingCart, color: '#0EA5E9' },
          { label: 'Avg Order', value: `$${data.aov.toFixed(2)}`, icon: Tag, color: 'var(--color-accent-gold)' },
          { label: 'Growth', value: `${isPositive ? '+' : ''}${data.growthPct}%`, icon: TrendingUp, color: isPositive ? 'var(--color-accent-green)' : 'var(--color-accent-red)' },
        ].map(kpi => (
          <div key={kpi.label} className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <kpi.icon className="w-3 h-3" style={{ color: kpi.color }} />
              <p className="text-[10px] font-medium text-text-secondary">{kpi.label}</p>
            </div>
            <p className="text-base font-bold text-text-primary">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend chart */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] font-medium text-text-secondary mb-2">Revenue Trend — Current vs Prior Period</p>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <AreaChart data={data.trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reportGradCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reportGradPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B949E" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8B949E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="previous" name="Prior" stroke="#8B949E" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#reportGradPrev)" />
              <Area type="monotone" dataKey="current" name="Current" stroke="#0EA5E9" strokeWidth={2} fill="url(#reportGradCurrent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Focus section — top products, categories, locations, or market comparison */}
      <div className="px-5 pb-4">
        {(data.focus === 'overview' || data.focus === 'top_products') && (
          <div>
            <p className="text-[10px] font-medium text-text-secondary mb-2 mt-2">Top Sellers</p>
            <div className="space-y-1.5">
              {data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 bg-surface-card rounded-lg px-3 py-2 border border-surface-border">
                  <span className="text-[10px] font-bold text-text-muted w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{p.name}</p>
                    <p className="text-[10px] text-text-muted">{p.category} · {p.units} units</p>
                  </div>
                  <p className="text-xs font-semibold text-accent-green">{formatCurrency(p.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(data.focus === 'overview' || data.focus === 'categories') && (
          <div className={data.focus === 'overview' && !expanded ? 'hidden' : ''}>
            <p className="text-[10px] font-medium text-text-secondary mb-2 mt-3">Revenue by Category</p>
            <div className="space-y-1.5">
              {data.categoryData.map(cat => (
                <div key={cat.name} className="flex items-center gap-3">
                  <p className="text-xs text-text-primary w-24 truncate">{cat.name}</p>
                  <div className="flex-1 h-5 bg-surface-card rounded-full overflow-hidden border border-surface-border">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.pct}%`, backgroundColor: cat.color, opacity: 0.7 }} />
                  </div>
                  <p className="text-[10px] text-text-secondary w-14 text-right">{formatCurrency(cat.revenue)}</p>
                  <p className="text-[10px] text-text-muted w-8 text-right">{cat.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.focus === 'locations' && (
          <div>
            <p className="text-[10px] font-medium text-text-secondary mb-2 mt-2">By Location</p>
            <div className="grid grid-cols-2 gap-2">
              {data.locationData.map(loc => (
                <div key={loc.name} className="bg-surface-card rounded-lg p-3 border border-surface-border">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3 h-3 text-[#0EA5E9]" />
                    <p className="text-xs font-medium text-text-primary">{loc.name}</p>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-sm font-bold text-text-primary">{formatCurrency(loc.revenue)}</p>
                    {loc.trend && <span className={`text-[10px] font-semibold ${loc.trend.startsWith('-') ? 'text-accent-red' : 'text-accent-green'}`}>{loc.trend}</span>}
                  </div>
                  <p className="text-[10px] text-text-muted">{loc.orders.toLocaleString()} orders · AOV ${loc.aov.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.focus === 'market' && (
          <div>
            <p className="text-[10px] font-medium text-text-secondary mb-2 mt-2">You vs Market Average</p>
            <div className="space-y-2">
              {Object.values(data.marketData).map(m => {
                const pctDiff = (((m.yours - m.market) / m.market) * 100).toFixed(0);
                const ahead = m.yours >= m.market;
                const yoursWidth = Math.min(100, (m.yours / Math.max(m.yours, m.market)) * 100);
                const marketWidth = Math.min(100, (m.market / Math.max(m.yours, m.market)) * 100);
                return (
                  <div key={m.label} className="bg-surface-card rounded-lg p-3 border border-surface-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-text-primary">{m.label}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ahead ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                        {ahead ? '+' : ''}{pctDiff}% vs market
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#0EA5E9] w-12">You</span>
                        <div className="flex-1 h-3 bg-surface-bg rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#0EA5E9]" style={{ width: `${yoursWidth}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-text-primary w-12 text-right">{m.format(m.yours)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-secondary w-12">Market</span>
                        <div className="flex-1 h-3 bg-surface-bg rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#8B949E]/50" style={{ width: `${marketWidth}%` }} />
                        </div>
                        <span className="text-[10px] text-text-secondary w-12 text-right">{m.format(m.market)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expand/collapse for overview */}
        {data.focus === 'overview' && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-3 text-[10px] text-[#0EA5E9] hover:text-[#38BDF8] transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Show less' : 'Show category breakdown'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-surface-border flex items-center justify-between">
        <p className="text-[10px] text-text-muted">Data as of today, 10:00 AM EST · Powered by Dutchie AI</p>
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <Eye className="w-3 h-3" /> Live
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TYPING INDICATOR
   ═══════════════════════════════════════════════════════════════════ */

function ThinkingIndicator({ status }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A1710 0%, #2A2318 100%)', border: '1px solid rgba(212,160,58,0.2)' }}>
        <NexusIcon size={16} />
      </div>
      <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 min-w-[220px]">
        {status ? (
          <div className="flex items-center gap-2.5">
            <div className="relative w-4 h-4 flex-shrink-0">
              <div className="absolute inset-0 rounded-full border-2 border-surface-border" />
              <div className="absolute inset-0 rounded-full border-2 border-t-accent-gold animate-spin" />
            </div>
            <span className="text-text-secondary text-sm thinking-shimmer">{status}</span>
            {elapsed > 2 && <span className="text-text-muted text-xs ml-auto">{elapsed}s</span>}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#8B949E] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#8B949E] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#8B949E] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUGGESTION BUBBLES
   ═══════════════════════════════════════════════════════════════════ */

const SUGGESTIONS = [
  {
    key: 'menu',
    label: 'How do I set up my menu?',
    icon: BookOpen,
    gradient: 'from-cyan-600/20 to-blue-600/20',
    border: 'hover:border-cyan-500/40',
    tag: 'Support',
    tagColor: '#0EA5E9',
  },
  {
    key: 'whitelabel',
    label: 'I want my own branding on the App Store',
    icon: Smartphone,
    gradient: 'from-pink-600/20 to-rose-600/20',
    border: 'hover:border-pink-500/40',
    tag: 'Upgrade',
    tagColor: '#EC4899',
  },
  {
    key: 'fees',
    label: 'Credit card fees are too high',
    icon: CreditCard,
    gradient: 'from-amber-600/20 to-orange-600/20',
    border: 'hover:border-amber-500/40',
    tag: 'Fintech',
    tagColor: 'var(--color-accent-gold)',
  },
  {
    key: 'bug',
    label: 'The checkout button is lagging',
    icon: Bug,
    gradient: 'from-red-600/20 to-orange-600/20',
    border: 'hover:border-red-500/40',
    tag: 'Report',
    tagColor: 'var(--color-accent-red)',
  },
  {
    key: 'campaign',
    label: 'Run a marketing campaign',
    icon: Megaphone,
    gradient: 'from-green-600/20 to-emerald-600/20',
    border: 'hover:border-green-500/40',
    tag: 'Marketing',
    tagColor: 'var(--color-accent-green)',
  },
  {
    key: 'inventory',
    label: 'Show me a plan to reorder out-of-stock inventory',
    icon: Package,
    gradient: 'from-blue-600/20 to-indigo-600/20',
    border: 'hover:border-blue-500/40',
    tag: 'Connect',
    tagColor: 'var(--color-accent-blue)',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   NEXUS ACTION DATA — operational responses for persona action tiles
   ═══════════════════════════════════════════════════════════════════ */

function getNexusActionData(action) {
  const A = {
    portfolio: { title:'Portfolio Summary', color:'var(--color-accent-gold)', summary:'Here\'s your portfolio overview across all 39 stores in 7 states.',
      kpis:[{l:'Total Revenue',v:'$10.5M',c:'var(--color-accent-green)'},{l:'SSG',v:'+6.8%',c:'#0EA5E9'},{l:'OOS Lost Sales',v:'$112K',c:'var(--color-accent-red)'},{l:'Active Stores',v:'39',c:'var(--color-accent-purple)'}],
      cols:['State','Stores','Revenue (MTD)','Growth','Health'],
      rows:[['Illinois',8,'$2.4M','+9%',94],['New Jersey',5,'$1.7M','+7%',90],['Ohio',6,'$1.6M','+5%',86],['Pennsylvania',5,'$1.3M','+6%',88],['Massachusetts',4,'$1.2M','+4%',85],['Maryland',4,'$1.1M','+3%',84],['Michigan',7,'$1.1M','-4%',62]],
      actions:[{label:'View State Details',done:'Showing state breakdown'},{label:'Export Report',done:'Report downloaded'}]},
    revenue_state: { title:'State Revenue Comparison', color:'var(--color-accent-green)', summary:'Revenue breakdown across all 7 states — current month vs prior.',
      kpis:[{l:'Total MTD',v:'$10.50M',c:'var(--color-accent-green)'},{l:'vs Prior',v:'+$960K',c:'#0EA5E9'},{l:'Top State',v:'Illinois',c:'var(--color-accent-gold)'},{l:'Fastest Growth',v:'New Jersey',c:'var(--color-accent-purple)'}],
      cols:['State','Current MTD','Prior Month','Delta','% Change'],
      rows:[['New Jersey','$1.71M','$1.45M','+$260K','+18%'],['Ohio','$1.62M','$1.41M','+$210K','+15%'],['Illinois','$2.41M','$2.15M','+$260K','+12%'],['Maryland','$1.12M','$1.01M','+$110K','+11%'],['Massachusetts','$1.22M','$1.12M','+$100K','+9%'],['Pennsylvania','$1.32M','$1.25M','+$70K','+6%'],['Michigan','$1.10M','$1.15M','-$50K','-4%']],
      actions:[{label:'Export CSV',done:'CSV downloaded'},{label:'Email to VPs',done:'Sent to 3 VPs'}]},
    compliance_all: { title:'Operational Health — All States', color:'var(--color-accent-green)', summary:'System health and sync status across all 7 states at a glance.',
      kpis:[{l:'States Online',v:'6/7',c:'var(--color-accent-green)'},{l:'Needs Attention',v:'1',c:'var(--color-accent-gold)'},{l:'Total Stores',v:'39',c:'#0EA5E9'},{l:'Uptime',v:'99.8%',c:'var(--color-accent-green)'}],
      cols:['State','Stores','Status','Last Updated','Uptime','Next Review'],
      rows:[['Illinois',8,'All Good','2 min ago','100%','Apr 15'],['Michigan',7,'All Good','5 min ago','99.9%','May 1'],['Ohio',6,'All Good','3 min ago','100%','Apr 22'],['Pennsylvania',5,'Review','47 min ago','98.2%','Mar 28'],['New Jersey',5,'All Good','8 min ago','100%','Apr 10'],['Maryland',4,'All Good','1 min ago','100%','May 15'],['Massachusetts',4,'All Good','4 min ago','99.9%','Apr 5']],
      actions:[{label:'View PA Details',done:'Showing PA sync history'},{label:'Export Status',done:'Report downloaded'}]},
    brand_perf: { title:'Brand Performance Rankings', color:'var(--color-accent-purple)', summary:'Top brands across all stores by revenue contribution this month.',
      kpis:[{l:'Top Brand',v:'Jeeter',c:'var(--color-accent-green)'},{l:'Highest Margin',v:'Wyld (45%)',c:'var(--color-accent-gold)'},{l:'Fastest Growth',v:'Jeeter (+22%)',c:'#0EA5E9'},{l:'Brands Tracked',v:'48',c:'var(--color-accent-purple)'}],
      cols:['Rank','Brand','Category','Revenue','Units','Margin','Trend'],
      rows:[['#1','Jeeter','Pre-Rolls','$1.42M','31.2K','42%','+22%'],['#2','STIIIZY','Vapes','$1.18M','18.4K','42%','+15%'],['#3','Wyld','Edibles','$892K','44.6K','45%','+18%'],['#4','Raw Garden','Concentrates','$764K','12.1K','36%','+9%'],['#5','Kiva','Edibles','$651K','29.8K','44%','+12%'],['#6','Cookies','Flower','$598K','8.9K','40%','-3%']],
      actions:[{label:'View Reorder Options',done:'Showing reorder details for top brands'},{label:'Export Rankings',done:'CSV downloaded'}]},
    rankings: { title:'Store Performance Rankings', color:'var(--color-accent-green)', summary:'All stores in IL, MI, OH ranked by composite performance score.',
      kpis:[{l:'Top Store',v:'Logan Square',c:'var(--color-accent-green)'},{l:'Avg Score',v:'78/100',c:'#0EA5E9'},{l:'Region Revenue',v:'$5.94M',c:'var(--color-accent-gold)'},{l:'Declining',v:'3 MI stores',c:'var(--color-accent-red)'}],
      cols:['Rank','Store','State','Revenue','vs Forecast','Score'],
      rows:[['#1','Ascend Logan Square','IL','$412K','+22%',96],['#2','Ascend River North','IL','$388K','+8%',94],['#3','Ascend Springfield','IL','$367K','+18%',91],['#4','Ascend Columbus','OH','$351K','+5%',88],['#5','Ascend Schaumburg','IL','$342K','+3%',85],['#6','Ascend Ann Arbor','MI','$284K','-18%',62],['#7','Ascend Grand Rapids','MI','$261K','-15%',58],['#8','Ascend Morenci','MI','$198K','-23%',48]],
      actions:[{label:'View Bottom Stores',done:'Showing Ann Arbor, Grand Rapids, Morenci details'},{label:'Export Rankings',done:'CSV downloaded'}]},
    rebalance: { title:'Blue Dream — OOS & Rebalance', color:'var(--color-accent-red)', summary:'4 stores out of stock on Blue Dream, 3 nearby with surplus. Rebalance transfers recommended.',
      kpis:[{l:'OOS Stores',v:'4',c:'var(--color-accent-red)'},{l:'Surplus Stores',v:'3',c:'var(--color-accent-green)'},{l:'Lost Rev/Day',v:'$2,840',c:'var(--color-accent-gold)'},{l:'Transfer ETA',v:'~24hrs',c:'var(--color-accent-blue)'}],
      cols:['Store','State','Status','Qty','Recommended Action'],
      rows:[['Ascend Schaumburg','IL','OUT OF STOCK','0 units','Receive from Logan Sq'],['Ascend Canton','OH','OUT OF STOCK','0 units','Receive from Columbus'],['Ascend Springfield','IL','OUT OF STOCK','0 units','Receive from River North'],['Ascend Kalamazoo','MI','OUT OF STOCK','0 units','Receive from Ann Arbor'],['Ascend Logan Square','IL','SURPLUS','124 units','Transfer 40 → Schaumburg'],['Ascend River North','IL','SURPLUS','98 units','Transfer 35 → Springfield'],['Ascend Columbus','OH','SURPLUS','87 units','Transfer 30 → Canton']],
      actions:[{label:'View Transfer Details',done:'Showing transfer breakdown by store'},{label:'Export Report',done:'Report downloaded'}]},
    compare: { title:'IL vs OH Revenue Comparison', color:'var(--color-accent-gold)', summary:'Side-by-side comparison of Illinois and Ohio revenue metrics this month.',
      kpis:[{l:'IL Revenue',v:'$2.41M',c:'var(--color-accent-green)'},{l:'OH Revenue',v:'$1.62M',c:'#0EA5E9'},{l:'IL Lead',v:'+$790K',c:'var(--color-accent-gold)'},{l:'OH Faster Growth',v:'+15%',c:'var(--color-accent-purple)'}],
      cols:['Metric','Illinois','Ohio','Delta'],
      rows:[['Total Revenue','$2.41M','$1.62M','+$790K (IL)'],['Total Orders','24,812','16,541','+8,271 (IL)'],['Avg Order Value','$97.10','$98.00','+$0.90 (OH)'],['Growth vs Prior','+12%','+15%','+3% (OH)'],['Store Count','8','6','+2 (IL)'],['Rev per Store','$301K','$270K','+$31K (IL)']],
      actions:[{label:'View Full Comparison',done:'Showing detailed breakdown'},{label:'Export Report',done:'Report downloaded'}]},
    practices: { title:'Best Practices — Cross-Store Insights', color:'var(--color-accent-purple)', summary:'Actionable practices from top-performing stores that could lift underperformers.',
      kpis:[{l:'Practices Found',v:'5',c:'var(--color-accent-purple)'},{l:'High Priority',v:'2',c:'var(--color-accent-red)'},{l:'Est. Rev Lift',v:'+$340K/mo',c:'var(--color-accent-green)'},{l:'Stores Impacted',v:'21',c:'var(--color-accent-gold)'}],
      cols:['Practice','Source Store','Impact','Applicable To','Priority'],
      rows:[['Happy Hour 4-6pm','River North (IL)','+18% AOV','12 stores','High'],['Budtender Rec Display','Ann Arbor (MI)','+23% attach rate','8 stores','High'],['Text-Before-Pickup','Columbus (OH)','-40% wait time','15 stores','Medium'],['Weekend Loyalty 2x Pts','Logan Square (IL)','+31% Sat volume','21 stores','Medium'],['New Arrivals Endcap','Edison (NJ)','+15% new SKU trial','18 stores','Low']],
      actions:[{label:'View Practice Details',done:'Showing implementation details'},{label:'Export Playbook',done:'Playbook PDF downloaded'}]},
    transfers: { title:'Pending Vault Transfers — Illinois', color:'var(--color-accent-gold)', summary:'6 inter-store vault transfers for IL — 3 awaiting your approval.',
      kpis:[{l:'Pending Approval',v:'3',c:'var(--color-accent-gold)'},{l:'In Transit',v:'2',c:'#0EA5E9'},{l:'Delivered Today',v:'1',c:'var(--color-accent-green)'},{l:'Total Value',v:'$18.4K',c:'var(--color-accent-purple)'}],
      cols:['Transfer ID','From','To','Product','Qty','Status','METRC Tag'],
      rows:[['VT-4821','Logan Square','Schaumburg','Blue Dream 3.5g',40,'Awaiting Approval','1A40..3921'],['VT-4822','River North','Springfield','Blue Dream 3.5g',35,'Awaiting Approval','1A40..3922'],['VT-4818','River North','Naperville','Jeeter Baby Js 5pk',60,'In Transit','1A40..3918'],['VT-4815','Naperville','Schaumburg','Wyld Gummies 10pk',80,'In Transit','1A40..3915'],['VT-4810','Logan Square','Peoria','STIIIZY Pod 1g',24,'Awaiting Approval','1A40..3910'],['VT-4808','Springfield','Champaign','Kiva Camino 20pk',48,'Delivered','1A40..3908']],
      actions:[{label:'View Pending Details',done:'Showing pending transfer details'},{label:'Export Manifests',done:'Manifest PDFs downloaded'}]},
    delivery: { title:'Today\'s Delivery Schedule — Illinois', color:'var(--color-accent-blue)', summary:'Vendor deliveries for all Illinois stores today.',
      kpis:[{l:'Deliveries Today',v:'5',c:'var(--color-accent-blue)'},{l:'Completed',v:'2',c:'var(--color-accent-green)'},{l:'In Transit',v:'1',c:'var(--color-accent-gold)'},{l:'Scheduled',v:'2',c:'var(--color-accent-purple)'}],
      cols:['Time','Store','Vendor','Items','Status','PO #'],
      rows:[['9:00 AM','River North','Jeeter','12 SKUs','Delivered','PO-8821'],['10:30 AM','Logan Square','STIIIZY','8 SKUs','Delivered','PO-8819'],['12:00 PM','Naperville','Wyld','6 SKUs','In Transit','PO-8825'],['1:30 PM','Schaumburg','Kiva','10 SKUs','Scheduled','PO-8830'],['3:00 PM','Springfield','Raw Garden','5 SKUs','Scheduled','PO-8832']],
      actions:[{label:'View Delivery Details',done:'Showing full delivery manifest'},{label:'Export Schedule',done:'Schedule downloaded'}]},
    close: { title:'Daily Close Reports — Illinois', color:'var(--color-accent-green)', summary:'Yesterday\'s close summaries for all 8 Illinois stores.',
      kpis:[{l:'Total Revenue',v:'$303.6K',c:'var(--color-accent-green)'},{l:'Total Orders',v:'3,090',c:'#0EA5E9'},{l:'Balanced',v:'6/8',c:'var(--color-accent-gold)'},{l:'Needs Review',v:'2',c:'var(--color-accent-red)'}],
      cols:['Store','Revenue','Orders','Cash Collected','Variance','Status'],
      rows:[['Logan Square','$48.2K','492','$10.4K','$0','Balanced'],['River North','$48.2K','494','$10.1K','$0','Balanced'],['Springfield','$32.6K','332','$7.2K','$0','Balanced'],['Naperville','$28.4K','289','$6.1K','$0','Balanced'],['Schaumburg','$41.5K','418','$8.9K','+$47','Review'],['Arl. Heights','$24.8K','252','$5.4K','-$12','Review'],['Peoria','$28.4K','289','$6.1K','$0','Balanced'],['Bloomington','$21.2K','216','$4.6K','$0','Balanced']],
      actions:[{label:'View Variances',done:'Showing Schaumburg (+$47) & Arlington Heights (-$12) details'},{label:'Export Close Report',done:'PDF downloaded'}]},
    labor: { title:'Labor Metrics — Illinois Stores', color:'var(--color-accent-purple)', summary:'Staffing levels and labor efficiency for all IL stores this week.',
      kpis:[{l:'Total Staff',v:'80',c:'var(--color-accent-purple)'},{l:'Avg Efficiency',v:'88%',c:'var(--color-accent-green)'},{l:'Overtime',v:'18.2 hrs',c:'var(--color-accent-red)'},{l:'Over Budget',v:'Schaumburg +12%',c:'var(--color-accent-red)'}],
      cols:['Store','Staff Today','Scheduled','Overtime','Cost/Order','Efficiency'],
      rows:[['Logan Square',16,16,'0 hrs','$4.91','94%'],['River North',18,18,'2.1 hrs','$4.82','92%'],['Springfield',10,10,'3.5 hrs','$5.48','87%'],['Naperville',13,15,'0 hrs','$5.42','82%'],['Schaumburg',11,14,'12.6 hrs','$6.18','76%'],['Peoria',9,10,'0 hrs','$5.61','85%']],
      actions:[{label:'View Schaumburg Details',done:'Showing Schaumburg staffing breakdown'},{label:'Export Labor Report',done:'Report downloaded'}]},
    vault_transfer: { title:'Vault-to-Floor Transfer Queue', color:'var(--color-accent-blue)', summary:'7 items in your vault ready for floor replenishment at Logan Square.',
      kpis:[{l:'Critical',v:'3 SKUs',c:'var(--color-accent-red)'},{l:'High',v:'1 SKU',c:'var(--color-accent-gold)'},{l:'Total to Move',v:'108 units',c:'#0EA5E9'},{l:'Est. Time',v:'~25 min',c:'var(--color-accent-purple)'}],
      cols:['Product','In Vault','On Floor','Restock Qty','Urgency'],
      rows:[['Blue Dream 3.5g',124,3,20,'Critical'],['Jeeter Baby Js 5pk',88,5,15,'High'],['STIIIZY OG Pod 1g',56,2,12,'Critical'],['Wyld Elderberry 10pk',200,8,25,'Medium'],['Kiva Camino 20pk',144,6,18,'Medium'],['Raw Garden Sauce 1g',42,1,10,'Critical'],['Cookies Gary Payton 3.5g',36,4,8,'Low']],
      actions:[{label:'View Pull List',done:'Showing prioritized pull list'},{label:'Export List',done:'Pull list downloaded'}]},
    sync_status: { title:'Inventory Sync Overview', color:'var(--color-accent-green)', summary:'Live inventory sync health across all state systems.',
      kpis:[{l:'Systems Online',v:'6/7',c:'var(--color-accent-green)'},{l:'Needs Attention',v:'1 (PA)',c:'var(--color-accent-gold)'},{l:'Total Products',v:'56,400',c:'#0EA5E9'},{l:'Accuracy',v:'99.7%',c:'var(--color-accent-green)'}],
      cols:['State','System','Last Updated','Status','Products Tracked','Accuracy'],
      rows:[['Illinois','METRC','2 min ago','All Good','12,481','100%'],['Michigan','METRC','5 min ago','All Good','9,842','99.9%'],['Ohio','METRC','3 min ago','All Good','8,215','100%'],['Pennsylvania','MJ Freeway','47 min ago','Review','6,932','97.8%'],['New Jersey','METRC','8 min ago','All Good','7,621','100%'],['Maryland','METRC','1 min ago','All Good','5,418','100%'],['Massachusetts','METRC','4 min ago','All Good','5,891','99.9%']],
      actions:[{label:'View PA Details',done:'Showing Pennsylvania sync details'},{label:'Export Status Report',done:'Report downloaded'}]},
    discrepancy: { title:'Inventory Exceptions', color:'var(--color-accent-gold)', summary:'Items that need attention — quantity mismatches flagged for review.',
      kpis:[{l:'Open Items',v:'9',c:'var(--color-accent-gold)'},{l:'Priority',v:'3 urgent',c:'var(--color-accent-red)'},{l:'Most Affected',v:'PA (5)',c:'var(--color-accent-blue)'},{l:'Avg Resolution',v:'2.1 days',c:'var(--color-accent-green)'}],
      cols:['ID','Store','Product','Expected','Actual','Diff','Age','Priority'],
      rows:[['EX-291','Scranton (PA)','Jeeter Infused 1g',24,22,-2,'3 days','Urgent'],['EX-289','Scranton (PA)','Wyld CBN Pear 10pk',48,50,+2,'3 days','Urgent'],['EX-287','Reading (PA)','STIIIZY Pod 0.5g',12,10,-2,'5 days','Urgent'],['EX-285','Ann Arbor (MI)','Kiva Terra Bites',36,35,-1,'2 days','Standard'],['EX-283','Detroit (MI)','Raw Garden Cart 1g',18,19,+1,'1 day','Low'],['EX-280','Edison (NJ)','Cookies Flower 3.5g',8,9,+1,'4 days','Standard']],
      actions:[{label:'View Urgent Items',done:'Showing PA exception details'},{label:'Export Exceptions',done:'Report downloaded'}]},
    audit: { title:'Store Readiness Score — Illinois', color:'var(--color-accent-green)', summary:'Operational readiness checklist across all 8 IL stores.',
      kpis:[{l:'Overall Score',v:'96%',c:'var(--color-accent-green)'},{l:'Checks Passing',v:'6/7',c:'#0EA5E9'},{l:'To-Do Items',v:'3',c:'var(--color-accent-gold)'},{l:'Next Review',v:'Apr 15',c:'var(--color-accent-blue)'}],
      cols:['Area','Status','Score','Stores Passing','Notes'],
      rows:[['Product accuracy','Pass','99.8%','8/8','All good'],['Documentation','Pass','100%','8/8','All filed'],['Waste tracking','Pass','98.5%','7/8','Peoria — 2 pending'],['Vault accuracy','Review','97.2%','6/8','Springfield, Champaign need cycle count'],['Team credentials','Pass','100%','8/8','All current'],['Camera systems','Pass','99.9%','8/8','1 replaced last week'],['Visitor tracking','Pass','100%','8/8','Digital logs active']],
      actions:[{label:'View Details',done:'Showing readiness breakdown'},{label:'Export Report',done:'Readiness report downloaded'}]},
    regulatory: { title:'Upcoming Industry Changes', color:'var(--color-accent-purple)', summary:'Key changes across your markets to stay ahead of.',
      kpis:[{l:'Upcoming',v:'5',c:'var(--color-accent-purple)'},{l:'Action Needed',v:'1',c:'var(--color-accent-red)'},{l:'Impactful',v:'2',c:'var(--color-accent-gold)'},{l:'Next Date',v:'Apr 1',c:'var(--color-accent-blue)'}],
      cols:['Date','State','What\'s Changing','Impact','Your Next Step'],
      rows:[['Apr 1','Illinois','New potency testing for edibles','High','Update vendor process'],['Apr 15','New Jersey','Delivery license expansion','Medium','Evaluate delivery ops'],['May 1','Pennsylvania','System API v3 migration','High','Dev team integration update'],['May 15','Ohio','Updated THC labeling requirements','Medium','Audit current labels'],['Jun 1','Maryland','Updated packaging requirements','Medium','Review current packaging']],
      actions:[{label:'View Upcoming Changes',done:'Showing regulatory timeline'},{label:'Export Calendar',done:'Calendar exported'}]},
    winback_campaign: { title:'Win-Back Campaign — Lapsed Customers', color:'var(--color-accent-green)', summary:'Customers inactive 60+ days with high lifetime value, ready for re-engagement.',
      kpis:[{l:'Lapsed (60d+)',v:'1,247',c:'var(--color-accent-red)'},{l:'Avg LTV',v:'$2,840',c:'var(--color-accent-green)'},{l:'Win-Back Rate',v:'23%',c:'var(--color-accent-gold)'},{l:'Est. Revenue',v:'$89K',c:'#0EA5E9'}],
      cols:['Customer Segment','Count','Avg Last Visit','Avg LTV','Top Category','Recommended Channel'],
      rows:[['High-Value VIP (>$5K LTV)',142,'72 days','$6,420','Flower','SMS + $25 credit'],['Regular Weekly (was 1x/wk)',384,'68 days','$3,180','Vapes','Email + 20% off'],['Monthly Bulk Buyers',218,'91 days','$2,650','Edibles','Push + BOGO'],['New-ish (3-6 purchases)',503,'85 days','$890','Pre-rolls','SMS + first-timer bundle']],
      actions:[{label:'View Campaign Plan',done:'Showing win-back campaign details'},{label:'Export Audience',done:'Audience list downloaded'}]},
    market_prices: { title:'Price vs Market Comparison', color:'var(--color-accent-gold)', summary:'Your top sellers compared to competitor and market average pricing.',
      kpis:[{l:'Below Market',v:'12',c:'var(--color-accent-green)'},{l:'At Market',v:'18',c:'#0EA5E9'},{l:'Above Market',v:'6',c:'var(--color-accent-red)'},{l:'Avg Gap',v:'-3.2%',c:'var(--color-accent-green)'}],
      cols:['Product','Your Price','Market Avg','Competitor Low','Gap','Recommendation'],
      rows:[['Blue Dream 3.5g','$38','$42','$35','-9.5%','At optimal'],['STIIIZY OG Pod 1g','$45','$48','$42','-6.3%','At optimal'],['Wyld Elderberry 10pk','$18','$20','$16','-10%','At optimal'],['Jeeter Baby Js 5pk','$35','$38','$33','-7.9%','At optimal'],['Kiva Camino 20pk','$22','$24','$20','-8.3%','At optimal'],['Raw Garden Sauce 1g','$28','$32','$25','-12.5%','Opportunity to raise']],
      actions:[{label:'View Price Details',done:'Showing full price comparison'},{label:'Export Analysis',done:'Price analysis downloaded'}]},
    sentiment_overview: { title:'Customer Sentiment — This Month', color:'var(--color-accent-purple)', summary:'Aggregated feedback from reviews, surveys, and support interactions.',
      kpis:[{l:'NPS Score',v:'72',c:'var(--color-accent-green)'},{l:'Avg Rating',v:'4.6★',c:'var(--color-accent-gold)'},{l:'Reviews',v:'348',c:'#0EA5E9'},{l:'Trend',v:'+5 pts',c:'var(--color-accent-green)'}],
      cols:['Theme','Mentions','Sentiment','Trend','Sample Feedback'],
      rows:[['Product Quality',89,'Positive','Balanced','Great flower selection, always fresh'],['Wait Times',64,'Warning','Review','Line was long on Saturday, but staff was friendly'],['Staff Knowledge',52,'Positive','Balanced','Budtender knew exactly what I needed'],['Price Value',47,'Warning','Review','Prices higher than shop down the street'],['Online Ordering',38,'Positive','Balanced','Pickup was super smooth, ready in 10 min']],
      actions:[{label:'View All Feedback',done:'Showing full sentiment breakdown'},{label:'Export Report',done:'Sentiment report downloaded'}]},
    shrinkage: { title:'Shrinkage & Waste Report', color:'var(--color-accent-red)', summary:'Inventory shrinkage across all stores — product loss from waste, damage, and unaccounted discrepancies.',
      kpis:[{l:'Total Shrinkage',v:'$42.1K',c:'var(--color-accent-red)'},{l:'% of Revenue',v:'0.38%',c:'var(--color-accent-gold)'},{l:'Biggest Source',v:'Expired (61%)',c:'var(--color-accent-blue)'},{l:'vs Target',v:'Over by $8K',c:'var(--color-accent-red)'}],
      cols:['Store','Expired','Damaged','Unaccounted','Total Loss','% Rev'],
      rows:[['River North','$2.8K','$410','$180','$3.39K','0.28%'],['Logan Square','$3.1K','$620','$340','$4.06K','0.41%'],['Naperville','$4.2K','$890','$510','$5.60K','0.62%'],['Ann Arbor','$2.4K','$310','$120','$2.83K','0.31%'],['Columbus','$3.6K','$480','$290','$4.37K','0.52%'],['Edison','$2.1K','$280','$90','$2.47K','0.24%']],
      actions:[{label:'View Naperville Details',done:'Showing Naperville shrinkage breakdown'},{label:'Export Report',done:'Shrinkage report downloaded'}]},
    category_mix: { title:'Category Mix & Trends', color:'var(--color-accent-purple)', summary:'Product category revenue share and movement trends across the portfolio.',
      kpis:[{l:'Top Category',v:'Flower (28%)',c:'var(--color-accent-green)'},{l:'Fastest Growing',v:'Pre-Rolls (+22%)',c:'#0EA5E9'},{l:'Declining',v:'Vapes (-3%)',c:'var(--color-accent-red)'},{l:'Categories',v:'8',c:'var(--color-accent-purple)'}],
      cols:['Category','Revenue','Share','vs Prior Month','Units Sold','Avg Price'],
      rows:[['Flower','$3.1M','28%','+5%','71.2K','$43.50'],['Vapes','$2.4M','21%','-3%','39.8K','$60.30'],['Edibles','$2.1M','19%','+12%','95.4K','$22.00'],['Pre-Rolls','$1.8M','16%','+22%','41.6K','$43.27'],['Concentrates','$1.2M','11%','+8%','15.2K','$78.95'],['Tinctures','$0.6M','5%','+4%','12.8K','$46.88']],
      actions:[{label:'View Category Details',done:'Showing full category breakdown'},{label:'Export Report',done:'Category report downloaded'}]},
    budtender_perf: { title:'Budtender Performance — Logan Square', color:'var(--color-accent-green)', summary:'Individual budtender metrics for this store this month.',
      kpis:[{l:'Top Seller',v:'Maria G.',c:'var(--color-accent-green)'},{l:'Avg AOV',v:'$97.40',c:'var(--color-accent-gold)'},{l:'Attach Rate',v:'2.4 items',c:'#0EA5E9'},{l:'Staff',v:'16',c:'var(--color-accent-purple)'}],
      cols:['Budtender','Transactions','Revenue','AOV','Items/Basket','Upsell Rate'],
      rows:[['Maria G.',412,'$48.2K','$117.00','3.1','34%'],['James T.',388,'$41.6K','$107.20','2.8','28%'],['Aisha K.',365,'$38.9K','$106.60','2.6','25%'],['Devon R.',341,'$33.4K','$97.90','2.3','21%'],['Priya S.',298,'$26.1K','$87.60','2.1','16%'],['Mike L.',275,'$22.8K','$82.90','1.9','12%']],
      actions:[{label:'View All Budtenders',done:'Showing full team breakdown'},{label:'Export Report',done:'Performance report downloaded'}]},
    daily_flash: { title:'Daily Flash Report — Today', color:'var(--color-accent-gold)', summary:'Real-time sales snapshot across the portfolio for today so far.',
      kpis:[{l:'Today So Far',v:'$198K',c:'var(--color-accent-green)'},{l:'vs Same Day LW',v:'+4.1%',c:'#0EA5E9'},{l:'Orders',v:'1,847',c:'var(--color-accent-gold)'},{l:'Avg Basket',v:'$107.20',c:'var(--color-accent-purple)'}],
      cols:['Store','Revenue','Orders','AOV','vs Last Week','Peak Hour'],
      rows:[['Logan Square, IL','$34.2K','298','$114.80','+22%','11am-12pm'],['River North, IL','$32.1K','286','$112.20','+11%','12-1pm'],['Springfield, IL','$28.8K','254','$113.40','+18%','1-2pm'],['Columbus, OH','$22.1K','206','$107.30','+5%','12-1pm'],['Naperville, IL','$16.4K','178','$92.10','-12%','12-1pm'],['Ann Arbor, MI','$14.2K','148','$95.90','-18%','1-2pm'],['Grand Rapids, MI','$12.8K','138','$92.80','-15%','12-1pm'],['Morenci, MI','$8.4K','94','$89.40','-23%','11am-12pm']],
      actions:[{label:'View Declining Stores',done:'Showing MI store details'},{label:'Export Flash Report',done:'CSV downloaded'}]},
    allotment_check: { title:'Purchase Allotment Status', color:'var(--color-accent-blue)', summary:'Customers approaching daily purchase limits — flagged for budtender awareness.',
      kpis:[{l:'Near Limit',v:'23',c:'var(--color-accent-gold)'},{l:'At Limit',v:'4',c:'var(--color-accent-red)'},{l:'Avg Utilization',v:'62%',c:'#0EA5E9'},{l:'Med Patients',v:'8 near',c:'var(--color-accent-purple)'}],
      cols:['Customer','Type','Purchased Today','Limit','Remaining','Status'],
      rows:[['J. Smith','Rec','0.85 oz','1.0 oz','0.15 oz','Warning'],['M. Johnson','Med','2.1 oz','2.5 oz','0.4 oz','Warning'],['A. Williams','Rec','0.92 oz','1.0 oz','0.08 oz','Critical'],['D. Brown','Rec','1.0 oz','1.0 oz','0 oz','At Limit'],['S. Davis','Med','2.4 oz','2.5 oz','0.1 oz','Critical'],['R. Martinez','Rec','0.78 oz','1.0 oz','0.22 oz','Warning']],
      actions:[{label:'View All Near Limit',done:'Showing full allotment list'},{label:'Export Log',done:'Allotment log downloaded'}]},
    vendor_scorecard: { title:'Vendor Scorecard — Top Suppliers', color:'var(--color-accent-purple)', summary:'Vendor performance based on fill rates, delivery reliability, and margin contribution.',
      kpis:[{l:'Top Vendor',v:'Jeeter',c:'var(--color-accent-green)'},{l:'Lowest Fill Rate',v:'Cookies (82%)',c:'var(--color-accent-red)'},{l:'Avg Lead Time',v:'4.2 days',c:'var(--color-accent-gold)'},{l:'Active Vendors',v:'24',c:'var(--color-accent-purple)'}],
      cols:['Vendor','Fill Rate','On-Time %','Avg Lead Time','Revenue','Margin','Issues'],
      rows:[['Jeeter','98%','96%','3 days','$1.42M','42%','0'],['STIIIZY','95%','94%','4 days','$1.18M','42%','1 short ship'],['Wyld','97%','92%','5 days','$892K','45%','0'],['Raw Garden','94%','90%','4 days','$764K','36%','2 late'],['Kiva','96%','95%','3 days','$651K','44%','0'],['Cookies','82%','78%','7 days','$598K','40%','4 shorts']],
      actions:[{label:'View Vendor Details',done:'Showing full vendor breakdown'},{label:'Export Scorecards',done:'Scorecards downloaded'}]},
    online_vs_instore: { title:'Online vs In-Store Mix', color:'#0EA5E9', summary:'Channel performance comparison — ecommerce pickup, delivery, and walk-in traffic.',
      kpis:[{l:'Online %',v:'38%',c:'#0EA5E9'},{l:'Walk-in %',v:'62%',c:'var(--color-accent-green)'},{l:'Online AOV',v:'$112',c:'var(--color-accent-gold)'},{l:'Walk-in AOV',v:'$89',c:'var(--color-accent-purple)'}],
      cols:['Channel','Revenue','Orders','AOV','Growth','Conversion'],
      rows:[['Online Pickup','$2.8M','24.1K','$116.20','+18%','72%'],['Online Delivery','$1.5M','14.2K','$105.60','+24%','68%'],['Walk-In (POS)','$6.9M','77.5K','$89.00','+4%','N/A'],['Curbside','$0.3M','2.8K','$107.10','+31%','74%']],
      actions:[{label:'View Channel Details',done:'Showing full channel breakdown'},{label:'Export Report',done:'Channel report downloaded'}]},
    loyalty_health: { title:'Loyalty Program Health', color:'var(--color-accent-green)', summary:'Loyalty enrollment, engagement, and redemption metrics across the portfolio.',
      kpis:[{l:'Total Members',v:'48.2K',c:'var(--color-accent-green)'},{l:'Active (30d)',v:'18.7K',c:'#0EA5E9'},{l:'Redemption Rate',v:'34%',c:'var(--color-accent-gold)'},{l:'Lift vs Non-Loyalty',v:'+28% AOV',c:'var(--color-accent-purple)'}],
      cols:['Metric','This Month','Last Month','Change','Goal'],
      rows:[['New Enrollments','2,841','2,612','+8.8%','Balanced'],['Points Issued','1.2M','1.1M','+9.1%','Balanced'],['Redemptions','8,412','7,890','+6.6%','Balanced'],['Lapsed Members (90d+)','4,218','3,840','+9.8%','Review'],['Rev from Loyalty','$4.8M','$4.4M','+9.1%','Balanced'],['Avg Visits (Loyal)','3.2/mo','3.1/mo','+3.2%','Balanced']],
      actions:[{label:'View Lapsed Members',done:'Showing lapsed member details'},{label:'View Enrollment Trends',done:'Showing enrollment breakdown'}]},
    batch_expiry: { title:'Product Batches Expiring Within 30 Days', color:'var(--color-accent-red)', summary:'3 batches across IL, NJ, and MA need METRC destruction events filed before expiration.',
      kpis:[{l:'Expiring',v:'3 batches',c:'var(--color-accent-red)'},{l:'Total Units',v:'284',c:'var(--color-accent-gold)'},{l:'Value at Risk',v:'$8.2K',c:'var(--color-accent-red)'},{l:'Action Needed',v:'METRC Events',c:'var(--color-accent-blue)'}],
      cols:['Batch ID','Store','Product','Units','Expiry Date','Days Left','Action'],
      rows:[['#2847','Logan Square (IL)','Kiva Terra Bites 20pk',96,'Apr 12','25 days','File METRC destruction event'],['#1923','Edison (NJ)','Wyld Pear CBN 10pk',120,'Apr 8','21 days','File METRC destruction event'],['#3401','Boston (MA)','Raw Garden Cart 0.5g',68,'Apr 18','31 days','Flag for discount or destruction']],
      actions:[{label:'File METRC Events',done:'METRC destruction events filed for 3 batches'},{label:'Export Batch Report',done:'Report downloaded'}]},
    metrc_recon: { title:'METRC Reconciliation — Ohio', color:'var(--color-accent-red)', summary:'Columbus store is 28 hours behind reconciliation deadline. 4 packages pending.',
      kpis:[{l:'Overdue By',v:'28 hrs',c:'var(--color-accent-red)'},{l:'Pending Pkgs',v:'4',c:'var(--color-accent-gold)'},{l:'OH Stores',v:'5/6 synced',c:'var(--color-accent-gold)'},{l:'Risk Level',v:'High',c:'var(--color-accent-red)'}],
      cols:['Package ID','Store','Product','Received','METRC Status','Action'],
      rows:[['PKG-9421','Columbus','Blue Dream 3.5g x40','Mar 16 2pm','Not Reconciled','Reconcile now'],['PKG-9418','Columbus','Jeeter Rolls x60','Mar 16 10am','Not Reconciled','Reconcile now'],['PKG-9415','Columbus','Wyld Gummies x100','Mar 15 4pm','Not Reconciled','Reconcile now'],['PKG-9412','Columbus','STIIIZY Pods x24','Mar 15 11am','Not Reconciled','Reconcile now'],['PKG-9408','Dayton','Kiva Bars x50','Mar 16 3pm','Synced','OK'],['PKG-9405','Canton','Raw Garden 1g x30','Mar 16 1pm','Synced','OK']],
      actions:[{label:'Start Reconciliation',done:'Reconciliation initiated for 4 packages'},{label:'Contact Columbus Manager',done:'Message sent to store manager'}]},
    cx_improvements: { title:'Customer Experience Opportunities', color:'var(--color-accent-green)', summary:'AI-identified improvements based on review sentiment, wait times, and basket analysis.',
      kpis:[{l:'Opportunities',v:'6',c:'var(--color-accent-green)'},{l:'Est. NPS Lift',v:'+8 pts',c:'#0EA5E9'},{l:'Est. Rev Impact',v:'+$62K/mo',c:'var(--color-accent-gold)'},{l:'Quick Wins',v:'3',c:'var(--color-accent-purple)'}],
      cols:['Opportunity','Source','Impact','Effort','Priority'],
      rows:[['Reduce checkout wait to < 5 min','Reviews: 64 wait-time mentions','High — +12% satisfaction','Add express lane at peak hrs','High'],['Budtender product training on edibles','Reviews: "didn\'t know dosing"','Med — fewer returns','2-hr training session','High'],['Add order-ahead for repeat purchases','Survey: 38% want faster pickup','High — +$18K/mo','Dev integration','Medium'],['Improve parking signage','Google reviews: 12 mentions','Low — reduce frustration','New signs — $200','Quick Win'],['Text receipt option','Survey: 52% prefer digital','Med — cost savings','POS config change','Quick Win'],['Loyalty point balance on receipt','Survey: 41% didn\'t know points','Med — +6% redemption','POS template update','Quick Win']],
      actions:[{label:'View Implementation Plan',done:'Showing rollout timeline'},{label:'Export Opportunities',done:'Opportunity list downloaded'}]},
    cross_transfer: { title:'Cross-Store Transfer Recommendations', color:'var(--color-accent-blue)', summary:'AI-identified rebalancing opportunities to recover lost revenue from OOS products.',
      kpis:[{l:'Transfers Rec.',v:'3',c:'var(--color-accent-blue)'},{l:'Total Units',v:'86',c:'#0EA5E9'},{l:'Est. Rev Recovery',v:'$2,256/wk',c:'var(--color-accent-green)'},{l:'Avg Transit',v:'~24 hrs',c:'var(--color-accent-gold)'}],
      cols:['Product','From','Surplus','To','Deficit','Transfer Qty','Est. Recovery'],
      rows:[['Blue Dream 3.5g','Naperville, IL','89 units (22d)','Logan Square, IL','0 units (OOS)','40 units','$1,140/wk'],['Wyld Elderberry Gummies','Springfield, IL','44 units (18d)','River North, IL','0 units (OOS)','22 units','$396/wk'],['Stiiizy Live Resin Pod','Boston, MA','62 units (28d)','Worcester, MA','3 units (1d)','24 units','$720/wk']],
      actions:[{label:'Initiate All Transfers',done:'3 transfer requests created — pending manager approval'},{label:'Export Transfer Plan',done:'Transfer plan downloaded'}]},
    metrc_queue: { title:'METRC Package Queue', color:'var(--color-accent-gold)', summary:'Packages awaiting METRC tagging, pending manifests, and sync issues.',
      kpis:[{l:'Untagged Pkgs',v:'14',c:'var(--color-accent-gold)'},{l:'Pending Manifests',v:'3',c:'#0EA5E9'},{l:'Sync Errors',v:'2',c:'var(--color-accent-red)'},{l:'Avg Tag Time',v:'12 min',c:'var(--color-accent-green)'}],
      cols:['Package','Store','Type','Status','METRC Status','Age'],
      rows:[['Blue Dream 3.5g x50','Logan Square','Flower','Received','Needs Tag','2 hrs'],['Jeeter Rolls x100','River North','Pre-Roll','Received','Needs Tag','4 hrs'],['STIIIZY Pods x30','Naperville','Vape','Received','Sync Error','6 hrs'],['Wyld Gummies x200','Schaumburg','Edible','In Transit','Pending Manifest','1 hr'],['Raw Garden 1g x25','Springfield','Concentrate','Received','Needs Tag','3 hrs'],['Kiva Bars x80','Peoria','Edible','Received','Sync Error','8 hrs']],
      actions:[{label:'View Package Details',done:'Showing full package list'},{label:'Export Manifest',done:'Manifest downloaded'}]},
  };
  return A[action] || { title:'Action', color:'var(--color-accent-gold)', summary:'Processing your request...', kpis:[], cols:[], rows:[] };
}

function NexusActionCard({ data, compact = false }) {
  const [actionStates, setActionStates] = useState({});
  const sc = (v) => {
    const s = String(v).toLowerCase();
    if (['synced','pass','balanced','delivered','all clear','all good','surplus'].some(k => s.includes(k))) return 'var(--color-accent-green)';
    if (['warning','delayed','review','medium','in transit','awaiting','standard'].some(k => s.includes(k))) return 'var(--color-accent-gold)';
    if (['critical','high','out of stock','urgent'].some(k => s.includes(k))) return 'var(--color-accent-red)';
    if (['low','scheduled'].some(k => s.includes(k))) return 'var(--color-accent-blue)';
    return null;
  };
  const handleAction = (idx) => {
    setActionStates(prev => ({ ...prev, [idx]: 'loading' }));
    setTimeout(() => setActionStates(prev => ({ ...prev, [idx]: 'done' })), 1200);
  };
  const maxRows = compact ? 4 : undefined;
  const displayRows = maxRows && data.rows?.length > maxRows ? data.rows.slice(0, maxRows) : data.rows;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--color-surface-card) 0%, var(--color-surface-bg) 100%)', border: `1px solid ${data.color}25` }}>
      {/* Header with gradient accent */}
      <div className={`${compact ? 'px-3 py-2.5' : 'px-5 py-3.5'} flex items-center gap-3`} style={{ background: `linear-gradient(135deg, ${data.color}12 0%, transparent 60%)` }}>
        <div className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl flex items-center justify-center shadow-lg`} style={{ background: `linear-gradient(135deg, ${data.color}30 0%, ${data.color}15 100%)`, border: `1px solid ${data.color}30` }}>
          <BarChart3 className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ color: data.color }} />
        </div>
        <div className="flex-1">
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-text-primary`}>{data.title}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: data.color }} />
      </div>
      {/* KPI cards */}
      {data.kpis && (
        <div className={`grid ${compact ? 'grid-cols-2 gap-2 px-3 py-2.5' : 'grid-cols-4 gap-2.5 px-5 py-3.5'}`}>
          {(compact ? data.kpis.slice(0, 4) : data.kpis).map((k, i) => (
            <div key={i} className={`${compact ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-lg text-center`} style={{ background: `${k.c}08`, border: `1px solid ${k.c}15` }}>
              <p className={`${compact ? 'text-[8px]' : 'text-[10px]'} text-text-secondary font-medium`}>{k.l}</p>
              <p className={`${compact ? 'text-sm' : 'text-base'} font-bold mt-0.5`} style={{ color: k.c }}>{k.v}</p>
            </div>
          ))}
        </div>
      )}
      {/* Data table */}
      {displayRows?.length > 0 && (
        <div className={`${compact ? 'px-2.5 pb-2.5' : 'px-4 pb-4'}`}>
          <div className="overflow-x-auto rounded-xl border border-surface-border/60">
            <table className={`w-full ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
              <thead><tr style={{ background: `${data.color}08` }}>
                {data.cols.map((c, i) => <th key={i} className={`${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} text-left text-[9px] font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap`}>{c}</th>)}
              </tr></thead>
              <tbody>
                {displayRows.map((row, ri) => (
                  <tr key={ri} className="border-t border-surface-border/30 hover:bg-white/[0.02] transition-colors">
                    {row.map((cell, ci) => {
                      const color = sc(cell);
                      return <td key={ci} className={`${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} whitespace-nowrap`}>{color
                        ? <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }}/><span style={{ color }} className="font-medium">{String(cell)}</span></span>
                        : <span className="text-text-primary">{String(cell)}</span>
                      }</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {maxRows && data.rows?.length > maxRows && (
            <div className="mt-2 text-center text-[10px] text-text-secondary">
              +{data.rows.length - maxRows} more rows
            </div>
          )}
        </div>
      )}
      {/* Action buttons */}
      {data.actions?.length > 0 && (
        <div className={`${compact ? 'px-3 pb-3 pt-1' : 'px-5 pb-4 pt-1'} flex flex-wrap gap-2`}>
          {data.actions.map((act, idx) => {
            const state = actionStates[idx];
            return (
              <button
                key={idx}
                onClick={() => !state && handleAction(idx)}
                disabled={!!state}
                className={`${compact ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'} rounded-xl font-semibold transition-all duration-300 flex items-center gap-2`}
                style={state === 'done'
                  ? { background: 'color-mix(in srgb, var(--color-accent-green) 9%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent-green) 25%, transparent)', color: 'var(--color-accent-green)', cursor: 'default' }
                  : state === 'loading'
                  ? { background: `${data.color}15`, border: `1px solid ${data.color}30`, color: data.color, cursor: 'wait' }
                  : { background: `${data.color}15`, border: `1px solid ${data.color}30`, color: data.color, cursor: 'pointer' }
                }
              >
                {state === 'done' ? (
                  <><Check className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />{act.done}</>
                ) : state === 'loading' ? (
                  <><RefreshCw className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />Running...</>
                ) : (
                  <><Zap className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />{act.label}</>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function CustomerBridge({ compact = false, nexusOverlay = false, mobileCompact = false }) {
  const navigate = useNavigate();
  const { selectedPersona, isCEO, isVP, isRegional, isStoreMgr, isCompliance } = usePersona();
  const { selectionLabel } = useStores();
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [thinkingStatus, setThinkingStatus] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const bottomRef = useRef(null);
  const chatAreaRef = useRef(null);

  const activateProduct = (key) => {
    setProducts(prev => ({
      ...prev,
      [key]: { ...prev[key], active: true },
    }));
  };

  const processMessage = async (text) => {

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text }]);
    setThinkingStatus('Understanding your question...');

    const intent = detectIntent(text, products);

    // Small base delay for UX feel
    await new Promise(r => setTimeout(r, 600));

    if (intent.lane === 'nexus_action') {
      // Direct data view — show operational data from NexusActionCard
      const actionData = getNexusActionData(intent.action);
      setThinkingStatus(`Loading ${actionData.title}...`);
      await new Promise(r => setTimeout(r, 400));
      setThinkingStatus(null);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: actionData.summary,
        component: 'nexus_action',
        data: actionData,
      }]);
    } else if (intent.lane === 'support') {
      setThinkingStatus('Searching knowledge base...');
      const results = searchKB(text);
      if (results.length > 0) {
        // Try Gemini first, fall back to local synthesis
        let responseText = null;
        if (isGeminiAvailable()) {
          setThinkingStatus('Composing a detailed answer...');
          responseText = await generateBridgeResponse(text, results);
        }
        if (!responseText) {
          responseText = synthesizeResponse(text, results);
        }
        setThinkingStatus(null);
        setMessages(prev => [...prev, {
          role: 'agent',
          text: responseText,
          component: 'kb',
          data: results,
        }]);
      } else {
        // No KB match — try Gemini for a general answer
        let responseText = null;
        if (isGeminiAvailable()) {
          setThinkingStatus('No exact match — checking broader knowledge...');
          responseText = await generateBridgeResponse(text, KNOWLEDGE_BASE.slice(0, 10));
        }
        setThinkingStatus(null);
        if (responseText) {
          setMessages(prev => [...prev, {
            role: 'agent',
            text: responseText,
          }]);
        } else {
          const ticketId = generateTicketId();
          // Portal interaction removed (Dex standalone)
          setMessages(prev => [...prev, {
            role: 'agent',
            text: `I couldn't find a specific article for that, but I want to make sure you get the help you need. Let me create a support ticket so our team can assist you directly.`,
            component: 'ticket',
            data: { ticketId, userMessage: text },
          }]);
        }
      }
    } else if (intent.lane === 'upsell') {
      const product = products[intent.product];
      if (product.active) {
        setThinkingStatus(`Looking up ${product.name} details...`);
        const results = searchKB(product.name);
        // Try Gemini for a richer "already active" response
        let responseText = null;
        if (isGeminiAvailable()) {
          setThinkingStatus(`Preparing tips for ${product.name}...`);
          responseText = await generateBridgeResponse(
            `The customer already has ${product.name} active. They asked: "${text}". Help them get the most out of it.`,
            results
          );
        }
        setThinkingStatus(null);
        setMessages(prev => [...prev, {
          role: 'agent',
          text: responseText || `Great news — **${product.name}** is already active on your account! Here's how to make the most of it:`,
          component: 'kb',
          data: results.length > 0 ? results : [],
        }]);
      } else {
        const upsellMessages = {
          payByBank: `I noticed you mentioned transaction fees. **Pay-by-Bank** can eliminate processing costs entirely — customers pay directly from their bank account with zero fees to you. Currently, standard card processing runs 2.9% + $0.30 per transaction, while Dutchie Pay is 1.5%. Pay-by-Bank brings that to **0%**. Here's the full package:`,
          whiteLabel: `Having your own branded presence in the App Store is a game-changer for customer loyalty. The **White Label App** gives you a fully customized iOS and Android app published under your dispensary name — your logo, your colors, your domain. Customers who use the app order 3x more frequently than web-only customers. Here's what's included:`,
          menuBoards: `**Digital Menu Boards** give you beautiful, dynamic in-store displays that update automatically when you change prices or run promotions. They support real-time inventory indicators so customers always see what's actually available. Here's the full package:`,
          b2cAI: `The **B2C AI Suite** uses machine learning to analyze each customer's purchase history and browsing behavior, then surfaces personalized product recommendations in real-time. Dispensaries using it see an average 18% increase in basket size. Here's what it includes:`,
        };
        setThinkingStatus(null);
        setMessages(prev => [...prev, {
          role: 'agent',
          text: upsellMessages[intent.product],
          component: 'upsell',
          data: { productKey: intent.product, product },
        }]);
      }
    } else if (intent.lane === 'feedback') {
      setThinkingStatus('Preparing issue report form...');
      const results = searchKB(text);
      setThinkingStatus(null);
      // Show the detail gatherer first — let the user add context before we create a ticket
      setMessages(prev => [...prev, {
        role: 'agent',
        text: `I'm sorry you're running into this. Before I create a support ticket, can you add any extra details? This helps our engineers resolve the issue faster.`,
        component: 'bug_gather',
        data: { userMessage: text, kbResults: results },
      }]);
    } else if (intent.lane === 'factory') {
      // Search KB first — the feature might already exist or be partially covered
      setThinkingStatus('Checking existing capabilities...');
      const results = searchKB(text);
      let responseText = null;
      if (isGeminiAvailable() && results.length > 0) {
        setThinkingStatus('Checking if this already exists...');
        responseText = await generateBridgeResponse(
          `Customer is asking for a feature: "${text}". Before submitting a feature request, check if any existing capabilities cover what they need. Be helpful and brief. Don't mention submitting a ticket — we'll show that option separately.`,
          results.slice(0, 3)
        );
      }
      setThinkingStatus(null);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: responseText || (results.length > 0
          ? `Great idea! Before we submit a feature request, let me check — some of what you're describing might already be available:`
          : `Thanks for sharing that idea! You can submit a product feature request below so our team can review and prioritize it.`),
        component: 'feature_help',
        data: { userMessage: text, kbResults: results.slice(0, 3) },
      }]);
    } else if (intent.lane === 'pricing') {
      // Cross-agent: generate pricing analysis
      setThinkingStatus('Analyzing your pricing data...');
      let analysis = null;
      if (isGeminiAvailable()) {
        setThinkingStatus('Comparing prices to market in your region...');
        analysis = await generatePricingAnalysis(text);
      }
      setThinkingStatus(null);
      if (analysis && analysis.title) {
        const wf = analysis.workflowType || 'market_comparison';
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `I've completed a **${analysis.title}** analysis. Here's a detailed breakdown:`,
          component: `pricing_${wf}`,
          data: analysis,
        }]);
      } else {
        // Fallback to keyword-matched preset
        const lower = text.toLowerCase();
        let viewType = 'market_comparison';
        if (/cost|gross|net|overview/.test(lower)) viewType = 'price_cost_overview';
        else if (/discount|promo|coupon|roi|waste|review/.test(lower)) viewType = 'discount_review';
        else if (/scenario|what.if|model|simul/.test(lower)) viewType = 'price_scenarios';
        else if (/change.*price|raise.*price|lower.*price|adjust.*price|optimiz.*price/.test(lower)) viewType = 'change_prices';
        else if (/create.*discount|new.*discount|add.*discount|launch.*discount/.test(lower)) viewType = 'create_discount';
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `Here's a pricing analysis based on your current data:`,
          component: `pricing_${viewType}`,
          data: null,
        }]);
      }
    } else if (intent.lane === 'marketing') {
      // Cross-agent: generate marketing campaign plan
      setThinkingStatus('Building your campaign plan...');
      let campaignData = null;
      if (isGeminiAvailable()) {
        setThinkingStatus('Analyzing customer segments and crafting campaign...');
        campaignData = await generateMarketingCampaignPlan(text);
      }
      // Fallback to preset if Gemini failed — match user intent to the right preset
      if (!campaignData || !campaignData.title) {
        const lower = text.toLowerCase();
        let presetKey = null;
        if (lower.includes('win back') || lower.includes('lapsed') || lower.includes('re-engage') || lower.includes('inactive') || lower.includes('churn') || lower.includes('dormant')) presetKey = 'winback';
        else if (lower.includes('birthday') || lower.includes('loyalty') || lower.includes('reward') || lower.includes('4/20') || lower.includes('holiday') || lower.includes('seasonal')) presetKey = 'birthday';
        else if (lower.includes('jeeter')) presetKey = 'jeeter';

        if (presetKey) {
          campaignData = CAMPAIGNS[presetKey];
        } else {
          // Build a generic campaign from the user's query instead of defaulting to Jeeter
          const brandMatch = lower.match(/\b(wyld|stiiizy|kiva|cookies|raw garden|alien labs|plus|papa.?barkley|jeeter)\b/);
          const categoryMatch = lower.match(/\b(flower|edibles?|vapes?|pre.?rolls?|concentrates?|tinctures?|topicals?|beverages?|gummies?|cartridges?)\b/);
          const brand = brandMatch ? brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1) : null;
          const category = categoryMatch ? categoryMatch[1].charAt(0).toUpperCase() + categoryMatch[1].slice(1).replace(/s$/, '') : null;
          const subject = brand && category ? `${brand} ${category}` : brand || category || 'Product';

          // Brand-specific product catalogs for featured product cards
          const BRAND_PRODUCTS = {
            wyld: [
              { name: 'Wyld Elderberry Gummies', type: 'Indica · 10pk', strain: 'Elderberry', thc: '100mg', price: '$18.00', category: 'Edible', badgeColor: '#E91E63', badgeText: 'BEST SELLER', image: brandImg('/brands/wyld-elderberry.png') },
              { name: 'Wyld Raspberry Gummies', type: 'Sativa · 10pk', strain: 'Raspberry', thc: '100mg', price: '$18.00', category: 'Edible', badgeColor: '#E91E63', badgeText: 'POPULAR', image: brandImg('/brands/wyld-raspberry.png') },
              { name: 'Wyld Pear Gummies', type: 'CBN · 10pk', strain: 'Pear', thc: '50mg THC + 50mg CBN', price: '$20.00', category: 'Edible', badgeColor: '#16A34A', badgeText: 'SLEEP' },
              { name: 'Wyld Marionberry Gummies', type: 'Indica · 10pk', strain: 'Marionberry', thc: '100mg', price: '$18.00', category: 'Edible', badgeColor: '#7C3AED', badgeText: 'NEW' },
            ],
            stiiizy: [
              { name: 'STIIIZY OG Kush Pod', type: 'Original · 1g', strain: 'OG Kush', thc: '89%', price: '$45.00', category: 'Vape Pod', badgeColor: '#1a1a1a', badgeText: 'BEST SELLER', image: brandImg('/brands/stiiizy-pods.png') },
              { name: 'STIIIZY Blue Dream Pod', type: 'Original · 1g', strain: 'Blue Dream', thc: '86%', price: '$45.00', category: 'Vape Pod', badgeColor: '#2563EB', badgeText: 'POPULAR' },
              { name: 'STIIIZY Strawnana Pod', type: 'Live Resin · 1g', strain: 'Strawnana', thc: '82%', price: '$55.00', category: 'Live Resin Pod', badgeColor: '#16A34A', badgeText: 'PREMIUM' },
              { name: 'STIIIZY Starter Kit', type: 'Device + Pod', strain: 'Biscotti', thc: '87%', price: '$60.00', category: 'Starter Kit', badgeColor: 'var(--color-accent-gold)', badgeText: 'BUNDLE' },
            ],
            kiva: [
              { name: 'Kiva Camino Pineapple Habanero', type: 'Uplifting · 20pk', strain: 'Sativa Blend', thc: '100mg', price: '$22.00', category: 'Edible', badgeColor: '#EA580C', badgeText: 'BEST SELLER', image: brandImg('/brands/kiva-camino.jpg') },
              { name: 'Kiva Camino Midnight Blueberry', type: 'Sleep · 20pk', strain: 'CBN Blend', thc: '80mg THC + 40mg CBN', price: '$24.00', category: 'Edible', badgeColor: '#6366F1', badgeText: 'SLEEP' },
              { name: 'Kiva Lost Farm Gummies', type: 'Live Resin · 10pk', strain: 'Strawberry Lemonade', thc: '100mg', price: '$25.00', category: 'Edible', badgeColor: '#DC2626', badgeText: 'PREMIUM' },
              { name: 'Kiva Terra Bites', type: 'Espresso Beans · 20pk', strain: 'Espresso', thc: '100mg', price: '$22.00', category: 'Edible', badgeColor: '#8B4513', badgeText: 'CLASSIC' },
            ],
            cookies: [
              { name: 'Cookies Gary Payton', type: 'Flower · 3.5g', strain: 'Gary Payton', thc: '28%', price: '$55.00', category: 'Flower', badgeColor: '#2196F3', badgeText: 'TOP SHELF', image: brandImg('/brands/cookies-gary-payton.png') },
              { name: 'Cookies Cereal Milk', type: 'Flower · 3.5g', strain: 'Cereal Milk', thc: '26%', price: '$55.00', category: 'Flower', badgeColor: '#2196F3', badgeText: 'POPULAR' },
              { name: 'Cookies Pancakes', type: 'Flower · 3.5g', strain: 'Pancakes', thc: '30%', price: '$58.00', category: 'Flower', badgeColor: 'var(--color-accent-gold)', badgeText: 'NEW' },
              { name: 'Cookies Collins Ave', type: 'Pre-Roll · 1g', strain: 'Collins Ave', thc: '25%', price: '$18.00', category: 'Pre-Roll', badgeColor: '#16A34A', badgeText: 'STAFF PICK' },
            ],
            'raw garden': [
              { name: 'Raw Garden Slippery Susan', type: 'Live Resin Cart · 1g', strain: 'Slippery Susan', thc: '84%', price: '$40.00', category: 'Vape Cartridge', badgeColor: '#4CAF50', badgeText: 'BEST SELLER', image: brandImg('/brands/raw-garden-cart.webp') },
              { name: 'Raw Garden Dojo Kush', type: 'Live Resin Cart · 1g', strain: 'Dojo Kush', thc: '82%', price: '$40.00', category: 'Vape Cartridge', badgeColor: '#4CAF50', badgeText: 'POPULAR' },
              { name: 'Raw Garden Lemon Haze', type: 'Refined Live Resin · 1g', strain: 'Lemon Haze', thc: '86%', price: '$45.00', category: 'Concentrate', badgeColor: 'var(--color-accent-gold)', badgeText: 'PREMIUM' },
              { name: 'Raw Garden Beach Party', type: 'Ready-to-Use · 0.5g', strain: 'Beach Party', thc: '80%', price: '$30.00', category: 'Disposable Vape', badgeColor: '#0EA5E9', badgeText: 'NEW' },
            ],
            'alien labs': [
              { name: 'Alien Labs Xeno', type: 'Flower · 3.5g', strain: 'Xeno', thc: '31%', price: '$55.00', category: 'Flower', badgeColor: '#00BCD4', badgeText: 'NEW', image: brandImg('/brands/alien-xeno.png') },
              { name: 'Alien Labs Atomic Apple', type: 'Flower · 3.5g', strain: 'Atomic Apple', thc: '29%', price: '$50.00', category: 'Flower', badgeColor: '#00BCD4', badgeText: 'TOP SHELF' },
              { name: 'Alien Labs Bagio Punch', type: 'Live Resin Cart · 1g', strain: 'Bagio Punch', thc: '85%', price: '$52.00', category: 'Vape Cartridge', badgeColor: '#9333EA', badgeText: 'PREMIUM' },
              { name: 'Alien Labs Kryptochronic', type: 'Pre-Roll · 1.5g', strain: 'Kryptochronic', thc: '27%', price: '$22.00', category: 'Pre-Roll', badgeColor: '#16A34A', badgeText: 'STAFF PICK' },
            ],
            plus: [
              { name: 'PLUS Sour Watermelon', type: 'Gummies · 20pk', strain: 'Sativa Blend', thc: '100mg', price: '$20.00', category: 'Edible', badgeColor: '#FF6B35', badgeText: 'BEST SELLER', image: brandImg('/brands/plus-gummies.jpg') },
              { name: 'PLUS Blackberry Lemon', type: 'Gummies · 20pk', strain: 'Indica Blend', thc: '100mg', price: '$20.00', category: 'Edible', badgeColor: '#7C3AED', badgeText: 'POPULAR' },
              { name: 'PLUS Uplift Citrus', type: 'Dual Chamber · 10pk', strain: 'THC + CBD', thc: '50mg THC + 50mg CBD', price: '$24.00', category: 'Edible', badgeColor: 'var(--color-accent-gold)', badgeText: 'NEW FORMAT' },
              { name: 'PLUS Sleep Cloudberry', type: 'Gummies · 20pk', strain: 'CBN Blend', thc: '80mg THC + 40mg CBN', price: '$22.00', category: 'Edible', badgeColor: '#6366F1', badgeText: 'SLEEP' },
            ],
          };

          // Category fallback products when brand isn't recognized (no images — shows gradient placeholder)
          const CATEGORY_PRODUCTS = {
            flower: [
              { name: 'Top Shelf Indica', type: 'Flower · 3.5g', thc: '28%', price: '$48.00', category: 'Flower', badgeColor: '#4CAF50', badgeText: 'POPULAR' },
              { name: 'Premium Sativa', type: 'Flower · 3.5g', thc: '26%', price: '$45.00', category: 'Flower', badgeColor: 'var(--color-accent-gold)', badgeText: 'STAFF PICK' },
              { name: 'House Hybrid', type: 'Flower · 3.5g', thc: '24%', price: '$38.00', category: 'Flower', badgeColor: '#0EA5E9', badgeText: 'VALUE' },
            ],
            edible: [
              { name: 'Fruit Gummies 10pk', type: 'Hybrid · 100mg', thc: '100mg', price: '$20.00', category: 'Edible', badgeColor: '#E91E63', badgeText: 'POPULAR' },
              { name: 'Chocolate Bar', type: 'Indica · 100mg', thc: '100mg', price: '$24.00', category: 'Edible', badgeColor: '#8B4513', badgeText: 'CLASSIC' },
              { name: 'Sleep Gummies', type: 'CBN · 10pk', thc: '50mg THC + 50mg CBN', price: '$22.00', category: 'Edible', badgeColor: '#6366F1', badgeText: 'SLEEP' },
            ],
            vape: [
              { name: 'Live Resin Cart 1g', type: 'Hybrid', thc: '84%', price: '$42.00', category: 'Vape Cartridge', badgeColor: '#4CAF50', badgeText: 'BEST SELLER' },
              { name: 'Disposable 0.5g', type: 'Sativa', thc: '80%', price: '$28.00', category: 'Disposable', badgeColor: '#0EA5E9', badgeText: 'PORTABLE' },
              { name: 'Premium Pod 1g', type: 'Indica', thc: '88%', price: '$50.00', category: 'Vape Pod', badgeColor: '#9333EA', badgeText: 'PREMIUM' },
            ],
            'pre-roll': [
              { name: 'Infused Pre-Roll', type: '1g · Hybrid', thc: '35%', price: '$15.00', category: 'Pre-Roll', badgeColor: '#EA580C', badgeText: 'POPULAR' },
              { name: 'Classic Joint 3-Pack', type: '3x 0.5g · Sativa', thc: '22%', price: '$18.00', category: 'Pre-Roll', badgeColor: '#16A34A', badgeText: 'VALUE' },
              { name: 'Diamond Infused', type: '1g · Indica', thc: '42%', price: '$22.00', category: 'Pre-Roll', badgeColor: 'var(--color-accent-gold)', badgeText: 'PREMIUM' },
            ],
            concentrate: [
              { name: 'Live Resin Badder', type: '1g · Hybrid', thc: '78%', price: '$38.00', category: 'Concentrate', badgeColor: 'var(--color-accent-gold)', badgeText: 'POPULAR' },
              { name: 'Rosin Press', type: '1g · Indica', thc: '72%', price: '$55.00', category: 'Concentrate', badgeColor: '#9333EA', badgeText: 'PREMIUM' },
              { name: 'Shatter', type: '1g · Sativa', thc: '82%', price: '$32.00', category: 'Concentrate', badgeColor: '#0EA5E9', badgeText: 'VALUE' },
            ],
          };

          // Pick featured products based on brand or category
          const brandKey = brand ? brand.toLowerCase() : null;
          const catKey = category ? category.toLowerCase().replace(/s$/, '') : null;
          const featuredProducts = (brandKey && BRAND_PRODUCTS[brandKey])
            ? BRAND_PRODUCTS[brandKey]
            : (catKey && CATEGORY_PRODUCTS[catKey])
              ? CATEGORY_PRODUCTS[catKey]
              : CATEGORY_PRODUCTS.edible; // sensible generic default
          campaignData = {
            title: `Brand Spotlight: ${subject}`,
            subtitle: `Targeted campaign to boost ${subject.toLowerCase()} sales`,
            icon: 'Star',
            accentFrom: '#0EA5E9',
            accentTo: '#6366F1',
            heroGradient: 'from-cyan-900/60 via-blue-900/40 to-indigo-900/60',
            heroBorder: 'border-cyan-500/30',
            heroTag: 'Product Campaign',
            heroImage: null,
            audience: {
              size: '8,240',
              description: `Customers who have purchased ${subject.toLowerCase()} products in the past 90 days, browsed similar products 3+ times, or have "${(category || 'this category').toLowerCase()}" in their top categories by spend.`,
              segments: [
                { name: `${subject} Buyers`, count: '3,100', desc: `Purchased ${subject.toLowerCase()} before` },
                { name: `${(category || 'Category').replace(/s$/, '')} Enthusiasts`, count: '3,540', desc: `Top category: ${(category || 'related').toLowerCase()}` },
                { name: 'High-Intent Browsers', count: '1,600', desc: `Browsed ${subject.toLowerCase()} 3+ times` },
              ],
            },
            channels: [
              { name: 'SMS', icon: 'Smartphone', reach: '6,100', rate: '94%', metric: 'open rate', cost: '$0.015/msg' },
              { name: 'Email', icon: 'Mail', reach: '7,500', rate: '36%', metric: 'open rate', cost: '$0.003/msg' },
              { name: 'Push', icon: 'Bell', reach: '4,200', rate: '11%', metric: 'tap rate', cost: 'Free' },
            ],
            schedule: {
              launch: 'Friday, March 13 · 10:00 AM PT',
              duration: '7 days',
              optimalSend: 'ML-optimized per customer timezone',
              followUp: 'Non-openers get SMS reminder on Day 3. Non-converters get "last chance" on Day 6.',
            },
            content: {
              headline: `${subject} — Now Featuring New Arrivals`,
              preheader: `Check out the latest ${subject.toLowerCase()} at Ascend`,
              body: `We just refreshed our ${subject.toLowerCase()} selection at Ascend and we thought you'd want to know. As one of our ${(category || 'product').toLowerCase()} customers, you get early access and 10% off your next ${subject.toLowerCase()} purchase this week.`,
              cta: `Shop ${subject} →`,
              offer: `10% off ${subject.toLowerCase()} — code ${(brand || 'SAVE').toUpperCase()}10 — valid 7 days`,
              finePrint: 'Limit one use per customer. Cannot be combined with other offers. Must be 21+.',
              smsPreview: `Ascend: New ${subject.toLowerCase()} just arrived! 10% off this week with code ${(brand || 'SAVE').toUpperCase()}10.`,
            },
            smsMessages: [
              `Ascend: New ${subject.toLowerCase()} just landed! Get 10% off this week with code ${(brand || 'SAVE').toUpperCase()}10. Shop now → ascendwellness.com/shop`,
              'Reply STOP to opt out',
            ],
            featuredProducts,
            abTests: [
              { variant: 'A', subject: `${subject} — Now Featuring New Arrivals`, split: 50 },
              { variant: 'B', subject: `New ${subject} Just Dropped — 10% Off This Week`, split: 50 },
            ],
            compliance: [
              { label: 'Age gate verified (21+)', status: 'pass' },
              { label: 'Opt-in consent validated', status: 'pass' },
              { label: 'NY cannabis advertising rules', status: 'pass' },
              { label: 'Disclaimer & fine print included', status: 'pass' },
              { label: 'Unsubscribe mechanism present', status: 'pass' },
            ],
            projections: {
              revenue: '$12,200 — $16,800',
              orders: '220 — 340',
              roi: '5.1x',
              reactivated: '~80 lapsed customers',
              aov: '$48.60',
              redemptionRate: '12.4%',
            },
            locationTargeting: [
              { name: 'Ascend — Logan Square', id: 'logan-square', count: '2,800' },
              { name: 'Ascend — Fort Lee', id: 'fort-lee', count: '2,540' },
              { name: 'Ascend — Boston', id: 'boston', count: '1,680' },
              { name: 'Ascend — Detroit', id: 'detroit', count: '1,220' },
            ],
            budget: { totalCost: '$142.20', costPerConversion: '$0.52' },
          };
        }
      }
      setThinkingStatus(null);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: `I've analyzed your customer data and built a comprehensive **${campaignData.title}** campaign. Here's the full plan:`,
        component: 'campaign',
        data: campaignData,
      }]);
    } else if (intent.lane === 'connect') {
      // Cross-agent: generate connect/inventory analysis
      setThinkingStatus('Reviewing inventory levels...');
      let analysis = null;
      if (isGeminiAvailable()) {
        setThinkingStatus('Analyzing stock data and vendor options...');
        analysis = await generateConnectAnalysis(text);
      }
      setThinkingStatus(null);
      if (analysis && analysis.title) {
        const wf = analysis.workflowType || 'recommendations';
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `I've completed a **${analysis.title}** analysis based on your inventory data. Here's a detailed breakdown:`,
          component: wf,
          data: analysis,
        }]);
      } else {
        // Fallback to preset view when Gemini fails
        const lower = text.toLowerCase();
        let viewType = 'recommendations';
        if (lower.includes('reorder') || lower.includes('out of stock') || lower.includes('restock') || lower.includes('low stock') || lower.includes('replenish')) viewType = 'reorder';
        else if (lower.includes('new product') || lower.includes('explore') || lower.includes('discover') || lower.includes('trending') || lower.includes('catalog')) viewType = 'explore';
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `I've analyzed your inventory data. Here's a detailed breakdown with actionable recommendations:`,
          component: viewType,
          data: null,
        }]);
      }
    } else if (intent.lane === 'reporting') {
      setThinkingStatus('Pulling performance data...');
      const reportData = generateReportData(text);

      // Try Gemini for a contextual summary
      let summaryText = null;
      if (isGeminiAvailable()) {
        setThinkingStatus('Generating insights from your metrics...');
        summaryText = await generateBridgeResponse(
          `The dispensary operator asked: "${text}". Generate a 1-2 sentence executive summary of their performance data. Revenue: ${formatCurrency(reportData.revenue)}, ${reportData.growthPct >= 0 ? 'up' : 'down'} ${Math.abs(reportData.growthPct)}% vs prior period. Orders: ${reportData.orders}. AOV: $${reportData.aov.toFixed(2)}. Top seller: ${reportData.topProducts[0].name}. Time frame: ${reportData.timeframeLabel}. Focus: ${reportData.focus}. Be concise and insight-driven. Never use markdown headers.`,
          []
        );
      }

      setThinkingStatus(null);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: summaryText || `Here's your ${reportData.timeframeLabel.toLowerCase()} performance snapshot across all Ascend locations. Revenue is ${reportData.growthPct >= 0 ? 'up' : 'down'} ${Math.abs(reportData.growthPct)}% compared to the prior period, with ${reportData.topProducts[0].name} leading as your top seller.`,
        component: 'report',
        data: reportData,
      }]);
    } else if (intent.lane === 'reviews') {
      setThinkingStatus('Searching customer reviews...');
      const feedData = buildReviewFeed(text);

      let summaryText = null;
      if (isGeminiAvailable() && feedData.reviews.length > 0) {
        setThinkingStatus(`Found ${feedData.totalMatching} reviews — summarizing...`);
        const sampleTexts = feedData.reviews.slice(0, 3).map(r => `"${r.text.slice(0, 80)}..." (${r.sentiment}, ${r.sentimentScore.toFixed(2)})`).join('; ');
        summaryText = await generateBridgeResponse(
          `The dispensary operator asked: "${text}". I found ${feedData.totalMatching} matching reviews (filter: ${feedData.filterDesc}). Average score: ${feedData.avgScore.toFixed(2)}. Sample reviews: ${sampleTexts}. Give a 1-2 sentence summary of what these reviews show — be concise, conversational, and insight-driven. Never use markdown headers.`,
          []
        );
      }

      setThinkingStatus(null);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: summaryText || (feedData.reviews.length > 0
          ? `Found ${feedData.totalMatching} reviews matching "${feedData.filterDesc}". Average sentiment score is ${feedData.avgScore.toFixed(2)}. Here's what your customers are saying:`
          : `I couldn't find any reviews matching those filters. Try broadening your search — for example, "show me recent reviews" or "negative reviews about wait times".`),
        component: feedData.reviews.length > 0 ? 'review_feed' : null,
        data: feedData.reviews.length > 0 ? feedData : null,
      }]);
    } else if (intent.lane === 'sentiment') {
      setThinkingStatus('Aggregating sentiment data...');
      const sentData = buildSentimentData(text);

      // Try Gemini for a contextual insight
      let summaryText = null;
      if (isGeminiAvailable()) {
        setThinkingStatus('Analyzing customer sentiment patterns...');
        const topConcern = sentData.categoryRanked[0];
        summaryText = await generateBridgeResponse(
          `The dispensary operator asked: "${text}". Provide a 2-3 sentence insight summary based on their customer sentiment data. Overall sentiment score: ${sentData.avg.toFixed(2)} (${sentData.normalizedScore}/100). NPS: ${sentData.nps}. Distribution: ${sentData.dist.positive} positive, ${sentData.dist.neutral} neutral, ${sentData.dist.negative} negative out of ${sentData.total} reviews. Biggest concern area: ${topConcern.category} (avg score ${topConcern.avg.toFixed(2)}). Focus: ${sentData.focus}. Filter: ${sentData.filterLabel}. Be concise, insight-driven, and actionable. Never use markdown headers.`,
          []
        );
      }

      setThinkingStatus(null);
      const posRate = Math.round((sentData.dist.positive / sentData.total) * 100);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: summaryText || `Here's your sentiment snapshot across ${sentData.total} customer reviews. Overall score is ${sentData.normalizedScore}/100 with ${posRate}% positive sentiment and an NPS of ${sentData.nps}. ${sentData.categoryRanked[0].category} is your lowest-rated area — worth keeping an eye on.`,
        component: 'sentiment',
        data: sentData,
      }]);
    }
  };

  // ── Nexus Action Handler — bypasses KB intent detection for operational tiles ──
  const handleSuggestionClick = (key) => {
    const all = [...NEXUS_SUGGESTIONS, ...COMPACT_SUGGESTIONS, ...SUGGESTIONS];
    const suggestion = all.find(s => s.key === key);
    if (!suggestion) return;
    // All suggestions go through normal intent detection for consistent UX
    processMessage(suggestion.label);
  };

  const handleBugSubmit = async (userMessage, kbResults, extraDetails) => {
    const ticketId = generateTicketId();
    // Build enriched description
    let enrichedMessage = userMessage;
    if (extraDetails) {
      const parts = [];
      if (extraDetails.pageUrl) parts.push(`Page URL: ${extraDetails.pageUrl}`);
      if (extraDetails.affectedUser) parts.push(`Affected user: ${extraDetails.affectedUser}`);
      if (extraDetails.occurredAt) parts.push(`When it happened: ${extraDetails.occurredAt}`);
      if (extraDetails.orderOrRegister) parts.push(`Order/Register #: ${extraDetails.orderOrRegister}`);
      if (extraDetails.steps) parts.push(`Steps to reproduce: ${extraDetails.steps}`);
      if (extraDetails.browser) parts.push(`Browser/Device: ${extraDetails.browser}`);
      if (extraDetails.screenshot) parts.push(`Screenshot attached: ${extraDetails.screenshot}`);
      if (parts.length > 0) enrichedMessage += '\n\n' + parts.join('\n');
    }

    // Portal interaction removed (Dex standalone)

    // Remove the gatherer message and replace with submitted ticket
    setThinkingStatus('Creating support ticket...');
    setMessages(prev => prev.filter(m => m.component !== 'bug_gather'));
    await new Promise(r => setTimeout(r, 400));

    // Try Gemini for a richer troubleshooting intro
    let responseText = null;
    if (isGeminiAvailable() && kbResults.length > 0) {
      setThinkingStatus('Finding troubleshooting steps...');
      responseText = await generateBridgeResponse(
        `Customer reported a bug/issue: "${userMessage}". A support ticket ${ticketId} has been created. Provide a brief empathetic acknowledgment and mention any relevant troubleshooting steps.`,
        kbResults.slice(0, 2)
      );
    }

    setThinkingStatus(null);
    const hasExtra = extraDetails && (extraDetails.steps || extraDetails.browser || extraDetails.screenshot);
    if (kbResults.length > 0) {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: responseText || `I've logged this issue and created a support ticket.${hasExtra ? ' Thanks for the extra details — that\'ll help our team resolve this faster.' : ''} While our engineering team investigates, here are some troubleshooting steps that might help in the meantime:`,
        component: 'bug_with_kb',
        data: { ticketId, userMessage: enrichedMessage, articles: kbResults.slice(0, 2) },
      }]);
    } else {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: `I've logged this issue and created a support ticket.${hasExtra ? ' Thanks for the extra details — that\'ll help our team resolve this faster.' : ''} Our engineering team will investigate:`,
        component: 'bug',
        data: { ticketId, userMessage: enrichedMessage },
      }]);
    }
  };

  const handleFeatureFormOpen = (userMessage) => {
    // Replace the feature_help message with the detail gatherer form
    setMessages(prev => prev.map(m =>
      m.component === 'feature_help' && m.data?.userMessage === userMessage
        ? { ...m, component: 'feature_gather', data: { userMessage } }
        : m
    ));
  };

  const handleFeatureSubmit = (userMessage, extraDetails) => {
    const ticketId = generateTicketId();
    let enrichedMessage = userMessage;
    if (extraDetails) {
      const parts = [];
      if (extraDetails.useCase) parts.push(`Use case: ${extraDetails.useCase}`);
      if (extraDetails.priority) parts.push(`Priority: ${extraDetails.priority}`);
      if (extraDetails.screenshot) parts.push(`Attachment: ${extraDetails.screenshot}`);
      if (parts.length > 0) enrichedMessage += '\n\n' + parts.join('\n');
    }

    // Portal interaction removed (Dex standalone)

    // Remove the gatherer and show the submitted ticket
    const hasExtra = extraDetails && (extraDetails.useCase || extraDetails.priority || extraDetails.screenshot);
    setMessages(prev => [
      ...prev.filter(m => m.component !== 'feature_gather'),
      {
        role: 'agent',
        text: `Your feature request has been submitted to the Software Factory for triage.${hasExtra ? ' Thanks for the extra context — that helps our product team prioritize effectively.' : ''}`,
        component: 'feature',
        data: { ticketId, userMessage: enrichedMessage },
      },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || thinkingStatus) return;
    const text = inputValue.trim();
    setInputValue('');
    processMessage(text);
  };

  useEffect(() => {
    if (compact && chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinkingStatus, compact]);

  const activeCount = Object.values(products).filter(p => p.active).length;
  const totalCount = Object.keys(products).length;

  const COMPACT_SUGGESTIONS = [
    { key: 'ecomm_customize', label: 'Help me customize my ecomm look and feel', icon: Eye, gradient: 'from-amber-600/20 to-orange-600/20', border: 'hover:border-amber-500/40', tag: 'Support', tagColor: 'var(--color-accent-gold)' },
    { key: 'menu_boards', label: 'Add Menu Boards to my Account', icon: Monitor, gradient: 'from-pink-600/20 to-rose-600/20', border: 'hover:border-pink-500/40', tag: 'Upgrade', tagColor: '#EC4899' },
    { key: 'winback', label: 'Set up a marketing win back campaign', icon: Megaphone, gradient: 'from-green-600/20 to-emerald-600/20', border: 'hover:border-green-500/40', tag: 'Marketing', tagColor: 'var(--color-accent-green)' },
  ];
  const NEXUS_SUGGESTIONS_BY_PERSONA = {
    ceo: [
      { key: 'flash', label: 'How are all stores doing today vs last week?', icon: Activity, gradient: 'from-amber-600/20 to-yellow-600/20', border: 'hover:border-amber-500/40', tag: 'Sales', tagColor: 'var(--color-accent-gold)' },
      { key: 'reorder', label: 'Reorder out of stock and low stock items', icon: Package, gradient: 'from-red-600/20 to-rose-600/20', border: 'hover:border-red-500/40', tag: 'Reorder', tagColor: 'var(--color-accent-red)' },
      { key: 'brands', label: 'What are our top selling brands right now?', icon: Star, gradient: 'from-blue-600/20 to-cyan-600/20', border: 'hover:border-blue-500/40', tag: 'Brands', tagColor: 'var(--color-accent-blue)' },
      { key: 'winback', label: 'Run a win-back campaign for lapsed customers', icon: Megaphone, gradient: 'from-green-600/20 to-emerald-600/20', border: 'hover:border-green-500/40', tag: 'Campaign', tagColor: 'var(--color-accent-green)' },
    ],
    vp_retail: [
      { key: 'rebalance', label: 'Reorder out of stock and low inventory items', icon: Package, gradient: 'from-red-600/20 to-rose-600/20', border: 'hover:border-red-500/40', tag: 'Reorder', tagColor: 'var(--color-accent-red)' },
      { key: 'pricing', label: 'Compare our prices vs market average', icon: DollarSign, gradient: 'from-amber-600/20 to-yellow-600/20', border: 'hover:border-amber-500/40', tag: 'Pricing', tagColor: 'var(--color-accent-gold)' },
      { key: 'winback', label: 'Launch a marketing campaign to win back lapsed customers', icon: Megaphone, gradient: 'from-green-600/20 to-emerald-600/20', border: 'hover:border-green-500/40', tag: 'Campaign', tagColor: 'var(--color-accent-green)' },
      { key: 'performance', label: 'How are all stores doing on sales this week?', icon: BarChart3, gradient: 'from-blue-600/20 to-cyan-600/20', border: 'hover:border-blue-500/40', tag: 'Sales', tagColor: 'var(--color-accent-blue)' },
    ],
    regional_mgr: [
      { key: 'transfers', label: 'Any transfers waiting on my approval?', icon: ArrowRightLeft, gradient: 'from-amber-600/20 to-yellow-600/20', border: 'hover:border-amber-500/40', tag: 'Transfers', tagColor: 'var(--color-accent-gold)', action: 'transfers' },
      { key: 'close', label: 'Any cash variances from last night?', icon: FileText, gradient: 'from-green-600/20 to-emerald-600/20', border: 'hover:border-green-500/40', tag: 'Close', tagColor: 'var(--color-accent-green)', action: 'close' },
      { key: 'delivery', label: 'What deliveries are coming in today?', icon: Truck, gradient: 'from-blue-600/20 to-cyan-600/20', border: 'hover:border-blue-500/40', tag: 'Receiving', tagColor: 'var(--color-accent-blue)', action: 'delivery' },
      { key: 'labor', label: 'Are any stores short-staffed or running OT?', icon: Users, gradient: 'from-purple-600/20 to-violet-600/20', border: 'hover:border-purple-500/40', tag: 'Staffing', tagColor: 'var(--color-accent-purple)', action: 'labor' },
    ],
    store_mgr: [
      { key: 'reorder', label: 'Reorder out of stock and low stock items', icon: Package, gradient: 'from-red-600/20 to-rose-600/20', border: 'hover:border-red-500/40', tag: 'Reorder', tagColor: 'var(--color-accent-red)' },
      { key: 'winback', label: 'Run a win-back campaign for lapsed customers', icon: Megaphone, gradient: 'from-green-600/20 to-emerald-600/20', border: 'hover:border-green-500/40', tag: 'Campaign', tagColor: 'var(--color-accent-green)' },
      { key: 'budtender', label: 'How are my budtenders doing on sales today?', icon: Users, gradient: 'from-amber-600/20 to-yellow-600/20', border: 'hover:border-amber-500/40', tag: 'Staff', tagColor: 'var(--color-accent-gold)' },
      { key: 'sentiment', label: 'What are customers saying about us?', icon: Star, gradient: 'from-purple-600/20 to-violet-600/20', border: 'hover:border-purple-500/40', tag: 'Reviews', tagColor: 'var(--color-accent-purple)' },
    ],
    compliance: [
      { key: 'metrc', label: 'Any packages stuck or needing METRC tags?', icon: Package, gradient: 'from-red-600/20 to-rose-600/20', border: 'hover:border-red-500/40', tag: 'METRC', tagColor: 'var(--color-accent-red)', action: 'metrc_queue' },
      { key: 'discrepancy', label: 'Any inventory counts off that need fixing?', icon: AlertTriangle, gradient: 'from-amber-600/20 to-yellow-600/20', border: 'hover:border-amber-500/40', tag: 'Exceptions', tagColor: 'var(--color-accent-gold)', action: 'discrepancy' },
      { key: 'audit', label: 'Are we ready for the upcoming inspection?', icon: Eye, gradient: 'from-blue-600/20 to-cyan-600/20', border: 'hover:border-blue-500/40', tag: 'Readiness', tagColor: 'var(--color-accent-blue)', action: 'audit' },
      { key: 'regulatory', label: 'What new rules are coming down the pipe?', icon: Clipboard, gradient: 'from-purple-600/20 to-violet-600/20', border: 'hover:border-purple-500/40', tag: 'Upcoming', tagColor: 'var(--color-accent-purple)', action: 'regulatory' },
    ],
  };
  const NEXUS_SUGGESTIONS = NEXUS_SUGGESTIONS_BY_PERSONA[selectedPersona?.id] || NEXUS_SUGGESTIONS_BY_PERSONA.store_mgr;

  const compactSuggestions = nexusOverlay ? NEXUS_SUGGESTIONS : compact ? COMPACT_SUGGESTIONS : SUGGESTIONS;

  return (
    <div className={`flex flex-col ${nexusOverlay ? 'h-full' : compact ? 'h-[420px]' : 'max-w-5xl mx-auto h-[calc(100vh-10rem)]'}`}>
      {/* header — hidden in nexusOverlay mode (NexusChat provides its own) */}
      {!nexusOverlay && <div className={`flex items-center gap-3 ${compact ? 'mb-3' : 'mb-6'}`}>
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center shadow-lg`} style={{ background: 'linear-gradient(135deg, #1A1710 0%, #2A2318 100%)', boxShadow: '0 0 20px rgba(212,160,58,0.3), inset 0 1px 0 rgba(212,160,58,0.15)', border: '1px solid rgba(212,160,58,0.2)' }}>
          <NexusIcon size={compact ? 16 : 22} />
        </div>
        <div>
          <h1 className={`${compact ? 'text-base' : 'text-xl'} font-bold text-text-primary`}>{compact ? 'Dex' : 'Dex'}</h1>
          <p className="text-xs text-text-secondary">{compact ? `Ask anything — ${selectedPersona?.shortLabel || 'Store Mgr'}` : `AI-Powered Retail Operations Agent — ${selectedPersona?.label || 'Store Manager'}`}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {compact ? (
            <button
              onClick={() => navigate('/agents/bridge')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-gold/10 border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors text-xs text-accent-gold font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Full Agent
            </button>
          ) : (
            <>
              {/* product suite toggle */}
              <button
                onClick={() => setCatalogOpen(!catalogOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border hover:border-surface-border transition-colors text-xs text-text-secondary hover:text-text-primary"
              >
                <Layers className="w-3.5 h-3.5 text-[#0EA5E9]" />
                <span className="font-medium">{activeCount}/{totalCount} Products</span>
                <PanelRight className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                <span className="text-xs text-accent-green font-medium">Online</span>
              </div>
            </>
          )}
        </div>
      </div>}

      {/* chat area */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {/* welcome — minimal centered spiral */}
        {messages.length === 0 && !thinkingStatus && !compact && (
          <div className="flex flex-col items-center justify-center py-10" style={{ minHeight: nexusOverlay ? 'calc(100% - 2rem)' : 320 }}>
            <div className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #1A1710 0%, #2A2318 100%)', boxShadow: '0 0 24px rgba(212,160,58,0.15), 0 0 8px rgba(212,160,58,0.1)', border: '1px solid rgba(212,160,58,0.2)' }}>
              <NexusIcon size={36} />
            </div>
            <h2 className="text-[26px] font-bold text-text-primary mb-2 text-center">How can I help?</h2>
            <p className="text-[13px] text-text-secondary text-center max-w-[420px] mb-5 leading-relaxed">
              Powered by 55+ knowledge articles, 11 agent lanes, and real-time data across all your stores.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-[480px]">
              {[
                { label: 'Inventory', color: 'var(--color-accent-blue)' },
                { label: 'Campaigns', color: 'var(--color-accent-green)' },
                { label: 'Pricing', color: 'var(--color-accent-gold)' },
                { label: 'Reporting', color: '#0EA5E9' },
                { label: 'Support', color: 'var(--color-accent-purple)' },
                { label: 'Compliance', color: '#E880A0' },
              ].map(t => (
                <span key={t.label} className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}20` }}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'agent' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A1710 0%, #2A2318 100%)', border: '1px solid rgba(212,160,58,0.2)' }}>
                <NexusIcon size={16} />
              </div>
            )}
            <div className={`max-w-2xl ${msg.role === 'user' ? '' : ''}`}>
              <div className={`rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-accent-gold/15 border border-accent-gold/20 text-text-primary rounded-tr-sm'
                  : 'bg-surface-card/80 border border-surface-border/60 text-text-primary rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
              {/* component rendering */}
              {msg.component === 'kb' && msg.data && (
                <div className="mt-3 space-y-2">
                  {msg.data.map(article => (
                    <KBArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
              {msg.component === 'upsell' && msg.data && (
                <div className="mt-3">
                  <UpsellCard
                    productKey={msg.data.productKey}
                    product={msg.data.product}
                    onActivate={activateProduct}
                    onDemoRequest={(key, prod) => {
                      // Portal interaction removed (Dex standalone)
                    }}
                  />
                </div>
              )}
              {msg.component === 'bug_gather' && msg.data && (
                <div className="mt-3">
                  <BugDetailGatherer
                    userMessage={msg.data.userMessage}
                    onSubmit={(extraDetails) => handleBugSubmit(msg.data.userMessage, msg.data.kbResults || [], extraDetails)}
                  />
                </div>
              )}
              {msg.component === 'bug' && msg.data && (
                <div className="mt-3">
                  <BugReportCard userMessage={msg.data.userMessage} ticketId={msg.data.ticketId} />
                </div>
              )}
              {msg.component === 'bug_with_kb' && msg.data && (
                <div className="mt-3 space-y-3">
                  <BugReportCard userMessage={msg.data.userMessage} ticketId={msg.data.ticketId} />
                  {msg.data.articles && msg.data.articles.map(article => (
                    <KBArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
              {msg.component === 'feature_help' && msg.data && (
                <div className="mt-3">
                  <FeatureHelpCard
                    userMessage={msg.data.userMessage}
                    kbResults={msg.data.kbResults || []}
                    onRequestForm={() => handleFeatureFormOpen(msg.data.userMessage)}
                  />
                </div>
              )}
              {msg.component === 'feature_gather' && msg.data && (
                <div className="mt-3">
                  <FeatureDetailGatherer
                    userMessage={msg.data.userMessage}
                    onSubmit={(extraDetails) => handleFeatureSubmit(msg.data.userMessage, extraDetails)}
                  />
                </div>
              )}
              {msg.component === 'feature' && msg.data && (
                <div className="mt-3">
                  <FeatureRequestCard userMessage={msg.data.userMessage} ticketId={msg.data.ticketId} />
                </div>
              )}
              {msg.component === 'ticket' && msg.data && (
                <div className="mt-3">
                  <BugReportCard userMessage={msg.data.userMessage} ticketId={msg.data.ticketId} />
                </div>
              )}
              {msg.component === 'review_feed' && msg.data && (
                <div className="mt-3">
                  <ReviewFeed data={msg.data} />
                </div>
              )}
              {msg.component === 'sentiment' && msg.data && (
                <div className="mt-3">
                  <SentimentSnippet data={msg.data} />
                </div>
              )}
              {msg.component === 'report' && msg.data && (
                <div className="mt-3">
                  <ReportSnippet data={msg.data} />
                </div>
              )}
              {msg.component === 'campaign' && msg.data && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <CampaignPlan data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'reorder' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <ReorderView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'explore' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <ExploreView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'recommendations' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <RecommendationsView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'pricing_market_comparison' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <MarketComparisonView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'pricing_price_cost_overview' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <PriceCostView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'pricing_discount_review' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <DiscountReviewView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'pricing_price_scenarios' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <PriceScenariosView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'pricing_change_prices' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <ChangePricesView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'pricing_create_discount' && (
                <div className={mobileCompact ? "mt-2 overflow-x-auto text-xs" : "mt-3 -mx-5"}>
                  <CreateDiscountView data={msg.data} onBack={null} />
                </div>
              )}
              {msg.component === 'nexus_action' && msg.data && (
                <div className={mobileCompact ? "mt-2" : "mt-3"}>
                  <NexusActionCard data={msg.data} compact={mobileCompact} />
                </div>
              )}
            </div>
          </div>
        ))}

        {thinkingStatus !== null && <ThinkingIndicator status={thinkingStatus} />}

        {/* suggestion bubbles — show when no messages or after result */}
        {messages.length === 0 && thinkingStatus === null && (
          <div className={`pt-2 animate-fade-in ${nexusOverlay ? 'max-w-[580px] mx-auto' : ''}`}>
            {!nexusOverlay && !mobileCompact && <p className={`text-xs text-text-secondary mb-3 ${compact ? '' : 'ml-11'}`}>{compact ? 'Try asking:' : 'Try one of these scenarios'}</p>}
            <div className={`grid stagger-grid ${mobileCompact ? 'grid-cols-2 gap-2' : nexusOverlay ? 'grid-cols-2 sm:grid-cols-3 gap-3' : compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 gap-3 ml-11'}`}>
              {compactSuggestions.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleSuggestionClick(s.key)}
                  className={`group text-left bg-surface-card border border-surface-border ${s.border} rounded-xl ${mobileCompact ? 'p-2.5' : compact ? 'p-3' : 'p-4'} transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`${mobileCompact ? 'w-5 h-5' : compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                      <s.icon className={`${mobileCompact ? 'w-2.5 h-2.5' : compact ? 'w-3 h-3' : 'w-4 h-4'} text-text-primary`} />
                    </div>
                    <span className={`${mobileCompact ? 'text-[8px]' : 'text-[9px]'} font-semibold px-1.5 py-0.5 rounded-full border border-white/10`} style={{ color: s.tagColor }}>{s.tag}</span>
                  </div>
                  <p className={`${mobileCompact ? 'text-[11px] leading-tight' : compact ? 'text-xs' : 'text-sm'} font-medium text-text-primary`}>"{s.label}"</p>
                  {!compact && !mobileCompact && (
                    <div className={`flex items-center gap-1 mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity ${nexusOverlay ? 'text-accent-green' : 'text-accent-gold'}`}>
                      <Zap className="w-3 h-3" /> Ask <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* input bar */}
      <form onSubmit={handleSubmit} className="sticky bottom-0 pb-2">
        <div className={`flex items-center bg-surface-card border border-surface-border rounded-2xl ${mobileCompact ? 'gap-2 px-3 py-1.5' : compact ? 'gap-3 px-3 py-2' : 'gap-3 px-4 py-3'} focus-within:border-accent-gold/40 transition-colors`}>
          <Search className={`${mobileCompact || compact ? 'w-4 h-4' : 'w-5 h-5'} text-text-secondary flex-shrink-0`} />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={mobileCompact ? 'Ask Nexus...' : compact ? 'Ask anything...' : 'Ask about your products, report an issue, or explore upgrades...'}
            className={`flex-1 bg-transparent ${mobileCompact ? 'text-sm' : compact ? 'text-xs' : 'text-sm'} text-text-primary placeholder-text-muted outline-none`}
            style={mobileCompact ? { fontSize: '16px' } : undefined}
            disabled={thinkingStatus !== null}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || thinkingStatus !== null}
            className={`${mobileCompact ? 'w-7 h-7' : compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg bg-accent-gold/80 flex items-center justify-center text-white disabled:opacity-30 hover:bg-accent-gold transition-colors disabled:hover:bg-accent-gold/80`}
          >
            <Send className={`${compact || mobileCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          </button>
        </div>
        {!compact && !mobileCompact && (
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-text-muted">
              Dex uses intelligent intent recognition and 55+ knowledge articles to answer your questions.
            </p>
            <div className="flex items-center gap-3 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent-gold" /> Support</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> Marketing</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent-blue" /> Connect</span>
            </div>
          </div>
        )}
      </form>

      {/* Product Catalog Sidebar — full mode only, not in nexus overlay */}
      {!compact && !nexusOverlay && (
        <>
          <ProductCatalogPanel
            products={products}
            onToggle={(key) => {
              const prod = products[key];
              processMessage(`Tell me about ${prod.name}`);
              setCatalogOpen(false);
            }}
            isOpen={catalogOpen}
            onClose={() => setCatalogOpen(false)}
          />
          {catalogOpen && (
            <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setCatalogOpen(false)} />
          )}
        </>
      )}

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
