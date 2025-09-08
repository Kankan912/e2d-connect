-- Ajouter une colonne pour le montant payé sur les sanctions
ALTER TABLE public.sanctions 
ADD COLUMN montant_paye NUMERIC DEFAULT 0;

-- Mettre à jour les sanctions déjà payées pour avoir le montant complet
UPDATE public.sanctions 
SET montant_paye = montant 
WHERE statut = 'paye';

-- Créer une fonction pour calculer le statut basé sur le montant payé
CREATE OR REPLACE FUNCTION get_sanction_status(montant_total NUMERIC, montant_paye NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF montant_paye = 0 THEN
    RETURN 'impaye';
  ELSIF montant_paye >= montant_total THEN
    RETURN 'paye';
  ELSE
    RETURN 'partiel';
  END IF;
END;
$$ LANGUAGE plpgsql;