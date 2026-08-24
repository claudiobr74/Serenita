/**
 * Tipos gerados a partir do schema do Supabase.
 *
 * NÃO EDITE À MÃO. Regenere após cada migration:
 *
 *     supabase gen types typescript --project-id bsaoujbfanluzggjvhfa > src/server/supabase/database.types.ts
 *
 * Fonte de verdade do schema: `supabase/migrations/`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          clinic_id: string;
          created_at: string;
          id: number;
          ip_address: unknown;
          metadata: Json;
          resource_id: string | null;
          resource_type: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          clinic_id: string;
          created_at?: string;
          id?: never;
          ip_address?: unknown;
          metadata?: Json;
          resource_id?: string | null;
          resource_type: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          clinic_id?: string;
          created_at?: string;
          id?: never;
          ip_address?: unknown;
          metadata?: Json;
          resource_id?: string | null;
          resource_type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clinics: {
        Row: {
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          settings: Json;
          slug: string;
          subscription_plan: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          settings?: Json;
          slug: string;
          subscription_plan?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          settings?: Json;
          slug?: string;
          subscription_plan?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          avatar_url: string | null;
          clinic_id: string;
          created_at: string;
          crp: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["profile_role"];
          settings: Json;
          specializations: string[];
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          avatar_url?: string | null;
          clinic_id: string;
          created_at?: string;
          crp?: string | null;
          full_name: string;
          id: string;
          phone?: string | null;
          role: Database["public"]["Enums"]["profile_role"];
          settings?: Json;
          specializations?: string[];
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          avatar_url?: string | null;
          clinic_id?: string;
          created_at?: string;
          crp?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["profile_role"];
          settings?: Json;
          specializations?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_archived_by_fkey";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      current_clinic_id: { Args: never; Returns: string };
      current_profile_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["profile_role"];
      };
      is_clinical_role: { Args: never; Returns: boolean };
    };
    Enums: {
      profile_role: "psychologist" | "admin" | "secretary";
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
