import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SubscriptionDuration } from '@prisma/client'
import { getPointsForAction, getActionFromBooking } from '@/lib/points'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { officeId, duration, purpose } = body

    // Validate input
    if (!duration) {
      return NextResponse.json({ error: 'Duration is required' }, { status: 400 })
    }

    // Get office details
    let office
    if (officeId) {
      office = await prisma.office.findUnique({
        where: { id: officeId },
      })

      if (!office || !office.isAvailable) {
        return NextResponse.json({ error: 'Office not available' }, { status: 400 })
      }
    } else {
      // If no office specified, use the current subscription's office
      const currentSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
        include: { office: true },
        orderBy: { endDate: 'desc' },
      })

      if (!currentSubscription) {
        return NextResponse.json({ error: 'No active subscription to renew' }, { status: 400 })
      }

      office = currentSubscription.office
    }

    // Calculate dates and price
    const startDate = new Date()
    let endDate: Date
    let totalPrice: number

    switch (duration as SubscriptionDuration) {
      case 'MONTHLY':
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
        totalPrice = Number(office.pricePerMonth)
        break
      case 'WEEKLY':
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
        totalPrice = Number(office.pricePerWeek)
        break
      case 'DAILY':
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // 1 day
        totalPrice = Number(office.pricePerDay)
        break
      case 'HOURLY':
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour
        totalPrice = Number(office.pricePerHour)
        break
      default:
        return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        officeId: office.id,
        duration: duration as SubscriptionDuration,
        startDate,
        endDate,
        totalPrice,
        purpose,
      },
      include: {
        office: true,
      },
    })

    // Award loyalty points based on configuration
    const action = getActionFromBooking(duration, false) // false = not renewal, it's new subscription
    const pointsToAdd = await getPointsForAction(action)

    await prisma.user.update({
      where: { id: userId },
      data: {
        loyaltyPoints: {
          increment: pointsToAdd,
        },
      },
    })

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Renew subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
