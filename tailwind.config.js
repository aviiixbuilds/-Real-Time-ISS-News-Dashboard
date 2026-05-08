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
        accent: {
          light: '#e07060',
          DEFAULT: '#e07060',
          dark: '#c55a4c',
        },
        navy: {
          900: '#0a0e17',
          800: '#121926',
          700: '#1d2636',
        }
      },
    },
  },
  plugins: [],
}
