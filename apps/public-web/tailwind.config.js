/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Yigisoft brand green palette
        primary: {
          50: '#EFFBED',
          100: '#DFF7DB',
          200: '#BFEFB7',
          300: '#9FE793',
          400: '#76DC65',
          500: '#36CC1D',
          600: '#30B41A',
          700: '#299B16',
          800: '#238313',
          900: '#1B660E',
        },
      },
    },
  },
  plugins: [],
}
