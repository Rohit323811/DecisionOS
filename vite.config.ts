import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev proxy: the browser calls /api/* and Vite forwards it to the
      // local Express server, so the OpenAI key never reaches client code.
      '/api': {
        target: process.env.API_PORT ? `http://localhost:${process.env.API_PORT}` : 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
