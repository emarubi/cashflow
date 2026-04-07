/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1f2e',
        'sidebar-hover': '#242938',
        'sidebar-active': '#2563eb',
        'sidebar-icon': '#6b7280',
      },
    },
  },
  plugins: [],
}
