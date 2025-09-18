export interface CreateSubscriptionData {
  userId: string
  officeId: string
  packageType: string
  startDate: string
  endDate: string
  status: string
  totalPrice: string
}

export interface SubscriptionFormData extends Partial<CreateSubscriptionData> {
  id?: string
}