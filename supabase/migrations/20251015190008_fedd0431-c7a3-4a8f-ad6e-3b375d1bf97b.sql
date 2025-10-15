-- Tables finances Phoenix (totalement séparées de E2D et réunions)
CREATE TABLE sport_phoenix_recettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  date_recette DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE sport_phoenix_depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  justificatif_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE sport_phoenix_recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_phoenix_depenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Responsables sportifs peuvent gérer recettes Phoenix"
  ON sport_phoenix_recettes FOR ALL
  USING (has_role('administrateur') OR has_role('responsable_sportif'));

CREATE POLICY "Tous peuvent voir recettes Phoenix"
  ON sport_phoenix_recettes FOR SELECT
  USING (true);

CREATE POLICY "Responsables sportifs peuvent gérer dépenses Phoenix"
  ON sport_phoenix_depenses FOR ALL
  USING (has_role('administrateur') OR has_role('responsable_sportif'));

CREATE POLICY "Tous peuvent voir dépenses Phoenix"
  ON sport_phoenix_depenses FOR SELECT
  USING (true);

-- Triggers
CREATE TRIGGER update_sport_phoenix_recettes_updated_at
  BEFORE UPDATE ON sport_phoenix_recettes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sport_phoenix_depenses_updated_at
  BEFORE UPDATE ON sport_phoenix_depenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();