/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        recPurple: '#512D6D', // Deep Institutional Purple
        recGold: '#F3B411',   // Academic Gold Accent
        recDark: '#2D1B3D',   // Rich Dark Purple for contrast
      },
    },
  },
  plugins: [],
}