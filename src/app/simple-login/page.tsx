'use client'

import { useState } from 'react'

export default function SimpleLogin() {
  const [message, setMessage] = useState('')

  const testAdmin = async () => {
    setMessage('جاري اختبار تسجيل دخول المدير...')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin',
          username: 'admin',
          password: 'admin123'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage(`✅ نجح تسجيل الدخول! المستخدم: ${data.user.username} - الدور: ${data.user.role}`)
        // إعادة توجيه بعد 2 ثانية
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/admin'
          }
        }, 2000)
      } else {
        setMessage(`❌ فشل تسجيل الدخول: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ خطأ في الشبكة: ${error}`)
    }
  }

  const testCashier = async () => {
    setMessage('جاري اختبار تسجيل دخول الكاشير...')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cashier',
          pin: '1234'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage(`✅ نجح تسجيل الدخول! الدور: ${data.user.role}`)
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/cashier'
          }
        }, 2000)
      } else {
        setMessage(`❌ فشل تسجيل الدخول: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ خطأ في الشبكة: ${error}`)
    }
  }

  const testClient = async () => {
    setMessage('جاري اختبار تسجيل دخول العميل...')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client',
          phone: '+1234567890'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage(`✅ نجح تسجيل الدخول! الهاتف: ${data.user.phone} - النقاط: ${data.user.loyaltyPoints}`)
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/client'
          }
        }, 2000)
      } else {
        setMessage(`❌ فشل تسجيل الدخول: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ خطأ في الشبكة: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">اختبار تسجيل الدخول</h1>
        
        <div className="space-y-4">
          <button
            onClick={testAdmin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            تسجيل دخول المدير
          </button>
          
          <button
            onClick={testCashier}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            تسجيل دخول الكاشير
          </button>
          
          <button
            onClick={testClient}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            تسجيل دخول العميل
          </button>
        </div>
        
        {message && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm">{message}</p>
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500">
          <p>بيانات الاختبار:</p>
          <p>• المدير: admin / admin123</p>
          <p>• الكاشير: PIN 1234</p>
          <p>• العميل: +1234567890</p>
        </div>
      </div>
    </div>
  )
}
