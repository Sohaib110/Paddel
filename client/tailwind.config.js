/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        padel: {
          green: '#0099ff', // Replaced Lime with Brand Blue for instant recheck
          blue: '#0099ff', // Ocean Blue
          orange: '#ffaa00', // Solar Orange
          navy: '#0f172a', // Deep Navy
          primary: '#0099ff', // Brand Blue
          secondary: '#0f172a', // Navy
          accent: '#ffaa00', // Orange
        },
        light: {
          bg: '#ffffff',
          surface: '#f8fafc', // Slate 50
          elevated: '#ffffff',
          border: '#e2e8f0', // Slate 200
        },
        text: {
          primary: '#0f172a', // Slate 900
          secondary: '#475569', // Slate 600
          tertiary: '#94a3b8', // Slate 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'slow-zoom': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.1)' },
        }
      },
      animation: {
        'slow-zoom': 'slow-zoom 20s linear infinite alternate',
      }
    },
  },
  plugins: [],
}
