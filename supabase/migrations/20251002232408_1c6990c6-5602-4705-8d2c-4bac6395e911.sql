-- Phase 1: Créer la table notifications_historique
CREATE TABLE IF NOT EXISTS public.notifications_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_notification varchar(50) NOT NULL,
  destinataire_email varchar(255) NOT NULL,
  sujet text NOT NULL,
  contenu text NOT NULL,
  statut varchar(20) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('envoye', 'erreur', 'en_cours')),
  variables_utilisees jsonb DEFAULT '{}'::jsonb,
  date_envoi timestamptz NOT NULL DEFAULT now(),
  erreur_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_historique_date_envoi ON public.notifications_historique(date_envoi DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_historique_statut ON public.notifications_historique(statut);
CREATE INDEX IF NOT EXISTS idx_notifications_historique_type ON public.notifications_historique(type_notification);

-- Enable RLS
ALTER TABLE public.notifications_historique ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins et secrétaires peuvent voir historique notifications"
  ON public.notifications_historique
  FOR SELECT
  USING (has_role('administrateur') OR has_role('secretaire_general'));

CREATE POLICY "Admins et secrétaires peuvent gérer historique notifications"
  ON public.notifications_historique
  FOR ALL
  USING (has_role('administrateur') OR has_role('secretaire_general'))
  WITH CHECK (has_role('administrateur') OR has_role('secretaire_general'));

-- Trigger pour updated_at
CREATE TRIGGER update_notifications_historique_updated_at
  BEFORE UPDATE ON public.notifications_historique
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 2: Ajouter contexte par défaut aux sanctions existantes sans contexte
UPDATE public.sanctions 
SET contexte_sanction = 'reunion' 
WHERE contexte_sanction IS NULL;

-- Phase 2: S'assurer que tous les types de sanctions ont un contexte valide
UPDATE public.types_sanctions 
SET contexte = 'tous' 
WHERE contexte IS NULL OR contexte NOT IN ('sport', 'reunion', 'tous');