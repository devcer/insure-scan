# Manual Database Update Instructions

Since the Supabase CLI is not linked, please run this SQL manually in your Supabase SQL Editor:

## Steps:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Create a new query
5. Copy and paste the SQL below
6. Click "Run" to execute

## SQL to Execute:

```sql
-- Add archived column to insurance_premiums table for soft delete functionality
ALTER TABLE insurance_premiums
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for better query performance on archived status
CREATE INDEX IF NOT EXISTS idx_insurance_premiums_archived ON insurance_premiums(archived);

-- Create composite index for user_id and archived for efficient filtering
CREATE INDEX IF NOT EXISTS idx_insurance_premiums_user_archived ON insurance_premiums(user_id, archived);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'insurance_premiums' AND column_name = 'archived';
```

## Expected Output:

You should see:

- column_name: archived
- data_type: boolean
- is_nullable: NO
- column_default: false

Once this is done, the add/edit/archive/unarchive functionality will work properly!
