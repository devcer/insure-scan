/**
 * Database type definitions for Supabase tables
 * Generated for insurance-scanner project
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Gmail OAuth Connection Record
 * Stores Gmail OAuth connection details for users
 */
export interface GmailConnection {
  id: string;
  user_id: string;
  provider: string;
  email: string;
  access_token: string | null;
  refresh_token: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Gmail Connection Insert Type
 * Used when creating new Gmail connections
 */
export interface GmailConnectionInsert {
  id?: string;
  user_id: string;
  provider?: string;
  email: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Gmail Connection Update Type
 * Used when updating existing Gmail connections
 */
export interface GmailConnectionUpdate {
  user_id?: string;
  provider?: string;
  email?: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: string | null;
  updated_at?: string;
}

/**
 * Payment Status Enum
 */
export type PaymentStatus = "UNKNOWN" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

/**
 * Insurance Premium Record
 * Stores insurance premium information extracted from Gmail messages
 */
export interface InsurancePremium {
  id: string;
  user_id: string;
  gmail_message_id: string;
  gmail_thread_id: string | null;
  policy_key: string;
  insurer_name: string;
  amount: number | null;
  due_date: string | null;
  policy_number: string | null;
  payment_status: PaymentStatus;
  email_subject: string | null;
  from_email: string | null;
  received_at: string | null;
  confidence_score: number;
  raw_preview_text: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insurance Premium Insert Type
 * Used when creating new insurance premium records
 */
export interface InsurancePremiumInsert {
  id?: string;
  user_id: string;
  gmail_message_id: string;
  gmail_thread_id?: string | null;
  policy_key: string;
  insurer_name: string;
  amount?: number | null;
  due_date?: string | null;
  policy_number?: string | null;
  payment_status?: PaymentStatus;
  email_subject?: string | null;
  from_email?: string | null;
  received_at?: string | null;
  confidence_score?: number;
  raw_preview_text?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Insurance Premium Update Type
 * Used when updating existing insurance premium records
 */
export interface InsurancePremiumUpdate {
  user_id?: string;
  gmail_message_id?: string;
  gmail_thread_id?: string | null;
  policy_key?: string;
  insurer_name?: string;
  amount?: number | null;
  due_date?: string | null;
  policy_number?: string | null;
  payment_status?: PaymentStatus;
  email_subject?: string | null;
  from_email?: string | null;
  received_at?: string | null;
  confidence_score?: number;
  raw_preview_text?: string | null;
  updated_at?: string;
}

/**
 * Database Schema Type
 * Complete type definition for all tables
 */
export interface Database {
  public: {
    Tables: {
      gmail_connections: {
        Row: GmailConnection;
        Insert: GmailConnectionInsert;
        Update: GmailConnectionUpdate;
      };
      insurance_premiums: {
        Row: InsurancePremium;
        Insert: InsurancePremiumInsert;
        Update: InsurancePremiumUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      payment_status: PaymentStatus;
    };
  };
}
