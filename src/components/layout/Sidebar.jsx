import { Fragment, useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Zap, MapPin, Package, Tag, Users, ShoppingCart, CircleDollarSign, Megaphone, Waypoints, X, Bot, Sparkles, BarChart3 } from 'lucide-react';
import { useStores } from '../../contexts/StoreContext';
import { useAlerts } from '../../contexts/AlertContext';
import NexusIcon from '../NexusIcon';

const MY_STORES_ITEMS = [
  { to: '/', label: 'Command Center', icon: Zap },
  { to: '/locations', label: 'Store Performance', icon: MapPin },
  { to: '/inventory', label: 'Store Inventory', icon: Package },
  { to: '/inventory/analytics', label: 'Inventory Analytics', icon: BarChart3 },
];

const INTELLIGENCE_ITEMS = [
  { to: '/brands', label: 'Brand Performance', icon: Tag },
  { to: '/customers', label: 'Customer Intelligence', icon: Users },
];

const AI_AGENTS_ITEMS = [
  { to: '/agents/connect', label: 'Inventory Agent', icon: ShoppingCart },
  { to: '/agents/pricing', label: 'Pricing & Margins', icon: CircleDollarSign },
  { to: '/agents/marketing', label: 'Growth Agent', icon: Megaphone },
];

const SUPPORT_ITEMS = [
  { to: '/agents/bridge', label: 'Dex', icon: Waypoints },
];

