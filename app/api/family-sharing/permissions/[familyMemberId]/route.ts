// Family Sharing Individual Family Member Permissions API
// Handles operations on specific family member permissions

import { NextRequest, NextResponse } from 'next/server'
import { PermissionServiceImpl } from '@/lib/family-sharing/services/permission-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'
import { PermissionLevel } from '@/lib/family-sharing/types/core'

interface RouteParams {
  params: Promise<{
    familyMemberId: string
  }>
}

// GET /api/family-sharing/permissions/[familyMemberId] - Get specific family member permissions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { familyMemberId } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const permissionService = new PermissionServiceImpl()

    switch (action) {
      case 'accessible-policies':
        // Get all policies accessible to this family member
        const accessiblePolicies = await permissionService.getAccessiblePolicies(familyMemberId)
        return NextResponse.json({
          familyMemberId,
          accessiblePolicies,
          count: accessiblePolicies.length
        })

      case 'check-policy':
        // Check if family member can access specific policy
        const policyId = searchParams.get('policyId')
        if (!policyId) {
          return NextResponse.json(
            { error: 'policyId is required for check-policy action' },
            { status: 400 }
          )
        }

        const canAccess = await permissionService.canAccessPolicy(familyMemberId, policyId)
        return NextResponse.json({
          familyMemberId,
          policyId,
          canAccess
        })

      default:
        // Default: return accessible policies
        const policies = await permissionService.getAccessiblePolicies(familyMemberId)
        return NextResponse.json({
          familyMemberId,
          accessiblePolicies: policies,
          count: policies.length
        })
    }

  } catch (error) {
    console.error('Error fetching family member permissions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/family-sharing/permissions/[familyMemberId] - Update specific family member permissions
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { familyMemberId } = await params
    const body = await request.json()
    const { permissions, policyIds, vaultOwnerId } = body

    // Validation
    if (!permissions || !vaultOwnerId) {
      return NextResponse.json(
        { error: 'permissions and vaultOwnerId are required' },
        { status: 400 }
      )
    }

    if (!['view_all', 'view_specific'].includes(permissions)) {
      return NextResponse.json(
        { error: 'permissions must be "view_all" or "view_specific"' },
        { status: 400 }
      )
    }

    if (permissions === 'view_specific' && (!policyIds || !Array.isArray(policyIds))) {
      return NextResponse.json(
        { error: 'policyIds is required when permissions is "view_specific"' },
        { status: 400 }
      )
    }

    const permissionService = new PermissionServiceImpl()
    const auditService = new AuditService()

    // Get current permissions for audit logging
    const currentPolicies = await permissionService.getAccessiblePolicies(familyMemberId)

    // Update permissions
    await permissionService.setPermissions(familyMemberId, permissions as PermissionLevel)

    // Update specific policy permissions if needed
    if (permissions === 'view_specific' && policyIds) {
      await permissionService.updatePolicyPermissions(familyMemberId, policyIds)
    }

    // Log permission change with detailed information
    await auditService.logPermissionChange(
      vaultOwnerId,
      familyMemberId,
      'view_all' as PermissionLevel, // Default assumption for old permissions
      permissions as PermissionLevel,
      {
        oldPolicyCount: currentPolicies.length,
        newPolicyCount: permissions === 'view_specific' ? policyIds?.length || 0 : 'all',
        specificPolicyIds: permissions === 'view_specific' ? policyIds : undefined,
        updatedAt: new Date().toISOString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
      familyMemberId,
      permissions,
      ...(permissions === 'view_specific' && { policyIds }),
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating family member permissions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/family-sharing/permissions/[familyMemberId] - Update only policy permissions (for view_specific)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { familyMemberId } = await params
    const body = await request.json()
    const { policyIds, vaultOwnerId } = body

    // Validation
    if (!Array.isArray(policyIds) || !vaultOwnerId) {
      return NextResponse.json(
        { error: 'policyIds (array) and vaultOwnerId are required' },
        { status: 400 }
      )
    }

    const permissionService = new PermissionServiceImpl()
    const auditService = new AuditService()

    // Get current policy permissions for audit logging
    const currentPolicies = await permissionService.getAccessiblePolicies(familyMemberId)

    // Update policy permissions
    await permissionService.updatePolicyPermissions(familyMemberId, policyIds)

    // Log policy permission change
    await auditService.logPermissionChange(
      vaultOwnerId,
      familyMemberId,
      'view_specific' as PermissionLevel, // Assume it was view_specific before
      'view_specific' as PermissionLevel, // Still view_specific but with different policies
      {
        type: 'policy_permissions_update',
        oldPolicyIds: currentPolicies,
        newPolicyIds: policyIds,
        addedPolicies: policyIds.filter(id => !currentPolicies.includes(id)),
        removedPolicies: currentPolicies.filter(id => !policyIds.includes(id)),
        updatedAt: new Date().toISOString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Policy permissions updated successfully',
      familyMemberId,
      policyIds,
      addedCount: policyIds.filter(id => !currentPolicies.includes(id)).length,
      removedCount: currentPolicies.filter(id => !policyIds.includes(id)).length,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating policy permissions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/family-sharing/permissions/[familyMemberId] - Revoke all access for family member
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

    const permissionService = new PermissionServiceImpl()
    const auditService = new AuditService()

    // Get current permissions for audit logging
    const currentPolicies = await permissionService.getAccessiblePolicies(familyMemberId)

    // Revoke access
    await permissionService.revokeAccess(familyMemberId)

    // Log access revocation
    await auditService.logAuditEntry({
      vaultOwnerId,
      familyMemberId,
      activity: 'access_revoked',
      details: {
        revokedPolicyCount: currentPolicies.length,
        revokedAt: new Date().toISOString(),
        reason: 'manual_revocation_via_api'
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Access revoked successfully',
      familyMemberId,
      revokedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error revoking access:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
