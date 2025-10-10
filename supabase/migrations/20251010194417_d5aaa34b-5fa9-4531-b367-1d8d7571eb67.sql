-- ÉTAPE 1.1: Ajouter colonnes à sport_e2d_matchs
ALTER TABLE sport_e2d_matchs 
ADD COLUMN logo_equipe_adverse TEXT,
ADD COLUMN nom_complet_equipe_adverse TEXT;

-- ÉTAPE 1.2: Créer table phoenix_entrainements_internes
CREATE TABLE phoenix_entrainements_internes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_entrainement DATE NOT NULL,
  heure_debut TIME,
  heure_fin TIME,
  lieu VARCHAR(255),
  equipe_gagnante VARCHAR(50) CHECK (equipe_gagnante IN ('jaune', 'rouge', 'nul')),
  score_jaune INTEGER DEFAULT 0,
  score_rouge INTEGER DEFAULT 0,
  statut VARCHAR(50) NOT NULL DEFAULT 'prevu' CHECK (statut IN ('prevu', 'termine', 'annule')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur phoenix_entrainements_internes
ALTER TABLE phoenix_entrainements_internes ENABLE ROW LEVEL SECURITY;

-- Politique: Responsables sportifs peuvent gérer les entraînements internes
CREATE POLICY "Responsables sportifs peuvent gérer entraînements internes"
ON phoenix_entrainements_internes
FOR ALL
USING (has_role('administrateur') OR has_role('responsable_sportif'))
WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif'));

-- Politique: Tous peuvent voir les entraînements internes
CREATE POLICY "Tous peuvent voir entraînements internes"
ON phoenix_entrainements_internes
FOR SELECT
USING (true);

-- ÉTAPE 1.3: Créer table phoenix_stats_jaune_rouge
CREATE TABLE phoenix_stats_jaune_rouge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee INTEGER NOT NULL UNIQUE,
  victoires_jaune INTEGER DEFAULT 0,
  victoires_rouge INTEGER DEFAULT 0,
  matchs_nuls INTEGER DEFAULT 0,
  buts_jaune INTEGER DEFAULT 0,
  buts_rouge INTEGER DEFAULT 0,
  cartons_jaunes_jaune INTEGER DEFAULT 0,
  cartons_jaunes_rouge INTEGER DEFAULT 0,
  cartons_rouges_jaune INTEGER DEFAULT 0,
  cartons_rouges_rouge INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur phoenix_stats_jaune_rouge
ALTER TABLE phoenix_stats_jaune_rouge ENABLE ROW LEVEL SECURITY;

-- Politique: Responsables sportifs peuvent gérer les stats
CREATE POLICY "Responsables sportifs peuvent gérer stats jaune rouge"
ON phoenix_stats_jaune_rouge
FOR ALL
USING (has_role('administrateur') OR has_role('responsable_sportif'))
WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif'));

-- Politique: Tous peuvent voir les stats
CREATE POLICY "Tous peuvent voir stats jaune rouge"
ON phoenix_stats_jaune_rouge
FOR SELECT
USING (true);

-- Trigger pour updated_at sur phoenix_entrainements_internes
CREATE TRIGGER update_phoenix_entrainements_internes_updated_at
BEFORE UPDATE ON phoenix_entrainements_internes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at sur phoenix_stats_jaune_rouge
CREATE TRIGGER update_phoenix_stats_jaune_rouge_updated_at
BEFORE UPDATE ON phoenix_stats_jaune_rouge
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ÉTAPE 1.4: Créer bucket Supabase Storage pour les logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sport-logos', 'sport-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket sport-logos
CREATE POLICY "Logos sont publiquement accessibles"
ON storage.objects
FOR SELECT
USING (bucket_id = 'sport-logos');

CREATE POLICY "Responsables peuvent uploader des logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'sport-logos' 
  AND (has_role('administrateur') OR has_role('responsable_sportif'))
);

CREATE POLICY "Responsables peuvent mettre à jour des logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'sport-logos' 
  AND (has_role('administrateur') OR has_role('responsable_sportif'))
);

CREATE POLICY "Responsables peuvent supprimer des logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'sport-logos' 
  AND (has_role('administrateur') OR has_role('responsable_sportif'))
);