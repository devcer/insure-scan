// Permission Service Unit Tests
// Tests for permission management system functionality

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { PermissionServiceImpl } from '../permission-service'
import { PermissionLevel } from '../../types/core'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase)
}

// Mock the Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}))

describe('PermissionService', () => {
  let permissionService: PermissionServiceImpl
  
  beforeEach(() => {
    vi.clearAllMocks()
    permissionService = new PermissionServiceImpl()
  })

  describe('setPermissions', () => {
    it('should set view_all permissions successfully', async () => {
      const familyMemberId = 'family-123'
      const permissions: PermissionLevel = 'view_all'
      
      // Mock family member exists
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: familyMemberId, permissions: 'view_specific', status: 'active' },
        error: null
      })
      
      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({ error: null })
      
      await permissionService.setPermissions(familyMemberId, permissions)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('family_members')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        permissions: 'view_all',
        specific_policy_ids: null
      })
    })

    it('should set view_specific permissions successfully', async () => {
      const familyMemberId = 'family-123'
      const permissions: PermissionLevel = 'view_specific'
      
      // Mock family member exists
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: familyMemberId, permissions: 'view_all', status: 'active' },
        error: null
      })
      
      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({ error: null })
      
      await permissionService.setPermissions(familyMemberId, permissions)
      
      expect(mockSupabase.update).toHaveBeenCalledWith({
        permissions: 'view_specific'
      })
    })

    it('should throw error for invalid permission level', async () => {
      const familyMemberId = 'family-123'
      const invalidPermissions = 'invalid' as PermissionLevel
      
      await expect(
        permissionService.setPermissions(familyMemberId, invalidPermissions)
      ).rejects.toThrow('Invalid permission level: invalid')
    })

    it('should throw error if family member not found', async () => {
      const familyMemberId = 'nonexistent'
      const permissions: PermissionLevel = 'view_all'
      
      // Mock family member not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })
      
      await expect(
        permissionService.setPermissions(familyMemberId, permissions)
      ).rejects.toThrow('Family member not found or inactive')
    })
  })

  describe('canAccessPolicy', () => {
    it('should return true for view_all permissions', async () => {
      const familyMemberId = 'family-123'
      const policyId = 'policy-456'
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          permissions: 'view_all',
          status: 'active'
        },
        error: null
      })
      
      const result = await permissionService.canAccessPolicy(familyMemberId, policyId)
      
      expect(result).toBe(true)
    })

    it('should return true for view_specific with matching policy', async () => {
      const familyMemberId = 'family-123'
      const policyId = 'policy-456'
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          permissions: 'view_specific',
          specific_policy_ids: ['policy-456', 'policy-789'],
          status: 'active'
        },
        error: null
      })
      
      const result = await permissionService.canAccessPolicy(familyMemberId, policyId)
      
      expect(result).toBe(true)
    })

    it('should return false for view_specific without matching policy', async () => {
      const familyMemberId = 'family-123'
      const policyId = 'policy-999'
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          permissions: 'view_specific',
          specific_policy_ids: ['policy-456', 'policy-789'],
          status: 'active'
        },
        error: null
      })
      
      const result = await permissionService.canAccessPolicy(familyMemberId, policyId)
      
      expect(result).toBe(false)
    })

    it('should return false if family member not found', async () => {
      const familyMemberId = 'nonexistent'
      const policyId = 'policy-456'
      
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })
      
      const result = await permissionService.canAccessPolicy(familyMemberId, policyId)
      
      expect(result).toBe(false)
    })
  })

  describe('updatePolicyPermissions', () => {
    it('should update policy permissions for view_specific family member', async () => {
      const familyMemberId = 'family-123'
      const policyIds = ['policy-456', 'policy-789']
      
      // Mock family member with view_specific permissions
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: familyMemberId,
          permissions: 'view_specific',
          vault_owner_id: 'owner-123',
          status: 'active'
        },
        error: null
      })
      
      // Mock policy validation
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockResolvedValueOnce({
        data: [{ id: 'policy-456' }, { id: 'policy-789' }],
        error: null
      })
      
      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({ error: null })
      
      await permissionService.updatePolicyPermissions(familyMemberId, policyIds)
      
      expect(mockSupabase.update).toHaveBeenCalledWith({
        specific_policy_ids: policyIds
      })
    })

    it('should throw error for empty policy IDs array', async () => {
      const familyMemberId = 'family-123'
      const policyIds: string[] = []
      
      await expect(
        permissionService.updatePolicyPermissions(familyMemberId, policyIds)
      ).rejects.toThrow('At least one policy ID must be specified')
    })

    it('should throw error for view_all family member', async () => {
      const familyMemberId = 'family-123'
      const policyIds = ['policy-456']
      
      // Mock family member with view_all permissions
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: familyMemberId,
          permissions: 'view_all',
          status: 'active'
        },
        error: null
      })
      
      await expect(
        permissionService.updatePolicyPermissions(familyMemberId, policyIds)
      ).rejects.toThrow('Can only update policy permissions for family members with view_specific permissions')
    })
  })

  describe('revokeAccess', () => {
    it('should revoke access successfully', async () => {
      const familyMemberId = 'family-123'
      
      mockSupabase.update.mockResolvedValueOnce({ error: null })
      
      await permissionService.revokeAccess(familyMemberId)
      
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'revoked',
        specific_policy_ids: null
      })
    })

    it('should throw error if update fails', async () => {
      const familyMemberId = 'family-123'
      
      mockSupabase.update.mockResolvedValueOnce({
        error: { message: 'Database error' }
      })
      
      await expect(
        permissionService.revokeAccess(familyMemberId)
      ).rejects.toThrow('Failed to revoke access: Database error')
    })
  })
})
