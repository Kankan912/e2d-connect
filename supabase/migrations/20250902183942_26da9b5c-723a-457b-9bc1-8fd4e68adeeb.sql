-- Corrections essentielles pour stopper les 403 immédiatement
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

-- 2) Normaliser les rôles existants en minuscules (sans créer de doublons)
UPDATE public.roles SET name = lower(name) WHERE name != lower(name);

-- 3) Politiques essentielles (remplacer les anciennes)
DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des cotisations" ON public.cotisations;
DROP POLICY IF EXISTS "Admins peuvent gérer les cotisations" ON public.cotisations;

CREATE POLICY "RLS_cotisations_all"
ON public.cotisations
FOR ALL TO authenticated
USING (has_role('administrateur'))
WITH CHECK (has_role('administrateur'));

DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des prêts" ON public.prets;
DROP POLICY IF EXISTS "Trésoriers peuvent modifier les prêts" ON public.prets;
DROP POLICY IF EXISTS "Admins peuvent gérer les prêts" ON public.prets;

CREATE POLICY "RLS_prets_all"
ON public.prets
FOR ALL TO authenticated
USING (has_role('administrateur'))
WITH CHECK (has_role('administrateur'));

DROP POLICY IF EXISTS "Secrétaires peuvent gérer les réunions" ON public.reunions;
DROP POLICY IF EXISTS "Admins peuvent gérer les réunions" ON public.reunions;

CREATE POLICY "RLS_reunions_all"
ON public.reunions
FOR ALL TO authenticated
USING (has_role('administrateur'))
WITH CHECK (has_role('administrateur'));

DROP POLICY IF EXISTS "Censeurs peuvent gérer les sanctions" ON public.sanctions;
DROP POLICY IF EXISTS "Admins peuvent gérer les sanctions" ON public.sanctions;

CREATE POLICY "RLS_sanctions_all"
ON public.sanctions
FOR ALL TO authenticated
USING (has_role('administrateur'))
WITH CHECK (has_role('administrateur'));