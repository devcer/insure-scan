// Notification Service for Family Vault Sharing
// Handles sending notifications to vault owners about security events

import { SecurityAlert } from '../types/core'

export interface NotificationService {
  // Security and audit notifications
  sendSecurityAlert(vaultOwnerId: string, alerts: SecurityAlert[]): Promise<void>
  
  // Invitation notifications (to vault owner)
  sendInvitationNotification(vaultOwnerId: string, email: string, activity: string): Promise<void>
  
  // Permission change notifications (to vault owner)
  sendVaultOwnerPermissionChangeNotification(vaultOwnerId: string, familyMemberEmail: string, change: string): Promise<void>
  
  // Direct notifications to family members
  sendPermissionChangeNotification(email: string, oldPermissions: string, newPermissions: string, reason?: string): Promise<void>
  sendInvitationRevokedNotification(email: string, reason: string): Promise<void>
  sendAccessRevokedNotification(email: string, reason: string): Promise<void>
  sendAccessSuspendedNotification(email: string, reason: string): Promise<void>
  sendAccessReactivatedNotification(email: string): Promise<void>
  
  // Additional methods used by FamilyShareService
  sendInvitationConfirmation(vaultOwnerId: string, email: string, invitationId: string): Promise<void>
  sendAcceptanceNotification(vaultOwnerId: string, email: string): Promise<void>
  sendAccessRevocationNotification(vaultOwnerId: string, email: string): Promise<void>
}

/**
 * Email-based notification service
 * In production, this would integrate with an email service like SendGrid, AWS SES, etc.
 */
export class EmailNotificationService implements NotificationService {
  
  /**
   * Send security alert notifications to vault owner
   */
  async sendSecurityAlert(vaultOwnerId: string, alerts: SecurityAlert[]): Promise<void> {
    try {
      // In production, this would send actual emails
      // For now, we'll log the notification details
      
      const alertSummary = this.formatSecurityAlertSummary(alerts)
      
      console.log(`[EMAIL NOTIFICATION] Security Alert for Vault Owner ${vaultOwnerId}:`)
      console.log(alertSummary)
      
      // TODO: Integrate with actual email service
      // await this.emailService.send({
      //   to: vaultOwnerEmail,
      //   subject: `Security Alert: ${alerts.length} suspicious activities detected`,
      //   html: this.generateSecurityAlertEmail(alerts)
      // })
      
    } catch (error) {
      console.error('Error sending security alert notification:', error)
      // Don't throw - notification failures shouldn't break the main flow
    }
  }

