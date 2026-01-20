# Insurance Scanner - Project Context

## Project Overview

Insurance Scanner is a Next.js application that authenticates with Google OAuth and fetches Gmail messages to help users identify and manage insurance-related emails.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: Auth.js (NextAuth v5 beta)
- **API Integration**: Google Gmail API (googleapis)
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Runtime**: Node.js 20.9+

## Project Structure

```
insurance-scanner/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts    # OAuth handlers
│   │   └── gmail/messages/route.ts        # Gmail API endpoint
│   ├── layout.tsx
│   └── page.tsx                           # Main UI
├── types/
│   └── next-auth.d.ts                     # Auth type extensions
├── auth.ts                                # Auth.js configuration
└── .env.local                             # Environment variables
```

## Current Implementation Status

### ✅ v1.0 - COMPLETED (January 14, 2026)

#### Features Implemented:

1. **Google OAuth Authentication**

   - Integrated Auth.js with Google provider
   - Configured offline access for refresh tokens
   - OAuth scope: `gmail.readonly`
   - Redirect URI: `http://localhost:3000/api/auth/callback/google`

2. **Gmail API Integration**

   - Fetch top 100 Gmail message IDs
   - Server-side API route with session validation
   - Returns array of message IDs from `gmail.users.messages.list`

3. **User Interface**

   - "Fetch Emails" button to trigger authentication
   - Skeleton loader with 10 animated placeholders during fetch
   - Error UI with re-authentication option
   - Scrollable list displaying message IDs (max-height: 600px)
   - Refresh button after initial fetch
   - Dark mode support

4. **Error Handling**

   - 401 errors redirect to sign-in
   - Authentication failures show re-auth button
   - Network errors display user-friendly messages

5. **Project Progress Display**
   - Version badge showing current status
   - Feature status panel with completed features
   - Roadmap showing upcoming v2.0 features

#### Technical Details:

- Uses App Router with Server Components and Client Components
- JWT callbacks store OAuth access tokens in session
- TypeScript type extensions for session.accessToken
- Environment variables: AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

### 📋 v2.0 - PLANNED

#### Upcoming Features:

1. **Email Details**

   - Display email subjects, senders, dates
   - Fetch full message details using `gmail.users.messages.get`
   - Batch requests for efficient API usage

2. **Search & Filtering**

   - Search emails by subject, sender, or content
   - Filter by date range
   - Filter by labels (inbox, sent, etc.)

3. **Insurance Document Detection**

   - Identify insurance-related emails using keywords
   - Detect insurance providers
   - Highlight policy numbers and important dates
   - Tag emails by insurance type (health, auto, home, etc.)

4. **Data Export**

   - Export message list to CSV
   - Export filtered results to PDF
   - Include metadata (subject, sender, date, labels)

5. **Pagination**
   - Implement infinite scroll or page-based navigation
   - Handle more than 100 emails
   - Use Gmail API's `nextPageToken` for pagination

#### Additional Improvements:

- Email preview panel
- Mark emails as read/unread
- Add labels to emails
- Search with Gmail API query syntax
- Performance optimization with React Query or SWR
- Unit and integration tests

## Development Guidelines

### Authentication Flow:

1. User clicks "Fetch Emails"
2. Check if session exists via `/api/gmail/messages`
3. If 401, redirect to `/api/auth/signin`
4. Google OAuth consent screen appears
5. After authorization, callback to `/api/auth/callback/google`
6. Session created with access token
7. API calls use access token for Gmail API

### API Routes:

- **GET /api/gmail/messages**: Fetches top 100 message IDs
  - Requires authenticated session
  - Returns: `{ messages: string[] }`
  - Errors: 401 (unauthorized), 500 (server error)

### Environment Setup:

1. Generate AUTH_SECRET: `npx auth secret`
2. Set up Google Cloud Console:
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add redirect URI
   - Configure OAuth consent screen with test users
3. Update .env.local with credentials

### Common Issues:

- **403 access_denied**: Add email as test user in OAuth consent screen
- **Redirect URI mismatch**: Ensure port matches (3000 vs 3004)
- **Missing scopes**: Verify gmail.readonly is added in OAuth consent screen

## Code Patterns

### Client Component State Management:

```typescript
const [messages, setMessages] = useState<string[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [hasFetched, setHasFetched] = useState(false);
```

### API Error Handling:

```typescript
if (response.status === 401) {
  window.location.href = "/api/auth/signin";
  return;
}
```

### Gmail API Usage:

