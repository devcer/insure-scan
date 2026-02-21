export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      family_audit_entries: {
        Row: {
          activity: Database["public"]["Enums"]["audit_activity"]
          details: Json
          family_member_id: string | null
          id: string
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          vault_owner_id: string
        }
        Insert: {
          activity: Database["public"]["Enums"]["audit_activity"]
          details?: Json
          family_member_id?: string | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          vault_owner_id: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["audit_activity"]
          details?: Json
          family_member_id?: string | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          vault_owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_audit_entries_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_audit_entries_vault_owner_id_fkey"
            columns: ["vault_owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          permissions: Database["public"]["Enums"]["permission_level"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          vault_owner_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          permissions: Database["public"]["Enums"]["permission_level"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          vault_owner_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          permissions?: Database["public"]["Enums"]["permission_level"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          vault_owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_vault_owner_id_fkey"
            columns: ["vault_owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          email: string
          id: string
          last_access_at: string | null
          permissions: Database["public"]["Enums"]["permission_level"]
          specific_policy_ids: string[] | null
          status: Database["public"]["Enums"]["family_member_status"]
          vault_owner_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_access_at?: string | null
          permissions: Database["public"]["Enums"]["permission_level"]
          specific_policy_ids?: string[] | null
          status?: Database["public"]["Enums"]["family_member_status"]
          vault_owner_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_access_at?: string | null
          permissions?: Database["public"]["Enums"]["permission_level"]
          specific_policy_ids?: string[] | null
          status?: Database["public"]["Enums"]["family_member_status"]
          vault_owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_vault_owner_id_fkey"
            columns: ["vault_owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_security_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["security_alert_type"]
          description: string
          family_member_id: string
          id: string
          resolved: boolean
          severity: Database["public"]["Enums"]["alert_severity"]
          timestamp: string
          vault_owner_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["security_alert_type"]
          description: string
          family_member_id: string
          id?: string
          resolved?: boolean
          severity: Database["public"]["Enums"]["alert_severity"]
          timestamp?: string
          vault_owner_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["security_alert_type"]
          description?: string
          family_member_id?: string
          id?: string
          resolved?: boolean
          severity?: Database["public"]["Enums"]["alert_severity"]
          timestamp?: string
          vault_owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_security_alerts_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_security_alerts_vault_owner_id_fkey"
            columns: ["vault_owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string
          expiry_date: string | null
          id: string
          provider: string | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email: string
          expiry_date?: string | null
          id?: string
          provider?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string
          expiry_date?: string | null
          id?: string
          provider?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      insurance_premiums: {
        Row: {
          amount: number | null
          archived: boolean
          confidence_score: number | null
          created_at: string | null
          due_date: string | null
          email_subject: string | null
          from_email: string | null
          gmail_message_id: string
          gmail_thread_id: string | null
          id: string
          insurer_name: string
          payment_status: string
          policy_key: string
          policy_number: string | null
          premium_frequency: string | null
          raw_preview_text: string | null
          received_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          archived?: boolean
          confidence_score?: number | null
          created_at?: string | null
          due_date?: string | null
          email_subject?: string | null
          from_email?: string | null
          gmail_message_id: string
          gmail_thread_id?: string | null
          id?: string
          insurer_name: string
          payment_status?: string
          policy_key: string
          policy_number?: string | null
          premium_frequency?: string | null
          raw_preview_text?: string | null
          received_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          archived?: boolean
          confidence_score?: number | null
          created_at?: string | null
          due_date?: string | null
          email_subject?: string | null
          from_email?: string | null
          gmail_message_id?: string
          gmail_thread_id?: string | null
          id?: string
          insurer_name?: string
          payment_status?: string
          policy_key?: string
          policy_number?: string | null
          premium_frequency?: string | null
          raw_preview_text?: string | null
          received_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          image: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          image?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          image?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_severity: "low" | "medium" | "high"
      audit_activity:
        | "invitation_sent"
        | "invitation_accepted"
        | "invitation_revoked"
        | "policy_accessed"
        | "permissions_changed"
        | "access_revoked"
        | "suspicious_activity_detected"
      family_member_status: "active" | "suspended" | "revoked"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      permission_level: "view_all" | "view_specific"
      security_alert_type:
        | "unusual_access_pattern"
        | "multiple_failed_attempts"
        | "access_from_new_location"
        | "bulk_policy_access"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: {
        low: "low" as const,
        medium: "medium" as const,
        high: "high" as const,
      },
      audit_activity: {
        invitation_sent: "invitation_sent" as const,
        invitation_accepted: "invitation_accepted" as const,
        invitation_revoked: "invitation_revoked" as const,
        policy_accessed: "policy_accessed" as const,
        permissions_changed: "permissions_changed" as const,
        access_revoked: "access_revoked" as const,
        suspicious_activity_detected: "suspicious_activity_detected" as const,
      },
      family_member_status: {
        active: "active" as const,
        suspended: "suspended" as const,
        revoked: "revoked" as const,
      },
      invitation_status: {
        pending: "pending" as const,
        accepted: "accepted" as const,
        expired: "expired" as const,
        revoked: "revoked" as const,
      },
      permission_level: {
        view_all: "view_all" as const,
        view_specific: "view_specific" as const,
      },
      security_alert_type: {
        unusual_access_pattern: "unusual_access_pattern" as const,
        multiple_failed_attempts: "multiple_failed_attempts" as const,
        access_from_new_location: "access_from_new_location" as const,
        bulk_policy_access: "bulk_policy_access" as const,
      },
    },
  },
} as const
