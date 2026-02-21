// Vault Service Implementation
// Provides read-only access to shared insurance policies for family members

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { VaultService } from '../types/services'
import { PolicySummary, PolicyDetails, Document, AccessType } from '../types/core'
import { permissionService } from './permission-service'
import { familyPolicyFormatter, PolicyFormattingUtils, FormattedPolicySummary } from '../utils/policy-formatter'

export class VaultServiceImpl implements VaultService {
  private supabase = createSupabaseServerClient()

  /**
   * Get shared policies for family member (filtered by permissions)
   * Requirements: 3.1, 7.3
   */
  async getSharedPolicies(familyMemberId: string): Promise<PolicySummary[]> {
    try {
      // Get accessible policy IDs for this family member
      const accessiblePolicyIds = await permissionService.getAccessiblePolicies(familyMemberId)
      
      if (accessiblePolicyIds.length === 0) {
        return []
      }

      // Get family member info for vault owner ID
      const { data: familyMember, error: memberError } = await this.supabase
        .from('family_members')
        .select('vault_owner_id, email')
        .eq('id', familyMemberId)
        .eq('status', 'active')
        .single()

      if (memberError || !familyMember) {
        throw new Error('Family member not found or inactive')
      }

      // For the current system, we'll use insurance_premiums as the policy source
      // Group by policy_key to get unique policies
      const { data: premiums, error: premiumsError } = await this.supabase
        .from('insurance_premiums')
        .select(`
          id,
          policy_key,
          insurer_name,
          policy_number,
          amount,
          due_date,
          payment_status,
          created_at
        `)
        .eq('user_id', familyMember.vault_owner_id)
        .eq('archived', false)
        .in('policy_key', accessiblePolicyIds)
        .order('created_at', { ascending: false })

      if (premiumsError) {
        throw new Error(`Failed to fetch policies: ${premiumsError.message}`)
      }

      // Group premiums by policy_key and create policy summaries
      const policyMap = new Map<string, PolicySummary>()
      
      premiums?.forEach((premium: any) => {
        if (!policyMap.has(premium.policy_key)) {
          policyMap.set(premium.policy_key, {
            id: premium.policy_key,
            type: this.inferPolicyType(premium.insurer_name),
            provider: premium.insurer_name,
            policyNumber: premium.policy_number || 'N/A',
            coverageAmount: 0, // Not available in current schema
            premium: premium.amount || 0,
            expirationDate: premium.due_date ? new Date(premium.due_date) : new Date(),
            status: this.mapPaymentStatusToPolicyStatus(premium.payment_status)
          })
        }
      })

      let policies = Array.from(policyMap.values())

      // Apply standardized formatting and highlighting for family member view
      const formattedPolicies: FormattedPolicySummary[] = policies.map(policy => 
        familyPolicyFormatter.formatPolicySummary(policy)
      )

      // Sort by priority (critical issues first) and return as PolicySummary[]
      const sortedPolicies = PolicyFormattingUtils.sortByPriority(formattedPolicies)

      // Log policy access for audit trail
      await this.logPolicyAccess(familyMemberId, 'bulk_view', sortedPolicies.length)

      return sortedPolicies
    } catch (error) {
      console.error('Error fetching shared policies:', error)
      throw error
    }
  }

  /**
   * Get detailed view of specific policy (if permitted)
   * Requirements: 3.1, 7.3
   */
  async getPolicyDetails(familyMemberId: string, policyId: string): Promise<PolicyDetails> {
    try {
      // Check if family member can access this policy
      const canAccess = await permissionService.canAccessPolicy(familyMemberId, policyId)
      if (!canAccess) {
        throw new Error('Access denied: Family member cannot access this policy')
      }

      // Get family member info for vault owner ID
      const { data: familyMember, error: memberError } = await this.supabase
        .from('family_members')
        .select('vault_owner_id')
        .eq('id', familyMemberId)
        .eq('status', 'active')
        .single()

      if (memberError || !familyMember) {
        throw new Error('Family member not found or inactive')
      }

      // Get the most recent premium record for this policy
      const { data: premium, error: premiumError } = await this.supabase
        .from('insurance_premiums')
        .select('*')
        .eq('user_id', familyMember.vault_owner_id)
        .eq('policy_key', policyId)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (premiumError || !premium) {
        throw new Error('Policy not found or access denied')
      }

      // Create detailed policy view (excluding sensitive information)
      const policyDetails: PolicyDetails = {
        id: premium.policy_key,
        type: this.inferPolicyType(premium.insurer_name),
        provider: premium.insurer_name,
        policyNumber: premium.policy_number || 'N/A',
        coverageAmount: 0, // Not available in current schema
        deductible: 0, // Not available in current schema
        premium: premium.amount || 0,
        expirationDate: premium.due_date ? new Date(premium.due_date) : new Date(),
        status: this.mapPaymentStatusToPolicyStatus(premium.payment_status),
        keyBenefits: this.generateKeyBenefits(premium.insurer_name, this.inferPolicyType(premium.insurer_name)),
        contactInfo: {
          email: premium.from_email || undefined,
          phone: undefined, // Not available in current schema
          address: undefined, // Not available in current schema
          website: this.getProviderWebsite(premium.insurer_name)
        }
      }

      // Apply standardized formatting for family member view
      const formattedDetails = familyPolicyFormatter.formatPolicyDetails(policyDetails)

      // Log policy access for audit trail
      await this.logPolicyAccess(familyMemberId, policyId, 'view_details')

      return formattedDetails
    } catch (error) {
      console.error('Error fetching policy details:', error)
      throw error
    }
  }

