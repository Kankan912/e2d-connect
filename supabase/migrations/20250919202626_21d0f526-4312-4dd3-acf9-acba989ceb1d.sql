-- Créer la table types_sanctions si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.types_sanctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter quelques types de sanctions par défaut
INSERT INTO public.types_sanctions (nom, description) VALUES
  ('Retard', 'Sanction pour retard à une réunion ou activité'),
  ('Absence non justifiée', 'Sanction pour absence sans excuse valable'),
  ('Manquement au règlement', 'Sanction pour non-respect du règlement intérieur'),
  ('Comportement inapproprié', 'Sanction pour comportement non conforme aux valeurs de l''association')
ON CONFLICT DO NOTHING;

-- Activer RLS sur types_sanctions
ALTER TABLE public.types_sanctions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour types_sanctions
CREATE POLICY "Admins peuvent gérer types sanctions" ON public.types_sanctions
FOR ALL USING (has_role('administrateur'::text));

CREATE POLICY "Tous peuvent voir types sanctions" ON public.types_sanctions
FOR SELECT USING (true);

-- Trigger pour updated_at sur types_sanctions
CREATE TRIGGER update_types_sanctions_updated_at
    BEFORE UPDATE ON public.types_sanctions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();