import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loyaltyCode } = body

    console.log('🎁 Processing loyalty code:', loyaltyCode)

    if (!loyaltyCode) {
      return NextResponse.json({ error: 'كود الولاء مطلوب' }, { status: 400 })
    }

    // Parse loyalty code - expected format: "LOYALTY_{userId}_{rewardId}" or JSON
    let userId: string
    let rewardId: string

    try {
      if (loyaltyCode.startsWith('LOYALTY_')) {
        const parts = loyaltyCode.split('_')
        if (parts.length !== 3) {
          throw new Error('Invalid loyalty code format')
        }
        userId = parts[1]
        rewardId = parts[2]
      } else if (loyaltyCode.startsWith('REWARD_')) {
        const parts = loyaltyCode.split('_')
        if (parts.length !== 3) {
          throw new Error('Invalid reward code format')
        }
        userId = parts[1]
        rewardId = parts[2]
      } else {
        // Try to parse as JSON
        const qrData = JSON.parse(loyaltyCode)
        userId = qrData.userId
        rewardId = qrData.rewardId
      }
    } catch (error) {
      console.log('❌ Invalid loyalty code format:', error)
      return NextResponse.json({ error: 'تنسيق كود الولاء غير صالح' }, { status: 400 })
    }

    // Get user and reward details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        username: true,
        loyaltyPoints: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })
    }

    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
      select: {
        id: true,
        name: true,
        pointsCost: true
      }
    })

    if (!reward) {
      return NextResponse.json({ error: 'المكافأة غير موجودة' }, { status: 404 })
    }

    console.log('✅ Loyalty redemption details found')

    return NextResponse.json({
      success: true,
      redemption: {
        userId: user.id,
        rewardId: reward.id,
        user: {
          phone: user.phone,
          username: user.username,
          loyaltyPoints: user.loyaltyPoints
        },
        reward: {
          name: reward.name,
          pointsRequired: reward.pointsCost
        }
      }
    })

  } catch (error) {
    console.error('❌ Loyalty processing error:', error)
    return NextResponse.json({ 
      error: 'خطأ في معالجة كود الولاء' 
    }, { status: 500 })
  }
}
