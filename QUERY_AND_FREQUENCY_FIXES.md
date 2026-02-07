# Email Query and Premium Frequency Fixes

## Issues Fixed

### 1. Email Query Too Restrictive
**Problem**: The Gmail query was using `has:attachment` which excluded many premium emails that don't have attachments.

**Solution**: Updated the query in `app/queries.ts` to search for:
- Subject keywords: premium, renewal, payment due, policy renewal, invoice, receipt, etc.
- Body keywords: premium, renewal, payment, policy combined with due, reminder, invoice, receipt
- Excluded promotional and social categories
- Removed the attachment requirement

**Impact**: Will now fetch more relevant insurance emails including:
- Premium due reminders
- Payment receipts
- Policy renewal notices
- Invoices without attachments

### 2. Premium Frequency Detection
**Problem**: All premiums were showing as "annual premium" regardless of actual payment frequency.

**Solution**: 
1. Added premium frequency detection to the parser (`lib/parsers/insurance.ts`)
2. Created keyword patterns for: monthly, quarterly, half-yearly, and annual
3. Added `premium_frequency` field to database schema
4. Updated UI components to display the correct frequency

**Files Modified**:
- `lib/parsers/insurance.ts` - Added frequency detection logic
- `supabase/migrations/20260207_add_premium_frequency.sql` - Database migration
- `app/api/insurance/scan/route.ts` - Save frequency to database
- `types/database.types.ts` - Added field to TypeScript types
- `lib/components/PolicyCard.tsx` - Display frequency in UI
- `lib/components/PolicyForm.tsx` - Allow editing frequency
- `app/queries.ts` - Improved email query

## Database Migration

Run this migration to add the premium_frequency column:

```sql
ALTER TABLE insurance_premiums 
ADD COLUMN IF NOT EXISTS premium_frequency TEXT DEFAULT 'annual' 
CHECK (premium_frequency IN ('monthly', 'quarterly', 'halfyearly', 'annual'));

CREATE INDEX IF NOT EXISTS idx_insurance_premiums_frequency 
ON insurance_premiums(premium_frequency);

UPDATE insurance_premiums 
SET premium_frequency = 'annual' 
WHERE premium_frequency IS NULL;
```

## Testing

After deploying these changes:

1. **Test Email Fetching**:
   - Click "Scan Now" on the dashboard
   - Verify more emails are being fetched
   - Check console logs for parsing details

2. **Test Frequency Detection**:
   - Look at policy cards - they should show "monthly premium", "quarterly premium", etc.
   - Create a new policy and select different frequencies
   - Verify the frequency is saved and displayed correctly

3. **Verify Existing Data**:
   - Existing policies will default to "annual"
   - Re-scan emails to update with detected frequencies

## Keywords Used for Detection

**Monthly**: monthly, per month, /month, every month, monthly premium, monthly installment
**Quarterly**: quarterly, per quarter, /quarter, every quarter, 3 months
**Half-Yearly**: half yearly, semi-annual, 6 months, six months
**Annual**: annual, yearly, per year, /year, 12 months

The parser checks both email body and subject line for these keywords.
