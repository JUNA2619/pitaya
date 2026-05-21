import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/partidos': 'http://127.0.0.1:8000',
      '/arbitros': 'http://127.0.0.1:8000',
      '/asignaciones': 'http://127.0.0.1:8000',
    }
  }
})
