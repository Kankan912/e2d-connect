-- Table pour les alertes budgétaires
CREATE TABLE IF NOT EXISTS public.alertes_budgetaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau TEXT NOT NULL CHECK (niveau IN ('critique', 'important', 'info')),
  categorie TEXT NOT NULL CHECK (categorie IN ('cotisations', 'epargnes', 'prets', 'tresorerie', 'aides')),
  titre TEXT NOT NULL,
  description TEXT,
  valeur_actuelle NUMERIC,
  seuil NUMERIC,
  recommandation TEXT,
  resolu BOOLEAN DEFAULT false,
  resolu_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_alertes_niveau ON public.alertes_budgetaires(niveau);
CREATE INDEX IF NOT EXISTS idx_alertes_resolu ON public.alertes_budgetaires(resolu);
CREATE INDEX IF NOT EXISTS idx_alertes_created ON public.alertes_budgetaires(created_at DESC);

-- Table pour les exports programmés
CREATE TABLE IF NOT EXISTS public.exports_programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'excel')),
  frequence TEXT NOT NULL CHECK (frequence IN ('quotidien', 'hebdomadaire', 'mensuel')),
  jour_execution INTEGER,
  actif BOOLEAN DEFAULT true,
  dernier_export TIMESTAMPTZ,
  prochain_export TIMESTAMPTZ,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour updated_at
CREATE TRIGGER update_alertes_budgetaires_updated_at
  BEFORE UPDATE ON public.alertes_budgetaires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exports_programmes_updated_at
  BEFORE UPDATE ON public.exports_programmes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies pour alertes_budgetaires
ALTER TABLE public.alertes_budgetaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin et trésorier lisent alertes"
  ON public.alertes_budgetaires FOR SELECT
  USING (
    has_role('administrateur') OR 
    has_role('tresorier') OR 
    has_role('commissaire_comptes')
  );

CREATE POLICY "Admin et trésorier gèrent alertes"
  ON public.alertes_budgetaires FOR ALL
  USING (
    has_role('administrateur') OR 
    has_role('tresorier')
  );

-- RLS Policies pour exports_programmes
ALTER TABLE public.exports_programmes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gère exports programmés"
  ON public.exports_programmes FOR ALL
  USING (has_role('administrateur'));

CREATE POLICY "Admin et trésorier lisent exports"
  ON public.exports_programmes FOR SELECT
  USING (
    has_role('administrateur') OR 
    has_role('tresorier')
  );