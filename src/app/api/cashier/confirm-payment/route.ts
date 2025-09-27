import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPointsForAction, getActionFromBooking } from '@/lib/points'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    console.log('💳 Confirming payment for booking:', bookingId)

    if (!bookingId) {
      return NextResponse.json({ error: 'معرف الحجز مطلوب' }, { status: 400 })
    }

    // Find the booking first to check expiry
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        office: true
      }
    })

    if (!booking) {
      return NextResponse.json({
        error: 'الحجز غير موجود'
      }, { status: 404 })
    }

    if (booking.status === 'PAID') {
      return NextResponse.json({
        error: 'تم تأكيد هذا الحجز مسبقاً'
      }, { status: 400 })
    }

    // Check if booking is expired (older than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    if (booking.createdAt < tenMinutesAgo) {
      // Delete expired booking
      await prisma.booking.delete({
        where: { id: bookingId }
      })

      return NextResponse.json({
        error: 'انتهت صلاحية هذا الحجز (أكثر من 10 دقائق)'
      }, { status: 400 })
    }

    // Calculate loyalty points to add based on configuration
    const action = getActionFromBooking(booking.duration, booking.isRenewal)
    const pointsToAdd = await getPointsForAction(action)

    // Check if this is a renewal
    if (booking.isRenewal) {
      // Handle renewal: extend existing subscription
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          userId: booking.userId,
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
          },
        },
        orderBy: {
          endDate: 'desc',
        },
      })

      if (!activeSubscription) {
        return NextResponse.json({
          error: 'لا يوجد اشتراك نشط للتجديد'
        }, { status: 400 })
      }

      // Update booking status, add loyalty points, and extend subscription
      const [updatedBooking, updatedUser, extendedSubscription] = await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'PAID' }
        }),
        prisma.user.update({
          where: { id: booking.userId },
          data: {
            loyaltyPoints: {
              increment: pointsToAdd
            }
          }
        }),
        prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            endDate: booking.endTime, // Extend to new end time
            totalPrice: {
              increment: booking.totalPrice // Add renewal price
            }
          }
        })
      ])

      console.log('✅ Renewal payment confirmed successfully')

      return NextResponse.json({
        success: true,
        booking: {
          id: updatedBooking.id,
          bookingCode: updatedBooking.bookingCode,
          status: updatedBooking.status,
          totalPrice: updatedBooking.totalPrice,
          isRenewal: true
        },
        user: {
          phone: booking.user.phone,
          username: booking.user.username,
          newLoyaltyPoints: updatedUser.loyaltyPoints
        },
        office: {
          name: booking.office.name,
          officeNumber: booking.office.officeNumber
        },
        subscription: {
          id: extendedSubscription.id,
          duration: extendedSubscription.duration,
          startDate: extendedSubscription.startDate,
          endDate: extendedSubscription.endDate,
          status: extendedSubscription.status,
          extended: true
        },
        pointsAdded: pointsToAdd,
        message: `تم تأكيد التجديد بنجاح! تم تمديد الاشتراك وإضافة ${pointsToAdd} نقطة ولاء`
      })

    } else {
      // Handle new booking: check for conflicts first
      const conflictingSubscription = await prisma.subscription.findFirst({
        where: {
          officeId: booking.officeId,
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
          },
        },
        include: {
          user: {
            select: {
              phone: true,
              username: true,
            }
          }
        }
      })

      if (conflictingSubscription) {
        return NextResponse.json({
          error: `المكتب محجوز حالياً من قبل عميل آخر حتى ${new Date(conflictingSubscription.endDate).toLocaleDateString('ar-SA')}`
        }, { status: 400 })
      }

      // Create new subscription
      console.log('📝 Creating new subscription for booking:', {
        userId: booking.userId,
        officeId: booking.officeId,
        duration: booking.duration,
        startDate: booking.startTime,
        endDate: booking.endTime,
        totalPrice: booking.totalPrice
      })

      const [updatedBooking, updatedUser, newSubscription] = await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'PAID' }
        }),
        prisma.user.update({
          where: { id: booking.userId },
          data: {
            loyaltyPoints: {
              increment: pointsToAdd
            }
          }
        }),
        prisma.subscription.create({
          data: {
            userId: booking.userId,
            officeId: booking.officeId,
            duration: booking.duration,
            startDate: booking.startTime,
            endDate: booking.endTime,
            totalPrice: booking.totalPrice,
            status: 'ACTIVE'
          }
        })
      ])

      console.log('✅ New subscription created successfully:', {
        subscriptionId: newSubscription.id,
        userId: newSubscription.userId,
        officeId: newSubscription.officeId,
        status: newSubscription.status,
        startDate: newSubscription.startDate,
        endDate: newSubscription.endDate
      })

      return NextResponse.json({
        success: true,
        booking: {
          id: updatedBooking.id,
          bookingCode: updatedBooking.bookingCode,
          status: updatedBooking.status,
          totalPrice: updatedBooking.totalPrice,
          isRenewal: false
        },
        user: {
          phone: booking.user.phone,
          username: booking.user.username,
          newLoyaltyPoints: updatedUser.loyaltyPoints
        },
        office: {
          name: booking.office.name,
          officeNumber: booking.office.officeNumber
        },
        subscription: {
          id: newSubscription.id,
          duration: newSubscription.duration,
          startDate: newSubscription.startDate,
          endDate: newSubscription.endDate,
          status: newSubscription.status,
          extended: false
        },
        pointsAdded: pointsToAdd,
        message: `تم تأكيد الحجز وتفعيل الاشتراك بنجاح! تم إضافة ${pointsToAdd} نقطة ولاء`
      })
    }



  } catch (error) {
    console.error('❌ Payment confirmation error:', error)
    return NextResponse.json({
      error: 'حدث خطأ أثناء تأكيد الدفع'
    }, { status: 500 })
  }
}
