-- Créer la table configurations pour les paramètres système
CREATE TABLE public.configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cle VARCHAR NOT NULL UNIQUE,
  valeur TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configurations ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Administrateurs peuvent gérer les configurations"
ON public.configurations
FOR ALL
USING (has_role('administrateur'));

CREATE POLICY "Tous peuvent voir les configurations"
ON public.configurations
FOR SELECT
USING (true);

-- Créer trigger pour mise à jour automatique de updated_at
CREATE TRIGGER update_configurations_updated_at
BEFORE UPDATE ON public.configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer des configurations par défaut
INSERT INTO public.configurations (cle, valeur, description) VALUES
('taux_interet_pret', '5', 'Taux d''intérêt fixe appliqué aux prêts (%)'),
('duree_pret_mois', '2', 'Durée par défaut d''un prêt en mois'),
('montant_cotisation_huile', '1000', 'Montant par défaut pour la cotisation huile (FCFA)'),
('montant_cotisation_savon', '500', 'Montant par défaut pour la cotisation savon (FCFA)'),
('cotisation_huile_active', 'true', 'Activation de la cotisation huile'),
('cotisation_savon_active', 'true', 'Activation de la cotisation savon'),
('nom_organisation', 'Association E2D', 'Nom officiel de l''organisation'),
('email_organisation', 'contact@e2d.org', 'Email de contact principal'),
('telephone_organisation', '+225 00 00 00 00', 'Numéro de téléphone principal'),
('adresse_organisation', 'Abidjan, Côte d''Ivoire', 'Adresse physique de l''organisation');

-- Ajouter des nouvelles colonnes à la table reunions pour les nouvelles fonctionnalités
ALTER TABLE public.reunions ADD COLUMN IF NOT EXISTS type_reunion VARCHAR(3) DEFAULT 'AGO' CHECK (type_reunion IN ('AGO', 'AGE'));
ALTER TABLE public.reunions ADD COLUMN IF NOT EXISTS sujet TEXT;