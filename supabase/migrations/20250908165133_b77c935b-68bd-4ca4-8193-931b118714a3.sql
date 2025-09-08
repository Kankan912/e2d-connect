-- Corriger la structure de la table réunions pour supprimer les colonnes qui posent problème
-- et ajouter une table pour gérer les présences aux réunions

-- Table pour gérer les présences aux réunions
CREATE TABLE IF NOT EXISTS public.reunion_presences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reunion_id UUID NOT NULL REFERENCES public.reunions(id) ON DELETE CASCADE,
  membre_id UUID NOT NULL REFERENCES public.membres(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT false,
  date_presence TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reunion_id, membre_id)
);

-- Politique RLS pour reunion_presences
ALTER TABLE public.reunion_presences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secrétaires peuvent gérer les présences réunions"
ON public.reunion_presences
FOR ALL
USING (has_role('administrateur'::text) OR has_role('secretaire_general'::text))
WITH CHECK (has_role('administrateur'::text) OR has_role('secretaire_general'::text));

CREATE POLICY "Tous peuvent voir les présences réunions"
ON public.reunion_presences
FOR SELECT
USING (true);

-- Fonction pour calculer le montant total d'un prêt avec intérêts
CREATE OR REPLACE FUNCTION calculate_total_pret_amount(montant_initial NUMERIC, taux_interet NUMERIC, reconductions INTEGER DEFAULT 0)
RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Calcul: montant + (montant * taux/100) * (1 + reconductions)
  RETURN montant_initial + (montant_initial * taux_interet / 100) * (1 + COALESCE(reconductions, 0));
END;
$$;