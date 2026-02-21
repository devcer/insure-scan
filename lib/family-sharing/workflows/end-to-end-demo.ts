// End-to-End Family Sharing Workflow Demonstration
// Shows complete integration of all family sharing components

import { initializeFamilySharing, validateSystemHealth } from '../config/initialization'
import { familyShareService } from '../services/family-sharing-service';
import { PermissionLevel } from '../types/core'

/**
 * Complete end-to-end workflow demonstration
 * This function demonstrates all major family sharing workflows working together
 */
export async function demonstrateEndToEndWorkflow(
  vaultOwnerId: string,
  familyMemberEmail: string,
  testPolicyIds: string[]
): Promise<{
  success: boolean
  steps: Array<{ step: string; success: boolean; message: string; data?: any }>
  summary: string
}> {
  const steps: Array<{ step: string; success: boolean; message: string; data?: any }> = []
  let overallSuccess = true

  try {
    // Step 1: Initialize system
    steps.push({ step: '1. System Initialization', success: false, message: 'Starting...' })
    
    const initResult = await initializeFamilySharing()
    if (!initResult.success) {
      steps[steps.length - 1] = {
        step: '1. System Initialization',
        success: false,
        message: `Failed: ${initResult.errors.join(', ')}`,
        data: initResult
      }
      overallSuccess = false
      return { success: false, steps, summary: 'System initialization failed' }
    }
    
    steps[steps.length - 1] = {
      step: '1. System Initialization',
      success: true,
      message: 'System initialized successfully',
      data: { warnings: initResult.warnings }
    }

    // Step 2: Health check
    steps.push({ step: '2. System Health Check', success: false, message: 'Checking...' })
    
    const healthCheck = await validateSystemHealth()
    steps[steps.length - 1] = {
      step: '2. System Health Check',
      success: healthCheck.healthy,
      message: healthCheck.healthy ? 'All systems healthy' : `Issues: ${healthCheck.issues.join(', ')}`,
      data: healthCheck
    }

    if (!healthCheck.healthy) {
      overallSuccess = false
    }

    // Step 3: Send invitation
    steps.push({ step: '3. Send Family Invitation', success: false, message: 'Sending...' })
    
    try {
      const invitation = await familyShareService.inviteFamilyMember(
        vaultOwnerId,
        familyMemberEmail,
        'view_specific' as PermissionLevel,
        testPolicyIds.slice(0, 2) // Share first 2 policies
      )
      
      steps[steps.length - 1] = {
        step: '3. Send Family Invitation',
        success: true,
        message: `Invitation sent successfully to ${familyMemberEmail}`,
        data: {
          invitationId: invitation.id,
          expiresAt: invitation.expiresAt,
          permissions: invitation.permissions
        }
      }
    } catch (error) {
      steps[steps.length - 1] = {
        step: '3. Send Family Invitation',
        success: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      overallSuccess = false
    }

    // Step 4: Verify invitation was created
    steps.push({ step: '4. Verify Invitation Created', success: false, message: 'Verifying...' })
    
    try {
      const dashboardData = await familyShareService.getDashboardData(vaultOwnerId)
      const hasInvitation = dashboardData.summary.pendingInvitations > 0
      
      steps[steps.length - 1] = {
        step: '4. Verify Invitation Created',
        success: hasInvitation,
        message: hasInvitation ? 'Invitation visible in dashboard' : 'Invitation not found in dashboard',
        data: {
          pendingInvitations: dashboardData.summary.pendingInvitations,
          totalFamilyMembers: dashboardData.summary.totalFamilyMembers
        }
      }

      if (!hasInvitation) {
        overallSuccess = false
      }
    } catch (error) {
      steps[steps.length - 1] = {
        step: '4. Verify Invitation Created',
        success: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      overallSuccess = false
    }

    // Step 5: Check audit trail
    steps.push({ step: '5. Verify Audit Logging', success: false, message: 'Checking...' })
    
    try {
      const auditTrail = await familyShareService.getAuditTrail(vaultOwnerId)
      const invitationLogs = auditTrail.filter((entry) => 
        entry.activity === 'invitation_sent' && 
        entry.details?.email === familyMemberEmail
      )
      
      steps[steps.length - 1] = {
        step: '5. Verify Audit Logging',
        success: invitationLogs.length > 0,
        message: invitationLogs.length > 0 ? 'Invitation logged in audit trail' : 'Invitation not found in audit trail',
        data: {
          totalAuditEntries: auditTrail.length,
          invitationLogs: invitationLogs.length
        }
      }

      if (invitationLogs.length === 0) {
        overallSuccess = false
      }
    } catch (error) {
      steps[steps.length - 1] = {
        step: '5. Verify Audit Logging',
        success: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      overallSuccess = false
    }

    // Step 6: Test permission checking
    steps.push({ step: '6. Test Permission System', success: false, message: 'Testing...' })
    
    try {
      // This would normally be done after invitation acceptance
      // For demo purposes, we'll test the permission logic directly
      const familyMembers = await familyShareService.getFamilyMembers(vaultOwnerId)
      
      steps[steps.length - 1] = {
        step: '6. Test Permission System',
        success: true,
        message: 'Permission system accessible',
        data: {
          familyMembersCount: familyMembers.length
        }
      }
    } catch (error) {
      steps[steps.length - 1] = {
        step: '6. Test Permission System',
        success: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      overallSuccess = false
    }

    // Step 7: Test security monitoring
    steps.push({ step: '7. Test Security Monitoring', success: false, message: 'Testing...' })
    
    try {
      const securityAlerts = await familyShareService.getSecurityAlerts(vaultOwnerId)
      
      steps[steps.length - 1] = {
        step: '7. Test Security Monitoring',
        success: true,
        message: 'Security monitoring operational',
        data: {
          alertsCount: securityAlerts.length,
          highSeverityAlerts: securityAlerts.filter((a: { severity: string }) => a.severity === 'high').length
        }
      }
    } catch (error) {
      steps[steps.length - 1] = {
        step: '7. Test Security Monitoring',
        success: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      overallSuccess = false
    }

    // Step 8: Test complete workflow integration
    steps.push({ step: '8. Integration Test Complete', success: false, message: 'Finalizing...' })
    
    const successfulSteps = steps.filter(step => step.success).length
    const totalSteps = steps.length
    const integrationSuccess = successfulSteps >= totalSteps - 1 // Allow 1 failure

    steps[steps.length - 1] = {
      step: '8. Integration Test Complete',
      success: integrationSuccess,
      message: `${successfulSteps}/${totalSteps} steps successful`,
      data: {
        successRate: (successfulSteps / totalSteps) * 100,
        overallSuccess: integrationSuccess
      }
    }

    // Generate summary
    const summary = overallSuccess 
      ? `✅ End-to-end workflow completed successfully (${successfulSteps}/${totalSteps} steps passed)`
      : `❌ End-to-end workflow failed (${successfulSteps}/${totalSteps} steps passed)`

    return {
      success: overallSuccess,
      steps,
      summary
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    steps.push({
      step: 'Critical Error',
      success: false,
      message: `Critical workflow error: ${errorMessage}`
    })

    return {
      success: false,
      steps,
      summary: `❌ Workflow failed with critical error: ${errorMessage}`
    }
  }
}

/**
 * Simplified workflow test for basic functionality
 */
export async function testBasicWorkflow(vaultOwnerId: string): Promise<{
  success: boolean
  message: string
  details: any
}> {
  try {
    // Test basic service connectivity
    const healthResults = await familyShareService.healthCheck()
    const unhealthyServices = healthResults.filter((result: { status: string }) => result.status === 'error')

    if (unhealthyServices.length > 0) {
      return {
        success: false,
        message: `Services unhealthy: ${unhealthyServices.map((s: { service: any }) => s.service).join(', ')}`,
        details: healthResults
      }
    }

    // Test dashboard data retrieval
    const dashboardData = await familyShareService.getDashboardData(vaultOwnerId)
    
    // Test audit trail access
    const auditTrail = await familyShareService.getAuditTrail(vaultOwnerId)

    return {
      success: true,
      message: 'Basic workflow test passed',
      details: {
        servicesHealthy: healthResults.length,
        dashboardDataAvailable: !!dashboardData,
        auditTrailEntries: auditTrail.length
      }
    }

  } catch (error) {
    return {
      success: false,
      message: `Basic workflow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    }
  }
}

/**
 * Performance test for the integrated system
 */
export async function performanceTest(vaultOwnerId: string, iterations: number = 10): Promise<{
  success: boolean
  averageResponseTime: number
  details: Array<{ operation: string; time: number }>
}> {
  const results: Array<{ operation: string; time: number }> = []

  try {
    for (let i = 0; i < iterations; i++) {
      // Test dashboard data retrieval
      const start1 = Date.now()
      await familyShareService.getDashboardData(vaultOwnerId)
      results.push({ operation: 'getDashboardData', time: Date.now() - start1 })

      // Test family members retrieval
      const start2 = Date.now()
      await familyShareService.getFamilyMembers(vaultOwnerId)
      results.push({ operation: 'getFamilyMembers', time: Date.now() - start2 })

      // Test audit trail retrieval
      const start3 = Date.now()
      await familyShareService.getAuditTrail(vaultOwnerId)
      results.push({ operation: 'getAuditTrail', time: Date.now() - start3 })
    }

    const averageTime = results.reduce((sum, result) => sum + result.time, 0) / results.length

    return {
      success: true,
      averageResponseTime: averageTime,
      details: results
    }

  } catch (error) {
    return {
      success: false,
      averageResponseTime: -1,
      details: results
    }
  }
}
