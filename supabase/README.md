# Supabase Integration - Implementation Summary

## ✅ What Was Implemented

### 1. **Supabase Client Library**

- Installed `@supabase/supabase-js` package
- Created server-side client utilities in [lib/supabase/server.ts](../lib/supabase/server.ts)
  - `createSupabaseServerClient()` - Service role client (bypasses RLS)
  - `createSupabaseServerClientWithAnonKey()` - Anon client (respects RLS)

### 2. **Database Schema & Migrations**

#### Gmail Connections Table

**File:** [supabase/migrations/20260123_create_gmail_connections.sql](../supabase/migrations/20260123_create_gmail_connections.sql)

```sql
gmail_connections
├── id (UUID, PK)
├── user_id (UUID, NOT NULL)
├── provider (TEXT, default: 'google')
├── email (TEXT, NOT NULL)
├── access_token (TEXT)
├── refresh_token (TEXT)
├── expiry_date (TIMESTAMP)
├── created_at (TIMESTAMP, default: now())
└── updated_at (TIMESTAMP, default: now())
```

**Features:**

- Indexes on `user_id`, `email`
- Unique constraint on `user_id + provider`
- Auto-update trigger for `updated_at`
- Comprehensive column comments

#### Insurance Premiums Table

**File:** [supabase/migrations/20260123_create_insurance_premiums.sql](../supabase/migrations/20260123_create_insurance_premiums.sql)

```sql
insurance_premiums
├── id (UUID, PK)
├── user_id (UUID, NOT NULL)
├── gmail_message_id (TEXT, UNIQUE, NOT NULL)
├── gmail_thread_id (TEXT)
├── policy_key (TEXT, NOT NULL)
├── insurer_name (TEXT, NOT NULL)
├── amount (NUMERIC)
├── due_date (DATE)
├── policy_number (TEXT)
├── payment_status (TEXT, default: 'UNKNOWN')
├── email_subject (TEXT)
├── from_email (TEXT)
├── received_at (TIMESTAMP)
├── confidence_score (NUMERIC, default: 0)
├── raw_preview_text (TEXT)
├── created_at (TIMESTAMP, default: now())
└── updated_at (TIMESTAMP, default: now())
```

**Features:**

- Indexes on `user_id`, `policy_key`, `due_date`, `payment_status`, `gmail_message_id`
- Composite indexes for common query patterns
- Payment status constraint (UNKNOWN/PENDING/PAID/OVERDUE/CANCELLED)
- Confidence score constraint (0-1 range)
- Auto-update trigger for `updated_at`
- Comprehensive column comments

### 3. **TypeScript Types**

**File:** [types/database.ts](../types/database.ts)

Generated complete TypeScript type definitions:

```typescript
// Record Types
GmailConnection;
InsurancePremium;

// Insert Types (for creating new records)
GmailConnectionInsert;
InsurancePremiumInsert;

// Update Types (for updating existing records)
GmailConnectionUpdate;
InsurancePremiumUpdate;

// Enum Types
PaymentStatus = "UNKNOWN" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

// Complete Schema Type
Database;
```

### 4. **Documentation**

Created comprehensive documentation:

- [docs/SUPABASE.md](../docs/SUPABASE.md) - Complete setup guide, schema docs, usage examples
- [.env.example](../.env.example) - Environment variables with setup instructions
- [lib/supabase/examples.ts](../lib/supabase/examples.ts) - Working code examples

### 5. **Example Functions**

**File:** [lib/supabase/examples.ts](../lib/supabase/examples.ts)

Provided 8 ready-to-use example functions:

1. `storeGmailConnection()` - Store OAuth tokens
2. `getGmailConnection()` - Retrieve user's Gmail connection
3. `createInsurancePremium()` - Create new premium record
4. `getUserPremiums()` - Get all user premiums
5. `getUpcomingPremiums()` - Get premiums due in next 30 days
6. `updatePremiumStatus()` - Update payment status
7. `getPremiumStats()` - Get premium statistics (total, pending, paid, etc.)
8. `searchPremiumsByInsurer()` - Search by insurer name

## 📋 Next Steps for Setup

### 1. Create Supabase Project

```bash
# Visit https://app.supabase.com and create a new project
```

### 2. Add Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Migrations

In Supabase SQL Editor, run:

1. `supabase/migrations/20260123_create_gmail_connections.sql`
2. `supabase/migrations/20260123_create_insurance_premiums.sql`

### 4. Enable Row Level Security (Recommended)

```sql
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_premiums ENABLE ROW LEVEL SECURITY;

-- Create policies to restrict access to user's own data
CREATE POLICY "Users can view own connections"
  ON gmail_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own premiums"
  ON insurance_premiums FOR SELECT
  USING (auth.uid() = user_id);
```

## 🔧 Usage Example

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsurancePremium } from "@/types/database";

// In API route or server component
export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();

  const { data: premiums, error } = await supabase
    .from("insurance_premiums")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ premiums: premiums as InsurancePremium[] });
}
```

## 📁 File Structure

```
insurance-scanner/
├── lib/
│   └── supabase/
│       ├── server.ts          # Supabase client utilities
│       └── examples.ts        # Usage examples
├── types/
│   └── database.ts            # TypeScript types
├── supabase/
│   └── migrations/
│       ├── 20260123_create_gmail_connections.sql
│       └── 20260123_create_insurance_premiums.sql
├── docs/
│   └── SUPABASE.md            # Complete documentation
└── .env.example               # Environment variables template
```

## 🔐 Security Notes

- ⚠️ **Service Role Key** bypasses RLS - use only in trusted server-side code
- ✅ **Anon Key** respects RLS - safe for user-scoped operations
- 🔒 Implement RLS policies before deploying to production
- 📝 Never commit `.env.local` to version control

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Complete Setup Guide](../docs/SUPABASE.md)
