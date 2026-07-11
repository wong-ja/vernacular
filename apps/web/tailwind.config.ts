import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--color-base)',
        surface: {
          1: 'var(--color-surface-1)',
          2: 'var(--color-surface-2)',
          3: 'var(--color-surface-3)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
        },
        accentOn: 'var(--color-accent-on)',
        success: {
          DEFAULT: 'var(--color-success)',
          text: 'var(--color-success-text)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          text: 'var(--color-warning-text)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          text: 'var(--color-error-text)',
          bg: 'var(--color-error-bg)',
          border: 'var(--color-error-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          text: 'var(--color-info-text)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
        },
        brand: {
          dark: '#3D4670',
          light: '#9CB4FF',
        },
        forest: '#1D3830',
        'mardi-gras': '#38003D',
        picasso: '#FFF7AE',
        periwinkle: '#A8BEF7',
        'rose-bud': '#FBBEA2',
        'water-leaf': '#9AE4E5',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        heading: ['Lora', 'Georgia', 'Times New Roman', 'serif'],
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
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      maxWidth: {
        container: '1280px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(calc(100% + 16px))', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        spin: 'spin 0.8s linear infinite',
        marquee: 'marquee 30s linear infinite',
        'slide-in-right': 'slide-in-right 200ms ease-out',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
