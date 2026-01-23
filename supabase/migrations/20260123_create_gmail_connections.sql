-- Migration: Create gmail_connections table
-- Description: Stores Gmail OAuth connection details for users
-- Created: 2026-01-23

-- Create gmail_connections table
CREATE TABLE IF NOT EXISTS gmail_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider TEXT DEFAULT 'google',
    email TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for gmail_connections
CREATE INDEX IF NOT EXISTS idx_gmail_connections_user_id 
    ON gmail_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_gmail_connections_email 
    ON gmail_connections(email);

-- Add unique constraint to prevent duplicate connections per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_gmail_connections_user_provider 
    ON gmail_connections(user_id, provider);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_gmail_connections_updated_at ON gmail_connections;
CREATE TRIGGER update_gmail_connections_updated_at
    BEFORE UPDATE ON gmail_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE gmail_connections IS 'Stores Gmail OAuth connection details for users';
COMMENT ON COLUMN gmail_connections.id IS 'Primary key';
COMMENT ON COLUMN gmail_connections.user_id IS 'Reference to the user who owns this connection';
COMMENT ON COLUMN gmail_connections.provider IS 'OAuth provider name (default: google)';
COMMENT ON COLUMN gmail_connections.email IS 'Email address associated with the Gmail account';
COMMENT ON COLUMN gmail_connections.access_token IS 'OAuth access token for Gmail API';
COMMENT ON COLUMN gmail_connections.refresh_token IS 'OAuth refresh token for Gmail API';
COMMENT ON COLUMN gmail_connections.expiry_date IS 'Token expiry timestamp';
COMMENT ON COLUMN gmail_connections.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN gmail_connections.updated_at IS 'Record last update timestamp';
