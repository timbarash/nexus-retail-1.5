import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, LayoutDashboard, MapPin, Star, Zap, ShoppingCart, DollarSign, Megaphone, Users, Package, Tag, Waypoints } from 'lucide-react';

const PAGES = [
  { label: 'Command Center', path: '/', icon: LayoutDashboard, group: 'Pages' },
  { label: 'Store Performance', path: '/locations', icon: MapPin, group: 'Pages' },
  { label: 'Inventory Analytics', path: '/inventory', icon: Package, group: 'Pages' },
  { label: 'Brand Performance', path: '/brands', icon: Tag, group: 'Pages' },
  { label: 'Customer Intelligence', path: '/customers', icon: Users, group: 'Pages' },
  { label: 'Inventory Agent', path: '/agents/connect', icon: ShoppingCart, group: 'AI Agents' },
  { label: 'Pricing & Margins', path: '/agents/pricing', icon: DollarSign, group: 'AI Agents' },
  { label: 'Marketing Campaigns', path: '/agents/marketing', icon: Megaphone, group: 'AI Agents' },
  { label: 'Dex', path: '/agents/bridge', icon: Waypoints, group: 'Support' },
];

export default function CommandPalette({ isOpen, onClose, navigate }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = query
    ? PAGES.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  const groups = {};
  filtered.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });
  const flatItems = Object.values(groups).flat();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[selectedIndex];
      if (item) selectItem(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [flatItems, selectedIndex, onClose]);

  const selectItem = (item) => {
    if (item.path) navigate(item.path);
    onClose();
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let itemIdx = 0;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-[81] top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl rounded-2xl bg-surface-card border border-surface-border shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
          <Search className="w-4 h-4 text-text-secondary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages or actions..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
          />
          <kbd className="text-[10px] text-text-muted bg-surface-bg border border-surface-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
          {flatItems.length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">No results found</p>
          )}
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName}>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-4 pt-3 pb-1">{groupName}</p>
              {items.map((item) => {
                const idx = itemIdx++;
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    data-index={idx}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      idx === selectedIndex
                        ? 'bg-accent-gold/10 text-text-primary'
                        : 'text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    <ArrowRight className={`w-3 h-3 transition-opacity ${idx === selectedIndex ? 'opacity-100 text-accent-gold' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
