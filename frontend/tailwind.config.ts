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
          DEFAULT: "#F4F1ED",
          dim: "#E5E2DD",
          bright: "#F4F1ED",
          "container-lowest": "#F4F1ED",
          "container-low": "#E5E2DD",
          container: "#E5E2DD",
          "container-high": "#E5E2DD",
          "container-highest": "#EAE6DF",
        },
        "on-surface": "#1A1A1A",
        "on-surface-variant": "#5f5e62",
        "inverse-surface": "#1C1A19",
        "inverse-on-surface": "#EAE6DF",
        outline: "#78716c",
        "outline-variant": "#a8a29e",
        primary: "#1A1A1A",
        "on-primary": "#FFFFFF",
        "primary-container": "#EAE6DF",
        "on-primary-container": "#1A1A1A",
        "inverse-primary": "#EAE6DF",
        "primary-fixed": "#E5E2DD",
        "primary-fixed-dim": "#D6D3CC",
        "on-primary-fixed": "#1A1A1A",
        "on-primary-fixed-variant": "#44403c",
        secondary: "#78716c",
        "on-secondary": "#FFFFFF",
        "secondary-container": "#E5E2DD",
        "on-secondary-container": "#44403c",
        "secondary-fixed": "#E5E2DD",
        "secondary-fixed-dim": "#D6D3CC",
        "on-secondary-fixed": "#1A1A1A",
        "on-secondary-fixed-variant": "#44403c",
        error: "#ba1a1a",
        "on-error": "#FFFFFF",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#F43F5E",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-lg": ["30px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "300" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "300" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "label-sm": ["11px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      borderRadius: {
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        full: "9999px",
      },
      spacing: {
        gutter: "24px",
        "card-padding": "20px",
        "container-max": "1280px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0, 0, 0, 0.02)",
        "soft-lg": "0 4px 12px rgba(0, 0, 0, 0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
