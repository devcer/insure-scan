# Gmail Fetching Utilities

Utilities for fetching insurance-related emails from Gmail using the Gmail API with OAuth access tokens.

## 📁 File Structure

```
lib/gmail/
├── gmailQuery.ts     # Gmail search query definitions
├── gmailClient.ts    # Gmail API client and helper functions
└── examples.ts       # Usage examples
```

## 🚀 Quick Start

### 1. Import the utilities

```typescript
import { listInsuranceEmails, getEmailMessage, batchGetEmailMessages, isGmailApiError } from "@/lib/gmail/gmailClient";
import { INSURANCE_QUERY } from "@/lib/gmail/gmailQuery";
```

### 2. Fetch list of insurance emails

```typescript
const result = await listInsuranceEmails({
  accessToken: session.accessToken, // From NextAuth session
  query: INSURANCE_QUERY,
  maxResults: 100,
});

if (isGmailApiError(result)) {
  console.error("Error:", result.error);
} else {
  console.log(`Found ${result.messages?.length} emails`);
}
```

### 3. Get full email details

```typescript
const result = await getEmailMessage({
  accessToken: session.accessToken,
  messageId: "abc123def456",
});

if (!isGmailApiError(result)) {
  const message = result.message;
  // Access headers, body, attachments, etc.
}
```

## 📋 API Reference

### `gmailQuery.ts`

#### `INSURANCE_QUERY`

Optimized Gmail search query for Indian insurance emails.

**Features:**

- Searches last 365 days
- Filters by 130+ insurance provider domains
- Only includes emails with attachments
- Excludes promotional/social categories

```typescript
export const INSURANCE_QUERY: string;
```

#### Constants

```typescript
export const DEFAULT_MAX_RESULTS = 100;
export const MAX_RESULTS_LIMIT = 500;
```

---

### `gmailClient.ts`

#### `listInsuranceEmails(params)`

Fetches a list of email message IDs matching the query.

**Parameters:**

```typescript
interface ListInsuranceEmailsParams {
  accessToken: string; // OAuth access token
  query: string; // Gmail search query
  maxResults?: number; // Default: 100, Max: 500
  pageToken?: string; // For pagination
}
```

**Returns:**

```typescript
Promise<ListEmailsResponse | GmailApiError>;

interface ListEmailsResponse {
  messages?: Array<{
    id?: string | null;
    threadId?: string | null;
  }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailApiError {
  error: string;
  details?: unknown;
}
```

**Example:**

```typescript
const result = await listInsuranceEmails({
  accessToken: "ya29.a0...",
  query: INSURANCE_QUERY,
  maxResults: 50,
});
```

---

#### `getEmailMessage(params)`

Fetches complete details of a single email message.

**Parameters:**

```typescript
interface GetEmailMessageParams {
  accessToken: string;
  messageId: string;
  format?: "minimal" | "full" | "raw" | "metadata"; // Default: 'full'
}
```

**Formats:**

- `minimal` - Basic info (id, threadId, labelIds)
- `metadata` - Headers only (faster, no body)
- `full` - Complete message with body and attachments
- `raw` - RFC 2822 formatted and base64 encoded string

**Returns:**

```typescript
Promise<EmailMessageResponse | GmailApiError>;

interface EmailMessageResponse {
  message: gmail_v1.Schema$Message;
}
```

**Example:**

```typescript
const result = await getEmailMessage({
  accessToken: "ya29.a0...",
  messageId: "18d1234567890abcd",
  format: "full",
});
```

---

#### `batchGetEmailMessages(accessToken, messageIds, format)`

Fetches multiple email messages in parallel.

**Parameters:**

```typescript
accessToken: string;
messageIds: string[];
format?: 'minimal' | 'full' | 'raw' | 'metadata';  // Default: 'full'
```

**Returns:**

```typescript
Promise<gmail_v1.Schema$Message[]>;
```

**Example:**

```typescript
const messages = await batchGetEmailMessages(accessToken, ["id1", "id2", "id3"], "metadata");
```

---

#### `isGmailApiError(response)`

Type guard to check if a response contains an error.

**Parameters:**

```typescript
response: ListEmailsResponse | EmailMessageResponse | GmailApiError;
```

**Returns:**

```typescript
boolean;
```

**Example:**

```typescript
const result = await listInsuranceEmails({ ... });
if (isGmailApiError(result)) {
  console.error(result.error);
} else {
  console.log(result.messages);
}
```

## 💡 Usage Patterns

### Pattern 1: Fetch and Process All Emails

```typescript
// Step 1: Get message IDs
const list = await listInsuranceEmails({
  accessToken,
  query: INSURANCE_QUERY,
  maxResults: 100,
});

if (isGmailApiError(list) || !list.messages) {
  return handleError(list);
}

// Step 2: Extract IDs
const messageIds = list.messages.map((m) => m.id).filter((id): id is string => Boolean(id));

// Step 3: Batch fetch details
const messages = await batchGetEmailMessages(accessToken, messageIds, "full");

console.log(`Fetched ${messages.length} emails`);
```

### Pattern 2: Pagination

