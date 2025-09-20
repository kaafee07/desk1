import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenEdge } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      console.log('❌ No token found in cookies')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = await verifyTokenEdge(token)
    if (!payload || payload.role !== 'CLIENT') {
      console.log('❌ Invalid token or wrong role:', payload?.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = payload.userId

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ 
        error: 'الاسم مطلوب ويجب أن يكون أكثر من حرف واحد' 
      }, { status: 400 })
    }

    // Update user name
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        username: name.trim(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        phone: true,
        username: true,
        role: true,
        loyaltyPoints: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log('✅ User name updated:', { userId: userId, name: name.trim() })

    return NextResponse.json({ 
      success: true,
      user: updatedUser,
      message: 'تم حفظ الاسم بنجاح'
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء حفظ البيانات' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      console.log('❌ No token found in cookies')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = await verifyTokenEdge(token)
    if (!payload || payload.role !== 'CLIENT') {
      console.log('❌ Invalid token or wrong role:', payload?.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = payload.userId

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        username: true,
        role: true,
        loyaltyPoints: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء جلب البيانات' 
    }, { status: 500 })
  }
}
