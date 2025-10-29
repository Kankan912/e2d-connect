// Types spécifiques pour le module Phoenix

export interface PhoenixComposition {
  id: string;
  match_id: string;
  membre_id: string;
  equipe_nom: string;
  poste: string | null;
  est_capitaine: boolean;
  created_at: string;
  membres?: {
    nom: string;
    prenom: string;
  };
}

export interface PhoenixMatch {
  id: string;
  date_match: string;
  heure_match: string | null;
  equipe_adverse: string;
  score_jaune: number;
  score_rouge: number;
  statut: string;
  notes: string | null;
}

export interface PhoenixAdherent {
  id: string;
  membre_id: string;
  adhesion_payee: boolean;
  montant_adhesion: number | null;
  date_adhesion: string | null;
  date_limite_paiement: string | null;
  created_at: string;
  membres?: {
    id: string;
    nom: string;
    prenom: string;
  };
}
