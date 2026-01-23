-- Migration: Create insurance_premiums table
-- Description: Stores insurance premium information extracted from Gmail messages
-- Created: 2026-01-23

-- Create insurance_premiums table
CREATE TABLE IF NOT EXISTS insurance_premiums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    gmail_message_id TEXT UNIQUE NOT NULL,
    gmail_thread_id TEXT,
    policy_key TEXT NOT NULL,
    insurer_name TEXT NOT NULL,
    amount NUMERIC,
    due_date DATE,
    policy_number TEXT,
    payment_status TEXT NOT NULL DEFAULT 'UNKNOWN',
    email_subject TEXT,
    from_email TEXT,
    received_at TIMESTAMP,
    confidence_score NUMERIC DEFAULT 0,
    raw_preview_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for insurance_premiums
CREATE INDEX IF NOT EXISTS idx_insurance_premiums_user_id 
    ON insurance_premiums(user_id);

CREATE INDEX IF NOT EXISTS idx_insurance_premiums_policy_key 
    ON insurance_premiums(policy_key);

CREATE INDEX IF NOT EXISTS idx_insurance_premiums_due_date 
    ON insurance_premiums(due_date);

CREATE INDEX IF NOT EXISTS idx_insurance_premiums_payment_status 
    ON insurance_premiums(payment_status);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_insurance_premiums_user_due_date 
    ON insurance_premiums(user_id, due_date DESC);

CREATE INDEX IF NOT EXISTS idx_insurance_premiums_user_status 
    ON insurance_premiums(user_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_insurance_premiums_user_policy 
    ON insurance_premiums(user_id, policy_key);

-- Index for Gmail message lookups
CREATE INDEX IF NOT EXISTS idx_insurance_premiums_gmail_message_id 
    ON insurance_premiums(gmail_message_id);

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_insurance_premiums_updated_at ON insurance_premiums;
CREATE TRIGGER update_insurance_premiums_updated_at
    BEFORE UPDATE ON insurance_premiums
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for payment_status enum-like values
ALTER TABLE insurance_premiums
    ADD CONSTRAINT check_payment_status 
    CHECK (payment_status IN ('UNKNOWN', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'));

-- Add constraint for confidence_score range
ALTER TABLE insurance_premiums
    ADD CONSTRAINT check_confidence_score 
    CHECK (confidence_score >= 0 AND confidence_score <= 1);

-- Add comment to table
COMMENT ON TABLE insurance_premiums IS 'Stores insurance premium information extracted from Gmail messages';
COMMENT ON COLUMN insurance_premiums.id IS 'Primary key';
COMMENT ON COLUMN insurance_premiums.user_id IS 'Reference to the user who owns this premium record';
COMMENT ON COLUMN insurance_premiums.gmail_message_id IS 'Unique Gmail message ID';
COMMENT ON COLUMN insurance_premiums.gmail_thread_id IS 'Gmail thread ID for grouping related messages';
COMMENT ON COLUMN insurance_premiums.policy_key IS 'Unique identifier for the insurance policy';
COMMENT ON COLUMN insurance_premiums.insurer_name IS 'Name of the insurance company';
COMMENT ON COLUMN insurance_premiums.amount IS 'Premium amount in currency units';
COMMENT ON COLUMN insurance_premiums.due_date IS 'Premium payment due date';
COMMENT ON COLUMN insurance_premiums.policy_number IS 'Insurance policy number';
COMMENT ON COLUMN insurance_premiums.payment_status IS 'Payment status: UNKNOWN, PENDING, PAID, OVERDUE, CANCELLED';
COMMENT ON COLUMN insurance_premiums.email_subject IS 'Subject line of the source email';
COMMENT ON COLUMN insurance_premiums.from_email IS 'Email address of the sender';
COMMENT ON COLUMN insurance_premiums.received_at IS 'Timestamp when the email was received';
COMMENT ON COLUMN insurance_premiums.confidence_score IS 'AI extraction confidence score (0-1)';
COMMENT ON COLUMN insurance_premiums.raw_preview_text IS 'Raw email preview text for reference';
COMMENT ON COLUMN insurance_premiums.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN insurance_premiums.updated_at IS 'Record last update timestamp';
