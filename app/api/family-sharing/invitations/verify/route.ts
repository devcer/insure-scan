// Family Sharing Invitation Verification API
// Handles invitation token verification and family member activation

import { NextRequest, NextResponse } from 'next/server'
import { InvitationServiceImpl } from '@/lib/family-sharing/services/invitation-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

// Rate limiting for verification attempts (prevent brute force)
const verificationAttempts = new Map<string, { count: number; resetTime: number }>()

const VERIFICATION_RATE_LIMIT = {
  maxAttempts: 5, // Max 5 attempts per 15 minutes per IP
  windowMs: 15 * 60 * 1000 // 15 minutes
}

function checkVerificationRateLimit(ipAddress: string): boolean {
  const now = Date.now()
  const attempts = verificationAttempts.get(ipAddress)

  if (!attempts || now > attempts.resetTime) {
    // Reset or initialize rate limit
    verificationAttempts.set(ipAddress, {
      count: 1,
      resetTime: now + VERIFICATION_RATE_LIMIT.windowMs
    })
    return true
  }

  if (attempts.count >= VERIFICATION_RATE_LIMIT.maxAttempts) {
    return false
  }

  attempts.count++
  return true
}

// POST /api/family-sharing/invitations/verify - Verify invitation token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Rate limiting for verification attempts
    if (!checkVerificationRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const invitationService = new InvitationServiceImpl()
    const auditService = new AuditService()

    try {
      // Verify invitation and create family member
      const familyMember = await invitationService.verifyInvitation(token)

      // Log successful verification
      await auditService.logInvitationActivity(
        familyMember.vaultOwnerId,
        familyMember.email,
        'accepted',
        clientIP,
        request.headers.get('user-agent') || 'unknown'
      )

      return NextResponse.json({
        success: true,
        familyMember: {
          id: familyMember.id,
          email: familyMember.email,
          permissions: familyMember.permissions,
          status: familyMember.status,
          createdAt: familyMember.createdAt
        },
        message: 'Invitation verified successfully. Welcome to the family vault!'
      })

    } catch (verificationError) {
      // Log failed verification attempt as suspicious activity
      // Since we don't know the vault owner, we'll skip logging for now
      // In a real implementation, we might want to log this to a separate security log
      console.error('Failed invitation verification:', {
        token: token.substring(0, 8) + '...',
        error: verificationError instanceof Error ? verificationError.message : 'Unknown error',
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown'
      })

      throw verificationError
    }

  } catch (error) {
    console.error('Error verifying invitation:', error)
    
    // Return appropriate error message
    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired')) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation token' },
          { status: 400 }
        )
      }
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'This invitation has expired. Please request a new invitation.' },
          { status: 400 }
        )
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'You are already a member of this family vault.' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to verify invitation. Please check your invitation link.' },
      { status: 500 }
    )
  }
}

// GET /api/family-sharing/invitations/verify - Get invitation details by token (for preview)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // This is a read-only operation to show invitation details before verification
    // We'll need to add a method to the invitation service for this
    // For now, we'll return basic validation

    if (token.length < 16) {
      return NextResponse.json(
        { error: 'Invalid invitation token format' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      message: 'Invitation token appears valid. Click verify to accept the invitation.'
    })

  } catch (error) {
    console.error('Error checking invitation token:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation token' },
      { status: 500 }
    )
  }
}
