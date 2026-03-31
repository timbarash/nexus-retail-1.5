import React, { createContext, useContext, useState, useMemo } from 'react';

const DATE_RANGES = [
  { key: 'last_week', label: 'Last 7 Days', shortLabel: '7D', days: 7, multiplier: 7 / 30, trendScale: 1.5, rateOffset: -0.02, periodLabel: 'vs prior 7 days' },
  { key: 'last_month', label: 'Last 30 Days', shortLabel: '30D', days: 30, multiplier: 1, trendScale: 1, rateOffset: 0, periodLabel: 'vs prior 30 days' },
  { key: 'last_quarter', label: 'Last Quarter', shortLabel: 'QTR', days: 90, multiplier: 3, trendScale: 0.7, rateOffset: 0.01, periodLabel: 'vs prior quarter' },
  { key: 'last_year', label: 'Last Year', shortLabel: '1Y', days: 365, multiplier: 12, trendScale: 2, rateOffset: 0.02, periodLabel: 'vs prior year' },
];

const DateRangeContext = createContext(null);

export function DateRangeProvider({ children }) {
  const [selectedRange, setSelectedRange] = useState('last_month');

  const value = useMemo(() => {
    const range = DATE_RANGES.find(r => r.key === selectedRange) || DATE_RANGES[1];

    // Compute actual start/end dates for review filtering
    const endDate = new Date('2026-03-01'); // prototype "now"
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - range.days);

    return {
      selectedRange,
      rangeLabel: range.label,
      rangeShortLabel: range.shortLabel,
      ranges: DATE_RANGES,
      setRange: setSelectedRange,
      dateMultiplier: range.multiplier,
      trendScale: range.trendScale,    // scale trend delta magnitudes by period
      rateOffset: range.rateOffset,    // slight offset for avg basket / margin %
      periodLabel: range.periodLabel,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    };
  }, [selectedRange]);

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider');
  return ctx;
}
