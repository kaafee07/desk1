'use client'

import { useState } from 'react'
import { usePWA } from '@/hooks/usePWA'

export default function InstallAppButton() {
  const { isInstallable, isInstalled, installApp, getInstallInstructions } = usePWA()
  const [showInstructions, setShowInstructions] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const handleInstall = async () => {
    setIsInstalling(true)
    const success = await installApp()
    
    if (!success) {
      // Show manual instructions if automatic install failed
      setShowInstructions(true)
    }
    
    setIsInstalling(false)
  }

  // Don't show button if already installed
  if (isInstalled) {
    return null
  }

  const instructions = getInstallInstructions()

  return (
    <>
      {/* Install Button */}
      {(isInstallable || !isInstalled) && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">إضافة التطبيق للشاشة الرئيسية</h3>
              <p className="text-xs text-gray-600">للوصول السريع بدون فتح المتصفح</p>
            </div>
          </div>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-install"
          >
          {isInstalling ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>جاري التثبيت...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>📱 إضافة إلى الشاشة الرئيسية</span>
            </>
          )}
          </button>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                إضافة التطبيق إلى الشاشة الرئيسية
              </h3>
              <p className="text-gray-600 text-sm">
                للوصول السريع والسهل للتطبيق
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                    {instructions.platform === 'iOS' ? '🍎' : instructions.platform === 'Android' ? '🤖' : '💻'}
                  </span>
                  {instructions.platform}
                </h4>
                <ol className="space-y-2 text-sm text-blue-800">
                  {instructions.instructions.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-yellow-800 text-sm font-medium">
                    بعد الإضافة، ستجد أيقونة التطبيق في الشاشة الرئيسية
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={() => setShowInstructions(false)}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-xl hover:bg-gray-600 transition-all duration-300 font-semibold"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  setShowInstructions(false)
                  // Try install again
                  handleInstall()
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold"
              >
                المحاولة مرة أخرى
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
