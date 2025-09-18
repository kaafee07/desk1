import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQRCodeData, isQRCodeExpired } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCodeData } = body

    if (!qrCodeData) {
      return NextResponse.json({ error: 'QR code data is required' }, { status: 400 })
    }

    // Parse QR code data
    const qrData = parseQRCodeData(qrCodeData)
    if (!qrData) {
      return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 })
    }

    // Check if QR code is expired
    if (isQRCodeExpired(qrData.expiryTimestamp)) {
      return NextResponse.json({ error: 'QR code has expired' }, { status: 400 })
    }

    // Find the redemption record
    const redemption = await prisma.redemption.findFirst({
      where: {
        qrCode: qrCodeData,
        status: 'PENDING',
      },
      include: {
        user: true,
        reward: true,
      },
    })

    if (!redemption) {
      return NextResponse.json({ error: 'Redemption not found or already processed' }, { status: 404 })
    }

    // Verify the QR code data matches the redemption
    if (redemption.user.phone !== qrData.phone || 
        redemption.reward.name !== qrData.reward ||
        redemption.pointsUsed !== qrData.pointsUsed) {
      return NextResponse.json({ error: 'QR code data mismatch' }, { status: 400 })
    }

    return NextResponse.json({
      redemption: {
        id: redemption.id,
        user: {
          phone: redemption.user.phone,
        },
        reward: {
          name: redemption.reward.name,
          description: redemption.reward.description,
        },
        pointsUsed: redemption.pointsUsed,
        createdAt: redemption.createdAt,
      },
    })
  } catch (error) {
    console.error('Scan QR code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { redemptionId } = body

    if (!redemptionId) {
      return NextResponse.json({ error: 'Redemption ID is required' }, { status: 400 })
    }

    // Update redemption status
    const redemption = await prisma.redemption.update({
      where: {
        id: redemptionId,
        status: 'PENDING',
      },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date(),
      },
      include: {
        user: true,
        reward: true,
      },
    })

    return NextResponse.json({
      success: true,
      redemption: {
        id: redemption.id,
        user: {
          phone: redemption.user.phone,
        },
        reward: {
          name: redemption.reward.name,
        },
        pointsUsed: redemption.pointsUsed,
        redeemedAt: redemption.redeemedAt,
      },
    })
  } catch (error) {
    console.error('Confirm redemption error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
