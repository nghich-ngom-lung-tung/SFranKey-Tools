import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { brand: { 50: "#f0fbf4", 100: "#def5e7", 200: "#c5ead4", 300: "#a3dbb9", 400: "#82cca2", 500: "#5cbb88", 600: "#269f69", 700: "#147b51", 800: "#0e6242", 900: "#0a4932", 950: "#052a1f" } } } },
  plugins: [require("@tailwindcss/typography")]
};
export default config;
