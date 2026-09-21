/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#faf9fe',
        darkbg: '#0a0518',
        surface: {
          50: '#ffffff',
          100: '#faf8fe',
          200: '#f4f0fb',
          300: '#ece5f7',
        },
        darksurface: {
          50: '#110a24',
          100: '#160d2e',
          200: '#1d123b',
          300: '#27174e',
        },
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#9333ea',
          600: '#7e22ce',
          700: '#6b21a8',
        },
        ambience: {
          light: '#fbf9fe',
          lavender: '#f3e8ff',
          purple: '#ede9fe',
          dark: '#0e081f',
        },
        accent: {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          rose: '#f43f5e',
          amber: '#f59e0b',
          emerald: '#10b981',
        },
      },
      boxShadow: {
        'purple-sm': '0 1px 3px 0 rgba(147, 51, 234, 0.05)',
        'purple-md': '0 4px 20px -2px rgba(147, 51, 234, 0.08), 0 2px 6px -2px rgba(147, 51, 234, 0.04)',
        'purple-lg': '0 12px 30px -4px rgba(147, 51, 234, 0.12), 0 4px 12px -4px rgba(147, 51, 234, 0.06)',
        'purple-glow': '0 0 35px rgba(192, 132, 252, 0.25)',
        'ambient-glow': '0 0 25px -4px rgba(168, 85, 247, 0.28)',
        'ambient-glow-lg': '0 0 45px -5px rgba(168, 85, 247, 0.42)',
        'ambient-glow-sm': '0 0 14px -2px rgba(168, 85, 247, 0.22)',
        'neon-glow': '0 0 20px rgba(192, 132, 252, 0.5), 0 0 40px rgba(147, 51, 234, 0.25)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
