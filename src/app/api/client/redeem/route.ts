import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQRCodeData, verifyTokenEdge } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      console.log('❌ Redeem API - No token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = await verifyTokenEdge(token)
    if (!payload || payload.role !== 'CLIENT') {
      console.log('❌ Redeem API - Invalid token or role:', { payload })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = payload.userId
    console.log('✅ Redeem API - Authorized user:', userId)

    const body = await request.json()
    const { rewardId } = body

    if (!rewardId) {
      return NextResponse.json({ error: 'Reward ID is required' }, { status: 400 })
    }

    // Get user and reward details
    const [user, reward] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.loyaltyReward.findUnique({ where: { id: rewardId } }),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!reward || !reward.isActive) {
      return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 })
    }

    if (user.loyaltyPoints < reward.pointsCost) {
      return NextResponse.json({ error: 'Insufficient loyalty points' }, { status: 400 })
    }

    // Handle different reward types
    if (reward.type === 'PHYSICAL') {
      // Physical rewards need QR code and cashier confirmation
      const expiryTimestamp = Date.now() + 3 * 60 * 1000 // 3 minutes
      const qrCodeData = generateQRCodeData({
        phone: user.phone || 'N/A',
        reward: reward.name,
        pointsUsed: reward.pointsCost,
        expiryTimestamp,
      })

      // Create redemption record
      const redemption = await prisma.redemption.create({
        data: {
          userId,
          rewardId,
          pointsUsed: reward.pointsCost,
          qrCode: qrCodeData,
          qrCodeExpiry: new Date(expiryTimestamp),
        },
        include: {
          reward: true,
        },
      })

      // Deduct points from user
      await prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            decrement: reward.pointsCost,
          },
        },
      })

      return NextResponse.json({
        type: 'PHYSICAL',
        redemption,
        qrCodeData,
        redemptionCode: redemption.id.slice(-8).toUpperCase(), // Last 8 chars of redemption ID
        expiryTimestamp,
        message: 'تم إنشاء كود الاسترداد بنجاح'
      })

    } else if (reward.type === 'TIME_EXTENSION') {
      // Time extension rewards are applied directly to active subscription
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
        orderBy: { endDate: 'desc' },
      })

      if (!activeSubscription) {
        return NextResponse.json({
          error: 'لا يوجد اشتراك نشط لإضافة الوقت إليه'
        }, { status: 400 })
      }

      // Calculate time to add
      let millisecondsToAdd = 0
      if (reward.timeUnit === 'HOURS') {
        millisecondsToAdd = (reward.timeValue || 0) * 60 * 60 * 1000
      } else if (reward.timeUnit === 'DAYS') {
        millisecondsToAdd = (reward.timeValue || 0) * 24 * 60 * 60 * 1000
      }

      // Update subscription end date and deduct points in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update subscription
        const updatedSubscription = await tx.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            endDate: new Date(activeSubscription.endDate.getTime() + millisecondsToAdd),
          },
          include: { office: true },
        })

        // Create redemption record
        const redemption = await tx.redemption.create({
          data: {
            userId,
            rewardId,
            pointsUsed: reward.pointsCost,
            status: 'REDEEMED', // Immediately redeemed for time extensions
          },
          include: { reward: true },
        })

        // Deduct points from user
        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              decrement: reward.pointsCost,
            },
          },
        })

        return { updatedSubscription, redemption }
      })

      return NextResponse.json({
        type: 'TIME_EXTENSION',
        redemption: result.redemption,
        updatedSubscription: result.updatedSubscription,
        timeAdded: {
          value: reward.timeValue,
          unit: reward.timeUnit,
        },
        message: `تم إضافة ${reward.timeValue} ${reward.timeUnit === 'HOURS' ? 'ساعة' : 'يوم'} لاشتراكك بنجاح!`,
      })
    }

    return NextResponse.json({ error: 'Invalid reward type' }, { status: 400 })

  } catch (error) {
    console.error('Redeem reward error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
