/** @type {import('tailwindcss').Config} */ 
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: 'hsl(var(--color-bg-base-hsl))',
        surface: 'hsl(var(--color-surface-hsl))',
        surfaceElevated: 'hsl(var(--color-surface-elevated-hsl))',
        textPrimary: 'hsl(var(--color-text-primary-hsl))',
        textSecondary: 'hsl(var(--color-text-secondary-hsl))',
        textMuted: 'hsl(var(--color-text-muted-hsl))',
        primary: 'hsl(var(--color-primary-hsl))',
        primaryGlow: 'hsl(var(--color-primary-glow-hsl))',
        accent: 'hsl(var(--color-accent-hsl))',
        accentGlow: 'hsl(var(--color-accent-glow-hsl))',
        glass: 'hsl(var(--color-surface-hsl) / 0.4)',
        glassBorder: 'hsl(var(--color-glass-border-hsl) / 0.3)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'card': '1.75rem',
        'btn': '1rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'neumorphic-out': 'var(--shadow-out)',
        'neumorphic-out-lg': 'var(--shadow-out-lg)',
        'neumorphic-in': 'var(--shadow-in)',
        'glass': 'var(--shadow-glass)',
        'pressed': 'var(--shadow-pressed)',
      },
      dropShadow: {
        'glow-primary': [
          '0 0 16px hsl(var(--color-primary-hsl) / 0.8)',
          '0 0 32px hsl(var(--color-primary-hsl) / 0.4)'
        ],
        'glow-accent': [
          '0 0 16px hsl(var(--color-accent-hsl) / 0.7)',
          '0 0 32px hsl(var(--color-accent-hsl) / 0.3)'
        ],
        'glow-soft': '0 0 20px hsl(var(--color-primary-hsl) / 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '20px',
        'strong': '30px',
      },
      animation: {
        'background-float': 'background-float 40s ease-in-out infinite alternate',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
        'aurora': 'aurora 8s ease-in-out infinite alternate',
      },
      keyframes: {
        'background-float': {
          '0%, 100%': { 
            transform: 'translate(0%, 0%) rotate(0deg) scale(1)' 
          },
          '33%': { 
            transform: 'translate(5%, -5%) rotate(1deg) scale(1.02)' 
          },
          '66%': { 
            transform: 'translate(-3%, 3%) rotate(-1deg) scale(0.98)' 
          },
        },
        'fade-in-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'glow-pulse': {
          'from': {
            filter: 'drop-shadow(0 0 5px hsl(var(--color-primary-hsl) / 0.5))'
          },
          'to': {
            filter: 'drop-shadow(0 0 20px hsl(var(--color-primary-hsl) / 0.8)) drop-shadow(0 0 30px hsl(var(--color-primary-hsl) / 0.4))'
          }
        },
        'aurora': {
          '0%': { backgroundPosition: '0% 50%, 50% 100%, 100% 0%' },
          '100%': { backgroundPosition: '100% 50%, 0% 0%, 50% 100%' },
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}