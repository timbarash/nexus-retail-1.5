import { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, AlertTriangle, ArrowRightLeft, ShoppingCart, ChevronDown, ChevronRight, Filter, ArrowUpDown, TrendingDown, TrendingUp, Warehouse, Truck, ClipboardList, Check, RotateCw, Clock, Calendar, DollarSign, BarChart3, Zap, Layers, Archive, Award, Tag, Star, ShieldCheck, ShieldAlert, Search, ChevronUp, Store } from 'lucide-react';
import { locations } from '../data/mockData';
import { usePersona } from '../contexts/PersonaContext';
import { useStores } from '../contexts/StoreContext';
import ConfirmationDrawer from '../components/common/ConfirmationDrawer';
import { PageSkeleton } from '../components/common/PageSkeleton';
import {
  fmtDollar,
  PRODUCT_CATALOG,
  ALL_STORE_INVENTORY,
  ALL_STATES,
} from '../data/inventoryData';

// ---------------------------------------------------------------------------
// State compliance config for transfer buttons
// ---------------------------------------------------------------------------
const STATE_COMPLIANCE = {
  IL: { system: 'BioTrack', strictness: 'high' },
  MI: { system: 'METRC', strictness: 'medium' },
  OH: { system: 'METRC', strictness: 'very_high' },
  NJ: { system: 'METRC', strictness: 'high' },
  PA: { system: 'MJ Freeway', strictness: 'very_high' },
};

function getStoreCompliance(stateCode) {
  return STATE_COMPLIANCE[stateCode] || { system: 'METRC', strictness: 'medium' };
}

function ComplianceInlineBadge({ system }) {
  const colors = {
    'METRC': { bg: 'color-mix(in srgb, var(--color-accent-green) 15%, transparent)', text: 'var(--color-accent-green)' },
    'BioTrack': { bg: 'color-mix(in srgb, var(--color-accent-blue) 15%, transparent)', text: 'var(--color-accent-blue)' },
    'MJ Freeway': { bg: 'color-mix(in srgb, var(--color-accent-purple) 15%, transparent)', text: 'var(--color-accent-purple)' },
  };
  const c = colors[system] || colors['METRC'];
  return (
    <span className="text-[8px] font-bold px-1 py-px rounded" style={{ background: c.bg, color: c.text }}>{system}</span>
  );
}

// ---------------------------------------------------------------------------
// Tiny inline sparkline SVG
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
  oos: { label: 'OOS', bg: 'bg-accent-red/15', text: 'text-accent-red', border: 'border-accent-red/20', leftBorder: 'var(--color-accent-red)' },
  critical: { label: 'Critical', bg: 'bg-accent-gold/15', text: 'text-accent-gold', border: 'border-accent-gold/20', leftBorder: 'var(--color-accent-gold)' },
  low: { label: 'Low', bg: 'bg-accent-gold/15', text: 'text-accent-gold', border: 'border-accent-gold/20', leftBorder: 'var(--color-accent-gold)' },
  ok: { label: 'OK', bg: 'bg-accent-green/10', text: 'text-accent-green', border: 'border-accent-green/15', leftBorder: 'transparent' },
};

const URGENCY_ORDER = { oos: 0, critical: 1, low: 2, ok: 3 };

