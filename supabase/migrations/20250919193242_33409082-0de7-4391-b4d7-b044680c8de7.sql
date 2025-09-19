-- Créer la table pour les paiements partiels de prêts
CREATE TABLE public.prets_paiements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pret_id UUID NOT NULL REFERENCES public.prets(id) ON DELETE CASCADE,
  montant_paye NUMERIC NOT NULL CHECK (montant_paye > 0),
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  mode_paiement VARCHAR(50) NOT NULL DEFAULT 'especes',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les tarifs de sanctions configurables par catégorie
CREATE TABLE public.sanctions_tarifs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_sanction_id UUID NOT NULL REFERENCES public.sanctions_types(id) ON DELETE CASCADE,
  categorie_membre VARCHAR(50) NOT NULL DEFAULT 'membre_simple',
  montant NUMERIC NOT NULL CHECK (montant >= 0),
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(type_sanction_id, categorie_membre)
);

-- Ajouter colonnes manquantes aux prêts pour le suivi des paiements
ALTER TABLE public.prets 
ADD COLUMN IF NOT EXISTS montant_paye NUMERIC DEFAULT 0 CHECK (montant_paye >= 0),
ADD COLUMN IF NOT EXISTS montant_total_du NUMERIC DEFAULT 0 CHECK (montant_total_du >= 0);

-- Mettre à jour les prêts existants
UPDATE public.prets 
SET montant_paye = 0, 
    montant_total_du = public.calculate_total_pret_amount(montant, taux_interet, reconductions)
WHERE montant_paye IS NULL OR montant_total_du IS NULL;

-- Ajouter colonnes pour liaison réunion aux cotisations et épargnes
ALTER TABLE public.cotisations 
ADD COLUMN IF NOT EXISTS reunion_id UUID REFERENCES public.reunions(id);

ALTER TABLE public.epargnes 
ADD COLUMN IF NOT EXISTS reunion_id UUID REFERENCES public.reunions(id);

-- Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_prets_paiements_pret_id ON public.prets_paiements(pret_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_tarifs_type_categorie ON public.sanctions_tarifs(type_sanction_id, categorie_membre);
CREATE INDEX IF NOT EXISTS idx_cotisations_reunion_id ON public.cotisations(reunion_id);
CREATE INDEX IF NOT EXISTS idx_epargnes_reunion_id ON public.epargnes(reunion_id);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.prets_paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions_tarifs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour prets_paiements
CREATE POLICY "Trésoriers peuvent gérer paiements prêts" 
ON public.prets_paiements 
FOR ALL 
USING (has_role('administrateur') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

CREATE POLICY "Membres voient paiements de leurs prêts" 
ON public.prets_paiements 
FOR SELECT 
USING (pret_id IN (
  SELECT p.id FROM public.prets p 
  JOIN public.membres m ON p.membre_id = m.id 
  WHERE m.user_id = auth.uid()
) OR has_role('administrateur') OR has_role('tresorier'));

-- Politiques RLS pour sanctions_tarifs
CREATE POLICY "Admins peuvent gérer tarifs sanctions" 
ON public.sanctions_tarifs 
FOR ALL 
USING (has_role('administrateur'))
WITH CHECK (has_role('administrateur'));

CREATE POLICY "Tous peuvent voir tarifs sanctions" 
ON public.sanctions_tarifs 
FOR SELECT 
USING (true);

-- Fonction pour calculer le statut d'un prêt
CREATE OR REPLACE FUNCTION public.get_pret_status(montant_total numeric, montant_paye numeric, echeance date)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF montant_paye = 0 THEN
    IF echeance < CURRENT_DATE THEN
      RETURN 'en_retard';
    ELSE
      RETURN 'en_cours';
    END IF;
  ELSIF montant_paye >= montant_total THEN
    RETURN 'rembourse';
  ELSE
    IF echeance < CURRENT_DATE THEN
      RETURN 'retard_partiel';
    ELSE
      RETURN 'partiel';
    END IF;
  END IF;
END;
$$;

-- Trigger pour mettre à jour automatiquement les montants des prêts
CREATE OR REPLACE FUNCTION public.update_pret_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer le montant payé total
  UPDATE public.prets 
  SET montant_paye = (
    SELECT COALESCE(SUM(montant_paye), 0) 
    FROM public.prets_paiements 
    WHERE pret_id = NEW.pret_id
  )
  WHERE id = NEW.pret_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pret_amounts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.prets_paiements
  FOR EACH ROW EXECUTE FUNCTION public.update_pret_amounts();

-- Trigger pour timestamps
CREATE TRIGGER update_prets_paiements_updated_at
  BEFORE UPDATE ON public.prets_paiements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sanctions_tarifs_updated_at
  BEFORE UPDATE ON public.sanctions_tarifs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();