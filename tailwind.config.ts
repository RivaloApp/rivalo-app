import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        rivalo: {
          dark: "#020617",
          card: "#0f172a",
          blue: "#38bdf8",
          neon: "#22d3ee",
          red: "#ef4444",
          gold: "#facc15"
        }
      }
    }
  },
  plugins: []
};

export default config;
