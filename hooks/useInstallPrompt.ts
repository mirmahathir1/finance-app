'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      console.log('[InstallPrompt] App is already installed')
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsAvailable(true)
      console.log('[InstallPrompt] beforeinstallprompt event received')
      // Store globally for access from other components
      ;(window as any).deferredPrompt = promptEvent
    }

    // Check if we already have a stored prompt (from previous page load)
    if ((window as any).deferredPrompt) {
      const storedPrompt = (window as any).deferredPrompt as BeforeInstallPromptEvent
      setDeferredPrompt(storedPrompt)
      setIsAvailable(true)
      console.log('[InstallPrompt] Using stored deferred prompt')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    console.log('[InstallPrompt] Listening for beforeinstallprompt event')

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Try to get from global storage
      const globalPrompt = (window as any).deferredPrompt as BeforeInstallPromptEvent | null
      if (globalPrompt) {
        try {
          await globalPrompt.prompt()
          const { outcome } = await globalPrompt.userChoice
          if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsAvailable(false)
            ;(window as any).deferredPrompt = null
          }
        } catch (error) {
          console.error('Install prompt error:', error)
        }
      }
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsAvailable(false)
        ;(window as any).deferredPrompt = null
      }
    } catch (error) {
      console.error('Install prompt error:', error)
    }
  }

  return {
    isInstalled,
    isAvailable,
    handleInstall,
  }
}

