// Service Interface Types for Family Vault Sharing
// Based on the design document service interfaces

import {
  Invitation,
  FamilyMember,
  PermissionLevel,
  PolicySummary,
  PolicyDetails,
  Document,
  AuditEntry,
  AuditFilters,
  SecurityAlert,
  AccessType,
  InvitationActivity
} from './core'

// Invitation Service Interface
export interface InvitationService {
  // Send invitation to family member
  sendInvitation(vaultOwnerId: string, email: string, permissions: PermissionLevel): Promise<Invitation>
  
  // Verify invitation token and activate family member access
  verifyInvitation(token: string): Promise<FamilyMember>
  
  // Resend invitation if not yet accepted
  resendInvitation(invitationId: string): Promise<void>
  
  // Revoke pending invitation
  revokeInvitation(invitationId: string): Promise<void>
  
  // Get all invitations for a vault owner
  getInvitations(vaultOwnerId: string): Promise<Invitation[]>
}

// Permission Service Interface
export interface PermissionService {
  // Set permissions for a family member
  setPermissions(familyMemberId: string, permissions: PermissionLevel): Promise<void>
  
  // Check if family member can access specific policy
  canAccessPolicy(familyMemberId: string, policyId: string): Promise<boolean>
  
  // Get all policies accessible to family member
  getAccessiblePolicies(familyMemberId: string): Promise<string[]>
  
  // Update specific policy permissions
  updatePolicyPermissions(familyMemberId: string, policyIds: string[]): Promise<void>
  
  // Remove all access for family member
  revokeAccess(familyMemberId: string): Promise<void>
  
  // Bulk update permissions for multiple family members
  bulkUpdatePermissions(updates: Array<{ familyMemberId: string; permissions: PermissionLevel; policyIds?: string[] }>): Promise<void>
}

// Vault Service Interface
export interface VaultService {
  // Get shared policies for family member (filtered by permissions)
  getSharedPolicies(familyMemberId: string): Promise<PolicySummary[]>
  
  // Get detailed view of specific policy (if permitted)
  getPolicyDetails(familyMemberId: string, policyId: string): Promise<PolicyDetails>
  
  // Search shared policies
  searchPolicies(familyMemberId: string, query: string): Promise<PolicySummary[]>
  
  // Get policy document (if permitted)
  getPolicyDocument(familyMemberId: string, policyId: string): Promise<Document>
}

// Audit Service Interface
export interface AuditService {
  // Log family member access to policy
  logPolicyAccess(familyMemberId: string, policyId: string, accessType: AccessType): Promise<void>
  
  // Log permission changes
  logPermissionChange(vaultOwnerId: string, familyMemberId: string, oldPermissions: PermissionLevel, newPermissions: PermissionLevel): Promise<void>
  
  // Log invitation activities
  logInvitationActivity(vaultOwnerId: string, email: string, activity: InvitationActivity): Promise<void>
  
  // Get audit trail for vault owner
  getAuditTrail(vaultOwnerId: string, filters?: AuditFilters): Promise<AuditEntry[]>
  
  // Detect suspicious access patterns
  detectSuspiciousActivity(vaultOwnerId: string): Promise<SecurityAlert[]>
}