const CATEGORIES = ['All Categories', 'Flower', 'Pre-Rolls', 'Edibles', 'Vapes', 'Concentrates', 'Tinctures', 'Topicals'];

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
    <div className="rounded-xl border border-surface-border bg-surface-card px-4 py-3" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
          <p className="text-xs font-medium text-text-secondary truncate">{label}</p>
          {subValue && <p className="text-[10px] text-text-muted/70 mt-0.5 truncate">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable column header
// ---------------------------------------------------------------------------
function SortHeader({ label, field, sortField, sortDir, onSort, className = '', hideOnMobile = false }) {
  const active = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors group ${active ? 'text-accent-gold' : 'text-text-secondary hover:text-text-primary'} ${hideOnMobile ? 'hidden md:flex' : ''} ${className}`}
    >
      <span className="truncate">{label}</span>
      {active ? (
        sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      ) : (
        <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Single-store SKU table row
// ---------------------------------------------------------------------------
function SkuTableRow({ product, storeName, storeState, onReorder, onTransferToAgent }) {
  const canTransfer = product.floor === 0 && product.vault > 0;
  const needsCrossStore = product.floor === 0 && product.vault === 0;
  const compliance = getStoreCompliance(storeState);
  const canReorder = product.daysSupply < 7;
  const leftColor = STATUS_CONFIG[product.status]?.leftBorder || 'transparent';
  const isUrgent = product.status === 'oos' || product.status === 'critical';

  return (
    <tr className="border-b border-surface-divider hover:bg-surface-muted/50 transition-colors group" style={{ borderLeft: `3px solid ${leftColor}` }}>
      {/* Product + Brand */}
      <td className="px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] text-text-primary truncate ${isUrgent ? 'font-bold' : 'font-medium'}`}>{product.name}</span>
            <StatusPill status={product.status} />
          </div>
          <p className="text-[11px] text-text-muted truncate">{product.brand}</p>
        </div>
      </td>

      {/* Floor */}
      <td className="px-2 py-2.5 text-center">
        <span className={`text-[13px] font-semibold tabular-nums ${product.floor === 0 ? 'text-accent-red' : 'text-text-primary'}`}>{product.floor}</span>
      </td>

      {/* Vault */}
      <td className="px-2 py-2.5 text-center">
        <span className={`text-[13px] font-semibold tabular-nums ${product.vault > 0 && product.floor === 0 ? 'text-accent-blue' : 'text-text-primary'}`}>{product.vault}</span>
      </td>

      {/* Days of Supply */}
      <td className="px-2 py-2.5 text-center">
        <span className={`text-[13px] font-semibold tabular-nums ${product.daysSupply < 3 ? 'text-accent-red' : product.daysSupply < 7 ? 'text-accent-gold' : 'text-text-primary'}`}>
          {product.daysSupply > 90 ? '90+' : product.daysSupply.toFixed(1)}
        </span>
      </td>

      {/* Avg/Wk */}
      <td className="px-2 py-2.5 text-center">
        <span className="text-[13px] font-semibold tabular-nums text-text-primary">{product.avgWeekly}</span>
      </td>

      {/* Velocity Sparkline — hidden on mobile */}
      <td className="px-2 py-2.5 text-center hidden md:table-cell">
        <MiniSparkline data={product.velocityTrend} />
      </td>

      {/* Cat Rank — hidden on mobile */}
      <td className="px-2 py-2.5 text-center hidden md:table-cell">
        <span className="text-[12px] font-semibold tabular-nums text-accent-purple">#{product.categoryRank}
          <span className="text-text-muted/50 text-[10px]"> in {product.category}</span>
        </span>
      </td>

      {/* Rev % — hidden on mobile */}
      <td className="px-2 py-2.5 text-center hidden md:table-cell">
        <span className="text-[13px] font-semibold tabular-nums text-accent-gold">{product.revenueContribution.toFixed(1)}%</span>
      </td>

      {/* Margin/Unit */}
      <td className="px-2 py-2.5 text-center">
        <span className="text-[13px] font-semibold tabular-nums text-accent-green">{fmtDollar(product.marginPerUnit)}</span>
      </td>

      {/* Action */}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1.5 justify-end flex-wrap">
          {/* OOS: $/Day Lost + Transfer + Draft Reorder */}
          {product.status === 'oos' && (
            <>
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-accent-red bg-accent-red/10 border border-accent-red/15 whitespace-nowrap">
                <DollarSign size={9} />{fmtDollar(product.estLostPerDay)}/day
              </span>
              {canTransfer && (
                <button
                  onClick={() => onTransferToAgent(product)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors whitespace-nowrap"
                >
                  <ComplianceInlineBadge system={compliance.system} />
                  <ArrowRightLeft size={10} /> Transfer
                </button>
              )}
              {needsCrossStore && (
                <button
                  onClick={() => onTransferToAgent(product)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-accent-gold bg-accent-gold/15 border border-accent-gold/30 hover:bg-accent-gold/25 transition-colors whitespace-nowrap"
                >
                  <ComplianceInlineBadge system={compliance.system} />
                  <ArrowRightLeft size={10} /> Cross-Store Transfer
                </button>
              )}
              <button
                onClick={() => onReorder(product)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors whitespace-nowrap"
              >
                <Truck size={10} /> Draft Reorder
              </button>
            </>
          )}

          {/* Critical: Est. $/Day at Risk + Draft Reorder */}
          {product.status === 'critical' && (
            <>
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-accent-gold bg-accent-gold/10 border border-accent-gold/15 whitespace-nowrap">
                <AlertTriangle size={9} />Est. {fmtDollar(product.estAtRiskPerDay)}/day at risk
              </span>
              <button
                onClick={() => onReorder(product)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors whitespace-nowrap"
              >
                <Truck size={10} /> Draft Reorder
              </button>
            </>
          )}

          {/* OK: Reorder in X days */}
          {product.status === 'ok' && product.daysUntilReorder != null && (
            <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
              product.daysUntilReorder < 7
                ? 'text-accent-gold bg-accent-gold/10 border border-accent-gold/15 font-bold'
                : 'text-text-muted bg-surface-hover border border-surface-border'
            }`}>
              <Clock size={9} />
              {product.daysUntilReorder < 7
                ? 'Order today or stockout before delivery'
                : `Reorder in ${Math.round(product.daysUntilReorder)}d`
              }
            </span>
          )}

          {/* Low status: same as critical behavior */}
          {product.status === 'low' && (
            <>
              {product.estAtRiskPerDay > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-accent-gold bg-accent-gold/10 border border-accent-gold/15 whitespace-nowrap">
                  <AlertTriangle size={9} />Est. {fmtDollar(product.estAtRiskPerDay)}/day at risk
                </span>
              )}
              {canReorder && (
                <button
                  onClick={() => onReorder(product)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors whitespace-nowrap"
                >
                  <Truck size={10} /> Draft Reorder
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Accordion product row (multi-store view — compact version)
// ---------------------------------------------------------------------------
function AccordionProductRow({ product, storeName, storeState, onReorder, onTransferToAgent }) {
  const canTransfer = product.floor === 0 && product.vault > 0;
  const needsCrossStore = product.floor === 0 && product.vault === 0;
  const compliance = getStoreCompliance(storeState);
  const canReorder = product.daysSupply < 7;
  const leftColor = STATUS_CONFIG[product.status]?.leftBorder || 'transparent';
  const isUrgent = product.status === 'oos' || product.status === 'critical';

  return (
    <tr className="border-b border-surface-divider hover:bg-surface-muted/50 transition-colors" style={{ borderLeft: `3px solid ${leftColor}` }}>
      <td className="px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[12px] text-text-primary truncate ${isUrgent ? 'font-bold' : 'font-medium'}`}>{product.name}</span>
            <StatusPill status={product.status} />
          </div>
          <p className="text-[10px] text-text-muted truncate">{product.brand}</p>
        </div>
      </td>
      <td className="px-2 py-2 text-center">
        <span className={`text-[12px] font-semibold tabular-nums ${product.floor === 0 ? 'text-accent-red' : 'text-text-primary'}`}>{product.floor}</span>
      </td>
      <td className="px-2 py-2 text-center hidden md:table-cell">
        <span className={`text-[12px] font-semibold tabular-nums ${product.vault > 0 && product.floor === 0 ? 'text-accent-blue' : 'text-text-primary'}`}>{product.vault}</span>
      </td>
      <td className="px-2 py-2 text-center hidden md:table-cell">
        <span className={`text-[12px] font-semibold tabular-nums ${product.daysSupply < 3 ? 'text-accent-red' : product.daysSupply < 7 ? 'text-accent-gold' : 'text-text-primary'}`}>
          {product.daysSupply > 90 ? '90+' : product.daysSupply.toFixed(1)}
        </span>
      </td>
      <td className="px-2 py-2 text-center hidden md:table-cell">
        <span className="text-[12px] font-semibold tabular-nums text-text-primary">{product.avgWeekly}</span>
      </td>
      <td className="px-2 py-2 text-center hidden md:table-cell">
        <MiniSparkline data={product.velocityTrend} width={40} height={14} />
      </td>
      <td className="px-2 py-2 text-center hidden lg:table-cell">
        <span className="text-[11px] font-semibold tabular-nums text-accent-purple">#{product.categoryRank}</span>
      </td>
      <td className="px-2 py-2 text-center hidden lg:table-cell">
        <span className="text-[12px] font-semibold tabular-nums text-accent-gold">{product.revenueContribution.toFixed(1)}%</span>
      </td>
      <td className="px-2 py-2 text-center hidden md:table-cell">
        <span className="text-[12px] font-semibold tabular-nums text-accent-green">{fmtDollar(product.marginPerUnit)}</span>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1 justify-end">
          {product.estLostPerDay > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-accent-red bg-accent-red/10 whitespace-nowrap">
              {fmtDollar(product.estLostPerDay)}/d
            </span>
          )}
          {product.estAtRiskPerDay > 0 && product.estLostPerDay === 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-accent-gold bg-accent-gold/10 whitespace-nowrap">
              {fmtDollar(product.estAtRiskPerDay)}/d risk
            </span>
          )}
          {canTransfer && (
            <button onClick={() => onTransferToAgent(product)} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 hover:bg-accent-gold/20 transition-colors whitespace-nowrap flex items-center gap-0.5">
              <ComplianceInlineBadge system={compliance.system} /> Transfer
            </button>
          )}
          {needsCrossStore && (
            <button onClick={() => onTransferToAgent(product)} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-accent-gold bg-accent-gold/15 border border-accent-gold/30 hover:bg-accent-gold/25 transition-colors whitespace-nowrap flex items-center gap-0.5">
              <ComplianceInlineBadge system={compliance.system} /> Cross-Store
            </button>
          )}
          {canReorder && (
            <button onClick={() => onReorder(product)} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-accent-green bg-accent-green/10 border border-accent-green/20 hover:bg-accent-green/20 transition-colors whitespace-nowrap">
              Reorder
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Store Accordion (multi-store view)
// ---------------------------------------------------------------------------
function StoreAccordion({ store, onReorder, onTransferToAgent, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  const sortedProducts = useMemo(() => {
    return [...store.products].sort((a, b) => {
      const orderA = URGENCY_ORDER[a.status];
      const orderB = URGENCY_ORDER[b.status];
      if (orderA !== orderB) return orderA - orderB;
      const lostA = a.estLostPerDay || a.estAtRiskPerDay || 0;
      const lostB = b.estLostPerDay || b.estAtRiskPerDay || 0;
      return lostB - lostA;
    });
  }, [store.products]);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-muted transition-colors"
      >
        {open ? <ChevronDown size={16} className="text-text-muted flex-shrink-0" /> : <ChevronRight size={16} className="text-text-muted flex-shrink-0" />}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="text-[14px] font-semibold text-text-primary truncate">{store.name}</span>
          <span className="text-[11px] text-text-muted flex-shrink-0">{store.state}</span>
          {store.oosCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-red/15 text-accent-red border border-accent-red/20">
              {store.oosCount} OOS
            </span>
          )}
          {store.lowCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-gold/15 text-accent-gold border border-accent-gold/20">
              {store.lowCount} Low
            </span>
          )}
          {store.vaultReady > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
              {store.vaultReady} Vault Ready
            </span>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          {store.totalLost > 0 && (
            <span className="text-[12px] font-semibold text-accent-red">{fmtDollar(store.totalLost)}/day lost</span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-surface-divider overflow-x-auto">
          <table className="w-full min-w-[600px] lg:min-w-0">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-divider">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-14">Floor</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-14 hidden md:table-cell">Vault</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-14 hidden md:table-cell">Days</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-14 hidden md:table-cell">Avg/Wk</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-14 hidden md:table-cell">Velocity</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-12 hidden lg:table-cell">Rank</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-14 hidden lg:table-cell">Rev %</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-text-secondary uppercase tracking-wider w-14 hidden md:table-cell">Margin</th>
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-text-secondary uppercase tracking-wider min-w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product, i) => (
                <AccordionProductRow
                  key={i}
                  product={product}
                  storeName={store.name}
                  storeState={store.state}
                  onReorder={(p) => onReorder(store, p)}
                  onTransferToAgent={(p) => onTransferToAgent(store, p)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page -- Store Inventory (daily operational view)
// ---------------------------------------------------------------------------
export default function InventoryActions() {
  const { selectedPersona, isStoreMgr } = usePersona();
  const { selectedStoreNames } = useStores();
  const navigate = useNavigate();

  // Store dropdown -- default based on persona
  const defaultStore = useMemo(() => {
    if (isStoreMgr && selectedPersona.storeFilter?.store) {
      return selectedPersona.storeFilter.store;
    }
    return '__all__';
  }, [isStoreMgr, selectedPersona]);

  const [selectedStore, setSelectedStore] = useState(defaultStore);

  // Filters
  const [stateFilter, setStateFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [brandFilter, setBrandFilter] = useState('All Brands');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lost');

  // Single-store table sort
  const [tableSortField, setTableSortField] = useState('default');
  const [tableSortDir, setTableSortDir] = useState('asc');

  // Drawer state
  const [bulkTransferDrawer, setBulkTransferDrawer] = useState(false);
  const [bulkReorderDrawer, setBulkReorderDrawer] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const isSingleStore = selectedStore !== '__all__';

  // Filter stores by persona/store selection
  const visibleStores = useMemo(() => {
    let stores = ALL_STORE_INVENTORY;

    if (selectedPersona.storeFilter) {
      if (selectedPersona.storeFilter.states) {
        stores = stores.filter(s => selectedPersona.storeFilter.states.includes(s.state));
      }
      if (selectedPersona.storeFilter.store) {
        stores = stores.filter(s => s.name === selectedPersona.storeFilter.store);
      }
    }

    if (selectedStoreNames.size > 0 && selectedStoreNames.size < locations.length) {
      stores = stores.filter(s => selectedStoreNames.has(s.name));
    }

    if (stateFilter) {
      stores = stores.filter(s => s.state === stateFilter);
    }

    return stores;
  }, [selectedPersona, selectedStoreNames, stateFilter]);

  // Available stores for dropdown
  const storeDropdownOptions = useMemo(() => {
    return visibleStores.map(s => ({ name: s.name, state: s.state }));
  }, [visibleStores]);

  // Available brands from visible stores
  const availableBrands = useMemo(() => {
    const brands = new Set();
    visibleStores.forEach(s => s.products.forEach(p => brands.add(p.brand)));
    return ['All Brands', ...Array.from(brands).sort()];
  }, [visibleStores]);

  // Available states from visible stores
  const availableStates = useMemo(() => {
    return [...new Set(visibleStores.map(s => s.state))].sort();
  }, [visibleStores]);

  // For multi-store view: filter stores and products
  const filteredStoresMulti = useMemo(() => {
    let stores = visibleStores;

    if (statusFilter === 'oos') stores = stores.filter(s => s.oosCount > 0);
    else if (statusFilter === 'low') stores = stores.filter(s => s.lowCount > 0 || s.oosCount > 0);
    else if (statusFilter === 'vault') stores = stores.filter(s => s.vaultReady > 0);

    if (sortBy === 'lost') stores = [...stores].sort((a, b) => b.totalLost - a.totalLost);
    else if (sortBy === 'days') stores = [...stores].sort((a, b) => {
      const aMin = Math.min(...a.products.map(p => p.daysSupply));
      const bMin = Math.min(...b.products.map(p => p.daysSupply));
      return aMin - bMin;
    });
    else stores = [...stores].sort((a, b) => a.name.localeCompare(b.name));

    if (statusFilter !== 'all') {
      return stores.map(store => {
        let filtered;
        if (statusFilter === 'oos') filtered = store.products.filter(p => p.status === 'oos');
        else if (statusFilter === 'low') filtered = store.products.filter(p => ['oos', 'critical', 'low'].includes(p.status));
        else if (statusFilter === 'vault') filtered = store.products.filter(p => p.floor === 0 && p.vault > 0);
        else filtered = store.products;
        return { ...store, products: filtered };
      }).filter(s => s.products.length > 0);
    }

    return stores;
  }, [visibleStores, statusFilter, sortBy]);

  // Single-store data
  const singleStoreData = useMemo(() => {
    if (!isSingleStore) return null;
    return visibleStores.find(s => s.name === selectedStore) || null;
  }, [isSingleStore, selectedStore, visibleStores]);

  // Single-store filtered + sorted products
  const singleStoreProducts = useMemo(() => {
    if (!singleStoreData) return [];
    let products = [...singleStoreData.products];

    // Status filter
    if (statusFilter === 'oos') products = products.filter(p => p.status === 'oos');
    else if (statusFilter === 'critical') products = products.filter(p => p.status === 'critical' || p.status === 'low');
    else if (statusFilter === 'ok') products = products.filter(p => p.status === 'ok');

    // Category filter
    if (categoryFilter !== 'All Categories') {
      products = products.filter(p => p.category === categoryFilter);
    }

    // Brand filter
    if (brandFilter !== 'All Brands') {
      products = products.filter(p => p.brand === brandFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }

    // Sort
    if (tableSortField === 'default') {
      // Default: OOS first (by $/day lost desc), then Critical (by days of supply asc), then OK
      products.sort((a, b) => {
        const orderA = URGENCY_ORDER[a.status];
        const orderB = URGENCY_ORDER[b.status];
        if (orderA !== orderB) return orderA - orderB;
        if (a.status === 'oos') return (b.estLostPerDay || 0) - (a.estLostPerDay || 0);
        if (a.status === 'critical' || a.status === 'low') return a.daysSupply - b.daysSupply;
        return a.name.localeCompare(b.name);
      });
    } else {
      const dir = tableSortDir === 'asc' ? 1 : -1;
      products.sort((a, b) => {
        switch (tableSortField) {
          case 'product': return dir * a.name.localeCompare(b.name);
          case 'status': return dir * (URGENCY_ORDER[a.status] - URGENCY_ORDER[b.status]);
          case 'floor': return dir * (a.floor - b.floor);
          case 'vault': return dir * (a.vault - b.vault);
          case 'days': return dir * (a.daysSupply - b.daysSupply);
          case 'avgWeekly': return dir * (a.avgWeekly - b.avgWeekly);
          case 'catRank': return dir * (a.categoryRank - b.categoryRank);
          case 'revPct': return dir * (a.revenueContribution - b.revenueContribution);
          case 'margin': return dir * (a.marginPerUnit - b.marginPerUnit);
          default: return 0;
        }
      });
    }

    return products;
  }, [singleStoreData, statusFilter, categoryFilter, brandFilter, searchQuery, tableSortField, tableSortDir]);

  const handleTableSort = useCallback((field) => {
    if (field === tableSortField) {
      setTableSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortDir('asc');
    }
  }, [tableSortField]);

  // KPI totals
  const kpis = useMemo(() => {
    const stores = isSingleStore && singleStoreData ? [singleStoreData] : visibleStores;
    const allProducts = stores.flatMap(s => s.products);
    const inStockProducts = allProducts.filter(p => p.status !== 'oos' && p.daysSupply < 900);
    const avgDaysOfSupply = inStockProducts.length > 0
      ? Math.round((inStockProducts.reduce((sum, p) => sum + p.daysSupply, 0) / inStockProducts.length) * 10) / 10
      : 0;
    const totalWeeklyUnits = allProducts.reduce((sum, p) => sum + p.avgWeekly, 0);
    const totalInventory = allProducts.reduce((sum, p) => sum + p.floor + p.vault, 0);
    const turnRate = totalInventory > 0 ? Math.round(((totalWeeklyUnits * 52) / totalInventory) * 10) / 10 : 0;

    const oosProducts = allProducts.filter(p => p.status === 'oos');
    const vaultReadyProducts = allProducts.filter(p => p.floor === 0 && p.vault > 0);
    const totalLostRaw = allProducts.reduce((sum, p) => sum + p.estLostPerDay, 0);

    // Aged inventory: products with > 60 days supply (slow movers)
    const agedProducts = allProducts.filter(p => p.daysSupply > 60 && p.status === 'ok');
    const agedInventoryValue = agedProducts.reduce((sum, p) => sum + (p.floor + p.vault) * p.price, 0);

    return {
      totalSkus: allProducts.length,
      oosCount: oosProducts.length,
      oosStores: stores.filter(s => s.products.some(p => p.status === 'oos')).length,
      lowCount: allProducts.filter(p => p.status === 'low' || p.status === 'critical').length,
      vaultReady: vaultReadyProducts.length,
      totalLost: totalLostRaw,
      lostRevenue: fmtDollar(totalLostRaw),
      avgDaysOfSupply,
      turnRate,
      agedInventoryValue,
    };
  }, [visibleStores, isSingleStore, singleStoreData]);

  // Navigate handlers
  const handleReorder = useCallback((store, product) => {
    navigate('/agents/connect', { state: {
      action: 'reorder',
      store: store.name,
      product: product.name,
      brand: product.brand,
      vendor: product.brand,
    } });
  }, [navigate]);

  const handleTransferToAgent = useCallback((store, product) => {
    navigate('/agents/connect', { state: {
      action: 'transfer',
      store: store.name,
      product: product.name,
      brand: product.brand,
    } });
  }, [navigate]);

  // Single-store action wrappers
  const handleSingleReorder = useCallback((product) => {
    if (!singleStoreData) return;
    navigate('/agents/connect', { state: {
      action: 'reorder',
      store: singleStoreData.name,
      product: product.name,
      brand: product.brand,
      vendor: product.brand,
    } });
  }, [navigate, singleStoreData]);

  const handleSingleTransfer = useCallback((product) => {
    if (!singleStoreData) return;
    navigate('/agents/connect', { state: {
      action: 'transfer',
      store: singleStoreData.name,
      product: product.name,
      brand: product.brand,
    } });
  }, [navigate, singleStoreData]);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Bulk counts + dollar impact
  const bulkTransferCount = useMemo(() => visibleStores.reduce((sum, s) => sum + s.products.filter(p => p.floor === 0 && p.vault > 0).length, 0), [visibleStores]);
  const bulkTransferRecovery = useMemo(() => {
    return visibleStores.reduce((sum, s) => sum + s.products.filter(p => p.floor === 0 && p.vault > 0).reduce((ps, p) => ps + p.estLostPerDay, 0), 0);
  }, [visibleStores]);
  const bulkReorderCount = useMemo(() => visibleStores.reduce((sum, s) => sum + s.products.filter(p => p.daysSupply < 3).length, 0), [visibleStores]);
  const bulkReorderPOValue = useMemo(() => {
    return visibleStores.reduce((sum, s) => sum + s.products.filter(p => p.daysSupply < 3).reduce((ps, p) => {
      const velocityPerDay = p.avgWeekly / 7;
      const suggestedQty = Math.round(velocityPerDay * 14);
      return ps + suggestedQty * p.price;
    }, 0), 0);
  }, [visibleStores]);

  return (
    <PageSkeleton>
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Package size={22} className="text-accent-gold" />
            Store Inventory
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time stock levels, vault-to-floor transfers, and reorder management{isSingleStore ? '' : ` across ${visibleStores.length} locations`}
          </p>
        </div>
        <Link
          to="/inventory/analytics"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/20 hover:bg-accent-purple/20 transition-colors flex-shrink-0"
        >
          <BarChart3 size={16} />
          View Inventory Planning
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Store Dropdown */}
      <div className="flex items-center gap-3">
        <Store size={16} className="text-text-muted flex-shrink-0" />
        <select
          value={selectedStore}
          onChange={e => {
            setSelectedStore(e.target.value);
            // Reset single-store filters when changing
            setTableSortField('default');
            setTableSortDir('asc');
            setCategoryFilter('All Categories');
            setBrandFilter('All Brands');
            setSearchQuery('');
          }}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-[13px] font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold/40 min-w-[240px]"
        >
          <option value="__all__">All Stores ({visibleStores.length})</option>
          {storeDropdownOptions.map(s => (
            <option key={s.name} value={s.name}>{s.name} ({s.state})</option>
          ))}
        </select>
        {isSingleStore && singleStoreData && (
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <span>{singleStoreData.products.length} SKUs</span>
            {singleStoreData.oosCount > 0 && <span className="text-accent-red font-semibold">{singleStoreData.oosCount} OOS</span>}
            {singleStoreData.totalLost > 0 && <span className="text-accent-red">{fmtDollar(singleStoreData.totalLost)}/day lost</span>}
          </div>
        )}
      </div>

      {/* KPI Cards — Row 1: Portfolio Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Package}
          label="Total SKUs Tracked"
          value={kpis.totalSkus}
          subValue={isSingleStore ? 'this store' : `across ${visibleStores.length} stores`}
          color="var(--color-accent-blue)"
          iconBg="color-mix(in srgb, var(--color-accent-blue) 10%, transparent)"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Out of Stock"
          value={kpis.oosCount}
          subValue={isSingleStore ? 'products currently OOS' : `across ${kpis.oosStores} stores`}
          color="var(--color-accent-red)"
          iconBg="color-mix(in srgb, var(--color-accent-red) 10%, transparent)"
        />
        <KpiCard
          icon={TrendingDown}
          label="Low Stock / Critical"
          value={kpis.lowCount}
          subValue="critical + low stock"
          color="var(--color-accent-gold)"
          iconBg="color-mix(in srgb, var(--color-accent-gold) 10%, transparent)"
        />
        <KpiCard
          icon={Warehouse}
          label="Vault-to-Floor Ready"
          value={kpis.vaultReady}
          subValue="OOS with vault inventory"
          color="var(--color-accent-blue)"
          iconBg="color-mix(in srgb, var(--color-accent-blue) 10%, transparent)"
        />
      </div>

      {/* KPI Cards — Row 2: Financial Impact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={DollarSign}
          label="Est. Daily Lost Revenue"
          value={kpis.lostRevenue}
          subValue="from stockouts only"
          color="var(--color-accent-red)"
          iconBg="color-mix(in srgb, var(--color-accent-red) 10%, transparent)"
        />
        <KpiCard
          icon={Clock}
          label="Avg Days of Supply"
          value={`${kpis.avgDaysOfSupply}d`}
          subValue="across in-stock SKUs"
          color="var(--color-accent-purple)"
          iconBg="color-mix(in srgb, var(--color-accent-purple) 10%, transparent)"
        />
        <KpiCard
          icon={RotateCw}
          label="Inventory Turn Rate"
          value={`${kpis.turnRate}x`}
          subValue="annualized"
          color="var(--color-accent-blue)"
          iconBg="color-mix(in srgb, var(--color-accent-blue) 10%, transparent)"
        />
        <KpiCard
          icon={Archive}
          label="Aged Inventory $"
          value={fmtDollar(kpis.agedInventoryValue)}
          subValue="slow movers 60+ days"
          color="var(--color-accent-gold)"
          iconBg="color-mix(in srgb, var(--color-accent-gold) 10%, transparent)"
        />
      </div>

      {/* ============================================================== */}
      {/* SINGLE-STORE VIEW: Full SKU table */}
      {/* ============================================================== */}
      {isSingleStore && singleStoreData ? (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status pills */}
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'oos', label: 'OOS' },
                { key: 'critical', label: 'Critical' },
                { key: 'ok', label: 'OK' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${statusFilter === f.key
                    ? f.key === 'oos' ? 'bg-accent-red/15 text-accent-red border border-accent-red/25'
                    : f.key === 'critical' ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/25'
                    : f.key === 'ok' ? 'bg-accent-green/15 text-accent-green border border-accent-green/25'
                    : 'bg-accent-gold/15 text-accent-gold border border-accent-gold/25'
                    : 'text-text-muted border border-surface-border hover:text-text-secondary hover:border-surface-hover'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-surface-border" />

            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-[11px] font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold/40"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Brand dropdown */}
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-[11px] font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold/40"
            >
              {availableBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <div className="w-px h-5 bg-surface-border" />

            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-[260px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search product or brand..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg pl-7 pr-3 py-1 text-[11px] font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-gold/40"
              />
            </div>

            <span className="text-[11px] text-text-muted ml-auto tabular-nums">{singleStoreProducts.length} products</span>
          </div>

          {/* Full SKU Table */}
          <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-divider">
                    <th className="px-3 py-2.5 text-left">
                      <SortHeader label="Product" field="product" sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} />
                    </th>
                    <th className="px-2 py-2.5 w-14">
                      <SortHeader label="Floor" field="floor" sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} className="justify-center" />
                    </th>
                    <th className="px-2 py-2.5 w-14">
                      <SortHeader label="Vault" field="vault" sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} className="justify-center" />
                    </th>
                    <th className="px-2 py-2.5 w-16">
                      <SortHeader label="Days" field="days" sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} className="justify-center" />
                    </th>
                    <th className="px-2 py-2.5 w-14">
                      <SortHeader label="Avg/Wk" field="avgWeekly" sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} className="justify-center" />
                    </th>
                    <th className="px-2 py-2.5 w-14 hidden md:table-cell">
                      <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Trend</span>
                    </th>
                    <th className="px-2 py-2.5 hidden md:table-cell">
                      <SortHeader label="Cat Rank" field="catRank" sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} className="justify-center" hideOnMobile />
                    </th>
                    <th className="px-2 py-2.5 w-14 hidden md:table-cell">
                      <SortHeader label="Rev %" field="revPct" sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} className="justify-center" hideOnMobile />
                    </th>
                    <th className="px-2 py-2.5 w-16">
                      <SortHeader label="Margin/u" field="margin" sortField={tableSortField} sortDir={tableSortDir} onSort={handleTableSort} className="justify-center" />
                    </th>
                    <th className="px-2 py-2.5 text-right min-w-[140px]">
                      <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {singleStoreProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-text-muted">
                        <Package size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-[13px]">No products match current filters</p>
                      </td>
                    </tr>
                  ) : (
                    singleStoreProducts.map((product, i) => (
                      <SkuTableRow
                        key={i}
                        product={product}
                        storeName={singleStoreData.name}
                        storeState={singleStoreData.state}
                        onReorder={handleSingleReorder}
                        onTransferToAgent={handleSingleTransfer}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ============================================================== */
        /* MULTI-STORE VIEW: Accordion */
        /* ============================================================== */
        <>
          {/* Multi-store filters */}
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
            {filteredStoresMulti.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-[14px]">No stores match the current filters</p>
              </div>
            ) : (
              filteredStoresMulti.map((store, i) => (
                <StoreAccordion
                  key={store.name}
                  store={store}
                  onReorder={handleReorder}
                  onTransferToAgent={handleTransferToAgent}
                  defaultOpen={i === 0}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Bulk Actions Bar (sticky bottom) — only in multi-store view */}
      {!isSingleStore && (kpis.vaultReady > 0 || kpis.oosCount > 0) && (
        <div className="fixed bottom-14 lg:bottom-0 left-0 lg:left-64 right-0 z-20 bg-surface-card/95 backdrop-blur-md border-t border-surface-divider px-6 py-3 flex items-center justify-between">
          <div className="text-[12px] text-text-muted">
            <span className="text-text-primary font-semibold">{filteredStoresMulti.length}</span> stores · <span className="text-accent-red font-semibold">{kpis.oosCount}</span> OOS · <span className="text-accent-gold font-semibold">{kpis.lowCount}</span> low stock
          </div>
          <div className="flex items-center gap-3">
            {kpis.vaultReady > 0 && (
              <button
                onClick={() => setBulkTransferDrawer(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 transition-colors"
              >
                <ArrowRightLeft size={14} />
                <span>Transfer All OOS from Vault ({kpis.vaultReady})</span>
                {bulkTransferRecovery > 0 && (
                  <span className="ml-1 text-[10px] font-bold opacity-80">-- recovers est. {fmtDollar(bulkTransferRecovery)}/day</span>
                )}
              </button>
            )}
            {bulkReorderCount > 0 && (
              <button
                onClick={() => setBulkReorderDrawer(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors"
              >
                <ClipboardList size={14} />
                <span>Draft Reorder for All Critical ({bulkReorderCount})</span>
                {bulkReorderPOValue > 0 && (
                  <span className="ml-1 text-[10px] font-bold opacity-80">-- {fmtDollar(bulkReorderPOValue)} PO value</span>
                )}
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
          showToast(`Queued ${bulkTransferCount} vault -> floor room changes for compliance confirmation`);
        }}
        title="Bulk Vault -> Floor Room Changes"
        description={`This will queue ${bulkTransferCount} room assignments across ${visibleStores.filter(s => s.vaultReady > 0).length} stores.`}
        icon={ArrowRightLeft}
        confirmLabel={`Queue ${bulkTransferCount} Room Changes`}
        confirmColor="var(--color-accent-blue)"
        details={[
          { label: 'Total Items', value: `${bulkTransferCount} OOS products with vault stock` },
          { label: 'Stores Affected', value: `${visibleStores.filter(s => s.vaultReady > 0).length} locations` },
          { label: 'Compliance Systems', value: [...new Set(visibleStores.filter(s => s.vaultReady > 0).map(s => getStoreCompliance(s.state).system))].join(', ') },
          { label: 'Action', value: 'Move from Vault to Sales Floor (room-to-room transfer)' },
        ]}
        warning={`Each room change will be logged in the store's compliance system (${[...new Set(visibleStores.filter(s => s.vaultReady > 0).map(s => getStoreCompliance(s.state).system))].join('/')}). Verify physical inventory at each location before confirming.`}
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
    </PageSkeleton>
  );
}
