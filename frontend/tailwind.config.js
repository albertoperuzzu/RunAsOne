/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
        colors: {
        primary: '#0A2342',     // blu scuro
        secondary: '#74C0FC',   // celeste chiaro
        neutral: '#FFFFFF',     // bianco
      },
    },
  },
  plugins: [],
}