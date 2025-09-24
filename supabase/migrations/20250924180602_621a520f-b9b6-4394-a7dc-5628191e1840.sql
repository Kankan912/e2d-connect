-- Ajouter les nouveaux champs pour le module Membres
-- Champ fonction/rôle et équipe Jaune/Rouge

ALTER TABLE public.membres 
ADD COLUMN IF NOT EXISTS fonction text,
ADD COLUMN IF NOT EXISTS equipe_jaune_rouge text CHECK (equipe_jaune_rouge IN ('Jaune', 'Rouge'));

-- Commentaires pour clarifier les nouveaux champs
COMMENT ON COLUMN public.membres.fonction IS 'Fonction/rôle configurable du membre dans l''association';
COMMENT ON COLUMN public.membres.equipe_jaune_rouge IS 'Équipe Jaune ou Rouge pour la gestion sportive interne';