import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-surface-card rounded-lg shadow-lg border border-surface-border p-3 text-sm">
      <p className="font-semibold text-text-primary mb-1.5">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">Value</span>
          <span className="font-medium text-text-primary">{data.avg?.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export default function TrendChart({ data, height = 300 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-green)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-accent-green)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-divider)" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={8} />
        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dx={-4} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="avg" stroke="var(--color-accent-green)" strokeWidth={2.5} fill="url(#trendGradient)" dot={{ r: 3, fill: 'var(--color-accent-green)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'var(--color-accent-green)', stroke: 'var(--color-surface-bg)', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
