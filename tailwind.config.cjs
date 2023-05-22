/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: ["./index.html", "./frontend/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "link-color": "#0D6EFD",
      },
    },
  },
  plugins: [],
  fontFamily: {
    sans: ["sans-serif"],
    serif: ["serif"],
  },
};
