import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const DEFAULT_DEV_TRACCAR_URL = 'http://localhost:8082'
  const rawTarget = env.VITE_TRACCAR_URL || DEFAULT_DEV_TRACCAR_URL
  const traccarTarget = rawTarget.replace(/\/+$/, '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/socket': {
          target: traccarTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: traccarTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})