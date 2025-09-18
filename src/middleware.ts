import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔍 Middleware checking path:', pathname)

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/client-login',
    '/api/auth/login',
    '/api/auth/logout',
    '/test-login',
    '/simple-login',
    '/favicon.ico'
  ]

  if (publicRoutes.includes(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/public/')) {
    console.log('✅ Public route, allowing access')
    return NextResponse.next()
  }

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    console.log('❌ No auth token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify the token
    const decoded = await verifyTokenEdge(token)

    if (!decoded) {
      console.log('❌ Token verification returned null')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('✅ Token verified for user:', decoded.userId, 'role:', decoded.role)

    // Check role-based access
    if (pathname.startsWith('/admin') && decoded.role !== 'ADMIN') {
      console.log('❌ Admin access denied for role:', decoded.role)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/cashier') && decoded.role !== 'CASHIER') {
      console.log('❌ Cashier access denied for role:', decoded.role)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/client') && decoded.role !== 'CLIENT') {
      console.log('❌ Client access denied for role:', decoded.role)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Special check for API routes
    if (pathname.startsWith('/api/client/') && decoded.role !== 'CLIENT') {
      console.log('❌ Client API access denied for role:', decoded.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (pathname.startsWith('/api/admin/') && decoded.role !== 'ADMIN') {
      console.log('❌ Admin API access denied for role:', decoded.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (pathname.startsWith('/api/cashier/') && decoded.role !== 'CASHIER') {
      console.log('❌ Cashier API access denied for role:', decoded.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add user info to headers for the request
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.userId)
    requestHeaders.set('x-user-role', decoded.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  } catch (error) {
    console.log('❌ Token verification failed:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
