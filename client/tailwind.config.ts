import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Exact Ouroboros typography: VT323 display terminal + Share Tech Mono precision UI
        display: ['"VT323"', 'monospace'],
        heading: ['"VT323"', 'monospace'],
        cinzel: ['"VT323"', 'monospace'],
        body: ['"Share Tech Mono"', 'monospace'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        eclipse: {
          bg: '#050305',
          stone: '#090609',
          gold: '#c69c5d',
          crimson: '#ff0033',
          acid: '#b8ff00',
          success: '#16a34a',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
      },
    },
  },
  plugins: [],
};

export default config;
