import type { Config } from "tailwindcss";

/**
 * Tailwind config — tokens mirrored from dog-health-app/app/theme/colors.ts
 * so the CRM matches the mobile app's premium pet-wellness aesthetic.
 * Hex source of truth: app/theme/colors.ts. When you change it there,
 * mirror the change here (and, when it exists, in shared/tokens.json).
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F3A93B", // primary.400
          dark: "#E2941C", // primary.500
          light: "#F5C46B", // primary.300
          50: "#FDF6E8",
          100: "#FAECC8",
          200: "#F5D88E",
          300: "#F3C45A",
          400: "#F3A93B",
          500: "#E2941C",
          600: "#C47E15",
          700: "#A06610",
          800: "#7D4E0C",
          900: "#5A3808",
        },
        secondary: {
          DEFAULT: "#6B625A",
          light: "#8A7F75",
          dark: "#4D4540",
        },
        status: {
          success: "#4CAF50",
          warning: "#FF9800",
          error: "#F44336",
          info: "#5B9BD5",
        },
        health: {
          heartRate: "#F44336",
          temperature: "#FF9800",
          activity: "#4CAF50",
          sleep: "#7E57C2",
          battery: "#4CAF50",
          gps: "#5B9BD5",
        },
        cream: {
          DEFAULT: "#F5E9CD", // background.primary
          dark: "#EDE2C6", // background.secondary
          card: "#FBF4E4", // background.card
        },
        cocoa: {
          DEFAULT: "#1F1A17", // text.primary
          secondary: "#6B625A", // text.secondary
          tertiary: "#A39888", // text.tertiary
        },
        border: {
          DEFAULT: "#E9DDC9",
          light: "#F0E8D8",
        },
      },
      borderRadius: {
        none: "0",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        xxl: "24px",
        xxxl: "28px",
        pill: "999px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        // brown-tinted shadows for premium feel, matching mobile
        card: "0 1px 3px 0 rgba(61,50,42,0.08), 0 1px 2px 0 rgba(61,50,42,0.06)",
        md: "0 4px 12px -2px rgba(61,50,42,0.10), 0 2px 6px -1px rgba(61,50,42,0.06)",
        lg: "0 10px 24px -4px rgba(61,50,42,0.12), 0 4px 8px -2px rgba(61,50,42,0.06)",
        tabBar: "0 4px 16px rgba(61,50,42,0.14)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
