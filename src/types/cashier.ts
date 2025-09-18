export interface BookingDetails {
  id: string
  bookingCode: string
  user: {
    phone: string
    username: string
  }
  office: {
    name: string
    officeNumber: string
  }
  totalPrice: number
  status: string
  duration: string
  startTime: string
  endTime: string
  isRenewal: boolean
}

export interface LoyaltyDetails {
  userId: string
  rewardId: string
  user: {
    phone: string
    username: string
    loyaltyPoints: number
  }
  reward: {
    name: string
    pointsRequired: number
  }
}