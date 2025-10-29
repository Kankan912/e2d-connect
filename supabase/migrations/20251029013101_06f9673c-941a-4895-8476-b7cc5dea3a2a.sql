-- Ajouter les colonnes manquantes à la table exercices
ALTER TABLE exercices 
ADD COLUMN IF NOT EXISTS croissance_fond_caisse NUMERIC DEFAULT 5000,
ADD COLUMN IF NOT EXISTS plafond_fond_caisse NUMERIC;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN exercices.croissance_fond_caisse IS 'Croissance mensuelle du fond de caisse pendant l''exercice (en FCFA)';
COMMENT ON COLUMN exercices.plafond_fond_caisse IS 'Plafond optionnel du fond de caisse (en FCFA)';