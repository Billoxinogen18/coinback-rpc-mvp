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
        glassOverlay: 'hsla(var(--color-surface-hsl) / 0.6)',
        glassBorder: 'hsla(var(--color-text-primary-hsl) / 0.1)',
        shadowLight: 'hsla(var(--color-shadow-light-hsl) / var(--shadow-light-opacity))',
        shadowDark: 'hsla(var(--color-shadow-dark-hsl) / var(--shadow-dark-opacity))',
      },
      borderRadius: {
        'neo': '1rem',
        'neo-lg': '1.25rem',
      },
      boxShadow: {
        'neo-outset': '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)',
        'neo-inset': 'inset 8px 8px 16px var(--shadow-dark), inset -8px -8px 16px var(--shadow-light)',
        'neo-button-default': '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
        'neo-button-active': 'inset 5px 5px 10px var(--shadow-dark), inset -5px -5px 10px var(--shadow-light)',
        'glass': '0 8px 32px 0 hsla(var(--color-text-primary-hsl) / 0.1)',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeIn 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}