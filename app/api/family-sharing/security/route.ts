// Family Sharing Security API
// Handles security monitoring, alerts, and suspicious activity detection

import { NextRequest, NextResponse } from 'next/server'
import { AuditService } from '@/lib/family-sharing/services/audit-service'
import { securityMonitor } from '@/lib/family-sharing/services/security-monitor'

// GET /api/family-sharing/security - Get security alerts and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')
    const action = searchParams.get('action')
    const days = parseInt(searchParams.get('days') || '7')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const auditService = new AuditService()

    switch (action) {
      case 'alerts':
        // Get security alerts
        const resolved = searchParams.get('resolved')
        const alerts = await auditService.getSecurityAlerts(
          vaultOwnerId,
          resolved ? resolved === 'true' : undefined
        )
        return NextResponse.json({ alerts })

      case 'summary':
        // Get suspicious activity summary
        const summary = await auditService.getSuspiciousActivitySummary(vaultOwnerId, days)
        return NextResponse.json({ summary })

      case 'detect':
        // Run suspicious activity detection
        const detectedAlerts = await auditService.detectSuspiciousActivity(vaultOwnerId)
        return NextResponse.json({ 
          alertsDetected: detectedAlerts.length,
          alerts: detectedAlerts 
        })

      case 'monitor-stats':
        // Get monitoring statistics
        const stats = await securityMonitor.getMonitoringStats(days)
        return NextResponse.json({ stats })

      default:
        // Default: return both alerts and summary
        const [allAlerts, activitySummary] = await Promise.all([
          auditService.getSecurityAlerts(vaultOwnerId),
          auditService.getSuspiciousActivitySummary(vaultOwnerId, days)
        ])

        return NextResponse.json({
          alerts: allAlerts,
          summary: activitySummary
        })
    }

  } catch (error) {
    console.error('Error in security API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/family-sharing/security - Resolve alerts or trigger security checks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, vaultOwnerId, alertId } = body

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const auditService = new AuditService()

    switch (action) {
      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'alertId is required for resolve-alert action' },
            { status: 400 }
          )
        }

        await auditService.resolveSecurityAlert(alertId, vaultOwnerId)
        return NextResponse.json({ success: true, message: 'Alert resolved' })

      case 'run-security-check':
        // Manually trigger security check for specific vault owner
        const result = await securityMonitor.checkVaultOwner(vaultOwnerId)
        return NextResponse.json({
          success: true,
          alertsGenerated: result.alertsGenerated,
          alerts: result.alerts
        })

      case 'bulk-resolve':
        // Resolve multiple alerts
        const { alertIds } = body
        if (!Array.isArray(alertIds)) {
          return NextResponse.json(
            { error: 'alertIds must be an array' },
            { status: 400 }
          )
        }

        const resolvePromises = alertIds.map(id => 
          auditService.resolveSecurityAlert(id, vaultOwnerId)
        )
        await Promise.all(resolvePromises)

        return NextResponse.json({
          success: true,
          message: `${alertIds.length} alerts resolved`
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in security API POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/family-sharing/security - Update security monitoring configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json(
        { error: 'config is required' },
        { status: 400 }
      )
    }

    securityMonitor.updateConfig(config)
    
    return NextResponse.json({
      success: true,
      message: 'Security monitor configuration updated',
      currentConfig: securityMonitor.getStatus().config
    })

  } catch (error) {
    console.error('Error updating security config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
