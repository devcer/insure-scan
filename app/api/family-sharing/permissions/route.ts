// Family Sharing Permissions API
// Handles permission management for family members

import { NextRequest, NextResponse } from 'next/server'
import { PermissionServiceImpl } from '@/lib/family-sharing/services/permission-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'
import { PermissionLevel } from '@/lib/family-sharing/types/core'

// GET /api/family-sharing/permissions - Get family member permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const familyMemberId = searchParams.get('familyMemberId')
    const vaultOwnerId = searchParams.get('vaultOwnerId')
    const action = searchParams.get('action')

    if (!familyMemberId) {
      return NextResponse.json(
        { error: 'familyMemberId is required' },
        { status: 400 }
      )
    }

    const permissionService = new PermissionServiceImpl()

    switch (action) {
      case 'accessible-policies':
        // Get all policies accessible to family member
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
        // Default: return both accessible policies and basic info
        const policies = await permissionService.getAccessiblePolicies(familyMemberId)
        return NextResponse.json({
          familyMemberId,
          accessiblePolicies: policies,
          count: policies.length
        })
    }

  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/family-sharing/permissions - Update family member permissions
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { familyMemberId, permissions, policyIds, vaultOwnerId } = body

    // Validation
    if (!familyMemberId || !permissions || !vaultOwnerId) {
      return NextResponse.json(
        { error: 'familyMemberId, permissions, and vaultOwnerId are required' },
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

    // Update permissions
    await permissionService.setPermissions(familyMemberId, permissions as PermissionLevel)

    // Update specific policy permissions if needed
    if (permissions === 'view_specific' && policyIds) {
      await permissionService.updatePolicyPermissions(familyMemberId, policyIds)
    }

    // Log permission change
    await auditService.logPermissionChange(
      vaultOwnerId,
      familyMemberId,
      'view_all' as PermissionLevel, // Default assumption for old permissions
      permissions as PermissionLevel,
      {
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
      ...(permissions === 'view_specific' && { policyIds })
    })

  } catch (error) {
    console.error('Error updating permissions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/family-sharing/permissions - Bulk update permissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates, vaultOwnerId } = body

    // Validation
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    // Validate each update
    for (const update of updates) {
      if (!update.familyMemberId || !update.permissions) {
        return NextResponse.json(
          { error: 'Each update must have familyMemberId and permissions' },
          { status: 400 }
        )
      }

      if (!['view_all', 'view_specific'].includes(update.permissions)) {
        return NextResponse.json(
          { error: 'permissions must be "view_all" or "view_specific"' },
          { status: 400 }
        )
      }

      if (update.permissions === 'view_specific' && (!update.policyIds || !Array.isArray(update.policyIds))) {
        return NextResponse.json(
          { error: 'policyIds is required when permissions is "view_specific"' },
          { status: 400 }
        )
      }
    }

    const permissionService = new PermissionServiceImpl()
    const auditService = new AuditService()

    // Perform bulk update
    await permissionService.bulkUpdatePermissions(updates)

    // Log bulk permission change
    await auditService.logAuditEntry({
      vaultOwnerId,
      activity: 'permissions_changed',
      details: {
        type: 'bulk_update',
        updatesCount: updates.length,
        updates: updates.map(u => ({
          familyMemberId: u.familyMemberId,
          permissions: u.permissions,
          policyCount: u.policyIds?.length || 0
        })),
        updatedAt: new Date().toISOString()
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: `Successfully updated permissions for ${updates.length} family members`,
      updatesCount: updates.length
    })

  } catch (error) {
    console.error('Error in bulk permission update:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
