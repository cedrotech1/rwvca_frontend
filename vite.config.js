import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'
  const port = parseInt(env.VITE_DEV_PORT || '5173', 10)

  return {
    base,
    plugins: [react(), tailwindcss()],
    server: {
      port,
      host: '127.0.0.1',
      proxy: {
        '/uploads': {
          target: env.VITE_API_ORIGIN || 'http://127.0.0.1:9000',
          changeOrigin: true,
        },
        '/api': {
          target: env.VITE_API_ORIGIN || 'http://127.0.0.1:9000',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
        },
      },
    },
    preview: {
      port,
      host: '127.0.0.1',
    },
  }
})
