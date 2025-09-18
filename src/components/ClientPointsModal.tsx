'use client'

import { useState, useEffect } from 'react'

interface Client {
  id: string
  phone: string
  username: string | null
  loyaltyPoints: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    bookings: number
    subscriptions: number
    redemptions: number
  }
}

interface ClientPointsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (clientData: { id: string; loyaltyPoints: number; action: string }) => Promise<void>
  client: Client | null
  loading?: boolean
}

export default function ClientPointsModal({
  isOpen,
  onClose,
  onSave,
  client,
  loading = false
}: ClientPointsModalProps) {
  const [formData, setFormData] = useState({
    points: '',
    action: 'add' // 'add', 'subtract', 'set'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (client) {
      setFormData({
        points: '',
        action: 'add'
      })
    }
    setErrors({})
  }, [client, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.points || parseInt(formData.points) < 1 || isNaN(parseInt(formData.points))) {
      newErrors.points = 'عدد النقاط يجب أن يكون رقم أكبر من 0'
    }

    if (formData.action === 'subtract' && client) {
      const pointsToSubtract = parseInt(formData.points)
      if (pointsToSubtract > client.loyaltyPoints) {
        newErrors.points = `لا يمكن خصم ${pointsToSubtract} نقطة. العميل لديه ${client.loyaltyPoints} نقطة فقط`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !client) return

    setSaving(true)
    try {
      const pointsValue = parseInt(formData.points)

      const clientData = {
        id: client.id,
        loyaltyPoints: pointsValue,
        action: formData.action
      }

      console.log('📤 Sending client points data:', clientData)
      
      await onSave(clientData)
      onClose()
    } catch (error) {
      console.error('❌ Error updating client points:', error)
      alert('حدث خطأ أثناء تحديث نقاط العميل. حاول مرة أخرى.')
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

  const getPreviewPoints = () => {
    if (!client || !formData.points || isNaN(parseInt(formData.points))) {
      return client?.loyaltyPoints || 0
    }

    const pointsValue = parseInt(formData.points)
    const currentPoints = client.loyaltyPoints

    switch (formData.action) {
      case 'add':
        return currentPoints + pointsValue
      case 'subtract':
        return Math.max(0, currentPoints - pointsValue)
      case 'set':
        return pointsValue
      default:
        return currentPoints
    }
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              تعديل نقاط العميل 💎
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

          {/* Client Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">العميل:</span>
              <span className="font-medium">{client.username || client.phone}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">رقم الهاتف:</span>
              <span className="font-medium">{client.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">النقاط الحالية:</span>
              <span className="font-bold text-blue-600">{client.loyaltyPoints} نقطة</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع العملية *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="add"
                    checked={formData.action === 'add'}
                    onChange={(e) => handleInputChange('action', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={saving}
                  />
                  <span className="mr-2 text-sm text-gray-900">إضافة نقاط ➕</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="subtract"
                    checked={formData.action === 'subtract'}
                    onChange={(e) => handleInputChange('action', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={saving}
                  />
                  <span className="mr-2 text-sm text-gray-900">خصم نقاط ➖</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="set"
                    checked={formData.action === 'set'}
                    onChange={(e) => handleInputChange('action', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={saving}
                  />
                  <span className="mr-2 text-sm text-gray-900">تحديد النقاط 🎯</span>
                </label>
              </div>
            </div>

            {/* Points Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.action === 'add' ? 'عدد النقاط المراد إضافتها' : 
                 formData.action === 'subtract' ? 'عدد النقاط المراد خصمها' : 
                 'إجمالي النقاط الجديد'} *
              </label>
              <input
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => handleInputChange('points', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.points ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل عدد النقاط"
                disabled={saving}
              />
              {errors.points && (
                <p className="text-red-500 text-xs mt-1">{errors.points}</p>
              )}
            </div>

            {/* Preview */}
            {formData.points && !errors.points && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">النقاط بعد التحديث:</span>
                  <span className="font-bold text-blue-800">{getPreviewPoints()} نقطة</span>
                </div>
              </div>
            )}

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
                {saving ? 'جاري التحديث...' : 'تحديث النقاط'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
