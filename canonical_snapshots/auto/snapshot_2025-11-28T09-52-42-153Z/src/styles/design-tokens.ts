// Apple-Inspired Design Tokens for AiduxCare
// Professional medical software design system

export const DESIGN_TOKENS = {
  colors: {
    primary: {
      // Apple-inspired gradient (MacBook Pro style)
      gradient: {
        start: '#667EEA', // Soft periwinkle blue
        end: '#764BA2',   // Muted purple
      },
      // Solid colors extracted from gradient
      blue: '#667EEA',
      purple: '#764BA2',
      // Hover states (slightly darker)
      gradientHover: {
        start: '#5A6FD8',
        end: '#6A4190',
      },
      // Light variants for backgrounds
      light: 'rgba(102, 126, 234, 0.1)',
      ultralight: 'rgba(102, 126, 234, 0.05)',
    },
    // Secondary gradient (lighter, for secondary actions)
    secondary: {
      gradient: {
        start: '#8B9AFF', // Lighter blue
        end: '#9B7BC2',   // Lighter purple
      },
      gradientHover: {
        start: '#7A8AEF',
        end: '#8B6BB2',
      },
    },
    // Success gradient (green-blue, for positive actions)
    success: {
      gradient: {
        start: '#10B981', // Emerald
        end: '#667EEA',   // Primary blue
      },
      gradientHover: {
        start: '#059669',
        end: '#5A6FD8',
      },
    },
    // Warning gradient (amber-purple, for warnings)
    warning: {
      gradient: {
        start: '#F59E0B', // Amber
        end: '#764BA2',   // Primary purple
      },
      gradientHover: {
        start: '#D97706',
        end: '#6A4190',
      },
    },
    // Danger gradient (red-purple, for destructive actions)
    danger: {
      gradient: {
        start: '#EF4444', // Red
        end: '#764BA2',   // Primary purple
      },
      gradientHover: {
        start: '#DC2626',
        end: '#6A4190',
      },
    },
    // Info gradient (cyan-blue, for informational actions)
    info: {
      gradient: {
        start: '#06B6D4', // Cyan
        end: '#667EEA',   // Primary blue
      },
      gradientHover: {
        start: '#0891B2',
        end: '#5A6FD8',
      },
    },
    // Logout gradient (intense fuchsia-purple-blue)
    logout: {
      gradient: {
        start: '#D946EF', // Fuchsia
        mid: '#764BA2',   // Purple
        end: '#667EEA',   // Blue
      },
      gradientHover: {
        start: '#C026D3',
        mid: '#6A4190',
        end: '#5A6FD8',
      },
    },
    text: {
      primary: '#1D1D1F',    // Apple's text black
      secondary: '#6B7280',  // Gray-500
      tertiary: '#9CA3AF',   // Gray-400
    },
    background: {
      white: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
    },
  },
  typography: {
    fontFamily: {
      apple: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', system-ui, sans-serif`,
    },
    fontSize: {
      hero: '56px',      // Main headlines
      large: '24px',     // Subheadings
      body: '17px',      // Body text (Apple's preferred)
      caption: '13px',   // Small text
    },
    fontWeight: {
      thin: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      heavy: 800,
    },
    letterSpacing: {
      tight: '-0.02em',   // For large text
      normal: '0',        // For body text
      wide: '0.02em',     // For small caps
    },
    lineHeight: {
      tight: '1.1',       // Headlines
      normal: '1.3',      // Subheadings
      relaxed: '1.5',     // Body text
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '80px',
    '5xl': '120px',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
} as const;

// CSS Custom Properties for easy use
export const CSS_VARIABLES = {
  '--gradient-primary': `linear-gradient(135deg, ${DESIGN_TOKENS.colors.primary.gradient.start} 0%, ${DESIGN_TOKENS.colors.primary.gradient.end} 100%)`,
  '--gradient-primary-hover': `linear-gradient(135deg, ${DESIGN_TOKENS.colors.primary.gradientHover.start} 0%, ${DESIGN_TOKENS.colors.primary.gradientHover.end} 100%)`,
  '--gradient-secondary': `linear-gradient(135deg, ${DESIGN_TOKENS.colors.secondary.gradient.start} 0%, ${DESIGN_TOKENS.colors.secondary.gradient.end} 100%)`,
  '--gradient-success': `linear-gradient(135deg, ${DESIGN_TOKENS.colors.success.gradient.start} 0%, ${DESIGN_TOKENS.colors.success.gradient.end} 100%)`,
  '--gradient-warning': `linear-gradient(135deg, ${DESIGN_TOKENS.colors.warning.gradient.start} 0%, ${DESIGN_TOKENS.colors.warning.gradient.end} 100%)`,
  '--gradient-danger': `linear-gradient(135deg, ${DESIGN_TOKENS.colors.danger.gradient.start} 0%, ${DESIGN_TOKENS.colors.danger.gradient.end} 100%)`,
  '--gradient-info': `linear-gradient(135deg, ${DESIGN_TOKENS.colors.info.gradient.start} 0%, ${DESIGN_TOKENS.colors.info.gradient.end} 100%)`,
  '--gradient-logout': `linear-gradient(135deg, ${DESIGN_TOKENS.colors.logout.gradient.start} 0%, ${DESIGN_TOKENS.colors.logout.gradient.mid} 50%, ${DESIGN_TOKENS.colors.logout.gradient.end} 100%)`,
  '--font-apple': DESIGN_TOKENS.typography.fontFamily.apple,
  '--color-primary': DESIGN_TOKENS.colors.primary.blue,
  '--color-secondary': DESIGN_TOKENS.colors.primary.purple,
  '--color-text-primary': DESIGN_TOKENS.colors.text.primary,
  '--color-text-secondary': DESIGN_TOKENS.colors.text.secondary,
} as const;
