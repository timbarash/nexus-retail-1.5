import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationDrawer({
  open, onConfirm, onCancel, title, description,
  details = [], confirmLabel = 'Confirm', confirmColor = 'var(--color-accent-green)',
  icon: Icon = AlertTriangle, warning,
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={onCancel}
      />
      <div className="fixed z-[91] bottom-0 left-0 right-0 sm:bottom-auto sm:top-[50%] sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-surface-card border border-surface-border shadow-2xl overflow-hidden animate-[slideUp_200ms_ease-out] sm:animate-[fadeIn_150ms_ease-out]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${confirmColor} 10%, transparent)` }}>
              <Icon size={18} style={{ color: confirmColor }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
              <p className="text-[11px] text-text-muted mt-0.5">{description}</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors">
            <X size={14} />
          </button>
        </div>

        {details.length > 0 && (
          <div className="mx-5 rounded-xl border border-surface-border bg-surface-bg divide-y divide-surface-divider">
            {details.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-text-muted">{d.label}</span>
                <span className="text-[12px] font-medium text-text-primary">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {warning && (
          <div className="mx-5 mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-accent-gold/[0.08] border border-accent-gold/[0.15]">
            <AlertTriangle size={12} className="text-accent-gold mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-accent-gold">{warning}</p>
          </div>
        )}

        <div className="flex items-center gap-3 p-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: confirmColor }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
