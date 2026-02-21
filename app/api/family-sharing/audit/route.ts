// Family Sharing Audit API
// Handles audit trail and activity logging for family vault sharing

import { NextRequest, NextResponse } from 'next/server'
import { AuditService } from '@/lib/family-sharing/services/audit-service'
import { AuditFilters, AuditActivity } from '@/lib/family-sharing/types/core'

// GET /api/family-sharing/audit - Get audit trail with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')
    const action = searchParams.get('action')

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const auditService = new AuditService()

    switch (action) {
      case 'statistics':
        // Get audit statistics for dashboard
        const days = parseInt(searchParams.get('days') || '30')
        const statistics = await auditService.getAuditStatistics(vaultOwnerId, days)
        
        return NextResponse.json({
          vaultOwnerId,
          period: `${days} days`,
          statistics
        })

      case 'suspicious-activity':
        // Get suspicious activity summary
        const summaryDays = parseInt(searchParams.get('days') || '7')
        const suspiciousSummary = await auditService.getSuspiciousActivitySummary(vaultOwnerId, summaryDays)
        
        return NextResponse.json({
          vaultOwnerId,
          period: `${summaryDays} days`,
          suspiciousActivity: suspiciousSummary
        })

      default:
        // Default: get audit trail with filters
        const filters: AuditFilters = {}

        // Parse filters from query parameters
        const familyMemberId = searchParams.get('familyMemberId')
        if (familyMemberId) {
          filters.familyMemberId = familyMemberId
        }

        const activity = searchParams.get('activity')
        if (activity) {
          filters.activity = activity as AuditActivity
        }

        const startDate = searchParams.get('startDate')
        if (startDate) {
          filters.startDate = new Date(startDate)
        }

        const endDate = searchParams.get('endDate')
        if (endDate) {
          filters.endDate = new Date(endDate)
        }

        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')
        
        filters.limit = Math.min(limit, 200) // Cap at 200 for performance
        filters.offset = offset

        const auditEntries = await auditService.getAuditTrail(vaultOwnerId, filters)

        return NextResponse.json({
          auditEntries,
          count: auditEntries.length,
          filters: {
            ...filters,
            startDate: filters.startDate?.toISOString(),
            endDate: filters.endDate?.toISOString()
          },
          pagination: {
            limit: filters.limit,
            offset: filters.offset,
            hasMore: auditEntries.length === filters.limit
          }
        })
    }

  } catch (error) {
    console.error('Error fetching audit data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/family-sharing/audit - Manually log audit entry or trigger detection
export async function POST(request: NextRequest) {
  try {
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
      case 'detect-suspicious-activity':
        // Manually trigger suspicious activity detection
        const detectedAlerts = await auditService.detectSuspiciousActivity(vaultOwnerId)
        
        return NextResponse.json({
          success: true,
          message: 'Suspicious activity detection completed',
          alertsDetected: detectedAlerts.length,
          alerts: detectedAlerts
        })

      case 'log-manual-entry':
        // Log a manual audit entry (for administrative purposes)
        const { familyMemberId, activity, details } = body
        
        if (!activity) {
          return NextResponse.json(
            { error: 'activity is required for manual entry' },
            { status: 400 }
          )
        }

        // Create manual audit entry using invitation activity (closest available method)
        await auditService.logInvitationActivity(
          vaultOwnerId,
          'system@manual-entry',
          'sent', // Using 'sent' as a generic activity type
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          success: true,
          message: 'Manual audit entry logged successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in audit POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
