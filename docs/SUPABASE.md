# Supabase Integration

This project uses Supabase as the PostgreSQL database backend for storing user data, Gmail connections, and insurance premium information.

## Quick Start

### 1. Set Up Supabase Project

1. Create a free account at https://app.supabase.com
2. Create a new project
3. Get your API credentials from Project Settings > API

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

See [.env.example](./.env.example) for complete setup instructions.

### 3. Run Database Migrations

Navigate to SQL Editor in your Supabase dashboard and run these migrations in order:

1. `supabase/migrations/20260123_create_gmail_connections.sql`
2. `supabase/migrations/20260123_create_insurance_premiums.sql`

## Database Schema

### Tables

#### `gmail_connections`

Stores Gmail OAuth connection details for users.

| Column        | Type      | Description                        |
| ------------- | --------- | ---------------------------------- |
| id            | UUID      | Primary key                        |
| user_id       | UUID      | User identifier                    |
| provider      | TEXT      | OAuth provider (default: 'google') |
| email         | TEXT      | Gmail email address                |
| access_token  | TEXT      | OAuth access token                 |
| refresh_token | TEXT      | OAuth refresh token                |
| expiry_date   | TIMESTAMP | Token expiry date                  |
| created_at    | TIMESTAMP | Record creation time               |
| updated_at    | TIMESTAMP | Last update time                   |

**Indexes:**

- `user_id`
- `email`
- `user_id, provider` (unique)

#### `insurance_premiums`

Stores insurance premium information extracted from Gmail messages.

| Column           | Type      | Description                                    |
| ---------------- | --------- | ---------------------------------------------- |
| id               | UUID      | Primary key                                    |
| user_id          | UUID      | User identifier                                |
| gmail_message_id | TEXT      | Gmail message ID (unique)                      |
| gmail_thread_id  | TEXT      | Gmail thread ID                                |
| policy_key       | TEXT      | Policy identifier                              |
| insurer_name     | TEXT      | Insurance company name                         |
| amount           | NUMERIC   | Premium amount                                 |
| due_date         | DATE      | Payment due date                               |
| policy_number    | TEXT      | Policy number                                  |
| payment_status   | TEXT      | Status: UNKNOWN/PENDING/PAID/OVERDUE/CANCELLED |
| email_subject    | TEXT      | Email subject line                             |
| from_email       | TEXT      | Sender email address                           |
| received_at      | TIMESTAMP | Email received time                            |
| confidence_score | NUMERIC   | AI extraction confidence (0-1)                 |
| raw_preview_text | TEXT      | Email preview text                             |
| created_at       | TIMESTAMP | Record creation time                           |
| updated_at       | TIMESTAMP | Last update time                               |

**Indexes:**

- `user_id`
- `policy_key`
- `due_date`
- `payment_status`
- `gmail_message_id`
- Composite: `user_id + due_date`, `user_id + payment_status`, `user_id + policy_key`

## TypeScript Types

TypeScript types are auto-generated in `types/database.ts`:

```typescript
import { InsurancePremium, GmailConnection } from "@/types/database";
```

### Available Types

- `GmailConnection` - Full record type
- `GmailConnectionInsert` - For creating new records
- `GmailConnectionUpdate` - For updating records
- `InsurancePremium` - Full record type
- `InsurancePremiumInsert` - For creating new records
- `InsurancePremiumUpdate` - For updating records
- `PaymentStatus` - Enum type
- `Database` - Complete schema type

## Usage Examples

### Server-Side Client

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsurancePremium } from "@/types/database";

// In API route or server component
export async function GET() {
  const supabase = createSupabaseServerClient();

  // Query insurance premiums
  const { data, error } = await supabase
    .from("insurance_premiums")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching premiums:", error);
    return { error };
  }

  return { premiums: data as InsurancePremium[] };
}
```

### Insert Record

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsurancePremiumInsert } from "@/types/database";

const supabase = createSupabaseServerClient();

const newPremium: InsurancePremiumInsert = {
  user_id: "user-uuid",
  gmail_message_id: "msg-123",
  policy_key: "HEALTH-2024-001",
  insurer_name: "HDFC Ergo",
  amount: 15000,
  due_date: "2026-03-15",
  payment_status: "PENDING",
};

const { data, error } = await supabase.from("insurance_premiums").insert(newPremium).select().single();
```

### Update Record

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsurancePremiumUpdate } from "@/types/database";

const supabase = createSupabaseServerClient();

const updates: InsurancePremiumUpdate = {
  payment_status: "PAID",
  updated_at: new Date().toISOString(),
};

const { data, error } = await supabase.from("insurance_premiums").update(updates).eq("id", premiumId).select().single();
```

### Query with Filters

```typescript
// Get all pending premiums due in next 30 days
const { data } = await supabase
  .from("insurance_premiums")
  .select("*")
  .eq("user_id", userId)
  .eq("payment_status", "PENDING")
  .gte("due_date", new Date().toISOString())
  .lte("due_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
  .order("due_date", { ascending: true });
```

## Security

### Row Level Security (RLS)

⚠️ **Important:** After creating tables, you should enable RLS and create policies in Supabase dashboard:

```sql
-- Enable RLS on tables
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_premiums ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own data
CREATE POLICY "Users can view own connections"
  ON gmail_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own premiums"
  ON insurance_premiums
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Client Types

- **Service Role Client** (`createSupabaseServerClient`): Bypasses RLS, full database access - use only server-side
- **Anon Client** (`createSupabaseServerClientWithAnonKey`): Respects RLS policies - safer for user-scoped operations

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error**

   - Verify all required env vars are set in `.env.local`
   - Restart your Next.js dev server after adding variables

2. **"relation does not exist" error**

   - Run the SQL migrations in Supabase SQL Editor
   - Check Table Editor to verify tables were created

3. **Connection errors**

   - Verify your Supabase project URL is correct
   - Check if your IP is allowed in Supabase project settings

4. **Permission denied errors**
   - Check RLS policies are configured correctly
   - Verify you're using the correct client (service role vs anon)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
