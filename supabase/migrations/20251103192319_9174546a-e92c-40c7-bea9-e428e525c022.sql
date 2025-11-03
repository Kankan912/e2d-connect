-- Correction 1: Ajouter exercice_id et reunion_id à la table prets

-- Ajouter colonne exercice_id
ALTER TABLE public.prets 
ADD COLUMN IF NOT EXISTS exercice_id UUID REFERENCES public.exercices(id);

-- Ajouter colonne reunion_id
ALTER TABLE public.prets 
ADD COLUMN IF NOT EXISTS reunion_id UUID REFERENCES public.reunions(id);

-- Créer index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prets_exercice_id ON public.prets(exercice_id);
CREATE INDEX IF NOT EXISTS idx_prets_reunion_id ON public.prets(reunion_id);

-- Commentaires
COMMENT ON COLUMN public.prets.exercice_id IS 'Référence vers l''exercice auquel le prêt est lié';
COMMENT ON COLUMN public.prets.reunion_id IS 'Référence vers la réunion lors de laquelle le prêt a été accordé';