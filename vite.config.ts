import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/supabase': {
        target: 'https://yourprojectid.supabase.co', // your actual URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, ''),
      }
    }
  }
})