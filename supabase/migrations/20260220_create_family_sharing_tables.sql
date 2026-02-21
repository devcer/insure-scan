-- Family Vault Sharing Database Schema
-- Creates tables for invitations, family members, audit entries, and security alerts

-- Create enum types for family sharing
CREATE TYPE permission_level AS ENUM ('view_all', 'view_specific');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE family_member_status AS ENUM ('active', 'suspended', 'revoked');
CREATE TYPE audit_activity AS ENUM (
  'invitation_sent',
  'invitation_accepted', 
  'invitation_revoked',
  'policy_accessed',
  'permissions_changed',
  'access_revoked',
  'suspicious_activity_detected'
);
CREATE TYPE access_type AS ENUM ('view_summary', 'view_details', 'view_document', 'search');
CREATE TYPE security_alert_type AS ENUM (
  'unusual_access_pattern',
  'multiple_failed_attempts',
  'access_from_new_location',
  'bulk_policy_access'
);
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high');

-- Family member invitations table
CREATE TABLE family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  permissions permission_level NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_expiration CHECK (expires_at > created_at),
  CONSTRAINT valid_acceptance CHECK (accepted_at IS NULL OR accepted_at >= created_at),
  CONSTRAINT unique_pending_invitation UNIQUE (vault_owner_id, email, status) 
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT valid_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Family members table (after invitation acceptance)
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  permissions permission_level NOT NULL,
  specific_policy_ids TEXT[], -- Array of policy IDs for 'view_specific' permissions
  status family_member_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_access_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_active_family_member UNIQUE (vault_owner_id, email, status)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT valid_specific_policies CHECK (
    (permissions = 'view_all' AND specific_policy_ids IS NULL) OR
    (permissions = 'view_specific' AND specific_policy_ids IS NOT NULL AND array_length(specific_policy_ids, 1) > 0)
  ),
  CONSTRAINT valid_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Audit trail table for family sharing activities
CREATE TABLE family_audit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  activity audit_activity NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Security alerts table for suspicious activities
CREATE TABLE family_security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  alert_type security_alert_type NOT NULL,
  description TEXT NOT NULL,
  severity alert_severity NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_family_invitations_vault_owner ON family_invitations(vault_owner_id);
CREATE INDEX idx_family_invitations_token ON family_invitations(token);
CREATE INDEX idx_family_invitations_status ON family_invitations(status);
CREATE INDEX idx_family_invitations_expires_at ON family_invitations(expires_at);

CREATE INDEX idx_family_members_vault_owner ON family_members(vault_owner_id);
CREATE INDEX idx_family_members_email ON family_members(email);
CREATE INDEX idx_family_members_status ON family_members(status);
CREATE INDEX idx_family_members_vault_owner_status ON family_members(vault_owner_id, status);

CREATE INDEX idx_family_audit_vault_owner ON family_audit_entries(vault_owner_id);
CREATE INDEX idx_family_audit_family_member ON family_audit_entries(family_member_id);
CREATE INDEX idx_family_audit_activity ON family_audit_entries(activity);
CREATE INDEX idx_family_audit_timestamp ON family_audit_entries(timestamp);
CREATE INDEX idx_family_audit_vault_owner_timestamp ON family_audit_entries(vault_owner_id, timestamp DESC);

CREATE INDEX idx_family_security_alerts_vault_owner ON family_security_alerts(vault_owner_id);
CREATE INDEX idx_family_security_alerts_family_member ON family_security_alerts(family_member_id);
CREATE INDEX idx_family_security_alerts_resolved ON family_security_alerts(resolved);
CREATE INDEX idx_family_security_alerts_timestamp ON family_security_alerts(timestamp);
CREATE INDEX idx_family_security_alerts_unresolved ON family_security_alerts(vault_owner_id, resolved) WHERE resolved = false;

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_audit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_security_alerts ENABLE ROW LEVEL SECURITY;

-- Family invitations policies
CREATE POLICY "Vault owners can manage their invitations" ON family_invitations
  FOR ALL USING (vault_owner_id = auth.uid());

CREATE POLICY "Users can view invitations sent to their email" ON family_invitations
  FOR SELECT USING (email = auth.email());

-- Family members policies  
CREATE POLICY "Vault owners can manage their family members" ON family_members
  FOR ALL USING (vault_owner_id = auth.uid());

CREATE POLICY "Family members can view their own record" ON family_members
  FOR SELECT USING (email = auth.email());

CREATE POLICY "Family members can update their access time" ON family_members
  FOR UPDATE USING (email = auth.email()) 
  WITH CHECK (email = auth.email());

-- Audit entries policies
CREATE POLICY "Vault owners can view their audit trail" ON family_audit_entries
  FOR SELECT USING (vault_owner_id = auth.uid());

CREATE POLICY "System can insert audit entries" ON family_audit_entries
  FOR INSERT WITH CHECK (true);

-- Security alerts policies
CREATE POLICY "Vault owners can manage their security alerts" ON family_security_alerts
  FOR ALL USING (vault_owner_id = auth.uid());

-- Functions for automatic cleanup and maintenance

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE family_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired invitations (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  DELETE FROM family_invitations 
  WHERE status = 'expired' 
    AND expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to update last access time for family members
CREATE OR REPLACE FUNCTION update_family_member_access(member_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE family_members 
  SET last_access_at = NOW()
  WHERE id = member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically expire invitations
CREATE OR REPLACE FUNCTION trigger_expire_invitations()
RETURNS trigger AS $$
BEGIN
  PERFORM expire_old_invitations();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs periodically (this would typically be handled by a cron job)
-- For now, we'll create a trigger that runs on INSERT to check for expired invitations
CREATE TRIGGER check_expired_invitations
  AFTER INSERT ON family_invitations
  EXECUTE FUNCTION trigger_expire_invitations();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
