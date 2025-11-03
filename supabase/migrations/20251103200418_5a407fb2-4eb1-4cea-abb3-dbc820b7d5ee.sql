-- CORRECTION 9: Index pour améliorer performances des requêtes de clôture d'exercice
-- Le statut 'en_retard_annuel' peut être stocké directement dans le VARCHAR existant

CREATE INDEX IF NOT EXISTS idx_cotisations_cloture_exercice 
ON public.cotisations(exercice_id, statut, date_paiement) 
WHERE statut != 'paye';