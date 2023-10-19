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
            minWidth: '0px',
            width: '100%',
            article: {
              maxWidth: '100%',
              width: '100%'
            },
            p: {
              marginTop: 0,
              marginBottom: 0
            },
            code: {
              backgroundColor: 'var(--tw-prose-pre-bg)'
            },
            pre: {
              maxWidth: '100%',
              width: '100%',

              overflowX: 'auto',
              'text-wrap': 'pretty'
            }
          }
        }
      }
    }
  },

  plugins: [t, d]
};

module.exports = config;
