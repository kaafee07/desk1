'use client'

import { useState, useEffect } from 'react'

interface Office {
  id: string
  name: string
  description: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  renewalPricePerHour?: number
  renewalPricePerDay?: number
  renewalPricePerWeek?: number
  renewalPricePerMonth?: number
  discountPercentage: number
  isAvailable: boolean
  officeNumber?: string
  // أسعار سابقة لحساب الخصم
  previousPricePerHour?: number
  previousPricePerDay?: number
  previousPricePerMonth?: number
  // أسعار تجديد سابقة
  previousRenewalPricePerHour?: number
  previousRenewalPricePerDay?: number
  previousRenewalPricePerMonth?: number
}

interface OfficeFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (officeData: Partial<Office>) => Promise<void>
  editingOffice: Office | null
  loading?: boolean
}

export default function OfficeFormModal({
  isOpen,
  onClose,
  onSave,
  editingOffice,
  loading = false
}: OfficeFormModalProps) {
  const [formData, setFormData] = useState({
    officeNumber: '',
    name: '',
    capacity: '',
    pricePerHour: '',
    pricePerDay: '',
    pricePerMonth: '',
    renewalPricePerHour: '',
    renewalPricePerDay: '',
    renewalPricePerMonth: '',
    discountPercentage: '0',
    isAvailable: true,
    // أسعار سابقة
    previousPricePerHour: '',
    previousPricePerDay: '',
    previousPricePerMonth: '',
    // أسعار تجديد سابقة
    previousRenewalPricePerHour: '',
    previousRenewalPricePerDay: '',
    previousRenewalPricePerMonth: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // دالة لحساب نسبة الخصم
  const calculateDiscount = (previousPrice: string, currentPrice: string): number => {
    const prev = parseFloat(previousPrice)
    const curr = parseFloat(currentPrice)
    if (prev > 0 && curr > 0 && prev > curr) {
      return Math.round(((prev - curr) / prev) * 100)
    }
    return 0
  }

  useEffect(() => {
    if (editingOffice) {
      setFormData({
        officeNumber: editingOffice.officeNumber || '',
        name: editingOffice.name,
        capacity: editingOffice.capacity.toString(),
        pricePerHour: editingOffice.pricePerHour.toString(),
        pricePerDay: editingOffice.pricePerDay.toString(),
        pricePerMonth: editingOffice.pricePerMonth.toString(),
        renewalPricePerHour: editingOffice.renewalPricePerHour?.toString() || '',
        renewalPricePerDay: editingOffice.renewalPricePerDay?.toString() || '',
        renewalPricePerMonth: editingOffice.renewalPricePerMonth?.toString() || '',
        discountPercentage: editingOffice.discountPercentage?.toString() || '0',
        isAvailable: editingOffice.isAvailable,
        // أسعار سابقة
        previousPricePerHour: editingOffice.previousPricePerHour?.toString() || '',
        previousPricePerDay: editingOffice.previousPricePerDay?.toString() || '',
        previousPricePerMonth: editingOffice.previousPricePerMonth?.toString() || '',
        // أسعار تجديد سابقة
        previousRenewalPricePerHour: editingOffice.previousRenewalPricePerHour?.toString() || '',
        previousRenewalPricePerDay: editingOffice.previousRenewalPricePerDay?.toString() || '',
        previousRenewalPricePerMonth: editingOffice.previousRenewalPricePerMonth?.toString() || ''
      })
    } else {
      setFormData({
        officeNumber: '',
        name: '',
        capacity: '',
        pricePerHour: '',
        pricePerDay: '',
        pricePerMonth: '',
        renewalPricePerHour: '',
        renewalPricePerDay: '',
        renewalPricePerMonth: '',
        discountPercentage: '0',
        isAvailable: true,
        // أسعار سابقة
        previousPricePerHour: '',
        previousPricePerDay: '',
        previousPricePerMonth: '',
        // أسعار تجديد سابقة
        previousRenewalPricePerHour: '',
        previousRenewalPricePerDay: '',
        previousRenewalPricePerMonth: ''
      })
    }
    setErrors({})
  }, [editingOffice, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.officeNumber.trim()) {
      newErrors.officeNumber = 'رقم المكتب مطلوب'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'اسم المكتب مطلوب'
    }
    if (!formData.capacity || parseInt(formData.capacity) < 1 || isNaN(parseInt(formData.capacity))) {
      newErrors.capacity = 'السعة يجب أن تكون رقم أكبر من 0'
    }
    if (!formData.pricePerHour || parseFloat(formData.pricePerHour) <= 0 || isNaN(parseFloat(formData.pricePerHour))) {
      newErrors.pricePerHour = 'سعر الساعة يجب أن يكون رقم موجب'
    }
    if (!formData.pricePerDay || parseFloat(formData.pricePerDay) <= 0 || isNaN(parseFloat(formData.pricePerDay))) {
      newErrors.pricePerDay = 'سعر اليوم يجب أن يكون رقم موجب'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      // Prepare clean data
      const capacity = parseInt(formData.capacity)
      const pricePerHour = parseFloat(formData.pricePerHour)
      const pricePerDay = parseFloat(formData.pricePerDay)
      const pricePerMonth = formData.pricePerMonth ? parseFloat(formData.pricePerMonth) : pricePerDay * 30
      const discountPercentage = parseFloat(formData.discountPercentage) || 0

      const renewalPricePerHour = formData.renewalPricePerHour ? parseFloat(formData.renewalPricePerHour) : null
      const renewalPricePerDay = formData.renewalPricePerDay ? parseFloat(formData.renewalPricePerDay) : null
      const renewalPricePerMonth = formData.renewalPricePerMonth ? parseFloat(formData.renewalPricePerMonth) : null

      // حساب الأسعار السابقة
      const previousPricePerHour = formData.previousPricePerHour ? parseFloat(formData.previousPricePerHour) : null
      const previousPricePerDay = formData.previousPricePerDay ? parseFloat(formData.previousPricePerDay) : null
      const previousPricePerMonth = formData.previousPricePerMonth ? parseFloat(formData.previousPricePerMonth) : null
      const previousRenewalPricePerHour = formData.previousRenewalPricePerHour ? parseFloat(formData.previousRenewalPricePerHour) : null
      const previousRenewalPricePerDay = formData.previousRenewalPricePerDay ? parseFloat(formData.previousRenewalPricePerDay) : null
      const previousRenewalPricePerMonth = formData.previousRenewalPricePerMonth ? parseFloat(formData.previousRenewalPricePerMonth) : null

      const officeData = {
        officeNumber: formData.officeNumber.trim() || null,
        name: formData.name.trim(),
        description: `مكتب ${formData.name.trim()}`, // وصف تلقائي
        capacity,
        pricePerHour,
        pricePerDay,
        pricePerWeek: pricePerDay * 7, // حساب تلقائي
        pricePerMonth,
        renewalPricePerHour,
        renewalPricePerDay,
        renewalPricePerWeek: renewalPricePerDay ? renewalPricePerDay * 7 : null, // حساب تلقائي
        renewalPricePerMonth,
        discountPercentage,
        isAvailable: formData.isAvailable,
        // أسعار سابقة
        previousPricePerHour,
        previousPricePerDay,
        previousPricePerMonth,
        // أسعار تجديد سابقة
        previousRenewalPricePerHour,
        previousRenewalPricePerDay,
        previousRenewalPricePerMonth
      }

      console.log('📤 Sending office data:', officeData)

      // Validate data one more time before sending
      if (!officeData.name || !officeData.capacity || !officeData.pricePerHour || !officeData.pricePerDay) {
        console.error('❌ Invalid data before sending:', officeData)
        alert('بيانات غير صحيحة. تأكد من ملء جميع الحقول المطلوبة.')
        return
      }

      await onSave(officeData)
      onClose()
    } catch (error) {
      console.error('❌ Error saving office:', error)
      alert('حدث خطأ أثناء حفظ المكتب. حاول مرة أخرى.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingOffice ? 'تعديل المكتب' : 'إضافة مكتب جديد'} 🏢
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Office Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم المكتب *
              </label>
              <input
                type="text"
                value={formData.officeNumber}
                onChange={(e) => handleInputChange('officeNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.officeNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="مثال: A101, B205, C301"
                disabled={saving}
              />
              {errors.officeNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.officeNumber}</p>
              )}
            </div>

            {/* Office Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المكتب *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="مثال: مكتب تنفيذي، قاعة اجتماعات"
                disabled={saving}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>



            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                السعة (عدد الأشخاص) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.capacity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="عدد الأشخاص"
                disabled={saving}
              />
              {errors.capacity && (
                <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>
              )}
            </div>

            {/* Pricing Section */}
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                💰 الأسعار الحالية
              </h4>

              {/* Hourly Pricing */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  ⏰ باقة الساعة
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر السابق (ريال)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.previousPricePerHour}
                      onChange={(e) => handleInputChange('previousPricePerHour', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="اتركه فارغ إذا لم يكن هناك خصم"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر الحالي (ريال) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricePerHour}
                      onChange={(e) => handleInputChange('pricePerHour', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.pricePerHour ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      disabled={saving}
                    />
                    {errors.pricePerHour && (
                      <p className="text-red-500 text-xs mt-1">{errors.pricePerHour}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نسبة الخصم
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                      {formData.previousPricePerHour && formData.pricePerHour ?
                        `${calculateDiscount(formData.previousPricePerHour, formData.pricePerHour)}%` :
                        'لا يوجد خصم'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Pricing */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  📅 باقة اليوم
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر السابق (ريال)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.previousPricePerDay}
                      onChange={(e) => handleInputChange('previousPricePerDay', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="اتركه فارغ إذا لم يكن هناك خصم"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر الحالي (ريال) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricePerDay}
                      onChange={(e) => handleInputChange('pricePerDay', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.pricePerDay ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      disabled={saving}
                    />
                    {errors.pricePerDay && (
                      <p className="text-red-500 text-xs mt-1">{errors.pricePerDay}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نسبة الخصم
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                      {formData.previousPricePerDay && formData.pricePerDay ?
                        `${calculateDiscount(formData.previousPricePerDay, formData.pricePerDay)}%` :
                        'لا يوجد خصم'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Pricing */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  🗓️ باقة الشهر
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر السابق (ريال)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.previousPricePerMonth}
                      onChange={(e) => handleInputChange('previousPricePerMonth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="اتركه فارغ إذا لم يكن هناك خصم"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر الحالي (ريال)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricePerMonth}
                      onChange={(e) => handleInputChange('pricePerMonth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="اتركه فارغ للحساب التلقائي"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نسبة الخصم
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                      {formData.previousPricePerMonth && formData.pricePerMonth ?
                        `${calculateDiscount(formData.previousPricePerMonth, formData.pricePerMonth)}%` :
                        'لا يوجد خصم'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Renewal Pricing Section */}
            <div className="border-t pt-6 mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                🔄 أسعار التجديد (اختيارية)
                <span className="text-sm font-normal text-gray-500 mr-2">
                  - إذا تُركت فارغة، ستُستخدم الأسعار العادية
                </span>
              </h4>

              <div className="space-y-6">
                {/* Renewal Hourly Pricing */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    ⏰ تجديد باقة الساعة
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السعر السابق (ريال)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.previousRenewalPricePerHour}
                        onChange={(e) => handleInputChange('previousRenewalPricePerHour', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="اتركه فارغ إذا لم يكن هناك خصم"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السعر الحالي (ريال)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.renewalPricePerHour}
                        onChange={(e) => handleInputChange('renewalPricePerHour', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="اتركه فارغ لاستخدام السعر العادي"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        نسبة الخصم
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {formData.previousRenewalPricePerHour && formData.renewalPricePerHour ?
                          `${calculateDiscount(formData.previousRenewalPricePerHour, formData.renewalPricePerHour)}%` :
                          'لا يوجد خصم'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Renewal Daily Pricing */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    📅 تجديد باقة اليوم
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السعر السابق (ريال)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.previousRenewalPricePerDay}
                        onChange={(e) => handleInputChange('previousRenewalPricePerDay', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="اتركه فارغ إذا لم يكن هناك خصم"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السعر الحالي (ريال)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.renewalPricePerDay}
                        onChange={(e) => handleInputChange('renewalPricePerDay', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="اتركه فارغ لاستخدام السعر العادي"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        نسبة الخصم
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {formData.previousRenewalPricePerDay && formData.renewalPricePerDay ?
                          `${calculateDiscount(formData.previousRenewalPricePerDay, formData.renewalPricePerDay)}%` :
                          'لا يوجد خصم'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Renewal Monthly Pricing */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    🗓️ تجديد باقة الشهر
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السعر السابق (ريال)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.previousRenewalPricePerMonth}
                        onChange={(e) => handleInputChange('previousRenewalPricePerMonth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="اتركه فارغ إذا لم يكن هناك خصم"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السعر الحالي (ريال)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.renewalPricePerMonth}
                        onChange={(e) => handleInputChange('renewalPricePerMonth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="اتركه فارغ لاستخدام السعر العادي"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        نسبة الخصم
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {formData.previousRenewalPricePerMonth && formData.renewalPricePerMonth ?
                          `${calculateDiscount(formData.previousRenewalPricePerMonth, formData.renewalPricePerMonth)}%` :
                          'لا يوجد خصم'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Discount Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نسبة الخصم (%) 🏷️
              </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercentage}
                  onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  أدخل نسبة الخصم من 0 إلى 100%
                </p>
              </div>

            {/* Availability */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={saving}
              />
              <label htmlFor="isAvailable" className="mr-2 block text-sm text-gray-900">
                المكتب متاح للحجز
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-reverse space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={saving}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'جاري الحفظ...' : (editingOffice ? 'تحديث المكتب' : 'إضافة المكتب')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
