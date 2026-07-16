import { StrictMode } from 'react'       // catches bugs in dev
import { createRoot } from 'react-dom/client' // React 18 root
import './index.css'                      // global reset + CSS tokens
import App from './App'                   // your root component

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
) 