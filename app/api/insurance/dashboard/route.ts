import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Debug: Log request method and headers
    console.log("[DASHBOARD] Incoming request", {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Validate session
    const session = await auth();
    console.log("[DASHBOARD] Session result", session);

    // Check for refresh token error
    if (session?.error === "RefreshAccessTokenError") {
      console.error("[DASHBOARD] Token refresh failed, user needs to re-authenticate");
      return NextResponse.json({ error: "Authentication expired. Please sign in again." }, { status: 401 });
    }

    if (!session || !session.userId) {
      console.warn("[DASHBOARD] 401 Unauthorized: session missing or incomplete", { session });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = session;
    const supabase = createSupabaseServerClient();

    // Get active policies count (distinct policy_key)
    const { count: activePoliciesCount } = await supabase
      .from("insurance_premiums")
      .select("policy_key", { count: "exact", head: false })
      .eq("user_id", userId);
    console.log("[DASHBOARD] Active policies count", activePoliciesCount);

    // Calculate date 30 days from now
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split("T")[0];

    // Get upcoming premiums count (due within 30 days or overdue, not paid)
    const { data: upcomingData } = await supabase
      .from("insurance_premiums")
      .select("id, amount")
      .eq("user_id", userId)
      .neq("payment_status", "PAID")
      .not("due_date", "is", null)
      .lte("due_date", thirtyDaysLaterStr);
    console.log("[DASHBOARD] Upcoming premiums data", upcomingData);

    const upcomingPremiumsCount = upcomingData?.length || 0;

    // Calculate total due amount for next 30 days
    const totalDueAmountNext30Days = (upcomingData || []).reduce((sum, item: any) => sum + (Number(item.amount) || 0), 0);

    // Get last scan timestamp
    const { data: connectionData } = await supabase.from("gmail_connections").select("updated_at").eq("user_id", userId).single();
    const { data: latestPremium } = await supabase
      .from("insurance_premiums")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    const lastScanAt = (connectionData as any)?.updated_at || (latestPremium as any)?.created_at || null;
    console.log("[DASHBOARD] Last scan at", lastScanAt);

    // Get upcoming premiums list (next 10, sorted by due_date)
    const { data: upcomingPremiums } = await supabase
      .from("insurance_premiums")
      .select("*")
      .eq("user_id", userId)
      .neq("payment_status", "PAID")
      .not("due_date", "is", null)
      .lte("due_date", thirtyDaysLaterStr)
      .order("due_date", { ascending: true })
      .limit(10);
    console.log("[DASHBOARD] Upcoming premiums (list)", upcomingPremiums);

    // Get paid history (last 10, sorted by received_at)
    const { data: paidHistory } = await supabase
      .from("insurance_premiums")
      .select("*")
      .eq("user_id", userId)
      .eq("payment_status", "PAID")
      .order("received_at", { ascending: false })
      .limit(10);
    console.log("[DASHBOARD] Paid history (list)", paidHistory);

    return NextResponse.json({
      activePoliciesCount: activePoliciesCount || 0,
      upcomingPremiumsCount,
      totalDueAmountNext30Days,
      lastScanAt,
      upcomingPremiums: upcomingPremiums || [],
      paidHistory: paidHistory || [],
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
