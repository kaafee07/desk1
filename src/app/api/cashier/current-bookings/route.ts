import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    
    // Get current active bookings (paid and within time range)
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'PAID',
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      include: {
        user: true,
        office: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Also get active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      include: {
        user: true,
        office: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    return NextResponse.json({
      bookings: bookings.map(booking => ({
        id: booking.id,
        type: 'booking',
        user: {
          phone: booking.user.phone,
        },
        office: {
          name: booking.office.name,
        },
        duration: booking.duration,
        startTime: booking.startTime,
        endTime: booking.endTime,
        purpose: booking.purpose,
      })),
      subscriptions: subscriptions.map(subscription => ({
        id: subscription.id,
        type: 'subscription',
        user: {
          phone: subscription.user.phone,
        },
        office: {
          name: subscription.office.name,
        },
        duration: subscription.duration,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        purpose: subscription.purpose,
      })),
    })
  } catch (error) {
    console.error('Get current bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
