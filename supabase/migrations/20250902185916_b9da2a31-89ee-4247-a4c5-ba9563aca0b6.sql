-- Harmoniser les politiques RLS avec has_role insensible à la casse
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
      AND (r.name = role_name OR lower(r.name) = lower(role_name))
  );
$$;

-- cotisations
DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des cotisations" ON public.cotisations;
CREATE POLICY "Trésoriers peuvent ajouter des cotisations"
ON public.cotisations
FOR INSERT
TO authenticated
WITH CHECK (
  has_role('administrateur') OR has_role('tresorier') OR has_role('commissaire_comptes')
);

DROP POLICY IF EXISTS "Membres peuvent voir leurs cotisations et trésoriers toutes le" ON public.cotisations;
CREATE POLICY "Membres peuvent voir leurs cotisations et trésoriers toutes le"
ON public.cotisations
FOR SELECT
TO authenticated
USING (
  (membre_id IN (SELECT membres.id FROM membres WHERE membres.user_id = auth.uid()))
  OR has_role('administrateur') OR has_role('tresorier') OR has_role('commissaire_comptes')
);

-- prets
DROP POLICY IF EXISTS "Membres peuvent voir leurs prêts et trésoriers tous les prêt" ON public.prets;
CREATE POLICY "Membres peuvent voir leurs prêts et trésoriers tous les prêt"
ON public.prets
FOR SELECT
TO authenticated
USING (
  (membre_id IN (SELECT membres.id FROM membres WHERE membres.user_id = auth.uid()))
  OR has_role('administrateur') OR has_role('tresorier') OR has_role('commissaire_comptes')
);

DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des prêts" ON public.prets;
CREATE POLICY "Trésoriers peuvent ajouter des prêts"
ON public.prets
FOR INSERT
TO authenticated
WITH CHECK (
  has_role('administrateur') OR has_role('tresorier')
);

DROP POLICY IF EXISTS "Trésoriers peuvent modifier les prêts" ON public.prets;
CREATE POLICY "Trésoriers peuvent modifier les prêts"
ON public.prets
FOR UPDATE
TO authenticated
USING (
  has_role('administrateur') OR has_role('tresorier')
);

-- reunions
DROP POLICY IF EXISTS "Secrétaires peuvent gérer les réunions" ON public.reunions;
CREATE POLICY "Secrétaires peuvent gérer les réunions"
ON public.reunions
FOR ALL
TO authenticated
USING (has_role('administrateur') OR has_role('secretaire_general'))
WITH CHECK (has_role('administrateur') OR has_role('secretaire_general'));

-- sanctions
DROP POLICY IF EXISTS "Censeurs peuvent gérer les sanctions" ON public.sanctions;
CREATE POLICY "Censeurs peuvent gérer les sanctions"
ON public.sanctions
FOR ALL
TO authenticated
USING (has_role('administrateur') OR has_role('censeur'))
WITH CHECK (has_role('administrateur') OR has_role('censeur'));
