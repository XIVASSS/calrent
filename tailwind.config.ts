import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
      screens: { "2xl": "1440px" },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "'Cereal'",
          "Inter",
          "ui-sans-serif",
          "system-ui",
        ],
      },
      colors: {
        ink: {
          50: "#F7F7F8",
          100: "#EFEFF1",
          200: "#DFDFE3",
          300: "#C8C8CF",
          400: "#9A9AA4",
          500: "#6F6F7A",
          600: "#494954",
          700: "#2E2E36",
          800: "#1B1B22",
          900: "#0E0E13",
        },
        brand: {
          DEFAULT: "#E11D48",
          50: "#FFF1F4",
          100: "#FFE0E7",
          200: "#FFC2CF",
          300: "#FF94A8",
          400: "#FF5C7A",
          500: "#E11D48",
          600: "#C0103A",
          700: "#9C0E30",
          800: "#7A0B25",
          900: "#5A0A1B",
        },
        gold: {
          DEFAULT: "#F5B400",
          soft: "#FFE99A",
        },
        metro: {
          blue: "#1F6FEB",
          green: "#16A34A",
          purple: "#7C3AED",
        },
        canvas: "#FAFAF7",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.06)",
        cardHover: "0 4px 14px rgba(0,0,0,0.08), 0 20px 60px rgba(0,0,0,0.12)",
        floating: "0 12px 48px rgba(0,0,0,0.18)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
