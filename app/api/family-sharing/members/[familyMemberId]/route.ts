// Family Sharing Individual Member API
// Handles operations on specific family members

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PermissionServiceImpl } from '@/lib/family-sharing/services/permission-service'
import { VaultServiceImpl } from '@/lib/family-sharing/services/vault-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

interface RouteParams {
  params: Promise<{
    familyMemberId: string
  }>
}

// GET /api/family-sharing/members/[familyMemberId] - Get specific family member details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { familyMemberId } = await params
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')
    const includeActivity = searchParams.get('includeActivity') === 'true'

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    // Get family member details
    const { data: familyMember, error: memberError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', familyMemberId)
      .eq('vault_owner_id', vaultOwnerId)
      .single()

    if (memberError || !familyMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      )
    }

    // Get accessible policies count
    const permissionService = new PermissionServiceImpl()
    const accessiblePolicies = await permissionService.getAccessiblePolicies(familyMemberId)

    let recentActivity = null
    if (includeActivity) {
      // Get recent activity for this family member
      const auditService = new AuditService()
      const { data: auditEntries } = await supabase
        .from('family_audit_entries')
        .select('*')
        .eq('vault_owner_id', vaultOwnerId)
        .eq('family_member_id', familyMemberId)
        .order('timestamp', { ascending: false })
        .limit(10)

      recentActivity = auditEntries || []
    }

    const memberDetails = {
      id: familyMember.id,
      email: familyMember.email,
      permissions: familyMember.permissions,
      specificPolicyIds: familyMember.specific_policy_ids,
      status: familyMember.status,
      createdAt: familyMember.created_at,
      lastAccessAt: familyMember.last_access_at,
      accessiblePolicyCount: accessiblePolicies.length,
      accessiblePolicies: accessiblePolicies,
      ...(includeActivity && { recentActivity })
    }

    return NextResponse.json({ familyMember: memberDetails })

  } catch (error) {
    console.error('Error fetching family member details:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/family-sharing/members/[familyMemberId] - Update family member details
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { familyMemberId } = await params
    const body = await request.json()
    const { status, vaultOwnerId } = body

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    if (status && !['active', 'suspended', 'revoked'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "active", "suspended", or "revoked"' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()
    const auditService = new AuditService()

    // Get current family member for audit logging
    const { data: currentMember, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', familyMemberId)
      .eq('vault_owner_id', vaultOwnerId)
      .single()

    if (fetchError || !currentMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      )
    }

    // Update family member
    const updateData: any = {}
    if (status) {
      updateData.status = status
    }

    const { error: updateError } = await supabase
      .from('family_members')
      .update(updateData)
      .eq('id', familyMemberId)
      .eq('vault_owner_id', vaultOwnerId)

    if (updateError) {
      throw new Error(`Failed to update family member: ${updateError.message}`)
    }

    // Log the update
    if (status === 'revoked') {
      await auditService.logAccessRevocation(
        vaultOwnerId,
        familyMemberId,
        `Status changed from ${currentMember.status} to ${status}`
      )
    } else {
      // For other status changes, we'll use permission change logging
      await auditService.logPermissionChange(
        vaultOwnerId,
        familyMemberId,
        currentMember.status as any, // Cast to PermissionLevel for compatibility
        status as any // Cast to PermissionLevel for compatibility
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Family member updated successfully',
      familyMemberId,
      updates: updateData
    })

  } catch (error) {
    console.error('Error updating family member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/family-sharing/members/[familyMemberId] - Remove family member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { familyMemberId } = await params
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()
    const auditService = new AuditService()

    // Get family member details for audit logging
    const { data: familyMember, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', familyMemberId)
      .eq('vault_owner_id', vaultOwnerId)
      .single()

    if (fetchError || !familyMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      )
    }

    // Instead of deleting, we'll revoke access (soft delete)
    const { error: revokeError } = await supabase
      .from('family_members')
      .update({ 
        status: 'revoked',
        specific_policy_ids: null // Clear any specific permissions
      })
      .eq('id', familyMemberId)
      .eq('vault_owner_id', vaultOwnerId)

    if (revokeError) {
      throw new Error(`Failed to revoke family member access: ${revokeError.message}`)
    }

    // Log the removal
    await auditService.logAccessRevocation(
      vaultOwnerId,
      familyMemberId,
      'Family member removed from vault'
    )

    return NextResponse.json({
      success: true,
      message: 'Family member access revoked successfully',
      familyMemberId,
      revokedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error removing family member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
