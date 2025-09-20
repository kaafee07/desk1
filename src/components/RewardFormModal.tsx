'use client'

import { useState, useEffect } from 'react'

interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsRequired: number
  type: 'PHYSICAL' | 'TIME_EXTENSION'
  timeValue?: number
  timeUnit?: 'HOURS' | 'DAYS'
  isActive: boolean
}

interface RewardFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (rewardData: Partial<LoyaltyReward>) => Promise<void>
  editingReward: LoyaltyReward | null
  loading?: boolean
}

export default function RewardFormModal({
  isOpen,
  onClose,
  onSave,
  editingReward,
  loading = false
}: RewardFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsRequired: '',
    type: 'PHYSICAL' as 'PHYSICAL' | 'TIME_EXTENSION',
    timeValue: '',
    timeUnit: 'HOURS' as 'HOURS' | 'DAYS',
    isActive: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingReward) {
      setFormData({
        name: editingReward.name,
        description: editingReward.description,
        pointsRequired: editingReward.pointsRequired.toString(),
        type: editingReward.type || 'PHYSICAL',
        timeValue: editingReward.timeValue?.toString() || '',
        timeUnit: editingReward.timeUnit || 'HOURS',
        isActive: editingReward.isActive
      })
    } else {
      setFormData({
        name: '',
        description: '',
        pointsRequired: '',
        type: 'PHYSICAL',
        timeValue: '',
        timeUnit: 'HOURS',
        isActive: true
      })
    }
    setErrors({})
  }, [editingReward, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'اسم المكافأة مطلوب'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'وصف المكافأة مطلوب'
    }
    if (!formData.pointsRequired || parseInt(formData.pointsRequired) < 1 || isNaN(parseInt(formData.pointsRequired))) {
      newErrors.pointsRequired = 'النقاط المطلوبة يجب أن تكون رقم أكبر من 0'
    }

    // Validate time extension fields
    if (formData.type === 'TIME_EXTENSION') {
      if (!formData.timeValue || parseInt(formData.timeValue) < 1 || isNaN(parseInt(formData.timeValue))) {
        newErrors.timeValue = 'قيمة الوقت يجب أن تكون رقم أكبر من 0'
      }
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
      const pointsRequired = parseInt(formData.pointsRequired)

      const rewardData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        pointsRequired,
        type: formData.type,
        isActive: formData.isActive
      }

      // Add time extension fields if needed
      if (formData.type === 'TIME_EXTENSION') {
        rewardData.timeValue = parseInt(formData.timeValue)
        rewardData.timeUnit = formData.timeUnit
      }

      console.log('📤 Sending reward data:', rewardData)
      
      // Validate data one more time before sending
      if (!rewardData.name || !rewardData.description || !rewardData.pointsRequired) {
        console.error('❌ Invalid data before sending:', rewardData)
        alert('بيانات غير صحيحة. تأكد من ملء جميع الحقول المطلوبة.')
        return
      }
      
      await onSave(rewardData)
      onClose()
    } catch (error) {
      console.error('❌ Error saving reward:', error)
      alert('حدث خطأ أثناء حفظ المكافأة. حاول مرة أخرى.')
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
              {editingReward ? 'تعديل المكافأة' : 'إضافة مكافأة جديدة'} 🎁
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
            {/* Reward Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المكافأة *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="مثال: قهوة مجانية، خصم 20%، وجبة غداء"
                disabled={saving}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                وصف المكافأة *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="وصف تفصيلي للمكافأة وشروط الاستخدام"
                disabled={saving}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Points Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                النقاط المطلوبة *
              </label>
              <input
                type="number"
                min="1"
                value={formData.pointsRequired}
                onChange={(e) => handleInputChange('pointsRequired', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.pointsRequired ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="عدد النقاط المطلوبة للحصول على المكافأة"
                disabled={saving}
              />
              {errors.pointsRequired && (
                <p className="text-red-500 text-xs mt-1">{errors.pointsRequired}</p>
              )}
            </div>

            {/* Reward Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع المكافأة *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              >
                <option value="PHYSICAL">🛍️ ملموسة (تحتاج تأكيد من الكاشير)</option>
                <option value="TIME_EXTENSION">⏰ إضافة وقت للاشتراك</option>
              </select>
            </div>

            {/* Time Extension Fields */}
            {formData.type === 'TIME_EXTENSION' && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-blue-900">إعدادات إضافة الوقت</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      قيمة الوقت *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.timeValue}
                      onChange={(e) => handleInputChange('timeValue', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.timeValue ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="مثال: 1، 2، 3"
                      disabled={saving}
                    />
                    {errors.timeValue && (
                      <p className="text-red-500 text-xs mt-1">{errors.timeValue}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وحدة الوقت *
                    </label>
                    <select
                      value={formData.timeUnit}
                      onChange={(e) => handleInputChange('timeUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={saving}
                    >
                      <option value="HOURS">ساعات</option>
                      <option value="DAYS">أيام</option>
                    </select>
                  </div>
                </div>

                <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                  💡 سيتم إضافة {formData.timeValue || '؟'} {formData.timeUnit === 'HOURS' ? 'ساعة' : 'يوم'} لاشتراك العميل الحالي
                </div>
              </div>
            )}

            {/* Is Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={saving}
              />
              <label htmlFor="isActive" className="mr-2 block text-sm text-gray-900">
                المكافأة متاحة للاستبدال
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
                {saving ? 'جاري الحفظ...' : (editingReward ? 'تحديث المكافأة' : 'إضافة المكافأة')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
