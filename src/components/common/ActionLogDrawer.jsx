import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ClipboardList, CheckCircle2, ShoppingCart, DollarSign, Send, Sparkles } from 'lucide-react';
import { useActionLog } from '../../contexts/ActionLogContext';

const ICON_MAP = {
  purchase_order: ShoppingCart,
  price_change: DollarSign,
  campaign: Send,
};

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STATUS_STYLES = {
  completed: { label: 'Completed', color: 'var(--color-accent-green)', bg: 'color-mix(in srgb, var(--color-accent-green) 12%, transparent)' },
  pending: { label: 'Pending', color: 'var(--color-accent-gold)', bg: 'color-mix(in srgb, var(--color-accent-gold) 12%, transparent)' },
  failed: { label: 'Failed', color: 'var(--color-accent-red)', bg: 'color-mix(in srgb, var(--color-accent-red) 12%, transparent)' },
};

export default function ActionLogDrawer({ open, onClose }) {
  const { actions } = useActionLog();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
      />
      <div className="fixed z-[91] top-0 right-0 bottom-0 w-full sm:max-w-md bg-surface-card border-l border-surface-border shadow-2xl flex flex-col animate-[slideInRight_200ms_ease-out]"
        style={{ animation: 'slideInRight 200ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-divider">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent-blue) 10%, transparent)' }}>
              <ClipboardList size={18} style={{ color: 'var(--color-accent-blue)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Action Log</h3>
              <p className="text-[11px] text-text-muted">{actions.length} action{actions.length !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--color-text-muted) 8%, transparent)' }}>
                <ClipboardList className="w-7 h-7 text-text-muted" />
              </div>
              <p className="text-sm font-medium text-text-secondary mb-1">No actions yet</p>
              <p className="text-xs text-text-muted max-w-[240px]">
                Agent recommendations you approve will appear here.
              </p>
            </div>
          ) : (
            actions.map((action) => {
              const ActionIcon = ICON_MAP[action.type] || Sparkles;
              const status = STATUS_STYLES[action.status] || STATUS_STYLES.completed;
              return (
                <div key={action.id} className="rounded-xl border border-surface-border bg-surface-bg p-4 transition-colors hover:bg-surface-hover">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: status.bg }}>
                      <ActionIcon size={16} style={{ color: status.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-text-primary truncate">{action.description}</p>
                        <span className="text-[10px] text-text-muted whitespace-nowrap">{timeAgo(action.timestamp)}</span>
                      </div>
                      {action.detail && (
                        <p className="text-[11px] text-text-secondary mt-0.5">{action.detail}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-text-muted">{action.agent}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: status.bg, color: status.color }}>
                          <CheckCircle2 size={10} />
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>,
    document.body
  );
}
