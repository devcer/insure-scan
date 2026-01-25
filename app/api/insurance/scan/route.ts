import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listInsuranceEmails, getEmailMessage, isGmailApiError } from "@/lib/gmail/gmailClient";
import { decodeMessage, extractEmailMetadata } from "@/lib/gmail/decodeMessage";
import { parseInsuranceEmail } from "@/lib/parsers/insurance";
import { INSURANCE_QUERY } from "@/lib/gmail/gmailQuery";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await auth();
    if (!session || !session.userId || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, accessToken } = session;
    const supabase = createSupabaseServerClient();

    // Get user's Gmail connection
    const { data: connection, error: connectionError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (connectionError || !connection) {
      // Store/update connection on first scan
      const { data: userResult } = await supabase.from("users").select("email").eq("id", userId).single();

      const userEmail = (userResult as any)?.email;
      if (userEmail) {
        await (supabase.from("gmail_connections") as any).upsert({
          user_id: userId,
          email: userEmail,
          access_token: accessToken,
          provider: "google",
        });
      }
    }

    // List insurance emails
    const listResponse = await listInsuranceEmails({
      accessToken,
      query: INSURANCE_QUERY,
      maxResults: 100,
    });

    if (isGmailApiError(listResponse)) {
      console.error("Gmail API error:", listResponse);
      return NextResponse.json({ error: "Failed to fetch emails from Gmail", details: listResponse.error }, { status: 500 });
    }

    const messageIds = listResponse.messages?.map((m) => m.id) || [];
    let scannedCount = 0;
    let savedCount = 0;
    let updatedCount = 0;

    // Process each message
    for (const messageId of messageIds) {
      try {
        if (!messageId) continue;

        // Fetch full message
        const messageResponse = await getEmailMessage({
          accessToken,
          messageId,
          format: "full",
        });

        if (isGmailApiError(messageResponse)) {
          console.error(`Failed to fetch message ${messageId}:`, messageResponse);
          continue;
        }

        const message = messageResponse.message;
        scannedCount++;

        // Decode message body
        const body = decodeMessage(message);
        const metadata = extractEmailMetadata(message);

        // Parse insurance data
        const parsed = parseInsuranceEmail(body, {
          subject: metadata.subject,
          fromEmail: metadata.from,
          receivedAt: new Date(metadata.date || Date.now()),
        });

        // Skip low confidence results
        if (parsed.confidenceScore < 0.5) {
          continue;
        }

        // Prepare premium data for database
        const premiumData = {
          user_id: userId,
          gmail_message_id: messageId,
          policy_key: parsed.policyKey,
          insurer_name: parsed.insurerName || "Unknown",
          policy_number: parsed.policyNumber,
          amount: parsed.amount,
          due_date: parsed.dueDate?.toISOString().split("T")[0] || null,
          payment_status: parsed.paymentStatus,
          email_subject: metadata.subject,
          email_from: metadata.from,
          received_at: new Date(metadata.date || Date.now()).toISOString(),
          confidence_score: parsed.confidenceScore,
        };

        // Upsert to database (dedupe by gmail_message_id)
        const { data: existing } = await supabase.from("insurance_premiums").select("id").eq("gmail_message_id", messageId).single();

        if (existing) {
          // Update existing record
          const { error } = await supabase
            .from("insurance_premiums")
            .update({
              ...premiumData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (!error) {
            updatedCount++;
          }
        } else {
          // Insert new record
          const { error } = await supabase.from("insurance_premiums").insert(premiumData);

          if (!error) {
            savedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing message ${messageId}:`, error);
        continue;
      }
    }

    // Update gmail_connections.updated_at
    await supabase.from("gmail_connections").update({ updated_at: new Date().toISOString() }).eq("user_id", userId);

    return NextResponse.json({
      scannedCount,
      savedCount,
      updatedCount,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
