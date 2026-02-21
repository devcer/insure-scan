// Dashboard Management Service Implementation
// Handles permission modifications, invitation management, and access revocation

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvitationServiceImpl } from './invitation-service'
import { PermissionServiceImpl } from './permission-service'
import { AuditService } from './audit-service'
import { NotificationService, notificationService } from '../utils/notification-service'
import {
  PermissionLevel,
  FamilyMember,
  Invitation
} from '../types/core'

// Management operation interfaces
export interface PermissionUpdateRequest {
  familyMemberId: string
  permissions: PermissionLevel
  specificPolicyIds?: string[]
  reason?: string
}

export interface InvitationRequest {
  email: string
  permissions: PermissionLevel
  specificPolicyIds?: string[]
  message?: string
}

export interface AccessRevocationRequest {
  familyMemberId: string
  reason: string
  notifyMember?: boolean
}

export interface BulkPermissionUpdate {
  updates: PermissionUpdateRequest[]
  applyImmediately?: boolean
}

export interface ManagementOperationResult {
  success: boolean
  message: string
  affectedItems?: string[]
  errors?: string[]
}

export interface DashboardManagementService {
  // Permission modification controls
  updateFamilyMemberPermissions(vaultOwnerId: string, request: PermissionUpdateRequest): Promise<ManagementOperationResult>
  bulkUpdatePermissions(vaultOwnerId: string, request: BulkPermissionUpdate): Promise<ManagementOperationResult>
  
  // Invitation management interface
  sendNewInvitation(vaultOwnerId: string, request: InvitationRequest): Promise<ManagementOperationResult>
  resendInvitation(vaultOwnerId: string, invitationId: string): Promise<ManagementOperationResult>
  revokeInvitation(vaultOwnerId: string, invitationId: string): Promise<ManagementOperationResult>
  
  // Access revocation functionality
  revokeFamilyMemberAccess(vaultOwnerId: string, request: AccessRevocationRequest): Promise<ManagementOperationResult>
  suspendFamilyMemberAccess(vaultOwnerId: string, familyMemberId: string, reason: string): Promise<ManagementOperationResult>
  reactivateFamilyMemberAccess(vaultOwnerId: string, familyMemberId: string): Promise<ManagementOperationResult>
  
  // Batch operations for efficiency
  batchManagementOperations(vaultOwnerId: string, operations: Array<{
    type: 'update_permissions' | 'revoke_access' | 'send_invitation' | 'revoke_invitation'
    data: any
  }>): Promise<ManagementOperationResult[]>
  
  // Validation and preview
  validatePermissionUpdate(vaultOwnerId: string, request: PermissionUpdateRequest): Promise<{ valid: boolean; issues: string[] }>
  previewBulkUpdate(vaultOwnerId: string, request: BulkPermissionUpdate): Promise<{ summary: string; warnings: string[] }>
}

export class DashboardManagementServiceImpl implements DashboardManagementService {
  private supabase = createSupabaseServerClient()
  private invitationService = new InvitationServiceImpl()
  private permissionService = new PermissionServiceImpl()
  private auditService = new AuditService()
  private notificationService = notificationService

