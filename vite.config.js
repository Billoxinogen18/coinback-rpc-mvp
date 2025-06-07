import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This adds a global Buffer object to your frontend code, fixing the 'isBuffer' error.
    'global': 'globalThis'
  },
  resolve: {
    alias: {
      // This tells Vite to use the 'buffer' package when code asks for the 'buffer' module.
      'buffer': 'buffer/'
    }
  }
})