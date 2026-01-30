import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listInsuranceEmails, getEmailMessage, isGmailApiError } from "@/lib/gmail/gmailClient";
import { extractEmailMetadata } from "@/lib/gmail/decodeMessage";
import { INSURANCE_QUERY } from "@/lib/gmail/gmailQuery";

export async function GET(request: Request) {
  try {
    console.log("[PREMIUMS] Fetching premiums");

    // Validate session
    const session = await auth();
    console.log("[PREMIUMS] Session:", {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.userEmail,
    });

    if (!session || !session.accessToken || !session.userEmail) {
      console.warn("[PREMIUMS] 401 Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { accessToken, userEmail } = session;

    // Get user ID from email
    console.log("[PREMIUMS] Looking up user ID for:", userEmail);
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", userEmail).single();

    if (userError || !user) {
      console.error("[PREMIUMS] User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;
    console.log("[PREMIUMS] ✅ Found user ID:", userId);

    // Get query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const showArchived = url.searchParams.get("archived");

    // Build Supabase query
    console.log("[PREMIUMS] Building query with filters:", { status, search, showArchived });
    let query = supabase.from("insurance_premiums").select("*").eq("user_id", userId).order("received_at", { ascending: false });

    // Apply archived filter (default: show only non-archived)
    if (showArchived === "only") {
      query = query.eq("archived", true);
    } else {
      // Default: exclude archived policies or where archived is null
      query = query.or("archived.is.null,archived.eq.false");
    }

    // Apply status filter
    if (status && status !== "ALL") {
      query = query.eq("payment_status", status);
    }

    // Apply search filter
    if (search) {
      query = query.or(`insurer_name.ilike.%${search}%,policy_number.ilike.%${search}%,email_subject.ilike.%${search}%`);
    }

    const { data: premiums, error: queryError } = await query;

    if (queryError) {
      console.error("[PREMIUMS] Database query error:", queryError);
      return NextResponse.json({ error: "Failed to fetch premiums" }, { status: 500 });
    }

    console.log("[PREMIUMS] ✅ Returned", premiums?.length || 0, "premiums from database");
    return NextResponse.json({ premiums: premiums || [] });
  } catch (error) {
    console.error("[PREMIUMS] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
