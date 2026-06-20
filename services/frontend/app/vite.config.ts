import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: Number(process.env.FE_PORT) || 5173
  },
  plugins: [react()],
})
