import { UserRole } from '@prisma/client'

export interface JWTPayload {
  userId: string
  role: UserRole
  phone?: string
  username?: string
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Base64 URL encode
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Base64 URL decode
function base64UrlDecode(str: string): string {
  str += '='.repeat((4 - str.length % 4) % 4)
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
}

// Simple HMAC SHA256 implementation using Web Crypto API
async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const messageData = encoder.encode(data)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const signatureArray = new Uint8Array(signature)
  
  // Convert to base64url
  let binary = ''
  for (let i = 0; i < signatureArray.length; i++) {
    binary += String.fromCharCode(signatureArray[i])
  }
  
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Sign JWT token
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days
  }
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = await hmacSha256(JWT_SECRET, data)
  
  return `${data}.${signature}`
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('❌ Invalid token format')
      return null
    }
    
    const [encodedHeader, encodedPayload, signature] = parts
    const data = `${encodedHeader}.${encodedPayload}`
    
    // Verify signature
    const expectedSignature = await hmacSha256(JWT_SECRET, data)
    if (signature !== expectedSignature) {
      console.log('❌ Invalid token signature')
      return null
    }
    
    // Decode payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload))
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ Token expired')
      return null
    }
    
    console.log('✅ Token verified successfully:', payload)
    return payload
    
  } catch (error) {
    console.log('❌ Token verification failed:', error)
    return null
  }
}
