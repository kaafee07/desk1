import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenEdge, generateBookingCode } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = await verifyTokenEdge(token)
    if (!payload || payload.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { officeId, packageType } = body

    if (!officeId || !packageType) {
      return NextResponse.json({ 
        error: 'معرف المكتب ونوع الباقة مطلوبان' 
      }, { status: 400 })
    }

    if (!['hour', 'day', 'month'].includes(packageType)) {
      return NextResponse.json({ 
        error: 'نوع الباقة غير صحيح' 
      }, { status: 400 })
    }

    // Get office details
    const office = await prisma.office.findUnique({
      where: { id: officeId }
    })

    if (!office) {
      return NextResponse.json({
        error: 'المكتب غير موجود'
      }, { status: 404 })
    }

    if (!office.isAvailable) {
      return NextResponse.json({
        error: 'المكتب غير متاح للحجز حالياً'
      }, { status: 400 })
    }

    // Check if office has any active subscriptions
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        officeId: officeId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        user: {
          select: {
            phone: true,
            username: true,
          }
        }
      }
    })

    if (activeSubscription) {
      return NextResponse.json({
        error: `المكتب محجوز حالياً من قبل عميل آخر حتى ${new Date(activeSubscription.endDate).toLocaleDateString('ar-SA')}`
      }, { status: 400 })
    }

    // Calculate price and duration based on package type
    let price: number
    let duration: string
    let endDate: Date

    const startDate = new Date()

    switch (packageType) {
      case 'hour':
        price = Number(office.pricePerHour)
        duration = 'HOURLY'
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 hour
        break
      case 'day':
        price = Number(office.pricePerDay)
        duration = 'DAILY'
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // +1 day
        break
      case 'month':
        price = Number(office.pricePerMonth)
        duration = 'MONTHLY'
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days
        break
      default:
        return NextResponse.json({
          error: 'نوع الباقة غير صحيح'
        }, { status: 400 })
    }

    // Generate booking code
    const bookingCode = generateBookingCode()

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        userId: payload.userId,
        officeId: officeId,
        bookingCode: bookingCode,
        duration: duration as any,
        startTime: startDate,
        endTime: endDate,
        totalPrice: price,
        purpose: `${packageType} package booking`,
        status: 'PENDING', // Waiting for payment confirmation
      },
      include: {
        office: true,
        user: {
          select: {
            id: true,
            phone: true,
            username: true,
          }
        }
      }
    })

    console.log('✅ Booking created:', { 
      bookingId: booking.id, 
      bookingCode: bookingCode,
      userId: payload.userId,
      officeId: officeId,
      packageType: packageType,
      price: price
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingCode: bookingCode,
        office: booking.office,
        duration: duration,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        status: booking.status
      },
      // Simple QR code - just the booking code
      paymentCode: bookingCode,
      message: 'تم إنشاء طلب الحجز بنجاح'
    })

  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء إنشاء الحجز' 
    }, { status: 500 })
  }
}
