import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        pointsCost: 'asc',
      },
    })

    return NextResponse.json({ rewards })
  } catch (error) {
    console.error('Get rewards error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
