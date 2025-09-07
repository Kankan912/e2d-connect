-- Créer la table pour les statistiques des matchs
CREATE TABLE public.match_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('e2d', 'phoenix')),
  player_name TEXT NOT NULL,
  goals INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards INTEGER NOT NULL DEFAULT 0,
  man_of_match BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.match_statistics ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Responsables sportifs peuvent gérer les statistiques matchs"
ON public.match_statistics
FOR ALL
USING (has_role('administrateur'::text) OR has_role('responsable_sportif'::text))
WITH CHECK (has_role('administrateur'::text) OR has_role('responsable_sportif'::text));

CREATE POLICY "Tous peuvent voir les statistiques matchs"
ON public.match_statistics
FOR SELECT
USING (true);

-- Créer un trigger pour updated_at
CREATE TRIGGER update_match_statistics_updated_at
BEFORE UPDATE ON public.match_statistics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();