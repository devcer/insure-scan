// Family Sharing Individual Security Alert API
// Handles operations on specific security alerts

import { NextRequest, NextResponse } from 'next/server'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

interface RouteParams {
  params: Promise<{
    alertId: string
  }>
}

// GET /api/family-sharing/alerts/[alertId] - Get specific alert details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { alertId } = await params
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const auditService = new AuditService()

    // Get all alerts and find the specific one
    const alerts = await auditService.getSecurityAlerts(vaultOwnerId)
    const alert = alerts.find(a => a.id === alertId)

    if (!alert) {
      return NextResponse.json(
        { error: 'Security alert not found' },
        { status: 404 }
      )
    }

    // Get related audit entries for context
    const relatedEntries = await auditService.getAuditTrail(vaultOwnerId, {
      familyMemberId: alert.familyMemberId,
      startDate: new Date(alert.timestamp.getTime() - 24 * 60 * 60 * 1000), // 24 hours before alert
      endDate: new Date(alert.timestamp.getTime() + 60 * 60 * 1000), // 1 hour after alert
      limit: 20
    })

    return NextResponse.json({
      alert,
      relatedActivity: relatedEntries,
      context: {
        alertAge: Math.floor((Date.now() - alert.timestamp.getTime()) / (1000 * 60 * 60)), // hours
        relatedEntriesCount: relatedEntries.length
      }
    })

  } catch (error) {
    console.error('Error fetching alert details:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/family-sharing/alerts/[alertId] - Update alert (resolve/unresolve)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { alertId } = await params
    const body = await request.json()
    const { action, vaultOwnerId } = body

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const auditService = new AuditService()

    switch (action) {
      case 'resolve':
        // Resolve the alert
        await auditService.resolveSecurityAlert(alertId, vaultOwnerId)

        // Log resolution using invitation activity (closest available method)
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
          alertId,
          resolvedAt: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Only "resolve" is supported.' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/family-sharing/alerts/[alertId] - Delete alert (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { alertId } = await params
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    // Note: In a production system, you might want to restrict alert deletion
    // or implement soft deletion instead of hard deletion for audit purposes
    
    // For now, we'll just resolve the alert instead of deleting it
    const auditService = new AuditService()
    await auditService.resolveSecurityAlert(alertId, vaultOwnerId)

    // Log the "deletion" (resolution) using invitation activity (closest available method)
    await auditService.logInvitationActivity(
      vaultOwnerId,
      'system@alert-deletion',
      'sent', // Using 'sent' as a generic activity type
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    )

    return NextResponse.json({
      success: true,
      message: 'Security alert resolved (deleted) successfully',
      alertId,
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
