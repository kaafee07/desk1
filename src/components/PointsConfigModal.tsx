'use client'

import { useState, useEffect } from 'react'

interface PointsConfig {
  id: string
  action: string
  points: number
  description: string
  isActive: boolean
}

interface PointsConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { id: string; points: number; description: string; isActive: boolean }) => void
  config: PointsConfig | null
}

export default function PointsConfigModal({ isOpen, onClose, onSave, config }: PointsConfigModalProps) {
  const [formData, setFormData] = useState({
    points: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    if (config) {
      setFormData({
        points: config.points.toString(),
        description: config.description || '',
        isActive: config.isActive
      })
    }
  }, [config])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!config || !formData.points) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    onSave({
      id: config.id,
      points: parseInt(formData.points),
      description: formData.description,
      isActive: formData.isActive
    })
  }

  const getActionDisplayName = (action: string) => {
    const actionNames: Record<string, string> = {
      'HOURLY_BOOKING': 'حجز باقة الساعة',
      'DAILY_BOOKING': 'حجز باقة اليوم',
      'MONTHLY_BOOKING': 'حجز باقة الشهر',
      'HOURLY_RENEWAL': 'تجديد باقة الساعة',
      'DAILY_RENEWAL': 'تجديد باقة اليوم',
      'MONTHLY_RENEWAL': 'تجديد باقة الشهر',
    }
    return actionNames[action] || action
  }

  if (!isOpen || !config) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              تعديل إعدادات النقاط
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✖️
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الإجراء
              </label>
              <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
                {getActionDisplayName(config.action)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عدد النقاط *
              </label>
              <input
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="مثال: 500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="وصف الإجراء"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="mr-2 block text-sm text-gray-900">
                نشط
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                حفظ التغييرات
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
