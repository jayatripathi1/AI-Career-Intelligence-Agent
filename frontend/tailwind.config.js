/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: ["bg-emerald-400", "bg-amber-400"],
  theme: { extend: { fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] } } },
  plugins: [],
};
