import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          100: "#14161A",
          200: "#1F2228",
          300: "#2A2E36",
          800: "#0A0B0D",
          900: "#08090B",
        },
        foreground: {
          100: "#E9EDF2",
          200: "#D4DAE3",
          300: "#C9CDD3",
          400: "#A8AEB8",
          500: "#8B93A1",
          600: "#6B7280",
        },
        primary: {
          400: "#5EE8D5",
          500: "#5EE8D5",
        },
        secondary: {
          400: "#5EE8A0",
          500: "#5EE8A0",
        },
        accent: {
          200: "#D4DAE3",
          300: "#C9CDD3",
        },
        signal: "#FF5C5C",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      transitionTimingFunction: {
        precision: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scan-line": {
          "0%": { opacity: "0", transform: "translateY(-100%)" },
          "20%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(400%)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "fade-up": "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scan-line": "scan-line 2.4s ease-in-out infinite",
        "slide-in": "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin 24s linear infinite",
        "spin-slower": "spin 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
