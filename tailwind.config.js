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
        glassOverlay: 'hsla(var(--color-surface-hsl) / 0.5)',
        glassBorder: 'hsla(var(--color-text-primary-hsl) / 0.1)',
        shadowLight: 'hsla(var(--color-shadow-light-hsl) / var(--shadow-light-opacity))',
        shadowDark: 'hsla(var(--color-shadow-dark-hsl) / var(--shadow-dark-opacity))',
      },
      borderRadius: {
        'neo': '1.25rem',
        'neo-lg': '1.75rem',
      },
      boxShadow: {
        'neo-outset': '10px 10px 20px var(--shadow-dark), -10px -10px 20px var(--shadow-light)',
        'neo-inset': 'inset 8px 8px 16px var(--shadow-dark), inset -8px -8px 16px var(--shadow-light)',
        'neo-button': '6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)',
        'neo-button-active': 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
        'glass': '0 8px 32px 0 hsla(var(--color-shadow-dark-hsl) / 0.37)',
        'glow-accent': '0 0 20px 0 hsla(var(--color-accent-hsl) / 0.8), 0 0 30px 0 hsla(var(--color-accent-hsl) / 0.5)',
        'glow-primary': '0 0 20px 0 hsla(var(--color-primary-hsl) / 0.7), 0 0 30px 0 hsla(var(--color-primary-hsl) / 0.4)',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(15px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px 0 hsla(var(--color-accent-hsl) / 0.6)', transform: 'scale(1)' },
          '50%': { boxShadow: '0 0 25px 5px hsla(var(--color-accent-hsl) / 0.3)', transform: 'scale(1.02)' },
        }
      },
      animation: {
        'fade-in-up': 'fadeIn 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 4s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}