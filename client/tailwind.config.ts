import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Cinzel', 'serif'],
        heading: ['Cinzel', 'serif'],
      },
      colors: {
        eclipse: {
          bg: '#060709',
          surface: '#0e0a12',
          crimson: '#e11d48',
          blood: '#991b1b',
          gold: '#eab308',
        },
        raw: {
          cream: '#F5F2EB',
          paper: '#FFFFFF',
          ink: '#111111',
          acid: '#CCFF00',
          tomato: '#FF2A14',
          cobalt: '#0038FF',
          muted: '#777570',
          border: '#111111',
        },
      },
      borderRadius: {
        xs: '4px',
        card: '16px',
        xl2: '24px',
      },
    },
  },
  plugins: [],
};

export default config;
