import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#CC0000",
          "red-dark": "#AA0000",
          "red-light": "#FF3333",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      animation: {
        pulse: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "count-up": "countUp 2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
