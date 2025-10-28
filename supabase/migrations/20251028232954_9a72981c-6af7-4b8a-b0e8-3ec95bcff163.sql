-- Table pour les statistiques annuelles Phoenix
CREATE TABLE IF NOT EXISTS public.phoenix_statistiques_annuelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercice_id UUID REFERENCES public.exercices(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  total_matchs_jaune INTEGER DEFAULT 0,
  total_matchs_rouge INTEGER DEFAULT 0,
  victoires_jaune INTEGER DEFAULT 0,
  victoires_rouge INTEGER DEFAULT 0,
  matchs_nuls INTEGER DEFAULT 0,
  buts_jaune INTEGER DEFAULT 0,
  buts_rouge INTEGER DEFAULT 0,
  cartons_jaunes_jaune INTEGER DEFAULT 0,
  cartons_jaunes_rouge INTEGER DEFAULT 0,
  cartons_rouges_jaune INTEGER DEFAULT 0,
  cartons_rouges_rouge INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exercice_id, annee)
);

-- Enable RLS
ALTER TABLE public.phoenix_statistiques_annuelles ENABLE ROW LEVEL SECURITY;

-- Policy pour lecture (tous)
CREATE POLICY "Tous peuvent voir statistiques annuelles Phoenix"
  ON public.phoenix_statistiques_annuelles
  FOR SELECT
  USING (true);

-- Policy pour gestion (admins et responsables sportifs)
CREATE POLICY "Responsables sportifs peuvent gérer statistiques annuelles"
  ON public.phoenix_statistiques_annuelles
  FOR ALL
  USING (has_role('administrateur') OR has_role('responsable_sportif'))
  WITH CHECK (has_role('administrateur') OR has_role('responsable_sportif'));

-- Trigger pour updated_at
CREATE TRIGGER update_phoenix_statistiques_annuelles_updated_at
  BEFORE UPDATE ON public.phoenix_statistiques_annuelles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();