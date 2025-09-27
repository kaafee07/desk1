import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, officeId, duration = 'HOURLY' } = body
    
    console.log('🧪 Testing booking flow for:', { phone, officeId, duration })
    
    if (!phone || !officeId) {
      return NextResponse.json({ error: 'Phone and officeId required' }, { status: 400 })
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { phone }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Find office
    const office = await prisma.office.findUnique({
      where: { id: officeId }
    })
    
    if (!office) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 })
    }
    
    // Check if office is already occupied
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        officeId: officeId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date()
        }
      },
      include: {
        user: {
          select: {
            phone: true,
            username: true
          }
        }
      }
    })
    
    if (existingSubscription) {
      return NextResponse.json({
        error: 'Office is already occupied',
        occupiedBy: existingSubscription.user,
        endDate: existingSubscription.endDate
      }, { status: 400 })
    }
    
    // Create test subscription directly
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (duration === 'HOURLY' ? 1 : duration === 'DAILY' ? 24 : 24 * 30) * 60 * 60 * 1000)
    
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        officeId: office.id,
        duration: duration,
        startDate: startDate,
        endDate: endDate,
        totalPrice: duration === 'HOURLY' ? office.pricePerHour : duration === 'DAILY' ? office.pricePerDay : office.pricePerMonth,
        status: 'ACTIVE'
      },
      include: {
        office: true,
        user: {
          select: {
            phone: true,
            username: true
          }
        }
      }
    })
    
    console.log('✅ Test subscription created:', subscription.id)
    
    return NextResponse.json({
      success: true,
      message: 'Test subscription created successfully',
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        officeId: subscription.officeId,
        duration: subscription.duration,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        totalPrice: subscription.totalPrice,
        status: subscription.status,
        office: {
          name: subscription.office.name,
          officeNumber: subscription.office.officeNumber
        },
        user: subscription.user
      }
    })
    
  } catch (error) {
    console.error('❌ Test booking flow error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')
    
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }
    
    const deletedSubscription = await prisma.subscription.delete({
      where: { id: subscriptionId }
    })
    
    console.log('🗑️ Test subscription deleted:', subscriptionId)
    
    return NextResponse.json({
      success: true,
      message: 'Test subscription deleted successfully',
      deletedId: deletedSubscription.id
    })
    
  } catch (error) {
    console.error('❌ Delete test subscription error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
