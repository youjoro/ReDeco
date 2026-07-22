import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  plugins: [react()],
  // Prevent Sentry (and other packages) from bundling their own copy of React
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // @imgly/background-removal dynamically imports onnxruntime-web at runtime
    // in the browser — exclude from pre-bundling so the dev server doesn't
    // try to resolve them at startup.
    exclude: ['onnxruntime-web', 'onnxruntime-web/webgpu'],
  },
  build: {
    rollupOptions: {
      // Same reason: leave these dynamic imports for the browser to handle.
      external: ['onnxruntime-web', 'onnxruntime-web/webgpu'],
    },
  },
  server: {
    host: true,
    port: 5000,
    allowedHosts: true,
  },
})
