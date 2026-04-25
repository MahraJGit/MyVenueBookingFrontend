import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
      fontSize: {
        xs: "var(--font-size-x-small)",
        sm: "var(--font-size-small)",
        base: "var(--font-size-medium)",
        lg: "var(--font-size-large)",
        xl: "var(--font-size-x-large)",
        "6xl": "var(--font-size-xx-large)",
      },
    },
  },
  plugins: [],
};

export default config;
