-- Add archived column to insurance_premiums table for soft delete functionality
ALTER TABLE insurance_premiums
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for better query performance on archived status
CREATE INDEX IF NOT EXISTS idx_insurance_premiums_archived ON insurance_premiums(archived);

-- Create composite index for user_id and archived for efficient filtering
CREATE INDEX IF NOT EXISTS idx_insurance_premiums_user_archived ON insurance_premiums(user_id, archived);
