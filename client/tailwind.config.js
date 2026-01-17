/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary - Navy Blue (dari logo)
        primary: {
          50: '#eef4f9',
          100: '#d5e3f0',
          200: '#aec9e3',
          300: '#7ca8d0',
          400: '#5088bd',
          500: '#3269a3',
          600: '#1e3a5f', // Warna utama dari logo
          700: '#1a3250',
          800: '#152840',
          900: '#0f1d2d',
          950: '#0a1219',
        },
        // Secondary - Orange (dari logo)
        secondary: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdca8',
          300: '#ffc170',
          400: '#ffa033',
          500: '#f7941d', // Warna utama dari logo
          600: '#e87a0d',
          700: '#c15d0c',
          800: '#9a4912',
          900: '#7c3d12',
          950: '#431d07',
        },
        // Accent colors
        accent: {
          blue: '#1e3a5f',
          orange: '#f7941d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(247, 148, 29, 0.3)',
        'glow-blue': '0 0 20px rgba(30, 58, 95, 0.3)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f7941d 0%, #ffa033 100%)',
      }
    },
  },
  plugins: [],
}
