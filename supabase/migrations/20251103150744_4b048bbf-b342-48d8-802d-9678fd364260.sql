-- 1. Créer la nouvelle table avec historique par exercice
CREATE TABLE IF NOT EXISTS public.cotisations_membres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membre_id UUID NOT NULL REFERENCES public.membres(id) ON DELETE CASCADE,
  type_cotisation_id UUID NOT NULL REFERENCES public.cotisations_types(id) ON DELETE CASCADE,
  exercice_id UUID NOT NULL REFERENCES public.exercices(id) ON DELETE CASCADE,
  montant_personnalise NUMERIC NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique : un seul montant actif par membre/type/exercice
  CONSTRAINT unique_cotisation_membre_actif UNIQUE(membre_id, type_cotisation_id, exercice_id) 
    DEFERRABLE INITIALLY DEFERRED
);

-- 2. Index pour performances
CREATE INDEX IF NOT EXISTS idx_cotisations_membres_membre ON public.cotisations_membres(membre_id);
CREATE INDEX IF NOT EXISTS idx_cotisations_membres_exercice ON public.cotisations_membres(exercice_id);
CREATE INDEX IF NOT EXISTS idx_cotisations_membres_type ON public.cotisations_membres(type_cotisation_id);
CREATE INDEX IF NOT EXISTS idx_cotisations_membres_actif ON public.cotisations_membres(actif) WHERE actif = true;

-- 3. RLS Policies
ALTER TABLE public.cotisations_membres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins et trésoriers gèrent cotisations membres"
ON public.cotisations_membres FOR ALL
USING (has_role('administrateur') OR has_role('tresorier'));

CREATE POLICY "Membres voient leurs configs"
ON public.cotisations_membres FOR SELECT
USING (
  membre_id IN (SELECT id FROM membres WHERE user_id = auth.uid())
  OR has_role('administrateur')
  OR has_role('tresorier')
);

-- 4. Trigger auto-update
CREATE TRIGGER update_cotisations_membres_updated_at
  BEFORE UPDATE ON public.cotisations_membres
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Fonction helper pour récupérer le montant actif
CREATE OR REPLACE FUNCTION public.get_montant_cotisation_membre(
  _membre_id UUID,
  _type_cotisation_id UUID,
  _exercice_id UUID
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT montant_personnalise 
     FROM public.cotisations_membres 
     WHERE membre_id = _membre_id 
       AND type_cotisation_id = _type_cotisation_id
       AND exercice_id = _exercice_id
       AND actif = true
     LIMIT 1),
    (SELECT montant_defaut 
     FROM public.cotisations_types 
     WHERE id = _type_cotisation_id
     LIMIT 1),
    0
  );
$$;

COMMENT ON TABLE public.cotisations_membres IS 
'Historique des montants personnalisés par membre, type de cotisation et exercice fiscal';

COMMENT ON FUNCTION public.get_montant_cotisation_membre IS
'Récupère le montant personnalisé actif pour un membre/type/exercice, ou le montant par défaut du type';