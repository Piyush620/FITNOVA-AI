/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0B',
        primary: '#00FF88',
        accent: '#FF6B00',
      },
    },
  },
  plugins: [],
}
