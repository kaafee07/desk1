'use client'

import { useState } from 'react'

export default function TestLogin() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async (type: string, data: any) => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, ...data }),
      })

      const responseData = await response.json()
      
      setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(responseData, null, 2)}`)
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">اختبار تسجيل الدخول</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Admin Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">مدير النظام</h2>
            <button
              onClick={() => testLogin('admin', { username: 'admin', password: 'admin123' })}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              اختبار تسجيل دخول المدير
            </button>
          </div>

          {/* Cashier Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">الكاشير</h2>
            <button
              onClick={() => testLogin('cashier', { pin: '1234' })}
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              اختبار تسجيل دخول الكاشير
            </button>
          </div>

          {/* Client Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">العميل</h2>
            <button
              onClick={() => testLogin('client', { phone: '+1234567890' })}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              اختبار تسجيل دخول العميل
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">النتيجة:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {result}
            </pre>
          </div>
        )}

        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">جاري الاختبار...</p>
          </div>
        )}
      </div>
    </div>
  )
}
