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
        // Yigisoft brand green palette (Phase 2.4b)
        // Light mode uses vibrant greens, dark mode references softer shades
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
        // Accent colors optimized for theme-aware usage
        accent: {
          // Light mode: vibrant brand green
          DEFAULT: '#30B41A',
          light: '#36CC1D',
          // Softer variants for dark mode text/links
          soft: '#5DBF4D',
          muted: '#7AC96D',
          // Dark mode button colors (darker, more muted green)
          dark: '#2D8A22',           // Darker green for filled buttons in dark mode
          'dark-hover': '#359929',   // Slightly lighter on hover
          // Background tints
          tint: '#EFFBED',
          'tint-dark': 'rgba(91, 191, 77, 0.12)',
        },
      },
    },
  },
  plugins: [],
}
