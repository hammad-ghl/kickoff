/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: "hsl(240 3.7% 15.9%)",
        input: "hsl(240 3.7% 15.9%)",
        ring: "hsl(263.4 70% 50.4%)",
        background: "hsl(240 10% 3.9%)",
        foreground: "hsl(0 0% 98%)",
        primary: {
          DEFAULT: "hsl(263.4 70% 50.4%)",
          foreground: "hsl(210 20% 98%)",
        },
        secondary: {
          DEFAULT: "hsl(240 4.8% 12.5%)",
          foreground: "hsl(0 0% 98%)",
        },
        destructive: {
          DEFAULT: "hsl(0 62.8% 30.6%)",
          foreground: "hsl(0 0% 98%)",
        },
        muted: {
          DEFAULT: "hsl(240 3.7% 15.9%)",
          foreground: "hsl(240 5% 64.9%)",
        },
        accent: {
          DEFAULT: "hsl(240 4.8% 12.5%)",
          foreground: "hsl(0 0% 98%)",
        },
        card: {
          DEFAULT: "hsl(240 10% 6%)",
          foreground: "hsl(0 0% 98%)",
        },
      },
      borderRadius: {
        lg: "2px",
        md: "2px",
        sm: "2px",
      },
    },
  },
  plugins: [],
}
