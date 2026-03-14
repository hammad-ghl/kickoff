/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Google Sans', 'Roboto', 'ui-sans-serif', 'system-ui'],
        mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Use CSS variables for colors
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
        brand: 'var(--color-brand-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      backgroundColor: {
        primary: 'var(--color-bg-primary)',
        secondary: 'var(--color-bg-secondary)',
        tertiary: 'var(--color-bg-tertiary)',
        hover: 'var(--color-bg-hover)',
      },
      borderColor: {
        primary: 'var(--color-border-primary)',
        secondary: 'var(--color-border-secondary)',
        tertiary: 'var(--color-border-tertiary)',
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
    },
  },
  plugins: [],
}
