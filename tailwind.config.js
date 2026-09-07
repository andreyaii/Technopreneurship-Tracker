/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FDCC01",
          "yellow-dark": "#E0B400",
          "yellow-soft": "#FFF6D6",
          progress: "#0F766E",
          "progress-soft": "#CCFBF1",
          black: "#111111",
          ink: "#1A1A1A",
        },
        // neutral grays used for structure, borders, muted text
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#FAFAF9",
          border: "#E7E5E4",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,17,0.04), 0 8px 24px -12px rgba(17,17,17,0.10)",
        "card-hover": "0 4px 10px rgba(17,17,17,0.06), 0 16px 32px -12px rgba(17,17,17,0.16)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
}
