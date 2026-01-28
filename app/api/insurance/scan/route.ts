import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listInsuranceEmails, getEmailMessage, isGmailApiError } from "@/lib/gmail/gmailClient";
import { extractEmailMetadata, decodeMessage } from "@/lib/gmail/decodeMessage";
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
      userEmail: session?.userEmail,
    });

    // Check for refresh token error
    if (session?.error === "RefreshAccessTokenError") {
      console.error("[SCAN] Token refresh failed, user needs to re-authenticate");
      return NextResponse.json({ error: "Authentication expired. Please sign in again." }, { status: 401 });
    }

    if (!session || !session.accessToken || !session.userEmail) {
      console.warn("[SCAN] 401 Unauthorized: missing accessToken or userEmail");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken, userEmail } = session;
    const supabase = createSupabaseServerClient();

    // Get user ID from email
    console.log("[SCAN] Looking up user ID for:", userEmail);
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", userEmail).single();

    if (userError || !user) {
      console.error("[SCAN] User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;
    console.log("[SCAN] ✅ Found user ID:", userId);

    // List insurance emails from Gmail
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

    let savedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Process each message
    for (const messageId of messageIds) {
      try {
        console.log(`[SCAN] Processing message ${messageId}...`);

        // Fetch full message
        const messageResponse = await getEmailMessage({
          accessToken,
          messageId,
          format: "full",
        });

        if (isGmailApiError(messageResponse)) {
          console.error(`[SCAN] Failed to fetch message ${messageId}`);
          errorCount++;
          continue;
        }

        const metadata = extractEmailMetadata(messageResponse.message);
        const body = decodeMessage(messageResponse.message);

        // Generate policy_key from insurer name and subject
        const policyKey = `${metadata.from?.toLowerCase()}-${metadata.subject?.toLowerCase()}`.slice(0, 100);

        const premiumData = {
          user_id: userId,
          gmail_message_id: messageId,
          policy_key: policyKey,
          insurer_name: metadata.from || "Unknown Sender",
          policy_number: null,
          amount: null,
          due_date: null,
          payment_status: "UNKNOWN",
          email_subject: metadata.subject,
          from_email: metadata.from,
          received_at: metadata.date || new Date().toISOString(),
          confidence_score: 0.5,
          raw_preview_text: body.slice(0, 500),
        };

        // Try to upsert (create or update if gmail_message_id exists)
        const { data: existing } = await supabase.from("insurance_premiums").select("id").eq("gmail_message_id", messageId).single();

        if (existing) {
          console.log(`[SCAN] Updating existing premium for message ${messageId}`);
          const { error: updateError } = await supabase
            .from("insurance_premiums")
            .update({
              ...premiumData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateError) {
            console.error(`[SCAN] Update error for ${messageId}:`, updateError);
            errorCount++;
          } else {
            updatedCount++;
          }
        } else {
          console.log(`[SCAN] Creating new premium for message ${messageId}`);
          const { error: insertError } = await supabase.from("insurance_premiums").insert(premiumData);

          if (insertError) {
            console.error(`[SCAN] Insert error for ${messageId}:`, insertError);
            errorCount++;
          } else {
            savedCount++;
          }
        }
      } catch (err) {
        console.error(`[SCAN] Error processing message ${messageId}:`, err);
        errorCount++;
        continue;
      }
    }

    console.log("[SCAN] ✅ Scan complete", { savedCount, updatedCount, errorCount });
    return NextResponse.json({
      success: true,
      messageCount: messageIds.length,
      savedCount,
      updatedCount,
      errorCount,
    });
  } catch (error) {
    console.error("[SCAN] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
