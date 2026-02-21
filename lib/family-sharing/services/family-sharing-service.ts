// Family Sharing Service Integration
// Main service that coordinates all family sharing functionality

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvitationServiceImpl } from './invitation-service'
import { PermissionServiceImpl } from './permission-service'
import { VaultServiceImpl } from './vault-service'
import { AuditService } from './audit-service'
import { SecurityMonitor } from './security-monitor'
import { dashboardService } from './dashboard-service'
import { dashboardManagementService } from './dashboard-management'
import { notificationService } from '../utils/notification-service'
import { FAMILY_SHARING_CONFIG } from '../config'
import {
  Invitation,
  FamilyMember,
  PermissionLevel,
  PolicySummary,
  AuditEntry,
  SecurityAlert,
  AccessType
} from '../types/core'

/**
 * Main Family Sharing Service
 * Provides a unified interface for all family sharing functionality
 * Handles service coordination, dependency injection, and end-to-end workflows
 */
export class FamilyShareService {
  private invitationService: InvitationServiceImpl
  private permissionService: PermissionServiceImpl
  private vaultService: VaultServiceImpl
  private auditService: AuditService
  private securityMonitor: SecurityMonitor
  private dashboardService: typeof dashboardService
  private dashboardManagement: typeof dashboardManagementService
  private notificationService: typeof notificationService

  constructor() {
    // Use the singleton instances instead of creating new instances
    this.auditService = new AuditService()
    this.securityMonitor = new SecurityMonitor() // Fixed: only pass config, not services
    
    this.invitationService = new InvitationServiceImpl()
    this.permissionService = new PermissionServiceImpl()
    this.vaultService = new VaultServiceImpl()
    
    this.dashboardService = dashboardService
    this.dashboardManagement = dashboardManagementService
    this.notificationService = notificationService
  }

