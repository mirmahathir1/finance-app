'use client'

import { useEffect } from 'react'

export function PWARegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // When register: false is set in next-pwa, we need to manually register
      // Try to use workbox.register() if available (from workbox-window)
      // Otherwise fall back to standard service worker registration
      const registerServiceWorker = async () => {
        try {
          // Check if workbox is available (from workbox-window library)
          if (
            typeof window !== 'undefined' &&
            'workbox' in window &&
            typeof (window as any).workbox !== 'undefined' &&
            typeof (window as any).workbox.register === 'function'
          ) {
            await (window as any).workbox.register()
            console.log('Workbox service worker registered successfully')
          } else {
            // Fallback to standard service worker registration
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
            })
            console.log('Service Worker registered successfully:', registration)
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }

      registerServiceWorker()
    }
  }, [])

  return null
}
