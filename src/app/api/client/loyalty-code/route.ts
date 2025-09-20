import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenEdge } from '@/lib/auth'

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
    const { rewardId } = body

    if (!rewardId) {
      return NextResponse.json({ 
        error: 'معرف المكافأة مطلوب' 
      }, { status: 400 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'المستخدم غير موجود' 
      }, { status: 404 })
    }

    // Get reward details
    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId }
    })

    if (!reward) {
      return NextResponse.json({ 
        error: 'المكافأة غير موجودة' 
      }, { status: 404 })
    }

    // Check if user has enough points
    if (user.loyaltyPoints < reward.pointsCost) {
      return NextResponse.json({ 
        error: 'نقاط الولاء غير كافية' 
      }, { status: 400 })
    }

    // Generate simple loyalty code: LOYALTY_userId_rewardId
    const loyaltyCode = `LOYALTY_${user.id}_${reward.id}`

    return NextResponse.json({
      success: true,
      loyaltyCode: loyaltyCode,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        loyaltyPoints: user.loyaltyPoints
      },
      reward: {
        id: reward.id,
        name: reward.name,
        pointsCost: reward.pointsCost
      },
      message: 'تم إنشاء كود الولاء بنجاح'
    })

  } catch (error) {
    console.error('Create loyalty code error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء إنشاء كود الولاء' 
    }, { status: 500 })
  }
}
