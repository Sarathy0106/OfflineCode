/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        portalNavy: {
          900: '#12182B',
          850: '#161F38',
          800: '#1A2451',
          700: '#2B3B82',
          600: '#384B9E',
        },
        portalGold: {
          400: '#FFBE4B',
          500: '#F5A623',
          600: '#E69500',
          700: '#C77F00',
        },
        portalIce: {
          50: '#F8FAFD',
          100: '#F4F8FD',
          200: '#EEF3FA',
          300: '#E2EAF5',
          400: '#D0DCED',
        }
      }
    },
  },
  plugins: [],
}
