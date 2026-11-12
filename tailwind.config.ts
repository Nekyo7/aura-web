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
        primary: {
          DEFAULT: "#b026ff",
          neon: "#b026ff",
        },
        warning: {
          DEFAULT: "#ffc600",
          gold: "#ffc600",
        },
        tier: {
          thriving: "#00ff66",
          neutral: "#ffc600",
          weakened: "#ff3344",
        },
        kingdom: {
          academy: "#00e5ff",
          career: "#ffc600",
          alliance: "#ff2a85",
          camp: "#00ff66",
          creativity: "#b026ff",
          tavern: "#ff3344",
          treasury: "#ffea00",
        },
        currency: {
          ap: "#b026ff",
          mb: "#00ff66",
          cc: "#00e5ff",
        },
        attr: {
          str: "#ff3344",
          agi: "#00ff66",
          int: "#00e5ff",
          cha: "#ff2a85",
          dex: "#ffc600",
          wis: "#b026ff",
        },
        pixel: {
          bg: "#000000",
          surface: "#0a0a0a",
          raised: "#141414",
          sunken: "#050505",
          border: "#ffffff",
          purple: "#b026ff",
          gold: "#ffc600",
        },
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        heading: ["var(--font-pixel)", "monospace"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

