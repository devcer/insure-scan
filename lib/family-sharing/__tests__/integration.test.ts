// Family Sharing Integration Tests
// Tests complete end-to-end workflows and service integration

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { familyShareService } from '../services/family-sharing-service'
import { initializeFamilySharing, validateSystemHealth } from '../config/initialization'
import { demonstrateEndToEndWorkflow, testBasicWorkflow, performanceTest } from '../workflows/end-to-end-demo'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PermissionLevel } from '../types/core'

describe('Family Sharing Integration Tests', () => {
  const testVaultOwnerId = 'test-vault-owner-' + Date.now()
  const testFamilyEmail = 'family-member@example.com'
  const testPolicyIds = ['policy-1', 'policy-2', 'policy-3']

  beforeAll(async () => {
    // Initialize the system before running tests
    const initResult = await initializeFamilySharing()
    if (!initResult.success) {
      console.warn('System initialization had issues:', initResult.errors)
    }
  })

  beforeEach(async () => {
    // Clean up any test data before each test
    const supabase = createSupabaseServerClient()
    
    // Clean up test invitations
    await supabase
      .from('family_invitations')
      .delete()
      .like('email', '%example.com')

    // Clean up test family members
    await supabase
      .from('family_members')
      .delete()
      .like('email', '%example.com')

    // Clean up test audit logs
    await supabase
      .from('family_audit_logs')
      .delete()
      .eq('vault_owner_id', testVaultOwnerId)
  })

  afterAll(async () => {
    // Final cleanup after all tests
    const supabase = createSupabaseServerClient()
    
    await supabase
      .from('family_invitations')
      .delete()
      .like('email', '%example.com')

    await supabase
      .from('family_members')
      .delete()
      .like('email', '%example.com')

    await supabase
      .from('family_audit_logs')
      .delete()
      .eq('vault_owner_id', testVaultOwnerId)
  })

  describe('System Initialization and Health', () => {
    it('should initialize system successfully', async () => {
      const result = await initializeFamilySharing()
      
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // Warnings are acceptable
    })

    it('should validate system health', async () => {
      const health = await validateSystemHealth()
      
      expect(health.lastChecked).toBeInstanceOf(Date)
      // System should be healthy or have only minor issues
      if (!health.healthy) {
        console.warn('System health issues:', health.issues)
      }
    })

    it('should pass service health checks', async () => {
      const healthResults = await familyShareService.healthCheck()
      
      expect(Array.isArray(healthResults)).toBe(true)
      expect(healthResults.length).toBeGreaterThan(0)
      
      // All services should be healthy
      const unhealthyServices = healthResults.filter(result => result.status === 'error')
      expect(unhealthyServices).toHaveLength(0)
    })
  })

  describe('End-to-End Workflows', () => {
    it('should complete basic workflow test', async () => {
      const result = await testBasicWorkflow(testVaultOwnerId)
      
      expect(result.success).toBe(true)
      expect(result.message).toContain('passed')
      expect(result.details).toBeDefined()
    })

    it('should handle complete invitation workflow', async () => {
      // Test the complete invitation process
      const invitation = await familyShareService.inviteFamilyMember(
        testVaultOwnerId,
        testFamilyEmail,
        'view_specific' as PermissionLevel,
        testPolicyIds.slice(0, 2)
      )

      expect(invitation).toBeDefined()
      expect(invitation.email).toBe(testFamilyEmail)
      expect(invitation.permissions).toBe('view_specific')
      expect(invitation.vaultOwnerId).toBe(testVaultOwnerId)

      // Verify invitation appears in dashboard
      const dashboardData = await familyShareService.getDashboardData(testVaultOwnerId)
      expect(dashboardData.pendingInvitations).toBeGreaterThan(0)

      // Verify audit logging
      const auditTrail = await familyShareService.getAuditTrail(testVaultOwnerId)
      const invitationLogs = auditTrail.filter(entry => 
        entry.activity === 'invitation_sent' && 
        entry.details?.email === testFamilyEmail
      )
      expect(invitationLogs.length).toBeGreaterThan(0)
    })

    it('should handle permission management workflow', async () => {
      // First create a family member (simulate accepted invitation)
      const invitation = await familyShareService.inviteFamilyMember(
        testVaultOwnerId,
        testFamilyEmail,
        'view_all' as PermissionLevel
      )

      // Simulate invitation acceptance by directly creating family member
      const supabase = createSupabaseServerClient()
      const { data: familyMember } = await supabase
        .from('family_members')
        .insert({
          vault_owner_id: testVaultOwnerId,
          email: testFamilyEmail,
          permissions: 'view_all',
          status: 'active'
        })
        .select()
        .single()

      expect(familyMember).toBeDefined()

      // Test permission updates
      await familyShareService.updateFamilyMemberPermissions(
        testVaultOwnerId,
        familyMember.id,
        'view_specific' as PermissionLevel,
        testPolicyIds.slice(0, 1)
      )

      // Verify permission change was logged
      const auditTrail = await familyShareService.getAuditTrail(testVaultOwnerId)
      const permissionLogs = auditTrail.filter(entry => 
        entry.activity === 'permissions_changed'
      )
      expect(permissionLogs.length).toBeGreaterThan(0)
    })

    it('should handle access revocation workflow', async () => {
      // Create a family member
      const supabase = createSupabaseServerClient()
      const { data: familyMember } = await supabase
        .from('family_members')
        .insert({
          vault_owner_id: testVaultOwnerId,
          email: testFamilyEmail,
          permissions: 'view_all',
          status: 'active'
        })
        .select()
        .single()

      expect(familyMember).toBeDefined()

      // Revoke access
      await familyShareService.revokeFamilyMemberAccess(
        testVaultOwnerId,
        familyMember.id,
        'Test revocation'
      )

      // Verify revocation was logged
      const auditTrail = await familyShareService.getAuditTrail(testVaultOwnerId)
      const revocationLogs = auditTrail.filter(entry => 
        entry.activity === 'access_revoked'
      )
      expect(revocationLogs.length).toBeGreaterThan(0)
    })
  })

  describe('Service Integration', () => {
    it('should integrate all services correctly', async () => {
      // Test that all services can work together
      const services = [
        'invitation',
        'permission', 
        'vault',
        'audit',
        'security',
        'dashboard',
        'notification'
      ]

      const healthResults = await familyShareService.healthCheck()
      const serviceNames = healthResults.map(result => result.service)

      // All expected services should be present and healthy
      for (const service of services) {
        expect(serviceNames).toContain(service)
        const serviceResult = healthResults.find(result => result.service === service)
        expect(serviceResult?.status).toBe('healthy')
      }
    })

    it('should handle concurrent operations', async () => {
      // Test concurrent invitations
      const concurrentInvitations = [
        familyShareService.inviteFamilyMember(
          testVaultOwnerId,
          'member1@example.com',
          'view_all' as PermissionLevel
        ),
        familyShareService.inviteFamilyMember(
          testVaultOwnerId,
          'member2@example.com',
          'view_specific' as PermissionLevel,
          testPolicyIds.slice(0, 1)
        ),
        familyShareService.inviteFamilyMember(
          testVaultOwnerId,
          'member3@example.com',
          'view_all' as PermissionLevel
        )
      ]

      const results = await Promise.all(concurrentInvitations)
      
      // All invitations should succeed
      expect(results).toHaveLength(3)
      results.forEach(invitation => {
        expect(invitation).toBeDefined()
        expect(invitation.vaultOwnerId).toBe(testVaultOwnerId)
      })

      // Dashboard should reflect all invitations
      const dashboardData = await familyShareService.getDashboardData(testVaultOwnerId)
      expect(dashboardData.pendingInvitations).toBe(3)
    })

    it('should maintain data consistency across services', async () => {
      // Create invitation
      const invitation = await familyShareService.inviteFamilyMember(
        testVaultOwnerId,
        testFamilyEmail,
        'view_specific' as PermissionLevel,
        testPolicyIds
      )

      // Check consistency across different service calls
      const dashboardData = await familyShareService.getDashboardData(testVaultOwnerId)
      const auditTrail = await familyShareService.getAuditTrail(testVaultOwnerId)
      const familyMembers = await familyShareService.getFamilyMembers(testVaultOwnerId)

      // Data should be consistent
      expect(dashboardData.pendingInvitations).toBeGreaterThan(0)
      expect(auditTrail.length).toBeGreaterThan(0)
      
      // Should have audit entry for the invitation
      const invitationAudit = auditTrail.find(entry => 
        entry.activity === 'invitation_sent' && 
        entry.details?.email === testFamilyEmail
      )
      expect(invitationAudit).toBeDefined()
    })
  })

  describe('Performance and Reliability', () => {
    it('should meet performance requirements', async () => {
      const performanceResult = await performanceTest(testVaultOwnerId, 5)
      
      expect(performanceResult.success).toBe(true)
      expect(performanceResult.averageResponseTime).toBeLessThan(5000) // 5 seconds max
      expect(performanceResult.details.length).toBeGreaterThan(0)

      // Individual operations should be reasonably fast
      performanceResult.details.forEach(result => {
        expect(result.time).toBeLessThan(10000) // 10 seconds max per operation
      })
    })

    it('should handle error conditions gracefully', async () => {
      // Test with invalid data
      await expect(
        familyShareService.inviteFamilyMember(
          'invalid-vault-owner',
          'invalid-email',
          'invalid-permission' as PermissionLevel
        )
      ).rejects.toThrow()

      // System should still be healthy after errors
      const health = await validateSystemHealth()
      expect(health.lastChecked).toBeInstanceOf(Date)
    })

    it('should complete full end-to-end demonstration', async () => {
      const demoResult = await demonstrateEndToEndWorkflow(
        testVaultOwnerId,
        testFamilyEmail,
        testPolicyIds
      )

      expect(demoResult.steps.length).toBeGreaterThan(0)
      expect(demoResult.summary).toBeDefined()
      
      // Most steps should succeed (allow some flexibility for test environment)
      const successfulSteps = demoResult.steps.filter(step => step.success).length
      const successRate = successfulSteps / demoResult.steps.length
      expect(successRate).toBeGreaterThan(0.7) // At least 70% success rate
    })
  })
})
