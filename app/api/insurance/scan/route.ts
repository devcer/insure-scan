import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listInsuranceEmails, getEmailMessage, isGmailApiError } from "@/lib/gmail/gmailClient";
import { extractEmailMetadata, decodeMessage } from "@/lib/gmail/decodeMessage";
import { INSURANCE_QUERY } from "@/lib/gmail/gmailQuery";
import { getCompanyNameFromEmail } from "@/lib/domain/companyMapping";
import { parseInsuranceEmail } from "@/lib/parsers/insurance";

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
    const { data: user, error: userError } = (await supabase.from("users").select("id").eq("email", userEmail).single()) as {
      data: { id: string } | null;
      error: unknown;
    };

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
      maxResults: 10,
    });

    if (isGmailApiError(listResponse)) {
      console.error("[SCAN] Gmail API error:", listResponse);
      return NextResponse.json({ error: "Failed to fetch emails from Gmail", details: listResponse.error }, { status: 500 });
    }

    console.log("[SCAN] ✅ Gmail API call successful");
    const messageIds = listResponse.messages?.map((m) => m.id) || [];
    console.log("[SCAN] Found messages:", messageIds.length);

    let savedCount = 0;
    const updatedCount = 0;
    let errorCount = 0;

    // Process each message
    for (const msgId of messageIds) {
      const messageId = msgId || "";
      if (!messageId) continue;

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

        // Log metadata for debugging
        console.log(`[SCAN] 📬 Metadata for ${messageId}:`, {
          from: metadata.from,
          subject: metadata.subject,
          date: metadata.date,
          bodyPreview: body.slice(0, 100) + "...",
        });

        // Parse insurance data using regex extraction
        console.log(`[SCAN] 🔍 Parsing insurance data from email body...`);
        const parsedData = parseInsuranceEmail(body, metadata);

        console.log(`[SCAN] 📊 Extracted data:`, {
          insurer: parsedData.insurerName,
          policyNumber: parsedData.policyNumber,
          amount: parsedData.amount,
          dueDate: parsedData.dueDate,
          status: parsedData.paymentStatus,
          confidence: parsedData.confidenceScore,
        });

        // Map email to company name using domain mapping (more accurate than text parsing)
        const companyName = getCompanyNameFromEmail(metadata.from);
        console.log(`[SCAN] 📧 Email: ${metadata.from} → 🏢 Company: ${companyName}`);

        // Generate policy_key from insurer name and policy number (if available) or subject
        const policyKey = parsedData.policyNumber
          ? `${companyName?.toLowerCase()}-${parsedData.policyNumber}`.slice(0, 100)
          : `${metadata.from?.toLowerCase()}-${metadata.subject?.toLowerCase()}`.slice(0, 100);

        const premiumData = {
          user_id: userId,
          gmail_message_id: messageId,
          policy_key: policyKey,
          insurer_name: companyName,
          policy_number: parsedData.policyNumber,
          amount: parsedData.amount,
          due_date: parsedData.dueDate ? parsedData.dueDate.toISOString() : null,
          payment_status: parsedData.paymentStatus,
          email_subject: metadata.subject,
          from_email: metadata.from,
          received_at: metadata.date || new Date().toISOString(),
          confidence_score: parsedData.confidenceScore,
          raw_preview_text: body.slice(0, 500),
        };

        // Use upsert to insert or update in a single atomic operation
        console.log(`[SCAN] Upserting premium for message ${messageId}`);
        const { error: upsertError } = await supabase
          .from("insurance_premiums")
          .upsert(premiumData as any, {
            onConflict: "gmail_message_id",
            ignoreDuplicates: false, // Always update on conflict
          })
          .select("id");

        if (upsertError) {
          console.error(`[SCAN] Upsert error for ${messageId}:`, upsertError);
          errorCount++;
        } else {
          savedCount++;
          console.log(`[SCAN] ✅ Successfully upserted message ${messageId}`);
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
