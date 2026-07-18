import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Prevent Sentry (and other packages) from bundling their own copy of React
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      // @imgly/background-removal dynamically imports onnxruntime-web/webgpu at
      // runtime in the browser — Rollup cannot resolve it at build time, so we
      // tell it to leave these imports alone and let the browser handle them.
      external: ['onnxruntime-web', 'onnxruntime-web/webgpu'],
    },
  },
  server: {
    host: true,
    port: 5000,
    allowedHosts: true,
  },
})
