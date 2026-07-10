import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
