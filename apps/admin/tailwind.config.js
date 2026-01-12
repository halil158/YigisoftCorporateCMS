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
        // These provide softer alternatives for dark mode
        accent: {
          // Light mode: vibrant brand green
          DEFAULT: '#30B41A',
          light: '#36CC1D',
          // Softer variants for dark mode (reduced saturation)
          soft: '#5DBF4D',      // Lighter, less saturated for dark mode buttons
          muted: '#7AC96D',     // Even softer for dark mode text
          // Background tints
          tint: '#EFFBED',          // Light mode bg tint
          'tint-dark': 'rgba(91, 191, 77, 0.12)', // Dark mode bg tint (soft green at 12% opacity)
        },
      },
    },
  },
  plugins: [],
}
