/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        stage: {
          canvas: "#F8FAFC",
          card: "#FFFFFF",
          ink: "#0F172A",
          muted: "#475569",
          hairline: "#E2E8F0",
          cobalt: {
            DEFAULT: "#4F46E5",
            hover: "#4338CA",
            light: "#EEF2FF",
          },
          lemon: {
            DEFAULT: "#FACC15",
            hover: "#EAB308",
            light: "#FEF08A",
          },
          emerald: {
            DEFAULT: "#059669",
            light: "#ECFDF5",
          },
        },
      },
    },
  },
  plugins: [],
};
