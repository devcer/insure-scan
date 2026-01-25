import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = session;
    const supabase = createSupabaseServerClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build query
    let query = supabase.from("insurance_premiums").select("*").eq("user_id", userId);

    // Apply status filter
    if (status && status !== "ALL") {
      query = query.eq("payment_status", status);
    }

    // Apply search filter
    if (search) {
      query = query.or(`insurer_name.ilike.%${search}%,policy_number.ilike.%${search}%`);
    }

    // Order by received_at descending
    query = query.order("received_at", { ascending: false });

    const { data: premiums, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch premiums" }, { status: 500 });
    }

    return NextResponse.json({ premiums: premiums || [] });
  } catch (error) {
    console.error("Error fetching premiums:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
