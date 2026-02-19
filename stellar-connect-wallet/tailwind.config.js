/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kosh: {
          bg: '#1a1210',
          surface: '#241e1b',
          card: '#2a2320',
          border: '#3d3330',
          hover: '#352d29',
          text: '#e8ddd5',
          muted: '#9a8b80',
          accent: '#c9a96e',
          green: '#4ade80',
          red: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

