import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // For now, allow all requests (middleware is disabled)
    // const userRole = request.headers.get('x-user-role')
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const rewards = await prisma.loyaltyReward.findMany({
      orderBy: { pointsCost: 'asc' },
    })

    return NextResponse.json({ rewards })
  } catch (error) {
    console.error('Get rewards error:', error)
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

    const { name, description, pointsRequired, type, timeValue, timeUnit, isActive } = body

    console.log('📝 Creating reward with data:', body)

    if (!name || !pointsRequired) {
      return NextResponse.json({
        error: 'الحقول المطلوبة: اسم المكافأة والنقاط المطلوبة'
      }, { status: 400 })
    }

    // Validate time extension fields
    if (type === 'TIME_EXTENSION') {
      if (!timeValue || !timeUnit) {
        return NextResponse.json({
          error: 'مكافآت إضافة الوقت تحتاج قيمة الوقت ووحدة الوقت'
        }, { status: 400 })
      }
    }

    const rewardData: any = {
      name,
      description,
      pointsCost: parseInt(pointsRequired), // Map pointsRequired to pointsCost
      type: type || 'PHYSICAL',
      isActive: isActive !== false,
    }

    // Add time extension fields if needed
    if (type === 'TIME_EXTENSION') {
      rewardData.timeValue = parseInt(timeValue)
      rewardData.timeUnit = timeUnit
    }

    const reward = await prisma.loyaltyReward.create({
      data: rewardData,
    })

    console.log('✅ Reward created successfully:', reward)
    return NextResponse.json({
      success: true,
      reward,
      message: 'تم إنشاء المكافأة بنجاح'
    })
  } catch (error) {
    console.error('❌ Create reward error:', error)

    if (error instanceof Error) {
      return NextResponse.json({
        error: `خطأ في إنشاء المكافأة: ${error.message}`
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
    const { id, name, description, pointsRequired, type, timeValue, timeUnit, isActive } = body

    console.log('📝 Updating reward with data:', body)

    if (!id) {
      return NextResponse.json({ error: 'معرف المكافأة مطلوب' }, { status: 400 })
    }

    // Validate time extension fields
    if (type === 'TIME_EXTENSION') {
      if (!timeValue || !timeUnit) {
        return NextResponse.json({
          error: 'مكافآت إضافة الوقت تحتاج قيمة الوقت ووحدة الوقت'
        }, { status: 400 })
      }
    }

    const updateData: any = {
      name,
      description,
      pointsCost: pointsRequired ? parseInt(pointsRequired) : undefined, // Map pointsRequired to pointsCost
      type: type || 'PHYSICAL',
      isActive,
    }

    // Add time extension fields if needed
    if (type === 'TIME_EXTENSION') {
      updateData.timeValue = parseInt(timeValue)
      updateData.timeUnit = timeUnit
    } else {
      // Clear time extension fields for physical rewards
      updateData.timeValue = null
      updateData.timeUnit = null
    }

    const reward = await prisma.loyaltyReward.update({
      where: { id },
      data: updateData,
    })

    console.log('✅ Reward updated successfully:', reward)
    return NextResponse.json({
      success: true,
      reward,
      message: 'تم تحديث المكافأة بنجاح'
    })
  } catch (error) {
    console.error('❌ Update reward error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({
          error: 'المكافأة غير موجودة'
        }, { status: 404 })
      }

      return NextResponse.json({
        error: `خطأ في تحديث المكافأة: ${error.message}`
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

    console.log('🗑️ Deleting reward with ID:', id)

    if (!id) {
      return NextResponse.json({ error: 'معرف المكافأة مطلوب' }, { status: 400 })
    }

    await prisma.loyaltyReward.delete({
      where: { id },
    })

    console.log('✅ Reward deleted successfully:', id)
    return NextResponse.json({
      success: true,
      message: 'تم حذف المكافأة بنجاح'
    })
  } catch (error) {
    console.error('❌ Delete reward error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({
          error: 'المكافأة غير موجودة'
        }, { status: 404 })
      }

      return NextResponse.json({
        error: `خطأ في حذف المكافأة: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'حدث خطأ غير متوقع'
    }, { status: 500 })
  }
}
