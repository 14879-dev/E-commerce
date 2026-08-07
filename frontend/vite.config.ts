import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://192.168.1.15:5000',
        changeOrigin: true,
      },
    },
  },
})

