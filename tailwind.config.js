/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 IDENTIDAD VISUAL OFICIAL AIDUXCARE
        // Paleta de Colores Definitiva según Documento del CEO
        'azul-pizarra': '#2C3E50',
        'verde-menta-suave': '#A8E6CF',
        'coral-suave': '#FF6F61',
        'gris-neutro-claro': '#BDC3C7',
        'blanco-hueso': '#F7F7F7',
        'verde-interseccion': '#5DA5A3',
        
        // Aliases sistemáticos para componentes
        'aidux': {
          'primary': '#2C3E50',        // azul-pizarra (texto principal)
          'accent': '#FF6F61',         // coral-suave (CTAs principales)
          'success': '#A8E6CF',        // verde-menta-suave (success states)
          'secondary': '#5DA5A3',      // verde-interseccion (elementos secundarios)
          'neutral': '#BDC3C7',        // gris-neutro-claro (bordes/divisores)
          'background': '#F7F7F7',     // blanco-hueso (fondos)
          'text-secondary': '#6B7280', // Para textos secundarios
        },
        
        // Grises del Sistema (Conservados para funcionalidad técnica)
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6', 
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        // Tipografía Oficial: Inter como primera opción
        'sans': ['Inter', 'Work Sans', 'Lato', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'aidux': ['Inter', 'Work Sans', 'Lato', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'aidux-xs': ['0.75rem', { lineHeight: '1rem' }],
        'aidux-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'aidux-base': ['1rem', { lineHeight: '1.5rem' }],
        'aidux-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'aidux-xl': ['1.25rem', { lineHeight: '1.75rem' }],
        'aidux-2xl': ['1.5rem', { lineHeight: '2rem' }],
        'aidux-3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        'aidux-4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        'aidux-5xl': ['3rem', { lineHeight: '1' }],
        'aidux-6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        'aidux-xs': '0.25rem',   // 4px
        'aidux-sm': '0.5rem',    // 8px
        'aidux-md': '1rem',      // 16px
        'aidux-lg': '1.5rem',    // 24px
        'aidux-xl': '2rem',      // 32px
        'aidux-2xl': '3rem',     // 48px
        'aidux-3xl': '4rem',     // 64px
      },
      borderRadius: {
        'aidux-sm': '0.375rem',  // 6px
        'aidux': '0.5rem',       // 8px
        'aidux-md': '0.75rem',   // 12px
        'aidux-lg': '1rem',      // 16px
        'aidux-xl': '1.5rem',    // 24px
        'aidux-2xl': '2rem',     // 32px
      },
      boxShadow: {
        'aidux-soft': '0 2px 8px -2px rgba(44, 62, 80, 0.1)',
        'aidux-medium': '0 4px 16px -4px rgba(44, 62, 80, 0.15)',
        'aidux-strong': '0 8px 32px -8px rgba(44, 62, 80, 0.2)',
        'aidux-glow': '0 0 20px rgba(255, 111, 97, 0.15)',
      },
      animation: {
        'aidux-fade-in': 'aiduxFadeIn 0.3s ease-out',
        'aidux-slide-up': 'aiduxSlideUp 0.3s ease-out',
        'aidux-scale': 'aiduxScale 0.2s ease-out',
      },
      keyframes: {
        aiduxFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        aiduxSlideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        aiduxScale: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 