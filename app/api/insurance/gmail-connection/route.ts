import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get user ID from email
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: connection } = await supabase
      .from("gmail_connections")
      .select("email, updated_at")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ connection });
  } catch (error) {
    console.error("Error fetching connection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get user ID from email
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the connection entirely instead of nullifying fields
    const { error } = await supabase.from("gmail_connections").delete().eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
