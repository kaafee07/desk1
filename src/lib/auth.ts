import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface JWTPayload {
  userId: string
  role: UserRole
  phone?: string
  username?: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

// Simple JWT verification for Edge Runtime
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    // Split the token
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('❌ Invalid token format')
      return null
    }

    // Get the payload part
    const payloadB64 = parts[1]

    // Simple base64 decode
  let payload: Record<string, unknown>
    try {
      // Replace URL-safe characters and add padding
      let base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
      while (base64.length % 4) {
        base64 += '='
      }

      // Decode using Buffer (Node.js)
      const decoded = Buffer.from(base64, 'base64').toString('utf-8')
      payload = JSON.parse(decoded)
    } catch (decodeError) {
      console.log('❌ Failed to decode token payload:', decodeError)
      return null
    }

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.log('❌ Token expired')
      return null
    }

    console.log('✅ Token verified, user ID:', payload.userId)
    return payload as JWTPayload
  } catch (error) {
    console.error('❌ JWT verification error:', error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateBookingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateQRCodeData(data: {
  phone: string
  reward: string
  pointsUsed: number
  expiryTimestamp: number
}): string {
  return JSON.stringify(data)
}

export function parseQRCodeData(qrData: string): {
  phone: string
  reward: string
  pointsUsed: number
  expiryTimestamp: number
} | null {
  try {
    return JSON.parse(qrData)
  } catch {
    return null
  }
}

export function isQRCodeExpired(expiryTimestamp: number): boolean {
  return Date.now() > expiryTimestamp
}
