import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        accent: {
          DEFAULT: '#10b981',
          hover:   '#059669',
          light:   'var(--color-accent-light)',
          muted:   '#6ee7b7',
          'light-border': 'var(--color-accent-light-border)',
        },
        surface:  'var(--color-surface)',
        'hover-surface': 'var(--color-hover-surface)',
        'logs-alt-row':  'var(--color-logs-alt-row)',
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          disabled:  'var(--color-text-disabled)',
        },
        success: { DEFAULT: '#10b981', light: 'rgba(16, 185, 129, 0.1)' },
        warning: { DEFAULT: '#f59e0b', light: 'rgba(245, 158, 11, 0.1)' },
        error:   { DEFAULT: '#ef4444', light: 'rgba(239, 68, 68, 0.1)' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'SF Mono'", "'Fira Code'", "'Cascadia Code'", 'monospace'],
      },
      borderRadius: {
        sm:  '3px',
        md:  '6px',
        lg:  '8px',
      },
      boxShadow: {},
    },
  },
  plugins: [],
} satisfies Config
