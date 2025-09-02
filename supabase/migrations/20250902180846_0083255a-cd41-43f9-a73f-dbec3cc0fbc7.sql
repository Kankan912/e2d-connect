
-- 1) Fonction has_role insensible à la casse
CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.membres m
    JOIN public.membres_roles mr ON m.id = mr.membre_id
    JOIN public.roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
      AND lower(r.name) = lower(role_name)
  );
$$;

-- 2) Normalisation des rôles (lowercase) + fusion des doublons
WITH canonical AS (
  SELECT lower(name) AS lname, MIN(id) AS canonical_id
  FROM public.roles
  GROUP BY lower(name)
),
dups AS (
  SELECT r.id, c.canonical_id
  FROM public.roles r
  JOIN canonical c ON lower(r.name) = c.lname
  WHERE r.id <> c.canonical_id
)
UPDATE public.membres_roles mr
SET role_id = d.canonical_id
FROM dups d
WHERE mr.role_id = d.id;

DELETE FROM public.roles r
USING dups d
WHERE r.id = d.id;

UPDATE public.roles SET name = lower(name);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'roles' AND indexname = 'roles_name_lower_idx'
  ) THEN
    CREATE UNIQUE INDEX roles_name_lower_idx ON public.roles (lower(name));
  END IF;
END$$;

-- 3) Garantir l’existence des rôles nécessaires
INSERT INTO public.roles (name, description)
SELECT x.name, x.description
FROM (VALUES
  ('administrateur','Accès complet'),
  ('tresorier','Gestion des finances'),
  ('commissaire_comptes','Contrôle des comptes'),
  ('censeur','Discipline et sanctions'),
  ('secretaire_general','Gestion des réunions'),
  ('responsable_sportif','Gestion sport'),
  ('responsable_sport_e2d','Gestion sport E2D'),
  ('responsable_sport_phoenix','Gestion sport Phoenix'),
  ('adherent_phoenix','Adhérent Phoenix'),
  ('membre','Membre standard')
) AS x(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.roles r WHERE lower(r.name) = x.name);

-- 4) Rattacher/garantir l’admin
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@e2d.com' LIMIT 1
),
upsert_membre AS (
  INSERT INTO public.membres (user_id, nom, prenom, email, telephone, statut, est_membre_e2d)
  SELECT au.id, 'Admin', 'E2D', 'admin@e2d.com', '', 'actif', true
  FROM admin_user au
  WHERE NOT EXISTS (SELECT 1 FROM public.membres m WHERE m.user_id = au.id)
  RETURNING id
),
resolved_membre AS (
  SELECT m.id FROM public.membres m JOIN admin_user au ON m.user_id = au.id
  UNION ALL
  SELECT id FROM upsert_membre
),
admin_role AS (
  SELECT id FROM public.roles WHERE name = 'administrateur' LIMIT 1
)
INSERT INTO public.membres_roles (membre_id, role_id)
SELECT rm.id, ar.id
FROM resolved_membre rm, admin_role ar
ON CONFLICT (membre_id, role_id) DO NOTHING;

-- 5) Politiques RLS: remplacer par has_role (évite la casse et les jointures fragiles)

-- Cotisations
DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des cotisations" ON public.cotisations;
CREATE POLICY "Roles autorisés peuvent ajouter des cotisations"
ON public.cotisations
FOR INSERT TO authenticated
WITH CHECK (
  has_role('administrateur') OR has_role('tresorier') OR has_role('commissaire_comptes')
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cotisations' AND policyname='Trésoriers et admins peuvent modifier les cotisations'
  ) THEN
    CREATE POLICY "Trésoriers et admins peuvent modifier les cotisations"
    ON public.cotisations
    FOR UPDATE TO authenticated
    USING (
      has_role('administrateur') OR has_role('tresorier') OR has_role('commissaire_comptes')
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cotisations' AND policyname='Trésoriers et admins peuvent supprimer les cotisations'
  ) THEN
    CREATE POLICY "Trésoriers et admins peuvent supprimer les cotisations"
    ON public.cotisations
    FOR DELETE TO authenticated
    USING (
      has_role('administrateur') OR has_role('tresorier') OR has_role('commissaire_comptes')
    );
  END IF;
