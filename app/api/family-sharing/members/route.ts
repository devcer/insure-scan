// Family Sharing Members API
// Handles family member management and access control

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PermissionServiceImpl } from '@/lib/family-sharing/services/permission-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

// GET /api/family-sharing/members - Get family members for a vault owner
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

    const supabase = createSupabaseServerClient()

    // Build query
    let query = supabase
      .from('family_members')
      .select('*')
      .eq('vault_owner_id', vaultOwnerId)
      .order('created_at', { ascending: false })

    // Filter by status if provided
    if (status && ['active', 'suspended', 'revoked'].includes(status)) {
      query = query.eq('status', status as 'active' | 'suspended' | 'revoked')
    }

    const { data: familyMembers, error } = await query

    if (error) {
      throw new Error(`Failed to fetch family members: ${error.message}`)
    }

    // Get accessible policy counts for each member
    const permissionService = new PermissionServiceImpl()
    const membersWithPolicyCounts = await Promise.all(
      (familyMembers || []).map(async (member) => {
        try {
          const accessiblePolicies = await permissionService.getAccessiblePolicies(member.id)
          return {
            id: member.id,
            email: member.email,
            permissions: member.permissions,
            specificPolicyIds: member.specific_policy_ids,
            status: member.status,
            createdAt: member.created_at,
            lastAccessAt: member.last_access_at,
            accessiblePolicyCount: accessiblePolicies.length
          }
        } catch (error) {
          console.error(`Error getting policy count for member ${member.id}:`, error)
          return {
            id: member.id,
            email: member.email,
            permissions: member.permissions,
            specificPolicyIds: member.specific_policy_ids,
            status: member.status,
            createdAt: member.created_at,
            lastAccessAt: member.last_access_at,
            accessiblePolicyCount: 0
          }
        }
      })
    )

    return NextResponse.json({
      familyMembers: membersWithPolicyCounts,
      total: membersWithPolicyCounts.length
    })

  } catch (error) {
    console.error('Error fetching family members:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/family-sharing/members - Update family member status or perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, vaultOwnerId, familyMemberId, status } = body

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()
    const auditService = new AuditService()

    switch (action) {
      case 'update-status':
        if (!familyMemberId || !status) {
          return NextResponse.json(
            { error: 'familyMemberId and status are required for update-status action' },
            { status: 400 }
          )
        }

        if (!['active', 'suspended', 'revoked'].includes(status)) {
          return NextResponse.json(
            { error: 'status must be "active", "suspended", or "revoked"' },
            { status: 400 }
          )
        }

        // Update family member status
        const { error: updateError } = await supabase
          .from('family_members')
          .update({ status })
          .eq('id', familyMemberId)
          .eq('vault_owner_id', vaultOwnerId)

        if (updateError) {
          throw new Error(`Failed to update family member status: ${updateError.message}`)
        }

        // Log status change
        if (status === 'revoked') {
          await auditService.logAccessRevocation(
            vaultOwnerId,
            familyMemberId,
            'Manual status update to revoked'
          )
        } else {
          // For other status changes, we'll use permission change logging
          await auditService.logPermissionChange(
            vaultOwnerId,
            familyMemberId,
            'active' as any, // Assume previous status was active
            status as any // Cast to PermissionLevel for compatibility
          )
        }

        return NextResponse.json({
          success: true,
          message: `Family member status updated to ${status}`,
          familyMemberId,
          status
        })

      case 'bulk-suspend':
        // Suspend multiple family members
        const { familyMemberIds } = body
        if (!Array.isArray(familyMemberIds)) {
          return NextResponse.json(
            { error: 'familyMemberIds must be an array' },
            { status: 400 }
          )
        }

        const { error: bulkSuspendError } = await supabase
          .from('family_members')
          .update({ status: 'suspended' })
          .eq('vault_owner_id', vaultOwnerId)
          .in('id', familyMemberIds)

        if (bulkSuspendError) {
          throw new Error(`Failed to suspend family members: ${bulkSuspendError.message}`)
        }

        // Log bulk suspension - we'll log each member individually
        for (const memberId of familyMemberIds) {
          await auditService.logPermissionChange(
            vaultOwnerId,
            memberId,
            'active' as any, // Assume previous status was active
            'suspended' as any // Cast to PermissionLevel for compatibility
          )
        }

        return NextResponse.json({
          success: true,
          message: `${familyMemberIds.length} family members suspended`,
          suspendedCount: familyMemberIds.length
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in family members POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
