import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#355B3E',
          dark: '#2a4732',
          light: '#4d7a55',
        },
        cream: {
          DEFAULT: '#F4E9B9',
          dark: '#e5d8a6',
          light: '#fff9e6',
        },
        neutral: {
          DEFAULT: '#8B8B8B',
          dark: '#666666',
          light: '#CCCCCC',
        },
        text: {
          DEFAULT: '#1a1a1a',
          muted: '#666666',
          light: '#FFFFFF',
        },
        background: {
          DEFAULT: '#F9F8F4',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        full: '50%',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '32': '8rem',
        '48': '12rem',
        '64': '16rem',
      },
      boxShadow: {
        DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.08)',
        lg: '0 4px 16px rgba(0, 0, 0, 0.12)',
        xl: '0 8px 24px rgba(0, 0, 0, 0.16)',
        '3d': '4px 4px 0px #355B3E',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
