/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb5ff',
          400: '#598dff',
          500: '#336cff',
          600: '#1a4fef',
          700: '#143dd1',
          800: '#1635a8',
          900: '#193284',
        },
        steel: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d8e0',
          300: '#aeb6c4',
          400: '#818c9f',
          500: '#647082',
          600: '#4f5970',
          700: '#414a5c',
          800: '#39404f',
          900: '#21262e',
          950: '#161a20',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.05), 0 4px 16px rgba(15, 23, 42, 0.07)',
        lift: '0 8px 24px rgba(15, 23, 42, 0.12)',
        glow: '0 0 20px rgba(26, 79, 239, 0.15)',
      },
    },
  },
  plugins: [],
};
