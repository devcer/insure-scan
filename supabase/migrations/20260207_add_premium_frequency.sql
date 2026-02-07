-- Add premium_frequency column to insurance_premiums table
ALTER TABLE insurance_premiums 
ADD COLUMN IF NOT EXISTS premium_frequency TEXT DEFAULT 'annual' CHECK (premium_frequency IN ('monthly', 'quarterly', 'halfyearly', 'annual'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_insurance_premiums_frequency ON insurance_premiums(premium_frequency);

-- Update existing records to have 'annual' as default
UPDATE insurance_premiums 
SET premium_frequency = 'annual' 
WHERE premium_frequency IS NULL;
