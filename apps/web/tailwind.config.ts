import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { brand: { 50: "#f4fcf7", 100: "#e7f8ee", 200: "#d1f1df", 300: "#afe6c7", 400: "#84d9aa", 500: "#5ec68e", 600: "#38a66f", 700: "#247f59", 800: "#1b6047", 900: "#154735", 950: "#063b2b" }, ink: "var(--color-text)", accent: "var(--color-accent)" }, borderRadius: { sm: "var(--radius-sm)", md: "var(--radius-md)", lg: "var(--radius-lg)", xl: "var(--radius-xl)", "2xl": "var(--radius-2xl)" }, opacity: { 8: ".08", 12: ".12", 18: ".18" }, boxShadow: { soft: "var(--shadow-soft)", card: "var(--shadow-card)", raised: "var(--shadow-raised)", featured: "var(--shadow-featured)", floating: "0 20px 55px rgba(26, 105, 71, .12)", dialog: "0 24px 90px rgba(8, 35, 27, .24)" }, transitionDuration: { fast: "120ms", normal: "200ms", slow: "320ms" }, transitionTimingFunction: { standard: "cubic-bezier(.2,.8,.2,1)", emphasized: "cubic-bezier(.16,1,.3,1)" }, animation: { "fade-in": "fade-in 200ms ease-out", "fade-out": "fade-out 160ms ease-in", "dialog-in": "dialog-in 200ms cubic-bezier(.16,1,.3,1)", "dialog-out": "dialog-out 160ms ease-in", "drawer-in": "drawer-in 280ms cubic-bezier(.16,1,.3,1)", "drawer-out": "drawer-out 220ms ease-in", "toast-in": "toast-in 200ms ease-out", "toast-out": "toast-out 160ms ease-in", ambient: "ambient 8s ease-in-out infinite", shimmer: "shimmer 1.8s ease-in-out infinite", "typing-caret": "typing-caret 900ms steps(1,end) infinite" } } },
  plugins: [require("@tailwindcss/typography")]
};
export default config;
