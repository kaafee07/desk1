export interface PointsConfigUpdateResponse {
  message?: string
  success: boolean
  error?: string
}

export interface ErrorResponse {
  message: string
  error?: string
}

export type TabId = 'dashboard' | 'offices' | 'subscriptions' | 'rewards' | 'points-config' | 'client-points'

export interface TabItem {
  id: TabId
  label: string
}