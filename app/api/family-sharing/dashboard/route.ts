// Family Sharing Dashboard API
// Handles dashboard data aggregation and real-time updates

import { NextRequest, NextResponse } from 'next/server'
import { DashboardServiceImpl } from '@/lib/family-sharing/services/dashboard-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

// GET /api/family-sharing/dashboard - Get dashboard data for vault owner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vaultOwnerId = searchParams.get('vaultOwnerId')
    const component = searchParams.get('component')
    const realtime = searchParams.get('realtime') === 'true'

    if (!vaultOwnerId) {
      return NextResponse.json(
        { error: 'vaultOwnerId is required' },
        { status: 400 }
      )
    }

    const dashboardService = new DashboardServiceImpl()

    switch (component) {
      case 'summary':
        // Get only summary statistics
        const summary = await dashboardService.getSummaryStatistics(vaultOwnerId)
        return NextResponse.json({ summary })

      case 'family-members':
        // Get only family member summaries
        const familyMembers = await dashboardService.getFamilyMemberSummaries(vaultOwnerId)
        return NextResponse.json({ familyMembers, count: familyMembers.length })

      case 'invitations':
        // Get only invitation summaries
        const invitations = await dashboardService.getInvitationSummaries(vaultOwnerId)
        return NextResponse.json({ invitations, count: invitations.length })

      case 'activities':
        // Get only recent activities
        const limit = parseInt(searchParams.get('limit') || '20')
        const activities = await dashboardService.getRecentActivities(vaultOwnerId, limit)
        return NextResponse.json({ activities, count: activities.length })

      case 'security':
        // Get security-related dashboard data
        const auditService = new AuditService()
        const [securityAlerts, suspiciousActivity] = await Promise.all([
          auditService.getSecurityAlerts(vaultOwnerId, false), // Only unresolved
          auditService.getSuspiciousActivitySummary(vaultOwnerId, 7)
        ])
        
        return NextResponse.json({
          securityAlerts,
          suspiciousActivity,
          alertCount: securityAlerts.length
        })

      default:
        // Default: get complete dashboard data
        const dashboardData = realtime 
          ? await dashboardService.getDashboardDataWithUpdates(vaultOwnerId)
          : await dashboardService.getDashboardData(vaultOwnerId)

        return NextResponse.json({
          vaultOwnerId,
          dashboard: dashboardData,
          generatedAt: new Date().toISOString(),
          realtime
        })
    }

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/family-sharing/dashboard - Refresh dashboard data or perform actions
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

    const dashboardService = new DashboardServiceImpl()
    const auditService = new AuditService()

    switch (action) {
      case 'refresh':
        // Force refresh of dashboard data
        const refreshedData = await dashboardService.getDashboardData(vaultOwnerId)
        
        // Log dashboard refresh using invitation activity (closest available method)
        await auditService.logInvitationActivity(
          vaultOwnerId,
          'system@dashboard',
          'sent', // Using 'sent' as a generic activity type
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          success: true,
          message: 'Dashboard data refreshed successfully',
          dashboard: refreshedData,
          refreshedAt: new Date().toISOString()
        })

      case 'run-security-check':
        // Manually trigger security check and refresh security data
        const detectedAlerts = await auditService.detectSuspiciousActivity(vaultOwnerId)
        const securityAlerts = await auditService.getSecurityAlerts(vaultOwnerId, false)
        const suspiciousActivity = await auditService.getSuspiciousActivitySummary(vaultOwnerId, 7)

        return NextResponse.json({
          success: true,
          message: 'Security check completed',
          newAlertsDetected: detectedAlerts.length,
          securityData: {
            alerts: securityAlerts,
            suspiciousActivity,
            lastCheck: new Date().toISOString()
          }
        })

      case 'get-realtime-updates':
        // Get real-time dashboard updates
        const realtimeData = await dashboardService.getDashboardDataWithUpdates(vaultOwnerId)
        
        return NextResponse.json({
          success: true,
          dashboard: realtimeData,
          timestamp: new Date().toISOString(),
          realtime: true
        })

      case 'export-data':
        // Export dashboard data for reporting
        const exportData = await dashboardService.getDashboardData(vaultOwnerId)
        const auditStatistics = await auditService.getAuditStatistics(vaultOwnerId, 30)
        
        const exportPackage = {
          vaultOwnerId,
          exportedAt: new Date().toISOString(),
          dashboard: exportData,
          auditStatistics,
          metadata: {
            totalFamilyMembers: exportData.familyMembers.length,
            totalInvitations: exportData.invitations.length,
            totalActivities: auditStatistics.totalActivities,
            exportFormat: 'json'
          }
        }

        // Log data export using invitation activity (closest available method)
        await auditService.logInvitationActivity(
          vaultOwnerId,
          'system@export',
          'sent', // Using 'sent' as a generic activity type
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          success: true,
          message: 'Dashboard data exported successfully',
          export: exportPackage
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in dashboard POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
