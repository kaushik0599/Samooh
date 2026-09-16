import type { Config } from "tailwindcss";

/**
 * Design tokens are defined as CSS custom properties in globals.css
 * (light and dark values), and mapped here so Tailwind utilities like
 * `bg-surface` or `text-secondary` resolve to the current theme automatically.
 * Colors are stored as space-separated RGB triples so opacity modifiers
 * (`bg-primary/10`) work via `rgb(var(--x) / <alpha-value>)`.
 *
 * Scale values (fontSize/borderRadius/boxShadow) are extracted from the
 * project lead's reference landing + dashboard HTML — see globals.css's
 * top comment for the two-surface (glass marketing / clean SaaS) design
 * language they share.
 */
const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: withOpacity("--color-background"),
        surface: withOpacity("--color-surface"),
        "surface-secondary": withOpacity("--color-surface-secondary"),
        border: withOpacity("--color-border"),
        "text-primary": withOpacity("--color-text-primary"),
        "text-secondary": withOpacity("--color-text-secondary"),
        primary: {
          DEFAULT: withOpacity("--color-primary"),
          hover: withOpacity("--color-primary-hover"),
        },
        cyan: withOpacity("--color-cyan"),
        success: withOpacity("--color-success"),
        warning: withOpacity("--color-warning"),
        error: withOpacity("--color-error"),
        info: withOpacity("--color-info"),
        "accent-bg": withOpacity("--color-accent-bg"),
        "accent-bg-success": withOpacity("--color-accent-bg-success"),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Landing hero / section scale (fluid, per the reference's clamp()s).
        hero: ["clamp(2.75rem, 6vw, 4.5rem)", { lineHeight: "0.98", letterSpacing: "-0.045em", fontWeight: "700" }],
        display: [
          "clamp(2.375rem, 5vw, 4.25rem)",
          { lineHeight: "1.02", letterSpacing: "-0.045em", fontWeight: "700" },
        ],
        h1: ["2.125rem", { lineHeight: "1.1", letterSpacing: "-0.045em", fontWeight: "700" }],
        h2: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        h3: ["1.375rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        h4: ["1.125rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.7" }],
        body: ["0.9375rem", { lineHeight: "1.6" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.55" }],
        label: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "700" }],
        caption: ["0.6875rem", { lineHeight: "1.4" }],
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "14px",
        xl: "16px",
        "2xl": "22px",
      },
      boxShadow: {
        sm: "0 1px 2px rgb(0 0 0 / 0.04)",
        md: "0 8px 26px rgb(20 35 65 / 0.055)",
        lg: "0 8px 24px rgb(0 0 0 / 0.08)",
        glass: "var(--glass-shadow)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
