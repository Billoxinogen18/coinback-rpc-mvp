export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: 'hsl(220, 50%, 97%)',
        surface: 'hsl(220, 50%, 97%)',
        primary: 'hsl(210, 70%, 60%)',
        primaryDark: 'hsl(210, 70%, 50%)',
        accent: 'hsl(45, 100%, 60%)',
        textPrimary: 'hsl(210, 25%, 40%)',
        textSecondary: 'hsl(210, 20%, 55%)',
        textLight: 'hsl(210, 30%, 85%)',
        shadowLight: 'hsl(220, 40%, 100%)',
        shadowDark: 'hsl(220, 25%, 88%)',
        glassOverlay: 'hsla(220, 50%, 100%, 0.2)',
        glassBorder: 'hsla(220, 50%, 100%, 0.3)',
        greenHighlight: 'hsl(145, 63%, 49%)',
        redHighlight: 'hsl(0, 72%, 51%)',
        yellowHighlight: 'hsl(45, 100%, 51%)',
        blueHighlight: 'hsl(210, 100%, 60%)',
        indigoHighlight: 'hsl(230, 80%, 65%)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'neo-sm': '0.75rem',
        'neo': '1rem',
        'neo-lg': '1.5rem',
        'neo-xl': '2rem',
      },
      boxShadow: {
        'neo-outset': `6px 6px 12px theme('colors.shadowDark'), -6px -6px 12px theme('colors.shadowLight')`,
        'neo-inset': `inset 6px 6px 12px theme('colors.shadowDark'), inset -6px -6px 12px theme('colors.shadowLight')`,
        'neo-outset-sm': `3px 3px 6px theme('colors.shadowDark'), -3px -3px 6px theme('colors.shadowLight')`,
        'neo-inset-sm': `inset 3px 3px 6px theme('colors.shadowDark'), inset -3px -3px 6px theme('colors.shadowLight')`,
        'neo-outset-xs': `2px 2px 4px theme('colors.shadowDark'), -2px -2px 4px theme('colors.shadowLight')`,
        'neo-inset-xs': `inset 2px 2px 4px theme('colors.shadowDark'), inset -2px -2px 4px theme('colors.shadowLight')`,
        'glass': '0 8px 32px 0 hsla(220, 30%, 0%, 0.15)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseShadow: {
          '0%, 100%': { boxShadow: `6px 6px 12px theme('colors.shadowDark'), -6px -6px 12px theme('colors.shadowLight')` },
          '50%': { boxShadow: `8px 8px 16px theme('colors.shadowDark'), -8px -8px 16px theme('colors.shadowLight')` },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        pulseShadow: 'pulseShadow 2s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
