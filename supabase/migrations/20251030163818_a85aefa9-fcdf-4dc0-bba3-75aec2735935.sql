-- Supprimer les anciennes politiques RLS sur smtp_config
DROP POLICY IF EXISTS "Admins peuvent gérer SMTP" ON smtp_config;
DROP POLICY IF EXISTS "Admins peuvent voir SMTP" ON smtp_config;

-- Créer des politiques RLS moins restrictives pour smtp_config
-- Permettre aux utilisateurs authentifiés de voir la config
CREATE POLICY "Utilisateurs authentifiés peuvent voir SMTP"
ON smtp_config
FOR SELECT
TO authenticated
USING (true);

-- Permettre aux utilisateurs authentifiés de gérer SMTP (INSERT/UPDATE/DELETE)
CREATE POLICY "Utilisateurs authentifiés peuvent gérer SMTP"
ON smtp_config
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);