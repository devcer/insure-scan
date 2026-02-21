// Audit Service Implementation
// Handles comprehensive audit logging for family vault sharing activities

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { 
  AuditService as IAuditService,
} from '../types/services'
import {
  AuditEntry,
  AuditFilters,
  SecurityAlert,
  AccessType,
  InvitationActivity,
  PermissionLevel,
  AuditActivity,
  SecurityAlertType
} from '../types/core'
import {
  AuditEntryInsert,
  AuditEntryRow,
  SecurityAlertInsert
} from '../types/database'
import { 
  mapAuditEntryFromDb,
  mapSecurityAlertFromDb
} from '../utils/database'

export class AuditService implements IAuditService {
  logError(vaultOwnerId: string, arg1: string, arg2: { email: string; error: string }) {
    throw new Error('Method not implemented.')
  }
  logSecurityEvent(arg0: string, arg1: { token: string; error: string }) {
    throw new Error('Method not implemented.')
  }
  logUnauthorizedAccess(vaultOwnerId: string, familyMemberId: string, arg2: { policyId: string; accessType: "search" | "view" | "download" }) {
    throw new Error('Method not implemented.')
  }
  private supabase = createSupabaseServerClient()

  /**
   * Generic audit entry logging method
   * Allows direct creation of audit entries with custom details
   */
  async logAuditEntry(entry: {
    vaultOwnerId: string
    familyMemberId?: string
    activity: AuditActivity
    details: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    try {
      const auditEntry: AuditEntryInsert = {
        vault_owner_id: entry.vaultOwnerId,
        family_member_id: entry.familyMemberId,
        activity: entry.activity,
        details: entry.details,
        timestamp: new Date().toISOString(),
        ip_address: entry.ipAddress || 'unknown',
        user_agent: entry.userAgent || 'unknown'
      }

      const { error } = await this.supabase
        .from('family_audit_entries')
        .insert(auditEntry)

      if (error) {
        throw new Error(`Failed to create audit entry: ${error.message}`)
      }
    } catch (error) {
      console.error('Error logging audit entry:', error)
      // Don't throw - audit logging failures shouldn't break the main flow
    }
  }

  /**
   * Log family member access to policy
   * Records when a family member views, searches, or accesses policy information
   */
  async logPolicyAccess(
    familyMemberId: string, 
    policyId: string, 
    accessType: AccessType,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Get family member details to find vault owner
      const { data: familyMember, error: memberError } = await this.supabase
        .from('family_members')
        .select('vault_owner_id, email')
        .eq('id', familyMemberId)
        .single()

      if (memberError || !familyMember) {
        throw new Error(`Family member not found: ${familyMemberId}`)
      }

      const auditEntry: AuditEntryInsert = {
        vault_owner_id: familyMember.vault_owner_id,
        family_member_id: familyMemberId,
        activity: 'policy_accessed',
        details: {
          policyId,
          accessType,
          familyMemberEmail: familyMember.email
        },
        ip_address: ipAddress || '',
        user_agent: userAgent || ''
      }

      const { error } = await this.supabase
        .from('family_audit_entries')
        .insert(auditEntry)

      if (error) {
        throw new Error(`Failed to log policy access: ${error.message}`)
      }

      // Update family member's last access time
      await this.supabase
        .from('family_members')
        .update({ last_access_at: new Date().toISOString() })
        .eq('id', familyMemberId)

    } catch (error) {
      console.error('Error logging policy access:', error)
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Log permission changes made by vault owner
   * Records when permissions are modified, including old and new values
   */
  async logPermissionChange(
    vaultOwnerId: string,
    familyMemberId: string,
    oldPermissions: PermissionLevel,
    newPermissions: PermissionLevel,
    ipAddressOrDetails?: string | Record<string, any>,
    userAgent?: string
  ): Promise<void> {
    try {
      // Handle flexible parameter - could be ipAddress string or details object
      let ipAddress = 'unknown'
      let additionalDetails: Record<string, any> = {}
      
      if (typeof ipAddressOrDetails === 'string') {
        ipAddress = ipAddressOrDetails
      } else if (typeof ipAddressOrDetails === 'object' && ipAddressOrDetails !== null) {
        additionalDetails = ipAddressOrDetails
        ipAddress = additionalDetails.ipAddress || 'unknown'
        userAgent = additionalDetails.userAgent || userAgent || 'unknown'
      }

      // Get family member email for context
      const { data: familyMember, error: memberError } = await this.supabase
        .from('family_members')
        .select('email')
        .eq('id', familyMemberId)
        .single()

      if (memberError || !familyMember) {
        throw new Error(`Family member not found: ${familyMemberId}`)
      }

      const auditEntry: AuditEntryInsert = {
        vault_owner_id: vaultOwnerId,
        family_member_id: familyMemberId,
        activity: 'permissions_changed',
        details: {
          familyMemberEmail: familyMember.email,
          oldPermissions,
          newPermissions,
          changedBy: 'vault_owner',
          ...additionalDetails // Merge any additional details
        },
        ip_address: ipAddress,
        user_agent: userAgent || 'unknown'
      }

      const { error } = await this.supabase
        .from('family_audit_entries')
        .insert(auditEntry)

      if (error) {
        throw new Error(`Failed to log permission change: ${error.message}`)
      }

    } catch (error) {
      console.error('Error logging permission change:', error)
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Log invitation activities (sent, accepted, revoked, etc.)
   * Records all invitation lifecycle events
   */
  async logInvitationActivity(
    vaultOwnerId: string,
    email: string,
    activity: InvitationActivity,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Map invitation activity to audit activity
      const auditActivityMap: Record<InvitationActivity, AuditActivity> = {
        'sent': 'invitation_sent',
        'resent': 'invitation_sent',
        'accepted': 'invitation_accepted',
        'expired': 'invitation_revoked',
        'revoked': 'invitation_revoked'
      }

      const auditEntry: AuditEntryInsert = {
        vault_owner_id: vaultOwnerId,
        activity: auditActivityMap[activity],
        details: {
          email,
          invitationActivity: activity,
          timestamp: new Date().toISOString()
        },
        ip_address: ipAddress || '',
        user_agent: userAgent || ''
      }

      const { error } = await this.supabase
        .from('family_audit_entries')
        .insert(auditEntry)

      if (error) {
        throw new Error(`Failed to log invitation activity: ${error.message}`)
      }

    } catch (error) {
      console.error('Error logging invitation activity:', error)
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Log access revocation events
   * Records when family member access is revoked by vault owner
   */
  async logAccessRevocation(
    vaultOwnerId: string,
    familyMemberId: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Get family member email for context
      const { data: familyMember, error: memberError } = await this.supabase
        .from('family_members')
        .select('email')
        .eq('id', familyMemberId)
        .single()

      if (memberError || !familyMember) {
        throw new Error(`Family member not found: ${familyMemberId}`)
      }

      const auditEntry: AuditEntryInsert = {
        vault_owner_id: vaultOwnerId,
        family_member_id: familyMemberId,
        activity: 'access_revoked',
        details: {
          familyMemberEmail: familyMember.email,
          reason: reason || 'No reason provided',
          revokedBy: 'vault_owner'
        },
        ip_address: ipAddress || '',
        user_agent: userAgent || ''
      }

      const { error } = await this.supabase
        .from('family_audit_entries')
        .insert(auditEntry)

      if (error) {
        throw new Error(`Failed to log access revocation: ${error.message}`)
      }

    } catch (error) {
      console.error('Error logging access revocation:', error)
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Get audit trail for vault owner with optional filtering
   * Returns chronological list of all audit entries with filtering capabilities
   */
  async getAuditTrail(vaultOwnerId: string, filters?: AuditFilters): Promise<AuditEntry[]> {
    try {
      let query = this.supabase
        .from('family_audit_entries')
        .select('*')
        .eq('vault_owner_id', vaultOwnerId)
        .order('timestamp', { ascending: false })

      // Apply filters
      if (filters?.familyMemberId) {
        query = query.eq('family_member_id', filters.familyMemberId)
      }

      if (filters?.activity) {
        query = query.eq('activity', filters.activity)
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString())
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString())
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch audit trail: ${error.message}`)
      }

      return (data || []).map(row => mapAuditEntryFromDb(row as AuditEntryRow))

    } catch (error) {
      console.error('Error fetching audit trail:', error)
      throw error
    }
  }

  /**
   * Get audit statistics for dashboard
   * Returns summary statistics for the vault owner's audit trail
   */
  async getAuditStatistics(vaultOwnerId: string, days: number = 30): Promise<{
    totalActivities: number
    policyAccesses: number
    permissionChanges: number
    invitationActivities: number
    recentActivities: AuditEntry[]
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get total count
      const { count: totalCount, error: totalError } = await this.supabase
        .from('family_audit_entries')
        .select('*', { count: 'exact', head: true })
        .eq('vault_owner_id', vaultOwnerId)
        .gte('timestamp', startDate.toISOString())

      if (totalError) {
        throw new Error(`Failed to get total count: ${totalError.message}`)
      }

      // Get activity counts by type
      const { data: activities, error: activitiesError } = await this.supabase
        .from('family_audit_entries')
        .select('activity')
        .eq('vault_owner_id', vaultOwnerId)
        .gte('timestamp', startDate.toISOString())

      if (activitiesError) {
        throw new Error(`Failed to get activities: ${activitiesError.message}`)
      }

      // Count activities by type
      const activityCounts = (activities || []).reduce((acc, entry) => {
        acc[entry.activity] = (acc[entry.activity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Get recent activities (last 10)
      const recentActivities = await this.getAuditTrail(vaultOwnerId, { limit: 10 })

      return {
        totalActivities: totalCount || 0,
        policyAccesses: activityCounts['policy_accessed'] || 0,
        permissionChanges: activityCounts['permissions_changed'] || 0,
        invitationActivities: (activityCounts['invitation_sent'] || 0) + 
                             (activityCounts['invitation_accepted'] || 0) + 
                             (activityCounts['invitation_revoked'] || 0),
        recentActivities
      }

    } catch (error) {
      console.error('Error fetching audit statistics:', error)
      throw error
    }
  }

  /**
   * Detect suspicious access patterns and generate security alerts
   * Analyzes audit trail for unusual behavior patterns
   */
  async detectSuspiciousActivity(vaultOwnerId: string): Promise<SecurityAlert[]> {
    try {
      const alerts: SecurityAlert[] = []
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Get recent audit entries for analysis
      const recentEntries = await this.getAuditTrail(vaultOwnerId, {
        startDate: oneWeekAgo,
        limit: 2000
      })

      // Pattern 1: Bulk policy access detection
      const bulkAccessAlerts = await this.detectBulkPolicyAccess(
        vaultOwnerId, 
        recentEntries, 
        oneHourAgo, 
        oneDayAgo
      )
      alerts.push(...bulkAccessAlerts)

      // Pattern 2: Unusual access patterns (access outside normal hours)
      const unusualPatternAlerts = await this.detectUnusualAccessPatterns(
        vaultOwnerId,
        recentEntries,
        oneDayAgo
      )
      alerts.push(...unusualPatternAlerts)

      // Pattern 3: Access from new locations (IP-based detection)
      const newLocationAlerts = await this.detectAccessFromNewLocations(
        vaultOwnerId,
        recentEntries,
        oneWeekAgo,
        oneDayAgo
      )
      alerts.push(...newLocationAlerts)

      // Pattern 4: Multiple failed attempts simulation
      const failedAttemptAlerts = await this.detectMultipleFailedAttempts(
        vaultOwnerId,
        recentEntries,
        oneHourAgo,
        oneDayAgo
      )
      alerts.push(...failedAttemptAlerts)

      // Notify vault owner of new alerts
      if (alerts.length > 0) {
        await this.notifyVaultOwnerOfAlerts(vaultOwnerId, alerts)
      }

      return alerts

    } catch (error) {
      console.error('Error detecting suspicious activity:', error)
      throw error
    }
  }

  /**
   * Detect bulk policy access patterns
   * Identifies when family members access an unusually high number of policies
   */
  private async detectBulkPolicyAccess(
    vaultOwnerId: string,
    recentEntries: AuditEntry[],
    oneHourAgo: Date,
    oneDayAgo: Date
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []
    const policyAccesses = recentEntries.filter(entry => entry.activity === 'policy_accessed')
    
    // Group accesses by family member
    const accessesByMember = policyAccesses.reduce((acc, entry) => {
      if (entry.familyMemberId) {
        if (!acc[entry.familyMemberId]) {
          acc[entry.familyMemberId] = []
        }
        acc[entry.familyMemberId].push(entry)
      }
      return acc
    }, {} as Record<string, AuditEntry[]>)

    // Check each family member for bulk access
    for (const [familyMemberId, accesses] of Object.entries(accessesByMember)) {
      const recentAccesses = accesses.filter(entry => entry.timestamp >= oneHourAgo)
      
      // Alert if more than 15 policies accessed in 1 hour
      if (recentAccesses.length > 15) {
        const existingAlert = await this.checkExistingAlert(
          vaultOwnerId,
          familyMemberId,
          'bulk_policy_access',
          oneDayAgo
        )

        if (!existingAlert) {
          const uniquePolicies = new Set(
            recentAccesses.map(entry => entry.details.policyId)
          ).size

          const alert = await this.createSecurityAlert(
            vaultOwnerId,
            familyMemberId,
            'bulk_policy_access',
            `Family member accessed ${uniquePolicies} unique policies (${recentAccesses.length} total accesses) in the last hour`,
            recentAccesses.length > 25 ? 'high' : 'medium'
          )
          alerts.push(alert)
        }
      }
    }

    return alerts
  }

  /**
   * Detect unusual access patterns (e.g., access outside normal hours)
   * Identifies access during unusual times based on historical patterns
   */
  private async detectUnusualAccessPatterns(
    vaultOwnerId: string,
    recentEntries: AuditEntry[],
    oneDayAgo: Date
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []
    const policyAccesses = recentEntries.filter(entry => entry.activity === 'policy_accessed')

    // Group by family member
    const accessesByMember = policyAccesses.reduce((acc, entry) => {
      if (entry.familyMemberId) {
        if (!acc[entry.familyMemberId]) {
          acc[entry.familyMemberId] = []
        }
        acc[entry.familyMemberId].push(entry)
      }
      return acc
    }, {} as Record<string, AuditEntry[]>)

    for (const [familyMemberId, accesses] of Object.entries(accessesByMember)) {
      const recentAccesses = accesses.filter(entry => entry.timestamp >= oneDayAgo)
      
      // Check for access during unusual hours (11 PM - 5 AM)
      const nightAccesses = recentAccesses.filter(entry => {
        const hour = entry.timestamp.getHours()
        return hour >= 23 || hour <= 5
      })

      if (nightAccesses.length > 5) {
        const existingAlert = await this.checkExistingAlert(
          vaultOwnerId,
          familyMemberId,
          'unusual_access_pattern',
          oneDayAgo
        )

        if (!existingAlert) {
          const alert = await this.createSecurityAlert(
            vaultOwnerId,
            familyMemberId,
            'unusual_access_pattern',
            `Family member accessed ${nightAccesses.length} policies during unusual hours (11 PM - 5 AM)`,
            'low'
          )
          alerts.push(alert)
        }
      }
    }

    return alerts
  }

  /**
   * Detect access from new locations based on IP addresses
   * Identifies access from previously unseen IP addresses
   */
  private async detectAccessFromNewLocations(
    vaultOwnerId: string,
    recentEntries: AuditEntry[],
    oneWeekAgo: Date,
    oneDayAgo: Date
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    // Group entries by family member
    const entriesByMember = recentEntries.reduce((acc, entry) => {
      if (entry.familyMemberId) {
        if (!acc[entry.familyMemberId]) {
          acc[entry.familyMemberId] = []
        }
        acc[entry.familyMemberId].push(entry)
      }
      return acc
    }, {} as Record<string, AuditEntry[]>)

    for (const [familyMemberId, entries] of Object.entries(entriesByMember)) {
      // Get historical IPs (older than 1 day)
      const historicalEntries = entries.filter(entry => entry.timestamp < oneDayAgo)
      const historicalIPs = new Set(
        historicalEntries.map(entry => entry.ipAddress).filter(Boolean)
      )

      // Get recent IPs (last 24 hours)
      const recentEntries = entries.filter(entry => entry.timestamp >= oneDayAgo)
      const recentIPs = new Set(
        recentEntries.map(entry => entry.ipAddress).filter(Boolean)
      )

      // Find new IPs
      const newIPs = Array.from(recentIPs).filter(ip => !historicalIPs.has(ip))

      if (newIPs.length > 0 && historicalIPs.size > 0) {
        const existingAlert = await this.checkExistingAlert(
          vaultOwnerId,
          familyMemberId,
          'access_from_new_location',
          oneDayAgo
        )

        if (!existingAlert) {
          const alert = await this.createSecurityAlert(
            vaultOwnerId,
            familyMemberId,
            'access_from_new_location',
            `Family member accessed policies from ${newIPs.length} new IP address(es): ${newIPs.join(', ')}`,
            newIPs.length > 2 ? 'medium' : 'low'
          )
          alerts.push(alert)
        }
      }
    }

    return alerts
  }

  /**
   * Detect multiple failed attempts (simulated based on rapid successive accesses)
   * In a real implementation, this would track actual authentication failures
   */
  private async detectMultipleFailedAttempts(
    vaultOwnerId: string,
    recentEntries: AuditEntry[],
    oneHourAgo: Date,
    oneDayAgo: Date
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    // Simulate failed attempts by detecting very rapid successive accesses
    // In production, you'd track actual authentication/authorization failures
    const recentAccesses = recentEntries.filter(
      entry => entry.timestamp >= oneHourAgo && entry.activity === 'policy_accessed'
    )

    // Group by family member and IP
    const accessesByMemberAndIP = recentAccesses.reduce((acc, entry) => {
      if (entry.familyMemberId && entry.ipAddress) {
        const key = `${entry.familyMemberId}-${entry.ipAddress}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(entry)
      }
      return acc
    }, {} as Record<string, AuditEntry[]>)

    for (const [key, accesses] of Object.entries(accessesByMemberAndIP)) {
      const [familyMemberId, ipAddress] = key.split('-')
      
      // Check for very rapid accesses (more than 20 in 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const rapidAccesses = accesses.filter(entry => entry.timestamp >= tenMinutesAgo)

      if (rapidAccesses.length > 20) {
        const existingAlert = await this.checkExistingAlert(
          vaultOwnerId,
          familyMemberId,
          'multiple_failed_attempts',
          oneDayAgo
        )

        if (!existingAlert) {
          const alert = await this.createSecurityAlert(
            vaultOwnerId,
            familyMemberId,
            'multiple_failed_attempts',
            `Detected ${rapidAccesses.length} rapid access attempts from IP ${ipAddress} in 10 minutes`,
            'high'
          )
          alerts.push(alert)
        }
      }
    }

    return alerts
  }

  /**
   * Check if an alert of the same type already exists for the family member
   */
  private async checkExistingAlert(
    vaultOwnerId: string,
    familyMemberId: string,
    alertType: SecurityAlertType,
    since: Date
  ): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('family_security_alerts')
        .select('id')
        .eq('vault_owner_id', vaultOwnerId)
        .eq('family_member_id', familyMemberId)
        .eq('alert_type', alertType)
        .eq('resolved', false)
        .gte('timestamp', since.toISOString())
        .single()

      return !!data
    } catch {
      return false
    }
  }

  /**
   * Notify vault owner of new security alerts
   * Sends notifications about newly detected suspicious activities
   */
  private async notifyVaultOwnerOfAlerts(
    vaultOwnerId: string,
    alerts: SecurityAlert[]
  ): Promise<void> {
    try {
      // Log notification activity
      const auditEntry: AuditEntryInsert = {
        vault_owner_id: vaultOwnerId,
        activity: 'suspicious_activity_detected',
        details: {
          alertCount: alerts.length,
          alertTypes: alerts.map(alert => alert.alertType),
          highSeverityCount: alerts.filter(alert => alert.severity === 'high').length,
          notificationSent: true
        },
        ip_address: '',
        user_agent: 'system'
      }

      await this.supabase
        .from('family_audit_entries')
        .insert(auditEntry)

      // In a real implementation, you would send email/SMS notifications here
      // For now, we'll just log the notification intent
      console.log(`Security alert notification sent to vault owner ${vaultOwnerId}:`, {
        alertCount: alerts.length,
        severityBreakdown: {
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        }
      })

    } catch (error) {
      console.error('Error sending alert notifications:', error)
      // Don't throw - notification failure shouldn't break detection
    }
  }

  /**
   * Get suspicious activity summary for dashboard
   * Returns aggregated information about recent suspicious activities
   */
  async getSuspiciousActivitySummary(vaultOwnerId: string, days: number = 7): Promise<{
    totalAlerts: number
    unresolvedAlerts: number
    alertsByType: Record<SecurityAlertType, number>
    alertsBySeverity: Record<'low' | 'medium' | 'high', number>
    recentAlerts: SecurityAlert[]
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const alerts = await this.getSecurityAlerts(vaultOwnerId)
      const recentAlerts = alerts.filter(alert => alert.timestamp >= startDate)

      const alertsByType = recentAlerts.reduce((acc, alert) => {
        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1
        return acc
      }, {} as Record<SecurityAlertType, number>)

      const alertsBySeverity = recentAlerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1
        return acc
      }, {} as Record<'low' | 'medium' | 'high', number>)

