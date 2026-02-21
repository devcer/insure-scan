// Audit Service Tests
// Unit tests for the audit service functionality

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AuditService } from '../audit-service'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn()
}))

describe('AuditService', () => {
  let auditService: AuditService
  let mockSupabase: any

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }

    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase)
    auditService = new AuditService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('logPolicyAccess', () => {
    it('should log policy access successfully', async () => {
      // Mock family member lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          vault_owner_id: 'owner-123',
          email: 'family@example.com'
        },
        error: null
      })

      // Mock audit entry insert
      mockSupabase.insert.mockResolvedValueOnce({ error: null })
      mockSupabase.update.mockResolvedValueOnce({ error: null })

      await auditService.logPolicyAccess(
        'family-123',
        'policy-456',
        'view_details',
        '192.168.1.1',
        'Mozilla/5.0'
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('family_members')
      expect(mockSupabase.from).toHaveBeenCalledWith('family_audit_entries')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        vault_owner_id: 'owner-123',
        family_member_id: 'family-123',
        activity: 'policy_accessed',
        details: {
          policyId: 'policy-456',
          accessType: 'view_details',
          familyMemberEmail: 'family@example.com'
        },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0'
      })
    })

    it('should handle missing family member gracefully', async () => {
      // Mock family member not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      // Should not throw error - audit logging should be non-blocking
      await expect(auditService.logPolicyAccess('invalid-id', 'policy-456', 'view_details'))
        .resolves.toBeUndefined()
    })
  })

  describe('logPermissionChange', () => {
    it('should log permission changes successfully', async () => {
      // Mock family member lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: { email: 'family@example.com' },
        error: null
      })

      // Mock audit entry insert
      mockSupabase.insert.mockResolvedValueOnce({ error: null })

      await auditService.logPermissionChange(
        'owner-123',
        'family-456',
        'view_all',
        'view_specific'
      )

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        vault_owner_id: 'owner-123',
        family_member_id: 'family-456',
        activity: 'permissions_changed',
        details: {
          familyMemberEmail: 'family@example.com',
          oldPermissions: 'view_all',
          newPermissions: 'view_specific',
          changedBy: 'vault_owner'
        },
        ip_address: '',
        user_agent: ''
      })
    })
  })

  describe('logInvitationActivity', () => {
    it('should log invitation sent activity', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null })

      await auditService.logInvitationActivity(
        'owner-123',
        'new@example.com',
        'sent'
      )

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        vault_owner_id: 'owner-123',
        activity: 'invitation_sent',
        details: {
          email: 'new@example.com',
          invitationActivity: 'sent',
          timestamp: expect.any(String)
        },
        ip_address: '',
        user_agent: ''
      })
    })

    it('should map invitation activities to audit activities correctly', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null })

      const testCases = [
        { invitation: 'sent' as const, audit: 'invitation_sent' },
        { invitation: 'resent' as const, audit: 'invitation_sent' },
        { invitation: 'accepted' as const, audit: 'invitation_accepted' },
        { invitation: 'expired' as const, audit: 'invitation_revoked' },
        { invitation: 'revoked' as const, audit: 'invitation_revoked' }
      ]

      for (const testCase of testCases) {
        await auditService.logInvitationActivity(
          'owner-123',
          'test@example.com',
          testCase.invitation
        )

        expect(mockSupabase.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            activity: testCase.audit
          })
        )
      }
    })
  })

  describe('getAuditTrail', () => {
    it('should fetch audit trail with basic filters', async () => {
      const mockAuditEntries = [
        {
          id: 'audit-1',
          vault_owner_id: 'owner-123',
          family_member_id: 'family-456',
          activity: 'policy_accessed',
          details: { policyId: 'policy-1' },
          timestamp: '2024-01-01T10:00:00Z',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0'
        }
      ]

      mockSupabase.mockReturnValue({
        data: mockAuditEntries,
        error: null
      })

      const result = await auditService.getAuditTrail('owner-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('family_audit_entries')
      expect(mockSupabase.eq).toHaveBeenCalledWith('vault_owner_id', 'owner-123')
      expect(mockSupabase.order).toHaveBeenCalledWith('timestamp', { ascending: false })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('audit-1')
    })

    it('should apply filters correctly', async () => {
      mockSupabase.mockReturnValue({ data: [], error: null })

      const filters = {
        familyMemberId: 'family-456',
        activity: 'policy_accessed' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 10,
        offset: 20
      }

      await auditService.getAuditTrail('owner-123', filters)

      expect(mockSupabase.eq).toHaveBeenCalledWith('family_member_id', 'family-456')
      expect(mockSupabase.eq).toHaveBeenCalledWith('activity', 'policy_accessed')
      expect(mockSupabase.gte).toHaveBeenCalledWith('timestamp', '2024-01-01T00:00:00.000Z')
      expect(mockSupabase.lte).toHaveBeenCalledWith('timestamp', '2024-01-31T00:00:00.000Z')
      expect(mockSupabase.limit).toHaveBeenCalledWith(10)
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29)
    })
  })

  describe('getAuditStatistics', () => {
    it('should return audit statistics', async () => {
      // Mock total count
      mockSupabase.mockReturnValueOnce({
        count: 50,
        error: null
      })

      // Mock activities data
      mockSupabase.mockReturnValueOnce({
        data: [
          { activity: 'policy_accessed' },
          { activity: 'policy_accessed' },
          { activity: 'permissions_changed' },
          { activity: 'invitation_sent' }
        ],
        error: null
      })

      // Mock recent activities (getAuditTrail call)
      mockSupabase.mockReturnValueOnce({
        data: [],
        error: null
      })

      const stats = await auditService.getAuditStatistics('owner-123', 30)

      expect(stats.totalActivities).toBe(50)
      expect(stats.policyAccesses).toBe(2)
      expect(stats.permissionChanges).toBe(1)
      expect(stats.invitationActivities).toBe(1)
      expect(Array.isArray(stats.recentActivities)).toBe(true)
    })
  })

  describe('detectSuspiciousActivity', () => {
    it('should detect bulk policy access', async () => {
      // Mock getAuditTrail to return many policy accesses
      const mockEntries = Array.from({ length: 15 }, (_, i) => ({
        id: `audit-${i}`,
        vaultOwnerId: 'owner-123',
        familyMemberId: 'family-456',
        activity: 'policy_accessed' as const,
        details: { policyId: `policy-${i}` },
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      }))

      // Mock the audit service's getAuditTrail method
      vi.spyOn(auditService, 'getAuditTrail').mockResolvedValue(mockEntries)

      // Mock no existing alert
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      // Mock alert creation
      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          id: 'alert-1',
          vault_owner_id: 'owner-123',
          family_member_id: 'family-456',
          alert_type: 'bulk_policy_access',
          description: 'Family member accessed 15 policies in the last hour',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          resolved: false
        },
        error: null
      })

      const alerts = await auditService.detectSuspiciousActivity('owner-123')

      expect(alerts).toHaveLength(1)
      expect(alerts[0].alertType).toBe('bulk_policy_access')
      expect(alerts[0].severity).toBe('medium')
    })

    it('should not create duplicate alerts', async () => {
      // Mock getAuditTrail to return many policy accesses
      const mockEntries = Array.from({ length: 15 }, (_, i) => ({
        id: `audit-${i}`,
        vaultOwnerId: 'owner-123',
        familyMemberId: 'family-456',
        activity: 'policy_accessed' as const,
        details: { policyId: `policy-${i}` },
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      }))

      vi.spyOn(auditService, 'getAuditTrail').mockResolvedValue(mockEntries)

      // Mock existing alert found
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing-alert' },
        error: null
      })

      const alerts = await auditService.detectSuspiciousActivity('owner-123')

      expect(alerts).toHaveLength(0)
      expect(mockSupabase.insert).not.toHaveBeenCalled()
    })
  })

  describe('getSecurityAlerts', () => {
    it('should fetch security alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          vault_owner_id: 'owner-123',
          family_member_id: 'family-456',
          alert_type: 'bulk_policy_access',
          description: 'Suspicious activity detected',
          severity: 'medium',
          timestamp: '2024-01-01T10:00:00Z',
          resolved: false
        }
      ]

      mockSupabase.mockReturnValue({
        data: mockAlerts,
        error: null
      })

      const alerts = await auditService.getSecurityAlerts('owner-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('family_security_alerts')
      expect(mockSupabase.eq).toHaveBeenCalledWith('vault_owner_id', 'owner-123')
      expect(alerts).toHaveLength(1)
      expect(alerts[0].id).toBe('alert-1')
    })

    it('should filter by resolved status', async () => {
      mockSupabase.mockReturnValue({ data: [], error: null })

      await auditService.getSecurityAlerts('owner-123', false)

      expect(mockSupabase.eq).toHaveBeenCalledWith('resolved', false)
    })
  })

  describe('resolveSecurityAlert', () => {
    it('should resolve security alert', async () => {
      mockSupabase.update.mockResolvedValueOnce({ error: null })

      await auditService.resolveSecurityAlert('alert-123', 'owner-456')

      expect(mockSupabase.from).toHaveBeenCalledWith('family_security_alerts')
      expect(mockSupabase.update).toHaveBeenCalledWith({ resolved: true })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'alert-123')
      expect(mockSupabase.eq).toHaveBeenCalledWith('vault_owner_id', 'owner-456')
    })
  })
})
