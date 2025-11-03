/**
 * Types partagés pour le module Cotisations
 * Définit les structures de données standardisées pour les cotisations
 */

export type StatutCotisation = 'paye' | 'en_attente' | 'en_retard' | 'exoneree';

export interface Cotisation {
  id: string;
  membre_id: string;
  type_cotisation_id: string;
  montant: number;
  date_paiement: string | null;
  exercice_id: string | null;
  reunion_id: string | null;
  statut: StatutCotisation;
  notes: string | null;
  justificatif_url: string | null;
  created_at: string | null;
}

export interface CotisationWithRelations extends Cotisation {
  membre: {
    nom: string;
    prenom: string;
  };
  cotisations_types: {
    nom: string;
    description: string | null;
  };
}

export interface TypeCotisation {
  id: string;
  nom: string;
  description: string | null;
  montant_defaut?: number;
  obligatoire?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}
