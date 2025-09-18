import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // For now, allow all requests (middleware is disabled)
    // const userRole = request.headers.get('x-user-role')
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const offices = await prisma.office.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ offices })
  } catch (error) {
    console.error('Get offices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, allow all requests (middleware is disabled)
    // const userRole = request.headers.get('x-user-role')
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const body = await request.json()

    // Validate request body exists
    if (!body || typeof body !== 'object') {
      console.log('❌ Invalid request body:', body)
      return NextResponse.json({
        error: 'بيانات الطلب غير صحيحة'
      }, { status: 400 })
    }

    const {
      officeNumber,
      name,
      description,
      capacity,
      pricePerHour,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      renewalPricePerHour,
      renewalPricePerDay,
      renewalPricePerWeek,
      renewalPricePerMonth,
      discountPercentage,
      isAvailable,
      // أسعار سابقة
      previousPricePerHour,
      previousPricePerDay,
      previousPricePerMonth,
      // أسعار تجديد سابقة
      previousRenewalPricePerHour,
      previousRenewalPricePerDay,
      previousRenewalPricePerMonth,
    } = body

    console.log('📝 Creating office with data:', body)
    console.log('📋 Validation check:', {
      name: !!name,
      capacity: !!capacity,
      pricePerHour: !!pricePerHour,
      pricePerDay: !!pricePerDay
    })

    if (!name || !capacity || !pricePerHour || !pricePerDay) {
      console.log('❌ Validation failed - missing required fields')
      return NextResponse.json({
        error: 'الحقول المطلوبة: اسم المكتب، السعة، سعر الساعة، سعر اليوم',
        received: { name, capacity, pricePerHour, pricePerDay }
      }, { status: 400 })
    }

    // Check if office number already exists
    if (officeNumber) {
      const existingOffice = await prisma.office.findFirst({
        where: { officeNumber: officeNumber }
      })

      if (existingOffice) {
        return NextResponse.json({ error: 'رقم المكتب موجود بالفعل' }, { status: 400 })
      }
    }

    const office = await prisma.office.create({
      data: {
        officeNumber: officeNumber || null,
        name,
        description,
        capacity: parseInt(capacity),
        pricePerHour: parseFloat(pricePerHour),
        pricePerDay: parseFloat(pricePerDay),
        pricePerWeek: parseFloat(pricePerWeek) || parseFloat(pricePerDay) * 7,
        pricePerMonth: parseFloat(pricePerMonth) || parseFloat(pricePerDay) * 30,
        renewalPricePerHour: renewalPricePerHour ? parseFloat(renewalPricePerHour) : null,
        renewalPricePerDay: renewalPricePerDay ? parseFloat(renewalPricePerDay) : null,
        renewalPricePerWeek: renewalPricePerWeek ? parseFloat(renewalPricePerWeek) : (renewalPricePerDay ? parseFloat(renewalPricePerDay) * 7 : null),
        renewalPricePerMonth: renewalPricePerMonth ? parseFloat(renewalPricePerMonth) : null,
        discountPercentage: parseFloat(discountPercentage) || 0,
        isAvailable: isAvailable !== false,
        // أسعار سابقة
        previousPricePerHour: previousPricePerHour ? parseFloat(previousPricePerHour) : null,
        previousPricePerDay: previousPricePerDay ? parseFloat(previousPricePerDay) : null,
        previousPricePerMonth: previousPricePerMonth ? parseFloat(previousPricePerMonth) : null,
        // أسعار تجديد سابقة
        previousRenewalPricePerHour: previousRenewalPricePerHour ? parseFloat(previousRenewalPricePerHour) : null,
        previousRenewalPricePerDay: previousRenewalPricePerDay ? parseFloat(previousRenewalPricePerDay) : null,
        previousRenewalPricePerMonth: previousRenewalPricePerMonth ? parseFloat(previousRenewalPricePerMonth) : null,
      },
    })

    console.log('✅ Office created successfully:', office)
    return NextResponse.json({
      success: true,
      office,
      message: 'تم إنشاء المكتب بنجاح'
    })
  } catch (error) {
    console.error('❌ Create office error:', error)

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({
          error: 'رقم المكتب موجود بالفعل'
        }, { status: 400 })
      }

      return NextResponse.json({
        error: `خطأ في إنشاء المكتب: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'حدث خطأ غير متوقع'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // For now, allow all requests (middleware is disabled)
    // const userRole = request.headers.get('x-user-role')
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const body = await request.json()
    const {
      id,
      officeNumber,
      name,
      description,
      capacity,
      pricePerHour,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      renewalPricePerHour,
      renewalPricePerDay,
      renewalPricePerWeek,
      renewalPricePerMonth,
      discountPercentage,
      isAvailable,
      // أسعار سابقة
      previousPricePerHour,
      previousPricePerDay,
      previousPricePerMonth,
      // أسعار تجديد سابقة
      previousRenewalPricePerHour,
      previousRenewalPricePerDay,
      previousRenewalPricePerMonth,
    } = body

    console.log('Updating office with data:', body)

    if (!id) {
      return NextResponse.json({ error: 'معرف المكتب مطلوب' }, { status: 400 })
    }

    // Check if office number already exists (excluding current office)
    if (officeNumber) {
      const existingOffice = await prisma.office.findFirst({
        where: {
          officeNumber: officeNumber,
          id: { not: id }
        }
      })

      if (existingOffice) {
        return NextResponse.json({ error: 'رقم المكتب موجود بالفعل' }, { status: 400 })
      }
    }

    const office = await prisma.office.update({
      where: { id },
      data: {
        officeNumber: officeNumber || null,
        name,
        description,
        capacity: capacity ? parseInt(capacity) : undefined,
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : undefined,
        pricePerWeek: pricePerWeek ? parseFloat(pricePerWeek) : undefined,
        pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : undefined,
        renewalPricePerHour: renewalPricePerHour !== undefined ? (renewalPricePerHour ? parseFloat(renewalPricePerHour) : null) : undefined,
        renewalPricePerDay: renewalPricePerDay !== undefined ? (renewalPricePerDay ? parseFloat(renewalPricePerDay) : null) : undefined,
        renewalPricePerWeek: renewalPricePerWeek !== undefined ? (renewalPricePerWeek ? parseFloat(renewalPricePerWeek) : null) : undefined,
        renewalPricePerMonth: renewalPricePerMonth !== undefined ? (renewalPricePerMonth ? parseFloat(renewalPricePerMonth) : null) : undefined,
        discountPercentage: discountPercentage !== undefined ? parseFloat(discountPercentage) : undefined,
        isAvailable,
        // أسعار سابقة
        previousPricePerHour: previousPricePerHour !== undefined ? (previousPricePerHour ? parseFloat(previousPricePerHour) : null) : undefined,
        previousPricePerDay: previousPricePerDay !== undefined ? (previousPricePerDay ? parseFloat(previousPricePerDay) : null) : undefined,
        previousPricePerMonth: previousPricePerMonth !== undefined ? (previousPricePerMonth ? parseFloat(previousPricePerMonth) : null) : undefined,
        // أسعار تجديد سابقة
        previousRenewalPricePerHour: previousRenewalPricePerHour !== undefined ? (previousRenewalPricePerHour ? parseFloat(previousRenewalPricePerHour) : null) : undefined,
        previousRenewalPricePerDay: previousRenewalPricePerDay !== undefined ? (previousRenewalPricePerDay ? parseFloat(previousRenewalPricePerDay) : null) : undefined,
        previousRenewalPricePerMonth: previousRenewalPricePerMonth !== undefined ? (previousRenewalPricePerMonth ? parseFloat(previousRenewalPricePerMonth) : null) : undefined,
      },
    })

    console.log('✅ Office updated successfully:', office)
    return NextResponse.json({
      success: true,
      office,
      message: 'تم تحديث المكتب بنجاح'
    })
  } catch (error) {
    console.error('❌ Update office error:', error)

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({
          error: 'رقم المكتب موجود بالفعل'
        }, { status: 400 })
      }

      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({
          error: 'المكتب غير موجود'
        }, { status: 404 })
      }

      return NextResponse.json({
        error: `خطأ في تحديث المكتب: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'حدث خطأ غير متوقع'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // For now, allow all requests (middleware is disabled)
    // const userRole = request.headers.get('x-user-role')
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    // Try to get ID from body first, then from query params
    let id: string | null = null

    try {
      const body = await request.json()
      id = body.id
    } catch {
      // If no body, try query params
      const { searchParams } = new URL(request.url)
      id = searchParams.get('id')
    }

    console.log('🗑️ Deleting office with ID:', id)

    if (!id) {
      return NextResponse.json({ error: 'معرف المكتب مطلوب' }, { status: 400 })
    }

    // Check if office has active bookings or subscriptions
    const [activeBookings, activeSubscriptions] = await Promise.all([
      prisma.booking.count({
        where: {
          officeId: id,
          status: { in: ['PENDING', 'PAID'] },
          endTime: { gte: new Date() },
        },
      }),
      prisma.subscription.count({
        where: {
          officeId: id,
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
      }),
    ])

    if (activeBookings > 0 || activeSubscriptions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete office with active bookings or subscriptions' },
        { status: 400 }
      )
    }

    await prisma.office.delete({
      where: { id },
    })

    console.log('✅ Office deleted successfully:', id)
    return NextResponse.json({
      success: true,
      message: 'تم حذف المكتب بنجاح'
    })
  } catch (error) {
    console.error('❌ Delete office error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({
          error: 'المكتب غير موجود'
        }, { status: 404 })
      }

      return NextResponse.json({
        error: `خطأ في حذف المكتب: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'حدث خطأ غير متوقع'
    }, { status: 500 })
  }
}
