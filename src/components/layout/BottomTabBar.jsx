import { useLocation, useNavigate } from 'react-router-dom';
import { Zap, MapPin, Package, MoreHorizontal } from 'lucide-react';
import NexusIcon from '../NexusIcon';
import { useAlerts } from '../../contexts/AlertContext';
import { useState } from 'react';
import MoreSheet from './MoreSheet';

const TABS = [
  { id: 'home', label: 'Home', icon: Zap, path: '/', match: (p) => p === '/' },
  { id: 'stores', label: 'Stores', icon: MapPin, path: '/locations', match: (p) => p === '/locations' },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory', match: (p) => p === '/inventory' },
  { id: 'dex', label: 'Dex', icon: null, path: '/agents/bridge', match: (p) => p.startsWith('/agents/bridge') },
  { id: 'more', label: 'More', icon: MoreHorizontal, path: null, match: () => false },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useAlerts();
  const [moreOpen, setMoreOpen] = useState(false);

  // Check if current path is in "more" territory
  const isMoreActive = ['/brands', '/customers', '/agents/connect', '/agents/pricing', '/agents/marketing', '/study'].some(p => location.pathname.startsWith(p));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-surface-card/95 backdrop-blur-xl border-t border-surface-border">
          <div className="flex justify-around items-center h-14">
            {TABS.map(tab => {
              const isActive = tab.id === 'more' ? isMoreActive : tab.match(location.pathname);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'more') {
                      setMoreOpen(true);
                    } else {
                      navigate(tab.path);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 w-full h-full relative transition-colors ${isActive ? 'text-accent-green' : 'text-text-muted'}`}
                >
                  {/* Badge for Home tab */}
                  {tab.id === 'home' && unreadCount > 0 && (
                    <span className="absolute top-1.5 left-1/2 ml-2 w-4 h-4 rounded-full bg-accent-red text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
                  )}
                  {/* Dex uses NexusIcon */}
                  {tab.id === 'dex' ? (
                    <NexusIcon size={20} variant={isActive ? 'gold' : 'outlined'} />
                  ) : (
                    <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.6} />
                  )}
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {/* More dot when active */}
                  {tab.id === 'more' && isMoreActive && (
                    <span className="absolute top-1.5 left-1/2 ml-2 w-1.5 h-1.5 rounded-full bg-accent-green" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
