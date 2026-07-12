/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#eab308', // primary golden yellow as seen in mockups
          dark: '#ca8a04',
          light: '#fef9c3',
        },
        navy: {
          DEFAULT: '#1e293b',
          dark: '#0f172a',
          light: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
