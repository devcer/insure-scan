// Database Types for Family Vault Sharing
// Database entity types for Supabase integration

import {
  PermissionLevel,
  InvitationStatus,
  FamilyMemberStatus,
  AuditActivity,
  SecurityAlertType
} from './core'

// Database row types for Supabase tables

export interface InvitationRow {
  id: string
  vault_owner_id: string
  email: string
  permissions: PermissionLevel
  token: string
  status: InvitationStatus
  created_at: string
  expires_at: string
  accepted_at?: string
}

export interface InvitationInsert {
  id?: string
  vault_owner_id: string
  email: string
  permissions: PermissionLevel
  token: string
  status?: InvitationStatus
  created_at?: string
  expires_at: string
  accepted_at?: string
}

export interface InvitationUpdate {
  id?: string
  vault_owner_id?: string
  email?: string
  permissions?: PermissionLevel
  token?: string
  status?: InvitationStatus
  created_at?: string
  expires_at?: string
  accepted_at?: string
}

export interface FamilyMemberRow {
  id: string
  vault_owner_id: string
  email: string
  permissions: PermissionLevel
  specific_policy_ids?: string[]
  status: FamilyMemberStatus
  created_at: string
  last_access_at?: string
}

export interface FamilyMemberInsert {
  id?: string
  vault_owner_id: string
  email: string
  permissions: PermissionLevel
  specific_policy_ids?: string[]
  status?: FamilyMemberStatus
  created_at?: string
  last_access_at?: string
}

export interface FamilyMemberUpdate {
  id?: string
  vault_owner_id?: string
  email?: string
  permissions?: PermissionLevel
  specific_policy_ids?: string[]
  status?: FamilyMemberStatus
  created_at?: string
  last_access_at?: string
}

export interface AuditEntryRow {
  id: string
  vault_owner_id: string
  family_member_id?: string
  activity: AuditActivity
  details: Record<string, any>
  timestamp: string
  ip_address: string
  user_agent: string
}

export interface AuditEntryInsert {
  id?: string
  vault_owner_id: string
  family_member_id?: string
  activity: AuditActivity
  details: Record<string, any>
  timestamp?: string
  ip_address: string
  user_agent: string
}

export interface SecurityAlertRow {
  id: string
  vault_owner_id: string
  family_member_id: string
  alert_type: SecurityAlertType
  description: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  resolved: boolean
}

export interface SecurityAlertInsert {
  id?: string
  vault_owner_id: string
  family_member_id: string
  alert_type: SecurityAlertType
  description: string
  severity: 'low' | 'medium' | 'high'
  timestamp?: string
  resolved?: boolean
}

export interface SecurityAlertUpdate {
  id?: string
  vault_owner_id?: string
  family_member_id?: string
  alert_type?: SecurityAlertType
  description?: string
  severity?: 'low' | 'medium' | 'high'
  timestamp?: string
  resolved?: boolean
}
