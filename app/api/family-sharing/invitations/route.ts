// Family Sharing Invitations API
// Handles invitation management for family vault sharing

import { NextRequest, NextResponse } from 'next/server'
import { InvitationServiceImpl } from '@/lib/family-sharing/services/invitation-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'
import { PermissionLevel } from '@/lib/family-sharing/types/core'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Max 10 invitations per hour per user
  windowMs: 60 * 60 * 1000 // 1 hour
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    })
    return true
  }

  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return false
  }

  userLimit.count++
  return true
}

// GET /api/family-sharing/invitations - Get invitations for a vault owner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')
    const status = searchParams.get('status')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const invitationService = new InvitationServiceImpl()
    const invitations = await invitationService.getInvitations(vaultOwnerId)

    // Filter by status if provided
    const filteredInvitations = status 
      ? invitations.filter(inv => inv.status === status)
      : invitations

    return NextResponse.json({ 
      invitations: filteredInvitations,
      total: filteredInvitations.length
    })

  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/family-sharing/invitations - Send new invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vaultOwnerId, email, permissions, specificPolicyIds } = body

    // Validation
    if (!vaultOwnerId || !email || !permissions) {
      return NextResponse.json(
        { error: 'vaultOwnerId, email, and permissions are required' },
        { status: 400 }
      )
    }

    if (!['view_all', 'view_specific'].includes(permissions)) {
      return NextResponse.json(
        { error: 'permissions must be "view_all" or "view_specific"' },
        { status: 400 }
      )
    }

    if (permissions === 'view_specific' && (!specificPolicyIds || !Array.isArray(specificPolicyIds))) {
      return NextResponse.json(
        { error: 'specificPolicyIds is required when permissions is "view_specific"' },
        { status: 400 }
      )
    }

    // Rate limiting
    if (!checkRateLimit(vaultOwnerId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 invitations per hour.' },
        { status: 429 }
      )
    }

    const invitationService = new InvitationServiceImpl()
    const auditService = new AuditService()

    // Send invitation
    const invitation = await invitationService.sendInvitation(
      vaultOwnerId,
      email,
      permissions as PermissionLevel
    )

    // Log invitation activity
    await auditService.logInvitationActivity(
      vaultOwnerId,
      email,
      'sent'
    )

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        permissions: invitation.permissions,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
