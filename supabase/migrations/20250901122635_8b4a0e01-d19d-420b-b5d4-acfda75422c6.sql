-- Créer les tables pour les matchs E2D et permissions
-- Note: Le compte admin sera créé via l'application

-- 1. Créer la table pour les matchs E2D
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

-- 2. Créer une table pour la gestion des permissions par rôle
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

-- 3. Insérer les permissions par défaut pour chaque rôle
INSERT INTO public.role_permissions (role_id, resource, permission, granted)
SELECT 
  r.id,
  resource_permission.resource,
  resource_permission.permission,
  resource_permission.granted
FROM roles r
CROSS JOIN (
  VALUES 
    -- Permissions Administrateur (tout)
    ('membres', 'create', true),
    ('membres', 'read', true),
    ('membres', 'update', true),
    ('membres', 'delete', true),
    ('cotisations', 'create', true),
    ('cotisations', 'read', true),
    ('cotisations', 'update', true),
    ('epargnes', 'create', true),
    ('epargnes', 'read', true),
    ('epargnes', 'update', true),
    ('prets', 'create', true),
    ('prets', 'read', true),
    ('prets', 'update', true),
    ('aides', 'create', true),
    ('aides', 'read', true),
    ('aides', 'update', true),
    ('sanctions', 'create', true),
    ('sanctions', 'read', true),
    ('sanctions', 'update', true),
    ('reunions', 'create', true),
    ('reunions', 'read', true),
    ('reunions', 'update', true),
    ('rapports', 'create', true),
    ('rapports', 'read', true),
    ('configuration', 'read', true),
    ('configuration', 'update', true)
) AS resource_permission(resource, permission, granted)
WHERE r.name = 'administrateur'
ON CONFLICT (role_id, resource, permission) DO NOTHING;