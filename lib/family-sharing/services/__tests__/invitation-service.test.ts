// Unit tests for Invitation Service
// Tests invitation creation, token generation, and basic functionality

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InvitationServiceImpl } from '../invitation-service'
import { PermissionLevel } from '../../types/core'

// Mock the Supabase client
vi.mock('../../../supabase/server', () => ({
  createSupabaseServerClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn()
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  })
}))

describe('InvitationService', () => {
  let invitationService: InvitationServiceImpl
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    invitationService = new InvitationServiceImpl()
    
    // Get the mocked supabase instance
    const { createSupabaseServerClient } = require('../../../supabase/server')
    mockSupabase = createSupabaseServerClient()
  })

  describe('sendInvitation', () => {
    it('should validate required parameters', async () => {
      await expect(
        invitationService.sendInvitation('', 'test@example.com', 'view_all')
      ).rejects.toThrow('Missing required parameters')

      await expect(
        invitationService.sendInvitation('user-123', '', 'view_all')
      ).rejects.toThrow('Missing required parameters')

      await expect(
        invitationService.sendInvitation('user-123', 'test@example.com', '' as PermissionLevel)
      ).rejects.toThrow('Missing required parameters')
    })

    it('should validate email format', async () => {
      await expect(
        invitationService.sendInvitation('user-123', 'invalid-email', 'view_all')
      ).rejects.toThrow('Invalid email format')

      await expect(
        invitationService.sendInvitation('user-123', 'test@', 'view_all')
      ).rejects.toThrow('Invalid email format')

      await expect(
        invitationService.sendInvitation('user-123', '@example.com', 'view_all')
      ).rejects.toThrow('Invalid email format')
    })

    it('should validate permission levels', async () => {
      await expect(
        invitationService.sendInvitation('user-123', 'test@example.com', 'invalid' as PermissionLevel)
      ).rejects.toThrow('Invalid permission level')
    })

    it('should check for existing pending invitations', async () => {
      // Mock existing invitation found
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'existing-invitation' },
                  error: null
                })
              }))
            }))
          }))
        }))
      })

      await expect(
        invitationService.sendInvitation('user-123', 'test@example.com', 'view_all')
      ).rejects.toThrow('A pending invitation already exists')
    })

    it('should create invitation with valid token when no existing invitation', async () => {
      // Mock no existing invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' } // No rows returned
                })
              }))
            }))
          }))
        }))
      })

      // Mock successful invitation creation
      const mockInvitation = {
        id: 'invitation-123',
        vault_owner_id: 'user-123',
        email: 'test@example.com',
        permissions: 'view_all',
        token: 'secure-token-123',
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        accepted_at: null
      }

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockInvitation,
              error: null
            })
          }))
        }))
      })

      // Mock user lookup for email
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { name: 'Test User', email: 'owner@example.com' },
              error: null
            })
          }))
        }))
      })

      const result = await invitationService.sendInvitation('user-123', 'test@example.com', 'view_all')

      expect(result).toMatchObject({
        id: 'invitation-123',
        vaultOwnerId: 'user-123',
        email: 'test@example.com',
        permissions: 'view_all',
        status: 'pending'
      })
      expect(result.token).toBeTruthy()
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.expiresAt).toBeInstanceOf(Date)
    })
  })

  describe('getInvitations', () => {
    it('should validate vaultOwnerId parameter', async () => {
      await expect(
        invitationService.getInvitations('')
      ).rejects.toThrow('vaultOwnerId is required')
    })

    it('should return invitations for vault owner', async () => {
      const mockInvitations = [
        {
          id: 'invitation-1',
          vault_owner_id: 'user-123',
          email: 'test1@example.com',
          permissions: 'view_all',
          token: 'token-1',
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          accepted_at: null
        },
        {
          id: 'invitation-2',
          vault_owner_id: 'user-123',
          email: 'test2@example.com',
          permissions: 'view_specific',
          token: 'token-2',
          status: 'accepted',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          accepted_at: new Date().toISOString()
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: mockInvitations,
              error: null
            })
          }))
        }))
      })

      const result = await invitationService.getInvitations('user-123')

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: 'invitation-1',
        vaultOwnerId: 'user-123',
        email: 'test1@example.com',
        permissions: 'view_all',
        status: 'pending'
      })
      expect(result[1]).toMatchObject({
        id: 'invitation-2',
        vaultOwnerId: 'user-123',
        email: 'test2@example.com',
        permissions: 'view_specific',
        status: 'accepted'
      })
    })
  })
})