      return {
        totalAlerts: recentAlerts.length,
        unresolvedAlerts: recentAlerts.filter(alert => !alert.resolved).length,
        alertsByType,
        alertsBySeverity,
        recentAlerts: recentAlerts.slice(0, 5) // Last 5 alerts
      }

    } catch (error) {
      console.error('Error getting suspicious activity summary:', error)
      throw error
    }
  }

  /**
   * Create a security alert
   * Internal method to create and store security alerts
   */
  private async createSecurityAlert(
    vaultOwnerId: string,
    familyMemberId: string,
    alertType: SecurityAlertType,
    description: string,
    severity: 'low' | 'medium' | 'high'
  ): Promise<SecurityAlert> {
    try {
      const alertInsert: SecurityAlertInsert = {
        vault_owner_id: vaultOwnerId,
        family_member_id: familyMemberId,
        alert_type: alertType,
        description,
        severity,
        resolved: false
      }

      const { data, error } = await this.supabase
        .from('family_security_alerts')
        .insert(alertInsert)
        .select()
        .single()

      if (error || !data) {
        throw new Error(`Failed to create security alert: ${error?.message}`)
      }

      // Log the suspicious activity detection
      await this.logSuspiciousActivity(vaultOwnerId, familyMemberId, alertType, description)

      return mapSecurityAlertFromDb(data)

    } catch (error) {
      console.error('Error creating security alert:', error)
      throw error
    }
  }

  /**
   * Log suspicious activity detection
   * Records when suspicious activity is detected and alerts are generated
   */
  private async logSuspiciousActivity(
    vaultOwnerId: string,
    familyMemberId: string,
    alertType: SecurityAlertType,
    description: string
  ): Promise<void> {
    try {
      const auditEntry: AuditEntryInsert = {
        vault_owner_id: vaultOwnerId,
        family_member_id: familyMemberId,
        activity: 'suspicious_activity_detected',
        details: {
          alertType,
          description,
          detectedAt: new Date().toISOString()
        },
        ip_address: '',
        user_agent: 'system'
      }

      await this.supabase
        .from('family_audit_entries')
        .insert(auditEntry)

    } catch (error) {
      console.error('Error logging suspicious activity:', error)
      // Don't throw - this is internal logging
    }
  }

  /**
   * Get security alerts for vault owner
   * Returns all security alerts, optionally filtered by resolved status
   */
  async getSecurityAlerts(vaultOwnerId: string, resolved?: boolean): Promise<SecurityAlert[]> {
    try {
      let query = this.supabase
        .from('family_security_alerts')
        .select('*')
        .eq('vault_owner_id', vaultOwnerId)
        .order('timestamp', { ascending: false })

      if (resolved !== undefined) {
        query = query.eq('resolved', resolved)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch security alerts: ${error.message}`)
      }

      return (data || []).map(mapSecurityAlertFromDb)

    } catch (error) {
      console.error('Error fetching security alerts:', error)
      throw error
    }
  }

  /**
   * Resolve security alert
   * Mark a security alert as resolved
   */
  async resolveSecurityAlert(alertId: string, vaultOwnerId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('family_security_alerts')
        .update({ resolved: true })
        .eq('id', alertId)
        .eq('vault_owner_id', vaultOwnerId)

      if (error) {
        throw new Error(`Failed to resolve security alert: ${error.message}`)
      }

    } catch (error) {
      console.error('Error resolving security alert:', error)
      throw error
    }
  }
}
