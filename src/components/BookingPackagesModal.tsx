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
  pricePerMonth?: number
  discountPercentage: number
  // خصومات منفصلة لكل نوع باقة
  hourlyDiscount?: number
  dailyDiscount?: number
  monthlyDiscount?: number
  // أسعار سابقة لحساب الخصم
  previousPricePerHour?: number | null
  previousPricePerDay?: number | null
  previousPricePerMonth?: number | null
}

interface BookingPackage {
  type: 'hour' | 'day' | 'month'
  name: string
  duration: string
  price: number
  description: string
  icon: string
}

interface BookingPackagesModalProps {
  isOpen: boolean
  office: Office | null
  onClose: () => void
  onBookingConfirm: (packageType: string, office: Office) => Promise<string | null>
  loading?: boolean
}

export default function BookingPackagesModal({ 
  isOpen, 
  office, 
  onClose, 
  onBookingConfirm,
  loading = false 
}: BookingPackagesModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<BookingPackage | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentCode, setPaymentCode] = useState<string>('')

  if (!isOpen || !office) return null

  // Use the monthly price from database
  const monthlyPrice = office.pricePerMonth

  const packages: BookingPackage[] = [
    {
      type: 'hour',
      name: 'باقة الساعة',
      duration: '1 ساعة',
      price: office.pricePerHour,
      description: 'مثالية للاجتماعات القصيرة والعمل السريع',
      icon: '⏰'
    },
    {
      type: 'day',
      name: 'باقة اليوم',
      duration: '1 يوم كامل',
      price: office.pricePerDay,
      description: 'مناسبة للعمل طوال اليوم مع مرونة كاملة',
      icon: '📅'
    },
    {
      type: 'month',
      name: 'باقة الشهر',
      duration: '30 يوم',
      price: monthlyPrice,
      description: 'الأفضل للعمل المستمر بأفضل قيمة',
      icon: '📆'
    }
  ]

  const handlePackageSelect = (pkg: BookingPackage) => {
    setSelectedPackage(pkg)
  }

  const handleConfirmBooking = async () => {
    if (!selectedPackage) return

    try {
      // Call the parent callback which handles the API call and returns the real payment code
      const realPaymentCode = await onBookingConfirm(selectedPackage.type, office)

      if (realPaymentCode) {
        setPaymentCode(realPaymentCode)
        setShowPayment(true)
      } else {
        console.error('No payment code received from server')
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
    }
  }

  const handlePaymentComplete = () => {
    setShowPayment(false)
    setSelectedPackage(null)
    setPaymentCode('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        
        {!showPayment ? (
          // Package Selection View
          <>
            {/* Header - Fixed */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">اختر باقة الحجز</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    المكتب: <span className="font-medium">{office.name}</span>
                    {office.discountPercentage > 0 && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        🏷️ خصم {office.discountPercentage}%
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.type}
                    onClick={() => handlePackageSelect(pkg)}
                    className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedPackage?.type === pkg.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl mb-2">{pkg.icon}</div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                        {pkg.name}
                      </h4>
                    <div className="mb-2">
                      {(() => {
                        // تحديد السعر السابق حسب نوع الباقة وحساب الخصم
                        let previousPrice = null

                        if (pkg.type === 'hour') {
                          previousPrice = office.previousPricePerHour
                        } else if (pkg.type === 'day') {
                          previousPrice = office.previousPricePerDay
                        } else if (pkg.type === 'month') {
                          previousPrice = office.previousPricePerMonth
                        }

                        // تحقق من وجود خصم (السعر السابق أكبر من السعر الحالي)
                        const hasDiscount = previousPrice && Number(previousPrice) > Number(pkg.price)

                        if (hasDiscount) {
                          return (
                            <div className="text-center">
                              <div className="text-sm text-gray-400 line-through mb-1">
                                {Number(previousPrice)} ريال
                              </div>
                              <div className="text-2xl font-bold text-red-600">
                                {Number(pkg.price)} ريال
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                وفر {Math.round(Number(previousPrice) - Number(pkg.price))} ريال
                              </div>
                            </div>
                          )
                        } else {
                          return (
                            <div className="text-lg sm:text-xl font-bold text-blue-600">
                              {Number(pkg.price)} ريال
                            </div>
                          )
                        }
                      })()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">
                        {pkg.duration}
                      </div>
                      <p className="text-xs text-gray-500 mb-2 sm:mb-3 leading-tight">
                        {pkg.description}
                      </p>

                      {pkg.type === 'month' && (
                        <div className="mb-2">
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            أفضل قيمة
                          </span>
                        </div>
                      )}

                    {(() => {
                      // حساب الخصم من الأسعار السابقة حسب نوع الباقة
                      let previousPrice = null

                      if (pkg.type === 'hour') {
                        previousPrice = office.previousPricePerHour
                      } else if (pkg.type === 'day') {
                        previousPrice = office.previousPricePerDay
                      } else if (pkg.type === 'month') {
                        previousPrice = office.previousPricePerMonth
                      }

                      // حساب نسبة الخصم
                      const hasDiscount = previousPrice && Number(previousPrice) > Number(pkg.price)
                      const discountPercentage = hasDiscount ? Math.round(((Number(previousPrice) - Number(pkg.price)) / Number(previousPrice)) * 100) : 0

                      return hasDiscount && (
                        <div>
                          <span className="inline-block bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            🔥 خصم {discountPercentage}%
                          </span>
                        </div>
                      )
                    })()}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPackage && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">ملخص الحجز:</h4>
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <p>المكتب: <span className="font-medium">{office.name}</span></p>
                    <p>الباقة: <span className="font-medium">{selectedPackage.name}</span></p>
                    <p>المدة: <span className="font-medium">{selectedPackage.duration}</span></p>
                    <p>السعر:
                    {(() => {
                      // تحديد السعر السابق حسب نوع الباقة المختارة
                      let previousPrice = null

                      if (selectedPackage.type === 'hour') {
                        previousPrice = office.previousPricePerHour
                      } else if (selectedPackage.type === 'day') {
                        previousPrice = office.previousPricePerDay
                      } else if (selectedPackage.type === 'month') {
                        previousPrice = office.previousPricePerMonth
                      }

                      // تحقق من وجود خصم
                      const hasDiscount = previousPrice && Number(previousPrice) > Number(selectedPackage.price)

                      if (hasDiscount) {
                        return (
                          <span>
                            <span className="text-gray-400 line-through text-sm mr-2">{Number(previousPrice)} ريال</span>
                            <span className="font-medium text-red-600">{Number(selectedPackage.price)} ريال</span>
                            <span className="text-green-600 text-xs mr-2">(وفر {Math.round(Number(previousPrice) - Number(selectedPackage.price))} ريال)</span>
                          </span>
                        )
                      } else {
                        return <span className="font-medium text-blue-600">{Number(selectedPackage.price)} ريال</span>
                      }
                    })()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 order-2 sm:order-1"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={!selectedPackage || loading}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium order-1 sm:order-2"
                >
                  {loading ? 'جاري المعالجة...' : 'اختر هذا المكتب'}
                </button>
              </div>
            </div>
          </>
        ) : (
          // Payment QR Code View - Updated to match RenewalModal design
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-green-600 mb-4">
              تم إنشاء طلب الحجز بنجاح!
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
                <div className="w-[200px] h-[200px] bg-gray-200 flex items-center justify-center text-gray-500 mx-auto">
                  QR Code Placeholder
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>📦 الباقة: {selectedPackage?.name}</p>
                <p>💰 المبلغ: {selectedPackage?.price} ريال</p>
                <p>🏢 المكتب: {office.name}</p>
                <p>⏰ صالح لمدة 10 دقائق</p>
              </div>
            </div>

            <button
              onClick={handlePaymentComplete}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              ✅ تم
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
