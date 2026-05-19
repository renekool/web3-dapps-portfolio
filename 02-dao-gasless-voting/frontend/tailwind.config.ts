import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#CFFF92",
        "dark-green": "#063B26",
        secondary: "#063B26",
        "deep-black": "#030E09",
        typography: "#030E09",
        "background-light": "#FFFFFF",
        "soft-gray": "#F5F6F4",
        "section-bg": "#F5F6F4",
        "background-dark": "#1a230f",
      },
      fontFamily: {
        display: ["var(--font-outfit)", "Outfit", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
