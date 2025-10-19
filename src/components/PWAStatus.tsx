'use client'

import { useState, useEffect } from 'react'

export default function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    // Check online status
    setIsOnline(navigator.onLine)

    // Check if running as PWA
    const checkStandalone = () => {
      try {
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
        const isInWebAppiOS = (window.navigator as any).standalone === true
        setIsStandalone(isStandaloneMode || isInWebAppiOS)
      } catch (error) {
        console.error('Error checking standalone mode:', error)
        setIsStandalone(false)
      }
    }

    checkStandalone()

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isStandalone && isOnline) {
    return null // Don't show status if not PWA and online
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* PWA Status Bar */}
      {isStandalone && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-1 text-xs font-medium">
          📱 تطبيق مساحة العمل
        </div>
      )}
      
      {/* Offline Status */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-medium animate-pulse">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
            </svg>
            <span>غير متصل بالإنترنت</span>
          </div>
        </div>
      )}
    </div>
  )
}
