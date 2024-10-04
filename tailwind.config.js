/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ './views/**/*.ejs',],
  theme: {
    extend: {
      fontSize: {
        '10rem': '15rem', // Custom font size of 20rem
      },
    },
  },
  plugins: [],
}

