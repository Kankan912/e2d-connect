-- Ajouter la colonne contexte_aide à la table aides
ALTER TABLE public.aides 
ADD COLUMN contexte_aide character varying NOT NULL DEFAULT 'reunion';

-- Ajouter un commentaire pour clarifier l'usage
COMMENT ON COLUMN public.aides.contexte_aide IS 'Contexte de l''aide: reunion ou sport';

-- Ajouter une contrainte pour valider les valeurs
ALTER TABLE public.aides 
ADD CONSTRAINT check_contexte_aide 
CHECK (contexte_aide IN ('reunion', 'sport'));