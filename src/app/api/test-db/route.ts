import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log('👤 User count:', userCount)
    
    const officeCount = await prisma.office.count()
    console.log('🏢 Office count:', officeCount)

    const subscriptionCount = await prisma.subscription.count()
    console.log('📋 Subscription count:', subscriptionCount)

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date()
        }
      }
    })
    console.log('✅ Active subscription count:', activeSubscriptions)

    // Get sample subscriptions
    const sampleSubscriptions = await prisma.subscription.findMany({
      take: 3,
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
    console.log('📊 Sample subscriptions:', sampleSubscriptions)

    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        userCount,
        officeCount,
        subscriptionCount,
        activeSubscriptions,
        sampleSubscriptions,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
        environment: process.env.NODE_ENV
      }
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
        environment: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
}
