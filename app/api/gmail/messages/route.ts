import { auth } from "@/auth";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized - Please sign in with Google" }, { status: 401 });
    }

    // Create OAuth2 client with access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken,
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch top 100 messages
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 100,
    });

    // Extract message IDs
    const messageIds = response.data.messages?.map((msg) => msg.id) || [];

    return NextResponse.json({ messages: messageIds });
  } catch (error) {
    console.error("Gmail API error:", error);

    if (typeof error === "object" && error !== null && "code" in error && ((error as any).code === 401 || (error as any).code === 403)) {
      return NextResponse.json({ error: "Authentication failed - Please re-authenticate with Google" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch emails - Please try again" }, { status: 500 });
  }
}