function SidebarContent({ onClose }) {
  const { selectionLabel } = useStores();
  const { unreadCount } = useAlerts();
  const location = useLocation();
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    const activeLink = navRef.current.querySelector('a[aria-current="page"]');
    if (activeLink) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setIndicatorStyle({
        top: linkRect.top - navRect.top,
        height: linkRect.height,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #161412 0%, #1C1A17 100%)', boxShadow: '0 0 20px rgba(212,160,58,0.12), 0 2px 8px rgba(0,0,0,0.4)', border: '1px solid rgba(212,160,58,0.2)' }}>
            <NexusIcon size={22} style={{ filter: 'drop-shadow(0 0 6px rgba(212,160,58,0.5))' }} />
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
      <nav ref={navRef} className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto sidebar-scroll relative">
        {/* Traveling indicator */}
        <div
          className="absolute left-0 w-0.5 rounded-full"
          style={{
            top: indicatorStyle.top,
            height: indicatorStyle.height,
            opacity: indicatorStyle.opacity,
            background: 'linear-gradient(to bottom, #00E08E, #00C27C)',
            boxShadow: '0 0 8px rgba(0,226,142,0.4)',
            transition: 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s ease, opacity 0.2s ease',
          }}
        />
        {[
          { label: 'My Stores', items: MY_STORES_ITEMS },
          { label: 'Intelligence', items: INTELLIGENCE_ITEMS },
          { label: 'AI Agents', items: AI_AGENTS_ITEMS, icon: Bot },
          { label: 'Support', items: SUPPORT_ITEMS },
        ].map(({ label: groupLabel, items, icon: GroupIcon }, gi) => (
          <Fragment key={groupLabel}>
            <p className={`px-3 ${gi > 0 ? 'mt-4' : ''} mb-1.5 text-[11px] font-semibold text-[#00C27C]/30 uppercase tracking-widest flex items-center gap-2`}>
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
                  `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
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
                    {label === 'Command Center' && unreadCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent-red text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                    {isActive && !(label === 'Command Center' && unreadCount > 0) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C27C]" />}
                  </>
                )}
              </NavLink>
            ))}
          </Fragment>
        ))}
      </nav>

      {/* Study link pill */}
      <div className="px-4 pt-3 pb-1">
        <a
          href="#/study"
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-white/[0.06]"
          style={{ border: '1px dashed rgba(212,160,58,0.25)', color: 'rgba(212,160,58,0.7)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4A03A]/60 group-hover:text-[#D4A03A] transition-colors" strokeWidth={2} />
          <span className="group-hover:text-[#D4A03A] transition-colors">Nexus Strategic Study</span>
          <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#D4A03A]/10 text-[#D4A03A]/60 border border-[#D4A03A]/15 group-hover:text-[#D4A03A]/80 group-hover:bg-[#D4A03A]/15 transition-colors">STRATEGY</span>
        </a>
      </div>

      {/* Marketing page link pill */}
      <div className="px-4 pt-1 pb-1">
        <a
          href="#/marketing"
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-white/[0.06]"
          style={{ border: '1px dashed rgba(0,194,124,0.25)', color: 'rgba(0,194,124,0.7)' }}
        >
          <Megaphone className="w-3.5 h-3.5 text-[#00C27C]/60 group-hover:text-[#00C27C] transition-colors" strokeWidth={2} />
          <span className="group-hover:text-[#00C27C] transition-colors">Nexus Marketing</span>
          <span className="ml-auto text-[10px] font-bold tracking-wider">&rarr;</span>
        </a>
      </div>

      {/* Marketing V2 page link pill */}
      <div className="px-4 pt-1 pb-1">
        <a
          href="#/marketing-v2"
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-white/[0.06]"
          style={{ border: '1px dashed rgba(0,194,124,0.25)', color: 'rgba(0,194,124,0.7)' }}
        >
          <Megaphone className="w-3.5 h-3.5 text-[#00C27C]/60 group-hover:text-[#00C27C] transition-colors" strokeWidth={2} />
          <span className="group-hover:text-[#00C27C] transition-colors">Marketing v2</span>
          <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#00C27C]/10 text-[#00C27C]/60 border border-[#00C27C]/15 group-hover:text-[#00C27C]/80 group-hover:bg-[#00C27C]/15 transition-colors">NEW</span>
        </a>
      </div>

      {/* Product Video link pill */}
      <div className="px-4 pt-1 pb-1">
        <a
          href="#/video"
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-white/[0.06]"
          style={{ border: '1px dashed rgba(212,160,58,0.25)', color: 'rgba(212,160,58,0.7)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4A03A]/60 group-hover:text-[#D4A03A] transition-colors" strokeWidth={2} />
          <span className="group-hover:text-[#D4A03A] transition-colors">Product Video</span>
          <span className="ml-auto text-[10px] font-bold tracking-wider">&rarr;</span>
        </a>
      </div>

      {/* Video V2 link pill */}
      <div className="px-4 pt-1 pb-1">
        <a
          href="#/video-v2"
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-white/[0.06]"
          style={{ border: '1px dashed rgba(212,160,58,0.25)', color: 'rgba(212,160,58,0.7)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4A03A]/60 group-hover:text-[#D4A03A] transition-colors" strokeWidth={2} />
          <span className="group-hover:text-[#D4A03A] transition-colors">Video v2</span>
          <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#D4A03A]/10 text-[#D4A03A]/60 border border-[#D4A03A]/15 group-hover:text-[#D4A03A]/80 group-hover:bg-[#D4A03A]/15 transition-colors">NEW</span>
        </a>
      </div>

      {/* Product Film (Video V3) link pill */}
      <div className="px-4 pt-1 pb-1">
        <a
          href="#/video-v3"
          className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-white/[0.06]"
          style={{ border: '1px dashed rgba(212,160,58,0.35)', color: 'rgba(212,160,58,0.8)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4A03A]/70 group-hover:text-[#D4A03A] transition-colors" strokeWidth={2} />
          <span className="group-hover:text-[#D4A03A] transition-colors">Product Film</span>
          <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#D4A03A]/15 text-[#D4A03A]/70 border border-[#D4A03A]/20 group-hover:text-[#D4A03A]/90 group-hover:bg-[#D4A03A]/20 transition-colors">GOLD</span>
        </a>
      </div>

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
