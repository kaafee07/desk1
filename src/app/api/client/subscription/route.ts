import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenEdge } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const payload = await verifyTokenEdge(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all current active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        office: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
