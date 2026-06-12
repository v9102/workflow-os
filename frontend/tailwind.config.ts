import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#ffffff",
          dark: "#1A1A1E",
        },
        panel: {
          DEFAULT: "#FAFAF8",
          dark: "#232329",
        },
        border: {
          DEFAULT: "#E8E8E6",
          dark: "#2E2E36",
        },
        ink: {
          DEFAULT: "#1A1A1E",
          dark: "#F1F1F5",
          muted: "#8B8B93",
          "dark-muted": "#6B6B76",
        },
        accent: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        success: { DEFAULT: "#10B981", light: "#D1FAE5", dark: "#065F46" },
        warning: { DEFAULT: "#F59E0B", light: "#FEF3C7", dark: "#92400E" },
        danger: { DEFAULT: "#F43F5E", light: "#FFE4E6", dark: "#9F1239" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
        "soft-lg": "0 4px 16px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.02)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
}

export default config
