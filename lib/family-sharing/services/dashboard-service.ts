// Dashboard Service Implementation
// Aggregates data from all family sharing services for dashboard display

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvitationServiceImpl } from './invitation-service'
import { PermissionServiceImpl } from './permission-service'
import { AuditService } from './audit-service'
import { VaultServiceImpl } from './vault-service'
import {
  Invitation,
  FamilyMember,
  AuditEntry,
  SecurityAlert,
  PolicySummary
} from '../types/core'

// Dashboard data aggregation interfaces
export interface DashboardSummary {
  totalFamilyMembers: number
  activeFamilyMembers: number
  pendingInvitations: number
  recentActivities: number
  securityAlerts: number
  lastUpdated: Date
}

export interface FamilyMemberSummary {
  id: string
  email: string
  permissions: string
  status: string
  lastAccess?: Date
  policyCount: number
  recentActivity: boolean
}

export interface InvitationSummary {
  id: string
  email: string
  permissions: string
  status: string
  sentDate: Date
  expiresDate: Date
  daysRemaining: number
}

export interface RecentActivity {
  id: string
  type: 'policy_access' | 'permission_change' | 'invitation' | 'security_alert'
  description: string
  timestamp: Date
  familyMemberEmail?: string
  severity?: 'low' | 'medium' | 'high'
}

export interface DashboardData {
  summary: DashboardSummary
  familyMembers: FamilyMemberSummary[]
  invitations: InvitationSummary[]
  recentActivities: RecentActivity[]
  securityAlerts: SecurityAlert[]
  criticalPolicies: PolicySummary[]
}

export interface DashboardService {
  // Get complete dashboard data for vault owner
  getDashboardData(vaultOwnerId: string): Promise<DashboardData>
  
  // Get real-time summary statistics
  getSummaryStatistics(vaultOwnerId: string): Promise<DashboardSummary>
  
  // Get family member summaries with activity status
  getFamilyMemberSummaries(vaultOwnerId: string): Promise<FamilyMemberSummary[]>
  
  // Get invitation summaries with expiration tracking
  getInvitationSummaries(vaultOwnerId: string): Promise<InvitationSummary[]>
  
  // Get recent activities across all services
  getRecentActivities(vaultOwnerId: string, limit?: number): Promise<RecentActivity[]>
  
  // Get dashboard data with real-time updates
  getDashboardDataWithUpdates(vaultOwnerId: string): Promise<DashboardData>
}

export class DashboardServiceImpl implements DashboardService {
  private supabase = createSupabaseServerClient()
  private invitationService = new InvitationServiceImpl()
  private permissionService = new PermissionServiceImpl()
  private auditService = new AuditService()
  private vaultService = new VaultServiceImpl()