  /**
   * Send invitation-related notifications
   */
  async sendInvitationNotification(vaultOwnerId: string, email: string, activity: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Invitation ${activity} for ${email} (Vault Owner: ${vaultOwnerId})`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending invitation notification:', error)
    }
  }

  /**
   * Send permission change notifications
   */
  async sendVaultOwnerPermissionChangeNotification(vaultOwnerId: string, familyMemberEmail: string, change: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Permission change for ${familyMemberEmail}: ${change} (Vault Owner: ${vaultOwnerId})`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending permission change notification:', error)
    }
  }

  /**
   * Send permission change notification directly to family member
   */
  async sendPermissionChangeNotification(email: string, oldPermissions: string, newPermissions: string, reason?: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Permission changed for ${email}: ${oldPermissions} → ${newPermissions}${reason ? ` (Reason: ${reason})` : ''}`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending permission change notification:', error)
    }
  }

  /**
   * Send invitation revoked notification
   */
  async sendInvitationRevokedNotification(email: string, reason: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Invitation revoked for ${email}: ${reason}`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending invitation revoked notification:', error)
    }
  }

  /**
   * Send access revoked notification
   */
  async sendAccessRevokedNotification(email: string, reason: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Access revoked for ${email}: ${reason}`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending access revoked notification:', error)
    }
  }

  /**
   * Send access suspended notification
   */
  async sendAccessSuspendedNotification(email: string, reason: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Access suspended for ${email}: ${reason}`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending access suspended notification:', error)
    }
  }

  /**
   * Send access reactivated notification
   */
  async sendAccessReactivatedNotification(email: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Access reactivated for ${email}`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending access reactivated notification:', error)
    }
  }

  /**
   * Send invitation confirmation to vault owner
   */
  async sendInvitationConfirmation(vaultOwnerId: string, email: string, invitationId: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Invitation confirmation for vault owner ${vaultOwnerId}: invited ${email} (${invitationId})`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending invitation confirmation:', error)
    }
  }

  /**
   * Send acceptance notification to vault owner
   */
  async sendAcceptanceNotification(vaultOwnerId: string, email: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Acceptance notification for vault owner ${vaultOwnerId}: ${email} accepted invitation`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending acceptance notification:', error)
    }
  }

  /**
   * Send access revocation notification to vault owner
   */
  async sendAccessRevocationNotification(vaultOwnerId: string, email: string): Promise<void> {
    try {
      console.log(`[EMAIL NOTIFICATION] Access revocation notification for vault owner ${vaultOwnerId}: ${email} access revoked`)
      
      // TODO: Send actual email notification
      
    } catch (error) {
      console.error('Error sending access revocation notification:', error)
    }
  }

  /**
   * Format security alert summary for notifications
   */
  private formatSecurityAlertSummary(alerts: SecurityAlert[]): string {
    const severityCount = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const typeCount = alerts.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return `
Security Alert Summary:
- Total Alerts: ${alerts.length}
- High Severity: ${severityCount.high || 0}
- Medium Severity: ${severityCount.medium || 0}
- Low Severity: ${severityCount.low || 0}

Alert Types:
${Object.entries(typeCount).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Recent Alerts:
${alerts.slice(0, 3).map(alert => 
  `- ${alert.alertType} (${alert.severity}): ${alert.description}`
).join('\n')}
    `.trim()
  }

  /**
   * Generate HTML email template for security alerts
   * In production, this would use a proper email template system
   */
  private generateSecurityAlertEmail(alerts: SecurityAlert[]): string {
    const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high')
    const hasHighSeverity = highSeverityAlerts.length > 0

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Security Alert - InsureScan Family Vault</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .alert-high { background-color: #fee; border-left: 4px solid #e74c3c; padding: 10px; }
        .alert-medium { background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 10px; }
        .alert-low { background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 10px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Security Alert - Family Vault Access</h1>
        ${hasHighSeverity ? '<p style="color: #e74c3c; font-weight: bold;">⚠️ HIGH PRIORITY ALERT</p>' : ''}
    </div>
    
    <div class="content">
        <p>We've detected ${alerts.length} suspicious activities in your family vault sharing system.</p>
        
        ${alerts.map(alert => `
            <div class="alert-${alert.severity}">
                <h3>${alert.alertType.replace(/_/g, ' ').toUpperCase()}</h3>
                <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
                <p><strong>Description:</strong> ${alert.description}</p>
                <p><strong>Time:</strong> ${alert.timestamp.toLocaleString()}</p>
            </div>
        `).join('')}
        
        <p>Please review these alerts in your dashboard and take appropriate action if necessary.</p>
        
        <p><a href="/dashboard/security" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Security Dashboard</a></p>
    </div>
    
    <div class="footer">
        <p>This is an automated security notification from InsureScan Family Vault Sharing.</p>
        <p>If you have concerns about these alerts, please contact our support team.</p>
    </div>
</body>
</html>
    `.trim()
  }
}

/**
 * SMS notification service for high-priority alerts
 * In production, this would integrate with SMS services like Twilio
 */
export class SMSNotificationService implements NotificationService {
  
  async sendSecurityAlert(vaultOwnerId: string, alerts: SecurityAlert[]): Promise<void> {
    try {
      const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high')
      
      if (highSeverityAlerts.length > 0) {
        const message = `InsureScan Security Alert: ${highSeverityAlerts.length} high-priority security events detected in your family vault. Please check your dashboard immediately.`
        
        console.log(`[SMS NOTIFICATION] ${message} (Vault Owner: ${vaultOwnerId})`)
        
        // TODO: Send actual SMS
        // await this.smsService.send({
        //   to: vaultOwnerPhone,
        //   message: message
        // })
      }
      
    } catch (error) {
      console.error('Error sending SMS notification:', error)
    }
  }

  async sendInvitationNotification(vaultOwnerId: string, email: string, activity: string): Promise<void> {
    // SMS notifications typically not used for invitation activities
    // Only for high-priority security events
  }

