-- Mise à jour simple des tables principales
-- 1) Fonction has_role insensible à la casse (version simplifiée)
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

-- 2) Normalisation simple : mettre tous les rôles en minuscules
UPDATE public.roles SET name = lower(name);

-- 3) S'assurer que l'admin existe avec le bon rôle
DO $$
DECLARE
  admin_user_id uuid;
  admin_membre_id uuid;
  admin_role_id uuid;
BEGIN
  -- Récupérer l'ID de l'utilisateur admin
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@e2d.com' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Upsert le membre admin
    INSERT INTO public.membres (user_id, nom, prenom, email, telephone, statut, est_membre_e2d)
    VALUES (admin_user_id, 'Admin', 'E2D', 'admin@e2d.com', '', 'actif', true)
    ON CONFLICT (user_id) DO UPDATE SET
      nom = 'Admin',
      prenom = 'E2D',
      email = 'admin@e2d.com',
      statut = 'actif',
      est_membre_e2d = true
    RETURNING id INTO admin_membre_id;
    
    -- Si pas de RETURNING (conflit), récupérer l'ID
    IF admin_membre_id IS NULL THEN
      SELECT id INTO admin_membre_id FROM public.membres WHERE user_id = admin_user_id LIMIT 1;
    END IF;
    
    -- S'assurer que le rôle administrateur existe
    INSERT INTO public.roles (name, description) VALUES ('administrateur', 'Accès complet')
    ON CONFLICT (name) DO NOTHING;
    
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'administrateur' LIMIT 1;
    
    -- Lier admin au rôle administrateur
    IF admin_membre_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
      INSERT INTO public.membres_roles (membre_id, role_id)
      VALUES (admin_membre_id, admin_role_id)
      ON CONFLICT (membre_id, role_id) DO NOTHING;
    END IF;
  END IF;
END$$;

-- 4) Créer/mettre à jour les politiques essentielles
-- Cotisations
DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des cotisations" ON public.cotisations;
CREATE POLICY "Admins peuvent gérer les cotisations"
ON public.cotisations
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

-- Prêts  
DROP POLICY IF EXISTS "Trésoriers peuvent ajouter des prêts" ON public.prets;
DROP POLICY IF EXISTS "Trésoriers peuvent modifier les prêts" ON public.prets;
CREATE POLICY "Admins peuvent gérer les prêts"
ON public.prets
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

-- Réunions
DROP POLICY IF EXISTS "Secrétaires peuvent gérer les réunions" ON public.reunions;
CREATE POLICY "Admins peuvent gérer les réunions"
ON public.reunions
FOR ALL TO authenticated
USING (has_role('administrateur') OR has_role('secretaire_general'))
WITH CHECK (has_role('administrateur') OR has_role('secretaire_general'));