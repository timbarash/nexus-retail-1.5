import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Sun, Moon, Monitor, ClipboardList } from 'lucide-react';
import StoreSelector from './StoreSelector';
import DateRangeSelector from './DateRangeSelector';
import ActionLogDrawer from '../common/ActionLogDrawer';
import NexusIcon from '../NexusIcon';
import { usePersona } from '../../contexts/PersonaContext';
import { useStores } from '../../contexts/StoreContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useActionLog } from '../../contexts/ActionLogContext';

function PersonaSwitcher() {
  const { personas, selectedPersona, setSelectedPersona } = usePersona();
  const { setStoresByPersona } = useStores();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (p) => {
    setSelectedPersona(p.id);
    setStoresByPersona(p);
    setOpen(false);
  };

  const Icon = selectedPersona.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-border hover:border-accent-gold/25 bg-surface-bg hover:bg-surface-hover transition-all"
      >
        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-accent-gold/[0.12]">
          <Icon className="w-3 h-3 text-accent-gold" />
        </div>
        <span className="text-xs font-medium text-text-primary hidden md:block">{selectedPersona.shortLabel}</span>
        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-surface-border bg-surface-card shadow-2xl z-50 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
          <div className="px-4 py-2.5 border-b border-surface-divider">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Switch Persona</p>
          </div>
          <div className="py-1">
            {personas.map(p => {
              const PIcon = p.icon;
              const isActive = p.id === selectedPersona.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-accent-gold/[0.08]'
                      : 'hover:bg-surface-hover'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-accent-gold/[0.15]' : 'bg-surface-hover'
                  }`}>
                    <PIcon className={`w-3.5 h-3.5 ${isActive ? 'text-accent-gold' : 'text-text-muted'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${isActive ? 'text-accent-gold' : 'text-text-primary'}`}>{p.label}</p>
                    <p className="text-[10px] text-text-muted">
                      {p.scope === 'portfolio' ? 'All 39 stores, 7 states'
                        : p.scope === 'region' ? `${p.storeFilter.states.join(', ')} — 23 stores`
                        : p.scope === 'state' ? `${p.defaultState} — 10 stores`
                        : p.defaultStore?.replace('Ascend ', '')}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  const label = theme === 'dark'
    ? 'Switch to light mode'
    : theme === 'light'
    ? 'Switch to classic mode'
    : 'Switch to dark mode';

  const icon = theme === 'dark'
    ? <Moon className="w-4 h-4" />
    : theme === 'light'
    ? <Sun className="w-4 h-4" />
    : <Monitor className="w-4 h-4" />;

  return (
    <button
      onClick={cycleTheme}
      className="p-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
      aria-label={label}
    >
      {icon}
    </button>
  );
}

export default function Header({ onMenuClick }) {
  const [actionLogOpen, setActionLogOpen] = useState(false);
  const { actions } = useActionLog();
  const { theme, cycleTheme } = useTheme();

  return (
    <>
      {/* Mobile top bar — minimal, only shows below lg */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface-card border-b border-surface-border sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <NexusIcon size={18} />
          <span className="text-sm font-semibold text-text-primary">nexus</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cycleTheme} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>
          <button onClick={() => setActionLogOpen(true)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors relative">
            <ClipboardList className="w-4 h-4" />
            {actions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-blue text-white text-[9px] font-bold flex items-center justify-center">
                {actions.length > 9 ? '9+' : actions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop header — hidden on mobile */}
      <header className="hidden lg:block sticky top-0 z-30 bg-surface-card/80 backdrop-blur-md border-b border-surface-divider">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left: hamburger (only shows below lg, but header itself is hidden below lg now) */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          {/* Right: persona + theme + date + store + action log */}
          <div className="flex items-center gap-2">
            <PersonaSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setActionLogOpen(true)}
              className="relative p-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
              aria-label="Action log"
            >
              <ClipboardList className="w-4 h-4" />
              {actions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-blue text-white text-[9px] font-bold flex items-center justify-center">
                  {actions.length > 9 ? '9+' : actions.length}
                </span>
              )}
            </button>
            <DateRangeSelector />
            <StoreSelector />
          </div>
        </div>
      </header>

      <ActionLogDrawer open={actionLogOpen} onClose={() => setActionLogOpen(false)} />
    </>
  );
}
