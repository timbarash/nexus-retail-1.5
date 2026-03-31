import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { Zap, MapPin, Package, Tag, Users, ShoppingCart, CircleDollarSign, Megaphone, Waypoints, X, Bot } from 'lucide-react';
import { useStores } from '../../contexts/StoreContext';
import NexusIcon from '../NexusIcon';

const MY_STORES_ITEMS = [
  { to: '/', label: 'Command Center', icon: Zap },
  { to: '/locations', label: 'Store Performance', icon: MapPin },
  { to: '/inventory', label: 'Inventory Analytics', icon: Package },
];

const INTELLIGENCE_ITEMS = [
  { to: '/brands', label: 'Brand Performance', icon: Tag },
  { to: '/customers', label: 'Customer Intelligence', icon: Users },
];

const AI_AGENTS_ITEMS = [
  { to: '/agents/connect', label: 'Inventory Agent', icon: ShoppingCart },
  { to: '/agents/pricing', label: 'Pricing & Margins', icon: CircleDollarSign },
  { to: '/agents/marketing', label: 'Marketing Campaigns', icon: Megaphone },
];

const SUPPORT_ITEMS = [
  { to: '/agents/bridge', label: 'Dex', icon: Waypoints },
];

function SidebarContent({ onClose }) {
  const { selectionLabel } = useStores();
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #2A1E0A 0%, #3D2A0A 100%)', boxShadow: '0 0 20px rgba(212,160,58,0.2), inset 0 1px 0 rgba(212,160,58,0.1)', border: '1px solid rgba(212,160,58,0.25)' }}>
            <NexusIcon size={22} />
          </div>
          <div className="flex items-center">
            <span style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", fontWeight: 300, letterSpacing: '0.06em', fontSize: '24px', color: '#F0EDE8' }}>nexus</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors" aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto sidebar-scroll">
        {[
          { label: 'My Stores', items: MY_STORES_ITEMS },
          { label: 'Intelligence', items: INTELLIGENCE_ITEMS },
          { label: 'AI Agents', items: AI_AGENTS_ITEMS, icon: Bot },
          { label: 'Support', items: SUPPORT_ITEMS },
        ].map(({ label: groupLabel, items, icon: GroupIcon }, gi) => (
          <Fragment key={groupLabel}>
            <p className={`px-3 ${gi > 0 ? 'mt-6' : ''} mb-2 text-[11px] font-semibold text-[#00C27C]/30 uppercase tracking-widest flex items-center gap-2`}>
              {GroupIcon && <GroupIcon className="w-3 h-3" />}
              {groupLabel}
            </p>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sidebar-hover text-[#00E08E] shadow-sm'
                      : 'text-white/60 hover:bg-sidebar-hover/60 hover:text-white/90'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-[#00E08E]' : 'text-white/40 group-hover:text-white/70'}`} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C27C]" />}
                  </>
                )}
              </NavLink>
            ))}
          </Fragment>
        ))}
      </nav>

      {/* Tenant badge */}
      <div className="px-4 py-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-3 py-3 transition-colors duration-150 hover:bg-white/[0.10] cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00C27C] to-[#00E08E] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">Ascend</p>
            <p className="text-white/40 text-xs truncate">{selectionLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-sidebar-bg border-r border-sidebar-border z-30">
        <SidebarContent />
      </aside>
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0" />

      {/* Mobile overlay */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg shadow-2xl lg:hidden animate-slide-in">
            <SidebarContent onClose={onClose} />
          </aside>
        </>
      )}

      <style>{`
        @keyframes slide-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.2s ease-out; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </>
  );
}
