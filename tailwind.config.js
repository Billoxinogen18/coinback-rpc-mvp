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
        glass: 'hsla(var(--color-surface-hsl) / 0.45)',
        glassBorder: 'hsla(var(--color-surface-hsl) / 0.6)',
      },
      borderRadius: {
        'card': '1.75rem',
        'btn': '1rem',
      },
      boxShadow: {
        'neumorphic-out': 'var(--shadow-out)',
        'neumorphic-out-lg': 'var(--shadow-out-lg)',
        'neumorphic-in': 'var(--shadow-in)',
      },
      dropShadow: {
        'glow-primary': '0 0 20px hsla(var(--color-primary-hsl) / 0.5)',
      },
      keyframes: {
        'background-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'background-pan': 'background-pan 35s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}