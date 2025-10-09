/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Scan all JS, JSX, TS, and TSX files in the src directory
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}