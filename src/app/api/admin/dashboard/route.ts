import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get dashboard statistics
    const [
      totalOffices,
      availableOffices,
      totalClients,
      activeSubscriptions,
      totalBookings,
      totalRedemptions,
      recentBookings,
      recentRedemptions,
    ] = await Promise.all([
      // Total offices
      prisma.office.count(),
      
      // Available offices
      prisma.office.count({
        where: { isAvailable: true },
      }),
      
      // Total clients
      prisma.user.count({
        where: { role: 'CLIENT' },
      }),
      
      // Active subscriptions
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
      }),
      
      // Total bookings this month
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Total redemptions this month
      prisma.redemption.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Recent bookings
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          office: true,
        },
      }),
      
      // Recent redemptions
      prisma.redemption.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          reward: true,
        },
      }),
    ])

    // Calculate occupied offices (offices with active bookings or subscriptions)
    const now = new Date()
    const occupiedOfficesFromBookings = await prisma.booking.findMany({
      where: {
        status: 'PAID',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      select: { officeId: true },
      distinct: ['officeId'],
    })

    const occupiedOfficesFromSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { officeId: true },
      distinct: ['officeId'],
    })

    const occupiedOfficeIds = new Set([
      ...occupiedOfficesFromBookings.map(b => b.officeId),
      ...occupiedOfficesFromSubscriptions.map(s => s.officeId),
    ])

    const occupiedOffices = occupiedOfficeIds.size

    return NextResponse.json({
      stats: {
        totalOffices,
        availableOffices,
        occupiedOffices,
        totalClients,
        activeSubscriptions,
        totalBookings,
        totalRedemptions,
      },
      recentActivity: {
        bookings: recentBookings.map(booking => ({
          id: booking.id,
          user: booking.user.phone,
          office: booking.office.name,
          totalPrice: booking.totalPrice,
          status: booking.status,
          createdAt: booking.createdAt,
        })),
        redemptions: recentRedemptions.map(redemption => ({
          id: redemption.id,
          user: redemption.user.phone,
          reward: redemption.reward.name,
          pointsUsed: redemption.pointsUsed,
          status: redemption.status,
          createdAt: redemption.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
