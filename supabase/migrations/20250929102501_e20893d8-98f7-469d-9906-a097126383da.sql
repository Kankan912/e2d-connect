-- Créer les tables manquantes pour le sport
CREATE TABLE IF NOT EXISTS public.sport_phoenix_matchs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_match DATE NOT NULL,
  heure_match TIME,
  equipe_adverse TEXT NOT NULL,
  lieu TEXT,
  score_phoenix INTEGER DEFAULT 0,
  score_adverse INTEGER DEFAULT 0,
  statut VARCHAR DEFAULT 'prevu',
  type_match VARCHAR DEFAULT 'amical',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sport_e2d_recettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  libelle TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  date_recette DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sport_e2d_depenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  libelle TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  justificatif_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer les tables manquantes pour les cotisations
CREATE TABLE IF NOT EXISTS public.cotisations_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR NOT NULL,
  montant_defaut NUMERIC DEFAULT 0,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tables pour les statistiques de matchs
CREATE TABLE IF NOT EXISTS public.match_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL,
  match_type VARCHAR NOT NULL,
  statistiques JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS pour toutes les nouvelles tables
ALTER TABLE public.sport_phoenix_matchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_e2d_recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_e2d_depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_statistics ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour sport_phoenix_matchs
CREATE POLICY "Responsables sportifs peuvent gérer matchs Phoenix" 
ON public.sport_phoenix_matchs 
FOR ALL 
USING (has_role('administrateur') OR has_role('responsable_sportif'))
WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif'));

CREATE POLICY "Tous peuvent voir matchs Phoenix" 
ON public.sport_phoenix_matchs 
FOR SELECT 
USING (true);

-- Politiques RLS pour sport_e2d_recettes
CREATE POLICY "Responsables sportifs gèrent recettes E2D" 
ON public.sport_e2d_recettes 
FOR ALL 
USING (has_role('administrateur') OR has_role('responsable_sportif') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif') OR has_role('tresorier'));

CREATE POLICY "Tous peuvent voir recettes E2D" 
ON public.sport_e2d_recettes 
FOR SELECT 
USING (true);

-- Politiques RLS pour sport_e2d_depenses
CREATE POLICY "Responsables sportifs gèrent dépenses E2D" 
ON public.sport_e2d_depenses 
FOR ALL 
USING (has_role('administrateur') OR has_role('responsable_sportif') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif') OR has_role('tresorier'));

CREATE POLICY "Tous peuvent voir dépenses E2D" 
ON public.sport_e2d_depenses 
FOR SELECT 
USING (true);

-- Politiques RLS pour cotisations_types
CREATE POLICY "Admins peuvent gérer types cotisations" 
ON public.cotisations_types 
FOR ALL 
USING (has_role('administrateur') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

CREATE POLICY "Tous peuvent voir types cotisations" 
ON public.cotisations_types 
FOR SELECT 
USING (true);

-- Politiques RLS pour match_statistics
CREATE POLICY "Responsables sportifs gèrent statistiques matchs" 
ON public.match_statistics 
FOR ALL 
USING (has_role('administrateur') OR has_role('responsable_sportif'))
WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif'));

CREATE POLICY "Tous peuvent voir statistiques matchs" 
ON public.match_statistics 
FOR SELECT 
USING (true);

-- Ajouter les triggers de mise à jour
CREATE TRIGGER update_sport_phoenix_matchs_updated_at
BEFORE UPDATE ON public.sport_phoenix_matchs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cotisations_types_updated_at
BEFORE UPDATE ON public.cotisations_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer quelques données par défaut
INSERT INTO public.cotisations_types (nom, montant_defaut, description) VALUES
('Cotisation mensuelle', 5000, 'Cotisation standard mensuelle'),
('Cotisation adhésion', 2000, 'Frais d''adhésion initial'),
('Cotisation sport', 3000, 'Cotisation pour activités sportives')
ON CONFLICT DO NOTHING;