```typescript
let allMessages = [];
let pageToken: string | undefined;

do {
  const result = await listInsuranceEmails({
    accessToken,
    query: INSURANCE_QUERY,
    maxResults: 100,
    pageToken,
  });

  if (isGmailApiError(result)) break;

  if (result.messages) {
    allMessages.push(...result.messages);
  }

  pageToken = result.nextPageToken;
} while (pageToken);
```

### Pattern 3: Extract Email Headers

```typescript
const result = await getEmailMessage({
  accessToken,
  messageId,
  format: "metadata", // Faster than 'full'
});

if (!isGmailApiError(result)) {
  const headers = result.message.payload?.headers || [];

  const getHeader = (name: string) => headers.find((h) => h.name === name)?.value || "";

  const emailData = {
    subject: getHeader("Subject"),
    from: getHeader("From"),
    to: getHeader("To"),
    date: getHeader("Date"),
  };
}
```

### Pattern 4: API Route Implementation

```typescript
// app/api/emails/route.ts
import { auth } from "@/auth";
import { listInsuranceEmails, isGmailApiError } from "@/lib/gmail/gmailClient";
import { INSURANCE_QUERY } from "@/lib/gmail/gmailQuery";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await listInsuranceEmails({
    accessToken: session.accessToken,
    query: INSURANCE_QUERY,
    maxResults: 100,
  });

  if (isGmailApiError(result)) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({
    messages: result.messages || [],
    total: result.resultSizeEstimate || 0,
    nextPageToken: result.nextPageToken,
  });
}
```

### Pattern 5: Process in Batches (Memory Efficient)

```typescript
const BATCH_SIZE = 20;

async function processEmailsInBatches(accessToken: string) {
  // Get all message IDs
  const list = await listInsuranceEmails({
    accessToken,
    query: INSURANCE_QUERY,
    maxResults: 500,
  });

  if (isGmailApiError(list) || !list.messages) return;

  const messageIds = list.messages.map((m) => m.id).filter((id): id is string => Boolean(id));

  // Process in batches
  for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
    const batchIds = messageIds.slice(i, i + BATCH_SIZE);
    const messages = await batchGetEmailMessages(accessToken, batchIds, "metadata");

    // Process this batch
    await processBatch(messages);

    // Optional: Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
```

## 🔒 Security Notes

- **Never expose access tokens** in client-side code
- **Always use server-side** for Gmail API calls (API routes, server components)
- **Handle token expiration** - Implement refresh token logic
- **Rate limiting** - Gmail API has quotas, add delays between batch requests

## ⚠️ Error Handling

### Common Error Scenarios

**1. Token Expired (401)**

```typescript
if (isGmailApiError(result)) {
  if (result.details?.code === 401) {
    // Trigger token refresh
    await refreshAccessToken();
  }
}
```

**2. Rate Limit Exceeded (429)**

```typescript
// Add exponential backoff
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();
    if (!isGmailApiError(result)) return result;

    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
  }
}
```

**3. Invalid Message ID (404)**

```typescript
const result = await getEmailMessage({ accessToken, messageId });
if (isGmailApiError(result)) {
  console.log("Message not found or deleted");
}
```

## 📊 Response Structure

### Message Object (`gmail_v1.Schema$Message`)

```typescript
{
  id: string;                    // Message ID
  threadId: string;              // Thread ID
  labelIds: string[];            // Labels (INBOX, SENT, etc.)
  snippet: string;               // Preview text
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: Array<{
      name: string;              // Header name (Subject, From, etc.)
      value: string;             // Header value
    }>;
    body: {
      size: number;
      data: string;              // Base64 encoded
    };
    parts: MessagePart[];        // Multipart message parts
  };
  internalDate: string;          // Unix timestamp (milliseconds)
  historyId: string;
  sizeEstimate: number;          // Size in bytes
}
```

### Common Headers

- `Subject` - Email subject line
- `From` - Sender email address
- `To` - Recipient email address
- `Date` - Sent date (RFC 2822 format)
- `Message-ID` - Unique message identifier
- `Content-Type` - MIME type

## 🧪 Testing

### Example Test with Mock Data

```typescript
// __tests__/gmail.test.ts
import { listInsuranceEmails, isGmailApiError } from "@/lib/gmail/gmailClient";

describe("Gmail Client", () => {
  it("should fetch insurance emails", async () => {
    const result = await listInsuranceEmails({
      accessToken: process.env.TEST_ACCESS_TOKEN!,
      query: INSURANCE_QUERY,
      maxResults: 10,
    });

    expect(isGmailApiError(result)).toBe(false);
    if (!isGmailApiError(result)) {
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
    }
  });
});
```

## 📚 Resources

- [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest)
- [Gmail Search Operators](https://support.google.com/mail/answer/7190)
- [OAuth 2.0 for Gmail](https://developers.google.com/gmail/api/auth/about-auth)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)

## 🔄 Next Steps

1. **Add email parsing** - Extract structured data from raw messages
2. **Implement caching** - Store fetched emails in Supabase
3. **Add webhook support** - Real-time updates with Gmail push notifications
4. **Implement retry logic** - Handle rate limits and transient errors
5. **Add progress tracking** - For long-running batch operations
