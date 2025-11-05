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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          actor: string | null
          correlation_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: number
          object_id: string | null
          object_type: string
          op: string
          params: Json | null
          rows_affected: number | null
          scope: string
          sql_statement: string | null
          status: string
          txid: number | null
        }
        Insert: {
          actor?: string | null
          correlation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: number
          object_id?: string | null
          object_type: string
          op: string
          params?: Json | null
          rows_affected?: number | null
          scope: string
          sql_statement?: string | null
          status: string
          txid?: number | null
        }
        Update: {
          actor?: string | null
          correlation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: number
          object_id?: string | null
          object_type?: string
          op?: string
          params?: Json | null
          rows_affected?: number | null
          scope?: string
          sql_statement?: string | null
          status?: string
          txid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hold: {
        Row: {
          created_at: string
          expires_at: string
          hold_id: string
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          hold_id?: string
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          hold_id?: string
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hold_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "hold_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lease: {
        Row: {
          created_at: string
          deposit: number | null
          end_date: string
          lease_id: string
          monthly_rent: number
          start_date: string
          status: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string
          terms: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit?: number | null
          end_date: string
          lease_id?: string
          monthly_rent: number
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string
          terms?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit?: number | null
          end_date?: string
          lease_id?: string
          monthly_rent?: number
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id?: string
          terms?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lease_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      maintenance_request: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["maintenance_category"]
          completed_at: string | null
          created_at: string
          description: string
          estimated_cost: number | null
          priority: number
          request_id: string
          status: Database["public"]["Enums"]["maintenance_status"] | null
          tenant_id: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          category: Database["public"]["Enums"]["maintenance_category"]
          completed_at?: string | null
          created_at?: string
          description: string
          estimated_cost?: number | null
          priority?: number
          request_id?: string
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          tenant_id?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["maintenance_category"]
          completed_at?: string | null
          created_at?: string
          description?: string
          estimated_cost?: number | null
          priority?: number
          request_id?: string
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          tenant_id?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_request_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_request_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "maintenance_request_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          late_fee: number | null
          lease_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          notes: string | null
          paid_at: string | null
          payment_id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          late_fee?: number | null
          lease_id: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          paid_at?: string | null
          payment_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          late_fee?: number | null
          lease_id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          paid_at?: string | null
          payment_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "payment_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "tenant_lease_view"
            referencedColumns: ["lease_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property: {
        Row: {
          address: string
          city: string
          created_at: string
          description: string | null
          image_url: string | null
          latitude: number | null
          longitude: number | null
          owner_id: string | null
          property_id: string
          state: string
          status: Database["public"]["Enums"]["property_status"] | null
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          description?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string | null
          property_id?: string
          state: string
          status?: Database["public"]["Enums"]["property_status"] | null
          type: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          description?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string | null
          property_id?: string
          state?: string
          status?: Database["public"]["Enums"]["property_status"] | null
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_history: {
        Row: {
          created_at: string | null
          date: string
          expenses: number
          id: string
          property_id: string | null
          revenue: number
        }
        Insert: {
          created_at?: string | null
          date: string
          expenses?: number
          id?: string
          property_id?: string | null
          revenue?: number
        }
        Update: {
          created_at?: string | null
          date?: string
          expenses?: number
          id?: string
          property_id?: string | null
          revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_by_property"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "revenue_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_property_view"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "revenue_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["property_id"]
          },
        ]
      }
      tenant: {
        Row: {
          annual_income: number | null
          created_at: string
          credit_score: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          occupation: string | null
          profile_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          annual_income?: number | null
          created_at?: string
          credit_score?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          occupation?: string | null
          profile_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          annual_income?: number | null
          created_at?: string
          credit_score?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          occupation?: string | null
          profile_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unit: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          name: string
          property_id: string
          rent_amount: number
          square_feet: number | null
          status: Database["public"]["Enums"]["unit_status"] | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          name: string
          property_id: string
          rent_amount: number
          square_feet?: number | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          unit_id?: string
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          name?: string
          property_id?: string
          rent_amount?: number
          square_feet?: number | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "monthly_revenue_by_property"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "unit_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_property_view"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "unit_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property"
            referencedColumns: ["property_id"]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      lease_unit_status_mismatches: {
        Row: {
          end_date: string | null
          issue_type: string | null
          lease_id: string | null
          lease_status: Database["public"]["Enums"]["lease_status"] | null
          start_date: string | null
          unit_id: string | null
          unit_name: string | null
          unit_status: Database["public"]["Enums"]["unit_status"] | null
        }
        Relationships: []
      }
      monthly_revenue_by_property: {
        Row: {
          address: string | null
          avg_payment: number | null
          city: string | null
          lease_count: number | null
          month: string | null
          property_id: string | null
          state: string | null
          total_revenue: number | null
        }
        Relationships: []
      }
      ops_maintenance_view: {
        Row: {
          actual_cost: number | null
          category: Database["public"]["Enums"]["maintenance_category"] | null
          city: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          priority: number | null
          property_address: string | null
          request_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          unit_name: string | null
        }
        Relationships: []
      }
      owner_property_view: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          property_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["property_status"] | null
          type: Database["public"]["Enums"]["property_type"] | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          property_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"] | null
          type?: Database["public"]["Enums"]["property_type"] | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          property_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"] | null
          type?: Database["public"]["Enums"]["property_type"] | null
          zip_code?: string | null
        }
        Relationships: []
      }
      tenant_lease_view: {
        Row: {
          address: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          end_date: string | null
          lease_id: string | null
          monthly_rent: number | null
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["lease_status"] | null
          unit_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_late_fee: {
        Args: { amount: number; due_date: string }
        Returns: number
      }
      get_current_isolation_level: { Args: never; Returns: string }
      global_search: {
        Args: { search_limit?: number; search_query: string }
        Returns: {
          relevance: number
          result_id: string
          result_type: string
          route: string
          subtitle: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_operation: {
        Args: {
          p_correlation_id?: string
          p_error?: string
          p_object_id: string
          p_object_type: string
          p_op: string
          p_params?: Json
          p_rows_affected?: number
          p_scope: string
          p_sql?: string
          p_status?: string
        }
        Returns: number
      }
      process_overdue_payments: {
        Args: never
        Returns: {
          late_fee: number
          payment_id: string
          status: string
        }[]
      }
      sp_confirm_lease: {
        Args: {
          p_deposit?: number
          p_end_date: string
          p_start_date: string
          p_tenant_id: string
          p_unit_id: string
        }
        Returns: Json
      }
      sp_place_hold: {
        Args: { p_minutes?: number; p_unit_id: string; p_user_id: string }
        Returns: Json
      }
      sp_post_payment: {
        Args: {
          p_amount: number
          p_method: Database["public"]["Enums"]["payment_method"]
          p_payment_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "tenant" | "ops"
      lease_status: "draft" | "active" | "ended" | "terminated"
      maintenance_category: "plumbing" | "electrical" | "hvac" | "general"
      maintenance_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "cancelled"
      payment_method: "cash" | "card" | "online" | "check"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      property_status: "active" | "inactive" | "maintenance"
      property_type: "residential" | "commercial" | "industrial"
      unit_status: "AVAILABLE" | "HOLD" | "LEASED" | "INACTIVE"
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
      app_role: ["admin", "owner", "tenant", "ops"],
      lease_status: ["draft", "active", "ended", "terminated"],
      maintenance_category: ["plumbing", "electrical", "hvac", "general"],
      maintenance_status: [
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "cancelled",
      ],
      payment_method: ["cash", "card", "online", "check"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      property_status: ["active", "inactive", "maintenance"],
      property_type: ["residential", "commercial", "industrial"],
      unit_status: ["AVAILABLE", "HOLD", "LEASED", "INACTIVE"],
    },
  },
} as const