  /**
   * Get complete dashboard data for vault owner
   * Requirements: 5.1, 5.2, 5.5
   */
  async getDashboardData(vaultOwnerId: string): Promise<DashboardData> {
    try {
      // Fetch all data in parallel for better performance
      const [
        summary,
        familyMembers,
        invitations,
        recentActivities,
        securityAlerts
      ] = await Promise.all([
        this.getSummaryStatistics(vaultOwnerId),
        this.getFamilyMemberSummaries(vaultOwnerId),
        this.getInvitationSummaries(vaultOwnerId),
        this.getRecentActivities(vaultOwnerId, 20),
        this.getSecurityAlerts(vaultOwnerId)
      ])

      // Get critical policies if there are active family members
      let criticalPolicies: PolicySummary[] = []
      if (familyMembers.length > 0) {
        // Use the first active family member to get critical policies
        const activeMember = familyMembers.find(fm => fm.status === 'active')
        if (activeMember) {
          try {
            criticalPolicies = await this.vaultService.getCriticalPolicies(activeMember.id)
          } catch (error) {
            console.error('Error fetching critical policies:', error)
            // Don't fail the entire dashboard for this
          }
        }
      }

      return {
        summary,
        familyMembers,
        invitations,
        recentActivities,
        securityAlerts,
        criticalPolicies
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get real-time summary statistics
   * Requirements: 5.1, 5.5
   */
  async getSummaryStatistics(vaultOwnerId: string): Promise<DashboardSummary> {
    try {
      // Get family member counts
      const { data: familyMembers, error: membersError } = await this.supabase
        .from('family_members')
        .select('status')
        .eq('vault_owner_id', vaultOwnerId)

      if (membersError) {
        throw new Error(`Failed to fetch family members: ${membersError.message}`)
      }

      const totalFamilyMembers = familyMembers?.length || 0
      const activeFamilyMembers = familyMembers?.filter(fm => fm.status === 'active').length || 0

      // Get pending invitations count
      const { data: invitations, error: invitationsError } = await this.supabase
        .from('family_invitations')
        .select('status')
        .eq('vault_owner_id', vaultOwnerId)
        .eq('status', 'pending')

      if (invitationsError) {
        throw new Error(`Failed to fetch invitations: ${invitationsError.message}`)
      }

      const pendingInvitations = invitations?.length || 0

      // Get recent activities count (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentActivitiesCount, error: activitiesError } = await this.supabase
        .from('family_audit_entries')
        .select('*', { count: 'exact', head: true })
        .eq('vault_owner_id', vaultOwnerId)
        .gte('timestamp', sevenDaysAgo.toISOString())

      if (activitiesError) {
        throw new Error(`Failed to fetch recent activities: ${activitiesError.message}`)
      }

      // Get unresolved security alerts count
      const { count: securityAlertsCount, error: alertsError } = await this.supabase
        .from('family_security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('vault_owner_id', vaultOwnerId)
        .eq('resolved', false)

      if (alertsError) {
        throw new Error(`Failed to fetch security alerts: ${alertsError.message}`)
      }

      return {
        totalFamilyMembers,
        activeFamilyMembers,
        pendingInvitations,
        recentActivities: recentActivitiesCount || 0,
        securityAlerts: securityAlertsCount || 0,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error fetching summary statistics:', error)
      throw error
    }
  }

  /**
   * Get family member summaries with activity status
   * Requirements: 5.1, 5.2
   */
  async getFamilyMemberSummaries(vaultOwnerId: string): Promise<FamilyMemberSummary[]> {
    try {
      // Get all family members
      const { data: familyMembers, error: membersError } = await this.supabase
        .from('family_members')
        .select('*')
        .eq('vault_owner_id', vaultOwnerId)
        .order('created_at', { ascending: false })

      if (membersError) {
        throw new Error(`Failed to fetch family members: ${membersError.message}`)
      }

      if (!familyMembers || familyMembers.length === 0) {
        return []
      }

      // Get recent activity for each family member (last 24 hours)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const summaries: FamilyMemberSummary[] = []

      for (const member of familyMembers) {
        // Get policy count for this family member
        let policyCount = 0
        try {
          const accessiblePolicies = await this.permissionService.getAccessiblePolicies(member.id)
          policyCount = accessiblePolicies.length
        } catch (error) {
          console.error(`Error getting policy count for member ${member.id}:`, error)
        }

        // Check for recent activity
        const { data: recentActivity, error: activityError } = await this.supabase
          .from('family_audit_entries')
          .select('id')
          .eq('vault_owner_id', vaultOwnerId)
          .eq('family_member_id', member.id)
          .gte('timestamp', oneDayAgo.toISOString())
          .limit(1)

        if (activityError) {
          console.error(`Error checking recent activity for member ${member.id}:`, activityError)
        }

        const hasRecentActivity = (recentActivity?.length || 0) > 0

        summaries.push({
          id: member.id,
          email: member.email,
          permissions: this.formatPermissionLevel(member.permissions, member.specific_policy_ids),
          status: this.formatMemberStatus(member.status),
          lastAccess: member.last_access_at ? new Date(member.last_access_at) : undefined,
          policyCount,
          recentActivity: hasRecentActivity
        })
      }

      return summaries
    } catch (error) {
      console.error('Error fetching family member summaries:', error)
      throw error
    }
  }

  /**
   * Get invitation summaries with expiration tracking
   * Requirements: 5.1, 5.2
   */
  async getInvitationSummaries(vaultOwnerId: string): Promise<InvitationSummary[]> {
    try {
      const invitations = await this.invitationService.getInvitations(vaultOwnerId)

      return invitations.map(invitation => {
        const now = new Date()
        const daysRemaining = Math.max(0, Math.ceil((invitation.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

        return {
          id: invitation.id,
          email: invitation.email,
          permissions: this.formatPermissionLevel(invitation.permissions),
          status: this.formatInvitationStatus(invitation.status),
          sentDate: invitation.createdAt,
          expiresDate: invitation.expiresAt,
          daysRemaining
        }
      })
    } catch (error) {
      console.error('Error fetching invitation summaries:', error)
      throw error
    }
  }

  /**
   * Get recent activities across all services
   * Requirements: 5.5
   */
  async getRecentActivities(vaultOwnerId: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      // Get recent audit entries
      const auditEntries = await this.auditService.getAuditTrail(vaultOwnerId, { limit })

      // Get recent security alerts
      const securityAlerts = await this.getSecurityAlerts(vaultOwnerId, 5)

      // Combine and format activities
      const activities: RecentActivity[] = []

      // Add audit entries
      auditEntries.forEach(entry => {
        activities.push({
          id: entry.id,
          type: this.mapAuditActivityToActivityType(entry.activity),
          description: this.formatActivityDescription(entry),
          timestamp: entry.timestamp,
          familyMemberEmail: entry.details.familyMemberEmail || entry.details.email
        })
      })

      // Add security alerts
      securityAlerts.forEach(alert => {
        activities.push({
          id: alert.id,
          type: 'security_alert',
          description: alert.description,
          timestamp: alert.timestamp,
          severity: alert.severity
        })
      })

      // Sort by timestamp (most recent first) and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching recent activities:', error)
      throw error
    }
  }

  /**
   * Get dashboard data with real-time updates
   * Requirements: 5.5
   */
  async getDashboardDataWithUpdates(vaultOwnerId: string): Promise<DashboardData> {
    // For now, this is the same as getDashboardData
    // In a real implementation, this could include WebSocket connections
    // or server-sent events for real-time updates
    return this.getDashboardData(vaultOwnerId)
  }

  /**
   * Get security alerts for vault owner
   * Private helper method
   */
  private async getSecurityAlerts(vaultOwnerId: string, limit?: number): Promise<SecurityAlert[]> {
    try {
      return await this.auditService.getSecurityAlerts(vaultOwnerId, false) // Only unresolved alerts
    } catch (error) {
      console.error('Error fetching security alerts:', error)
      return []
    }
  }

  /**
   * Format permission level for display
   * Private helper method
   */
  private formatPermissionLevel(permissions: string, specificPolicyIds?: string[] | null): string {
    if (permissions === 'view_all') {
      return 'View All Policies'
    }
    if (permissions === 'view_specific') {
      const count = specificPolicyIds?.length || 0
      return `View ${count} Specific Policies`
    }
    return 'Unknown'
  }

  /**
   * Format member status for display
   * Private helper method
   */
  private formatMemberStatus(status: string): string {
    switch (status) {
      case 'active':
        return 'Active'
      case 'suspended':
        return 'Suspended'
      case 'revoked':
        return 'Revoked'
      default:
        return 'Unknown'
    }
  }

  /**
   * Format invitation status for display
   * Private helper method
   */
  private formatInvitationStatus(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'accepted':
        return 'Accepted'
      case 'expired':
        return 'Expired'
      case 'revoked':
        return 'Revoked'
      default:
        return 'Unknown'
    }
  }

  /**
   * Map audit activity to activity type
   * Private helper method
   */
  private mapAuditActivityToActivityType(activity: string): RecentActivity['type'] {
    switch (activity) {
      case 'policy_accessed':
        return 'policy_access'
      case 'permissions_changed':
        return 'permission_change'
      case 'invitation_sent':
      case 'invitation_accepted':
      case 'invitation_revoked':
        return 'invitation'
      case 'suspicious_activity_detected':
        return 'security_alert'
      default:
        return 'policy_access'
    }
  }

  /**
   * Format activity description for display
   * Private helper method
   */
  private formatActivityDescription(entry: AuditEntry): string {
    const email = entry.details.familyMemberEmail || entry.details.email || 'Unknown user'
    
    switch (entry.activity) {
      case 'policy_accessed':
        if (entry.details.access_type === 'bulk_view') {
          return `${email} viewed ${entry.details.policy_count || 'multiple'} policies`
        }
        return `${email} accessed policy ${entry.details.policy_id || entry.details.policyId || 'unknown'}`
      
      case 'permissions_changed':
        const oldPerms = entry.details.old_permissions || entry.details.oldPermissions
        const newPerms = entry.details.new_permissions || entry.details.newPermissions
        return `${email} permissions changed from ${oldPerms} to ${newPerms}`
      
      case 'invitation_sent':
        return `Invitation sent to ${email}`
      
      case 'invitation_accepted':
        return `${email} accepted invitation`
      
      case 'invitation_revoked':
        return `Invitation to ${email} was revoked`
      
      case 'access_revoked':
        return `Access revoked for ${email}`
      
      case 'suspicious_activity_detected':
        return `Suspicious activity detected: ${entry.details.description || 'Unknown activity'}`
      
      default:
        return `Activity: ${entry.activity} by ${email}`
    }
  }

  /**
   * Get family members for a vault owner (simplified version)
   */
  async getFamilyMembers(vaultOwnerId: string): Promise<FamilyMember[]> {
    try {
      const { data: familyMembers, error } = await this.supabase
        .from('family_members')
        .select('*')
        .eq('vault_owner_id', vaultOwnerId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch family members: ${error.message}`)
      }

      return (familyMembers || []).map(member => ({
        id: member.id,
        vaultOwnerId: member.vault_owner_id,
        email: member.email,
        permissions: member.permissions,
        specificPolicyIds: member.specific_policy_ids || undefined,
        status: member.status,
        createdAt: new Date(member.created_at),
        lastAccessAt: member.last_access_at ? new Date(member.last_access_at) : undefined
      }))
    } catch (error) {
      console.error('Error fetching family members:', error)
      return []
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardServiceImpl()
