import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

// Build-time env (Vite exposes VITE_*) — fall back to NEXT_PUBLIC_* if present
const BUILD_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? null

function AppRoot() {
  const [publishableKey, setPublishableKey] = useState<string | null>(BUILD_PUBLISHABLE_KEY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If we already have a key at build time, no need to fetch
    if (publishableKey) return
    // Try to fetch it from server at runtime (/api/env). This lets the app work even
    // if the env was provided to Vercel only for server/runtime (e.g. NEXT_PUBLIC_* or CLERK_*)
    setLoading(true)
    fetch('/api/env')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.publishableKey) setPublishableKey(data.publishableKey)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [publishableKey])

  if (!publishableKey) {
    // Loading state while we try to get the key from the server
    if (loading) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>Cargando …</div>
        </div>
      )
    }

    // If we couldn't obtain a key, show a simple generic message (no .env instructions)
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: 8 }}>La aplicación no está disponible</h1>
          <p style={{ color: '#888' }}>Estamos revisando la configuración. Inténtalo de nuevo en unos instantes.</p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
)