  /**
   * Search shared policies
   * Requirements: 7.3
   */
  async searchPolicies(familyMemberId: string, query: string): Promise<PolicySummary[]> {
    try {
      if (!query || query.trim().length === 0) {
        return this.getSharedPolicies(familyMemberId)
      }

      // Get accessible policy IDs for this family member
      const accessiblePolicyIds = await permissionService.getAccessiblePolicies(familyMemberId)
      
      if (accessiblePolicyIds.length === 0) {
        return []
      }

      // Get family member info for vault owner ID
      const { data: familyMember, error: memberError } = await this.supabase
        .from('family_members')
        .select('vault_owner_id')
        .eq('id', familyMemberId)
        .eq('status', 'active')
        .single()

      if (memberError || !familyMember) {
        throw new Error('Family member not found or inactive')
      }

      const searchTerm = `%${query.toLowerCase()}%`

      // Search in insurance_premiums with text matching
      const { data: premiums, error: premiumsError } = await this.supabase
        .from('insurance_premiums')
        .select(`
          id,
          policy_key,
          insurer_name,
          policy_number,
          amount,
          due_date,
          payment_status,
          created_at
        `)
        .eq('user_id', familyMember.vault_owner_id)
        .eq('archived', false)
        .in('policy_key', accessiblePolicyIds)
        .or(`insurer_name.ilike.${searchTerm},policy_number.ilike.${searchTerm},policy_key.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })

      if (premiumsError) {
        throw new Error(`Failed to search policies: ${premiumsError.message}`)
      }

      // Group premiums by policy_key and create policy summaries
      const policyMap = new Map<string, PolicySummary>()
      
      premiums?.forEach((premium: any) => {
        if (!policyMap.has(premium.policy_key)) {
          policyMap.set(premium.policy_key, {
            id: premium.policy_key,
            type: this.inferPolicyType(premium.insurer_name),
            provider: premium.insurer_name,
            policyNumber: premium.policy_number || 'N/A',
            coverageAmount: 0, // Not available in current schema
            premium: premium.amount || 0,
            expirationDate: premium.due_date ? new Date(premium.due_date) : new Date(),
            status: this.mapPaymentStatusToPolicyStatus(premium.payment_status)
          })
        }
      })

      let policies = Array.from(policyMap.values())

      // Apply standardized formatting and highlighting for family member view
      const formattedPolicies: FormattedPolicySummary[] = policies.map(policy => 
        familyPolicyFormatter.formatPolicySummary(policy)
      )

      // Sort by priority (critical issues first) and return as PolicySummary[]
      const sortedPolicies = PolicyFormattingUtils.sortByPriority(formattedPolicies)

      // Log search activity for audit trail
      await this.logPolicyAccess(familyMemberId, `search:${query}`, sortedPolicies.length)

      return sortedPolicies
    } catch (error) {
      console.error('Error searching policies:', error)
      throw error
    }
  }

  /**
   * Get policy document (if permitted)
   * Requirements: 3.1
   */
  async getPolicyDocument(familyMemberId: string, policyId: string): Promise<Document> {
    try {
      // Check if family member can access this policy
      const canAccess = await permissionService.canAccessPolicy(familyMemberId, policyId)
      if (!canAccess) {
        throw new Error('Access denied: Family member cannot access this policy')
      }

      // For now, return a placeholder document since the current system
      // doesn't store actual policy documents, only premium information
      const document: Document = {
        id: `${policyId}-summary`,
        name: `Policy Summary - ${policyId}`,
        type: 'application/pdf',
        url: `/api/family-sharing/policies/${policyId}/document`, // Future endpoint
        size: 0,
        uploadedAt: new Date()
      }

      // Log document access for audit trail
      await this.logPolicyAccess(familyMemberId, policyId, 'view_document')

      return document
    } catch (error) {
      console.error('Error fetching policy document:', error)
      throw error
    }
  }

  /**
   * Get policy summary data for quick reference
   * Requirements: 7.4
   */
  async getPolicySummaryData(familyMemberId: string, policyId: string) {
    const policyDetails = await this.getPolicyDetails(familyMemberId, policyId)
    return familyPolicyFormatter.generatePolicySummary(policyDetails)
  }

  /**
   * Get critical policies requiring attention
   * Requirements: 7.2
   */
  async getCriticalPolicies(familyMemberId: string): Promise<PolicySummary[]> {
    const allPolicies = await this.getSharedPolicies(familyMemberId)
    // Since getSharedPolicies already returns formatted policies, we can cast them
    return PolicyFormattingUtils.getCriticalPolicies(allPolicies as FormattedPolicySummary[])
  }

  /**
   * Log policy access for audit trail
   * Private helper method
   */
  private async logPolicyAccess(familyMemberId: string, policyIdOrAction: string, accessType: AccessType | number): Promise<void> {
    try {
      // Get family member info for vault owner ID
      const { data: familyMember, error: memberError } = await this.supabase
        .from('family_members')
        .select('vault_owner_id')
        .eq('id', familyMemberId)
        .single()

      if (memberError || !familyMember) {
        return // Don't fail the main operation
      }

      let activity: 'policy_accessed' = 'policy_accessed'
      let details: Record<string, any> = {
        accessed_at: new Date().toISOString()
      }

      if (typeof accessType === 'number') {
        // Bulk access logging
        details.access_type = 'bulk_view'
        details.policy_count = accessType
        details.action = policyIdOrAction
      } else {
        details.access_type = accessType
        details.policy_id = policyIdOrAction
      }

      await this.supabase
        .from('family_audit_entries')
        .insert({
          vault_owner_id: familyMember.vault_owner_id,
          family_member_id: familyMemberId,
          activity,
          details,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to log policy access:', error)
    }
  }

  /**
   * Infer policy type from insurer name
   * Private helper method
   */
  private inferPolicyType(insurerName: string): string {
    const name = insurerName.toLowerCase()
    
    if (name.includes('auto') || name.includes('car') || name.includes('vehicle')) {
      return 'Auto Insurance'
    }
    if (name.includes('home') || name.includes('property') || name.includes('house')) {
      return 'Home Insurance'
    }
    if (name.includes('health') || name.includes('medical')) {
      return 'Health Insurance'
    }
    if (name.includes('life')) {
      return 'Life Insurance'
    }
    if (name.includes('travel')) {
      return 'Travel Insurance'
    }
    
    return 'General Insurance'
  }

  /**
   * Map payment status to policy status
   * Private helper method
   */
  private mapPaymentStatusToPolicyStatus(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'PAID':
        return 'Active'
      case 'PENDING':
        return 'Payment Due'
      case 'OVERDUE':
        return 'Overdue'
      case 'CANCELLED':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  /**
   * Generate key benefits based on policy type
   * Private helper method
   */
  private generateKeyBenefits(insurerName: string, policyType: string): string[] {
    const benefits: string[] = []
    
    switch (policyType) {
      case 'Auto Insurance':
        benefits.push('Liability Coverage', 'Collision Coverage', 'Comprehensive Coverage')
        break
      case 'Home Insurance':
        benefits.push('Dwelling Coverage', 'Personal Property Coverage', 'Liability Protection')
        break
      case 'Health Insurance':
        benefits.push('Medical Coverage', 'Prescription Benefits', 'Preventive Care')
        break
      case 'Life Insurance':
        benefits.push('Death Benefit', 'Cash Value', 'Premium Protection')
        break
      default:
        benefits.push('Coverage Protection', 'Claims Support', 'Policy Benefits')
    }
    
    return benefits
  }

  /**
   * Get provider website URL
   * Private helper method
   */
  private getProviderWebsite(insurerName: string): string | undefined {
    // This could be enhanced with a mapping of insurer names to websites
    const name = insurerName.toLowerCase().replace(/\s+/g, '')
    return `https://www.${name}.com`
  }
}

// Export singleton instance
export const vaultService = new VaultServiceImpl()
