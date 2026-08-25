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
          address: string | null;
          cnpj: string | null;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["clinic_kind"] | null;
          logo_url: string | null;
          name: string;
          onboarding_completed_at: string | null;
          patient_seq: number;
          phone: string | null;
          settings: Json;
          slug: string;
          subscription_plan: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          cnpj?: string | null;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["clinic_kind"] | null;
          logo_url?: string | null;
          name: string;
          onboarding_completed_at?: string | null;
          patient_seq?: number;
          phone?: string | null;
          settings?: Json;
          slug: string;
          subscription_plan?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          cnpj?: string | null;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["clinic_kind"] | null;
          logo_url?: string | null;
          name?: string;
          onboarding_completed_at?: string | null;
          patient_seq?: number;
          phone?: string | null;
          settings?: Json;
          slug?: string;
          subscription_plan?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          clinic_id: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["profile_role"];
          token_hash: string;
        };
        Insert: {
          accepted_at?: string | null;
          clinic_id: string;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by?: string | null;
          revoked_at?: string | null;
          role: Database["public"]["Enums"]["profile_role"];
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          clinic_id?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["profile_role"];
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      patient_clinical_intake: {
        Row: {
          clinic_id: string;
          created_at: string;
          created_by: string | null;
          patient_id: string;
          suggested_frequency: string | null;
          therapeutic_approach: string | null;
          updated_at: string;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          created_by?: string | null;
          patient_id: string;
          suggested_frequency?: string | null;
          therapeutic_approach?: string | null;
          updated_at?: string;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          created_by?: string | null;
          patient_id?: string;
          suggested_frequency?: string | null;
          therapeutic_approach?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patient_clinical_intake_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_clinical_intake_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: true;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      patient_clinical_record: {
        Row: {
          clinic_id: string;
          content: string;
          created_at: string;
          id: string;
          patient_id: string;
          section: Database["public"]["Enums"]["clinical_record_section"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          clinic_id: string;
          content?: string;
          created_at?: string;
          id?: string;
          patient_id: string;
          section: Database["public"]["Enums"]["clinical_record_section"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          clinic_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          patient_id?: string;
          section?: Database["public"]["Enums"]["clinical_record_section"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patient_clinical_record_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_clinical_record_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_clinical_record_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      patient_clinical_record_revision: {
        Row: {
          author_id: string | null;
          clinic_id: string;
          content: string;
          created_at: string;
          id: string;
          patient_id: string;
          record_id: string;
        };
        Insert: {
          author_id?: string | null;
          clinic_id: string;
          content: string;
          created_at?: string;
          id?: string;
          patient_id: string;
          record_id: string;
        };
        Update: {
          author_id?: string | null;
          clinic_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          patient_id?: string;
          record_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patient_clinical_record_revision_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_clinical_record_revision_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_clinical_record_revision_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_clinical_record_revision_record_id_fkey";
            columns: ["record_id"];
            isOneToOne: false;
            referencedRelation: "patient_clinical_record";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          assigned_psychologist_id: string | null;
          birth_date: string | null;
          clinic_id: string;
          cpf: string | null;
          created_at: string;
          created_by: string | null;
          display_code: string;
          email: string | null;
          full_name: string;
          id: string;
          ai_consent_at: string | null;
          modality: Database["public"]["Enums"]["care_modality"] | null;
          occupation: string | null;
          phone: string | null;
          status: Database["public"]["Enums"]["patient_status"];
          tcle_accepted_at: string | null;
          updated_at: string;
        };
        Insert: {
          assigned_psychologist_id?: string | null;
          birth_date?: string | null;
          clinic_id: string;
          cpf?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_code: string;
          email?: string | null;
          full_name: string;
          id?: string;
          ai_consent_at?: string | null;
          modality?: Database["public"]["Enums"]["care_modality"] | null;
          occupation?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["patient_status"];
          tcle_accepted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          assigned_psychologist_id?: string | null;
          birth_date?: string | null;
          clinic_id?: string;
          cpf?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_code?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          ai_consent_at?: string | null;
          modality?: Database["public"]["Enums"]["care_modality"] | null;
          occupation?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["patient_status"];
          tcle_accepted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patients_assigned_psychologist_id_fkey";
            columns: ["assigned_psychologist_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patients_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: { convite_token: string; nome_completo: string };
        Returns: string;
      };
      current_clinic_id: { Args: never; Returns: string };
      current_profile_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["profile_role"];
      };
      invitation_preview: {
        Args: { convite_token: string };
        Returns: {
          clinica: string;
          papel: Database["public"]["Enums"]["profile_role"];
          email: string;
          expirado: boolean;
        }[];
      };
      is_clinical_role: { Args: never; Returns: boolean };
    };
    Enums: {
      care_modality: "in_person" | "online";
      clinic_kind: "individual" | "multi_professional";
      clinical_record_section:
        | "demographic_identification"
        | "initial_complaint"
        | "clinical_family_history"
        | "initial_diagnostic_assessment";
      patient_status: "active" | "archived" | "discharged";
      profile_role: "psychologist" | "admin" | "secretary";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      care_modality: ["in_person", "online"],
      clinic_kind: ["individual", "multi_professional"],
      clinical_record_section: [
        "demographic_identification",
        "initial_complaint",
        "clinical_family_history",
        "initial_diagnostic_assessment",
      ],
      patient_status: ["active", "archived", "discharged"],
      profile_role: ["psychologist", "admin", "secretary"],
    },
  },
} as const;
