import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { redemptionId } = body

    console.log('🎁 Confirming redemption for:', redemptionId)

    if (!redemptionId) {
      return NextResponse.json({ 
        error: 'معرف الاسترداد مطلوب' 
      }, { status: 400 })
    }

    // Find the redemption
    const redemption = await prisma.redemption.findUnique({
      where: { id: redemptionId },
      include: {
        user: true,
        reward: true
      }
    })

    if (!redemption) {
      return NextResponse.json({ 
        error: 'طلب الاسترداد غير موجود' 
      }, { status: 404 })
    }

    if (redemption.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'طلب الاسترداد تم تأكيده مسبقاً أو منتهي الصلاحية' 
      }, { status: 400 })
    }

    // Check if QR code is still valid (3 minutes)
    if (new Date() > redemption.qrCodeExpiry) {
      return NextResponse.json({ 
        error: 'انتهت صلاحية كود الاسترداد' 
      }, { status: 400 })
    }

    // Update redemption status to REDEEMED
    const updatedRedemption = await prisma.redemption.update({
      where: { id: redemptionId },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date()
      },
      include: {
        user: true,
        reward: true
      }
    })

    console.log('✅ Reward redemption confirmed successfully')

    return NextResponse.json({
      success: true,
      redemption: updatedRedemption,
      message: 'تم تأكيد استبدال المكافأة بنجاح'
    })

  } catch (error) {
    console.error('Confirm redemption error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تأكيد الاسترداد' 
    }, { status: 500 })
  }
}
