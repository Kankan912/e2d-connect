-- Améliorer la structure des équipes
ALTER TABLE membres ADD COLUMN IF NOT EXISTS equipe_e2d VARCHAR(50);
ALTER TABLE membres ADD COLUMN IF NOT EXISTS equipe_phoenix VARCHAR(50);

-- Mettre à jour les équipes existantes si nécessaire
UPDATE membres SET equipe_e2d = equipe WHERE est_membre_e2d = true AND equipe IS NOT NULL;
UPDATE membres SET equipe_phoenix = equipe WHERE est_adherent_phoenix = true AND equipe IS NOT NULL;

-- Ajouter index pour performance
CREATE INDEX IF NOT EXISTS idx_membres_equipe_e2d ON membres(equipe_e2d);
CREATE INDEX IF NOT EXISTS idx_membres_equipe_phoenix ON membres(equipe_phoenix);

-- Activer Realtime sur les tables critiques
ALTER TABLE membres REPLICA IDENTITY FULL;
ALTER TABLE prets REPLICA IDENTITY FULL;
ALTER TABLE sanctions REPLICA IDENTITY FULL;
ALTER TABLE epargnes REPLICA IDENTITY FULL;
ALTER TABLE match_statistics REPLICA IDENTITY FULL;

-- Ajouter les tables au realtime
ALTER publication supabase_realtime ADD TABLE membres;
ALTER publication supabase_realtime ADD TABLE prets;
ALTER publication supabase_realtime ADD TABLE sanctions;
ALTER publication supabase_realtime ADD TABLE epargnes;
ALTER publication supabase_realtime ADD TABLE match_statistics;