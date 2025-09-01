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
      aides: {
        Row: {
          beneficiaire_id: string
          created_at: string
          date_allocation: string
          id: string
          justificatif_url: string | null
          montant: number
          notes: string | null
          statut: string
          type_aide_id: string
        }
        Insert: {
          beneficiaire_id: string
          created_at?: string
          date_allocation?: string
          id?: string
          justificatif_url?: string | null
          montant: number
          notes?: string | null
          statut?: string
          type_aide_id: string
        }
        Update: {
          beneficiaire_id?: string
          created_at?: string
          date_allocation?: string
          id?: string
          justificatif_url?: string | null
          montant?: number
          notes?: string | null
          statut?: string
          type_aide_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_aides_beneficiaire"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_aides_type_aide"
            columns: ["type_aide_id"]
            isOneToOne: false
            referencedRelation: "aides_types"
            referencedColumns: ["id"]
          },
        ]
      }
      aides_types: {
        Row: {
          created_at: string
          delai_remboursement: number | null
          description: string | null
          id: string
          mode_repartition: string
          montant_defaut: number | null
          nom: string
        }
        Insert: {
          created_at?: string
          delai_remboursement?: number | null
          description?: string | null
          id?: string
          mode_repartition?: string
          montant_defaut?: number | null
          nom: string
        }
        Update: {
          created_at?: string
          delai_remboursement?: number | null
          description?: string | null
          id?: string
          mode_repartition?: string
          montant_defaut?: number | null
          nom?: string
        }
        Relationships: []
      }
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
      epargnes: {
        Row: {
          created_at: string
          date_depot: string
          exercice_id: string | null
          id: string
          membre_id: string
          montant: number
          notes: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_depot?: string
          exercice_id?: string | null
          id?: string
          membre_id: string
          montant: number
          notes?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_depot?: string
          exercice_id?: string | null
          id?: string
          membre_id?: string
          montant?: number
          notes?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_epargnes_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      exercices: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string
          id: string
          nom: string
          statut: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin: string
          id?: string
          nom: string
          statut?: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string
          id?: string
          nom?: string
          statut?: string
        }
        Relationships: []
      }
      fichiers_joint: {
        Row: {
          created_at: string
          entite_id: string
          entite_type: string
          id: string
          nom_fichier: string
          taille_fichier: number | null
          type_mime: string | null
          uploaded_by: string | null
          url_fichier: string
        }
        Insert: {
          created_at?: string
          entite_id: string
          entite_type: string
          id?: string
          nom_fichier: string
          taille_fichier?: number | null
          type_mime?: string | null
          uploaded_by?: string | null
          url_fichier: string
        }
        Update: {
          created_at?: string
          entite_id?: string
          entite_type?: string
          id?: string
          nom_fichier?: string
          taille_fichier?: number | null
          type_mime?: string | null
          uploaded_by?: string | null
          url_fichier?: string
        }
        Relationships: []
      }
      historique_connexion: {
        Row: {
          date_connexion: string
          id: string
          ip_address: unknown | null
          statut: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          date_connexion?: string
          id?: string
          ip_address?: unknown | null
          statut?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          date_connexion?: string
          id?: string
          ip_address?: unknown | null
          statut?: string
          user_agent?: string | null
          user_id?: string | null
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
          telephone: string
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
          telephone: string
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
          telephone?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      membres_cotisations_config: {
        Row: {
          created_at: string
          id: string
          membre_id: string
          montant_personnalise: number
          type_cotisation_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          membre_id: string
          montant_personnalise: number
          type_cotisation_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          membre_id?: string
          montant_personnalise?: number
          type_cotisation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membres_cotisations_config_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membres_cotisations_config_type_cotisation_id_fkey"
            columns: ["type_cotisation_id"]
            isOneToOne: false
            referencedRelation: "cotisations_types"
            referencedColumns: ["id"]
          },
        ]
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
      prets: {
        Row: {
          avaliste_id: string | null
          created_at: string
          date_pret: string
          echeance: string
          id: string
          justificatif_url: string | null
          membre_id: string
          montant: number
          notes: string | null
          reconductions: number | null
          statut: string
          taux_interet: number | null
          updated_at: string
        }
        Insert: {
          avaliste_id?: string | null
          created_at?: string
          date_pret?: string
          echeance: string
          id?: string
          justificatif_url?: string | null
          membre_id: string
          montant: number
          notes?: string | null
          reconductions?: number | null
          statut?: string
          taux_interet?: number | null
          updated_at?: string
        }
        Update: {
          avaliste_id?: string | null
          created_at?: string
          date_pret?: string
          echeance?: string
          id?: string
          justificatif_url?: string | null
          membre_id?: string
          montant?: number
          notes?: string | null
          reconductions?: number | null
          statut?: string
          taux_interet?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prets_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prets_avaliste_id_fkey"
            columns: ["avaliste_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      rapports_seances: {
        Row: {
          created_at: string
          id: string
          resolution: string | null
          reunion_id: string
          sujet: string
        }
        Insert: {
          created_at?: string
          id?: string
          resolution?: string | null
          reunion_id: string
          sujet: string
        }
        Update: {
          created_at?: string
          id?: string
          resolution?: string | null
          reunion_id?: string
          sujet?: string
        }
        Relationships: []
      }
      reunions: {
        Row: {
          compte_rendu_url: string | null
          created_at: string
          date_reunion: string
          id: string
          lieu_description: string | null
          lieu_membre_id: string | null
          ordre_du_jour: string | null
          statut: string
        }
        Insert: {
          compte_rendu_url?: string | null
          created_at?: string
          date_reunion: string
          id?: string
          lieu_description?: string | null
          lieu_membre_id?: string | null
          ordre_du_jour?: string | null
          statut?: string
        }
        Update: {
          compte_rendu_url?: string | null
          created_at?: string
          date_reunion?: string
          id?: string
          lieu_description?: string | null
          lieu_membre_id?: string | null
          ordre_du_jour?: string | null
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reunions_lieu_membre"
            columns: ["lieu_membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission: string
          resource: string
          role_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission: string
          resource: string
          role_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission?: string
          resource?: string
          role_id?: string
        }
        Relationships: []
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
      sanctions: {
        Row: {
          created_at: string
          date_sanction: string
          id: string
          membre_id: string
          montant: number
          motif: string | null
          statut: string
          type_sanction_id: string
        }
        Insert: {
          created_at?: string
          date_sanction?: string
          id?: string
          membre_id: string
          montant: number
          motif?: string | null
          statut?: string
          type_sanction_id: string
        }
        Update: {
          created_at?: string
          date_sanction?: string
          id?: string
          membre_id?: string
          montant?: number
          motif?: string | null
          statut?: string
          type_sanction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sanctions_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sanctions_type"
            columns: ["type_sanction_id"]
            isOneToOne: false
            referencedRelation: "sanctions_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions_types: {
        Row: {
          categorie: string
          created_at: string
          description: string | null
          id: string
          montant: number
          nom: string
        }
        Insert: {
          categorie: string
          created_at?: string
          description?: string | null
          id?: string
          montant: number
          nom: string
        }
        Update: {
          categorie?: string
          created_at?: string
          description?: string | null
          id?: string
          montant?: number
          nom?: string
        }
        Relationships: []
      }
      sport_e2d_activites: {
        Row: {
          created_at: string
          date_activite: string
          id: string
          lieu: string | null
          notes: string | null
          participants_count: number | null
        }
        Insert: {
          created_at?: string
          date_activite: string
          id?: string
          lieu?: string | null
          notes?: string | null
          participants_count?: number | null
        }
        Update: {
          created_at?: string
          date_activite?: string
          id?: string
          lieu?: string | null
          notes?: string | null
          participants_count?: number | null
        }
        Relationships: []
      }
      sport_e2d_config: {
        Row: {
          couleur_maillot: string | null
          created_at: string
          entraineur: string | null
          horaire_entrainement: string | null
          id: string
          lieu_entrainement: string | null
          nom_equipe: string
          updated_at: string
        }
        Insert: {
          couleur_maillot?: string | null
          created_at?: string
          entraineur?: string | null
          horaire_entrainement?: string | null
          id?: string
          lieu_entrainement?: string | null
          nom_equipe?: string
          updated_at?: string
        }
        Update: {
          couleur_maillot?: string | null
          created_at?: string
          entraineur?: string | null
          horaire_entrainement?: string | null
          id?: string
          lieu_entrainement?: string | null
          nom_equipe?: string
          updated_at?: string
        }
        Relationships: []
      }
      sport_e2d_depenses: {
        Row: {
          created_at: string
          date_depense: string
          id: string
          justificatif_url: string | null
          libelle: string
          montant: number
        }
        Insert: {
          created_at?: string
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle: string
          montant: number
        }
        Update: {
          created_at?: string
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle?: string
          montant?: number
        }
        Relationships: []
      }
      sport_e2d_matchs: {
        Row: {
          created_at: string
          date_match: string
          equipe_adverse: string
          heure_match: string | null
          id: string
          lieu: string | null
          notes: string | null
          score_adverse: number | null
          score_e2d: number | null
          statut: string
          type_match: string
        }
        Insert: {
          created_at?: string
          date_match?: string
          equipe_adverse: string
          heure_match?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          score_adverse?: number | null
          score_e2d?: number | null
          statut?: string
          type_match?: string
        }
        Update: {
          created_at?: string
          date_match?: string
          equipe_adverse?: string
          heure_match?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          score_adverse?: number | null
          score_e2d?: number | null
          statut?: string
          type_match?: string
        }
        Relationships: []
      }
      sport_e2d_recettes: {
        Row: {
          created_at: string
          date_recette: string
          id: string
          libelle: string
          montant: number
          notes: string | null
        }
        Insert: {
          created_at?: string
          date_recette?: string
          id?: string
          libelle: string
          montant: number
          notes?: string | null
        }
        Update: {
          created_at?: string
          date_recette?: string
          id?: string
          libelle?: string
          montant?: number
          notes?: string | null
        }
        Relationships: []
      }
      sport_phoenix_config: {
        Row: {
          created_at: string
          duree_adhesion_mois: number | null
          id: string
          montant_adhesion: number | null
          nom_club: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duree_adhesion_mois?: number | null
          id?: string
          montant_adhesion?: number | null
          nom_club?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duree_adhesion_mois?: number | null
          id?: string
          montant_adhesion?: number | null
          nom_club?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { role_name: string }
        Returns: boolean
      }
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
