// Permission Service Implementation
// Manages access control and permission enforcement for family members

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PermissionService } from '../types/services'
import { PermissionLevel, FamilyMember } from '../types/core'

export class PermissionServiceImpl implements PermissionService {
  getFamilyMemberPermissions(familyMemberId: string) {
    throw new Error('Method not implemented.')
  }
  private supabase = createSupabaseServerClient()

  /**
   * Set permissions for a family member with immediate propagation
   * Requirements: 2.1, 2.2, 2.4
   */
  async setPermissions(familyMemberId: string, permissions: PermissionLevel): Promise<void> {
    // Validate permission level
    if (!this.isValidPermissionLevel(permissions)) {
      throw new Error(`Invalid permission level: ${permissions}`)
    }

    // Get current family member to validate they exist and capture old permissions
    const { data: familyMember, error: fetchError } = await this.supabase
      .from('family_members')
      .select('*')
      .eq('id', familyMemberId)
      .eq('status', 'active')
      .single()

    if (fetchError || !familyMember) {
      throw new Error(`Family member not found or inactive: ${familyMemberId}`)
    }

    const oldPermissions = familyMember.permissions

    // Prepare update data based on permission level
    const updateData: Partial<FamilyMember> = {
      permissions,
      // Clear specific policy IDs if switching to view_all
      ...(permissions === 'view_all' && { specific_policy_ids: null })
    }

    // Update family member permissions
    const { error: updateError } = await this.supabase
      .from('family_members')
      .update(updateData)
      .eq('id', familyMemberId)

    if (updateError) {
      throw new Error(`Failed to update permissions: ${updateError.message}`)
    }

    // Log permission change for audit trail (immediate propagation)
    await this.logPermissionChange(
      familyMember.vault_owner_id,
      familyMemberId,
      oldPermissions,
      permissions
    )

    // Invalidate any cached permissions or sessions if needed
    await this.invalidateUserSessions(familyMemberId)
  }

  /**
   * Check if family member can access specific policy
   * Requirements: 2.3
   */
  async canAccessPolicy(familyMemberId: string, policyId: string): Promise<boolean> {
    try {
      // Get family member with their permissions
      const { data: familyMember, error } = await this.supabase
        .from('family_members')
        .select('permissions, specific_policy_ids, status')
        .eq('id', familyMemberId)
        .eq('status', 'active')
        .single()

      if (error || !familyMember) {
        return false // Family member not found or inactive
      }

      // Check permission level
      if (familyMember.permissions === 'view_all') {
        return true // Can access all policies
      }

      if (familyMember.permissions === 'view_specific') {
        // Check if policy ID is in the specific policy list
        return familyMember.specific_policy_ids?.includes(policyId) ?? false
      }

      return false // Unknown permission level
    } catch (error) {
      // Log error but don't expose internal details
      console.error('Error checking policy access:', error)
      return false
    }
  }

  /**
   * Get all policies accessible to family member
   * Requirements: 2.3
   */
  async getAccessiblePolicies(familyMemberId: string): Promise<string[]> {
    try {
      // Get family member with their permissions
      const { data: familyMember, error } = await this.supabase
        .from('family_members')
        .select('permissions, specific_policy_ids, status, vault_owner_id')
        .eq('id', familyMemberId)
        .eq('status', 'active')
        .single()

      if (error || !familyMember) {
        return [] // Family member not found or inactive
      }

      if (familyMember.permissions === 'view_all') {
        // Get all policy keys for the vault owner from insurance_premiums
        const { data: premiums, error: premiumsError } = await this.supabase
          .from('insurance_premiums')
          .select('policy_key')
          .eq('user_id', familyMember.vault_owner_id)
          .eq('archived', false)

        if (premiumsError) {
          console.error('Error fetching all policies:', premiumsError)
          return []
        }

        // Get unique policy keys
        const uniquePolicyKeys = [...new Set(premiums?.map(p => p.policy_key) ?? [])]
        return uniquePolicyKeys
      }

      if (familyMember.permissions === 'view_specific') {
        return familyMember.specific_policy_ids ?? []
      }

      return [] // Unknown permission level
    } catch (error) {
      console.error('Error getting accessible policies:', error)
      return []
    }
  }

  /**
   * Update specific policy permissions for view_specific family members with immediate enforcement
   * Requirements: 2.2, 2.4
   */
  async updatePolicyPermissions(familyMemberId: string, policyIds: string[]): Promise<void> {
    // Validate input
    if (!Array.isArray(policyIds)) {
      throw new Error('Policy IDs must be an array')
    }

    if (policyIds.length === 0) {
      throw new Error('At least one policy ID must be specified for view_specific permissions')
    }

    // Get current family member
    const { data: familyMember, error: fetchError } = await this.supabase
      .from('family_members')
      .select('*')
      .eq('id', familyMemberId)
      .eq('status', 'active')
      .single()

    if (fetchError || !familyMember) {
      throw new Error(`Family member not found or inactive: ${familyMemberId}`)
    }

    // Ensure family member has view_specific permissions
    if (familyMember.permissions !== 'view_specific') {
      throw new Error('Can only update policy permissions for family members with view_specific permissions')
    }

    // Validate that all policy IDs belong to the vault owner
    const { data: validPremiums, error: validationError } = await this.supabase
      .from('insurance_premiums')
      .select('policy_key')
      .eq('user_id', familyMember.vault_owner_id)
      .eq('archived', false)
      .in('policy_key', policyIds)

    if (validationError) {
      throw new Error(`Failed to validate policy ownership: ${validationError.message}`)
    }

    const validPolicyIds = [...new Set(validPremiums?.map(p => p.policy_key) ?? [])]
    const invalidPolicyIds = policyIds.filter(id => !validPolicyIds.includes(id))

    if (invalidPolicyIds.length > 0) {
      throw new Error(`Invalid policy IDs (not owned by vault owner): ${invalidPolicyIds.join(', ')}`)
    }

    const oldPolicyIds = familyMember.specific_policy_ids ?? []

    // Update specific policy permissions
    const { error: updateError } = await this.supabase
      .from('family_members')
      .update({ specific_policy_ids: policyIds })
      .eq('id', familyMemberId)

    if (updateError) {
      throw new Error(`Failed to update policy permissions: ${updateError.message}`)
    }

    // Log policy permission change for audit trail (immediate propagation)
    await this.logPolicyPermissionChange(
      familyMember.vault_owner_id,
      familyMemberId,
      oldPolicyIds,
      policyIds
    )

    // Invalidate any cached permissions or sessions for immediate enforcement
    await this.invalidateUserSessions(familyMemberId)
  }

