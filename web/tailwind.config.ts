import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#16324F", 2: "#1F4E79", deep: "#0E2235" },
        red: { DEFAULT: "#D7402B", soft: "#FBEAE6" },
        gold: { DEFAULT: "#E9A23B", soft: "#FCF3E3" },
        teal: { DEFAULT: "#2A9D8F", soft: "#E4F4F2" },
        ink: { DEFAULT: "#1C2B3A", 2: "#52647A", 3: "#8A98AA" },
        line: "#E3E9F0",
        bg: "#F6F8FB",
        card: "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Thai", "system-ui", "sans-serif"],
        hanzi: ["Noto Serif SC", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
