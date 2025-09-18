import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingCode } = body

    console.log('🔍 Searching for booking with code:', bookingCode)

    if (!bookingCode) {
      return NextResponse.json({ error: 'كود الحجز مطلوب' }, { status: 400 })
    }

    // Search for booking by code
    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode: bookingCode
      },
      include: {
        user: {
          select: {
            phone: true,
            username: true
          }
        },
        office: {
          select: {
            name: true,
            officeNumber: true
          }
        }
      }
    })

    if (!booking) {
      console.log('❌ Booking not found')
      return NextResponse.json({ error: 'لم يتم العثور على الحجز' }, { status: 404 })
    }

    console.log('✅ Booking found:', booking)

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        user: {
          phone: booking.user.phone,
          username: booking.user.username
        },
        office: {
          name: booking.office.name,
          officeNumber: booking.office.officeNumber
        },
        totalPrice: booking.totalPrice,
        status: booking.status,
        duration: booking.duration,
        startTime: booking.startTime,
        endTime: booking.endTime,
        isRenewal: booking.isRenewal || false
      }
    })

  } catch (error) {
    console.error('❌ Payment search error:', error)
    return NextResponse.json({ 
      error: 'خطأ في البحث عن الحجز' 
    }, { status: 500 })
  }
}
