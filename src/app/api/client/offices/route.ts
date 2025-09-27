import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 Fetching available offices...')

    // Get all available offices
    const allOffices = await prisma.office.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    console.log('📊 Total offices found:', allOffices.length)

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
        user: {
          select: {
            phone: true,
            username: true
          }
        }
      },
    })

    console.log('🔒 Occupied offices:', occupiedOffices.length)
    console.log('🔒 Occupied office details:', occupiedOffices.map(sub => ({
      officeId: sub.officeId,
      endDate: sub.endDate,
      user: sub.user.phone
    })))

    // Create a set of occupied office IDs for quick lookup
    const occupiedOfficeIds = new Set(occupiedOffices.map(sub => sub.officeId))
    console.log('🔒 Occupied office IDs:', Array.from(occupiedOfficeIds))

    // Filter out occupied offices
    const availableOffices = allOffices.filter(office => !occupiedOfficeIds.has(office.id))

    console.log('✅ Available offices after filtering:', availableOffices.length)
    console.log('✅ Available office names:', availableOffices.map(office => office.name))

    return NextResponse.json({
      offices: availableOffices,
      debug: {
        totalOffices: allOffices.length,
        occupiedOffices: occupiedOffices.length,
        availableOffices: availableOffices.length,
        occupiedOfficeIds: Array.from(occupiedOfficeIds)
      }
    })
  } catch (error) {
    console.error('❌ Get offices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
