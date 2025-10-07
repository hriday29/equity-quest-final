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
      admin_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          replied_at: string | null
          reply_content: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          replied_at?: string | null
          reply_content?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          replied_at?: string | null
          reply_content?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string
          current_price: number
          id: string
          is_active: boolean
          market_cap: number | null
          name: string
          pe_ratio: number | null
          previous_close: number | null
          sector: string | null
          symbol: string
          updated_at: string
          week_52_high: number | null
          week_52_low: number | null
          yfinance_ticker: string | null
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          current_price?: number
          id?: string
          is_active?: boolean
          market_cap?: number | null
          name: string
          pe_ratio?: number | null
          previous_close?: number | null
          sector?: string | null
          symbol: string
          updated_at?: string
          week_52_high?: number | null
          week_52_low?: number | null
          yfinance_ticker?: string | null
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          current_price?: number
          id?: string
          is_active?: boolean
          market_cap?: number | null
          name?: string
          pe_ratio?: number | null
          previous_close?: number | null
          sector?: string | null
          symbol?: string
          updated_at?: string
          week_52_high?: number | null
          week_52_low?: number | null
          yfinance_ticker?: string | null
        }
        Relationships: []
      }
      competition_events: {
        Row: {
          created_at: string
          event_name: string
          event_number: number
          event_type: string
          executed_at: string | null
          executed_by: string | null
          headline: string
          id: string
          mechanics: Json
          round_number: number
          scheduled_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_number: number
          event_type: string
          executed_at?: string | null
          executed_by?: string | null
          headline: string
          id?: string
          mechanics: Json
          round_number: number
          scheduled_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_number?: number
          event_type?: string
          executed_at?: string | null
          executed_by?: string | null
          headline?: string
          id?: string
          mechanics?: Json
          round_number?: number
          scheduled_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      competition_rounds: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          id: string
          round_number: number
          start_time: string | null
          status: Database["public"]["Enums"]["round_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          round_number: number
          start_time?: string | null
          status?: Database["public"]["Enums"]["round_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          round_number?: number
          start_time?: string | null
          status?: Database["public"]["Enums"]["round_status"]
          updated_at?: string
        }
        Relationships: []
      }
      competition_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      financial_metrics: {
        Row: {
          asset_id: string
          created_at: string
          data: Json
          fetched_at: string
          id: string
          metric_type: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          data: Json
          fetched_at?: string
          id?: string
          metric_type: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          data?: Json
          fetched_at?: string
          id?: string
          metric_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_metrics_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_warnings: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          margin_level: number
          message: string
          position_id: string | null
          user_id: string
          warning_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          margin_level: number
          message: string
          position_id?: string | null
          user_id: string
          warning_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          margin_level?: number
          message?: string
          position_id?: string | null
          user_id?: string
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "margin_warnings_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_public: boolean
          published_by: string | null
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_public?: boolean
          published_by?: string | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          published_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          asset_id: string
          created_at: string
          executed_at: string | null
          executed_price: number | null
          id: string
          is_buy: boolean
          order_type: Database["public"]["Enums"]["order_type"]
          price: number | null
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          stop_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          executed_at?: string | null
          executed_price?: number | null
          id?: string
          is_buy: boolean
          order_type: Database["public"]["Enums"]["order_type"]
          price?: number | null
          quantity: number
          status?: Database["public"]["Enums"]["order_status"]
          stop_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          executed_at?: string | null
          executed_price?: number | null
          id?: string
          is_buy?: boolean
          order_type?: Database["public"]["Enums"]["order_type"]
          price?: number | null
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          stop_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_history: {
        Row: {
          cash_balance: number
          id: string
          profit_loss: number
          recorded_at: string
          team_code: string | null
          total_value: number
          user_id: string
        }
        Insert: {
          cash_balance: number
          id?: string
          profit_loss: number
          recorded_at?: string
          team_code?: string | null
          total_value: number
          user_id: string
        }
        Update: {
          cash_balance?: number
          id?: string
          profit_loss?: number
          recorded_at?: string
          team_code?: string | null
          total_value?: number
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          cash_balance: number
          created_at: string
          id: string
          profit_loss: number
          profit_loss_percentage: number
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_balance?: number
          created_at?: string
          id?: string
          profit_loss?: number
          profit_loss_percentage?: number
          total_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_balance?: number
          created_at?: string
          id?: string
          profit_loss?: number
          profit_loss_percentage?: number
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          asset_id: string
          average_price: number
          borrowing_cost: number | null
          created_at: string
          current_value: number
          id: string
          initial_margin: number | null
          is_short: boolean | null
          maintenance_margin: number | null
          profit_loss: number
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          average_price: number
          borrowing_cost?: number | null
          created_at?: string
          current_value?: number
          id?: string
          initial_margin?: number | null
          is_short?: boolean | null
          maintenance_margin?: number | null
          profit_loss?: number
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          average_price?: number
          borrowing_cost?: number | null
          created_at?: string
          current_value?: number
          id?: string
          initial_margin?: number | null
          is_short?: boolean | null
          maintenance_margin?: number | null
          profit_loss?: number
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_fluctuation_log: {
        Row: {
          asset_id: string
          change_percentage: number
          created_at: string
          event_id: string | null
          fluctuation_type: string
          id: string
          new_price: number
          old_price: number
        }
        Insert: {
          asset_id: string
          change_percentage: number
          created_at?: string
          event_id?: string | null
          fluctuation_type: string
          id?: string
          new_price: number
          old_price: number
        }
        Update: {
          asset_id?: string
          change_percentage?: number
          created_at?: string
          event_id?: string | null
          fluctuation_type?: string
          id?: string
          new_price?: number
          old_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_fluctuation_log_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_fluctuation_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "competition_events"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          asset_id: string
          changed_by: string | null
          created_at: string
          id: string
          price: number
        }
        Insert: {
          asset_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          price: number
        }
        Update: {
          asset_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          team_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          team_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          team_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          max_members: number | null
          team_name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          max_members?: number | null
          team_name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          max_members?: number | null
          team_name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          asset_id: string
          created_at: string
          fees: number | null
          id: string
          price: number
          quantity: number
          total_value: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          fees?: number | null
          id?: string
          price: number
          quantity: number
          total_value: number
          transaction_type: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          fees?: number | null
          id?: string
          price?: number
          quantity?: number
          total_value?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      is_admin_or_owner: {
        Args: { _user_id: string }
        Returns: boolean
      }
      reset_competition_all_users: {
        Args: { starting_cash?: number }
        Returns: Json
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "user"
      asset_type: "stock" | "commodity" | "index"
      order_status: "pending" | "executed" | "cancelled" | "rejected"
      order_type: "market" | "limit" | "stop_loss"
      round_status: "not_started" | "active" | "paused" | "completed"
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
      app_role: ["owner", "admin", "user"],
      asset_type: ["stock", "commodity", "index"],
      order_status: ["pending", "executed", "cancelled", "rejected"],
      order_type: ["market", "limit", "stop_loss"],
      round_status: ["not_started", "active", "paused", "completed"],
    },
  },
} as const
