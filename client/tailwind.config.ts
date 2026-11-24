import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        raw: {
          cream: '#F5F2EB',
          paper: '#FFFFFF',
          ink: '#111111',
          acid: '#CCFF00',       // Electric Acid Lime-Yellow
          tomato: '#FF2A14',     // Signal Tomato Red
          cobalt: '#0038FF',     // Accent Cobalt
          muted: '#777570',
          border: '#111111',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        data: ['"JetBrains Mono"', 'monospace'],
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        hard: '6px 6px 0 #111111',
        'hard-sm': '3px 3px 0 #111111',
        'hard-lg': '10px 10px 0 #111111',
        'hard-tomato': '6px 6px 0 #FF2A14',
        'hard-acid': '6px 6px 0 #CCFF00',
        none: '0 0 0 transparent',
      },
      borderRadius: {
        none: '0px',
        pill: '9999px',
      },
      borderWidth: {
        '2': '2px',
        '3': '3px',
        '4': '4px',
      },
    },
  },
  plugins: [],
};

export default config;
