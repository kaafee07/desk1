import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    
    console.log('🔍 Debug: Checking subscriptions for phone:', phone)
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone parameter required' }, { status: 400 })
    }
    
    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('👤 Found user:', { id: user.id, phone: user.phone, username: user.username })
    
    // Get all subscriptions for this user
    const allSubscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      include: {
        office: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('📋 All subscriptions:', allSubscriptions.length)
    
    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        endDate: {
          gte: new Date()
        }
      },
      include: {
        office: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('✅ Active subscriptions:', activeSubscriptions.length)
    
    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        office: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    
    console.log('📝 Recent bookings:', recentBookings.length)
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        loyaltyPoints: user.loyaltyPoints
      },
      subscriptions: {
        total: allSubscriptions.length,
        active: activeSubscriptions.length,
        all: allSubscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          duration: sub.duration,
          startDate: sub.startDate,
          endDate: sub.endDate,
          totalPrice: sub.totalPrice,
          office: {
            name: sub.office.name,
            officeNumber: sub.office.officeNumber
          },
          isExpired: new Date() > new Date(sub.endDate),
          createdAt: sub.createdAt
        })),
        activeOnly: activeSubscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          duration: sub.duration,
          startDate: sub.startDate,
          endDate: sub.endDate,
          totalPrice: sub.totalPrice,
          office: {
            name: sub.office.name,
            officeNumber: sub.office.officeNumber
          },
          createdAt: sub.createdAt
        }))
      },
      bookings: recentBookings.map(booking => ({
        id: booking.id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        duration: booking.duration,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        isRenewal: booking.isRenewal,
        office: {
          name: booking.office.name,
          officeNumber: booking.office.officeNumber
        },
        createdAt: booking.createdAt
      }))
    })
    
  } catch (error) {
    console.error('❌ Debug subscriptions error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
