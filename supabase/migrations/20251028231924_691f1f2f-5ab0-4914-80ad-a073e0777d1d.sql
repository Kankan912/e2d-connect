-- ===============================================
-- PHASE 1 - MIGRATIONS CRITIQUES (CORRIGÉE)
-- ===============================================

-- 1. Table match_gala_config pour configuration du Match de Gala
CREATE TABLE IF NOT EXISTS match_gala_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_matchs_minimum INTEGER DEFAULT 5,
  pourcentage_presence_minimum NUMERIC DEFAULT 75,
  taux_cotisation_minimum NUMERIC DEFAULT 80,
  sanctions_max INTEGER DEFAULT 2,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS pour match_gala_config
ALTER TABLE match_gala_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tous peuvent voir config match gala" ON match_gala_config;
CREATE POLICY "Tous peuvent voir config match gala"
  ON match_gala_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins et responsables sportifs gèrent config match gala" ON match_gala_config;
CREATE POLICY "Admins et responsables sportifs gèrent config match gala"
  ON match_gala_config FOR ALL
  USING (has_role('administrateur') OR has_role('responsable_sportif'))
  WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif'));

-- 2. Table role_permissions pour gestion fine des permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, resource, permission)
);

-- RLS pour role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tous peuvent voir permissions" ON role_permissions;
CREATE POLICY "Tous peuvent voir permissions"
  ON role_permissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins gèrent permissions" ON role_permissions;
CREATE POLICY "Admins gèrent permissions"
  ON role_permissions FOR ALL
  USING (has_role('administrateur'))
  WITH CHECK (has_role('administrateur'));

-- 3. Ajouter contrainte unique sur nom dans exercices (avec DO block pour éviter erreur si existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exercices_nom_unique'
  ) THEN
    ALTER TABLE exercices ADD CONSTRAINT exercices_nom_unique UNIQUE (nom);
  END IF;
END $$;

-- 4. Ajouter colonne numero_ordre dans rapports_seances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rapports_seances' AND column_name = 'numero_ordre'
  ) THEN
    ALTER TABLE rapports_seances ADD COLUMN numero_ordre INTEGER;
  END IF;
END $$;

-- 5. Table smtp_config
CREATE TABLE IF NOT EXISTS smtp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serveur_smtp VARCHAR(255) NOT NULL,
  port_smtp INTEGER DEFAULT 587,
  utilisateur_smtp VARCHAR(255) NOT NULL,
  mot_de_passe_smtp TEXT NOT NULL,
  encryption_type VARCHAR(10) DEFAULT 'TLS',
  actif BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS pour smtp_config
ALTER TABLE smtp_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins peuvent gérer SMTP" ON smtp_config;
CREATE POLICY "Admins peuvent gérer SMTP"
  ON smtp_config FOR ALL
  USING (has_role('administrateur'))
  WITH CHECK (has_role('administrateur'));

DROP POLICY IF EXISTS "Admins peuvent voir SMTP" ON smtp_config;
CREATE POLICY "Admins peuvent voir SMTP"
  ON smtp_config FOR SELECT
  USING (has_role('administrateur'));

-- 6. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rapports_seances_numero ON rapports_seances(numero_ordre);
CREATE INDEX IF NOT EXISTS idx_epargnes_exercice ON epargnes(exercice_id);

-- 7. Trigger pour updated_at match_gala_config
DROP TRIGGER IF EXISTS trigger_match_gala_config_updated_at ON match_gala_config;
CREATE TRIGGER trigger_match_gala_config_updated_at
  BEFORE UPDATE ON match_gala_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Trigger pour updated_at role_permissions
DROP TRIGGER IF EXISTS trigger_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER trigger_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Insérer configuration par défaut pour match_gala_config
INSERT INTO match_gala_config (nombre_matchs_minimum, pourcentage_presence_minimum, taux_cotisation_minimum, sanctions_max, actif)
SELECT 5, 75, 80, 2, true
WHERE NOT EXISTS (SELECT 1 FROM match_gala_config LIMIT 1);