// Family Sharing Main API Endpoint
// Provides unified access to all family sharing functionality

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { familyShareService } from '@/lib/family-sharing/services/family-sharing-service'
import { FAMILY_SHARING_CONFIG, ERROR_MESSAGES } from '@/lib/family-sharing/config'

/**
 * GET /api/family-sharing
 * Get overview of family sharing status and health
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'health':
        // System health check
        const healthStatus = await familyShareService.healthCheck()
        return NextResponse.json({
          status: 'ok',
          services: healthStatus,
          config: {
            maxInvitations: FAMILY_SHARING_CONFIG.MAX_INVITATIONS_PER_VAULT,
            invitationExpiryHours: FAMILY_SHARING_CONFIG.INVITATION_EXPIRY_HOURS,
            sessionTimeoutMinutes: FAMILY_SHARING_CONFIG.SESSION_TIMEOUT_MINUTES
          }
        })

      case 'dashboard':
        // Get dashboard overview
        const dashboardData = await familyShareService.getDashboardData(session.user.id)
        return NextResponse.json(dashboardData)

      case 'members':
        // Get all family members
        const familyMembers = await familyShareService.getFamilyMembers(session.user.id)
        return NextResponse.json({ familyMembers })

      case 'audit':
        // Get audit trail
        const auditTrail = await familyShareService.getAuditTrail(session.user.id)
        return NextResponse.json({ auditTrail })

      case 'alerts':
        // Get security alerts
        const alerts = await familyShareService.getSecurityAlerts(session.user.id)
        return NextResponse.json({ alerts })

      default:
        // Default overview
        const overview = {
          familyMembersCount: (await familyShareService.getFamilyMembers(session.user.id)).length,
          recentAlerts: (await familyShareService.getSecurityAlerts(session.user.id)).length,
          systemStatus: 'operational'
        }
        return NextResponse.json(overview)
    }

  } catch (error) {
    console.error('Family sharing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/family-sharing
 * Handle family sharing actions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'invite':
        // Send family member invitation
        const { email, permissions, specificPolicyIds } = params
        if (!email || !permissions) {
          return NextResponse.json(
            { error: 'Email and permissions are required' },
            { status: 400 }
          )
        }

        const invitation = await familyShareService.inviteFamilyMember(
          session.user.id,
          email,
          permissions,
          specificPolicyIds
        )

        return NextResponse.json({
          success: true,
          invitation: {
            id: invitation.id,
            email: invitation.email,
            permissions: invitation.permissions,
            expiresAt: invitation.expiresAt
          }
        })

      case 'accept':
        // Accept invitation (typically called by family member)
        const { token } = params
        if (!token) {
          return NextResponse.json(
            { error: 'Invitation token is required' },
            { status: 400 }
          )
        }

        const familyMember = await familyShareService.acceptInvitation(token)
        return NextResponse.json({
          success: true,
          familyMember: {
            id: familyMember.id,
            email: familyMember.email,
            permissions: familyMember.permissions,
            status: familyMember.status
          }
        })

      case 'updatePermissions':
        // Update family member permissions
        const { familyMemberId, newPermissions, newSpecificPolicyIds } = params
        if (!familyMemberId || !newPermissions) {
          return NextResponse.json(
            { error: 'Family member ID and permissions are required' },
            { status: 400 }
          )
        }

        await familyShareService.updateFamilyMemberPermissions(
          session.user.id,
          familyMemberId,
          newPermissions,
          newSpecificPolicyIds
        )

        return NextResponse.json({ success: true })

      case 'revokeAccess':
        // Revoke family member access
        const { familyMemberId: memberToRevoke, reason } = params
        if (!memberToRevoke) {
          return NextResponse.json(
            { error: 'Family member ID is required' },
            { status: 400 }
          )
        }

        await familyShareService.revokeFamilyMemberAccess(
          session.user.id,
          memberToRevoke,
          reason
        )

        return NextResponse.json({ success: true })

      case 'accessPolicy':
        // Access a shared policy (for family members)
        const { policyId, accessType = 'view' } = params
        if (!policyId) {
          return NextResponse.json(
            { error: 'Policy ID is required' },
            { status: 400 }
          )
        }

        // Note: This assumes the session user is a family member
        // In a real implementation, you'd need to determine if this is a vault owner or family member
        const policy = await familyShareService.accessPolicy(
          session.user.id, // This would be familyMemberId in practice
          policyId,
          accessType
        )

        return NextResponse.json({ policy })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Family sharing POST error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
