import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#0F0F0F',
        surface: {
          1: '#1A1A1A',
          2: '#242424',
          3: '#2E2E2E',
        },
        border: {
          DEFAULT: '#333333',
          subtle: '#222222',
        },
        text: {
          primary: '#F2F2F2',
          secondary: '#9A9A9A',
          tertiary: '#5A5A5A',
        },
        accent: {
          DEFAULT: '#4A7CFF',
          hover: '#6B94FF',
          subtle: '#1A2A4A',
        },
        success: {
          DEFAULT: '#2D7A4F',
          text: '#4CAF7D',
          bg: '#0F2A1A',
        },
        warning: {
          DEFAULT: '#8A6200',
          text: '#F5B800',
          bg: '#2A1F00',
        },
        error: {
          DEFAULT: '#8A2020',
          text: '#F55B5B',
          bg: '#2A0F0F',
        },
        info: {
          DEFAULT: '#1A4A7A',
          text: '#60A5FA',
          bg: '#0F1E2A',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '1.4'],
        sm: ['13px', '1.5'],
        base: ['15px', '1.6'],
        md: ['17px', '1.5'],
        lg: ['20px', '1.4'],
        xl: ['24px', '1.3'],
        '2xl': ['32px', '1.2'],
        '3xl': ['48px', '1.1'],
        '4xl': ['64px', '1.0'],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.4)',
        md: '0 4px 12px rgba(0,0,0,0.5)',
        lg: '0 8px 24px rgba(0,0,0,0.6)',
      },
      maxWidth: {
        container: '1280px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
