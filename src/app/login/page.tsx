'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type LoginType = 'client' | 'cashier' | 'admin'

export default function LoginPage() {
  const [loginType, setLoginType] = useState<LoginType>('client')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🔄 Starting login process...', { loginType })

    try {
      const loginData = {
        type: loginType,
        phone: loginType === 'client' ? phone : undefined,
        username: loginType === 'admin' ? username : undefined,
        password: loginType === 'admin' ? password : undefined,
        pin: loginType === 'cashier' ? pin : undefined,
      }

      console.log('📤 Sending login data:', loginData)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      })

      console.log('📥 Response status:', response.status)

      const data = await response.json()
      console.log('📥 Response data:', data)

      if (response.ok) {
        console.log('✅ Login successful, redirecting...', data.user.role)

        // Wait a moment for cookie to be set, then redirect
        setTimeout(() => {
          switch (data.user.role) {
            case 'CLIENT':
              console.log('🔄 Redirecting to /client')
              window.location.href = '/client'
              break
            case 'CASHIER':
              console.log('🔄 Redirecting to /cashier')
              window.location.href = '/cashier'
              break
            case 'ADMIN':
              console.log('🔄 Redirecting to /admin')
              window.location.href = '/admin'
              break
            default:
              console.log('❌ Unknown role:', data.user.role)
              setError('Unknown user role')
          }
        }, 500) // انتظار نصف ثانية
      } else {
        console.log('❌ Login failed:', data.error)
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('❌ Network error:', error)
      setError('Network error. Please try again.')
    } finally {
      console.log('🔄 Login process finished')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Workspace Management
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Login Type Selector */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {(['client', 'cashier', 'admin'] as LoginType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLoginType(type)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    loginType === type
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {loginType === 'client' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {loginType === 'cashier' && (
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                  PIN
                </label>
                <div className="mt-1">
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {loginType === 'admin' && (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
