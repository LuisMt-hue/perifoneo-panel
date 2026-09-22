import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const traccarTarget = env.VITE_TRACCAR_URL || 'http://13.140.40.204:8082'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/socket': {
          target: traccarTarget,
          ws: true,
          changeOrigin: true,
        },
        '/api': {
          target: traccarTarget,
          changeOrigin: true,
        },
      },
    },
  }
})