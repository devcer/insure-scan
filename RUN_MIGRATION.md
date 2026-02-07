# How to Run the Premium Frequency Migration

## Quick Method: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy the Migration SQL**
   - Open `supabase/migrations/20260207_add_premium_frequency.sql`
   - Copy all the SQL code:
   ```sql
   -- Add premium_frequency column to insurance_premiums table
   ALTER TABLE insurance_premiums 
   ADD COLUMN IF NOT EXISTS premium_frequency TEXT DEFAULT 'annual' CHECK (premium_frequency IN ('monthly', 'quarterly', 'halfyearly', 'annual'));

   -- Add index for better query performance
   CREATE INDEX IF NOT EXISTS idx_insurance_premiums_frequency ON insurance_premiums(premium_frequency);

   -- Update existing records to have 'annual' as default
   UPDATE insurance_premiums 
   SET premium_frequency = 'annual' 
   WHERE premium_frequency IS NULL;
   ```

4. **Run the Migration**
   - Paste the SQL into the editor
   - Click "Run" or press `Cmd+Enter`
   - You should see "Success. No rows returned"

5. **Verify the Migration**
   - Click "Table Editor" in the left sidebar
   - Select "insurance_premiums" table
   - You should see the new "premium_frequency" column

## Alternative: Install Supabase CLI

If you want to use the CLI for future migrations:

### Install via Homebrew (macOS)
```bash
brew install supabase/tap/supabase
```

### Or via npm
```bash
npm install -g supabase
```

### Link to your project
```bash
cd supabase
supabase link --project-ref your-project-ref
```

### Run migrations
```bash
supabase db push
```

## After Running the Migration

1. **Restart your development server**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Test the changes**
   - Go to your dashboard at http://localhost:3000/dashboard
   - Click "Scan Now" to re-scan emails
   - Check if policies now show correct frequencies (monthly, quarterly, etc.)

3. **Verify in database**
   - Go to Supabase Dashboard → Table Editor → insurance_premiums
   - Check that the premium_frequency column exists
   - Existing records should have 'annual' as default
   - New scanned emails should have detected frequencies

## Troubleshooting

### Error: column already exists
This is fine - it means the migration was already run. The `IF NOT EXISTS` clause prevents errors.

### Error: permission denied
Make sure you're logged into the correct Supabase project with appropriate permissions.

### No data showing up
After running the migration, you need to re-scan emails for the frequency detection to work on new data.

## What This Migration Does

1. **Adds new column**: `premium_frequency` with values: monthly, quarterly, halfyearly, annual
2. **Sets default**: All existing records get 'annual' as default
3. **Adds constraint**: Only allows valid frequency values
4. **Creates index**: Improves query performance when filtering by frequency
5. **Updates existing data**: Sets all NULL values to 'annual'