  /**
   * Update family member permissions with immediate propagation
   * Requirements: 5.3, 5.4
   */
  async updateFamilyMemberPermissions(
    vaultOwnerId: string, 
    request: PermissionUpdateRequest
  ): Promise<ManagementOperationResult> {
    try {
      // Validate the request
      const validation = await this.validatePermissionUpdate(vaultOwnerId, request)
      if (!validation.valid) {
        return {
          success: false,
          message: 'Permission update validation failed',
          errors: validation.issues
        }
      }

      // Get current family member data for audit logging
      const { data: familyMember, error: fetchError } = await this.supabase
        .from('family_members')
        .select('*')
        .eq('id', request.familyMemberId)
        .eq('vault_owner_id', vaultOwnerId)
        .eq('status', 'active')
        .single()

      if (fetchError || !familyMember) {
        return {
          success: false,
          message: 'Family member not found or inactive'
        }
      }

      const oldPermissions = familyMember.permissions

      // Update permissions
      await this.permissionService.setPermissions(request.familyMemberId, request.permissions)

      // Update specific policy permissions if needed
      if (request.permissions === 'view_specific' && request.specificPolicyIds) {
        await this.permissionService.updatePolicyPermissions(
          request.familyMemberId, 
          request.specificPolicyIds
        )
      }

      // Log the permission change with reason
      await this.auditService.logPermissionChange(
        vaultOwnerId,
        request.familyMemberId,
        oldPermissions as PermissionLevel,
        request.permissions
      )

      // Send notification to family member about permission change
      await this.notificationService.sendPermissionChangeNotification(
        familyMember.email,
        oldPermissions,
        request.permissions,
        request.reason
      )

      return {
        success: true,
        message: `Permissions updated successfully for ${familyMember.email}`,
        affectedItems: [familyMember.email]
      }
    } catch (error) {
      console.error('Error updating family member permissions:', error)
      return {
        success: false,
        message: `Failed to update permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Bulk update permissions for multiple family members
   * Requirements: 5.4
   */
  async bulkUpdatePermissions(
    vaultOwnerId: string, 
    request: BulkPermissionUpdate
  ): Promise<ManagementOperationResult> {
    try {
      const results: Array<{ familyMemberId: string; success: boolean; error?: string }> = []
      const affectedEmails: string[] = []
      const errors: string[] = []

      // Process each update
      for (const update of request.updates) {
        try {
          const result = await this.updateFamilyMemberPermissions(vaultOwnerId, update)
          
          results.push({
            familyMemberId: update.familyMemberId,
            success: result.success
          })

          if (result.success && result.affectedItems) {
            affectedEmails.push(...result.affectedItems)
          } else if (!result.success) {
            errors.push(`${update.familyMemberId}: ${result.message}`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.push({
            familyMemberId: update.familyMemberId,
            success: false,
            error: errorMessage
          })
          errors.push(`${update.familyMemberId}: ${errorMessage}`)
        }
      }

      const successCount = results.filter(r => r.success).length
      const totalCount = results.length

      // Log bulk operation
      await this.auditService.logInvitationActivity(
        vaultOwnerId,
        'system',
        'sent' // Using existing activity type for bulk operations
      )

      return {
        success: successCount > 0,
        message: `Bulk update completed: ${successCount}/${totalCount} successful`,
        affectedItems: affectedEmails,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      console.error('Error in bulk permission update:', error)
      return {
        success: false,
        message: `Bulk update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Send new invitation with specified permissions
   * Requirements: 5.3
   */
  async sendNewInvitation(
    vaultOwnerId: string, 
    request: InvitationRequest
  ): Promise<ManagementOperationResult> {
    try {
      // Validate email format
      if (!this.isValidEmail(request.email)) {
        return {
          success: false,
          message: 'Invalid email format'
        }
      }

      // Check for existing invitations or family members
      const existingCheck = await this.checkExistingAccess(vaultOwnerId, request.email)
      if (!existingCheck.canInvite) {
        return {
          success: false,
          message: existingCheck.reason || 'Cannot send invitation'
        }
      }

      // Send invitation
      const invitation = await this.invitationService.sendInvitation(
        vaultOwnerId,
        request.email,
        request.permissions
      )

      // If specific policies are requested, we'll need to handle them after acceptance
      // For now, we'll store this information in the invitation details
      if (request.permissions === 'view_specific' && request.specificPolicyIds) {
        // Store specific policy IDs for later use when invitation is accepted
        await this.supabase
          .from('family_invitations')
          .update({
            // We'll need to add a details column to store this information
            // For now, we'll handle it in the acceptance flow
          })
          .eq('id', invitation.id)
      }

      // Log invitation activity
      await this.auditService.logInvitationActivity(
        vaultOwnerId,
        request.email,
        'sent'
      )

      return {
        success: true,
        message: `Invitation sent successfully to ${request.email}`,
        affectedItems: [request.email]
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      return {
        success: false,
        message: `Failed to send invitation: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Resend existing invitation
   * Requirements: 5.3
   */
  async resendInvitation(vaultOwnerId: string, invitationId: string): Promise<ManagementOperationResult> {
    try {
      // Verify invitation belongs to vault owner
      const { data: invitation, error: fetchError } = await this.supabase
        .from('family_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('vault_owner_id', vaultOwnerId)
        .single()

      if (fetchError || !invitation) {
        return {
          success: false,
          message: 'Invitation not found'
        }
      }

      if (invitation.status !== 'pending') {
        return {
          success: false,
          message: `Cannot resend invitation with status: ${invitation.status}`
        }
      }

      // Resend invitation
      await this.invitationService.resendInvitation(invitationId)

      // Log resend activity
      await this.auditService.logInvitationActivity(
        vaultOwnerId,
        invitation.email,
        'resent'
      )

      return {
        success: true,
        message: `Invitation resent successfully to ${invitation.email}`,
        affectedItems: [invitation.email]
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      return {
        success: false,
        message: `Failed to resend invitation: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Revoke pending invitation
   * Requirements: 5.3
   */
  async revokeInvitation(vaultOwnerId: string, invitationId: string): Promise<ManagementOperationResult> {
    try {
      // Verify invitation belongs to vault owner
      const { data: invitation, error: fetchError } = await this.supabase
        .from('family_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('vault_owner_id', vaultOwnerId)
        .single()

      if (fetchError || !invitation) {
        return {
          success: false,
          message: 'Invitation not found'
        }
      }

      // Revoke invitation
      await this.invitationService.revokeInvitation(invitationId)

      // Log revocation activity
      await this.auditService.logInvitationActivity(
        vaultOwnerId,
        invitation.email,
        'revoked'
      )

      // Notify the invitee about revocation
      await this.notificationService.sendInvitationRevokedNotification(
        invitation.email,
        'The vault owner has revoked your invitation'
      )

      return {
        success: true,
        message: `Invitation revoked successfully for ${invitation.email}`,
        affectedItems: [invitation.email]
      }
    } catch (error) {
      console.error('Error revoking invitation:', error)
      return {
        success: false,
        message: `Failed to revoke invitation: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Revoke family member access permanently
   * Requirements: 5.4
   */
  async revokeFamilyMemberAccess(
    vaultOwnerId: string, 
    request: AccessRevocationRequest
  ): Promise<ManagementOperationResult> {
    try {
      // Get family member details for notification
      const { data: familyMember, error: fetchError } = await this.supabase
        .from('family_members')
        .select('*')
        .eq('id', request.familyMemberId)
        .eq('vault_owner_id', vaultOwnerId)
        .single()

      if (fetchError || !familyMember) {
        return {
          success: false,
          message: 'Family member not found'
        }
      }

      // Revoke access
      await this.permissionService.revokeAccess(request.familyMemberId)

      // Log access revocation with reason
      await this.auditService.logAccessRevocation(
        vaultOwnerId,
        request.familyMemberId,
        request.reason
      )

      // Notify family member if requested
      if (request.notifyMember) {
        await this.notificationService.sendAccessRevokedNotification(
          familyMember.email,
          request.reason
        )
      }

      return {
        success: true,
        message: `Access revoked successfully for ${familyMember.email}`,
        affectedItems: [familyMember.email]
      }
    } catch (error) {
      console.error('Error revoking family member access:', error)
      return {
        success: false,
        message: `Failed to revoke access: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Suspend family member access temporarily
   * Requirements: 5.4
   */
  async suspendFamilyMemberAccess(
    vaultOwnerId: string, 
    familyMemberId: string, 
    reason: string
  ): Promise<ManagementOperationResult> {
    try {
      // Get family member details
      const { data: familyMember, error: fetchError } = await this.supabase
        .from('family_members')
        .select('*')
        .eq('id', familyMemberId)
        .eq('vault_owner_id', vaultOwnerId)
        .single()

      if (fetchError || !familyMember) {
        return {
          success: false,
          message: 'Family member not found'
        }
      }

      // Update status to suspended
      const { error: updateError } = await this.supabase
        .from('family_members')
        .update({ status: 'suspended' })
        .eq('id', familyMemberId)

      if (updateError) {
        throw new Error(`Failed to suspend access: ${updateError.message}`)
      }

      // Log suspension
      await this.auditService.logAccessRevocation(
        vaultOwnerId,
        familyMemberId,
        `Suspended: ${reason}`
      )

      // Notify family member
      await this.notificationService.sendAccessSuspendedNotification(
        familyMember.email,
        reason
      )

      return {
        success: true,
        message: `Access suspended for ${familyMember.email}`,
        affectedItems: [familyMember.email]
      }
    } catch (error) {
      console.error('Error suspending family member access:', error)
      return {
        success: false,
        message: `Failed to suspend access: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Reactivate suspended family member access
   * Requirements: 5.4
   */
  async reactivateFamilyMemberAccess(
    vaultOwnerId: string, 
    familyMemberId: string
  ): Promise<ManagementOperationResult> {
    try {
      // Get family member details
      const { data: familyMember, error: fetchError } = await this.supabase
        .from('family_members')
        .select('*')
        .eq('id', familyMemberId)
        .eq('vault_owner_id', vaultOwnerId)
        .single()

      if (fetchError || !familyMember) {
        return {
          success: false,
          message: 'Family member not found'
        }
      }

      if (familyMember.status !== 'suspended') {
        return {
          success: false,
          message: `Cannot reactivate family member with status: ${familyMember.status}`
        }
      }

      // Update status to active
      const { error: updateError } = await this.supabase
        .from('family_members')
        .update({ status: 'active' })
        .eq('id', familyMemberId)

      if (updateError) {
        throw new Error(`Failed to reactivate access: ${updateError.message}`)
      }

      // Log reactivation
      await this.auditService.logPermissionChange(
        vaultOwnerId,
        familyMemberId,
        'suspended' as PermissionLevel,
        familyMember.permissions
      )

      // Notify family member
      await this.notificationService.sendAccessReactivatedNotification(
        familyMember.email
      )

      return {
        success: true,
        message: `Access reactivated for ${familyMember.email}`,
        affectedItems: [familyMember.email]
      }
    } catch (error) {
      console.error('Error reactivating family member access:', error)
      return {
        success: false,
        message: `Failed to reactivate access: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Execute batch management operations
   * Requirements: 5.4
   */
  async batchManagementOperations(
    vaultOwnerId: string, 
    operations: Array<{
      type: 'update_permissions' | 'revoke_access' | 'send_invitation' | 'revoke_invitation'
      data: any
    }>
  ): Promise<ManagementOperationResult[]> {
    const results: ManagementOperationResult[] = []

    for (const operation of operations) {
      try {
        let result: ManagementOperationResult

        switch (operation.type) {
          case 'update_permissions':
            result = await this.updateFamilyMemberPermissions(vaultOwnerId, operation.data)
            break
          case 'revoke_access':
            result = await this.revokeFamilyMemberAccess(vaultOwnerId, operation.data)
            break
          case 'send_invitation':
            result = await this.sendNewInvitation(vaultOwnerId, operation.data)
            break
          case 'revoke_invitation':
            result = await this.revokeInvitation(vaultOwnerId, operation.data.invitationId)
            break
          default:
            result = {
              success: false,
              message: `Unknown operation type: ${operation.type}`
            }
        }

        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          message: `Operation ${operation.type} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }

    return results
  }

  /**
   * Validate permission update request
   * Requirements: 5.3
   */
  async validatePermissionUpdate(
    vaultOwnerId: string, 
    request: PermissionUpdateRequest
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check if family member exists and belongs to vault owner
      const { data: familyMember, error: fetchError } = await this.supabase
        .from('family_members')
        .select('*')
        .eq('id', request.familyMemberId)
        .eq('vault_owner_id', vaultOwnerId)
        .single()

      if (fetchError || !familyMember) {
        issues.push('Family member not found or does not belong to this vault')
      }

      // Validate permission level
      if (!['view_all', 'view_specific'].includes(request.permissions)) {
        issues.push('Invalid permission level')
      }

      // Validate specific policy IDs if view_specific
      if (request.permissions === 'view_specific') {
        if (!request.specificPolicyIds || request.specificPolicyIds.length === 0) {
          issues.push('Specific policy IDs are required for view_specific permissions')
        } else {
          // Validate that policy IDs belong to vault owner
          const { data: validPolicies, error: policyError } = await this.supabase
            .from('insurance_premiums')
            .select('policy_key')
            .eq('user_id', vaultOwnerId)
            .eq('archived', false)
            .in('policy_key', request.specificPolicyIds)

          if (policyError) {
            issues.push('Error validating policy ownership')
          } else {
            const validPolicyIds = validPolicies?.map(p => p.policy_key) || []
            const invalidIds = request.specificPolicyIds.filter(id => !validPolicyIds.includes(id))
            
            if (invalidIds.length > 0) {
              issues.push(`Invalid policy IDs: ${invalidIds.join(', ')}`)
            }
          }
        }
      }

      return {
        valid: issues.length === 0,
        issues
      }
    } catch (error) {
      issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return {
        valid: false,
        issues
      }
    }
  }

  /**
   * Preview bulk update operations
   * Requirements: 5.4
   */
  async previewBulkUpdate(
    vaultOwnerId: string, 
    request: BulkPermissionUpdate
  ): Promise<{ summary: string; warnings: string[] }> {
    const warnings: string[] = []
    let validUpdates = 0

    for (const update of request.updates) {
      const validation = await this.validatePermissionUpdate(vaultOwnerId, update)
      if (validation.valid) {
        validUpdates++
      } else {
        warnings.push(`${update.familyMemberId}: ${validation.issues.join(', ')}`)
      }
    }

    const summary = `${validUpdates}/${request.updates.length} updates are valid and will be applied`

    return {
      summary,
      warnings
    }
  }

  /**
   * Check if email can be invited (no existing access)
   * Private helper method
   */
  private async checkExistingAccess(vaultOwnerId: string, email: string): Promise<{
    canInvite: boolean
    reason?: string
  }> {
    try {
      // Check for existing family member
      const { data: existingMember } = await this.supabase
        .from('family_members')
        .select('status')
        .eq('vault_owner_id', vaultOwnerId)
        .eq('email', email)
        .single()

      if (existingMember) {
        return {
          canInvite: false,
          reason: `Family member already exists with status: ${existingMember.status}`
        }
      }

      // Check for pending invitation
      const { data: existingInvitation } = await this.supabase
        .from('family_invitations')
        .select('status')
        .eq('vault_owner_id', vaultOwnerId)
        .eq('email', email)
        .eq('status', 'pending')
        .single()

      if (existingInvitation) {
        return {
          canInvite: false,
          reason: 'A pending invitation already exists for this email'
        }
      }

      return { canInvite: true }
    } catch (error) {
      // If no records found, that's good - can invite
      return { canInvite: true }
    }
  }

  /**
   * Validate email format
   * Private helper method
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

// Export singleton instance
export const dashboardManagementService = new DashboardManagementServiceImpl()
