import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
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
        sans: ['Inter', 'Work Sans', 'Lato', 'sans-serif'],
        heading: ['Work Sans', 'Inter', 'sans-serif'],
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
        sm: '0 1px 2px 0 rgba(44, 62, 80, 0.05)',
        DEFAULT: '0 1.5px 4px 0 rgba(44, 62, 80, 0.08)',
        md: '0 4px 8px 0 rgba(44, 62, 80, 0.10)',
        lg: '0 8px 24px 0 rgba(44, 62, 80, 0.12)',
        xl: '0 16px 48px 0 rgba(44, 62, 80, 0.14)',
        // Sombras específicas para elementos médicos
        clinical: '0 2px 8px 0 rgba(168, 230, 207, 0.15)',
        sidebar: '2px 0 8px 0 rgba(44, 62, 80, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config; 