-- Créer le compte administrateur par défaut avec mot de passe spécifié
-- Attention: Ceci est une insertion directe pour le compte admin uniquement

-- 1. Insérer l'utilisateur dans auth.users avec le mot de passe hashé
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  aud,
  role,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@e2d.com',
  crypt('699195570', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated',
  '{"nom": "Admin", "prenom": "E2D", "role": "administrateur"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- 2. Créer des tables pour les matchs E2D
CREATE TABLE IF NOT EXISTS public.sport_e2d_matchs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_adverse VARCHAR(255) NOT NULL,
  date_match DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_match TIME,
  lieu VARCHAR(255),
  score_e2d INTEGER DEFAULT 0,
  score_adverse INTEGER DEFAULT 0,
  statut VARCHAR(50) NOT NULL DEFAULT 'prevu',
  type_match VARCHAR(50) NOT NULL DEFAULT 'amical',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table des matchs E2D
ALTER TABLE public.sport_e2d_matchs ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour les matchs E2D
CREATE POLICY "Responsables peuvent gérer les matchs E2D" 
ON public.sport_e2d_matchs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
    AND r.name IN ('administrateur', 'responsable_sportif')
  )
);

CREATE POLICY "Tous peuvent voir les matchs E2D" 
ON public.sport_e2d_matchs 
FOR SELECT 
USING (true);

-- 3. Créer une table pour la gestion des permissions par rôle
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL,
  resource VARCHAR(100) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, resource, permission)
);

-- Activer RLS sur la table des permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour les permissions
CREATE POLICY "Administrateurs peuvent gérer les permissions" 
ON public.role_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
    AND r.name = 'administrateur'
  )
);

CREATE POLICY "Tous peuvent voir les permissions" 
ON public.role_permissions 
FOR SELECT 
USING (true);