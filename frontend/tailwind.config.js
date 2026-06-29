/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a2744',
          light:   '#243352',
          dark:    '#111b30',
        },
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          DEFAULT: '#10b981',
          light:   '#d1fae5',
          dark:    '#047857',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          DEFAULT: '#f59e0b',
          light:   '#fef3c7',
          dark:    '#d97706',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          DEFAULT: '#ef4444',
          light:   '#fee2e2',
          dark:    '#dc2626',
        },
        purple: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          DEFAULT: '#8b5cf6',
          light:   '#ede9fe',
          dark:    '#7c3aed',
        },
        surface: {
          bg:     '#f0f4f8',   /* exact match to original */
          card:   '#ffffff',
          border: '#e2e8f0',
        },
        txt: {
          primary: '#1e293b',
          muted:   '#64748b',
          light:   '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.25s ease-out both',
        'kpi-flash': 'kpiFlash 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        kpiFlash: {
          '0%':   { backgroundColor: '#fefce8' },
          '100%': { backgroundColor: '#ffffff' },
        },
      },
    },
  },
  plugins: [],
};
