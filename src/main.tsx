import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

// Prefer VITE_ vars for Vite, but fall back to NEXT_PUBLIC_ if present (some users copied Next.js envs)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  // Don't throw here -- show a helpful message in the UI instead of a blank screen
  console.error('Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY in your environment (.env) or in Vercel project settings')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--background)', color: 'var(--foreground)' }}>
        <div style={{ maxWidth: 680, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Falta la variable de entorno de Clerk</h1>
          <p style={{ marginBottom: 12, color: 'var(--muted-foreground)' }}>
            La aplicación no encontró la clave pública de Clerk. Añade <code>VITE_CLERK_PUBLISHABLE_KEY</code> a tu <code>.env</code> local y en las variables de entorno de Vercel, luego reinicia el despliegue.
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
            Si el repositorio contiene un archivo <code>.env</code> con claves (p. ej. <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> o <code>CLERK_SECRET_KEY</code>), elimina ese archivo del repositorio y regenera las claves en Clerk (no publiques secretos).
          </p>
        </div>
      </div>
    )}
  </React.StrictMode>,
)
