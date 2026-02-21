// Dashboard Management Service Tests
// Tests for dashboard management controls functionality

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DashboardManagementServiceImpl } from '../dashboard-management'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        })),
        single: vi.fn()
      })),
      in: vi.fn(() => ({
        data: [],
        error: null
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        error: null
      }))
    }))
  }))
}

// Mock services
const mockInvitationService = {
  sendInvitation: vi.fn(),
  resendInvitation: vi.fn(),
  revokeInvitation: vi.fn()
}

const mockPermissionService = {
  setPermissions: vi.fn(),
  updatePolicyPermissions: vi.fn(),
  revokeAccess: vi.fn()
}

const mockAuditService = {
  logPermissionChange: vi.fn(),
  logInvitationActivity: vi.fn(),
  logAccessRevocation: vi.fn()
}

const mockNotificationService = {
  sendPermissionChangeNotification: vi.fn(),
  sendInvitationRevokedNotification: vi.fn(),
  sendAccessRevokedNotification: vi.fn(),
  sendAccessSuspendedNotification: vi.fn(),
  sendAccessReactivatedNotification: vi.fn()
}

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => mockSupabase
}))

describe('DashboardManagementService', () => {
  let managementService: DashboardManagementServiceImpl

  beforeEach(() => {
    vi.clearAllMocks()
    managementService = new DashboardManagementServiceImpl()
    
    // Replace service instances with mocks
    ;(managementService as any).invitationService = mockInvitationService
    ;(managementService as any).permissionService = mockPermissionService
    ;(managementService as any).auditService = mockAuditService
    ;(managementService as any).notificationService = mockNotificationService
  })

  describe('updateFamilyMemberPermissions', () => {
    it('should successfully update family member permissions', async () => {
      const mockFamilyMember = {
        id: 'member-1',
        email: 'test@example.com',
        permissions: 'view_all',
        vault_owner_id: 'vault-owner-1'
      }

      // Mock family member fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockFamilyMember,
                  error: null
                }))
              }))
            }))
          }))
        }))
      })

      // Mock policy validation for view_specific
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => ({
                data: [{ policy_key: 'policy-1' }],
                error: null
              }))
            }))
          }))
        }))
      })

      const request = {
        familyMemberId: 'member-1',
        permissions: 'view_specific' as const,
        specificPolicyIds: ['policy-1'],
        reason: 'Test update'
      }

      const result = await managementService.updateFamilyMemberPermissions('vault-owner-1', request)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Permissions updated successfully')
      expect(result.affectedItems).toEqual(['test@example.com'])
      
      expect(mockPermissionService.setPermissions).toHaveBeenCalledWith('member-1', 'view_specific')
      expect(mockPermissionService.updatePolicyPermissions).toHaveBeenCalledWith('member-1', ['policy-1'])
      expect(mockAuditService.logPermissionChange).toHaveBeenCalled()
      expect(mockNotificationService.sendPermissionChangeNotification).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const request = {
        familyMemberId: 'invalid-member',
        permissions: 'view_all' as const
      }

      // Mock family member not found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: { message: 'Not found' }
                }))
              }))
            }))
          }))
        }))
      })

      const result = await managementService.updateFamilyMemberPermissions('vault-owner-1', request)

      expect(result.success).toBe(false)
      expect(result.message).toContain('validation failed')
    })
  })

  describe('sendNewInvitation', () => {
    it('should successfully send new invitation', async () => {
      const mockInvitation = {
        id: 'invitation-1',
        email: 'newuser@example.com',
        permissions: 'view_all'
      }

      // Mock no existing access check
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { code: 'PGRST116' } // No rows found
              }))
            }))
          }))
        }))
      })

      mockInvitationService.sendInvitation.mockResolvedValue(mockInvitation)

      const request = {
        email: 'newuser@example.com',
        permissions: 'view_all' as const,
        message: 'Welcome to the family vault'
      }

      const result = await managementService.sendNewInvitation('vault-owner-1', request)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Invitation sent successfully')
      expect(result.affectedItems).toEqual(['newuser@example.com'])
      
      expect(mockInvitationService.sendInvitation).toHaveBeenCalledWith(
        'vault-owner-1',
        'newuser@example.com',
        'view_all'
      )
      expect(mockAuditService.logInvitationActivity).toHaveBeenCalled()
    })

    it('should reject invalid email format', async () => {
      const request = {
        email: 'invalid-email',
        permissions: 'view_all' as const
      }

      const result = await managementService.sendNewInvitation('vault-owner-1', request)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid email format')
    })
  })

  describe('revokeFamilyMemberAccess', () => {
    it('should successfully revoke family member access', async () => {
      const mockFamilyMember = {
        id: 'member-1',
        email: 'test@example.com',
        vault_owner_id: 'vault-owner-1'
      }

      // Mock family member fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockFamilyMember,
                error: null
              }))
            }))
          }))
        }))
      })

      const request = {
        familyMemberId: 'member-1',
        reason: 'No longer needed',
        notifyMember: true
      }

      const result = await managementService.revokeFamilyMemberAccess('vault-owner-1', request)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Access revoked successfully')
      expect(result.affectedItems).toEqual(['test@example.com'])
      
      expect(mockPermissionService.revokeAccess).toHaveBeenCalledWith('member-1')
      expect(mockAuditService.logAccessRevocation).toHaveBeenCalledWith(
        'vault-owner-1',
        'member-1',
        'No longer needed'
      )
      expect(mockNotificationService.sendAccessRevokedNotification).toHaveBeenCalledWith(
        'test@example.com',
        'No longer needed'
      )
    })
  })

  describe('validatePermissionUpdate', () => {
    it('should validate permission update request', async () => {
      const mockFamilyMember = {
        id: 'member-1',
        vault_owner_id: 'vault-owner-1'
      }

      // Mock family member exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockFamilyMember,
                error: null
              }))
            }))
          }))
        }))
      })

      // Mock policy validation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => ({
                data: [{ policy_key: 'policy-1' }],
                error: null
              }))
            }))
          }))
        }))
      })

      const request = {
        familyMemberId: 'member-1',
        permissions: 'view_specific' as const,
        specificPolicyIds: ['policy-1']
      }

      const result = await managementService.validatePermissionUpdate('vault-owner-1', request)

      expect(result.valid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect validation issues', async () => {
      const request = {
        familyMemberId: 'invalid-member',
        permissions: 'invalid_permission' as any
      }

      // Mock family member not found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Not found' }
              }))
            }))
          }))
        }))
      })

      const result = await managementService.validatePermissionUpdate('vault-owner-1', request)

      expect(result.valid).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues).toContain('Family member not found or does not belong to this vault')
      expect(result.issues).toContain('Invalid permission level')
    })
  })

  describe('batchManagementOperations', () => {
    it('should execute multiple operations in batch', async () => {
      // Mock successful operations
      const mockFamilyMember = {
        id: 'member-1',
        email: 'test@example.com',
        permissions: 'view_all',
        vault_owner_id: 'vault-owner-1'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: mockFamilyMember,
                  error: null
                }))
              })),
              single: vi.fn(() => ({
                data: mockFamilyMember,
                error: null
              }))
            }))
          }))
        }))
      })

      const operations = [
        {
          type: 'update_permissions' as const,
          data: {
            familyMemberId: 'member-1',
            permissions: 'view_specific' as const,
            specificPolicyIds: ['policy-1']
          }
        },
        {
          type: 'send_invitation' as const,
          data: {
            email: 'newuser@example.com',
            permissions: 'view_all' as const
          }
        }
      ]

      const results = await managementService.batchManagementOperations('vault-owner-1', operations)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
    })
  })
})
