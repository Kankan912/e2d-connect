-- Ajouter une table pour gérer les bénéficiaires des réunions basées sur les cotisations
CREATE TABLE IF NOT EXISTS public.reunion_beneficiaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reunion_id UUID NOT NULL,
  membre_id UUID NOT NULL,
  montant_benefice NUMERIC NOT NULL DEFAULT 0,
  date_benefice_prevue DATE NOT NULL,
  statut VARCHAR NOT NULL DEFAULT 'prevu',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reunion_beneficiaires ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Secrétaires peuvent gérer les bénéficiaires" 
ON public.reunion_beneficiaires 
FOR ALL 
USING (has_role('administrateur'::text) OR has_role('secretaire_general'::text))
WITH CHECK (has_role('administrateur'::text) OR has_role('secretaire_general'::text));

CREATE POLICY "Tous peuvent voir les bénéficiaires" 
ON public.reunion_beneficiaires 
FOR SELECT 
USING (true);

-- Ajouter une table pour la configuration des notifications
CREATE TABLE IF NOT EXISTS public.notifications_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_notification VARCHAR NOT NULL,
  delai_jours INTEGER NOT NULL DEFAULT 7,
  template_sujet TEXT,
  template_contenu TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Administrateurs peuvent gérer les notifications" 
ON public.notifications_config 
FOR ALL 
USING (has_role('administrateur'::text))
WITH CHECK (has_role('administrateur'::text));

CREATE POLICY "Tous peuvent voir les notifications config" 
ON public.notifications_config 
FOR SELECT 
USING (true);

-- Insérer la configuration par défaut
INSERT INTO public.notifications_config (type_notification, delai_jours, template_sujet, template_contenu) 
VALUES 
('beneficiaire_reunion', 7, 'Notification de bénéfice - Réunion {date_reunion}', 
'Bonjour {prenom} {nom},

Vous êtes prévu(e) comme bénéficiaire lors de la prochaine réunion du {date_reunion}.

Montant prévu : {montant} FCFA
Lieu : {lieu}
Heure : {heure}

Cordialement,
L''équipe E2D Association')
ON CONFLICT DO NOTHING;