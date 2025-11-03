-- Ajouter la colonne exercice_id à la table cotisations
ALTER TABLE public.cotisations 
ADD COLUMN exercice_id uuid REFERENCES public.exercices(id);

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX idx_cotisations_exercice_id ON public.cotisations(exercice_id);

-- Peupler exercice_id basé sur date_paiement pour les cotisations existantes
UPDATE public.cotisations c
SET exercice_id = e.id
FROM public.exercices e
WHERE c.date_paiement >= e.date_debut 
  AND c.date_paiement <= e.date_fin
  AND c.exercice_id IS NULL;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.cotisations.exercice_id IS 'Référence à l''exercice comptable auquel appartient cette cotisation';