  /**
   * Remove all access for family member with immediate enforcement
   * Requirements: 2.4
   */
  async revokeAccess(familyMemberId: string): Promise<void> {
    // Get current family member for audit logging
    const { data: familyMember, error: fetchError } = await this.supabase
      .from('family_members')
      .select('vault_owner_id, permissions')
      .eq('id', familyMemberId)
      .single()

    if (fetchError || !familyMember) {
      throw new Error(`Family member not found: ${familyMemberId}`)
    }

    // Update family member status to revoked
    const { error } = await this.supabase
      .from('family_members')
      .update({ 
        status: 'revoked',
        specific_policy_ids: null // Clear any specific policy permissions
      })
      .eq('id', familyMemberId)

    if (error) {
      throw new Error(`Failed to revoke access: ${error.message}`)
    }

    // Log access revocation for audit trail (immediate propagation)
    await this.logAccessRevocation(familyMember.vault_owner_id, familyMemberId)

    // Immediately invalidate all sessions for this family member
    await this.invalidateUserSessions(familyMemberId)
  }

  /**
   * Bulk update permissions for multiple family members
   * Requirements: 2.4 (efficient permission propagation)
   */
  async bulkUpdatePermissions(updates: Array<{ familyMemberId: string; permissions: PermissionLevel; policyIds?: string[] }>): Promise<void> {
    const results = []
    
    for (const update of updates) {
      try {
        if (update.permissions === 'view_specific' && update.policyIds) {
          await this.setPermissions(update.familyMemberId, update.permissions)
          await this.updatePolicyPermissions(update.familyMemberId, update.policyIds)
        } else {
          await this.setPermissions(update.familyMemberId, update.permissions)
        }
        results.push({ familyMemberId: update.familyMemberId, success: true })
      } catch (error) {
        results.push({ 
          familyMemberId: update.familyMemberId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Check if any updates failed
    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
      throw new Error(`Some permission updates failed: ${JSON.stringify(failures)}`)
    }
  }

  /**
   * Validate permission level
   * Private helper method
   */
  private isValidPermissionLevel(permissions: string): permissions is PermissionLevel {
    return permissions === 'view_all' || permissions === 'view_specific'
  }

  /**
   * Log permission changes for audit trail
   * Private helper method for immediate propagation
   */
  private async logPermissionChange(
    vaultOwnerId: string,
    familyMemberId: string,
    oldPermissions: PermissionLevel,
    newPermissions: PermissionLevel
  ): Promise<void> {
    try {
      await this.supabase
        .from('family_audit_entries')
        .insert({
          vault_owner_id: vaultOwnerId,
          family_member_id: familyMemberId,
          activity: 'permissions_changed',
          details: {
            old_permissions: oldPermissions,
            new_permissions: newPermissions,
            changed_at: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to log permission change:', error)
    }
  }

  /**
   * Log policy permission changes for audit trail
   * Private helper method for immediate propagation
   */
  private async logPolicyPermissionChange(
    vaultOwnerId: string,
    familyMemberId: string,
    oldPolicyIds: string[],
    newPolicyIds: string[]
  ): Promise<void> {
    try {
      await this.supabase
        .from('family_audit_entries')
        .insert({
          vault_owner_id: vaultOwnerId,
          family_member_id: familyMemberId,
          activity: 'permissions_changed',
          details: {
            change_type: 'policy_permissions',
            old_policy_ids: oldPolicyIds,
            new_policy_ids: newPolicyIds,
            added_policies: newPolicyIds.filter(id => !oldPolicyIds.includes(id)),
            removed_policies: oldPolicyIds.filter(id => !newPolicyIds.includes(id)),
            changed_at: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to log policy permission change:', error)
    }
  }

  /**
   * Log access revocation for audit trail
   * Private helper method for immediate propagation
   */
  private async logAccessRevocation(vaultOwnerId: string, familyMemberId: string): Promise<void> {
    try {
      await this.supabase
        .from('family_audit_entries')
        .insert({
          vault_owner_id: vaultOwnerId,
          family_member_id: familyMemberId,
          activity: 'access_revoked',
          details: {
            revoked_at: new Date().toISOString(),
            reason: 'manual_revocation'
          },
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to log access revocation:', error)
    }
  }

  /**
   * Invalidate user sessions for immediate permission enforcement
   * Private helper method for immediate propagation
   */
  private async invalidateUserSessions(familyMemberId: string): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Invalidate JWT tokens or session tokens
      // 2. Clear any cached permissions in Redis/memory
      // 3. Notify other services about permission changes
      // 4. Force re-authentication on next request
      
      // For now, we'll log the invalidation request
      console.log(`Invalidating sessions for family member: ${familyMemberId}`)
      
      // This could integrate with:
      // - JWT blacklist service
      // - Redis cache invalidation
      // - WebSocket notifications to active sessions
      // - Session management service
      
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to invalidate user sessions:', error)
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionServiceImpl()
