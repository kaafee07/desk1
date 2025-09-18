import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingCode } = body

    if (!bookingCode) {
      return NextResponse.json({ error: 'Booking code is required' }, { status: 400 })
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        user: true,
        office: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'PAID') {
      return NextResponse.json({ error: 'Booking already marked as paid' }, { status: 400 })
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking has been cancelled' }, { status: 400 })
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        user: {
          phone: booking.user.phone,
        },
        office: {
          name: booking.office.name,
          description: booking.office.description,
        },
        duration: booking.duration,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        purpose: booking.purpose,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    })
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Update booking status to paid
    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
        status: 'PENDING',
      },
      data: {
        status: 'PAID',
      },
      include: {
        user: true,
        office: true,
      },
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        user: {
          phone: booking.user.phone,
        },
        office: {
          name: booking.office.name,
        },
        totalPrice: booking.totalPrice,
        status: booking.status,
      },
    })
  } catch (error) {
    console.error('Mark booking paid error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
