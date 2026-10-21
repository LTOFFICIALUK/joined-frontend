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
    },
  },
  plugins: [],
}

export default config
