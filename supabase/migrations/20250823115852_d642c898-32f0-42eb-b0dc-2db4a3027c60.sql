-- Correction du problème de sécurité: Function Search Path Mutable
-- Mise à jour de la fonction pour sécuriser le search_path

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;