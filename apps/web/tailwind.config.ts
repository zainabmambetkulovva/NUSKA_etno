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
        // Supporting palette (used sparingly).
        milk: '#FFFDF5',
        beige: '#E8D9B8',
        ink: { DEFAULT: '#3B3025', muted: '#6E5D4E', soft: '#9A8B7C' },
        olive: { DEFAULT: '#75815C', light: '#A3A97C' },
        gold: { DEFAULT: '#C7A76C', light: '#E2CFA4' },
        danger: '#B4442F',
        // Rich palette of the home page design: deep forest, honey gold, warm sand, wood, ruby.
        forest: { DEFAULT: '#1E3A23', dark: '#132717', light: '#2D4F32' },
        honey: { DEFAULT: '#D9A85B', light: '#EFCB8A', dark: '#B07A35' },
        sand: { DEFAULT: '#F5E6CE', light: '#FBF2E4' },
        wood: '#8A5A33',
        ruby: '#A3362B',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        script: ['var(--font-script)', 'cursive'],
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
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        sway: {
          '0%,100%': { transform: 'rotate(var(--sway-from, -4deg)) translateY(0)' },
          '50%': { transform: 'rotate(var(--sway-to, 4deg)) translateY(-8px)' },
        },
        'ken-burns': { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.08)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        bump: 'bump .35s ease-out',
        draw: 'draw 2.4s ease-in-out infinite alternate',
        float: 'float 5s ease-in-out infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        sway: 'sway 7s ease-in-out infinite',
        'ken-burns': 'ken-burns 24s ease-out both',
        marquee: 'marquee var(--marquee-duration, 40s) linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
