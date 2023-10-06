import d from 'daisyui';
import t from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {}
  },

  plugins: [t, d]
};

module.exports = config;
