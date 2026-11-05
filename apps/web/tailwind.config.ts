import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', md: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Brand identity (TZ §2.3): Deep Green #355B3E and Cream Yellow #F4E9B9.
        brand: {
          DEFAULT: '#355B3E',
          dark: '#27452F',
          light: '#4D7A55',
          50: '#EEF3EF',
          100: '#D6E3D9',
        },
        cream: { DEFAULT: '#F4E9B9', dark: '#E8D99A', light: '#FBF6E3', 50: '#FDFBF2' },
        milk: '#FFFDF7',
        ink: { DEFAULT: '#3A2A1E', muted: '#6E5D4E', soft: '#9A8B7C' },
        olive: { DEFAULT: '#7D8456', light: '#A3A97C' },
        danger: '#B4442F',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 12px rgba(58, 42, 30, 0.06)',
        card: '0 10px 30px -12px rgba(53, 91, 62, 0.25)',
        lift: '0 24px 48px -20px rgba(53, 91, 62, 0.35)',
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem' },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
        bump: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.25)' } },
        draw: { from: { strokeDashoffset: '1' }, to: { strokeDashoffset: '0' } },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        bump: 'bump .35s ease-out',
        draw: 'draw 2.4s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;
