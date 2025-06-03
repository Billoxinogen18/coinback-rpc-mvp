export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(210, 40%, 50%)',
          light: 'hsl(210, 40%, 70%)',
          dark: 'hsl(210, 40%, 30%)',
        },
        secondary: {
          DEFAULT: 'hsl(180, 50%, 50%)',
        },
        accent: {
          DEFAULT: 'hsl(45, 100%, 60%)',
        },
        background: 'hsl(210, 20%, 98%)',
        card: 'hsl(0, 0%, 100%)',
        text: 'hsl(210, 10%, 23%)',
        muted: 'hsl(210, 10%, 60%)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        'subtle': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
