import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/backend/device': {
        target: 'http://device-service:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend\/device/, '')
      },
      '/backend/data': {
        target: 'http://data-service:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend\/data/, '')
      },
      '/backend/rule-engine': {
        target: 'http://rule-engine-service:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend\/rule-engine/, '')
      },
      '/backend/analytics': {
        target: 'http://analytics-service:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend\/analytics/, '')
      },
      '/backend/data-export': {
        target: 'http://data-export-service:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend\/data-export/, '')
      },
      '/backend/reporting': {
        target: 'http://reporting-service:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend\/reporting/, '')
      },
    }
  }
})
