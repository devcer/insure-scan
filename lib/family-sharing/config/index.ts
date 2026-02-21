// Configuration for Family Vault Sharing
// Constants and configuration values

export const FAMILY_SHARING_CONFIG = {
  // Invitation settings
  INVITATION_EXPIRY_HOURS: 48,
  MAX_INVITATIONS_PER_VAULT: 10,
  
  // Token settings
  TOKEN_LENGTH: 32,
  
  // Security settings
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT_MINUTES: 60,
  
  // Audit settings
  AUDIT_RETENTION_DAYS: 2555, // 7 years
  
  // Property-based testing settings
  PBT_ITERATIONS: 100,
  
  // Email settings
  INVITATION_EMAIL_TEMPLATE: 'family-invitation',
  NOTIFICATION_EMAIL_TEMPLATE: 'family-notification',
} as const

export const ERROR_MESSAGES = {
  INVITATION_NOT_FOUND: 'Invitation not found',
  INVITATION_EXPIRED: 'Invitation has expired',
  INVITATION_ALREADY_ACCEPTED: 'Invitation has already been accepted',
  INVALID_TOKEN: 'Invalid invitation token',
  UNAUTHORIZED_ACCESS: 'Unauthorized access to policy',
  FAMILY_MEMBER_NOT_FOUND: 'Family member not found',
  PERMISSION_DENIED: 'Permission denied',
  INVALID_PERMISSION_LEVEL: 'Invalid permission level',
  MAX_INVITATIONS_EXCEEDED: 'Maximum number of invitations exceeded',
} as const

// Export initialization functions
export * from './initialization'
