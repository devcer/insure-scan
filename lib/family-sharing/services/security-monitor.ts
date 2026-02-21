// Security Monitor Service
// Handles periodic security monitoring and alert generation for family vault sharing

import { AuditService } from './audit-service'
import { notificationService } from '../utils/notification-service'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface SecurityMonitorConfig {
  // How often to run security checks (in minutes)
  checkIntervalMinutes: number
  
  // Thresholds for different alert types
  bulkAccessThreshold: number
  rapidAccessThreshold: number
  unusualHoursThreshold: number
  
  // Whether to send notifications immediately or batch them
  immediateNotifications: boolean
  
  // Maximum alerts to process per run
  maxAlertsPerRun: number
}

export class SecurityMonitor {
  monitorInvitation(id: string) {
    throw new Error('Method not implemented.')
  }
  initializeFamilyMemberMonitoring(id: string) {
    throw new Error('Method not implemented.')
  }
  checkAccessPatterns(familyMemberId: string) {
    throw new Error('Method not implemented.')
  }
  updateMonitoringRules(familyMemberId: string, newPermissions: string) {
    throw new Error('Method not implemented.')
  }
  cleanupFamilyMemberMonitoring(familyMemberId: string) {
    throw new Error('Method not implemented.')
  }
  getSecurityAlerts(vaultOwnerId: string): import("..").SecurityAlert[] | PromiseLike<import("..").SecurityAlert[]> {
    throw new Error('Method not implemented.')
  }
  private auditService: AuditService
  private supabase = createSupabaseServerClient()
  private isRunning = false

  constructor(
    private config: SecurityMonitorConfig = {
      checkIntervalMinutes: 60, // Run every hour
      bulkAccessThreshold: 15,
      rapidAccessThreshold: 20,
      unusualHoursThreshold: 5,
      immediateNotifications: true,
      maxAlertsPerRun: 100
    }
  ) {
    this.auditService = new AuditService()
  }

  /**
   * Start the security monitoring service
   * Runs periodic checks for all vault owners
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Security monitor is already running')
      return
    }

    this.isRunning = true
    console.log(`Starting security monitor with ${this.config.checkIntervalMinutes} minute intervals`)

    // Run initial check
    await this.runSecurityCheck()

    // Schedule periodic checks
    const intervalMs = this.config.checkIntervalMinutes * 60 * 1000
    setInterval(async () => {
      if (this.isRunning) {
        await this.runSecurityCheck()
      }
    }, intervalMs)
  }

  /**
   * Stop the security monitoring service
   */
  stop(): void {
    this.isRunning = false
    console.log('Security monitor stopped')
  }

  /**
   * Run security check for all vault owners
   */
  async runSecurityCheck(): Promise<void> {
    try {
      console.log('Running security check...')
      
      // Get all vault owners who have family members
      const vaultOwners = await this.getActiveVaultOwners()
      
      let totalAlertsGenerated = 0
      let vaultOwnersProcessed = 0

      for (const vaultOwnerId of vaultOwners) {
        try {
          const alerts = await this.auditService.detectSuspiciousActivity(vaultOwnerId)
          
          if (alerts.length > 0) {
            totalAlertsGenerated += alerts.length
            
            if (this.config.immediateNotifications) {
              await notificationService.sendSecurityAlert(vaultOwnerId, alerts)
            }
            
            console.log(`Generated ${alerts.length} alerts for vault owner ${vaultOwnerId}`)
          }
          
          vaultOwnersProcessed++
          
          // Respect rate limits
          if (totalAlertsGenerated >= this.config.maxAlertsPerRun) {
            console.log(`Reached maximum alerts per run (${this.config.maxAlertsPerRun}), stopping`)
            break
          }
          
        } catch (error) {
          console.error(`Error checking security for vault owner ${vaultOwnerId}:`, error)
          // Continue with other vault owners
        }
      }

      console.log(`Security check completed: ${vaultOwnersProcessed} vault owners processed, ${totalAlertsGenerated} alerts generated`)
      
    } catch (error) {
      console.error('Error during security check:', error)
    }
  }

  /**
   * Get all vault owners who have active family members
   */
  private async getActiveVaultOwners(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('family_members')
        .select('vault_owner_id')
        .eq('status', 'active')

      if (error) {
        throw new Error(`Failed to get active vault owners: ${error.message}`)
      }

      // Get unique vault owner IDs
      const uniqueVaultOwners = Array.from(
        new Set((data || []).map(row => row.vault_owner_id))
      )

      return uniqueVaultOwners

    } catch (error) {
      console.error('Error getting active vault owners:', error)
      return []
    }
  }

  /**
   * Run security check for a specific vault owner
   */
  async checkVaultOwner(vaultOwnerId: string): Promise<{
    alertsGenerated: number
    alerts: any[]
  }> {
    try {
      const alerts = await this.auditService.detectSuspiciousActivity(vaultOwnerId)
      
      if (alerts.length > 0 && this.config.immediateNotifications) {
        await notificationService.sendSecurityAlert(vaultOwnerId, alerts)
      }

      return {
        alertsGenerated: alerts.length,
        alerts
      }

    } catch (error) {
      console.error(`Error checking vault owner ${vaultOwnerId}:`, error)
      return {
        alertsGenerated: 0,
        alerts: []
      }
    }
  }

  /**
   * Get security monitoring statistics
   */
  async getMonitoringStats(days: number = 7): Promise<{
    totalVaultOwners: number
    activeVaultOwners: number
    totalAlerts: number
    alertsByType: Record<string, number>
    alertsBySeverity: Record<string, number>
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get total vault owners
      const { count: totalVaultOwners } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get active vault owners (those with family members)
      const activeVaultOwners = await this.getActiveVaultOwners()

      // Get recent alerts
      const { data: alerts, error } = await this.supabase
        .from('family_security_alerts')
        .select('alert_type, severity')
        .gte('timestamp', startDate.toISOString())

      if (error) {
        throw new Error(`Failed to get alerts: ${error.message}`)
      }

      const alertsByType = (alerts || []).reduce((acc, alert) => {
        acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const alertsBySeverity = (alerts || []).reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalVaultOwners: totalVaultOwners || 0,
        activeVaultOwners: activeVaultOwners.length,
        totalAlerts: (alerts || []).length,
        alertsByType,
        alertsBySeverity
      }

    } catch (error) {
      console.error('Error getting monitoring stats:', error)
      throw error
    }
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<SecurityMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Security monitor configuration updated:', this.config)
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    isRunning: boolean
    config: SecurityMonitorConfig
    uptime?: number
  } {
    return {
      isRunning: this.isRunning,
      config: this.config
    }
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor()

// Auto-start in production environments
if (process.env.NODE_ENV === 'production') {
  securityMonitor.start().catch(error => {
    console.error('Failed to start security monitor:', error)
  })
}
