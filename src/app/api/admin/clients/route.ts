import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // For now, allow all requests (middleware is disabled)
    // const userRole = request.headers.get('x-user-role')
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        phone: true,
        username: true,
        loyaltyPoints: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            subscriptions: true,
            redemptions: true,
          },
        },
        // bookings: {
        //   where: {
        //     status: { in: ['PENDING', 'PAID'] } // Active bookings are PENDING or PAID
        //   },
        //   select: {
        //     id: true,
        //     bookingCode: true,
        //     duration: true,
        //     status: true,
        //     createdAt: true,
        //     office: {
        //       select: {
        //         id: true,
        //         name: true,
        //         officeNumber: true
        //       }
        //     }
        //   },
        //   orderBy: { createdAt: 'desc' },
        //   take: 1 // Get the most recent active booking
        // },
        // subscriptions: {
        //   where: {
        //     status: 'ACTIVE'
        //   },
        //   select: {
        //     id: true,
        //     packageType: true,
        //     status: true,
        //     startDate: true,
        //     endDate: true,
        //     office: {
        //       select: {
        //         id: true,
        //         name: true,
        //         officeNumber: true
        //       }
        //     }
        //   },
        //   orderBy: { startDate: 'desc' },
        //   take: 1 // Get the most recent active subscription
        // }
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`📊 Found ${clients.length} clients`)
    return NextResponse.json({ clients })
  } catch (error) {
    console.error('❌ Get clients error:', error)
    return NextResponse.json({ error: 'خطأ في استرجاع بيانات العملاء' }, { status: 500 })
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
    const { id, loyaltyPoints, isActive, action } = body

    console.log('📝 Updating client:', { id, loyaltyPoints, isActive, action })

    if (!id) {
      return NextResponse.json({ error: 'معرف العميل مطلوب' }, { status: 400 })
    }

    // Get current client data
    const currentClient = await prisma.user.findUnique({
      where: { id, role: 'CLIENT' },
      select: { loyaltyPoints: true }
    })

    if (!currentClient) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })
    }

    let newLoyaltyPoints = currentClient.loyaltyPoints

    // Handle different actions
    if (action === 'add' && loyaltyPoints) {
      newLoyaltyPoints = currentClient.loyaltyPoints + parseInt(loyaltyPoints)
    } else if (action === 'subtract' && loyaltyPoints) {
      newLoyaltyPoints = Math.max(0, currentClient.loyaltyPoints - parseInt(loyaltyPoints))
    } else if (action === 'set' && loyaltyPoints !== undefined) {
      newLoyaltyPoints = parseInt(loyaltyPoints)
    }

    const client = await prisma.user.update({
      where: { id, role: 'CLIENT' },
      data: {
        loyaltyPoints: newLoyaltyPoints,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      select: {
        id: true,
        phone: true,
        username: true,
        loyaltyPoints: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            subscriptions: true,
            redemptions: true,
          },
        },
      },
    })

    console.log('✅ Client updated successfully:', client)
    return NextResponse.json({
      success: true,
      client,
      message: 'تم تحديث بيانات العميل بنجاح'
    })
  } catch (error) {
    console.error('❌ Update client error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({
          error: 'العميل غير موجود'
        }, { status: 404 })
      }

      return NextResponse.json({
        error: `خطأ في تحديث بيانات العميل: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'حدث خطأ غير متوقع'
    }, { status: 500 })
  }
}
