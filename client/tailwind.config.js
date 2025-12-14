/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        motion: {
          purple: '#5F0589',
          deepPurple: '#301071',
          lilac: '#D5B2FF',
          lavender: '#E9DDFF',
          orange: '#EC6504',
          warmWhite: '#F9F6FF',
          yellow: '#FFD446',
          yellowShadow: '#F2C321',
          gold: '#FFC531',
          plum: '#1E1338',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        card: '0 40px 80px rgba(24, 9, 46, 0.18)',
        input: '0 10px 14px rgba(26, 7, 46, 0.08)',
        button: '0 18px 32px rgba(255, 149, 45, 0.35)',
      },
    },
  },
  plugins: [],
}
