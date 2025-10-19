/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"],
      },
      colors: {
        market: {
          bull: "#16a34a", // green
          bear: "#dc2626", // red
          primary: "#2563eb", // blue
          accent: "#22d3ee", // cyan
          ink: "#0b1220",
          card: "rgba(8,14,29,0.6)",
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.25)",
        glow: "0 0 0 2px rgba(34,211,238,0.2), 0 8px 24px rgba(37,99,235,0.35)",
      },
      backgroundImage: {
        radial:
          "radial-gradient(1000px 600px at 80% -20%, rgba(34,211,238,0.15), transparent), radial-gradient(800px 500px at -10% 10%, rgba(37,99,235,0.2), transparent)",
        grid:
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        noise:
          "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.04\"/></svg>')",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      borderRadius: {
        xl2: "1rem",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        ticker: "ticker 45s linear infinite",
      },
    },
  },
  plugins: [],
}
