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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cotisations: {
        Row: {
          created_at: string | null
          date_paiement: string | null
          id: string
          justificatif_url: string | null
          membre_id: string | null
          montant: number
          notes: string | null
          statut: string | null
          type_cotisation_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_paiement?: string | null
          id?: string
          justificatif_url?: string | null
          membre_id?: string | null
          montant: number
          notes?: string | null
          statut?: string | null
          type_cotisation_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_paiement?: string | null
          id?: string
          justificatif_url?: string | null
          membre_id?: string | null
          montant?: number
          notes?: string | null
          statut?: string | null
          type_cotisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotisations_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_type_cotisation_id_fkey"
            columns: ["type_cotisation_id"]
            isOneToOne: false
            referencedRelation: "cotisations_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cotisations_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          montant_defaut: number | null
          nom: string
          obligatoire: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          montant_defaut?: number | null
          nom: string
          obligatoire?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          montant_defaut?: number | null
          nom?: string
          obligatoire?: boolean | null
        }
        Relationships: []
      }
      membres: {
        Row: {
          created_at: string | null
          date_inscription: string | null
          email: string | null
          est_adherent_phoenix: boolean | null
          est_membre_e2d: boolean | null
          id: string
          nom: string
          photo_url: string | null
          prenom: string
          statut: string | null
          telephone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_inscription?: string | null
          email?: string | null
          est_adherent_phoenix?: boolean | null
          est_membre_e2d?: boolean | null
          id?: string
          nom: string
          photo_url?: string | null
          prenom: string
          statut?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_inscription?: string | null
          email?: string | null
          est_adherent_phoenix?: boolean | null
          est_membre_e2d?: boolean | null
          id?: string
          nom?: string
          photo_url?: string | null
          prenom?: string
          statut?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      membres_roles: {
        Row: {
          created_at: string | null
          id: string
          membre_id: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          membre_id?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          membre_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membres_roles_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membres_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_adherents: {
        Row: {
          adhesion_payee: boolean | null
          created_at: string | null
          date_adhesion: string | null
          date_limite_paiement: string | null
          id: string
          membre_id: string | null
          montant_adhesion: number | null
        }
        Insert: {
          adhesion_payee?: boolean | null
          created_at?: string | null
          date_adhesion?: string | null
          date_limite_paiement?: string | null
          id?: string
          membre_id?: string | null
          montant_adhesion?: number | null
        }
        Update: {
          adhesion_payee?: boolean | null
          created_at?: string | null
          date_adhesion?: string | null
          date_limite_paiement?: string | null
          id?: string
          membre_id?: string | null
          montant_adhesion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_adherents_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_presences: {
        Row: {
          adherent_id: string | null
          created_at: string | null
          date_entrainement: string
          id: string
          present: boolean | null
        }
        Insert: {
          adherent_id?: string | null
          created_at?: string | null
          date_entrainement: string
          id?: string
          present?: boolean | null
        }
        Update: {
          adherent_id?: string | null
          created_at?: string | null
          date_entrainement?: string
          id?: string
          present?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_presences_adherent_id_fkey"
            columns: ["adherent_id"]
            isOneToOne: false
            referencedRelation: "phoenix_adherents"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
