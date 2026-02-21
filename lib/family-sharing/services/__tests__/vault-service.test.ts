// Vault Service Tests
// Unit tests for the vault service implementation

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VaultServiceImpl } from '../vault-service'
import { permissionService } from '../permission-service'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                vault_owner_id: 'test-owner-id',
                email: 'test@example.com'
              },
              error: null
            }))
          }))
        }))
      }))
    }))
  })
}))

// Mock the permission service
vi.mock('../permission-service', () => ({
  permissionService: {
    getAccessiblePolicies: vi.fn(),
    canAccessPolicy: vi.fn()
  }
}))

describe('VaultService', () => {
  let vaultService: VaultServiceImpl

  beforeEach(() => {
    vaultService = new VaultServiceImpl()
    vi.clearAllMocks()
  })

  describe('getSharedPolicies', () => {
    it('should return empty array when no accessible policies', async () => {
      // Mock no accessible policies
      vi.mocked(permissionService.getAccessiblePolicies).mockResolvedValue([])

      const result = await vaultService.getSharedPolicies('test-family-member-id')

      expect(result).toEqual([])
      expect(permissionService.getAccessiblePolicies).toHaveBeenCalledWith('test-family-member-id')
    })

    it('should throw error when family member not found', async () => {
      // Mock accessible policies but family member not found
      vi.mocked(permissionService.getAccessiblePolicies).mockResolvedValue(['policy-1'])
      
      // Mock Supabase to return error
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: { message: 'Family member not found' }
                }))
              }))
            }))
          }))
        }))
      }

      // Replace the supabase instance
      ;(vaultService as any).supabase = mockSupabase

      await expect(vaultService.getSharedPolicies('invalid-family-member-id'))
        .rejects.toThrow('Family member not found or inactive')
    })
  })

  describe('getPolicyDetails', () => {
    it('should throw error when access denied', async () => {
      // Mock access denied
      vi.mocked(permissionService.canAccessPolicy).mockResolvedValue(false)

      await expect(vaultService.getPolicyDetails('test-family-member-id', 'test-policy-id'))
        .rejects.toThrow('Access denied: Family member cannot access this policy')

      expect(permissionService.canAccessPolicy).toHaveBeenCalledWith('test-family-member-id', 'test-policy-id')
    })
  })

  describe('searchPolicies', () => {
    it('should return all policies when query is empty', async () => {
      // Mock the getSharedPolicies method
      const mockPolicies = [
        {
          id: 'policy-1',
          type: 'Auto Insurance',
          provider: 'Test Insurance',
          policyNumber: '12345',
          coverageAmount: 50000,
          premium: 1200,
          expirationDate: new Date(),
          status: 'Active'
        }
      ]

      vi.spyOn(vaultService, 'getSharedPolicies').mockResolvedValue(mockPolicies)

      const result = await vaultService.searchPolicies('test-family-member-id', '')

      expect(result).toEqual(mockPolicies)
      expect(vaultService.getSharedPolicies).toHaveBeenCalledWith('test-family-member-id')
    })
  })

  describe('getPolicyDocument', () => {
    it('should return placeholder document when access allowed', async () => {
      // Mock access allowed
      vi.mocked(permissionService.canAccessPolicy).mockResolvedValue(true)

      const result = await vaultService.getPolicyDocument('test-family-member-id', 'test-policy-id')

      expect(result).toMatchObject({
        id: 'test-policy-id-summary',
        name: 'Policy Summary - test-policy-id',
        type: 'application/pdf',
        url: '/api/family-sharing/policies/test-policy-id/document'
      })
      expect(permissionService.canAccessPolicy).toHaveBeenCalledWith('test-family-member-id', 'test-policy-id')
    })
  })
})
