import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { // any endpoint starting with /api will be proxied
        target: 'http://localhost:8042',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/api/, '') // remove /api prefix
      },
    },
  },
})