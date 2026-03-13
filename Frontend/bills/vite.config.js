import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    proxy: {
      '/api': 'http://172.24.29.33:7500',
    },
    host:true,
    open: true,
    port:'7600'
  },
})
