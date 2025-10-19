'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '@/hooks/usePWA'

export default function PWAPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    // Show prompt after 30 seconds if installable and not dismissed
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled && !dismissed) {
        try {
          const lastDismissed = localStorage.getItem('pwa-prompt-dismissed')
          const now = Date.now()
          const oneDayAgo = now - (24 * 60 * 60 * 1000) // 24 hours

          if (!lastDismissed || parseInt(lastDismissed) < oneDayAgo) {
            setShowPrompt(true)
          }
        } catch (error) {
          console.error('Error accessing localStorage:', error)
        }
      }
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [isInstallable, isInstalled, dismissed])

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)

    // Safely store dismissal time
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    }
  }

  if (!showPrompt || isInstalled) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-slide-up">
        <div className="flex items-start space-x-3 space-x-reverse">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              إضافة التطبيق إلى الشاشة الرئيسية
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              للوصول السريع والسهل بدون فتح المتصفح
            </p>
            
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-3 rounded-lg text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
              >
                إضافة الآن
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors duration-200"
              >
                لاحقاً
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
