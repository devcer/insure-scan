// Dashboard Service Tests
// Tests for dashboard data aggregation functionality

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DashboardServiceImpl } from '../dashboard-service'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn()
          }))
        })),
        gte: vi.fn(() => ({
          single: vi.fn()
        })),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      gte: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
}

// Mock services
const mockInvitationService = {
  getInvitations: vi.fn()
}

const mockPermissionService = {
  getAccessiblePolicies: vi.fn()
}

const mockAuditService = {
  getAuditTrail: vi.fn(),
  getSecurityAlerts: vi.fn()
}

const mockVaultService = {
  getCriticalPolicies: vi.fn()
}

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => mockSupabase
}))

describe('DashboardService', () => {
  let dashboardService: DashboardServiceImpl

  beforeEach(() => {
    vi.clearAllMocks()
    dashboardService = new DashboardServiceImpl()
    
    // Replace service instances with mocks
    ;(dashboardService as any).invitationService = mockInvitationService
    ;(dashboardService as any).permissionService = mockPermissionService
    ;(dashboardService as any).auditService = mockAuditService
    ;(dashboardService as any).vaultService = mockVaultService
  })

  describe('getSummaryStatistics', () => {
    it('should return correct summary statistics', async () => {
      // Mock family members data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [
              { status: 'active' },
              { status: 'active' },
              { status: 'suspended' }
            ],
            error: null
          }))
        }))
      })

      // Mock invitations data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [{ status: 'pending' }, { status: 'pending' }],
              error: null
            }))
          }))
        }))
      })

      // Mock recent activities count
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              count: 15,
              error: null
            }))
          }))
        }))
      })

      // Mock security alerts count
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              count: 3,
              error: null
            }))
          }))
        }))
      })

      const vaultOwnerId = 'test-vault-owner-id'
      const result = await dashboardService.getSummaryStatistics(vaultOwnerId)

      expect(result).toEqual({
        totalFamilyMembers: 3,
        activeFamilyMembers: 2,
        pendingInvitations: 2,
        recentActivities: 15,
        securityAlerts: 3,
        lastUpdated: expect.any(Date)
      })
    })

    it('should handle empty data gracefully', async () => {
      // Mock empty responses
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null,
              count: 0
            })),
            gte: vi.fn(() => ({
              count: 0,
              error: null
            }))
          }))
        }))
      })

      const vaultOwnerId = 'test-vault-owner-id'
      const result = await dashboardService.getSummaryStatistics(vaultOwnerId)

      expect(result).toEqual({
        totalFamilyMembers: 0,
        activeFamilyMembers: 0,
        pendingInvitations: 0,
        recentActivities: 0,
        securityAlerts: 0,
        lastUpdated: expect.any(Date)
      })
    })
  })

  describe('getFamilyMemberSummaries', () => {
    it('should return formatted family member summaries', async () => {
      const mockFamilyMembers = [
        {
          id: 'member-1',
          email: 'test1@example.com',
          permissions: 'view_all',
          status: 'active',
          specific_policy_ids: null,
          last_access_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'member-2',
          email: 'test2@example.com',
          permissions: 'view_specific',
          status: 'active',
          specific_policy_ids: ['policy-1', 'policy-2'],
          last_access_at: null
        }
      ]

      // Mock family members query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockFamilyMembers,
              error: null
            }))
          }))
        }))
      })

      // Mock policy count queries
      mockPermissionService.getAccessiblePolicies
        .mockResolvedValueOnce(['policy-1', 'policy-2', 'policy-3'])
        .mockResolvedValueOnce(['policy-1', 'policy-2'])

      // Mock recent activity queries
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [{ id: 'activity-1' }],
                  error: null
                }))
              }))
            }))
          }))
        }))
      })

      const vaultOwnerId = 'test-vault-owner-id'
      const result = await dashboardService.getFamilyMemberSummaries(vaultOwnerId)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'member-1',
        email: 'test1@example.com',
        permissions: 'View All Policies',
        status: 'Active',
        lastAccess: new Date('2024-01-01T00:00:00Z'),
        policyCount: 3,
        recentActivity: true
      })
      expect(result[1]).toEqual({
        id: 'member-2',
        email: 'test2@example.com',
        permissions: 'View 2 Specific Policies',
        status: 'Active',
        lastAccess: undefined,
        policyCount: 2,
        recentActivity: true
      })
    })
  })

  describe('getInvitationSummaries', () => {
    it('should return formatted invitation summaries with expiration tracking', async () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      
      const mockInvitations = [
        {
          id: 'invitation-1',
          email: 'test@example.com',
          permissions: 'view_all',
          status: 'pending',
          createdAt: now,
          expiresAt: futureDate
        }
      ]

      mockInvitationService.getInvitations.mockResolvedValue(mockInvitations)

      const vaultOwnerId = 'test-vault-owner-id'
      const result = await dashboardService.getInvitationSummaries(vaultOwnerId)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'invitation-1',
        email: 'test@example.com',
        permissions: 'View All Policies',
        status: 'Pending',
        sentDate: now,
        expiresDate: futureDate,
        daysRemaining: 2
      })
    })
  })

  describe('getRecentActivities', () => {
    it('should combine and format activities from audit entries and security alerts', async () => {
      const mockAuditEntries = [
        {
          id: 'audit-1',
          activity: 'policy_accessed',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          details: {
            familyMemberEmail: 'test@example.com',
            policy_id: 'policy-1'
          }
        }
      ]

      const mockSecurityAlerts = [
        {
          id: 'alert-1',
          description: 'Suspicious activity detected',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          severity: 'high'
        }
      ]

      mockAuditService.getAuditTrail.mockResolvedValue(mockAuditEntries)
      mockAuditService.getSecurityAlerts.mockResolvedValue(mockSecurityAlerts)

      const vaultOwnerId = 'test-vault-owner-id'
      const result = await dashboardService.getRecentActivities(vaultOwnerId, 10)

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('policy_access')
      expect(result[1].type).toBe('security_alert')
      expect(result[0].timestamp.getTime()).toBeGreaterThan(result[1].timestamp.getTime())
    })
  })
})
