-- Create missing tables for sports functionality

-- Table for Phoenix matches
CREATE TABLE IF NOT EXISTS public.sport_phoenix_matchs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_match DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_match TIME,
  equipe_adverse VARCHAR NOT NULL,
  lieu VARCHAR,
  score_phoenix INTEGER DEFAULT 0,
  score_adverse INTEGER DEFAULT 0,
  type_match VARCHAR NOT NULL DEFAULT 'amical',
  statut VARCHAR NOT NULL DEFAULT 'prevu',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for sport presences (both E2D and Phoenix)
CREATE TABLE IF NOT EXISTS public.sport_e2d_presences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id UUID NOT NULL,
  date_seance DATE NOT NULL,
  type_seance VARCHAR NOT NULL, -- 'entrainement_e2d', 'entrainement_phoenix', 'match_e2d', 'match_phoenix'
  present BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.sport_phoenix_matchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_e2d_presences ENABLE ROW LEVEL SECURITY;

-- RLS policies for Phoenix matches
CREATE POLICY "Responsables peuvent gérer les matchs Phoenix"
  ON public.sport_phoenix_matchs
  FOR ALL
  USING (has_role('administrateur') OR has_role('responsable_sportif'))
  WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif'));

CREATE POLICY "Tous peuvent voir les matchs Phoenix"
  ON public.sport_phoenix_matchs
  FOR SELECT
  USING (true);

-- RLS policies for presences
CREATE POLICY "Responsables peuvent gérer les présences sportives"
  ON public.sport_e2d_presences
  FOR ALL
  USING (has_role('administrateur') OR has_role('responsable_sportif'))
  WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif'));

CREATE POLICY "Tous peuvent voir les présences sportives"
  ON public.sport_e2d_presences
  FOR SELECT
  USING (true);