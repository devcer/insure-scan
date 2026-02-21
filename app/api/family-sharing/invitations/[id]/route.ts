// Family Sharing Individual Invitation API
// Handles operations on specific invitations (resend, revoke, get details)

import { NextRequest, NextResponse } from 'next/server'
import { InvitationServiceImpl } from '@/lib/family-sharing/services/invitation-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/family-sharing/invitations/[id] - Get specific invitation details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const invitationService = new InvitationServiceImpl()
    const invitations = await invitationService.getInvitations(vaultOwnerId)
    
    const invitation = invitations.find(inv => inv.id === id)
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ invitation })

  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/family-sharing/invitations/[id] - Update invitation (resend)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, vaultOwnerId } = body

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    if (action !== 'resend') {
      return NextResponse.json(
        { error: 'Only "resend" action is supported' },
        { status: 400 }
      )
    }

    const invitationService = new InvitationServiceImpl()
    const auditService = new AuditService()

    // Get invitation details for audit logging
    const invitations = await invitationService.getInvitations(vaultOwnerId)
    const invitation = invitations.find(inv => inv.id === id)
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Resend invitation
    await invitationService.resendInvitation(id)

    // Log resend activity
    await auditService.logInvitationActivity(
      vaultOwnerId,
      invitation.email,
      'resent'
    )

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully'
    })

  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/family-sharing/invitations/[id] - Revoke invitation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const invitationService = new InvitationServiceImpl()
    const auditService = new AuditService()

    // Get invitation details for audit logging
    const invitations = await invitationService.getInvitations(vaultOwnerId)
    const invitation = invitations.find(inv => inv.id === id)
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Revoke invitation
    await invitationService.revokeInvitation(id)

    // Log revocation activity
    await auditService.logInvitationActivity(
      vaultOwnerId,
      invitation.email,
      'revoked'
    )

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully'
    })

  } catch (error) {
    console.error('Error revoking invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