  async sendVaultOwnerPermissionChangeNotification(vaultOwnerId: string, familyMemberEmail: string, change: string): Promise<void> {
    // SMS notifications typically not used for permission changes
    // Only for high-priority security events
  }

  async sendPermissionChangeNotification(email: string, oldPermissions: string, newPermissions: string, reason?: string): Promise<void> {
    // SMS notifications typically not used for permission changes
  }

  async sendInvitationRevokedNotification(email: string, reason: string): Promise<void> {
    // SMS notifications typically not used for invitation activities
  }

  async sendAccessRevokedNotification(email: string, reason: string): Promise<void> {
    // SMS notifications typically not used for access revocation
  }

  async sendAccessSuspendedNotification(email: string, reason: string): Promise<void> {
    // SMS notifications typically not used for access suspension
  }

  async sendAccessReactivatedNotification(email: string): Promise<void> {
    // SMS notifications typically not used for access reactivation
  }

  async sendInvitationConfirmation(vaultOwnerId: string, email: string, invitationId: string): Promise<void> {
    // SMS notifications typically not used for invitation confirmations
  }

  async sendAcceptanceNotification(vaultOwnerId: string, email: string): Promise<void> {
    // SMS notifications typically not used for acceptance notifications
  }

  async sendAccessRevocationNotification(vaultOwnerId: string, email: string): Promise<void> {
    // SMS notifications typically not used for access revocation
  }
}

/**
 * Composite notification service that uses multiple channels
 */
export class CompositeNotificationService implements NotificationService {
  constructor(
    private emailService: EmailNotificationService,
    private smsService: SMSNotificationService
  ) {}

  async sendInvitationConfirmation(vaultOwnerId: string, email: string, invitationId: string): Promise<void> {
    await this.emailService.sendInvitationConfirmation(vaultOwnerId, email, invitationId)
  }

  async sendAcceptanceNotification(vaultOwnerId: string, email: string): Promise<void> {
    await this.emailService.sendAcceptanceNotification(vaultOwnerId, email)
  }

  async sendAccessRevocationNotification(email: string, vaultOwnerId: string, reason?: string): Promise<void> {
    await this.emailService.sendAccessRevocationNotification(vaultOwnerId, email)
  }

  async sendSecurityAlert(vaultOwnerId: string, alerts: SecurityAlert[]): Promise<void> {
    // Send email for all alerts
    await this.emailService.sendSecurityAlert(vaultOwnerId, alerts)
    
    // Send SMS only for high-severity alerts
    const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high')
    if (highSeverityAlerts.length > 0) {
      await this.smsService.sendSecurityAlert(vaultOwnerId, highSeverityAlerts)
    }
  }

  async sendInvitationNotification(vaultOwnerId: string, email: string, activity: string): Promise<void> {
    await this.emailService.sendInvitationNotification(vaultOwnerId, email, activity)
  }

  async sendVaultOwnerPermissionChangeNotification(vaultOwnerId: string, familyMemberEmail: string, change: string): Promise<void> {
    await this.emailService.sendVaultOwnerPermissionChangeNotification(vaultOwnerId, familyMemberEmail, change)
  }

  async sendPermissionChangeNotification(email: string, oldPermissions: string, newPermissions: string, reason?: string): Promise<void> {
    await this.emailService.sendPermissionChangeNotification(email, oldPermissions, newPermissions, reason)
  }

  async sendInvitationRevokedNotification(email: string, reason: string): Promise<void> {
    await this.emailService.sendInvitationRevokedNotification(email, reason)
  }

  async sendAccessRevokedNotification(email: string, reason: string): Promise<void> {
    await this.emailService.sendAccessRevokedNotification(email, reason)
  }

  async sendAccessSuspendedNotification(email: string, reason: string): Promise<void> {
    await this.emailService.sendAccessSuspendedNotification(email, reason)
  }

  async sendAccessReactivatedNotification(email: string): Promise<void> {
    await this.emailService.sendAccessReactivatedNotification(email)
  }
}

// Default notification service instance
export const notificationService = new CompositeNotificationService(
  new EmailNotificationService(),
  new SMSNotificationService()
)
