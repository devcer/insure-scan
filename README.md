# Insurance Scanner

A Next.js application that authenticates with Google OAuth and fetches Gmail messages.

## Features

- 🔐 Google OAuth authentication
- 📧 Fetch top 100 Gmail message IDs
- 🔄 Refresh functionality
- ⚡ Skeleton loader for better UX
- 🎨 Modern UI with TailwindCSS
- 🌙 Dark mode support

## Prerequisites

- Node.js 20.9 or higher
- Google Cloud Console account
- Gmail API enabled

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Click "Create"
   - Copy the Client ID and Client Secret
5. Configure OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (or "Internal" for testing)
   - Fill in the required fields
   - Add the scope: `https://www.googleapis.com/auth/gmail.readonly`
   - Save

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Update the `.env.local` file with your credentials:

```bash
# Generate a secret key
npx auth secret

# Then update .env.local with:
AUTH_SECRET=<generated-secret>
GOOGLE_CLIENT_ID=<your-client-id-from-google-cloud>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-google-cloud>
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. Click the "Fetch Emails" button on the home page
2. Sign in with your Google account when prompted
3. Grant permission to read your Gmail
4. View the list of message IDs (up to 100)
5. Click "Refresh" to fetch the latest messages

## Project Structure

```
insurance-scanner/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts       # Auth.js OAuth handlers
│   │   └── gmail/
│   │       └── messages/
│   │           └── route.ts       # Gmail API endpoint
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page with UI
├── types/
│   └── next-auth.d.ts            # TypeScript definitions for Auth.js
├── auth.ts                        # Auth.js configuration
├── .env.local                     # Environment variables
└── README.md
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **Auth.js (NextAuth v5 beta)** - Authentication
- **Google APIs** - Gmail API integration
- **TailwindCSS** - Styling
- **TypeScript** - Type safety

## Troubleshooting

### Authentication Issues

- Ensure your OAuth redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Check that Gmail API is enabled in Google Cloud Console
- Verify that the correct scopes are configured in the OAuth consent screen
- If you see "Access blocked", make sure your app is published or add your email as a test user

### API Errors

- Check that your `.env.local` file has all required variables
- Ensure `AUTH_SECRET` is properly generated
- Verify that your Google credentials are correct

### No Messages Found

- Ensure you have emails in your Gmail account
- Check that the correct Gmail account is authenticated
- Verify that the Gmail API permissions were granted during OAuth flow

## Next Steps (v2 Features)

- Display email subjects and sender information
- Add email filtering and search
- Implement pagination for more than 100 emails
- Add email detail view
- Export message IDs to CSV

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
