'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'

interface QRScanResult {
  type: 'payment' | 'loyalty'
  data: any
}

interface BookingDetails {
  id: string
  bookingCode: string
  user: {
    phone: string
    username: string
  }
  office: {
    name: string
    officeNumber: string
  }
  totalPrice: number
  status: string
  duration: string
  startTime: string
  endTime: string
  isRenewal: boolean
}

interface PendingItem {
  id: string
  type: 'BOOKING' | 'REWARD'
  // Booking fields
  bookingCode?: string
  officeName?: string
  officeNumber?: string
  packageType?: string
  totalPrice?: number
  isRenewal?: boolean
  // Reward fields
 interface PaymentConfirmationProps {
  booking: BookingDetails
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

import { PaymentConfirmation, LoyaltyConfirmation } from '@/components/cashier/Confirmations'

export default
  booking,
  onConfirm,
  onCancel,
  isProcessing
}) => {Code?: string
  rewardName?: string
  rewardDescription?: string
  pointsUsed?: number
  qrCode?: string
  // Common fields
  clientName: string
  clientPhone: string
  createdAt: string
  timeRemaining: number
}

interface PendingBooking {
  id: string
  bookingCode: string
  clientName: string
  clientPhone: string
  officeName: string
  officeNumber: string
  packageType: string
  totalPrice: number
  createdAt: string
  timeRemaining: number
  isRenewal: boolean
}

interface LoyaltyDetails {
  userId: string
  rewardId: string
  user: {
    phone: string
    username: string
    loyaltyPoints: number
  }
  reward: {
    name: string
    pointsRequired: number
  }
}

