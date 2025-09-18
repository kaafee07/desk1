import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get pending bookings created in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    // Get pending bookings
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: tenMinutesAgo
        }
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get pending reward redemptions (3 minutes expiry)
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000)

    const pendingRedemptions = await prisma.redemption.findMany({
      where: {
        status: 'PENDING',
        qrCodeExpiry: {
          gte: new Date() // Not expired yet
        },
        createdAt: {
          gte: threeMinutesAgo
        }
      },
      include: {
        user: {
          select: {
            phone: true,
            username: true
          }
        },
        reward: {
          select: {
            name: true,
            description: true,
            pointsCost: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format the response for cashier interface
    const formattedBookings = pendingBookings.map(booking => ({
      id: booking.id,
      type: 'BOOKING',
      bookingCode: booking.bookingCode,
      clientName: booking.user.username || 'غير محدد',
      clientPhone: booking.user.phone,
      officeName: booking.office.name,
      officeNumber: booking.office.officeNumber,
      packageType: booking.duration === 'HOURLY' ? 'ساعة' :
                   booking.duration === 'DAILY' ? 'يوم' : 'شهر',
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
      timeRemaining: Math.max(0, 10 - Math.floor((Date.now() - booking.createdAt.getTime()) / (60 * 1000))),
      isRenewal: booking.isRenewal || false
    }))

    const formattedRedemptions = pendingRedemptions.map(redemption => ({
      id: redemption.id,
      type: 'REWARD',
      redemptionCode: redemption.id.slice(-8).toUpperCase(),
      clientName: redemption.user.username || 'غير محدد',
      clientPhone: redemption.user.phone,
      rewardName: redemption.reward.name,
      rewardDescription: redemption.reward.description,
      pointsUsed: redemption.pointsUsed,
      createdAt: redemption.createdAt,
      timeRemaining: Math.max(0, 3 - Math.floor((Date.now() - redemption.createdAt.getTime()) / (60 * 1000))),
      qrCode: redemption.qrCode
    }))

    // Combine and sort by creation time
    const allPendingItems = [...formattedBookings, ...formattedRedemptions].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      items: allPendingItems,
      bookings: formattedBookings, // Keep for backward compatibility
      redemptions: formattedRedemptions
    })

  } catch (error) {
    console.error('Get pending bookings error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ في جلب الطلبات المعلقة' 
    }, { status: 500 })
  }
}

// Clean up expired bookings (older than 10 minutes)
export async function DELETE(request: NextRequest) {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: tenMinutesAgo
        }
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deletedBookings.count,
      message: `تم حذف ${deletedBookings.count} طلب منتهي الصلاحية`
    })

  } catch (error) {
    console.error('Delete expired bookings error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ في حذف الطلبات المنتهية الصلاحية' 
    }, { status: 500 })
  }
}
