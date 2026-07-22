import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { ThemeProvider } from './context/ThemeContext'
import { ErrorFallback } from './components/ErrorFallback'
import './index.css'
import App from './App'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  // Capture 20% of transactions for performance — plenty for a small app
  tracesSampleRate: 0.2,
  environment: import.meta.env.MODE,
})

// Guard against Vite HMR re-running this module and calling createRoot twice
const container = document.getElementById('root')! as HTMLElement & { __reactRoot?: ReturnType<typeof createRoot> }
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
