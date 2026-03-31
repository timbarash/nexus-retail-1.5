/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: {
          bg: 'var(--color-surface-bg)',
          card: 'var(--color-surface-card)',
          border: 'var(--color-surface-border)',
          hover: 'var(--color-surface-hover)',
          muted: 'var(--color-surface-muted)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          hover: 'var(--color-sidebar-hover)',
          border: 'var(--color-sidebar-border)',
        },
        accent: {
          green: 'var(--color-accent-green)',
          'green-light': 'var(--color-accent-green-light)',
          'green-bg': 'var(--color-accent-green-bg)',
          gold: 'var(--color-accent-gold)',
          blue: 'var(--color-accent-blue)',
          purple: 'var(--color-accent-purple)',
          red: 'var(--color-accent-red)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        dutchie: {
          50: 'var(--color-accent-green-bg)',
          100: 'rgba(0,194,124,0.10)',
          500: 'var(--color-accent-green)',
          600: '#00B07A',
          700: '#00996B',
        },
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.3)',
        'card': 'var(--shadow-card)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
        'sidebar': '2px 0 12px rgba(0,0,0,0.3)',
        'elevated': 'var(--shadow-elevated)',
        'lg': '0 4px 16px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: 0, transform: 'translateX(-16px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,194,124,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0,194,124,0)' },
        },
      },
    },
  },
  plugins: [],
};
