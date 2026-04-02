import { useNavigate } from 'react-router-dom';
import { Tag, Users, ShoppingCart, CircleDollarSign, Megaphone, Sparkles, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SECTIONS = [
  {
    title: 'Intelligence',
    items: [
      { label: 'Brand Performance', icon: Tag, path: '/brands' },
      { label: 'Customer Intelligence', icon: Users, path: '/customers' },
    ],
  },
  {
    title: 'AI Agents',
    items: [
      { label: 'Inventory Agent', icon: ShoppingCart, path: '/agents/connect' },
      { label: 'Pricing & Margins', icon: CircleDollarSign, path: '/agents/pricing' },
      { label: 'Growth Agent', icon: Megaphone, path: '/agents/marketing' },
    ],
  },
  {
    title: 'Other',
    items: [
      { label: 'Nexus Strategic Study', icon: Sparkles, path: '/study' },
    ],
  },
];

export default function MoreSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { cycleTheme, theme } = useTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface-card rounded-t-2xl border-t border-surface-border animate-[slideUp_200ms_ease-out]" style={{ maxHeight: '65vh', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-surface-border" />
        </div>
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
          <X className="w-4 h-4" />
        </button>
        {/* Content */}
        <div className="px-5 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(65vh - 60px)' }}>
          {SECTIONS.map(section => (
            <div key={section.title} className="mb-4">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left"
                  >
                    <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {/* Theme toggle row */}
          <div className="border-t border-surface-divider pt-3 mt-2">
            <button onClick={() => { cycleTheme(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left">
              <span className="text-sm">Theme: {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Parchment' : 'Classic'}</span>
              <span className="ml-auto text-xs text-text-muted">Tap to cycle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
