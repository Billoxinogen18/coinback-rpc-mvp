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
        glass: 'hsla(var(--color-surface-hsl) / 0.5)',
        glassBorder: 'hsla(var(--color-text-primary-hsl) / 0.1)',
      },
      borderRadius: {
        'card': '1.5rem',
        'btn': '0.75rem',
      },
      boxShadow: {
        'card': '0px 16px 48px -10px hsla(var(--color-shadow-hsl) / 0.2)',
        'button': '4px 4px 8px hsla(var(--color-shadow-hsl) / 0.2), -4px -4px 8px hsla(var(--color-surface-hsl) / 0.8)',
        'button-hover': '6px 6px 12px hsla(var(--color-shadow-hsl) / 0.25), -6px -6px 12px hsla(var(--color-surface-hsl) / 0.9)',
        'inset-soft': 'inset 2px 2px 5px hsla(var(--color-shadow-hsl) / 0.1), inset -2px -2px 5px hsla(var(--color-surface-hsl) / 0.7)',
      },
      dropShadow: {
        'glow-primary': '0 0 15px hsla(var(--color-primary-hsl) / 0.7)',
        'glow-accent': '0 0 15px hsla(var(--color-accent-hsl) / 0.8)',
      },
      keyframes: {
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'background-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'background-pan': 'background-pan 30s ease infinite',
      },
    },
  },
  plugins: [],
}