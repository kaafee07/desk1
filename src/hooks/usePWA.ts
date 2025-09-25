import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (typeof window !== 'undefined') {
        // Check if running in standalone mode (installed PWA)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        const isInWebAppiOS = (window.navigator as any).standalone === true
        setIsInstalled(isStandalone || isInWebAppiOS)
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🔧 PWA: beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('✅ PWA: App was installed')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    if (typeof window !== 'undefined') {
      checkIfInstalled()
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)

      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ SW registered: ', registration)
          })
          .catch((registrationError) => {
            console.log('❌ SW registration failed: ', registrationError)
          })
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('❌ PWA: No deferred prompt available')
      return false
    }

    try {
      console.log('🔧 PWA: Showing install prompt')
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`🔧 PWA: User response to install prompt: ${outcome}`)
      
      if (outcome === 'accepted') {
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('❌ PWA: Error during installation:', error)
      return false
    }
  }

  const getInstallInstructions = () => {
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : ''
    
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      return {
        platform: 'iOS',
        instructions: [
          'اضغط على زر المشاركة في Safari',
          'اختر "إضافة إلى الشاشة الرئيسية"',
          'اضغط "إضافة" للتأكيد'
        ]
      }
    } else if (/Android/.test(userAgent)) {
      return {
        platform: 'Android',
        instructions: [
          'اضغط على زر "إضافة إلى الشاشة الرئيسية"',
          'أو اضغط على القائمة في المتصفح',
          'اختر "إضافة إلى الشاشة الرئيسية"'
        ]
      }
    } else {
      return {
        platform: 'Desktop',
        instructions: [
          'اضغط على أيقونة التثبيت في شريط العنوان',
          'أو اضغط Ctrl+Shift+A',
          'اختر "تثبيت التطبيق"'
        ]
      }
    }
  }

  return {
    isInstallable,
    isInstalled,
    installApp,
    getInstallInstructions
  }
}
