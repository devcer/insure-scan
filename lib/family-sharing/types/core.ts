// Core Types for Family Vault Sharing
// Based on the design document data models

// Permission levels for family members
export type PermissionLevel = 'view_all' | 'view_specific'

// Invitation status tracking
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

// Family member status
export type FamilyMemberStatus = 'active' | 'suspended' | 'revoked'

// Types of auditable activities
export type AuditActivity = 
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'invitation_revoked'
  | 'policy_accessed'
  | 'permissions_changed'
  | 'access_revoked'
  | 'suspicious_activity_detected'

// Security alert types
export type SecurityAlertType = 
  | 'unusual_access_pattern'
  | 'multiple_failed_attempts'
  | 'access_from_new_location'
  | 'bulk_policy_access'

// Access types for audit logging
export type AccessType = 'view_summary' | 'view_details' | 'view_document' | 'search'

// Invitation activities for audit logging
export type InvitationActivity = 'sent' | 'resent' | 'accepted' | 'expired' | 'revoked'

// Invitation entity for managing family member invitations
export interface Invitation {
  id: string
  vaultOwnerId: string
  email: string
  permissions: PermissionLevel
  token: string
  status: InvitationStatus
  createdAt: Date
  expiresAt: Date
  acceptedAt?: Date
}

// Family member entity after invitation acceptance
export interface FamilyMember {
  id: string
  vaultOwnerId: string
  email: string
  permissions: PermissionLevel
  specificPolicyIds?: string[]  // Only set when permissions = 'specific'
  status: FamilyMemberStatus
  createdAt: Date
  lastAccessAt?: Date
}

// Simplified policy summary for family member view
export interface PolicySummary {
  id: string
  type: string
  provider: string
  policyNumber: string
  coverageAmount: number
  premium: number
  expirationDate: Date
  status: string
}

// Contact information for policies
export interface ContactInfo {
  phone?: string
  email?: string
  address?: string
  website?: string
}

// Detailed policy information (filtered for family members)
export interface PolicyDetails {
  id: string
  type: string
  provider: string
  policyNumber: string
  coverageAmount: number
  deductible: number
  premium: number
  expirationDate: Date
  status: string
  keyBenefits: string[]
  contactInfo: ContactInfo
  // Sensitive fields like SSN, account numbers are excluded
}

// Document reference for policy documents
export interface Document {
  id: string
  name: string
  type: string
  url: string
  size: number
  uploadedAt: Date
}

// Audit trail entry
export interface AuditEntry {
  id: string
  vaultOwnerId: string
  familyMemberId?: string
  activity: AuditActivity
  details: Record<string, any>
  timestamp: Date
  ipAddress: string
  userAgent: string
}

// Security alert for suspicious activities
export interface SecurityAlert {
  id: string
  vaultOwnerId: string
  familyMemberId: string
  alertType: SecurityAlertType
  description: string
  severity: 'low' | 'medium' | 'high'
  timestamp: Date
  resolved: boolean
}

// Audit filters for querying audit trail
export interface AuditFilters {
  familyMemberId?: string
  activity?: AuditActivity
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}
