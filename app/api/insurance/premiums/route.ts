import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listInsuranceEmails, getEmailMessage, isGmailApiError } from "@/lib/gmail/gmailClient";
import { extractEmailMetadata } from "@/lib/gmail/decodeMessage";
import { INSURANCE_QUERY } from "@/lib/gmail/gmailQuery";

export async function GET() {
  try {
    console.log("[PREMIUMS] Fetching insurance emails from Gmail");

    // Validate session
    const session = await auth();
    console.log("[PREMIUMS] Session:", {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.user?.email,
    });

    if (!session || !session.accessToken) {
      console.warn("[PREMIUMS] 401 Unauthorized: missing accessToken");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken } = session;
    console.log("[PREMIUMS] ✅ Authentication successful");

    // List insurance emails from Gmail
    console.log("[PREMIUMS] Calling Gmail API...");
    const listResponse = await listInsuranceEmails({
      accessToken,
      query: INSURANCE_QUERY,
      maxResults: 50,
    });

    if (isGmailApiError(listResponse)) {
      console.error("[PREMIUMS] Gmail API error:", listResponse);
      return NextResponse.json({ error: "Failed to fetch emails from Gmail", details: listResponse.error }, { status: 500 });
    }

    const messageIds = listResponse.messages?.map((m) => m.id) || [];
    console.log("[PREMIUMS] Found", messageIds.length, "insurance emails");

    // Fetch message details for first 20 emails
    const premiums = [];
    for (const messageId of messageIds.slice(0, 20)) {
      try {
        const messageResponse = await getEmailMessage({
          accessToken,
          messageId,
          format: "full",
        });

        if (isGmailApiError(messageResponse)) {
          console.error(`[PREMIUMS] Failed to fetch message ${messageId}`);
          continue;
        }

        const metadata = extractEmailMetadata(messageResponse.message);

        // Map email metadata to premium structure
        premiums.push({
          id: messageId,
          insurer_name: metadata.from || "Unknown Sender",
          policy_number: null,
          amount: null,
          due_date: null,
          payment_status: "UNKNOWN",
          received_at: metadata.date || new Date().toISOString(),
          email_subject: metadata.subject,
          email_from: metadata.from,
        });
      } catch (err) {
        console.error(`[PREMIUMS] Error processing message ${messageId}:`, err);
        continue;
      }
    }

    console.log("[PREMIUMS] Returning", premiums.length, "emails");
    return NextResponse.json({ premiums });
  } catch (error) {
    console.error("[PREMIUMS] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
