/** @type {import('tailwindcss').Config} */
const designTokens = require('./src/styles/design-tokens.ts');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#667EEA',
        'primary-purple': '#764BA2',
        'primary-blue-hover': '#5A6FD8',
        'primary-purple-hover': '#6A4190',
        // Secondary colors
        'secondary-blue': '#8B9AFF',
        'secondary-purple': '#9B7BC2',
        'secondary-blue-hover': '#7A8AEF',
        'secondary-purple-hover': '#8B6BB2',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #5A6FD8 0%, #6A4190 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #8B9AFF 0%, #9B7BC2 100%)',
        'gradient-secondary-hover': 'linear-gradient(135deg, #7A8AEF 0%, #8B6BB2 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #667EEA 100%)',
        'gradient-success-hover': 'linear-gradient(135deg, #059669 0%, #5A6FD8 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #764BA2 100%)',
        'gradient-warning-hover': 'linear-gradient(135deg, #D97706 0%, #6A4190 100%)',
        'gradient-danger': 'linear-gradient(135deg, #EF4444 0%, #764BA2 100%)',
        'gradient-danger-hover': 'linear-gradient(135deg, #DC2626 0%, #6A4190 100%)',
        'gradient-info': 'linear-gradient(135deg, #06B6D4 0%, #667EEA 100%)',
        'gradient-info-hover': 'linear-gradient(135deg, #0891B2 0%, #5A6FD8 100%)',
        'gradient-logout': 'linear-gradient(135deg, #D946EF 0%, #764BA2 50%, #667EEA 100%)',
        'gradient-logout-hover': 'linear-gradient(135deg, #C026D3 0%, #6A4190 50%, #5A6FD8 100%)',
      },
      fontFamily: {
        apple: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': '56px',
        'large': '24px',
        'body-apple': '17px',
      },
      letterSpacing: {
        'tight': '-0.02em',
        'wide': '0.02em',
      },
    },
  },
  plugins: [],
}
