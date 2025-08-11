import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  // Optimizaciones para producción
  future: {
    hoverOnlyWhenSupported: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
  theme: {
    extend: {
      colors: {
        // Tokens CSS mapeados
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-secondary)',
          dark: 'var(--color-text)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          light: 'var(--color-text-secondary)',
          dark: 'var(--color-text)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        background: {
          DEFAULT: 'var(--color-background)',
          surface: 'var(--color-surface)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
        },

        // Colores estándar de Tailwind para gradientes y efectos visuales
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },

        // Paleta oficial AiDuxCare según guía de identidad visual
        'aidux': {
          // Azul pizarra - Tipografía principal, íconos activos, fondo sidebar
          'blue-slate': '#2C3E50',
          // Verde menta suave - Ficha clínica, campos de salud, tarjetas de datos
          'mint-green': '#A8E6CF',
          // Coral suave - Botones activos, alertas leves, indicadores visibles
          'coral': '#FF6F61',
          // Gris neutro claro - Bordes, campos deshabilitados, textos secundarios
          'neutral-gray': '#BDC3C7',
          // Blanco hueso - Fondo general de la interfaz
          'bone-white': '#F7F7F7',
          // Verde intersección - Color simbólico de unión entre los tres pilares
          'intersection-green': '#5DA5A3',
        },
        // Colores semánticos basados en la identidad AiDuxCare
        primary: {
          DEFAULT: '#2C3E50', // Azul pizarra
          light: '#34495E',
          dark: '#1B2631',
          50: '#EBF0F2',
          100: '#D6E1E6',
          200: '#ACC3CD',
          300: '#83A5B4',
          400: '#5A879B',
          500: '#2C3E50',
          600: '#243240',
          700: '#1B2631',
          800: '#121A21',
          900: '#090D11',
        },
        secondary: {
          DEFAULT: '#A8E6CF', // Verde menta suave
          light: '#C4F1DE',
          dark: '#8BDBB7',
          50: '#F4FDF8',
          100: '#E9FBF1',
          200: '#D3F7E3',
          300: '#BCE3D5',
          400: '#A8E6CF',
          500: '#8BDBB7',
          600: '#6ED09F',
          700: '#51C587',
          800: '#34BA6F',
          900: '#17AF57',
        },
        accent: {
          DEFAULT: '#FF6F61', // Coral suave
          light: '#FF8A7F',
          dark: '#E5574A',
          50: '#FFF5F4',
          100: '#FFEBE9',
          200: '#FFD7D3',
          300: '#FFC3BD',
          400: '#FFAFA7',
          500: '#FF6F61',
          600: '#E5574A',
          700: '#CB3F33',
          800: '#B1271C',
          900: '#970F05',
        },
        neutral: {
          DEFAULT: '#BDC3C7', // Gris neutro claro
          light: '#D5DBDF',
          dark: '#95A5A6',
          50: '#F8F9FA',
          100: '#ECF0F1',
          200: '#D5DBDF',
          300: '#BDC3C7',
          400: '#95A5A6',
          500: '#7F8C8D',
          600: '#6C7B7D',
          700: '#566A6D',
          800: '#40595D',
          900: '#2A484D',
        },
        background: {
          DEFAULT: '#F7F7F7', // Blanco hueso
          light: '#FFFFFF',
          dark: '#EEEEEE',
        },
        intersection: {
          DEFAULT: '#5DA5A3', // Verde intersección
          light: '#7BB8B6',
          dark: '#4A8280',
          50: '#F0F9F8',
          100: '#E1F3F2',
          200: '#C3E7E5',
          300: '#A5DBD8',
          400: '#87CFCB',
          500: '#5DA5A3',
          600: '#4A8280',
          700: '#375F5D',
          800: '#243C3A',
          900: '#111917',
        },
        // Estados semánticos usando la paleta AiDuxCare
        success: {
          DEFAULT: '#5DA5A3', // Verde intersección para éxito
          light: '#7BB8B6',
          dark: '#4A8280',
        },
        warning: {
          DEFAULT: '#FF6F61', // Coral para advertencias
          light: '#FF8A7F',
          dark: '#E5574A',
        },
        error: {
          DEFAULT: '#FF6F61', // Coral para errores (misma base, diferentes intensidades)
          light: '#FF8A7F',
          dark: '#E5574A',
        },
        info: {
          DEFAULT: '#2C3E50', // Azul pizarra para información
          light: '#34495E',
          dark: '#1B2631',
        },
      },
      fontFamily: {
        sans: ['var(--font-family-base)', 'Inter', 'Work Sans', 'Lato', 'sans-serif'],
        heading: ['var(--font-family-base)', 'Work Sans', 'Inter', 'sans-serif'],
        mono: ['var(--font-family-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },
      fontWeight: {
        light: 'var(--font-weight-light)',
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      lineHeight: {
        tight: 'var(--line-height-tight)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
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
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
        '3xl': '1.5rem',// 24px
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        // Sombras específicas para elementos médicos
        clinical: '0 2px 8px 0 rgba(168, 230, 207, 0.15)',
        sidebar: '2px 0 8px 0 rgba(44, 62, 80, 0.08)',
      },
      backgroundImage: {
        'gradient-accent': 'var(--color-accent)',
        'gradient-to-r': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'gradient-to-l': 'linear-gradient(to left, var(--tw-gradient-stops))',
        'gradient-to-t': 'linear-gradient(to top, var(--tw-gradient-stops))',
        'gradient-to-b': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
        'gradient-to-tr': 'linear-gradient(to top right, var(--tw-gradient-stops))',
        'gradient-to-tl': 'linear-gradient(to top left, var(--tw-gradient-stops))',
        'gradient-to-br': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'gradient-to-bl': 'linear-gradient(to bottom left, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
      },
    },
  },
  plugins: [],
} satisfies Config; 