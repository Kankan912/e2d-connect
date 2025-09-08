-- Corriger le search_path pour toutes les fonctions existantes
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_sanction_status(numeric, numeric) SET search_path = public;