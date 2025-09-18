import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, rewardId } = body

    console.log('🎁 Confirming loyalty redemption:', { userId, rewardId })

    if (!userId || !rewardId) {
      return NextResponse.json({ error: 'معرف العميل والمكافأة مطلوبان' }, { status: 400 })
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
        description: true,
        pointsCost: true
      }
    })

    if (!reward) {
      return NextResponse.json({ error: 'المكافأة غير موجودة' }, { status: 404 })
    }

    // Check if user has enough points
    if (user.loyaltyPoints < reward.pointsCost) {
      return NextResponse.json({
        error: 'النقاط غير كافية لاسترداد هذه المكافأة'
      }, { status: 400 })
    }

    // Create redemption record and deduct points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create redemption record
      const redemption = await tx.redemption.create({
        data: {
          userId: user.id,
          rewardId: reward.id,
          pointsUsed: reward.pointsCost,
          status: 'REDEEMED'
        }
      })

      // Deduct points from user
      await tx.user.update({
        where: { id: user.id },
        data: {
          loyaltyPoints: {
            decrement: reward.pointsCost
          }
        }
      })

      return redemption
    })

    console.log('✅ Loyalty redemption confirmed successfully')

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد استرداد النقاط بنجاح',
      redemption: result,
      pointsDeducted: reward.pointsCost,
      remainingPoints: user.loyaltyPoints - reward.pointsCost
    })

  } catch (error) {
    console.error('❌ Loyalty confirmation error:', error)
    return NextResponse.json({ 
      error: 'خطأ في تأكيد استرداد النقاط' 
    }, { status: 500 })
  }
}
