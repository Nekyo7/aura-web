import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tier: {
          thriving: "#10b981",
          neutral: "#f59e0b",
          weakened: "#ef4444",
        },
        kingdom: {
          academy: "#3b82f6",
          career: "#f59e0b",
          alliance: "#ec4899",
          camp: "#10b981",
          creativity: "#8b5cf6",
          tavern: "#ef4444",
          treasury: "#eab308",
        },
        currency: {
          ap: "#8b5cf6",
          mb: "#10b981",
          cc: "#06b6d4",
        },
        attr: {
          str: "#ef4444",
          agi: "#10b981",
          int: "#3b82f6",
          cha: "#ec4899",
          dex: "#f59e0b",
          wis: "#8b5cf6",
        },
        pixel: {
          bg: "#090d16",
          surface: "#121826",
          raised: "#1e2638",
          sunken: "#0b0f19",
          border: "#2a3449",
        },
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