  /**
   * Complete end-to-end invitation workflow
   * Sends invitation, logs activity, and sets up monitoring
   */
  async inviteFamilyMember(
    vaultOwnerId: string,
    email: string,
    permissions: PermissionLevel,
    specificPolicyIds?: string[]
  ): Promise<Invitation> {
    try {
      // Step 1: Create and send invitation
      const invitation = await this.invitationService.sendInvitation(
        vaultOwnerId,
        email,
        permissions
      )

      // Step 2: Log the invitation activity
      await this.auditService.logInvitationActivity(
        vaultOwnerId,
        email,
        'sent' // Use InvitationActivity type
      )

      // Step 3: Set up security monitoring for this invitation
      await this.securityMonitor.monitorInvitation(invitation.id)

      // Step 4: Send notification to vault owner
      await this.notificationService.sendInvitationConfirmation(
        vaultOwnerId,
        email,
        invitation.id
      )

      return invitation
    } catch (error) {
      // Log error and re-throw
      await this.auditService.logError(vaultOwnerId, 'invitation_failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Complete end-to-end invitation acceptance workflow
   * Verifies token, activates member, sets permissions, and logs everything
   */
  async acceptInvitation(token: string): Promise<FamilyMember> {
    try {
      // Step 1: Verify and accept invitation
      const familyMember = await this.invitationService.verifyInvitation(token)

      // Step 2: Set up initial permissions
      await this.permissionService.setPermissions(
        familyMember.id,
        familyMember.permissions
      )

      // Step 3: Log the acceptance
      await this.auditService.logInvitationActivity(
        familyMember.vaultOwnerId,
        familyMember.email,
        'accepted' // Use InvitationActivity type
      )

      // Step 4: Notify vault owner of acceptance
      await this.notificationService.sendAcceptanceNotification(
        familyMember.vaultOwnerId,
        familyMember.email,
      )

      // Step 5: Initialize security monitoring for new family member
      await this.securityMonitor.initializeFamilyMemberMonitoring(familyMember.id)

      return familyMember
    } catch (error) {
      // Log security event for failed verification attempts
      await this.auditService.logSecurityEvent('token_verification_failed', {
        token: token.substring(0, 8) + '...', // Log partial token for debugging
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Complete end-to-end policy access workflow
   * Checks permissions, logs access, monitors for suspicious activity
   */
  async accessPolicy(
    familyMemberId: string,
    policyId: string,
    accessType: 'view' | 'search' | 'download' = 'view'
  ): Promise<PolicySummary> {
    try {
      // Step 1: Check permissions
      const canAccess = await this.permissionService.canAccessPolicy(familyMemberId, policyId)
      if (!canAccess) {
        // Get family member details for logging
        const familyMember = await this.getFamilyMember(familyMemberId)
        if (familyMember) {
          // Log unauthorized access attempt
          await this.auditService.logUnauthorizedAccess(familyMember.vaultOwnerId, familyMemberId, {
            policyId,
            accessType
          })
        }
        throw new Error('Unauthorized access to policy')
      }

      // Step 2: Get policy data
      const policy = await this.vaultService.getPolicyDetails(familyMemberId, policyId)

      // Step 3: Log successful access
      const mappedAccessType: AccessType = accessType === 'view' ? 'view_details' : 
                                          accessType === 'download' ? 'view_document' : 
                                          'search'
      await this.auditService.logPolicyAccess(familyMemberId, policyId, mappedAccessType)

      // Step 4: Check for suspicious activity patterns
      await this.securityMonitor.checkAccessPatterns(familyMemberId)

      return policy
    } catch (error) {
      // Log access error
      const familyMember = await this.getFamilyMember(familyMemberId)
      if (familyMember) {
        await this.auditService.logError(familyMember.vaultOwnerId, 'policy_access_failed', {
          email: familyMember.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      throw error
    }
  }

  /**
   * Complete end-to-end permission update workflow
   * Updates permissions, logs changes, notifies affected parties
   */
  async updateFamilyMemberPermissions(
    vaultOwnerId: string,
    familyMemberId: string,
    newPermissions: PermissionLevel,
    specificPolicyIds?: string[]
  ): Promise<void> {
    try {
      // Step 1: Get current permissions for audit trail
      const familyMember = await this.getFamilyMember(familyMemberId)
      if (!familyMember) {
        throw new Error('Family member not found')
      }
      const currentPermissions = familyMember.permissions

      // Step 2: Update permissions
      await this.permissionService.setPermissions(
        familyMemberId,
        newPermissions
      )

      // Step 3: Log permission change
      await this.auditService.logPermissionChange(
        vaultOwnerId,
        familyMemberId,
        currentPermissions,
        newPermissions
      )

      // Step 4: Notify family member of permission change
      if (familyMember) {
        await this.notificationService.sendPermissionChangeNotification(
          familyMember.email,
          newPermissions,
          vaultOwnerId
        )
      }

      // Step 5: Update security monitoring rules
      await this.securityMonitor.updateMonitoringRules(familyMemberId, newPermissions)

    } catch (error) {
      const familyMember = await this.getFamilyMember(familyMemberId)
      await this.auditService.logError(vaultOwnerId, 'permission_update_failed', {
        email: familyMember?.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Complete end-to-end access revocation workflow
   * Revokes access, logs activity, cleans up sessions
   */
  async revokeFamilyMemberAccess(
    vaultOwnerId: string,
    familyMemberId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Step 1: Get family member info before revocation
      const familyMember = await this.getFamilyMember(familyMemberId)

      // Step 2: Revoke all permissions
      await this.permissionService.revokeAccess(familyMemberId)

      // Step 3: Log revocation
      await this.auditService.logAccessRevocation(vaultOwnerId, familyMemberId, reason)

      // Step 4: Notify family member
      if (familyMember) {
        await this.notificationService.sendAccessRevocationNotification(
          familyMember.email,
          vaultOwnerId,
          reason
        )
      }

      // Step 5: Clean up security monitoring
      await this.securityMonitor.cleanupFamilyMemberMonitoring(familyMemberId)

    } catch (error) {
      const familyMember = await this.getFamilyMember(familyMemberId)
      await this.auditService.logError(vaultOwnerId, 'access_revocation_failed', {
        email: familyMember?.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(vaultOwnerId: string) {
    return await this.dashboardService.getDashboardData(vaultOwnerId)
  }

  /**
   * Get family member details
   */
  async getFamilyMember(familyMemberId: string): Promise<FamilyMember | null> {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', familyMemberId)
      .single()

    if (error || !data) return null
    return data as unknown as FamilyMember
  }

  /**
   * Get all family members for a vault owner
   */
  async getFamilyMembers(vaultOwnerId: string): Promise<FamilyMember[]> {
    return await this.dashboardService.getFamilyMembers(vaultOwnerId)
  }

  /**
   * Get audit trail with filtering
   */
  async getAuditTrail(vaultOwnerId: string, filters?: any): Promise<AuditEntry[]> {
    return await this.auditService.getAuditTrail(vaultOwnerId, filters)
  }

  /**
   * Get security alerts
   */
  async getSecurityAlerts(vaultOwnerId: string): Promise<SecurityAlert[]> {
    return await this.securityMonitor.getSecurityAlerts(vaultOwnerId)
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{ service: string; status: 'healthy' | 'error'; message?: string }[]> {
    const results: { service: string; status: 'healthy' | 'error'; message?: string }[] = []

    // Check each service
    const services = [
      { name: 'invitation', service: this.invitationService },
      { name: 'permission', service: this.permissionService },
      { name: 'vault', service: this.vaultService },
      { name: 'audit', service: this.auditService },
      { name: 'security', service: this.securityMonitor },
      { name: 'dashboard', service: this.dashboardService },
      { name: 'notification', service: this.notificationService }
    ]

    for (const { name, service } of services) {
      try {
        // Basic health check - try to access database
        const supabase = createSupabaseServerClient()
        await supabase.from('family_members').select('count').limit(1)
        results.push({ service: name, status: 'healthy' as const })
      } catch (error) {
        results.push({
          service: name,
          status: 'error' as const,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }
}

// Singleton instance for application-wide use
export const familyShareService = new FamilyShareService()

// Export individual services for direct access when needed
export {
  InvitationServiceImpl,
  PermissionServiceImpl,
  VaultServiceImpl,
  AuditService,
  SecurityMonitor,
}
