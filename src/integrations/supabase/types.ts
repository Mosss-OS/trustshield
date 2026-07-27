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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
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
