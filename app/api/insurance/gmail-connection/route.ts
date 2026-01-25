import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { data: connection } = await supabase
      .from("gmail_connections")
      .select("email, updated_at")
      .eq("user_id", session.userId)
      .single();

    return NextResponse.json({ connection });
  } catch (error) {
    console.error("Error fetching connection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Delete the connection entirely instead of nullifying fields
    const { error } = await supabase.from("gmail_connections").delete().eq("user_id", session.userId);

    if (error) {
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
