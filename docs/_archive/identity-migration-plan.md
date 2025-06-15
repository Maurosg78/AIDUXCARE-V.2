import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // === PALETA OFICIAL AIDUXCARE ===
        
        // Colores principales con nombres semánticos
        'aidux-blue-slate': '#2C3E50',
        'aidux-mint-green': '#A8E6CF', 
        'aidux-coral': '#FF6F61',
        'aidux-neutral-gray': '#BDC3C7',
        'aidux-bone-white': '#F7F7F7',
        'aidux-intersection-green': '#5DA5A3',
        
        // Paleta expandida AiDuxCare
        'aidux': {
          'blue-slate': {
            DEFAULT: '#2C3E50',
            light: '#34495E',
            dark: '#1B2631',
          },
          'mint-green': {
            DEFAULT: '#A8E6CF',
            light: '#C4F1DE',
            dark: '#8BDBB7',
          },
          'coral': {
            DEFAULT: '#FF6F61',
            light: '#FF8A7F',
            dark: '#E5574A',
          },
          'neutral-gray': {
            DEFAULT: '#BDC3C7',
            light: '#D5DBDF',
            dark: '#95A5A6',
          },
          'bone-white': '#F7F7F7',
          'pure-white': '#FFFFFF',
          'intersection-green': {
            DEFAULT: '#5DA5A3',
            light: '#7BB8B6',
            dark: '#4A8280',
          },
        },
        
        // Mapeo semántico para compatibilidad
        primary: {
          DEFAULT: '#2C3E50',  // Azul pizarra
          50: '#F4F6F7',
          100: '#E9ECEE',
          200: '#D4D9DC',
          300: '#BFC6CA',
          400: '#8FA0A8',
          500: '#2C3E50',
          600: '#273748',
          700: '#1E2A36',
          800: '#141C24',
          900: '#0A0E12',
          light: '#34495E',
          dark: '#1B2631',
        },
        secondary: {
          DEFAULT: '#A8E6CF',  // Verde menta
          50: '#F4FCF8',
          100: '#E9F9F1',
          200: '#D3F3E3',
          300: '#BCE6D5',
          400: '#A8E6CF',
          500: '#8BDBB7',
          600: '#6ED09F',
          700: '#51C587',
          800: '#34BA6F',
          900: '#17AF57',
          light: '#C4F1DE',
          dark: '#8BDBB7',
        },
        accent: {
          DEFAULT: '#FF6F61',  // Coral
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
          light: '#FF8A7F',
          dark: '#E5574A',
        },
        success: {
          DEFAULT: '#5DA5A3',  // Verde intersección para éxito
          light: '#7BB8B6',
          dark: '#4A8280',
        },
        warning: {
          DEFAULT: '#FF6F61',  // Coral para advertencias
          light: '#FF8A7F',
          dark: '#E5574A',
        },
        error: {
          DEFAULT: '#E5574A',  // Coral oscuro para errores
          light: '#FF6F61',
          dark: '#CB3F33',
        },
        info: {
          DEFAULT: '#2C3E50',  // Azul pizarra para información
          light: '#34495E',
          dark: '#1B2631',
        },
        
        // Neutros basados en la identidad
        neutral: {
          50: '#F8F9FA',
          100: '#F7F7F7',      // Blanco hueso
          200: '#D5DBDF',      // Gris neutro claro
          300: '#BDC3C7',      // Gris neutro
          400: '#95A5A6',      // Gris neutro oscuro
          500: '#7F8C8D',
          600: '#6C7B7D',
          700: '#566A6D',
          800: '#40595D',
          900: '#2A484D',
        },
        
        // Fondos y superficie
        background: {
          DEFAULT: '#F7F7F7',  // Blanco hueso
          light: '#FFFFFF',
          paper: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Work Sans', 'Lato', 'sans-serif'],
        heading: ['Work Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        '1': '0.25rem',  // 4px
        '2': '0.5rem',   // 8px
        '3': '0.75rem',  // 12px
        '4': '1rem',     // 16px
        '5': '1.25rem',  // 20px
        '6': '1.5rem',   // 24px
        '8': '2rem',     // 32px
        '10': '2.5rem',  // 40px
        '12': '3rem',    // 48px
        '16': '4rem',    // 64px
        '20': '5rem',    // 80px
        '24': '6rem',    // 96px
        '32': '8rem',    // 128px
      },
      borderRadius: {
        sm: '0.25rem',   // 4px
        DEFAULT: '0.5rem',  // 8px
        md: '0.75rem',   // 12px
        lg: '1rem',      // 16px
        xl: '1.5rem',    // 24px
        '2xl': '2rem',   // 32px
        '3xl': '3rem',   // 48px
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(44, 62, 80, 0.05)',
        DEFAULT: '0 1.5px 4px 0 rgba(44, 62, 80, 0.08)',
        md: '0 4px 8px 0 rgba(44, 62, 80, 0.10)',
        lg: '0 8px 24px 0 rgba(44, 62, 80, 0.12)',
        xl: '0 16px 48px 0 rgba(44, 62, 80, 0.14)',
        // Sombras específicas AiDuxCare
        clinical: '0 2px 8px 0 rgba(168, 230, 207, 0.15)',
        sidebar: '2px 0 8px 0 rgba(44, 62, 80, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config; 