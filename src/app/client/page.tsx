'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import QRCode from 'react-qr-code' // Temporarily disabled for build
import NameRegistrationModal from '@/components/NameRegistrationModal'
import BookingPackagesModal from '@/components/BookingPackagesModal'
import RenewalModal from '@/components/RenewalModal'
import RewardQRModal from '@/components/RewardQRModal'
import InstallAppButton from '@/components/InstallAppButton'
import PWAPrompt from '@/components/PWAPrompt'

interface User {
  id: string
  phone: string
  username?: string
  loyaltyPoints: number
}

interface Office {
  id: string
  name: string
  description: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerMonth: number
  discountPercentage: number // خصم عام (للتوافق مع الكود القديم)
  // خصومات منفصلة لكل نوع باقة
  hourlyDiscount?: number
  dailyDiscount?: number
  monthlyDiscount?: number
  // أسعار سابقة لحساب الخصم
  previousPricePerHour?: number | null
  previousPricePerDay?: number | null
  previousPricePerMonth?: number | null
}

interface Subscription {
  id: string
  office: Office
  duration: string
  startDate: string
  endDate: string
  status: string
}

interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'PHYSICAL' | 'TIME_EXTENSION'
  timeValue?: number
  timeUnit?: 'HOURS' | 'DAYS'
}

