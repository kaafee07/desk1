import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all available offices
    const allOffices = await prisma.office.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Get offices with active subscriptions
    const occupiedOffices = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
        },
      },
      select: {
        officeId: true,
        endDate: true,
      },
    })

    // Create a set of occupied office IDs for quick lookup
    const occupiedOfficeIds = new Set(occupiedOffices.map(sub => sub.officeId))

    // Filter out occupied offices
    const availableOffices = allOffices.filter(office => !occupiedOfficeIds.has(office.id))

    return NextResponse.json({ offices: availableOffices })
  } catch (error) {
    console.error('Get offices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
