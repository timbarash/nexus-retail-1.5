import { useTheme } from '../contexts/ThemeContext';

export function useChartTheme() {
  const { isDark, theme } = useTheme();
  const isClassic = theme === 'classic';

  if (isDark) {
    return {
      grid: '#38332B',
      tick: '#6B6359',
      tooltipBg: '#1C1B1A',
      tooltipBorder: '#38332B',
      tooltipText: '#F0EDE8',
    };
  }

  if (isClassic) {
    return {
      grid: '#E5E7EB',
      tick: '#6B7280',
      tooltipBg: '#FFFFFF',
      tooltipBorder: '#E5E7EB',
      tooltipText: '#111827',
    };
  }

  // Light (parchment) — darkened grid and tick for visibility on #EDE8DC / #F7F4EC
  return {
    grid: '#C5BEA6',
    tick: '#6E6555',
    tooltipBg: '#FDFCFA',
    tooltipBorder: '#C5BEA6',
    tooltipText: '#1A1918',
  };
}
