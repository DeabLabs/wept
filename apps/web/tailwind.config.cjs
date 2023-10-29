import d from 'daisyui';
import t from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  daisyui: {
    themes: [
      'light',
      'dark',
      'cupcake',
      'bumblebee',
      'emerald',
      'corporate',
      'synthwave',
      'retro',
      'cyberpunk',
      'valentine',
      'halloween',
      'garden',
      'forest',
      'aqua',
      'lofi',
      'pastel',
      'fantasy',
      'wireframe',
      'black',
      'luxury',
      'dracula',
      'cmyk',
      'autumn',
      'business',
      'acid',
      'lemonade',
      'night',
      'coffee',
      'winter'
    ]
  },
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            minWidth: '0px',
            width: '100%',
            article: {
              maxWidth: '100%',
              width: '100%',
              overflow: 'hidden'
            },
            p: {
              marginTop: 0,
              marginBottom: 0,
              overflowWrap: 'anywhere'
            },
            pre: {
              overflow: 'auto',
              'text-wrap': 'pretty',
              // 'overflow-wrap': 'anywhere',
              maxWidth: '90%'
            },
            code: {
              backgroundColor: 'var(--tw-prose-pre-bg)',
              color: 'var(--tw-prose-pre-code)'
            }
          }
        }
      }
    }
  },

  plugins: [t, d]
};

module.exports = config;
