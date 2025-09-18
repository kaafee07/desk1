'use client'

import { useState } from 'react'

interface NameRegistrationModalProps {
  isOpen: boolean
  onSubmit: (name: string) => void
  loading?: boolean
}

export default function NameRegistrationModal({ 
  isOpen, 
  onSubmit, 
  loading = false 
}: NameRegistrationModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('الرجاء إدخال الاسم')
      return
    }

    if (name.trim().length < 2) {
      setError('الاسم يجب أن يكون أكثر من حرف واحد')
      return
    }

    setError('')
    onSubmit(name.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              مرحباً بك! 👋
            </h3>
            <p className="text-sm text-gray-500">
              لإكمال إعداد حسابك، الرجاء إدخال اسمك
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل اسمك الكامل"
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الحفظ...
                  </div>
                ) : (
                  'حفظ الاسم'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>💡 يمكنك تغيير اسمك لاحقاً من إعدادات الحساب</p>
          </div>
        </div>
      </div>
    </div>
  )
}
