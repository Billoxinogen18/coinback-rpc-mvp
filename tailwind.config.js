/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: 'hsl(var(--color-bg-base))',
        surface: 'hsl(var(--color-surface))',
        textPrimary: 'hsl(var(--color-text-primary))',
        textSecondary: 'hsl(var(--color-text-secondary))',
        primary: 'hsl(var(--color-primary))',
        accent: 'hsl(var(--color-accent))',
        glass: 'hsla(var(--color-surface-hsl) / 0.7)',
        glassBorder: 'hsla(var(--color-text-primary-hsl) / 0.1)',
      },
      borderRadius: {
        'card': '1.5rem', // 24px
        'btn': '0.75rem',  // 12px
      },
      boxShadow: {
        'card': '0px 10px 30px -5px hsla(var(--color-shadow-hsl) / 0.1)',
        'button': '0px 4px 15px -2px hsla(var(--color-primary-hsl) / 0.3)',
        'button-hover': '0px 6px 20px -2px hsla(var(--color-primary-hsl) / 0.4)',
        'inset-soft': 'inset 0px 2px 4px 0px hsla(var(--color-shadow-hsl) / 0.05)',
      },
      dropShadow: {
        'glow-primary': '0 0 12px hsla(var(--color-primary-hsl) / 0.6)',
        'glow-accent': '0 0 12px hsla(var(--color-accent-hsl) / 0.8)',
      },
      keyframes: {
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
    },
  },
  plugins: [],
}