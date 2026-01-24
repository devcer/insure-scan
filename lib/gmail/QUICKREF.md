# Gmail Utilities - Quick Reference

## 🎯 Core Functions

### List Emails

```typescript
import { listInsuranceEmails } from "@/lib/gmail/gmailClient";
import { INSURANCE_QUERY } from "@/lib/gmail/gmailQuery";

const result = await listInsuranceEmails({
  accessToken: session.accessToken,
  query: INSURANCE_QUERY,
  maxResults: 100,
});
```

### Get Single Email

```typescript
import { getEmailMessage } from "@/lib/gmail/gmailClient";

const result = await getEmailMessage({
  accessToken: session.accessToken,
  messageId: "abc123",
  format: "full", // or 'metadata', 'minimal', 'raw'
});
```

### Batch Get Emails

```typescript
import { batchGetEmailMessages } from "@/lib/gmail/gmailClient";

const messages = await batchGetEmailMessages(accessToken, ["id1", "id2", "id3"], "metadata");
```

### Check for Errors

```typescript
import { isGmailApiError } from "@/lib/gmail/gmailClient";

if (isGmailApiError(result)) {
  console.error("Error:", result.error);
} else {
  console.log("Success:", result.messages);
}
```

## 📦 Response Types

### List Response

```typescript
{
  messages: [{ id: string, threadId: string }],
  nextPageToken: string | undefined,
  resultSizeEstimate: number
}
```

### Message Response

```typescript
{
  message: {
    id: string,
    threadId: string,
    snippet: string,
    payload: {
      headers: [{ name: string, value: string }],
      body: { data: string },
      parts: []
    }
  }
}
```

### Error Response

```typescript
{
  error: string,
  details: unknown
}
```

## 🔧 Common Patterns

### Extract Headers

```typescript
const headers = message.payload?.headers || [];
const getHeader = (name: string) => headers.find((h) => h.name === name)?.value || "";

const subject = getHeader("Subject");
const from = getHeader("From");
const date = getHeader("Date");
```

### Pagination

```typescript
let pageToken: string | undefined;
do {
  const result = await listInsuranceEmails({
    accessToken,
    query: INSURANCE_QUERY,
    pageToken,
  });
  pageToken = result.nextPageToken;
} while (pageToken);
```

### API Route

```typescript
export async function GET() {
  const session = await auth();
  const result = await listInsuranceEmails({
    accessToken: session.accessToken,
    query: INSURANCE_QUERY,
  });

  return Response.json(result);
}
```

## 🚦 Rate Limits

- **Queries**: 250 quota units/query
- **Get Message**: 5 quota units/message
- **Daily Quota**: 1 billion units/day (default)
- **Per-second Limit**: ~250 requests/second/user

### Tips

- Use `metadata` format instead of `full` when possible
- Batch requests when fetching multiple messages
- Add delays between large batch operations
- Cache results in database

## 📝 Query String

The `INSURANCE_QUERY` searches for:

- ✅ Emails from 130+ Indian insurance providers
- ✅ Last 365 days only
- ✅ Has attachments (policy docs, receipts)
- ❌ No promotional/social/forum emails

## 🎨 Format Options

| Format     | Use Case          | Speed  | Size   |
| ---------- | ----------------- | ------ | ------ |
| `minimal`  | Just IDs & labels | ⚡⚡⚡ | 📦     |
| `metadata` | Headers only      | ⚡⚡   | 📦📦   |
| `full`     | Complete message  | ⚡     | 📦📦📦 |
| `raw`      | RFC 2822 format   | ⚡     | 📦📦📦 |

## 🛡️ Security Checklist

- [ ] Access tokens only used server-side
- [ ] Error handling for expired tokens
- [ ] Rate limiting implemented
- [ ] Sensitive data not logged
- [ ] Access tokens not cached in browser

## 📚 Documentation

See [lib/gmail/README.md](./README.md) for complete documentation.
