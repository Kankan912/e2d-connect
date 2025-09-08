-- Créer table de configuration des bénéficiaires
CREATE TABLE public.beneficiaires_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom character varying NOT NULL,
  description text,
  pourcentage_cotisations numeric DEFAULT 10.0,
  montant_fixe numeric DEFAULT 0,
  mode_calcul character varying NOT NULL DEFAULT 'pourcentage', -- 'pourcentage', 'fixe', 'manuel'
  actif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.beneficiaires_config ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Administrateurs peuvent gérer config bénéficiaires"
ON public.beneficiaires_config
FOR ALL
USING (has_role('administrateur'));

CREATE POLICY "Tous peuvent voir config bénéficiaires"
ON public.beneficiaires_config
FOR SELECT
USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_beneficiaires_config_updated_at
  BEFORE UPDATE ON public.beneficiaires_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer des configurations par défaut
INSERT INTO public.beneficiaires_config (nom, description, pourcentage_cotisations, mode_calcul) VALUES
('Bénéficiaire principal', 'Calcul basé sur 10% des cotisations', 10.0, 'pourcentage'),
('Aide exceptionnelle', 'Montant fixe pour cas spéciaux', 5000, 'fixe');

-- Modifier la table reunion_beneficiaires pour ajouter la référence à la config
ALTER TABLE public.reunion_beneficiaires 
ADD COLUMN config_id uuid REFERENCES public.beneficiaires_config(id);