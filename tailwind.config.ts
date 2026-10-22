import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#04211C",
        paper: "#F2F2F0",
        muted: "#9B9B97",
        line: "#222222",
        teal: "#50D2C1",
        down: "#FF5C7A",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "ui-sans-serif", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
      },
      keyframes: {
        orbit: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        breathe: {
          "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
          "50%": { transform: "translate(-50%, -50%) scale(1.16)" },
        },
        settle: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        orbit: "orbit 72s linear infinite",
        breathe: "breathe 5.4s ease-in-out infinite",
        settle: "settle 280ms ease-out",
      },
    },
  },
  plugins: [],
}

export default config
