// Family Sharing Security Alerts API
// Handles security alerts management and resolution

import { NextRequest, NextResponse } from 'next/server'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

// GET /api/family-sharing/alerts - Get security alerts for vault owner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')
    const resolved = searchParams.get('resolved')
    const severity = searchParams.get('severity')
    const familyMemberId = searchParams.get('familyMemberId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const auditService = new AuditService()

    // Get all alerts first
    let alerts = await auditService.getSecurityAlerts(vaultOwnerId)

    // Apply filters
    if (resolved !== null && resolved !== undefined) {
      const isResolved = resolved === 'true'
      alerts = alerts.filter(alert => alert.resolved === isResolved)
    }

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }

    if (familyMemberId) {
      alerts = alerts.filter(alert => alert.familyMemberId === familyMemberId)
    }

    // Apply limit
    const limitedAlerts = alerts.slice(0, Math.min(limit, 200))

    // Get summary statistics
    const summary = {
      total: alerts.length,
      unresolved: alerts.filter(alert => !alert.resolved).length,
      bySeverity: {
        high: alerts.filter(alert => alert.severity === 'high').length,
        medium: alerts.filter(alert => alert.severity === 'medium').length,
        low: alerts.filter(alert => alert.severity === 'low').length
      },
      byType: alerts.reduce((acc, alert) => {
        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      alerts: limitedAlerts,
      summary,
      filters: {
        resolved: resolved !== null ? resolved === 'true' : undefined,
        severity,
        familyMemberId,
        limit
      }
    })

  } catch (error) {
    console.error('Error fetching security alerts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/family-sharing/alerts - Resolve alerts or trigger detection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, vaultOwnerId, alertId, alertIds } = body

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const auditService = new AuditService()

    switch (action) {
      case 'resolve':
        // Resolve single alert
        if (!alertId) {
          return NextResponse.json(
            { error: 'alertId is required for resolve action' },
            { status: 400 }
          )
        }

        await auditService.resolveSecurityAlert(alertId, vaultOwnerId)

        // Log alert resolution using invitation activity (closest available method)
        await auditService.logInvitationActivity(
          vaultOwnerId,
          'system@alert-resolution',
          'sent', // Using 'sent' as a generic activity type
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          success: true,
          message: 'Security alert resolved successfully',
          alertId
        })

      case 'bulk-resolve':
        // Resolve multiple alerts
        if (!Array.isArray(alertIds) || alertIds.length === 0) {
          return NextResponse.json(
            { error: 'alertIds array is required for bulk-resolve action' },
            { status: 400 }
          )
        }

        // Resolve each alert
        const resolvePromises = alertIds.map(id => 
          auditService.resolveSecurityAlert(id, vaultOwnerId)
        )
        await Promise.all(resolvePromises)

        // Log bulk resolution using invitation activity (closest available method)
        await auditService.logInvitationActivity(
          vaultOwnerId,
          'system@bulk-resolution',
          'sent', // Using 'sent' as a generic activity type
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          success: true,
          message: `${alertIds.length} security alerts resolved successfully`,
          resolvedCount: alertIds.length
        })

      case 'detect':
        // Manually trigger suspicious activity detection
        const detectedAlerts = await auditService.detectSuspiciousActivity(vaultOwnerId)

        return NextResponse.json({
          success: true,
          message: 'Suspicious activity detection completed',
          newAlertsDetected: detectedAlerts.length,
          alerts: detectedAlerts
        })

      case 'get-summary':
        // Get suspicious activity summary
        const days = parseInt(body.days || '7')
        const summary = await auditService.getSuspiciousActivitySummary(vaultOwnerId, days)

        return NextResponse.json({
          success: true,
          vaultOwnerId,
          period: `${days} days`,
          summary
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in alerts POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
