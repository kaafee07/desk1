import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { JWTPayload } from './auth-edge'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Authentication functions (requires Node.js APIs)
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Booking related functions
export function generateBookingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// QR code related functions
export interface QRCodeData {
  phone: string
  reward: string
  pointsUsed: number
  expiryTimestamp: number
}

export function generateQRCodeData(data: QRCodeData): string {
  return JSON.stringify(data)
}

export function parseQRCodeData(qrData: string): QRCodeData | null {
  try {
    return JSON.parse(qrData)
  } catch {
    return null
  }
}

export function isQRCodeExpired(expiryTimestamp: number): boolean {
  return Date.now() > expiryTimestamp
}
