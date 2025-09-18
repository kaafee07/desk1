import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // For now, allow all requests (middleware is disabled)
    // const userRole = request.headers.get('x-user-role')
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            username: true,
            loyaltyPoints: true
          }
        },
        office: {
          select: {
            id: true,
            name: true,
            officeNumber: true,
            capacity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Found ${subscriptions.length} subscriptions`)
    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('❌ Get subscriptions error:', error)
    return NextResponse.json({ error: 'خطأ في استرجاع بيانات الاشتراكات' }, { status: 500 })
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
    const { userId, officeId, packageType, duration, startDate, endDate, totalPrice } = body

    console.log('📝 Creating subscription:', body)

    // Use packageType as duration if duration is not provided (for backward compatibility)
    const subscriptionDuration = duration || packageType

    if (!userId || !officeId || !subscriptionDuration || !startDate || !endDate) {
      return NextResponse.json({
        error: 'جميع الحقول مطلوبة: العميل، المكتب، نوع الباقة، تاريخ البداية، تاريخ النهاية'
      }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'CLIENT' }
    })

    if (!user) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })
    }

    // Check if office exists
    const office = await prisma.office.findUnique({
      where: { id: officeId }
    })

    if (!office) {
      return NextResponse.json({ error: 'المكتب غير موجود' }, { status: 404 })
    }

    // Calculate total price based on duration and office pricing
    const calculatedTotalPrice = totalPrice || 1000 // Default price if not provided

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        officeId,
        duration: subscriptionDuration,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: calculatedTotalPrice,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            username: true,
            loyaltyPoints: true
          }
        },
        office: {
          select: {
            id: true,
            name: true,
            officeNumber: true,
            capacity: true
          }
        }
      }
    })

    console.log('✅ Subscription created successfully:', subscription)
    return NextResponse.json({ 
      success: true, 
      subscription,
      message: 'تم إنشاء الاشتراك بنجاح' 
    })
  } catch (error) {
    console.error('❌ Create subscription error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: `خطأ في إنشاء الاشتراك: ${error.message}` 
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
    const { id, officeId, packageType, duration, startDate, endDate, status, totalPrice } = body

    console.log('📝 Updating subscription:', body)

    if (!id) {
      return NextResponse.json({ error: 'معرف الاشتراك مطلوب' }, { status: 400 })
    }

    // Check if office exists (if changing office)
    if (officeId) {
      const office = await prisma.office.findUnique({
        where: { id: officeId }
      })

      if (!office) {
        return NextResponse.json({ error: 'المكتب الجديد غير موجود' }, { status: 404 })
      }
    }

    const updateData: any = {}
    if (officeId) updateData.officeId = officeId
    if (packageType || duration) updateData.duration = duration || packageType
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (totalPrice) updateData.totalPrice = totalPrice
    if (status) updateData.status = status

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            username: true,
            loyaltyPoints: true
          }
        },
        office: {
          select: {
            id: true,
            name: true,
            officeNumber: true,
            capacity: true
          }
        }
      }
    })

    console.log('✅ Subscription updated successfully:', subscription)
    return NextResponse.json({ 
      success: true, 
      subscription,
      message: 'تم تحديث الاشتراك بنجاح' 
    })
  } catch (error) {
    console.error('❌ Update subscription error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ 
          error: 'الاشتراك غير موجود' 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: `خطأ في تحديث الاشتراك: ${error.message}` 
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

    console.log('🗑️ Deleting subscription with ID:', id)

    if (!id) {
      return NextResponse.json({ error: 'معرف الاشتراك مطلوب' }, { status: 400 })
    }

    await prisma.subscription.delete({
      where: { id }
    })

    console.log('✅ Subscription deleted successfully:', id)
    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف الاشتراك بنجاح' 
    })
  } catch (error) {
    console.error('❌ Delete subscription error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ 
          error: 'الاشتراك غير موجود' 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: `خطأ في حذف الاشتراك: ${error.message}` 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: 'حدث خطأ غير متوقع' 
    }, { status: 500 })
  }
}
