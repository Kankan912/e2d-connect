-- Phase 1: Add team field to members table for team management
ALTER TABLE public.membres ADD COLUMN equipe character varying CHECK (equipe IN ('Jaune', 'Rouge'));

-- Phase 1: Create match presences table for tracking attendance at matches
CREATE TABLE public.match_presences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL,
  membre_id uuid NOT NULL,
  match_type character varying NOT NULL CHECK (match_type IN ('e2d', 'phoenix')),
  present boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(match_id, membre_id, match_type)
);

-- Enable RLS on match_presences
ALTER TABLE public.match_presences ENABLE ROW LEVEL SECURITY;

-- Create policies for match_presences
CREATE POLICY "Responsables sportifs peuvent gérer les présences matchs"
ON public.match_presences
FOR ALL
USING (has_role('administrateur'::text) OR has_role('responsable_sportif'::text))
WITH CHECK (has_role('administrateur'::text) OR has_role('responsable_sportif'::text));

CREATE POLICY "Tous peuvent voir les présences matchs"
ON public.match_presences
FOR SELECT
USING (true);

-- Phase 2: Create cotisations minimales configuration table
CREATE TABLE public.cotisations_minimales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id uuid NOT NULL,
  montant_mensuel numeric NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(membre_id)
);

-- Enable RLS on cotisations_minimales
ALTER TABLE public.cotisations_minimales ENABLE ROW LEVEL SECURITY;

-- Create policies for cotisations_minimales
CREATE POLICY "Administrateurs peuvent gérer les cotisations minimales"
ON public.cotisations_minimales
FOR ALL
USING (has_role('administrateur'::text))
WITH CHECK (has_role('administrateur'::text));

CREATE POLICY "Tous peuvent voir les cotisations minimales"
ON public.cotisations_minimales
FOR SELECT
USING (true);

-- Create trigger for cotisations_minimales updated_at
CREATE TRIGGER update_cotisations_minimales_updated_at
BEFORE UPDATE ON public.cotisations_minimales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 1: Improve tontine validation - allow total_attribue <= total_cotisations instead of strict equality
-- This is handled in the UI logic rather than database constraints

-- Add column for lieu_membre_id (host member) to reunions table if not exists
-- First check if the column already exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reunions' 
    AND column_name = 'lieu_membre_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.reunions ADD COLUMN lieu_membre_id uuid REFERENCES public.membres(id);
  END IF;
END $$;