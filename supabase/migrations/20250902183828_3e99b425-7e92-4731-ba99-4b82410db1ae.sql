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
-- FIX: utiliser first_value au lieu de MIN pour UUID
WITH canonical AS (
  SELECT 
    lower(name) AS lname, 
    first_value(id) OVER (PARTITION BY lower(name) ORDER BY created_at ASC) AS canonical_id
  FROM public.roles
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
WHERE r.id IN (
  SELECT r2.id
  FROM public.roles r2
  WHERE lower(r2.name) IN (
    SELECT lower(name)
    FROM public.roles
    GROUP BY lower(name)
    HAVING count(*) > 1
  )
  AND r2.id NOT IN (
    SELECT first_value(id) OVER (PARTITION BY lower(name) ORDER BY created_at ASC)
    FROM public.roles r3
    WHERE lower(r3.name) = lower(r2.name)
    LIMIT 1
  )
);

UPDATE public.roles SET name = lower(name);

-- 3) Garantir l'existence des rôles nécessaires
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

-- 4) Rattacher/garantir l'admin
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

-- 5) Créer les politiques RLS avec has_role

-- Cotisations
DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des cotisations" ON public.cotisations;
DROP POLICY IF EXISTS "Roles autorisés peuvent ajouter des cotisations" ON public.cotisations;

CREATE POLICY "Admins peuvent gérer les cotisations"
ON public.cotisations
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

-- Prêts
DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des prêts" ON public.prets;
DROP POLICY IF EXISTS "Trésoriers peuvent modifier les prêts" ON public.prets;
DROP POLICY IF EXISTS "Roles autorisés peuvent ajouter des prêts" ON public.prets;
DROP POLICY IF EXISTS "Roles autorisés peuvent modifier les prêts" ON public.prets;

CREATE POLICY "Admins peuvent gérer les prêts"
ON public.prets
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

-- Sanctions  
DROP POLICY IF EXISTS "Censeurs peuvent gérer les sanctions" ON public.sanctions;
DROP POLICY IF EXISTS "Roles autorisés peuvent gérer les sanctions" ON public.sanctions;

CREATE POLICY "Admins peuvent gérer les sanctions"
ON public.sanctions
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('censeur'))
WITH CHECK (has_role('administrateur') OR has_role('censeur'));

-- Réunions
DROP POLICY IF EXISTS "Secrétaires peuvent gérer les réunions" ON public.reunions;
DROP POLICY IF EXISTS "Roles autorisés peuvent gérer les réunions" ON public.reunions;

CREATE POLICY "Admins peuvent gérer les réunions"
ON public.reunions
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('secretaire_general'))
WITH CHECK (has_role('administrateur') OR has_role('secretaire_general'));