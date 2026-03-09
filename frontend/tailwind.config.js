/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Botivate brand blue — matches the royal blue in the logo
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1d6bf8',   // core brand blue (logo color)
          700: '#1558d6',
          800: '#1447b0',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        'brand-sm': '0 2px 8px rgba(29,107,248,0.15)',
        'brand':    '0 4px 16px rgba(29,107,248,0.25)',
        'brand-lg': '0 8px 32px rgba(29,107,248,0.30)',
      },
    },
  },
  plugins: [],
};
