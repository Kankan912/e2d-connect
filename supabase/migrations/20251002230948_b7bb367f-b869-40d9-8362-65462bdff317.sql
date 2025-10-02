-- Phase 1: Ajouter colonnes contexte et categorie à sanctions_types
ALTER TABLE types_sanctions 
ADD COLUMN IF NOT EXISTS contexte VARCHAR CHECK (contexte IN ('sport', 'reunion', 'tous')) DEFAULT 'tous',
ADD COLUMN IF NOT EXISTS categorie VARCHAR;

COMMENT ON COLUMN types_sanctions.contexte IS 'Contexte de la sanction: sport, reunion, ou tous';
COMMENT ON COLUMN types_sanctions.categorie IS 'Sous-catégorie: carton_jaune, carton_rouge, absence, retard, etc.';

-- Phase 3: Créer table tontine_configurations
CREATE TABLE IF NOT EXISTS tontine_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cle VARCHAR NOT NULL UNIQUE,
  valeur TEXT NOT NULL,
  type_valeur VARCHAR CHECK (type_valeur IN ('montant', 'pourcentage', 'booleen', 'texte')),
  categorie VARCHAR CHECK (categorie IN ('cotisations', 'investissements', 'regles', 'epargnes')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tontine_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour tontine_configurations
CREATE POLICY "Administrateurs peuvent gérer config tontine"
ON tontine_configurations
FOR ALL
USING (has_role('administrateur'));

CREATE POLICY "Tous peuvent voir config tontine"
ON tontine_configurations
FOR SELECT
USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_tontine_configurations_updated_at
BEFORE UPDATE ON tontine_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Données initiales pour tontine_configurations
INSERT INTO tontine_configurations (cle, valeur, type_valeur, categorie, description) VALUES
('cotisation_mensuelle_montant', '5000', 'montant', 'cotisations', 'Montant de la cotisation mensuelle obligatoire'),
('cotisation_annuelle_montant', '50000', 'montant', 'cotisations', 'Montant de la cotisation annuelle'),
('investissement_min', '10000', 'montant', 'investissements', 'Montant minimum pour un investissement'),
('taux_benefice_epargne', '5', 'pourcentage', 'regles', 'Pourcentage de bénéfices redistribués sur les épargnes'),
('duree_min_epargne', '12', 'texte', 'epargnes', 'Durée minimale en mois pour une épargne')
ON CONFLICT (cle) DO NOTHING;