import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenEdge } from '@/lib/auth-edge'
import { generateBookingCode } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = await verifyTokenEdge(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { packageType, officeId } = body

    console.log('🔄 Renewal request:', { userId: payload.userId, packageType, officeId })

    // Check if user has an active subscription for the specified office
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        officeId: officeId || undefined, // If officeId provided, filter by it
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        office: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    })

    if (!activeSubscription) {
      return NextResponse.json({
        error: 'لا يوجد اشتراك نشط للتجديد'
      }, { status: 400 })
    }

    // Validate packageType and convert to duration
    let duration = ''
    let durationHours = 0
    let price = 0

    switch (packageType) {
      case 'hourly':
        duration = 'HOURLY'
        durationHours = 1
        // استخدم سعر التجديد إذا كان متوفراً، وإلا استخدم السعر العادي
        price = (activeSubscription.office.renewalPricePerHour?.toNumber() || activeSubscription.office.pricePerHour?.toNumber() || 25)
        break
      case 'daily':
        duration = 'DAILY'
        durationHours = 24
        // استخدم سعر التجديد إذا كان متوفراً، وإلا استخدم السعر العادي
        price = (activeSubscription.office.renewalPricePerDay?.toNumber() || activeSubscription.office.pricePerDay?.toNumber() || 100)
        break
      case 'monthly':
        duration = 'MONTHLY'
        durationHours = 24 * 30
        // استخدم سعر التجديد إذا كان متوفراً، وإلا استخدم السعر العادي
        price = (activeSubscription.office.renewalPricePerMonth?.toNumber() || activeSubscription.office.pricePerMonth?.toNumber() || 3000)
        break
      default:
        return NextResponse.json({ error: 'نوع الباقة غير صحيح' }, { status: 400 })
    }

    // Calculate new end time (add to existing subscription end time)
    const currentEndTime = new Date(activeSubscription.endDate)
    const newEndTime = new Date(currentEndTime.getTime() + (durationHours * 60 * 60 * 1000))

    // Generate booking code
    const bookingCode = generateBookingCode()

    // Create renewal booking
    const booking = await prisma.booking.create({
      data: {
        userId: payload.userId,
        officeId: activeSubscription.officeId,
        bookingCode,
        duration: duration === 'hour' ? 'HOURLY' : duration === 'day' ? 'DAILY' : 'MONTHLY',
        startTime: currentEndTime, // Start from current subscription end
        endTime: newEndTime,
        totalPrice: price,
        purpose: `${duration} package renewal`,
        status: 'PENDING',
        isRenewal: true // Mark as renewal
      }
    })

    console.log('✅ Renewal booking created:', {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      userId: payload.userId,
      officeId: activeSubscription.officeId,
      duration: booking.duration,
      price: booking.totalPrice,
      currentEndTime: currentEndTime.toISOString(),
      newEndTime: newEndTime.toISOString()
    })

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      paymentCode: booking.bookingCode,
      currentSubscription: {
        office: activeSubscription.office.name,
        currentEndTime: currentEndTime.toISOString(),
        newEndTime: newEndTime.toISOString(),
        extensionDays: Math.round(durationHours / 24)
      },
      renewal: {
        duration: booking.duration,
        price: booking.totalPrice,
        startTime: booking.startTime,
        endTime: booking.endTime
      },
      message: 'تم إنشاء طلب التجديد بنجاح'
    })

  } catch (error) {
    console.error('❌ Renewal creation error:', error)
    return NextResponse.json({
      error: 'حدث خطأ أثناء إنشاء طلب التجديد'
    }, { status: 500 })
  }
}
