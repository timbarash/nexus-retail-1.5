import { useTheme } from '../contexts/ThemeContext';

export function useChartTheme() {
  const { isDark } = useTheme();
  return {
    grid: isDark ? '#38332B' : '#E5E2DC',
    tick: isDark ? '#6B6359' : '#8C8680',
    tooltipBg: isDark ? '#1C1B1A' : '#FFFFFF',
    tooltipBorder: isDark ? '#38332B' : '#E5E2DC',
    tooltipText: isDark ? '#F0EDE8' : '#1A1917',
  };
}
