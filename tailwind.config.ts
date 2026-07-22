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
        // Every value resolves through a CSS custom property so the whole
        // palette can flip between the dark (default/original) and light
        // themes at runtime (see globals.css :root / [data-theme="light"]
        // and components/ThemeToggle.tsx) without touching a component.
        // The "rgb(var(--x) / <alpha-value>)" form is required (not a plain
        // var() of a hex string) so Tailwind's opacity modifiers like
        // bg-primary-500/40 keep working against a runtime-swappable value.
        background: {
          100: "rgb(var(--bg-100) / <alpha-value>)",
          200: "rgb(var(--bg-200) / <alpha-value>)",
          300: "rgb(var(--bg-300) / <alpha-value>)",
          800: "rgb(var(--bg-800) / <alpha-value>)",
          900: "rgb(var(--bg-900) / <alpha-value>)",
        },
        foreground: {
          100: "rgb(var(--fg-100) / <alpha-value>)",
          200: "rgb(var(--fg-200) / <alpha-value>)",
          300: "rgb(var(--fg-300) / <alpha-value>)",
          400: "rgb(var(--fg-400) / <alpha-value>)",
          500: "rgb(var(--fg-500) / <alpha-value>)",
          600: "rgb(var(--fg-600) / <alpha-value>)",
        },
        primary: {
          400: "rgb(var(--primary-500) / <alpha-value>)",
          500: "rgb(var(--primary-500) / <alpha-value>)",
        },
        secondary: {
          400: "rgb(var(--secondary-500) / <alpha-value>)",
          500: "rgb(var(--secondary-500) / <alpha-value>)",
        },
        accent: {
          200: "rgb(var(--accent-200) / <alpha-value>)",
          300: "rgb(var(--accent-300) / <alpha-value>)",
        },
        signal: "rgb(var(--signal) / <alpha-value>)",
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
