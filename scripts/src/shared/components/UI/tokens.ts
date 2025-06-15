/**
 * AiDuxCare Design Tokens
 * Basado en las especificaciones oficiales de los wireframes aprobados
 * Principios de "Claridad Clínica" aplicados
 */

// === PALETA DE COLORES OFICIAL ===
export const colors = {
  // Colores Primarios
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE', 
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Azul Primario Principal
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF', // Azul Oscuro (Logo)
    900: '#1E3A8A',
  },

  // Verde Éxito (CTA y elementos positivos)
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Verde Principal
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Púrpura Seguridad
  purple: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED', // Púrpura Principal
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Escala de Grises
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280', // Gris Medio
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827', // Gris Oscuro
  },

  // Colores de Estado
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Colores Semánticos
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// === TIPOGRAFÍA ===
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  },
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '36px',
    '5xl': '40px',
    '6xl': '48px',
    '7xl': '52px',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.1',
    normal: '1.4',
    relaxed: '1.6',
  },
} as const;

// === ESPACIADO ===
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const;

// === BORDES ===
export const borderRadius = {
  none: '0px',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

// === SOMBRAS ===
export const boxShadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  cta: '0 8px 24px rgba(16, 185, 129, 0.3)', // Sombra específica para CTA
  primary: '0 8px 24px rgba(59, 130, 246, 0.3)', // Sombra específica para botones primarios
} as const;

// === BREAKPOINTS ===
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// === TRANSICIONES ===
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
} as const;

// === UTILIDADES DE COLORES SEMÁNTICOS ===
export const semanticColors = {
  // Textos
  textPrimary: colors.gray[900],
  textSecondary: colors.gray[500],
  textTertiary: colors.gray[400],
  textInverse: colors.white,

  // Fondos
  backgroundPrimary: colors.white,
  backgroundSecondary: colors.gray[50],
  backgroundTertiary: colors.gray[100],

  // Bordes
  borderPrimary: colors.gray[200],
  borderSecondary: colors.gray[300],

  // Estados clínicos
  clinicalImproved: colors.success[500],
  clinicalStable: colors.warning[500],
  clinicalWorsened: colors.error[500],
  clinicalNeutral: colors.gray[400],

  // Niveles de riesgo
  riskLow: colors.success[500],
  riskMedium: colors.warning[500],
  riskHigh: colors.error[500],
} as const; 