```typescript
const oauth2Client = new google.auth.OAuth2();
oauth2Client.setCredentials({ access_token: session.accessToken });
const gmail = google.gmail({ version: "v1", auth: oauth2Client });
const result = await gmail.users.messages.list({ userId: "me", maxResults: 100 });
```

## Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Message IDs display in list
- [ ] Refresh button fetches latest emails
- [ ] Error UI appears on auth failures
- [ ] Skeleton loader shows during fetch
- [ ] Dark mode styling works correctly
- [ ] Re-authenticate button redirects to sign-in

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Auth.js v5 Docs](https://authjs.dev/)
- [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

# Implementation Plan: Insurance Scanner Digital Wallet System

A comprehensive system where users forward insurance emails to a dedicated address, and the system automatically extracts policy information and stores it in a digital wallet. Current Next.js OAuth implementation serves as foundation for authentication.

## Steps

1. **Set up email receiving infrastructure**

   - Choose AWS SES or SendGrid Inbound Parse
   - Configure MX records for `insurancescanner.com`
   - Create webhook endpoint at `app/api/webhooks/inbound-email/route.ts` to receive parsed emails via HTTP POST
   - Implement HMAC signature verification for security
   - Set up Supabase PostgreSQL with schema for `users`, `user_email_addresses`, `received_emails`, `email_attachments`, and `insurance_policies` tables

2. **Implement user registration with unique email addresses**

   - Extend current Auth.js OAuth to create database user record on signup
   - Generate hash-based unique email address per user (`receive-{8char-hash}@insurancescanner.com`)
   - Store in `user_email_addresses` table with hash key for lookups
   - Create user dashboard page showing their personal forwarding address
   - Map incoming webhook emails to users by extracting hash from recipient address

3. **Build email parsing and storage pipeline**

   - Install `mailparser` for MIME parsing
   - Extract sender, subject, HTML/text content, and attachments from webhook payload
   - Store email metadata and content in `received_emails` table
   - Upload attachments to Supabase Storage or AWS S3 with signed URLs
   - Create email inbox UI at `app/emails/page.tsx` with list/detail views, pagination, and search by sender/subject/date

4. **Integrate AI-powered insurance detection and extraction**

   - Set up OpenAI GPT-4 API with structured JSON output for policy extraction
   - Create background job queue (AWS SQS or Upstash QStash) for async processing
   - Implement prompt engineering to extract policy number, provider, type, coverage amounts, dates from email content
   - Store extracted data in `insurance_policies` table
   - Add confidence scoring and manual correction UI for low-confidence extractions
   - Build insurance provider master database matching email domains to companies

5. **Build digital wallet dashboard interface**

   - Create `app/dashboard/page.tsx` displaying all user's insurance policies grouped by type (health, auto, home, life)
   - Design policy cards showing key information (provider, coverage, expiration date)
   - Implement policy detail view with full information and linked source emails
   - Add filtering, search, and export (CSV/PDF) functionality
   - Create renewal reminder system based on policy end dates

6. **Add OCR and PDF processing for attachments**
   - Integrate AWS Textract for extracting text from PDF policy documents and scanned images
   - Process attachments asynchronously to extract structured data
   - Combine OCR text with email body content for comprehensive policy extraction
   - Cache extracted text to avoid reprocessing
   - Provide document viewer in policy detail pages with highlighting of key information

## Further Considerations

1. **Email receiving service selection**: AWS SES ($0.10/1000 emails, requires Lambda setup, more scalable) vs SendGrid Inbound Parse ($19.95/mo for 40k, simpler webhook integration)? **Recommendation**: Start with SendGrid for faster MVP, migrate to AWS SES if cost becomes factor at scale.

2. **Processing architecture**: Process emails synchronously in webhook (simpler, may timeout for large attachments) or asynchronously with queue (more complex, better performance, handles spikes)? **Recommendation**: Start synchronous for MVP, add queue when processing time exceeds 5 seconds.

3. **Gmail integration migration**: Keep Gmail OAuth as alternative import method for users to bulk-import existing insurance emails from their inbox, or fully transition to forwarding-only? **Recommendation**: Keep both - Gmail for importing history, forwarding for new emails.

4. **Data privacy and compliance**: Implement GDPR data export/deletion endpoints now or later? Need HIPAA compliance for health insurance data (requires BAA with providers, encryption, audit logs)? **Recommendation**: Add GDPR endpoints in Phase 1, evaluate HIPAA based on target market.

5. **AI extraction cost management**: Process all emails with GPT-4 (~$0.005 per email, $250/mo for 50k emails) or implement free tier limits per user (50 emails/month free, premium for unlimited)? **Recommendation**: Start unlimited for beta users, add tiered pricing before public launch.
