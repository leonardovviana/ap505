export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          active_couple_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          active_couple_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          active_couple_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          invite_code?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "couple_members";
            referencedColumns: ["id"];
          },
        ];
      };
      couple_members: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          role: "owner" | "member";
          is_active: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          display_name: string;
          avatar_url?: string | null;
          role?: "owner" | "member";
          is_active?: boolean;
          joined_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          role?: "owner" | "member";
          is_active?: boolean;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          couple_id: string;
          member_id: string;
          created_by: string;
          amount: number;
          description: string;
          category: string;
          payment_method: string | null;
          expense_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          member_id: string;
          created_by: string;
          amount: number;
          description: string;
          category: string;
          payment_method?: string | null;
          expense_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          description?: string;
          category?: string;
          payment_method?: string | null;
          expense_date?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "couple_members";
            referencedColumns: ["id"];
          },
        ];
      };
      incomes: {
        Row: {
          id: string;
          couple_id: string;
          member_id: string;
          created_by: string;
          amount: number;
          description: string;
          kind: "salary" | "extra" | "food_voucher";
          income_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          member_id: string;
          created_by: string;
          amount: number;
          description: string;
          kind?: "salary" | "extra" | "food_voucher";
          income_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          description?: string;
          kind?: "salary" | "extra" | "food_voucher";
          income_date?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incomes_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "couple_members";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          couple_id: string;
          scope: "monthly" | "category";
          category: string;
          amount: number;
          month: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          scope: "monthly" | "category";
          category?: string;
          amount: number;
          month: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          scope?: "monthly" | "category";
          category?: string;
          amount?: number;
          month?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string | null;
          endpoint: string;
          p256dh: string;
          auth_secret: string;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          couple_id?: string | null;
          endpoint: string;
          p256dh: string;
          auth_secret: string;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          couple_id?: string | null;
          p256dh?: string;
          auth_secret?: string;
          user_agent?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      create_couple_with_member: {
        Args: { p_couple_name: string; p_display_name: string };
        Returns: string;
      };
      join_couple_by_invite: {
        Args: { p_invite_code: string; p_display_name: string };
        Returns: string;
      };
      partner_push_subscriptions: {
        Args: { p_couple_id: string };
        Returns: {
          endpoint: string;
          p256dh: string;
          auth_secret: string;
        }[];
      };
    };
  };
};
