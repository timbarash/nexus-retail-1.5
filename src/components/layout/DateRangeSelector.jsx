import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useDateRange } from '../../contexts/DateRangeContext';

export default function DateRangeSelector() {
  const { selectedRange, rangeLabel, ranges, setRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover transition-colors text-sm"
      >
        <Calendar className="w-4 h-4 text-accent-green" />
        <span className="text-text-primary font-medium hidden sm:inline">{rangeLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-surface-border bg-surface-card shadow-xl overflow-hidden z-50">
          <div className="p-1.5">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => { setRange(r.key); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedRange === r.key
                    ? 'bg-accent-green/[0.08] text-accent-green font-medium'
                    : 'text-text-primary hover:bg-surface-hover'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
