import { prisma } from './prisma'

export async function getPointsForAction(action: string): Promise<number> {
  try {
    const config = await prisma.pointsConfig.findUnique({
      where: { 
        action,
      },
    })

    if (config && config.isActive) {
      return config.points
    }

    // Fallback to default values if config not found
    const defaultPoints: Record<string, number> = {
      'HOURLY_BOOKING': 10,
      'DAILY_BOOKING': 500,
      'MONTHLY_BOOKING': 1000,
      'HOURLY_RENEWAL': 100,
      'DAILY_RENEWAL': 300,
      'MONTHLY_RENEWAL': 800,
    }

    return defaultPoints[action] || 0
  } catch (error) {
    console.error('Error getting points for action:', action, error)
    return 0
  }
}

export function getActionFromBooking(duration: string, isRenewal: boolean = false): string {
  const prefix = isRenewal ? 'RENEWAL' : 'BOOKING'
  
  switch (duration.toUpperCase()) {
    case 'HOURLY':
      return `HOURLY_${prefix}`
    case 'DAILY':
      return `DAILY_${prefix}`
    case 'MONTHLY':
      return `MONTHLY_${prefix}`
    default:
      return `HOURLY_${prefix}`
  }
}
