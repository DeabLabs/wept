import d from 'daisyui';
import t from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            p: {
              marginTop: 0,
              marginBottom: 0
            },
            code: {
              backgroundColor: 'var(--tw-prose-pre-bg)'
            }
          }
        }
      }
    }
  },

  plugins: [t, d]
};

module.exports = config;
