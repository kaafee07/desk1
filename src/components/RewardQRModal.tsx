'use client'

// ...existing code...
import QRCode from 'react-qr-code'

interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'PHYSICAL' | 'TIME_EXTENSION'
  timeValue?: number
  timeUnit?: 'HOURS' | 'DAYS'
}

interface RewardQRModalProps {
  isOpen: boolean
  onClose: () => void
  reward: LoyaltyReward | null
  qrCode: string
  redemptionCode: string
}

export default function RewardQRModal({ 
  isOpen, 
  onClose, 
  reward, 
  qrCode, 
  redemptionCode 
}: RewardQRModalProps) {
  if (!isOpen || !reward) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-green-600 mb-4">
            تم استبدال المكافأة بنجاح!
          </h3>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-4">
              اذهب إلى الكاشير وأظهر هذا الكود أو امسح QR Code
            </p>
            
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
              <p className="text-3xl font-bold text-gray-900 mb-2">{redemptionCode}</p>
              <p className="text-sm text-gray-600">كود الاستبدال</p>
            </div>

            <div className="bg-white p-4 rounded-lg border mb-4">
              <QRCode value={qrCode} size={200} className="mx-auto" />
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>🎁 المكافأة: {reward.name}</p>
              <p>💰 النقاط المستخدمة: {reward.pointsCost} نقطة</p>
              <p>📝 الوصف: {reward.description}</p>
              <p>⏰ صالح لمدة 3 دقائق</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            ✅ تم
          </button>
        </div>
      </div>
    </div>
  )
}
