-- 1. Fix RLS recursive policy on membres_roles
DROP POLICY IF EXISTS "Administrateurs peuvent gérer les rôles" ON public.membres_roles;

-- Create secure function to check roles without recursion
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
      AND r.name = role_name
  );
$$;

-- Recreate policy using secure function
CREATE POLICY "Administrateurs peuvent gérer les rôles"
ON public.membres_roles
FOR ALL
USING (public.has_role('administrateur'))
WITH CHECK (public.has_role('administrateur'));

-- 2. Add phone number as required field and avaliste to loans
ALTER TABLE public.membres 
  ALTER COLUMN telephone SET NOT NULL;

ALTER TABLE public.prets 
  ADD COLUMN IF NOT EXISTS avaliste_id uuid REFERENCES public.membres(id);

-- 3. Add individual contribution amounts per member
CREATE TABLE IF NOT EXISTS public.membres_cotisations_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id uuid NOT NULL REFERENCES public.membres(id) ON DELETE CASCADE,
  type_cotisation_id uuid NOT NULL REFERENCES public.cotisations_types(id) ON DELETE CASCADE,
  montant_personnalise numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(membre_id, type_cotisation_id)
);

-- Enable RLS on new table
ALTER TABLE public.membres_cotisations_config ENABLE ROW LEVEL SECURITY;

-- Policies for contribution config
CREATE POLICY "Administrateurs peuvent gérer les configurations de cotisations"
ON public.membres_cotisations_config
FOR ALL
USING (public.has_role('administrateur'))
WITH CHECK (public.has_role('administrateur'));

CREATE POLICY "Tous peuvent voir les configurations de cotisations"
ON public.membres_cotisations_config
FOR SELECT
USING (true);

-- 4. Add trigger for updated_at on new table
CREATE TRIGGER update_membres_cotisations_config_updated_at
  BEFORE UPDATE ON public.membres_cotisations_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Make cotisation types editable by admins
DROP POLICY IF EXISTS "Administrateurs peuvent gérer les types de cotisations" ON public.cotisations_types;

CREATE POLICY "Administrateurs peuvent gérer les types de cotisations"
ON public.cotisations_types
FOR ALL
USING (public.has_role('administrateur'))
WITH CHECK (public.has_role('administrateur'));

-- 6. Add Sport E2D and Phoenix configuration tables
CREATE TABLE IF NOT EXISTS public.sport_e2d_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_equipe text NOT NULL DEFAULT 'E2D',
  couleur_maillot text,
  entraineur text,
  lieu_entrainement text,
  horaire_entrainement text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sport_phoenix_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_club text NOT NULL DEFAULT 'Phoenix',
  montant_adhesion numeric DEFAULT 5000,
  duree_adhesion_mois integer DEFAULT 12,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on config tables
ALTER TABLE public.sport_e2d_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_phoenix_config ENABLE ROW LEVEL SECURITY;

-- Policies for sport configs
CREATE POLICY "Responsables sportifs peuvent gérer config E2D"
ON public.sport_e2d_config
FOR ALL
USING (public.has_role('administrateur') OR public.has_role('responsable_sportif'))
WITH CHECK (public.has_role('administrateur') OR public.has_role('responsable_sportif'));

CREATE POLICY "Tous peuvent voir config E2D"
ON public.sport_e2d_config
FOR SELECT
USING (true);

CREATE POLICY "Responsables sportifs peuvent gérer config Phoenix"
ON public.sport_phoenix_config
FOR ALL
USING (public.has_role('administrateur') OR public.has_role('responsable_sportif'))
WITH CHECK (public.has_role('administrateur') OR public.has_role('responsable_sportif'));

CREATE POLICY "Tous peuvent voir config Phoenix"
ON public.sport_phoenix_config
FOR SELECT
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_sport_e2d_config_updated_at
  BEFORE UPDATE ON public.sport_e2d_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sport_phoenix_config_updated_at
  BEFORE UPDATE ON public.sport_phoenix_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configs if they don't exist
INSERT INTO public.sport_e2d_config (nom_equipe) 
SELECT 'E2D' 
WHERE NOT EXISTS (SELECT 1 FROM public.sport_e2d_config);

INSERT INTO public.sport_phoenix_config (nom_club) 
SELECT 'Phoenix' 
WHERE NOT EXISTS (SELECT 1 FROM public.sport_phoenix_config);