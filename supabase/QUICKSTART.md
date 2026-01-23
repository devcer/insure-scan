# Supabase Quick Reference

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies (already done)
npm install @supabase/supabase-js

# 2. Set up environment variables in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 3. Run migrations in Supabase SQL Editor
# Copy and paste contents of migration files

# 4. Start using in your code!
```

## 📊 Database Tables

### `gmail_connections`

```typescript
{
  id: string; // UUID
  user_id: string; // User identifier
  provider: string; // "google"
  email: string; // Gmail address
  access_token: string; // OAuth token
  refresh_token: string; // Refresh token
  expiry_date: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

### `insurance_premiums`

```typescript
{
  id: string; // UUID
  user_id: string; // User identifier
  gmail_message_id: string; // Gmail message ID
  gmail_thread_id: string; // Gmail thread ID
  policy_key: string; // Policy identifier
  insurer_name: string; // Insurance company
  amount: number; // Premium amount
  due_date: string; // YYYY-MM-DD
  policy_number: string; // Policy number
  payment_status: string; // UNKNOWN/PENDING/PAID/OVERDUE/CANCELLED
  email_subject: string; // Email subject
  from_email: string; // Sender email
  received_at: string; // ISO timestamp
  confidence_score: number; // 0-1 range
  raw_preview_text: string; // Email preview
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

## 💻 Common Operations

### Initialize Client

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
const supabase = createSupabaseServerClient();
```

### Insert Record

```typescript
const { data, error } = await supabase
  .from("insurance_premiums")
  .insert({
    user_id: "user-123",
    gmail_message_id: "msg-456",
    policy_key: "HEALTH-2024-001",
    insurer_name: "HDFC Ergo",
    amount: 15000,
    payment_status: "PENDING",
  })
  .select()
  .single();
```

### Query Records

```typescript
const { data, error } = await supabase.from("insurance_premiums").select("*").eq("user_id", userId).order("due_date", { ascending: true });
```

### Update Record

```typescript
const { data, error } = await supabase.from("insurance_premiums").update({ payment_status: "PAID" }).eq("id", premiumId).select().single();
```

### Delete Record

```typescript
const { error } = await supabase.from("insurance_premiums").delete().eq("id", premiumId);
```

### Complex Filters

```typescript
// Get pending premiums due in next 30 days
const { data } = await supabase
  .from("insurance_premiums")
  .select("*")
  .eq("payment_status", "PENDING")
  .gte("due_date", today)
  .lte("due_date", thirtyDaysFromNow);

// Search by insurer name (case-insensitive)
const { data } = await supabase.from("insurance_premiums").select("*").ilike("insurer_name", "%hdfc%");

// Get multiple specific policies
const { data } = await supabase.from("insurance_premiums").select("*").in("policy_key", ["HEALTH-001", "AUTO-002"]);
```

## 🎯 TypeScript Types

```typescript
import type { GmailConnection, GmailConnectionInsert, InsurancePremium, InsurancePremiumInsert, PaymentStatus } from "@/types/database";

// Use for function parameters
function updatePremium(data: InsurancePremiumInsert) {}

// Use for function return types
async function getPremium(id: string): Promise<InsurancePremium | null> {}

// Use for state
const [premiums, setPremiums] = useState<InsurancePremium[]>([]);
```

## 🔍 Common Queries

### Dashboard Stats

```typescript
const { data } = await supabase.from("insurance_premiums").select("payment_status, amount").eq("user_id", userId);

const stats = {
  total: data.length,
  pending: data.filter((p) => p.payment_status === "PENDING").length,
  totalAmount: data.reduce((sum, p) => sum + (p.amount || 0), 0),
};
```

### Upcoming Renewals

```typescript
const { data } = await supabase
  .from("insurance_premiums")
  .select("*")
  .eq("user_id", userId)
  .eq("payment_status", "PENDING")
  .gte("due_date", new Date().toISOString())
  .lte("due_date", thirtyDaysFromNow)
  .order("due_date", { ascending: true })
  .limit(5);
```

### Recent Activity

```typescript
const { data } = await supabase
  .from("insurance_premiums")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(10);
```

## 🛡️ Row Level Security

```sql
-- Enable RLS
ALTER TABLE insurance_premiums ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "users_read_own_premiums"
  ON insurance_premiums
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "users_insert_own_premiums"
  ON insurance_premiums
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own data
CREATE POLICY "users_update_own_premiums"
  ON insurance_premiums
  FOR UPDATE
  USING (auth.uid() = user_id);
```

## 🔧 Troubleshooting

### Module not found error

- Restart TypeScript server: `Cmd+Shift+P` → "Restart TypeScript Server"
- Restart dev server: Stop and run `npm run dev` again

### Connection error

- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify API keys are valid in Supabase dashboard

### Permission denied

- Enable RLS on tables
- Create appropriate policies
- Use service role key for admin operations

### Type errors

- Ensure `types/database.ts` exists
- Check `tsconfig.json` has `"@/*": ["./*"]` in paths
- Restart IDE/TypeScript server

## 📚 Resources

- [Complete Documentation](../docs/SUPABASE.md)
- [Migration Files](./migrations/)
- [Usage Examples](../lib/supabase/examples.ts)
- [Supabase Docs](https://supabase.com/docs)
