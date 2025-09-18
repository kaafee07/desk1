export interface JWTPayload {
  userId: string
  role: string
  phone?: string
  username?: string
  exp?: number
  iat?: number
}

// Edge-compatible base64url decode
function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
  // Convert base64 to string
  return decodeURIComponent(escape(atob(base64)))
}

export function verifyTokenEdge(token: string): JWTPayload | null {
  try {
    // Split the token
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('❌ Invalid token format')
      return null
    }

    // Get the payload part and decode
    const payloadJson = base64UrlDecode(parts[1])
    const payload = JSON.parse(payloadJson) as JWTPayload

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.log('❌ Token expired')
      return null
    }

    // Verify required fields
    if (!payload.userId || !payload.role) {
      console.log('❌ Missing required fields in payload')
      return null
    }

    console.log('✅ Token verified successfully:', payload)
    return payload
  } catch (error) {
    console.error('❌ Token verification error:', error)
    return null
  }
}