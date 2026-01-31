import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST - Create new policy
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Get user ID
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", userEmail).single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { insurer_name, policy_number, amount, due_date, payment_status, email_subject } = body;

    // Generate policy_key from insurer and policy number
    const policy_key = `${insurer_name}-${policy_number || "manual"}`.slice(0, 100);

    // Insert new policy
    const { data: newPolicy, error: insertError } = await supabase
      .from("insurance_premiums")
      .insert({
        user_id: user.id,
        gmail_message_id: `manual-${Date.now()}`, // Manual entries get a unique ID
        insurer_name,
        policy_number,
        amount,
        due_date,
        payment_status: payment_status || "UNKNOWN",
        email_subject,
        policy_key,
        from_email: userEmail, // Manual entry
        received_at: new Date().toISOString(),
        confidence_score: 1.0, // Manual entry is 100% confident
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ policy: newPolicy }, { status: 201 });
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
