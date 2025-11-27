'use client'

import { useEffect } from 'react'

export function PWARegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const isProduction = process.env.NODE_ENV === 'production'

    const handleServiceWorker = async () => {
      try {
        if (!isProduction) {
          // In development, unregister any existing service workers
          // to prevent conflicts with old build manifests
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.unregister()
          }
          return
        }

        // In production, register the service worker
        // When register: false is set in next-pwa, we need to manually register
        // Try to use workbox.register() if available (from workbox-window)
        // Otherwise fall back to standard service worker registration
        if (
          typeof window !== 'undefined' &&
          'workbox' in window &&
          typeof (window as any).workbox !== 'undefined' &&
          typeof (window as any).workbox.register === 'function'
        ) {
          await (window as any).workbox.register()
        } else {
          // Fallback to standard service worker registration
          await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })
        }
      } catch {
        // Ignore service worker registration failures
      }
    }

    handleServiceWorker()
  }, [])

  return null
}
