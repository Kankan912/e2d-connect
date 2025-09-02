
-- 1) S'assurer que le rôle "administrateur" existe
INSERT INTO public.roles (name, description)
SELECT 'administrateur', 'Administrateur système'
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles WHERE name = 'administrateur'
);

-- 2) Récupérer l'ID utilisateur de l'admin par e-mail
-- ATTENTION: si l'email diffère, merci de me le dire
WITH admin_user AS (
  SELECT id
  FROM auth.users
  WHERE email = 'admin@e2d.com'
  LIMIT 1
),
-- 3) Créer un membre pour cet utilisateur si nécessaire
upsert_membre AS (
  INSERT INTO public.membres (user_id, nom, prenom, email, telephone, statut, est_membre_e2d)
  SELECT au.id, 'Admin', 'E2D', 'admin@e2d.com', '0000000000', 'actif', true
  FROM admin_user au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.membres m WHERE m.user_id = au.id
  )
  RETURNING id
),
-- 4) Récupérer l'id du membre lié à l'admin
resolved_membre AS (
  SELECT m.id
  FROM public.membres m
  JOIN admin_user au ON m.user_id = au.id
  UNION ALL
  SELECT id FROM upsert_membre
),
-- 5) Récupérer l'id du rôle administrateur
admin_role AS (
  SELECT id FROM public.roles WHERE name = 'administrateur' LIMIT 1
)
-- 6) Lier le membre admin au rôle administrateur si besoin
INSERT INTO public.membres_roles (membre_id, role_id)
SELECT rm.id, ar.id
FROM resolved_membre rm, admin_role ar
WHERE NOT EXISTS (
  SELECT 1 FROM public.membres_roles mr
  WHERE mr.membre_id = rm.id AND mr.role_id = ar.id
);

-- 7) Politiques RLS complémentaires

-- roles: permettre ALL aux administrateurs (pour création/édition/suppression)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'Administrateurs peuvent gérer les rôles'
  ) THEN
    CREATE POLICY "Administrateurs peuvent gérer les rôles"
      ON public.roles
      FOR ALL
      USING (has_role('administrateur'))
      WITH CHECK (has_role('administrateur'));
  END IF;
END$$;

-- cotisations: ajouter UPDATE pour admin/trésorier/commissaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cotisations' AND policyname = 'Trésoriers et admins peuvent modifier les cotisations'
  ) THEN
    CREATE POLICY "Trésoriers et admins peuvent modifier les cotisations"
      ON public.cotisations
      FOR UPDATE
      USING (
        has_role('administrateur')
        OR has_role('tresorier')
        OR has_role('commissaire_comptes')
      );
  END IF;
END$$;

-- cotisations: ajouter DELETE pour admin/trésorier/commissaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cotisations' AND policyname = 'Trésoriers et admins peuvent supprimer les cotisations'
  ) THEN
    CREATE POLICY "Trésoriers et admins peuvent supprimer les cotisations"
      ON public.cotisations
      FOR DELETE
      USING (
        has_role('administrateur')
        OR has_role('tresorier')
        OR has_role('commissaire_comptes')
      );
  END IF;
END$$;

-- prets: autoriser DELETE pour administrateur (et trésorier)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prets' AND policyname = 'Admins et trésoriers peuvent supprimer les prêts'
  ) THEN
    CREATE POLICY "Admins et trésoriers peuvent supprimer les prêts"
      ON public.prets
      FOR DELETE
      USING (has_role('administrateur') OR has_role('tresorier'));
  END IF;
END$$;

-- fichiers_joint: autoriser UPDATE pour administrateur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fichiers_joint' AND policyname = 'Admins peuvent modifier les fichiers joints'
  ) THEN
    CREATE POLICY "Admins peuvent modifier les fichiers joints"
      ON public.fichiers_joint
      FOR UPDATE
      USING (has_role('administrateur'));
  END IF;
END$$;

-- fichiers_joint: autoriser DELETE pour administrateur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fichiers_joint' AND policyname = 'Admins peuvent supprimer les fichiers joints'
  ) THEN
    CREATE POLICY "Admins peuvent supprimer les fichiers joints"
      ON public.fichiers_joint
      FOR DELETE
      USING (has_role('administrateur'));
  END IF;
END$$;

-- phoenix_adherents: autoriser ALL pour administrateur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'phoenix_adherents' AND policyname = 'Admins peuvent gérer les adhérents Phoenix'
  ) THEN
    CREATE POLICY "Admins peuvent gérer les adhérents Phoenix"
      ON public.phoenix_adherents
      FOR ALL
      USING (has_role('administrateur'))
      WITH CHECK (has_role('administrateur'));
  END IF;
END$$;

-- phoenix_presences: autoriser ALL pour administrateur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'phoenix_presences' AND policyname = 'Admins peuvent gérer les présences Phoenix'
  ) THEN
    CREATE POLICY "Admins peuvent gérer les présences Phoenix"
      ON public.phoenix_presences
      FOR ALL
      USING (has_role('administrateur'))
      WITH CHECK (has_role('administrateur'));
  END IF;
END$$;
