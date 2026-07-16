import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Prevent Sentry (and other packages) from bundling their own copy of React
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    port: 5000,
    allowedHosts: true,
    // Disable wildcard CORS — this app is not a CORS endpoint
    cors: false,
    headers: {
      // Prevent browsers from MIME-sniffing responses
      'X-Content-Type-Options': 'nosniff',
      // Deny framing to block clickjacking
      'X-Frame-Options': 'DENY',
      // Limit referrer leakage to third-party sites
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Restrict access to sensitive browser APIs
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // Prevent cross-origin loading of our resources
      'Cross-Origin-Resource-Policy': 'same-origin',
      // Isolate the browsing context from cross-origin openers
      'Cross-Origin-Opener-Policy': 'same-origin',
      // Require resources to opt-in to cross-origin loading (needed for COOP/COEP isolation)
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
