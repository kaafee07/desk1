'use client'

import { useState } from 'react'
// import QRCode from 'react-qr-code' // Temporarily disabled for build

interface Office {
  id: string
  name: string
  description: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerMonth: number
  renewalPricePerHour?: number
  renewalPricePerDay?: number
  renewalPricePerMonth?: number
  discountPercentage: number
  // أسعار سابقة لحساب الخصم
  previousPricePerHour?: number | null
  previousPricePerDay?: number | null
  previousPricePerMonth?: number | null
  // أسعار تجديد سابقة
  previousRenewalPricePerHour?: number | null
  previousRenewalPricePerDay?: number | null
  previousRenewalPricePerMonth?: number | null
}

interface Subscription {
  id: string
  office: Office
  duration: string
  startDate: string
  endDate: string
  status: string
}

interface RenewalModalProps {
  isOpen: boolean
  subscription: Subscription
  onClose: () => void
  onRenewalConfirm: (packageType: string) => void
}

export default function RenewalModal({ isOpen, subscription, onClose, onRenewalConfirm }: RenewalModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [showPaymentCode, setShowPaymentCode] = useState(false)
  const [paymentCode, setPaymentCode] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const office = subscription.office

  // حساب أسعار التجديد - استخدام أسعار التجديد إذا كانت متوفرة
  const hourlyPrice = office.renewalPricePerHour || office.pricePerHour
  const dailyPrice = office.renewalPricePerDay || office.pricePerDay
  const monthlyPrice = office.renewalPricePerMonth || office.pricePerMonth

  // حساب الخصومات للتجديد
  const calculateRenewalDiscount = (previousRenewalPrice: number | null, previousPrice: number | null, currentRenewalPrice: number, currentPrice: number): number => {
    // أولوية للسعر السابق للتجديد، ثم السعر السابق العادي
    const previousPriceToUse = previousRenewalPrice || previousPrice
    if (previousPriceToUse && previousPriceToUse > 0 && currentRenewalPrice > 0 && previousPriceToUse > currentRenewalPrice) {
      return Math.round(((previousPriceToUse - currentRenewalPrice) / previousPriceToUse) * 100)
    }
    return 0
  }

  const hourlyDiscount = calculateRenewalDiscount(office.previousRenewalPricePerHour, office.previousPricePerHour, hourlyPrice, office.pricePerHour)
  const dailyDiscount = calculateRenewalDiscount(office.previousRenewalPricePerDay, office.previousPricePerDay, dailyPrice, office.pricePerDay)
  const monthlyDiscount = calculateRenewalDiscount(office.previousRenewalPricePerMonth, office.previousPricePerMonth, monthlyPrice, office.pricePerMonth)

  // Calculate remaining time
  const getRemainingTime = () => {
    const now = new Date()
    const endDate = new Date(subscription.endDate)
    const diffMs = endDate.getTime() - now.getTime()
    
    if (diffMs <= 0) return 'منتهي الصلاحية'
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffDays > 0) {
      return `${diffDays} يوم و ${diffHours} ساعة`
    } else {
      return `${diffHours} ساعة`
    }
  }

  // Calculate new end time
  const getNewEndTime = (packageType: string) => {
    const currentEndTime = new Date(subscription.endDate)
    let extensionHours = 0
    
    switch (packageType) {
      case 'hourly':
        extensionHours = 1
        break
      case 'daily':
        extensionHours = 24
        break
      case 'monthly':
        extensionHours = 24 * 30
        break
    }
    
    const newEndTime = new Date(currentEndTime.getTime() + (extensionHours * 60 * 60 * 1000))
    return newEndTime
  }

  const handleRenewal = async () => {
    if (!selectedPackage) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/client/renewal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: selectedPackage
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentCode(data.paymentCode)
        setShowPaymentCode(true)
      } else {
        const errorData = await response.json()
        alert(errorData.error)
      }
    } catch (error) {
      console.error('❌ Error creating renewal:', error)
      alert('حدث خطأ أثناء إنشاء طلب التجديد')
    } finally {
      setLoading(false)
    }
  }

  const getPackagePrice = (packageType: string) => {
    switch (packageType) {
      case 'hourly':
        return hourlyPrice
      case 'daily':
        return dailyPrice
      case 'monthly':
        return monthlyPrice
      default:
        return 0
    }
  }

  const getPackageName = (packageType: string) => {
    switch (packageType) {
      case 'hourly':
        return 'ساعة'
      case 'daily':
        return 'يوم'
      case 'monthly':
        return 'شهر'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🔄 تجديد الاشتراك</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {!showPaymentCode ? (
            <>
              {/* Current Subscription Info */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">الاشتراك الحالي</h3>
                <p className="text-blue-800">📍 {office.name}</p>
                <p className="text-blue-700 text-sm">⏰ متبقي: {getRemainingTime()}</p>
                <p className="text-blue-700 text-sm">📅 ينتهي في: {new Date(subscription.endDate).toLocaleString('ar-SA')}</p>
              </div>

              {/* Package Selection */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">اختر باقة التجديد:</h3>
                
                {/* Hour Package */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPackage === 'hourly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackage('hourly')}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">⏰ باقة الساعة</h4>
                      <p className="text-sm text-gray-600">تمديد لمدة ساعة واحدة</p>
                      {selectedPackage === 'hourly' && (
                        <p className="text-sm text-green-600 mt-1">
                          ستنتهي في: {getNewEndTime('hourly').toLocaleString('ar-SA')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {hourlyDiscount > 0 ? (
                        <div>
                          <p className="text-sm text-gray-400 line-through">
                            {office.previousRenewalPricePerHour || office.previousPricePerHour} ريال
                          </p>
                          <p className="text-2xl font-bold text-red-600">{hourlyPrice.toFixed(0)} ريال</p>
                          <p className="text-xs text-green-600">
                            🔄 وفر {Math.round((office.previousRenewalPricePerHour || office.previousPricePerHour || 0) - hourlyPrice)} ريال
                          </p>
                          <p className="text-xs text-blue-600">خصم {hourlyDiscount}%</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-green-600">{hourlyPrice.toFixed(0)} ريال</p>
                          {office.renewalPricePerHour && office.renewalPricePerHour < office.pricePerHour && (
                            <p className="text-xs text-blue-600">🔄 سعر التجديد</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Day Package */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPackage === 'daily' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackage('daily')}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">📅 باقة اليوم</h4>
                      <p className="text-sm text-gray-600">تمديد لمدة يوم كامل</p>
                      {selectedPackage === 'daily' && (
                        <p className="text-sm text-green-600 mt-1">
                          ستنتهي في: {getNewEndTime('daily').toLocaleString('ar-SA')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {dailyDiscount > 0 ? (
                        <div>
                          <p className="text-sm text-gray-400 line-through">
                            {office.previousRenewalPricePerDay || office.previousPricePerDay} ريال
                          </p>
                          <p className="text-2xl font-bold text-red-600">{dailyPrice.toFixed(0)} ريال</p>
                          <p className="text-xs text-green-600">
                            🔄 وفر {Math.round((office.previousRenewalPricePerDay || office.previousPricePerDay || 0) - dailyPrice)} ريال
                          </p>
                          <p className="text-xs text-blue-600">خصم {dailyDiscount}%</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-green-600">{dailyPrice.toFixed(0)} ريال</p>
                          {office.renewalPricePerDay && office.renewalPricePerDay < office.pricePerDay && (
                            <p className="text-xs text-blue-600">🔄 سعر التجديد</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Month Package */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPackage === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackage('monthly')}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">📆 باقة الشهر</h4>
                      <p className="text-sm text-gray-600">تمديد لمدة شهر كامل</p>
                      {selectedPackage === 'monthly' && (
                        <p className="text-sm text-green-600 mt-1">
                          ستنتهي في: {getNewEndTime('monthly').toLocaleString('ar-SA')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {monthlyDiscount > 0 ? (
                        <div>
                          <p className="text-sm text-gray-400 line-through">
                            {office.previousRenewalPricePerMonth || office.previousPricePerMonth} ريال
                          </p>
                          <p className="text-2xl font-bold text-red-600">{monthlyPrice.toFixed(0)} ريال</p>
                          <p className="text-xs text-green-600">
                            🔄 وفر {Math.round((office.previousRenewalPricePerMonth || office.previousPricePerMonth || 0) - monthlyPrice)} ريال
                          </p>
                          <p className="text-xs text-blue-600">خصم {monthlyDiscount}%</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-green-600">{monthlyPrice.toFixed(0)} ريال</p>
                          {office.renewalPricePerMonth && office.renewalPricePerMonth < office.pricePerMonth && (
                            <p className="text-xs text-blue-600">🔄 سعر التجديد</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleRenewal}
                  disabled={!selectedPackage || loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ جاري الإنشاء...' : '🔄 تجديد الاشتراك'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ❌ إلغاء
                </button>
              </div>
            </>
          ) : (
            /* Payment Code Display */
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-green-600 mb-4">
                تم إنشاء طلب التجديد بنجاح!
              </h3>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  اذهب إلى الكاشير وأظهر هذا الكود أو امسح QR Code
                </p>
                
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{paymentCode}</p>
                  <p className="text-sm text-gray-600">كود الدفع</p>
                </div>

                <div className="bg-white p-4 rounded-lg border mb-4">
                  <QRCode value={paymentCode} size={200} className="mx-auto" />
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>📦 الباقة: {getPackageName(selectedPackage)}</p>
                  <p>💰 المبلغ: {getPackagePrice(selectedPackage).toFixed(0)} ريال</p>
                  <p>🏢 المكتب: {office.name}</p>
                  <p>⏰ صالح لمدة 10 دقائق</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ تم
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