export default function ClientDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrExpiry, setQrExpiry] = useState<number | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameLoading, setNameLoading] = useState(false)
  const [showPackagesModal, setShowPackagesModal] = useState(false)
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  // Reward QR Modal states
  const [showRewardQR, setShowRewardQR] = useState(false)
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null)
  const [rewardQRCode, setRewardQRCode] = useState<string>('')
  const [redemptionCode, setRedemptionCode] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    fetchUserData()

    // Set up periodic refresh every 30 seconds to catch new subscriptions
    const interval = setInterval(() => {
      console.log('🔄 Refreshing user data...')
      fetchUserData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchUserData = async () => {
    try {
      const [userRes, subRes, officesRes, rewardsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/client/subscription'),
        fetch('/api/client/offices'),
        fetch('/api/client/rewards'),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)

        // Check if user needs to register their name
        if (!userData.user.username || userData.user.username.trim() === '') {
          setShowNameModal(true)
        }
      }

      if (subRes.ok) {
        const subData = await subRes.json()
        console.log('📊 Subscriptions data:', subData.subscriptions)
        setSubscriptions(subData.subscriptions || [])
      } else {
        console.error('❌ Failed to fetch subscriptions:', subRes.status)
        const errorData = await subRes.json().catch(() => ({}))
        console.error('❌ Subscription error details:', errorData)
      }

      if (officesRes.ok) {
        const officesData = await officesRes.json()
        console.log('📊 Raw offices data:', officesData.offices)

        // حساب الخصومات من الأسعار السابقة والحالية
        const officesWithDiscounts = officesData.offices.map((office: Office, index: number) => {
          const calculateDiscount = (previousPrice: number | null, currentPrice: number): number => {
            if (previousPrice && previousPrice > 0 && currentPrice > 0 && previousPrice > currentPrice) {
              const discount = Math.round(((previousPrice - currentPrice) / previousPrice) * 100)
              console.log(`💰 Calculating discount: ${previousPrice} -> ${currentPrice} = ${discount}%`)
              return discount
            }
            return 0
          }

          const hourlyDiscount = calculateDiscount(office.previousPricePerHour, office.pricePerHour)
          const dailyDiscount = calculateDiscount(office.previousPricePerDay, office.pricePerDay)
          const monthlyDiscount = calculateDiscount(office.previousPricePerMonth, office.pricePerMonth)

          // لا نضيف خصومات تجريبية - نعتمد فقط على الأسعار السابقة الفعلية
          // هذا يضمن التطابق مع شاشة الإدارة

          console.log(`🏢 Office ${office.name} final discounts:`, {
            hourly: `${office.previousPricePerHour || 'N/A'} -> ${office.pricePerHour} = ${hourlyDiscount}%`,
            daily: `${office.previousPricePerDay || 'N/A'} -> ${office.pricePerDay} = ${dailyDiscount}%`,
            monthly: `${office.previousPricePerMonth || 'N/A'} -> ${office.pricePerMonth} = ${monthlyDiscount}%`
          })

          return {
            ...office,
            // حساب الخصومات من الأسعار السابقة أو التجريبية
            hourlyDiscount,
            dailyDiscount,
            monthlyDiscount,
          }
        })

        console.log('✅ Offices with calculated discounts:', officesWithDiscounts)
        setOffices(officesWithDiscounts)
      }

      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json()
        setRewards(rewardsData.rewards)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async (name: string) => {
    setNameLoading(true)
    try {
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setShowNameModal(false)

        // Show success message (optional)
        console.log('✅ Name saved successfully:', name)
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to save name:', errorData.error)
        // You can show an error message to the user here
      }
    } catch (error) {
      console.error('❌ Error saving name:', error)
    } finally {
      setNameLoading(false)
    }
  }

  const handleBookOffice = (office: Office) => {
    setSelectedOffice(office)
    setShowPackagesModal(true)
  }

  const handleBookingConfirm = async (packageType: string, office: Office): Promise<string | null> => {
    setBookingLoading(true)
    try {
      const response = await fetch('/api/client/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officeId: office.id,
          packageType: packageType
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Booking created successfully:', data)

        // Refresh user data to update points if needed
        fetchUserData()

        // Return the real payment code from the server
        return data.paymentCode || data.booking?.bookingCode || null
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to create booking:', errorData.error)
        return null
      }
    } catch (error) {
      console.error('❌ Error creating booking:', error)
      return null
    } finally {
      setBookingLoading(false)
    }
  }

  const handleRenewalConfirm = async (packageType: string) => {
    try {
      const response = await fetch('/api/client/renewal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: packageType,
          officeId: selectedOffice?.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Renewal created successfully:', data)

        // Close modal and refresh data
        setShowRenewalModal(false)
        fetchUserData()
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to create renewal:', errorData.error)
        alert(errorData.error)
      }
    } catch (error) {
      console.error('❌ Error creating renewal:', error)
      alert('حدث خطأ أثناء إنشاء طلب التجديد')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/client-login')
  }

  const handleRedeemReward = async (rewardId: string) => {
    console.log('🔍 Frontend - Attempting to redeem reward:', rewardId)
    try {
      const response = await fetch('/api/client/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId }),
      })

      console.log('🔍 Frontend - Response status:', response.status)
      console.log('🔍 Frontend - Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Frontend - Success response:', data)

        if (data.type === 'PHYSICAL') {
          // Physical reward - show QR code modal
          const reward = rewards.find(r => r.id === rewardId)
          if (reward) {
            setSelectedReward(reward)
            setRewardQRCode(data.qrCodeData)
            setRedemptionCode(data.redemptionCode)
            setShowRewardQR(true)
            setShowRewards(false)
          }
        } else if (data.type === 'TIME_EXTENSION') {
          // Time extension - show success message
          alert(data.message)
          setShowRewards(false)
        }

        // Refresh user data to update points and subscriptions
        fetchUserData()
      } else {
        console.log('❌ Frontend - Error response:', response.status)
        const error = await response.json()
        console.log('❌ Frontend - Error data:', error)
        alert(error.error || 'Failed to redeem reward')
      }
    } catch (error) {
      console.log('❌ Frontend - Network error:', error)
      alert('Network error. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">جاري التحميل</h3>
            <p className="text-gray-600">يرجى الانتظار قليلاً...</p>
          </div>
        </div>
      </div>
    )
  }

  const getRemainingTime = (subscription: Subscription) => {
    const now = new Date()
    const end = new Date(subscription.endDate)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days} days, ${hours} hours`
    return `${hours} hours`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 relative">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-100/30 to-purple-100/30 rounded-full blur-3xl transform -translate-x-48 translate-y-48"></div>
      </div>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4 sm:py-5">
            <div className="flex items-center space-x-3 space-x-reverse sm:space-x-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <span className="text-white text-base sm:text-lg">👤</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  لوحة التحكم
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                  مرحباً، {user?.username || user?.phone} 👋
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-2 sm:px-3 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium flex items-center space-x-1 space-x-reverse sm:space-x-2"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Install App Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 relative z-10">
        <InstallAppButton />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Subscription Status */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-200/50 border border-white/50 p-6 sm:p-8 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-emerald-500/25">
                  <span className="text-white text-lg sm:text-xl">🏢</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">الاشتراكات النشطة</h3>
                  <p className="text-xs sm:text-sm text-gray-600">اشتراكاتك الحالية</p>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered')
                  fetchUserData()
                }}
                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                title="تحديث الاشتراكات"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            {subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">
                          {subscription.office.name}
                        </h4>
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{subscription.office.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="bg-white/80 text-emerald-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border border-emerald-200">
                            📅 {subscription.duration.toLowerCase()}
                          </span>
                          <span className="bg-white/80 text-amber-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border border-amber-200">
                            ⏰ {getRemainingTime(subscription)}
                          </span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-emerald-200/50 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedOffice(subscription.office)
                            setShowRenewalModal(true)
                          }}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/25 flex items-center space-x-1 space-x-reverse sm:space-x-2"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>تجديد</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl text-gray-400">📋</span>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">لا توجد اشتراكات نشطة</h4>
                <p className="text-sm sm:text-base text-gray-600">ابدأ بحجز مكتب جديد لتبدأ رحلتك معنا</p>
              </div>
            )}
          </div>

          {/* Loyalty Points */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-200/50 border border-white/50 p-6 sm:p-8 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-amber-500/25">
                <span className="text-white text-lg sm:text-xl">⭐</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">نقاط الولاء</h3>
                <p className="text-xs sm:text-sm text-gray-600">رصيدك من النقاط</p>
              </div>
            </div>
            <div className="text-center">
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <span className="text-gray-900 text-2xl sm:text-3xl font-bold">{user?.loyaltyPoints || 0}</span>
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs">✨</span>
                </div>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">النقاط المتاحة</h4>
              <p className="text-sm sm:text-base text-gray-600">استخدم نقاطك للحصول على مكافآت رائعة</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <button
            onClick={() => setShowBookingForm(true)}
            className="group bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 text-right"
          >
            <div className="flex items-center space-x-3 space-x-reverse sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">حجز مكتب جديد</h3>
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">ابدأ رحلة عملك في بيئة مثالية</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowRewards(true)}
            className="group bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200 transition-all duration-300 text-right"
          >
            <div className="flex items-center space-x-3 space-x-reverse sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">استبدال النقاط</h3>
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">احصل على مكافآت رائعة بنقاطك</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              if (subscriptions.length > 0) {
                setSelectedOffice(subscriptions[0].office)
                setShowRenewalModal(true)
              } else {
                alert('لا توجد اشتراكات للتجديد')
              }
            }}
            className="group bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 text-right sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center space-x-3 space-x-reverse sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">تجديد الاشتراك</h3>
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">مد فترة اشتراكك بسهولة</p>
              </div>
            </div>
          </button>
        </div>

        {/* QR Code Modal */}
        {qrCode && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 max-w-md w-full mx-4">
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-emerald-500/25">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                  رمز QR للمكافأة
                </h3>
                <p className="text-sm sm:text-base text-gray-600">اعرض هذا الرمز للكاشير</p>
              </div>

              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
                  <div className="w-[180px] h-[180px] bg-gray-200 flex items-center justify-center text-gray-500">
                    QR Code Placeholder
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-center mb-1 sm:mb-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-red-700 font-semibold text-sm sm:text-base">ينتهي خلال 3 دقائق</span>
                  </div>
                  <p className="text-red-600 text-xs sm:text-sm">يرجى إظهار الرمز للكاشير قبل انتهاء الوقت</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setQrCode(null)
                  setQrExpiry(null)
                }}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 space-x-reverse sm:space-x-3"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm sm:text-base">إغلاق</span>
              </button>
            </div>
          </div>
        )}

        {/* Rewards Modal */}
        {showRewards && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-amber-500/25 flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900">المكافآت المتاحة</h3>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">استخدم نقاط الولاء للحصول على مكافآت رائعة</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRewards(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200 flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Physical Rewards Section */}
              <div className="mb-8 sm:mb-10">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-orange-500/25 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900">مكافآت ملموسة</h4>
                    <p className="text-gray-600 text-sm sm:text-base">تحتاج تأكيد من الكاشير</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {rewards.filter(reward => reward.type === 'PHYSICAL').map((reward) => {
                    const canAfford = (user?.loyaltyPoints || 0) >= reward.pointsCost;
                    return (
                      <div key={reward.id} className="bg-gradient-to-br from-orange-50 to-red-50/50 border border-orange-200/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                                <span className="text-white text-lg">🎯</span>
                              </div>
                              <h5 className="font-bold text-gray-900 text-lg">{reward.name}</h5>
                            </div>
                            <p className="text-gray-700 mb-4 leading-relaxed">{reward.description}</p>
                            <div className="inline-flex items-center bg-white/80 border border-orange-200 px-3 py-2 rounded-lg">
                              <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="text-orange-800 font-semibold text-sm">{reward.pointsCost} نقطة</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={!canAfford}
                          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                            canAfford
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? '🎁 استبدال الآن' : '❌ نقاط غير كافية'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Extension Rewards Section */}
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/25">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">إضافة وقت للاشتراك</h4>
                    <p className="text-gray-600">يُضاف فوراً إلى اشتراكك النشط</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rewards.filter(reward => reward.type === 'TIME_EXTENSION').map((reward) => {
                    const canAfford = (user?.loyaltyPoints || 0) >= reward.pointsCost;
                    const hasSubscription = subscriptions.length > 0;
                    const canRedeem = canAfford && hasSubscription;

                    return (
                      <div key={reward.id} className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-200/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                                <span className="text-white text-lg">⏱️</span>
                              </div>
                              <h5 className="font-bold text-gray-900 text-lg">{reward.name}</h5>
                            </div>
                            <p className="text-gray-700 mb-4 leading-relaxed">{reward.description}</p>
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="inline-flex items-center bg-white/80 border border-blue-200 px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="text-blue-800 font-semibold text-sm">{reward.pointsCost} نقطة</span>
                              </div>
                              <div className="inline-flex items-center bg-white/80 border border-emerald-200 px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-emerald-800 font-semibold text-sm">+{reward.timeValue} {reward.timeUnit === 'HOURS' ? 'ساعة' : 'يوم'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={!canRedeem}
                          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                            canRedeem
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {!hasSubscription ? '❌ لا يوجد اشتراك نشط' : !canAfford ? '❌ نقاط غير كافية' : '⏰ إضافة الوقت'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Office Selection Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-indigo-500/25">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">اختر المكتب المثالي</h3>
                      <p className="text-gray-600 mt-1">اختر المكتب الذي يناسب احتياجاتك وابدأ رحلة النجاح</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {offices.map((office) => (
                    <div key={office.id} className="group bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300">
                      <div className="text-center mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-300">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{office.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-tight">{office.description}</p>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                        <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs sm:text-sm text-gray-700 font-medium">ساعة</span>
                              {office.previousPricePerHour && Number(office.previousPricePerHour) > Number(office.pricePerHour) && (
                                <span className="mr-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                                  -{Math.round(((Number(office.previousPricePerHour) - Number(office.pricePerHour)) / Number(office.previousPricePerHour)) * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {office.previousPricePerHour && Number(office.previousPricePerHour) > Number(office.pricePerHour) ? (
                              <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs line-through">{Number(office.previousPricePerHour)} ريال</span>
                                <span className="font-bold text-red-600 text-sm sm:text-base">{Number(office.pricePerHour)} ريال</span>
                              </div>
                            ) : (
                              <span className="font-bold text-gray-900 text-sm sm:text-base">{Number(office.pricePerHour)} ريال</span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-100 rounded-md flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs sm:text-sm text-gray-700 font-medium">يوم</span>
                              {office.previousPricePerDay && Number(office.previousPricePerDay) > Number(office.pricePerDay) && (
                                <span className="mr-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                                  -{Math.round(((Number(office.previousPricePerDay) - Number(office.pricePerDay)) / Number(office.previousPricePerDay)) * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {office.previousPricePerDay && Number(office.previousPricePerDay) > Number(office.pricePerDay) ? (
                              <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-sm line-through">{Number(office.previousPricePerDay)} ريال</span>
                                <span className="font-bold text-red-600 text-lg">{Number(office.pricePerDay)} ريال</span>
                                <span className="text-xs text-green-600 font-medium">وفر {Math.round(Number(office.previousPricePerDay) - Number(office.pricePerDay))} ريال</span>
                              </div>
                            ) : (
                              <span className="font-bold text-gray-900 text-lg">{Number(office.pricePerDay)} ريال</span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 sm:p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-emerald-200 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-700 font-medium">شهر</span>
                              {office.previousPricePerMonth && Number(office.previousPricePerMonth) > Number(office.pricePerMonth) && (
                                <span className="mr-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                  -{Math.round(((Number(office.previousPricePerMonth) - Number(office.pricePerMonth)) / Number(office.previousPricePerMonth)) * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {office.previousPricePerMonth && Number(office.previousPricePerMonth) > Number(office.pricePerMonth) ? (
                              <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-sm line-through">{Number(office.previousPricePerMonth)} ريال</span>
                                <span className="font-bold text-red-600 text-lg">{Number(office.pricePerMonth)} ريال</span>
                                <span className="text-xs text-green-600 font-medium">وفر {Math.round(Number(office.previousPricePerMonth) - Number(office.pricePerMonth))} ريال شهرياً</span>
                              </div>
                            ) : (
                              <span className="font-bold text-emerald-700 text-lg">{Number(office.pricePerMonth)} ريال</span>
                            )}
                            <div className="text-xs text-emerald-600 font-medium flex items-center justify-end mt-1">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              أفضل قيمة
                            </div>
                          </div>
                        </div>

                        {(() => {
                          const maxDiscount = Math.max(
                            (office.previousPricePerHour && Number(office.previousPricePerHour) > Number(office.pricePerHour)) ? Math.round(((Number(office.previousPricePerHour) - Number(office.pricePerHour)) / Number(office.previousPricePerHour)) * 100) : 0,
                            (office.previousPricePerDay && Number(office.previousPricePerDay) > Number(office.pricePerDay)) ? Math.round(((Number(office.previousPricePerDay) - Number(office.pricePerDay)) / Number(office.previousPricePerDay)) * 100) : 0,
                            (office.previousPricePerMonth && Number(office.previousPricePerMonth) > Number(office.pricePerMonth)) ? Math.round(((Number(office.previousPricePerMonth) - Number(office.pricePerMonth)) / Number(office.previousPricePerMonth)) * 100) : 0
                          )

                          // حساب أكبر وفر من جميع الباقات باستخدام الأسعار السابقة الفعلية
                          const hourlySavings = (office.previousPricePerHour && Number(office.previousPricePerHour) > Number(office.pricePerHour)) ? Math.round(Number(office.previousPricePerHour) - Number(office.pricePerHour)) : 0
                          const dailySavings = (office.previousPricePerDay && Number(office.previousPricePerDay) > Number(office.pricePerDay)) ? Math.round(Number(office.previousPricePerDay) - Number(office.pricePerDay)) : 0
                          const monthlySavings = (office.previousPricePerMonth && Number(office.previousPricePerMonth) > Number(office.pricePerMonth)) ? Math.round(Number(office.previousPricePerMonth) - Number(office.pricePerMonth)) : 0
                          const maxSavings = Math.max(hourlySavings, dailySavings, monthlySavings)

                          if (maxDiscount > 0) {
                            return (
                              <div className="text-center mt-2 sm:mt-3 space-y-1">
                                <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                                  🔥 خصم {maxDiscount}%
                                </div>
                                {maxSavings > 0 && (
                                  <div className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                    💰 وفر {maxSavings} ريال
                                  </div>
                                )}
                              </div>
                            )
                          } else {
                            return (
                              <div className="text-center mt-2 sm:mt-3">
                                <div className="inline-flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                                  ✨ أسعار مميزة
                                </div>
                              </div>
                            )
                          }
                        })()}
                      </div>

                      <button
                        onClick={() => {
                          handleBookOffice(office)
                          setShowBookingForm(false)
                        }}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 flex items-center justify-center space-x-2 space-x-reverse group-hover:scale-105 mt-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>اختر هذا المكتب</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Packages Modal */}
        <BookingPackagesModal
          isOpen={showPackagesModal}
          office={selectedOffice}
          onClose={() => {
            setShowPackagesModal(false)
            setSelectedOffice(null)
          }}
          onBookingConfirm={handleBookingConfirm}
          loading={bookingLoading}
        />

        {/* Name Registration Modal */}
        <NameRegistrationModal
          isOpen={showNameModal}
          onSubmit={handleSaveName}
          loading={nameLoading}
        />

        {/* Renewal Modal */}
        {showRenewalModal && selectedOffice && (
          <RenewalModal
            isOpen={showRenewalModal}
            subscription={{
              id: 'temp',
              office: selectedOffice,
              duration: 'MONTHLY',
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
              status: 'ACTIVE'
            }}
            onClose={() => {
              setShowRenewalModal(false)
              setSelectedOffice(null)
            }}
            onRenewalConfirm={handleRenewalConfirm}
          />
        )}

        {/* Reward QR Modal */}
        <RewardQRModal
          isOpen={showRewardQR}
          onClose={() => {
            setShowRewardQR(false)
            setSelectedReward(null)
            setRewardQRCode('')
            setRedemptionCode('')
          }}
          reward={selectedReward}
          qrCode={rewardQRCode}
          redemptionCode={redemptionCode}
        />
      </div>

      {/* PWA Prompt */}
      <PWAPrompt />
    </div>
  )
}
