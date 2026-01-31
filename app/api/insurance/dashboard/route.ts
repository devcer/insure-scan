import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    console.log("[DASHBOARD] Starting dashboard request");

    // Validate session
    const session = await auth();
    console.log("[DASHBOARD] Session:", {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      hasError: !!session?.error,
      userEmail: session?.user?.email,
    });

    // Check for refresh token error
    if (session?.error === "RefreshAccessTokenError") {
      console.error("[DASHBOARD] Token refresh failed, user needs to re-authenticate");
      return NextResponse.json({ error: "Authentication expired. Please sign in again." }, { status: 401 });
    }

    if (!session || !session.accessToken) {
      console.warn("[DASHBOARD] 401 Unauthorized: missing accessToken");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[DASHBOARD] ✅ Authentication successful");

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Get user ID
    console.log("[DASHBOARD] Looking up user ID for:", userEmail);
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", userEmail).single();

    if (userError || !user) {
      console.error("[DASHBOARD] User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;
    console.log("[DASHBOARD] ✅ Found user ID:", userId);

    // Query 1: Count active policies (unique policy_keys, not archived)
    const { count: activePoliciesCount, error: policiesError } = await supabase
      .from("insurance_premiums")
      .select("policy_key", { count: "exact", head: true })
      .eq("user_id", userId)
      .or("archived.is.null,archived.eq.false");

    if (policiesError) {
      console.error("[DASHBOARD] Error counting policies:", policiesError);
    }

    // Query 2: Upcoming premiums (due in next 60 days, not paid)
    const today = new Date();
    const next60Days = new Date();
    next60Days.setDate(today.getDate() + 60);

    const { data: upcomingPremiums, error: upcomingError } = await supabase
      .from("insurance_premiums")
      .select("*")
      .eq("user_id", userId)
      .not("due_date", "is", null)
      .gte("due_date", today.toISOString().split("T")[0])
      .lte("due_date", next60Days.toISOString().split("T")[0])
      .in("payment_status", ["UNKNOWN", "PENDING", "OVERDUE"])
      .or("archived.is.null,archived.eq.false")
      .order("due_date", { ascending: true })
      .limit(10);

    if (upcomingError) {
      console.error("[DASHBOARD] Error fetching upcoming:", upcomingError);
    }

    // Query 3: Total due amount in next 30 days
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const { data: dueAmounts, error: dueError } = await supabase
      .from("insurance_premiums")
      .select("amount")
      .eq("user_id", userId)
      .not("due_date", "is", null)
      .not("amount", "is", null)
      .gte("due_date", today.toISOString().split("T")[0])
      .lte("due_date", next30Days.toISOString().split("T")[0])
      .in("payment_status", ["UNKNOWN", "PENDING", "OVERDUE"])
      .or("archived.is.null,archived.eq.false");

    const totalDueAmountNext30Days = dueError ? 0 : (dueAmounts || []).reduce((sum, record) => sum + (Number(record.amount) || 0), 0);

    // Query 4: Paid history (recent 5 paid premiums)
    const { data: paidHistory, error: paidError } = await supabase
      .from("insurance_premiums")
      .select("*")
      .eq("user_id", userId)
      .eq("payment_status", "PAID")
      .or("archived.is.null,archived.eq.false")
      .order("received_at", { ascending: false })
      .limit(5);

    if (paidError) {
      console.error("[DASHBOARD] Error fetching paid history:", paidError);
    }

    // Query 5: Last scan time (most recent created_at)
    const { data: lastScan } = await supabase
      .from("insurance_premiums")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const dashboardData = {
      activePoliciesCount: activePoliciesCount || 0,
      upcomingPremiumsCount: upcomingPremiums?.length || 0,
      totalDueAmountNext30Days: Math.round(totalDueAmountNext30Days),
      lastScanAt: lastScan?.created_at || null,
      upcomingPremiums: upcomingPremiums || [],
      paidHistory: paidHistory || [],
    };

    console.log("[DASHBOARD] Returning data:", {
      activePoliciesCount: dashboardData.activePoliciesCount,
      upcomingPremiumsCount: dashboardData.upcomingPremiumsCount,
      totalDue: dashboardData.totalDueAmountNext30Days,
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
