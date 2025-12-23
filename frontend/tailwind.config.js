/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#667eea",
          dark: "#5a6fd8",
        },
        secondary: {
          DEFAULT: "#764ba2",
        },
      },
    },
  },
  plugins: [],
};
