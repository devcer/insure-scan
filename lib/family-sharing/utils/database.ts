// Database utility functions for family sharing
// Helpers for converting between database types and application types

import { 
  InvitationRow, 
  FamilyMemberRow, 
  AuditEntryRow, 
  SecurityAlertRow 
} from '../types/database'
import { 
  Invitation, 
  FamilyMember, 
  AuditEntry, 
  SecurityAlert 
} from '../types/core'

// Convert database row to application type
export function mapInvitationFromDb(row: InvitationRow): Invitation {
  return {
    id: row.id,
    vaultOwnerId: row.vault_owner_id,
    email: row.email,
    permissions: row.permissions,
    token: row.token,
    status: row.status,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
  }
}

// Convert database row to application type
export function mapFamilyMemberFromDb(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    vaultOwnerId: row.vault_owner_id,
    email: row.email,
    permissions: row.permissions,
    specificPolicyIds: row.specific_policy_ids || undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
    lastAccessAt: row.last_access_at ? new Date(row.last_access_at) : undefined,
  }
}

// Convert database row to application type
export function mapAuditEntryFromDb(row: AuditEntryRow): AuditEntry {
  return {
    id: row.id,
    vaultOwnerId: row.vault_owner_id,
    familyMemberId: row.family_member_id || undefined,
    activity: row.activity,
    details: row.details,
    timestamp: new Date(row.timestamp),
    ipAddress: row.ip_address || '',
    userAgent: row.user_agent || '',
  }
}

// Convert database row to application type
export function mapSecurityAlertFromDb(row: SecurityAlertRow): SecurityAlert {
  return {
    id: row.id,
    vaultOwnerId: row.vault_owner_id,
    familyMemberId: row.family_member_id,
    alertType: row.alert_type,
    description: row.description,
    severity: row.severity,
    timestamp: new Date(row.timestamp),
    resolved: row.resolved,
  }
}
