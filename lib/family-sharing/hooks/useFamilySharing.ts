// Family Sharing React Hook
// Provides client-side integration for all family sharing functionality

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

// Types for hook state and API responses
interface FamilyMember {
  id: string
  email: string
  permissions: string
  status: string
  lastAccess?: string
  policyCount: number
}

interface Invitation {
  id: string
  email: string
  permissions: string
  status: string
  expiresAt: string
}

interface SecurityAlert {
  id: string
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
}

interface DashboardData {
  totalFamilyMembers: number
  activeFamilyMembers: number
  pendingInvitations: number
  recentActivities: number
  securityAlerts: number
  lastUpdated: string
}

interface FamilySharingState {
  // Data
  dashboardData: DashboardData | null
  familyMembers: FamilyMember[]
  invitations: Invitation[]
  securityAlerts: SecurityAlert[]
  
  // Loading states
  loading: boolean
  inviting: boolean
  updating: boolean
  
  // Error state
  error: string | null
}

interface FamilySharingActions {
  // Data fetching
  refreshData: () => Promise<void>
  
  // Invitation management
  inviteFamilyMember: (email: string, permissions: string, specificPolicyIds?: string[]) => Promise<boolean>
  acceptInvitation: (token: string) => Promise<boolean>
  
  // Permission management
  updatePermissions: (familyMemberId: string, permissions: string, specificPolicyIds?: string[]) => Promise<boolean>
  revokeAccess: (familyMemberId: string, reason?: string) => Promise<boolean>
  
  // Policy access (for family members)
  accessPolicy: (policyId: string, accessType?: string) => Promise<any>
  
  // Utility
  clearError: () => void
}

/**
 * Custom hook for family sharing functionality
 * Provides complete integration with the family sharing system
 */
export function useFamilySharing(): FamilySharingState & FamilySharingActions {
  const { data: session } = useSession()
  
  const [state, setState] = useState<FamilySharingState>({
    dashboardData: null,
    familyMembers: [],
    invitations: [],
    securityAlerts: [],
    loading: false,
    inviting: false,
    updating: false,
    error: null
  })

  // API call helper
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }, [])

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!session?.user?.id) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Fetch all data in parallel
      const [dashboardResponse, membersResponse, alertsResponse] = await Promise.all([
        apiCall('/api/family-sharing?action=dashboard'),
        apiCall('/api/family-sharing?action=members'),
        apiCall('/api/family-sharing?action=alerts')
      ])

      setState(prev => ({
        ...prev,
        dashboardData: dashboardResponse,
        familyMembers: membersResponse.familyMembers || [],
        securityAlerts: alertsResponse.alerts || [],
        loading: false
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    }
  }, [session?.user?.id, apiCall])

  // Invite family member
  const inviteFamilyMember = useCallback(async (
    email: string,
    permissions: string,
    specificPolicyIds?: string[]
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, inviting: true, error: null }))

    try {
      await apiCall('/api/family-sharing', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invite',
          email,
          permissions,
          specificPolicyIds
        })
      })

      setState(prev => ({ ...prev, inviting: false }))
      await refreshData() // Refresh to show new invitation
      return true

    } catch (error) {
      setState(prev => ({
        ...prev,
        inviting: false,
        error: error instanceof Error ? error.message : 'Failed to send invitation'
      }))
      return false
    }
  }, [apiCall, refreshData])

  // Accept invitation
  const acceptInvitation = useCallback(async (token: string): Promise<boolean> => {
    setState(prev => ({ ...prev, updating: true, error: null }))

    try {
      await apiCall('/api/family-sharing', {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          token
        })
      })

      setState(prev => ({ ...prev, updating: false }))
      return true

    } catch (error) {
      setState(prev => ({
        ...prev,
        updating: false,
        error: error instanceof Error ? error.message : 'Failed to accept invitation'
      }))
      return false
    }
  }, [apiCall])

  // Update permissions
  const updatePermissions = useCallback(async (
    familyMemberId: string,
    permissions: string,
    specificPolicyIds?: string[]
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, updating: true, error: null }))

    try {
      await apiCall('/api/family-sharing', {
        method: 'POST',
        body: JSON.stringify({
          action: 'updatePermissions',
          familyMemberId,
          newPermissions: permissions,
          newSpecificPolicyIds: specificPolicyIds
        })
      })

      setState(prev => ({ ...prev, updating: false }))
      await refreshData() // Refresh to show updated permissions
      return true

    } catch (error) {
      setState(prev => ({
        ...prev,
        updating: false,
        error: error instanceof Error ? error.message : 'Failed to update permissions'
      }))
      return false
    }
  }, [apiCall, refreshData])

  // Revoke access
  const revokeAccess = useCallback(async (
    familyMemberId: string,
    reason?: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, updating: true, error: null }))

    try {
      await apiCall('/api/family-sharing', {
        method: 'POST',
        body: JSON.stringify({
          action: 'revokeAccess',
          familyMemberId,
          reason
        })
      })

      setState(prev => ({ ...prev, updating: false }))
      await refreshData() // Refresh to remove revoked member
      return true

    } catch (error) {
      setState(prev => ({
        ...prev,
        updating: false,
        error: error instanceof Error ? error.message : 'Failed to revoke access'
      }))
      return false
    }
  }, [apiCall, refreshData])

  // Access policy (for family members)
  const accessPolicy = useCallback(async (
    policyId: string,
    accessType: string = 'view'
  ): Promise<any> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiCall('/api/family-sharing', {
        method: 'POST',
        body: JSON.stringify({
          action: 'accessPolicy',
          policyId,
          accessType
        })
      })

      setState(prev => ({ ...prev, loading: false }))
      return response.policy

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to access policy'
      }))
      return null
    }
  }, [apiCall])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Load initial data when session is available
  useEffect(() => {
    if (session?.user?.id) {
      refreshData()
    }
  }, [session?.user?.id, refreshData])

  return {
    // State
    ...state,
    
    // Actions
    refreshData,
    inviteFamilyMember,
    acceptInvitation,
    updatePermissions,
    revokeAccess,
    accessPolicy,
    clearError
  }
}

// Export types for use in components
export type {
  FamilyMember,
  Invitation,
  SecurityAlert,
  DashboardData,
  FamilySharingState,
  FamilySharingActions
}
