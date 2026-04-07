// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"AvantGarde LT Book"', 'sans-serif'], // <-- Make this the default
        avant: ['"AvantGarde LT Book"', 'sans-serif'], // Optional: keep if you still want custom class `font-avant`
      },
    },
  },
  plugins: [],
};