END$$;

-- Prêts
DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des prêts" ON public.prets;
DROP POLICY IF EXISTS "Trésoriers peuvent modifier les prêts" ON public.prets;

CREATE POLICY "Roles autorisés peuvent ajouter des prêts"
ON public.prets
FOR INSERT TO authenticated
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

CREATE POLICY "Roles autorisés peuvent modifier les prêts"
ON public.prets
FOR UPDATE TO authenticated
USING (has_role('administrateur') OR has_role('tresorier'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='prets' AND policyname='Admins et trésoriers peuvent supprimer les prêts'
  ) THEN
    CREATE POLICY "Admins et trésoriers peuvent supprimer les prêts"
    ON public.prets
    FOR DELETE TO authenticated
    USING (has_role('administrateur') OR has_role('tresorier'));
  END IF;
END$$;

-- Sanctions
DROP POLICY IF EXISTS "Censeurs peuvent gérer les sanctions" ON public.sanctions;
CREATE POLICY "Roles autorisés peuvent gérer les sanctions"
ON public.sanctions
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('censeur'))
WITH CHECK (has_role('administrateur') OR has_role('censeur'));

-- Réunions
DROP POLICY IF EXISTS "Secrétaires peuvent gérer les réunions" ON public.reunions;
CREATE POLICY "Roles autorisés peuvent gérer les réunions"
ON public.reunions
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('secretaire_general'))
WITH CHECK (has_role('administrateur') OR has_role('secretaire_general'));

-- Sport E2D finances
DROP POLICY IF EXISTS "Responsables peuvent gérer les dépenses Sport E2D" ON public.sport_e2d_depenses;
CREATE POLICY "Roles autorisés peuvent gérer dépenses E2D"
ON public.sport_e2d_depenses
FOR ALL TO authenticated
USING (
  has_role('administrateur') OR has_role('responsable_sportif') OR has_role('responsable_sport_e2d') OR has_role('tresorier')
)
WITH CHECK (
  has_role('administrateur') OR has_role('responsable_sportif') OR has_role('responsable_sport_e2d') OR has_role('tresorier')
);

DROP POLICY IF EXISTS "Responsables peuvent gérer les recettes Sport E2D" ON public.sport_e2d_recettes;
CREATE POLICY "Roles autorisés peuvent gérer recettes E2D"
ON public.sport_e2d_recettes
FOR ALL TO authenticated
USING (
  has_role('administrateur') OR has_role('responsable_sportif') OR has_role('responsable_sport_e2d') OR has_role('tresorier')
)
WITH CHECK (
  has_role('administrateur') OR has_role('responsable_sportif') OR has_role('responsable_sport_e2d') OR has_role('tresorier')
);

-- Phoenix (si non couverts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='phoenix_adherents' AND policyname='Admins peuvent gérer les adhérents Phoenix'
  ) THEN
    CREATE POLICY "Admins peuvent gérer les adhérents Phoenix"
    ON public.phoenix_adherents
    FOR ALL TO authenticated
    USING (has_role('administrateur'))
    WITH CHECK (has_role('administrateur'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='phoenix_presences' AND policyname='Admins peuvent gérer les présences Phoenix'
  ) THEN
    CREATE POLICY "Admins peuvent gérer les présences Phoenix"
    ON public.phoenix_presences
    FOR ALL TO authenticated
    USING (has_role('administrateur'))
    WITH CHECK (has_role('administrateur'));
  END IF;
END$$;

-- 6) Membres: permettre à un utilisateur de créer/mettre à jour sa propre fiche
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='membres' AND policyname='Users can create their own membre'
  ) THEN
    CREATE POLICY "Users can create their own membre"
    ON public.membres
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='membres' AND policyname='Users can update their own membre'
  ) THEN
    CREATE POLICY "Users can update their own membre"
    ON public.membres
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
  END IF;
END$$;
