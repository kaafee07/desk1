'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [officeId, setOfficeId] = useState('')

  const testAPI = async (endpoint: string, options?: RequestInit) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint, options)
      const data = await response.json()
      setResults({ endpoint, status: response.status, data })
      console.log(`🧪 ${endpoint}:`, data)
    } catch (error) {
      setResults({ endpoint, error: error instanceof Error ? error.message : 'Unknown error' })
      console.error(`❌ ${endpoint}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const testSubscriptions = () => {
    if (!phone) {
      alert('يرجى إدخال رقم الهاتف')
      return
    }
    testAPI(`/api/debug/subscriptions?phone=${encodeURIComponent(phone)}`)
  }

  const testOffices = () => {
    testAPI('/api/client/offices')
  }

  const testDatabase = () => {
    testAPI('/api/test-db')
  }

  const createTestSubscription = () => {
    if (!phone || !officeId) {
      alert('يرجى إدخال رقم الهاتف ومعرف المكتب')
      return
    }
    testAPI('/api/debug/test-booking-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, officeId, duration: 'HOURLY' })
    })
  }

  const deleteTestSubscription = () => {
    const subscriptionId = prompt('أدخل معرف الاشتراك للحذف:')
    if (!subscriptionId) return
    
    testAPI(`/api/debug/test-booking-flow?id=${subscriptionId}`, {
      method: 'DELETE'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🔧 صفحة تشخيص المشاكل
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف (للاختبار)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966501234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                معرف المكتب (للاختبار)
              </label>
              <input
                type="text"
                value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}
                placeholder="office-id-here"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <button
              onClick={testDatabase}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🗄️ اختبار قاعدة البيانات
            </button>
            
            <button
              onClick={testOffices}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🏢 اختبار المكاتب المتاحة
            </button>
            
            <button
              onClick={testSubscriptions}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              📋 اختبار اشتراكات العميل
            </button>
            
            <button
              onClick={createTestSubscription}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              ➕ إنشاء اشتراك تجريبي
            </button>
            
            <button
              onClick={deleteTestSubscription}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🗑️ حذف اشتراك تجريبي
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          )}

          {results && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                نتائج الاختبار: {results.endpoint}
              </h3>
              
              {results.status && (
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                  results.status >= 200 && results.status < 300 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  Status: {results.status}
                </div>
              )}
              
              <pre className="bg-white p-4 rounded border overflow-auto text-sm">
                {JSON.stringify(results.data || results.error, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">📝 تعليمات الاستخدام:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>1. ابدأ بـ "اختبار قاعدة البيانات" للتأكد من الاتصال</li>
              <li>2. اختبر "المكاتب المتاحة" لرؤية المكاتب المفلترة</li>
              <li>3. أدخل رقم هاتف عميل واختبر "اشتراكات العميل"</li>
              <li>4. يمكنك إنشاء اشتراك تجريبي لاختبار النظام</li>
              <li>5. تحقق من Console (F12) لرؤية التفاصيل الكاملة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
