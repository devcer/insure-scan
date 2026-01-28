import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listInsuranceEmails, isGmailApiError } from "@/lib/gmail/gmailClient";
import { INSURANCE_QUERY } from "@/lib/gmail/gmailQuery";

export async function POST() {
  try {
    console.log("[SCAN] Starting scan request");

    // Validate session
    const session = await auth();
    console.log("[SCAN] Session:", {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      hasError: !!session?.error,
      userEmail: session?.user?.email,
    });

    // Check for refresh token error
    if (session?.error === "RefreshAccessTokenError") {
      console.error("[SCAN] Token refresh failed, user needs to re-authenticate");
      return NextResponse.json({ error: "Authentication expired. Please sign in again." }, { status: 401 });
    }

    if (!session || !session.accessToken) {
      console.warn("[SCAN] 401 Unauthorized: missing accessToken");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken } = session;
    console.log("[SCAN] Using access token:", accessToken.substring(0, 20) + "...");

    // List insurance emails
    console.log("[SCAN] Calling Gmail API...");
    const listResponse = await listInsuranceEmails({
      accessToken,
      query: INSURANCE_QUERY,
      maxResults: 100,
    });

    if (isGmailApiError(listResponse)) {
      console.error("[SCAN] Gmail API error:", listResponse);
      return NextResponse.json({ error: "Failed to fetch emails from Gmail", details: listResponse.error }, { status: 500 });
    }

    console.log("[SCAN] ✅ Gmail API call successful");
    const messageIds = listResponse.messages?.map((m) => m.id) || [];
    console.log("[SCAN] Found messages:", messageIds.length);

    // For now, just return the count to verify Gmail API works
    // TODO: Re-enable message processing and database storage once auth is verified
    return NextResponse.json({
      success: true,
      messageCount: messageIds.length,
      messageIds: messageIds.slice(0, 5), // Return first 5 IDs as sample
      message: "Gmail API connection successful. Message processing temporarily disabled for testing.",
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
