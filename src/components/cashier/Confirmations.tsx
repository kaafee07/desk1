import { BookingDetails, LoyaltyDetails } from '@/types/cashier'

interface PaymentConfirmationProps {
  booking: BookingDetails
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  booking,
  onConfirm,
  onCancel,
  isProcessing
}) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">تأكيد عملية الحجز</h3>
      <div className="space-y-4">
        <div className="text-gray-600">
          <p>العميل: {booking.user.username}</p>
          <p>رقم الجوال: {booking.user.phone}</p>
          <p>المكتب: {booking.office.name}</p>
          <p>رقم المكتب: {booking.office.officeNumber}</p>
          <p>المدة: {booking.duration}</p>
          <p>المبلغ: {booking.totalPrice} ريال</p>
        </div>
        <div className="flex justify-end space-x-reverse space-x-4">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={onCancel}
            disabled={isProcessing}
          >
            إلغاء
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'جاري التأكيد...' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface LoyaltyConfirmationProps {
  redemption: LoyaltyDetails
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

export const LoyaltyConfirmation: React.FC<LoyaltyConfirmationProps> = ({
  redemption,
  onConfirm,
  onCancel,
  isProcessing
}) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">تأكيد استخدام النقاط</h3>
      <div className="space-y-4">
        <div className="text-gray-600">
          <p>العميل: {redemption.user.username}</p>
          <p>رقم الجوال: {redemption.user.phone}</p>
          <p>المكافأة: {redemption.reward.name}</p>
          <p>النقاط المطلوبة: {redemption.reward.pointsRequired}</p>
          <p>النقاط الحالية: {redemption.user.loyaltyPoints}</p>
        </div>
        <div className="flex justify-end space-x-reverse space-x-4">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={onCancel}
            disabled={isProcessing}
          >
            إلغاء
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'جاري التأكيد...' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  )
}