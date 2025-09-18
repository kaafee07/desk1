import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, comparePassword } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, phone, username, password, pin } = body

    console.log('Login attempt:', { type, phone, username, pin: pin ? '****' : undefined })

    let user = null

    switch (type) {
      case 'client':
        if (!phone) {
          return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
        }

        // Find or create client user
        user = await prisma.user.upsert({
          where: { phone },
          update: {},
          create: {
            phone,
            role: UserRole.CLIENT,
            loyaltyPoints: 0,
          },
        })
        break

      case 'cashier':
        if (!pin) {
          return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
        }

        user = await prisma.user.findFirst({
          where: {
            role: UserRole.CASHIER,
            pin: pin
          },
        })

        console.log('Cashier search result:', user ? 'Found' : 'Not found', 'for PIN:', pin)

        if (!user) {
          return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
        }
        break

      case 'admin':
        if (!username || !password) {
          return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
        }

        user = await prisma.user.findUnique({
          where: { username },
        })

        if (!user || !user.password) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isValidPassword = await comparePassword(password, user.password)
        if (!isValidPassword) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid login type' }, { status: 400 })
    }

    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive:', { user: user ? 'found but inactive' : 'not found' })
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    console.log('✅ User found:', { id: user.id, role: user.role, phone: user.phone, username: user.username })

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      role: user.role,
      phone: user.phone || undefined,
      username: user.username || undefined,
    })

    console.log('✅ JWT token generated successfully')

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        phone: user.phone,
        username: user.username,
        loyaltyPoints: user.loyaltyPoints,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log('✅ Login successful, sending response')
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
