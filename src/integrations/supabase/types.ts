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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          id: string
          message: string
          read: boolean
          related_scan_result_id: string | null
          user_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_scan_result_id?: string | null
          user_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_scan_result_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_related_scan_result_id_fkey"
            columns: ["related_scan_result_id"]
            isOneToOne: false
            referencedRelation: "screening_results"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_content: {
        Row: {
          content_text: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          scheduled_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content_text: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          scheduled_at?: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content_text?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_health_scores: {
        Row: {
          breakdown: Json | null
          computed_at: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          breakdown?: Json | null
          computed_at?: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          breakdown?: Json | null
          computed_at?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          content: string
          created_at: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"] | null
          source_url: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"] | null
          source_url?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"] | null
          source_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_synced_at: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          provider_user_id: string | null
          provider_username: string | null
          refresh_token_encrypted: string | null
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_synced_at?: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          provider_user_id?: string | null
          provider_username?: string | null
          refresh_token_encrypted?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          provider_user_id?: string | null
          provider_username?: string | null
          refresh_token_encrypted?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monitored_handles: {
        Row: {
          created_at: string
          handle: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          user_id: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          user_id: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          goals: string | null
          id: string
          industry: string | null
          onboarding_complete: boolean
          tone_voice: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          goals?: string | null
          id: string
          industry?: string | null
          onboarding_complete?: boolean
          tone_voice?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          goals?: string | null
          id?: string
          industry?: string | null
          onboarding_complete?: boolean
          tone_voice?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      remediation_requests: {
        Row: {
          created_at: string
          id: string
          request_body: string
          request_type: Database["public"]["Enums"]["request_type"]
          resolved_at: string | null
          scan_result_id: string
          status: Database["public"]["Enums"]["request_status"]
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_body: string
          request_type: Database["public"]["Enums"]["request_type"]
          resolved_at?: string | null
          scan_result_id: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_body?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          resolved_at?: string | null
          scan_result_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remediation_requests_scan_result_id_fkey"
            columns: ["scan_result_id"]
            isOneToOne: false
            referencedRelation: "screening_results"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_results: {
        Row: {
          category: Database["public"]["Enums"]["screening_category"]
          content_item_id: string
          created_at: string
          dismissed: boolean
          id: string
          rationale: string
          reviewed: boolean
          severity: Database["public"]["Enums"]["screening_severity"]
          suggested_action: Database["public"]["Enums"]["suggested_action"]
          suggested_response: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["screening_category"]
          content_item_id: string
          created_at?: string
          dismissed?: boolean
          id?: string
          rationale: string
          reviewed?: boolean
          severity: Database["public"]["Enums"]["screening_severity"]
          suggested_action: Database["public"]["Enums"]["suggested_action"]
          suggested_response?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["screening_category"]
          content_item_id?: string
          created_at?: string
          dismissed?: boolean
          id?: string
          rationale?: string
          reviewed?: boolean
          severity?: Database["public"]["Enums"]["screening_severity"]
          suggested_action?: Database["public"]["Enums"]["suggested_action"]
          suggested_response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_results_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_type:
        | "new_mention"
        | "severity_change"
        | "request_update"
        | "brand_milestone"
      app_role: "admin" | "user"
      content_status: "draft" | "scheduled" | "published"
      content_type: "post" | "caption" | "script" | "bio"
      integration_provider:
        | "x"
        | "instagram"
        | "linkedin"
        | "tiktok"
        | "facebook"
        | "youtube"
      integration_status: "connected" | "disconnected" | "error"
      request_status: "pending" | "submitted" | "resolved" | "denied"
      request_type:
        | "dmca"
        | "defamation"
        | "gdpr"
        | "platform_report"
      screening_category:
        | "harmful_abusive"
        | "reputation_risk"
        | "legitimate_criticism"
        | "positive_on_brand"
        | "neutral"
      screening_severity: "info" | "low" | "medium" | "high"
      social_platform:
        | "x"
        | "instagram"
        | "linkedin"
        | "tiktok"
        | "facebook"
        | "youtube"
        | "other"
      suggested_action:
        | "flag_for_removal"
        | "respond_with_context"
        | "leave_alone"
        | "amplify"
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
      alert_type: [
        "new_mention",
        "severity_change",
        "request_update",
        "brand_milestone",
      ],
      app_role: ["admin", "user"],
      content_status: ["draft", "scheduled", "published"],
      content_type: ["post", "caption", "script", "bio"],
      screening_category: [
        "harmful_abusive",
        "reputation_risk",
        "legitimate_criticism",
        "positive_on_brand",
        "neutral",
      ],
      screening_severity: ["info", "low", "medium", "high"],
      social_platform: [
        "x",
        "instagram",
        "linkedin",
        "tiktok",
        "facebook",
        "youtube",
        "other",
      ],
      suggested_action: [
        "flag_for_removal",
        "respond_with_context",
        "leave_alone",
        "amplify",
      ],
    },
  },
} as const
