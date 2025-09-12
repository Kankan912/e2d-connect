-- Create the tontine_attributions table for monthly beneficiary management
CREATE TABLE public.tontine_attributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL CHECK (annee >= 2020),
  membre_id UUID NOT NULL,
  montant_attribue NUMERIC NOT NULL CHECK (montant_attribue > 0),
  total_cotisations_mois NUMERIC NOT NULL CHECK (total_cotisations_mois > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mois, annee, membre_id)
);

-- Enable Row Level Security
ALTER TABLE public.tontine_attributions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Secrétaires peuvent gérer les attributions tontine"
ON public.tontine_attributions
FOR ALL
USING (has_role('administrateur') OR has_role('secretaire_general'))
WITH CHECK (has_role('administrateur') OR has_role('secretaire_general'));

CREATE POLICY "Tous peuvent voir les attributions tontine"
ON public.tontine_attributions
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tontine_attributions_updated_at
BEFORE UPDATE ON public.tontine_attributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();