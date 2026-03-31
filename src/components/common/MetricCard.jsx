import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLOR_VAR = {
  dutchie: 'var(--color-accent-green)',
  blue: 'var(--color-accent-blue)',
  purple: 'var(--color-accent-purple)',
  amber: 'var(--color-accent-gold)',
  red: 'var(--color-accent-red)',
};

function Sparkline({ data, color = 'var(--color-accent-green)', width = 64, height = 24 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MetricCard({
  title, value, subtitle, icon: Icon, trend, trendLabel,
  color = 'dutchie', sparkline, borderAccent, benchmark, benchmarkLabel,
  style,
}) {
  const cssVar = COLOR_VAR[color] || COLOR_VAR.dutchie;
  const trendPositive = typeof trend === 'number' && trend >= 0;

  return (
    <div
      className={`bg-surface-card rounded-xl border border-surface-border p-4 hover:brightness-105 transition-all duration-200 cursor-default ${borderAccent ? 'border-l-[3px]' : ''}`}
      style={{
        ...(borderAccent ? { borderLeftColor: cssVar } : {}),
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        {Icon && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${cssVar} 10%, transparent)` }}
          >
            <Icon className="h-4 w-4" style={{ color: cssVar }} />
          </div>
        )}
        {sparkline ? (
          <Sparkline data={sparkline} color={cssVar} />
        ) : (
          !Icon && <div />
        )}
      </div>

      <p className="text-xl font-bold text-text-primary">{value}</p>

      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-text-secondary">{title}</p>
        {typeof trend === 'number' && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendPositive ? 'text-accent-green' : 'text-accent-red'}`}>
            {trendPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trendPositive ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>

      {benchmark && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-border/40">
          <span className="text-[12px] text-text-secondary">{benchmarkLabel || 'Avg'}: {benchmark}</span>
          {typeof trend === 'number' && (
            <span
              className="text-[12px] font-semibold px-1.5 py-0.5 rounded"
              style={{ color: trendPositive ? 'var(--color-accent-green)' : 'var(--color-accent-red)', background: trendPositive ? 'color-mix(in srgb, var(--color-accent-green) 7%, transparent)' : 'color-mix(in srgb, var(--color-accent-red) 7%, transparent)' }}
            >
              {trendPositive ? 'Above' : 'Below'}
            </span>
          )}
        </div>
      )}

      {subtitle && !benchmark && (
        <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
      )}
    </div>
  );
}
