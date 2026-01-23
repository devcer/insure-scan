/**
 * Example usage of Supabase client and database types
 * This file demonstrates how to use the Supabase integration
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GmailConnection, GmailConnectionInsert, InsurancePremium, InsurancePremiumInsert, PaymentStatus } from "@/types/database";

/**
 * Example: Store Gmail OAuth connection
 */
export async function storeGmailConnection(
  userId: string,
  email: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: Date
): Promise<GmailConnection | null> {
  const supabase = createSupabaseServerClient();

  const connection: GmailConnectionInsert = {
    user_id: userId,
    email,
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate.toISOString(),
  };

  const { data, error } = await supabase
    .from("gmail_connections")
    .upsert(connection, {
      onConflict: "user_id,provider",
    })
    .select()
    .single();

  if (error) {
    console.error("Error storing Gmail connection:", error);
    return null;
  }

  return data;
}

/**
 * Example: Get Gmail connection for user
 */
export async function getGmailConnection(userId: string): Promise<GmailConnection | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.from("gmail_connections").select("*").eq("user_id", userId).eq("provider", "google").single();

  if (error) {
    console.error("Error fetching Gmail connection:", error);
    return null;
  }

  return data;
}

/**
 * Example: Create insurance premium record
 */
export async function createInsurancePremium(
  userId: string,
  gmailMessageId: string,
  policyKey: string,
  insurerName: string,
  amount: number,
  dueDate: Date,
  emailData: {
    subject: string;
    from: string;
    receivedAt: Date;
  }
): Promise<InsurancePremium | null> {
  const supabase = createSupabaseServerClient();

  const premium: InsurancePremiumInsert = {
    user_id: userId,
    gmail_message_id: gmailMessageId,
    policy_key: policyKey,
    insurer_name: insurerName,
    amount,
    due_date: dueDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
    payment_status: "PENDING",
    email_subject: emailData.subject,
    from_email: emailData.from,
    received_at: emailData.receivedAt.toISOString(),
    confidence_score: 0.85,
  };

  const { data, error } = await supabase.from("insurance_premiums").insert(premium).select().single();

  if (error) {
    console.error("Error creating insurance premium:", error);
    return null;
  }

  return data;
}

/**
 * Example: Get all premiums for user
 */
export async function getUserPremiums(userId: string): Promise<InsurancePremium[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("insurance_premiums")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching user premiums:", error);
    return [];
  }

  return data || [];
}

/**
 * Example: Get upcoming premiums (next 30 days)
 */
export async function getUpcomingPremiums(userId: string): Promise<InsurancePremium[]> {
  const supabase = createSupabaseServerClient();

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("insurance_premiums")
    .select("*")
    .eq("user_id", userId)
    .eq("payment_status", "PENDING")
    .gte("due_date", today)
    .lte("due_date", thirtyDaysFromNow)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming premiums:", error);
    return [];
  }

  return data || [];
}

/**
 * Example: Update premium payment status
 */
export async function updatePremiumStatus(premiumId: string, status: PaymentStatus): Promise<InsurancePremium | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("insurance_premiums")
    .update({
      payment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", premiumId)
    .select()
    .single();

  if (error) {
    console.error("Error updating premium status:", error);
    return null;
  }

  return data;
}

/**
 * Example: Get premium statistics for user
 */
export async function getPremiumStats(userId: string): Promise<{
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalAmount: number;
}> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.from("insurance_premiums").select("payment_status, amount").eq("user_id", userId);

  if (error || !data) {
    console.error("Error fetching premium stats:", error);
    return { total: 0, pending: 0, paid: 0, overdue: 0, totalAmount: 0 };
  }

  const stats = data.reduce(
    (acc, premium) => {
      acc.total += 1;
      if (premium.payment_status === "PENDING") acc.pending += 1;
      if (premium.payment_status === "PAID") acc.paid += 1;
      if (premium.payment_status === "OVERDUE") acc.overdue += 1;
      if (premium.amount) acc.totalAmount += Number(premium.amount);
      return acc;
    },
    { total: 0, pending: 0, paid: 0, overdue: 0, totalAmount: 0 }
  );

  return stats;
}

/**
 * Example: Search premiums by insurer name
 */
export async function searchPremiumsByInsurer(userId: string, insurerName: string): Promise<InsurancePremium[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("insurance_premiums")
    .select("*")
    .eq("user_id", userId)
    .ilike("insurer_name", `%${insurerName}%`)
    .order("due_date", { ascending: false });

  if (error) {
    console.error("Error searching premiums:", error);
    return [];
  }

  return data || [];
}
