/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'hack-primary': '#6366f1',
        'hack-danger': '#ef4444',
        'hack-success': '#22c55e',
      },
    },
  },
  plugins: [],
};
