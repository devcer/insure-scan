import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// PATCH - Update policy or archive/unarchive
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Get user ID
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", userEmail).single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const policyId = params.id;

    // Verify policy belongs to user
    const { data: existingPolicy, error: verifyError } = await supabase
      .from("insurance_premiums")
      .select("id")
      .eq("id", policyId)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !existingPolicy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Update policy
    const updateData: any = {};
    if (body.insurer_name !== undefined) updateData.insurer_name = body.insurer_name;
    if (body.policy_number !== undefined) updateData.policy_number = body.policy_number;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;
    if (body.email_subject !== undefined) updateData.email_subject = body.email_subject;
    if (body.archived !== undefined) updateData.archived = body.archived;

    // Update policy_key if insurer_name or policy_number changed
    if (body.insurer_name || body.policy_number) {
      const insurer = body.insurer_name || existingPolicy.insurer_name;
      const policyNum = body.policy_number || existingPolicy.policy_number || "manual";
      updateData.policy_key = `${insurer}-${policyNum}`.slice(0, 100);
    }

    const { data: updatedPolicy, error: updateError } = await supabase
      .from("insurance_premiums")
      .update(updateData)
      .eq("id", policyId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ policy: updatedPolicy });
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Soft delete (archive) policy
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Get user ID
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", userEmail).single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const policyId = params.id;

    // Archive the policy (soft delete)
    const { error: deleteError } = await supabase
      .from("insurance_premiums")
      .update({ archived: true })
      .eq("id", policyId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting policy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
