import { NextResponse } from "next/server";
import { auth } from "@/auth";

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

    // Return mock data for now to test auth flow
    // TODO: Re-enable Supabase queries once auth is verified working
    const mockData = {
      activePoliciesCount: 0,
      upcomingPremiumsCount: 0,
      totalDueAmountNext30Days: 0,
      lastScanAt: null,
      upcomingPremiums: [],
      paidHistory: [],
    };

    console.log("[DASHBOARD] Returning mock data:", mockData);
    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
