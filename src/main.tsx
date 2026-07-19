import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  // Capture 20% of transactions for performance — plenty for a small app
  tracesSampleRate: 0.2,
  environment: import.meta.env.MODE,
})

function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#18181b',
      color: '#fafafa',
      fontFamily: 'system-ui, sans-serif',
      gap: '16px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '40px' }}>💥</span>
      <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Something went wrong</h1>
      <p style={{ color: '#a1a1aa', fontSize: '14px', maxWidth: '400px', margin: 0 }}>
        {error?.message || 'An unexpected error occurred. It has been reported automatically.'}
      </p>
      <button
        onClick={resetError}
        style={{
          marginTop: '8px',
          padding: '8px 20px',
          borderRadius: '8px',
          border: 'none',
          background: 'linear-gradient(135deg,#e8823c,#d4600a)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}

// Guard against Vite HMR re-running this module and calling createRoot twice
const container = document.getElementById('root')! as any
const root = container.__reactRoot ?? createRoot(container)
container.__reactRoot = root

root.render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error as Error} resetError={resetError} />
      )}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
)
