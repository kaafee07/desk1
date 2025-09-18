import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const pointsConfigs = await prisma.pointsConfig.findMany({
      orderBy: { action: 'asc' },
    })

    return NextResponse.json({ pointsConfigs })
  } catch (error) {
    console.error('Get points config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, points, description, isActive } = body

    console.log('📝 Updating points config:', body)

    if (!id || points === undefined) {
      return NextResponse.json({
        error: 'معرف الإعداد والنقاط مطلوبان'
      }, { status: 400 })
    }

    const pointsConfig = await prisma.pointsConfig.update({
      where: { id },
      data: {
        points: parseInt(points),
        description,
        isActive: isActive !== false,
      },
    })

    console.log('✅ Points config updated successfully:', pointsConfig)
    return NextResponse.json({
      success: true,
      pointsConfig,
      message: 'تم تحديث إعدادات النقاط بنجاح'
    })

  } catch (error) {
    console.error('Update points config error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث إعدادات النقاط' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, points, description, isActive } = body

    console.log('📝 Creating points config:', body)

    if (!action || points === undefined) {
      return NextResponse.json({
        error: 'نوع الإجراء والنقاط مطلوبان'
      }, { status: 400 })
    }

    const pointsConfig = await prisma.pointsConfig.create({
      data: {
        action,
        points: parseInt(points),
        description,
        isActive: isActive !== false,
      },
    })

    console.log('✅ Points config created successfully:', pointsConfig)
    return NextResponse.json({
      success: true,
      pointsConfig,
      message: 'تم إنشاء إعدادات النقاط بنجاح'
    })

  } catch (error) {
    console.error('Create points config error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء إنشاء إعدادات النقاط' 
    }, { status: 500 })
  }
}
