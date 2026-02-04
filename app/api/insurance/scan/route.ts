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
    const updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

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

        // Parse insurance data using regex extraction with debug mode enabled
        console.log(`[SCAN] 🔍 Parsing insurance data from email body...`);
        const parsedData = parseInsuranceEmail(body, metadata, true); // Enable debug mode

        console.log(`[SCAN] 📊 Extracted data:`, {
          insurer: parsedData.insurerName,
          policyNumber: parsedData.policyNumber,
          amount: parsedData.amount,
          currency: parsedData.currency,
          dueDate: parsedData.dueDate,
          status: parsedData.paymentStatus,
          confidence: parsedData.confidenceScore,
          errorCount: parsedData.errors.length,
        });

        // Log parsing errors if any
        if (parsedData.errors.length > 0) {
          console.warn(`[SCAN] ⚠️ Parsing errors for message ${messageId}:`, parsedData.errors);
        }

        // Map email to company name using domain mapping (more accurate than text parsing)
        const companyName = getCompanyNameFromEmail(metadata.from);
        console.log(`[SCAN] 📧 Email: ${metadata.from} → 🏢 Company: ${companyName}`);

        // Generate a stable policy_key for deduplication
        // Priority: 1) Company + Policy Number, 2) Company + Email pattern, 3) Fallback to message ID
        let policyKey: string;
        
        if (parsedData.policyNumber && companyName) {
          // Best case: we have both company and policy number
          policyKey = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${parsedData.policyNumber}`;
        } else if (companyName) {
          // Extract a stable identifier from email domain + any policy reference in subject
          const emailDomain = metadata.from.split('@')[1]?.toLowerCase() || 'unknown';
          const subjectPolicyRef = metadata.subject?.match(/policy\s*([A-Z0-9X]{4,})/i)?.[1] || '';
          
          if (subjectPolicyRef) {
            policyKey = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${subjectPolicyRef}`;
          } else {
            // Use domain + a hash of the sender email for consistency
            const emailHash = metadata.from.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
            policyKey = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${emailHash}`;
          }
        } else {
          // Fallback: use message ID (this will create unique entries, but better than crashes)
          policyKey = `unknown-${messageId}`;
        }
        
        // Ensure policy key is within database limits
        policyKey = policyKey.slice(0, 100);
        
        console.log(`[SCAN] 🔑 Generated policy key: ${policyKey}`);

        // Map payment status to database format (uppercase)
        const paymentStatusMap: Record<string, string> = {
          'paid': 'PAID',
          'pending': 'PENDING', 
          'overdue': 'OVERDUE',
          'cancelled': 'CANCELLED'
        };
        
        const dbPaymentStatus = paymentStatusMap[parsedData.paymentStatus] || 'UNKNOWN';

        const premiumData = {
          user_id: userId,
          gmail_message_id: messageId,
          policy_key: policyKey,
          insurer_name: companyName,
          policy_number: parsedData.policyNumber,
          amount: parsedData.amount,
          due_date: parsedData.dueDate ? parsedData.dueDate.toISOString() : null,
          payment_status: dbPaymentStatus, // Use mapped uppercase status
          email_subject: metadata.subject,
          from_email: metadata.from,
          received_at: metadata.date || new Date().toISOString(),
          confidence_score: parsedData.confidenceScore,
          raw_preview_text: body.slice(0, 500),
        };

        // Check for existing policy with same policy_key to avoid duplicates
        console.log(`[SCAN] 🔍 Checking for existing policy with key: ${policyKey}`);
        const { data: existingPolicy, error: checkError } = await supabase
          .from("insurance_premiums")
          .select("id, gmail_message_id, confidence_score, received_at")
          .eq("user_id", userId)
          .eq("policy_key", policyKey)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error(`[SCAN] Error checking for existing policy:`, checkError);
        }

        let shouldUpdate = true;
        let updateReason = "new_policy";

        if (existingPolicy) {
          console.log(`[SCAN] 📋 Found existing policy:`, {
            id: existingPolicy.id,
            existingMessageId: existingPolicy.gmail_message_id,
            currentMessageId: messageId,
            existingConfidence: existingPolicy.confidence_score,
            currentConfidence: parsedData.confidenceScore,
          });

          // Decide whether to update based on confidence and recency
          const existingDate = new Date(existingPolicy.received_at || 0);
          const currentDate = new Date(metadata.date || new Date());
          const isNewer = currentDate > existingDate;
          const isBetterConfidence = parsedData.confidenceScore > (existingPolicy.confidence_score || 0);
          const isSameMessage = existingPolicy.gmail_message_id === messageId;

          if (isSameMessage) {
            updateReason = "same_message";
            shouldUpdate = true;
          } else if (isBetterConfidence) {
            updateReason = "better_confidence";
            shouldUpdate = true;
          } else if (isNewer && parsedData.confidenceScore >= 0.6) {
            updateReason = "newer_with_good_confidence";
            shouldUpdate = true;
          } else {
            updateReason = "keeping_existing";
            shouldUpdate = false;
          }

          console.log(`[SCAN] 🤔 Update decision: ${updateReason} (shouldUpdate: ${shouldUpdate})`);
        }

        if (shouldUpdate) {
          // Use upsert to insert or update in a single atomic operation
          console.log(`[SCAN] 💾 Upserting premium for message ${messageId} (reason: ${updateReason})`);
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
        } else {
          console.log(`[SCAN] ⏭️ Skipping message ${messageId} - keeping existing policy`);
          skippedCount++;
          // Don't increment error count, this is intentional
        }
      } catch (err) {
        console.error(`[SCAN] Error processing message ${messageId}:`, err);
        errorCount++;
        continue;
      }
    }

    console.log("[SCAN] ✅ Scan complete", { savedCount, updatedCount, errorCount, skippedCount });
    return NextResponse.json({
      success: true,
      messageCount: messageIds.length,
      savedCount,
      updatedCount,
      errorCount,
      skippedCount,
    });
  } catch (error) {
    console.error("[SCAN] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