export default function CashierDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'pending'>('pending')
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [loyaltyDetails, setLoyaltyDetails] = useState<LoyaltyDetails | null>(null)
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Setup pending bookings (authentication is handled by middleware)
  useEffect(() => {
    // Fetch pending bookings initially
    fetchPendingBookings()

    // Set up intervals for refreshing and cleanup
    const cleanupExpiredBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/cashier/cleanup-expired')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Cleaned up expired bookings:', data)
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired bookings:', error)
    }
  }, [])

  useEffect(() => {
    const refreshInterval = setInterval(fetchPendingBookings, 30000) // Refresh every 30 seconds
    const cleanupInterval = setInterval(cleanupExpiredBookings, 60000) // Cleanup every minute

    return () => {
      clearInterval(refreshInterval)
      clearInterval(cleanupInterval)
    }
  }, [cleanupExpiredBookings])

  const startCamera = async () => {
    try {
      setIsScanning(true)
      setMessage('جاري تشغيل الكاميرا...')
      setMessageType('info')

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setMessage('وجه الكاميرا نحو QR Code')
      setMessageType('info')

      // Start scanning
      scanQRCode()
    } catch (error) {
      console.error('Camera error:', error)
      setMessage('خطأ في تشغيل الكاميرا')
      setMessageType('error')
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setScanResult(null)
    setMessage('')
  }

  const fetchPendingBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/cashier/pending-bookings')
      if (response.ok) {
        const data = await response.json()
        setPendingBookings(data.bookings || [])
        setPendingItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching pending bookings:', error)
    }
  }, [])

  const cleanupExpiredBookings = useCallback(async () => {
    try {
      await fetch('/api/cashier/pending-bookings', { method: 'DELETE' })
      fetchPendingBookings() // Refresh the list
    } catch (err) {
      console.error('Error cleaning up expired bookings:', err)
    }
  }, [fetchPendingBookings])

  // Confirm booking from pending list
  const confirmPendingBooking = async (bookingId: string) => {
    try {
      setIsProcessing(true)
      const response = await fetch('/api/cashier/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(`تم تأكيد الحجز بنجاح! تم إضافة ${data.pointsAdded} نقطة ولاء`)
        setMessageType('success')
        fetchPendingBookings() // Refresh the list
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'فشل في تأكيد الحجز')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('حدث خطأ أثناء تأكيد الحجز')
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Confirm reward redemption from pending list
  const confirmPendingRedemption = async (redemptionId: string) => {
    try {
      setIsProcessing(true)
      const response = await fetch('/api/cashier/confirm-redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage('تم تأكيد استبدال المكافأة بنجاح!')
        setMessageType('success')
        fetchPendingBookings() // Refresh the list
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'فشل في تأكيد الاسترداد')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('حدث خطأ أثناء تأكيد الاسترداد')
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

        // Use jsQR to detect QR codes
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height)

        if (qrCode) {
          console.log('🎯 QR Code detected:', qrCode.data)
          handleQRDetected(qrCode.data)
          return
        }
      }

      if (isScanning) {
        requestAnimationFrame(scan)
      }
    }

    scan()
  }

  const handleQRDetected = async (qrData: string) => {
    stopCamera()
    await processQRCode(qrData)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return

    await processQRCode(manualCode.trim())
    setManualCode('')
  }

  const processQRCode = async (code: string) => {
    setIsProcessing(true)
    setMessage('جاري معالجة الكود...')
    setMessageType('info')

    try {
      // Determine QR type based on code format
      if (code.startsWith('BOOKING-PAY-') || code.startsWith('PAY-')) {
        // Payment QR Code with prefix
        await handlePaymentQR(code)
      } else if (code.startsWith('LOYALTY-') || code.startsWith('REWARD-')) {
        // Loyalty QR Code
        await handleLoyaltyQR(code)
      } else if (/^[A-Z0-9]{8}$/.test(code)) {
        // Standard booking code (8 alphanumeric characters)
        await handlePaymentQR(code)
      } else {
        // Try to parse as JSON (for complex QR codes)
        try {
          const qrData = JSON.parse(code)
          if (qrData.type === 'payment') {
            await handlePaymentQR(qrData.bookingCode)
          } else if (qrData.type === 'loyalty') {
            await handleLoyaltyQR(code)
          } else {
            throw new Error('نوع QR غير معروف')
          }
        } catch {
          setMessage('كود QR غير صالح')
          setMessageType('error')
        }
      }
    } catch (error) {
      console.error('QR processing error:', error)
      setMessage('خطأ في معالجة الكود')
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentQR = async (bookingCode: string) => {
    try {
      const response = await fetch('/api/cashier/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode })
      })

      const data = await response.json()

      if (response.ok) {
        setBookingDetails(data.booking)
        setScanResult({ type: 'payment', data: data.booking })
        setMessage('تم العثور على الحجز بنجاح')
        setMessageType('success')
      } else {
        setMessage(data.error || 'خطأ في العثور على الحجز')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('خطأ في الاتصال بالخادم')
      setMessageType('error')
    }
  }

  const handleLoyaltyQR = async (loyaltyCode: string) => {
    try {
      const response = await fetch('/api/cashier/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loyaltyCode })
      })

      const data = await response.json()

      if (response.ok) {
        setLoyaltyDetails(data.redemption)
        setScanResult({ type: 'loyalty', data: data.redemption })
        setMessage('تم العثور على طلب استرداد النقاط')
        setMessageType('success')
      } else {
        setMessage(data.error || 'خطأ في العثور على طلب الاسترداد')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('خطأ في الاتصال بالخادم')
      setMessageType('error')
    }
  }

  const confirmPayment = async () => {
    if (!bookingDetails) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/cashier/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingDetails.id })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('تم تأكيد الدفع بنجاح! ✅')
        setMessageType('success')
        // Reset after 3 seconds
        setTimeout(() => {
          resetScan()
        }, 3000)
      } else {
        setMessage(data.error || 'خطأ في تأكيد الدفع')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('خطأ في الاتصال بالخادم')
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmLoyaltyRedemption = async () => {
    if (!loyaltyDetails) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/cashier/confirm-loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loyaltyDetails.userId,
          rewardId: loyaltyDetails.rewardId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('تم تأكيد استرداد النقاط بنجاح! 🎁')
        setMessageType('success')
        // Reset after 3 seconds
        setTimeout(() => {
          resetScan()
        }, 3000)
      } else {
        setMessage(data.error || 'خطأ في تأكيد الاسترداد')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('خطأ في الاتصال بالخادم')
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetScan = () => {
    setScanResult(null)
    setBookingDetails(null)
    setLoyaltyDetails(null)
    setMessage('')
    setManualCode('')
  }

  const logout = () => {
    // Clear any auth tokens
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💰 نظام الكاشير</h1>
              <p className="text-sm text-gray-600">مسح QR للدفع واسترداد النقاط</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' ? 'bg-green-100 text-green-800' :
            messageType === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📋 الطلبات الجديدة ({pendingItems.length})
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📷 مسح QR
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              ⌨️ إدخال يدوي
            </button>
          </div>
        </div>

        {/* Pending Bookings Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              📋 الطلبات الجديدة
            </h2>

            {pendingItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">لا توجد طلبات جديدة</p>
                <p className="text-gray-400 text-sm mt-2">سيتم تحديث القائمة تلقائياً كل 5 ثوان</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingItems.map((item) => (
                  <div key={item.id} className={`border rounded-lg p-4 hover:bg-gray-50 ${
                    item.type === 'REWARD' ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">{item.clientName}</span>
                          <span className="text-sm text-gray-500">({item.clientPhone})</span>
                          {item.type === 'BOOKING' && item.isRenewal && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              🔄 تجديد
                            </span>
                          )}
                          {item.type === 'REWARD' && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              🎁 مكافأة
                            </span>
                          )}
                        </div>

                        {item.type === 'BOOKING' ? (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">المكتب:</span>
                              <span className="font-medium mr-2">{item.officeName} - رقم {item.officeNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">الباقة:</span>
                              <span className="font-medium mr-2">{item.packageType}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">المبلغ:</span>
                              <span className="font-bold text-green-600 mr-2">{item.totalPrice} ريال</span>
                            </div>
                            <div>
                              <span className="text-gray-600">الوقت المتبقي:</span>
                              <span className={`font-medium mr-2 ${
                                item.timeRemaining <= 2 ? 'text-red-600' :
                                item.timeRemaining <= 5 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {item.timeRemaining} دقيقة
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">المكافأة:</span>
                              <span className="font-medium mr-2">{item.rewardName}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">الوصف:</span>
                              <span className="font-medium mr-2">{item.rewardDescription}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">النقاط المستخدمة:</span>
                              <span className="font-bold text-orange-600 mr-2">{item.pointsUsed} نقطة</span>
                            </div>
                            <div>
                              <span className="text-gray-600">الوقت المتبقي:</span>
                              <span className={`font-medium mr-2 ${
                                item.timeRemaining <= 1 ? 'text-red-600' :
                                item.timeRemaining <= 2 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {item.timeRemaining} دقيقة
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => item.type === 'BOOKING'
                            ? confirmPendingBooking(item.id)
                            : confirmPendingRedemption(item.id)
                          }
                          disabled={isProcessing}
                          className={`text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                            item.type === 'BOOKING'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-orange-600 hover:bg-orange-700'
                          }`}
                        >
                          {isProcessing ? '⏳' : item.type === 'BOOKING' ? '✅ تأكيد الحجز' : '🎁 تسليم المكافأة'}
                        </button>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {item.type === 'BOOKING' ? item.bookingCode : item.redemptionCode}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QR Scan Tab */}
        {activeTab === 'scan' && !scanResult && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              📷 مسح QR Code
            </h2>

            {/* Camera Section */}
            <div className="mb-8">
              <div className="flex justify-center mb-4">
                {!isScanning ? (
                  <button
                    onClick={startCamera}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    📷 تشغيل الكاميرا
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    ⏹️ إيقاف الكاميرا
                  </button>
                )}
              </div>

              {isScanning && (
                <div className="flex justify-center">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-80 h-60 bg-black rounded-lg"
                      autoPlay
                      playsInline
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* QR Types Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💳 QR الدفع</h4>
                <p className="text-sm text-blue-700">
                  لتأكيد دفع الحجوزات والاشتراكات
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">🎁 QR النقاط</h4>
                <p className="text-sm text-green-700">
                  لاسترداد نقاط الولاء والحصول على المكافآت
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Input Tab */}
        {activeTab === 'manual' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              ⌨️ إدخال الكود يدوياً
            </h2>

            <form onSubmit={handleManualSubmit} className="mb-8">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="أدخل كود الدفع أو كود الولاء"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualCode.trim()}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '⏳ معالجة...' : '🔍 بحث'}
                </button>
              </div>
            </form>

            {/* Code Examples */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💳 كود الدفع</h4>
                <p className="text-sm text-blue-700 mb-2">مثال: ABC12345</p>
                <p className="text-xs text-blue-600">8 أحرف وأرقام مختلطة</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">🎁 كود الولاء</h4>
                <p className="text-sm text-green-700 mb-2">مثال: LOYALTY_user_reward-1</p>
                <p className="text-xs text-green-600">يبدأ بـ LOYALTY_</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {(activeTab === 'scan' || activeTab === 'manual') && scanResult && (
          <div className="space-y-6">
            {scanResult.type === 'payment' && bookingDetails && (
              <PaymentConfirmation
                booking={bookingDetails}
                onConfirm={confirmPayment}
                onCancel={resetScan}
                isProcessing={isProcessing}
              />
            )}

            {scanResult.type === 'loyalty' && loyaltyDetails && (
              <LoyaltyConfirmation
                redemption={loyaltyDetails}
                onConfirm={confirmLoyaltyRedemption}
                onCancel={resetScan}
                isProcessing={isProcessing}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Payment Confirmation Component
const PaymentConfirmation: React.FC<{
  booking,
  onConfirm,
  onCancel,
  isProcessing
}: {
  booking: BookingDetails
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{booking.isRenewal ? '🔄' : '💳'}</div>
        <h2 className="text-xl font-semibold text-gray-900">
          {booking.isRenewal ? 'تأكيد التجديد' : 'تأكيد الدفع'}
        </h2>
        {booking.isRenewal && (
          <p className="text-sm text-blue-600 mt-1">سيتم تمديد الاشتراك الحالي</p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">رقم الحجز:</span>
          <span className="font-medium">{booking.bookingCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">العميل:</span>
          <span className="font-medium">{booking.user.username || booking.user.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">المكتب:</span>
          <span className="font-medium">{booking.office.name} ({booking.office.officeNumber})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">نوع الاشتراك:</span>
          <span className="font-medium">
            {booking.duration === 'HOURLY' && '⏰ ساعة'}
            {booking.duration === 'DAILY' && '📅 يوم'}
            {booking.duration === 'MONTHLY' && '📆 شهر'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">المدة:</span>
          <span className="font-medium text-blue-600">
            {new Date(booking.startTime).toLocaleString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} - {new Date(booking.endTime).toLocaleString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">المبلغ:</span>
          <span className="font-bold text-green-600">{booking.totalPrice} ريال</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">الحالة:</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {booking.status === 'PENDING' ? 'في انتظار الدفع' : 'مدفوع'}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onConfirm}
          disabled={isProcessing || booking.status === 'PAID'}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '⏳ جاري التأكيد...' : booking.isRenewal ? '🔄 تأكيد التجديد' : '✅ تأكيد الدفع'}
        </button>
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ❌ إلغاء
        </button>
      </div>
    </div>
  )
}

// Loyalty Confirmation Component
function LoyaltyConfirmation({
  redemption,
  onConfirm,
  onCancel,
  isProcessing
}: {
  redemption: LoyaltyDetails
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎁</div>
        <h2 className="text-xl font-semibold text-gray-900">استرداد نقاط الولاء</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">العميل:</span>
          <span className="font-medium">{redemption.user.username || redemption.user.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">المكافأة:</span>
          <span className="font-medium">{redemption.reward.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">النقاط المطلوبة:</span>
          <span className="font-bold text-blue-600">{redemption.reward.pointsRequired} نقطة</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">النقاط المتاحة:</span>
          <span className={`font-bold ${
            redemption.user.loyaltyPoints >= redemption.reward.pointsRequired
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {redemption.user.loyaltyPoints} نقطة
          </span>
        </div>
      </div>

      {redemption.user.loyaltyPoints < redemption.reward.pointsRequired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">
            ⚠️ النقاط غير كافية لاسترداد هذه المكافأة
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onConfirm}
          disabled={isProcessing || redemption.user.loyaltyPoints < redemption.reward.pointsRequired}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '⏳ جاري التأكيد...' : '✅ تأكيد الاسترداد'}
        </button>
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ❌ إلغاء
        </button>
      </div>
    </div>
  )
}