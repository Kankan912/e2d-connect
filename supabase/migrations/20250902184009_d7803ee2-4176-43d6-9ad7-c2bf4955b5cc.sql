-- Correction minimale pour résoudre les 403 sans modifier les rôles existants
-- 1) Fonction has_role insensible à la casse (critiques pour les 403)
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