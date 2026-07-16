import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5000,
    allowedHosts: true,
    headers: {
      // Prevent browsers from MIME-sniffing responses
      'X-Content-Type-Options': 'nosniff',
      // Deny framing to block clickjacking
      'X-Frame-Options': 'DENY',
      // Limit referrer leakage to third-party sites
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Restrict access to sensitive browser APIs
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
})
