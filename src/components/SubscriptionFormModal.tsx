'use client'

import { useState, useEffect } from 'react'

interface Office {
  id: string
  name: string
  officeNumber: string | null
  capacity: number
}

interface Client {
  id: string
  phone: string
  username: string | null
  loyaltyPoints: number
}

interface Subscription {
  id: string
  userId: string
  officeId: string
  duration: string
  startDate: string
  endDate: string
  totalPrice: number
  status: string
  user: Client
  office: Office
}

interface SubscriptionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (subscriptionData: any) => Promise<void>
  editingSubscription: Subscription | null
  clients: Client[]
  offices: Office[]
  loading?: boolean
}

export default function SubscriptionFormModal({
  isOpen,
  onClose,
  onSave,
  editingSubscription,
  clients,
  offices,
  loading = false
}: SubscriptionFormModalProps) {
  const [formData, setFormData] = useState({
    userId: '',
    officeId: '',
    packageType: 'MONTHLY', // This will be mapped to duration
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    totalPrice: '1000'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingSubscription) {
      setFormData({
        userId: editingSubscription.userId,
        officeId: editingSubscription.officeId,
        packageType: editingSubscription.duration, // Map duration to packageType for form
        startDate: editingSubscription.startDate.split('T')[0],
        endDate: editingSubscription.endDate.split('T')[0],
        status: editingSubscription.status,
        totalPrice: editingSubscription.totalPrice.toString()
      })
    } else {
      // Set default dates (start today, end in 30 days)
      const today = new Date()
      const nextMonth = new Date(today)
      nextMonth.setMonth(today.getMonth() + 1)
      
      setFormData({
        userId: '',
        officeId: '',
        packageType: 'HOURLY',
        startDate: today.toISOString().split('T')[0],
        endDate: nextMonth.toISOString().split('T')[0],
        status: 'ACTIVE',
        totalPrice: '1000'
      })
    }
    setErrors({})
  }, [editingSubscription, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.userId) {
      newErrors.userId = 'يجب اختيار العميل'
    }
    if (!formData.officeId) {
      newErrors.officeId = 'يجب اختيار المكتب'
    }
    if (!formData.startDate) {
      newErrors.startDate = 'تاريخ البداية مطلوب'
    }
    if (!formData.endDate) {
      newErrors.endDate = 'تاريخ النهاية مطلوب'
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      const subscriptionData = {
        ...formData,
        ...(editingSubscription && { id: editingSubscription.id })
      }

      console.log('📤 Sending subscription data:', subscriptionData)
      
      await onSave(subscriptionData)
      onClose()
    } catch (error) {
      console.error('❌ Error saving subscription:', error)
      alert('حدث خطأ أثناء حفظ الاشتراك. حاول مرة أخرى.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
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
              {editingSubscription ? 'تعديل الاشتراك' : 'إضافة اشتراك جديد'} 📋
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
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العميل *
              </label>
              <select
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.userId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={saving || !!editingSubscription}
              >
                <option value="">اختر العميل</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.username || client.phone} - {client.phone}
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className="text-red-500 text-xs mt-1">{errors.userId}</p>
              )}
            </div>

            {/* Office Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المكتب *
              </label>
              <select
                value={formData.officeId}
                onChange={(e) => handleInputChange('officeId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.officeId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={saving}
              >
                <option value="">اختر المكتب</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.officeNumber || office.name} - {office.name} (سعة: {office.capacity})
                  </option>
                ))}
              </select>
              {errors.officeId && (
                <p className="text-red-500 text-xs mt-1">{errors.officeId}</p>
              )}
            </div>

            {/* Package Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع الباقة *
              </label>
              <select
                value={formData.packageType}
                onChange={(e) => handleInputChange('packageType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              >
                <option value="HOURLY">ساعة</option>
                <option value="DAILY">يوم</option>
                <option value="MONTHLY">شهر</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البداية *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={saving}
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ النهاية *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={saving}
              />
              {errors.endDate && (
                <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
              )}
            </div>

            {/* Total Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                السعر الإجمالي (ريال) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.totalPrice}
                onChange={(e) => handleInputChange('totalPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
                placeholder="1000"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                حالة الاشتراك *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              >
                <option value="ACTIVE">نشط</option>
                <option value="EXPIRED">منتهي</option>
                <option value="CANCELLED">ملغي</option>
              </select>
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
                {saving ? 'جاري الحفظ...' : (editingSubscription ? 'تحديث الاشتراك' : 'إضافة الاشتراك')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
