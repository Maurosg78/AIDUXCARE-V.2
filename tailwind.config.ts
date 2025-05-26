import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial AiDuxCare
        'aidux-blue': {
          DEFAULT: '#0F172A',
          light: '#3B82F6',
          lighter: '#60A5FA',
        },
        'aidux-green': {
          DEFAULT: '#10B981',
          light: '#34D399',
        },
        'aidux-orange': {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        'aidux-red': {
          DEFAULT: '#EF4444',
          light: '#F87171',
        },
        // Colores semánticos
        primary: {
          DEFAULT: '#0F172A',
          light: '#3B82F6',
          lighter: '#60A5FA',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
        },
        // Neutros
        neutral: {
          50: '#F8FAFC',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#334155',
          600: '#1E293B',
          700: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Work Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '1': '0.25rem', // 4px
        '2': '0.5rem',  // 8px
        '3': '0.75rem', // 12px
        '4': '1rem',    // 16px
        '5': '1.25rem', // 20px
        '6': '1.5rem',  // 24px
        '8': '2rem',    // 32px
        '10': '2.5rem', // 40px
        '12': '3rem',   // 48px
        '16': '4rem',   // 64px
        '20': '5rem',   // 80px
        '24': '6rem',   // 96px
        '32': '8rem',   // 128px
      },
      borderRadius: {
        sm: '0.125rem', // 2px
        DEFAULT: '0.25rem', // 4px
        md: '0.375rem', // 6px
        lg: '0.5rem',   // 8px
        xl: '0.75rem',  // 12px
        '2xl': '1rem',  // 16px
        '3xl': '1.5rem',// 24px
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(16, 23, 42, 0.05)',
        DEFAULT: '0 1.5px 4px 0 rgba(16, 23, 42, 0.08)',
        md: '0 4px 8px 0 rgba(16, 23, 42, 0.10)',
        lg: '0 8px 24px 0 rgba(16, 23, 42, 0.12)',
        xl: '0 16px 48px 0 rgba(16, 23, 42, 0.14)',
      },
    },
  },
  plugins: [],
} satisfies Config; 