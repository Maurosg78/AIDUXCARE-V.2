import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slateBlue: '#2C3E50',
        mintGreen: '#A8E6CF',
        softCoral: '#FF6F61',
        neutralGray: '#BDC3C7',
        boneWhite: '#F7F7F7',
        intersectionGreen: '#5DA5A3',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config; 