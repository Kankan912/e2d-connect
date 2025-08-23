-- Création des tables de base pour l'application E2D

-- Table des rôles
CREATE TABLE public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres
CREATE TABLE public.membres (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(255) UNIQUE,
  photo_url TEXT,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  date_inscription DATE DEFAULT CURRENT_DATE,
  est_membre_e2d BOOLEAN DEFAULT true,
  est_adherent_phoenix BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de jonction membres-rôles
CREATE TABLE public.membres_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id UUID REFERENCES public.membres(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(membre_id, role_id)
);

-- Table des types de cotisations
CREATE TABLE public.cotisations_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  montant_defaut DECIMAL(10,2),
  obligatoire BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des cotisations
CREATE TABLE public.cotisations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id UUID REFERENCES public.membres(id) ON DELETE CASCADE,
  type_cotisation_id UUID REFERENCES public.cotisations_types(id),
  montant DECIMAL(10,2) NOT NULL,
  date_paiement DATE DEFAULT CURRENT_DATE,
  statut VARCHAR(20) DEFAULT 'paye' CHECK (statut IN ('paye', 'en_attente', 'en_retard')),
  justificatif_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des adhérents Phoenix
CREATE TABLE public.phoenix_adherents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id UUID REFERENCES public.membres(id) ON DELETE CASCADE,
  adhesion_payee BOOLEAN DEFAULT false,
  montant_adhesion DECIMAL(10,2),
  date_adhesion DATE DEFAULT CURRENT_DATE,
  date_limite_paiement DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des présences Sport Phoenix
CREATE TABLE public.phoenix_presences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  adherent_id UUID REFERENCES public.phoenix_adherents(id) ON DELETE CASCADE,
  date_entrainement DATE NOT NULL,
  present BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des rôles de base
INSERT INTO public.roles (name, description) VALUES 
('administrateur', 'Accès complet à toutes les fonctionnalités'),
('membre', 'Membre standard de l''association E2D'),
('tresorier', 'Gestion des finances et cotisations'),
('censeur', 'Gestion des sanctions et discipline'),
('secretaire_general', 'Gestion des réunions et rapports'),
('commissaire_comptes', 'Contrôle et audit des comptes'),
('responsable_sport_e2d', 'Gestion du sport E2D'),
('responsable_sport_phoenix', 'Gestion du sport Phoenix'),
('adherent_phoenix', 'Adhérent uniquement au sport Phoenix');

-- Insertion des types de cotisations de base
INSERT INTO public.cotisations_types (nom, description, montant_defaut, obligatoire) VALUES 
('Cotisation mensuelle', 'Cotisation mensuelle obligatoire', 5000.00, true),
('Huile et savon', 'Contribution huile et savon par séance', 500.00, true),
('Fond sport E2D', 'Contribution au fond sportif E2D', 2000.00, true),
('Fond de caisse', 'Contribution au fond de caisse', 5000.00, true),
('Fond d''investissement', 'Contribution annuelle d''investissement', 10000.00, false),
('Adhésion Phoenix', 'Adhésion au sport Phoenix', 3000.00, false);

-- Activation RLS sur toutes les tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membres_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phoenix_adherents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phoenix_presences ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les rôles (lecture pour tous les utilisateurs authentifiés)
CREATE POLICY "Tout utilisateur authentifié peut voir les rôles" 
ON public.roles FOR SELECT 
TO authenticated 
USING (true);

-- Politiques RLS pour les membres (accès selon le rôle)
CREATE POLICY "Membres peuvent voir tous les autres membres" 
ON public.membres FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Administrateurs peuvent tout faire sur les membres" 
ON public.membres FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.membres m 
    JOIN public.membres_roles mr ON m.id = mr.membre_id 
    JOIN public.roles r ON mr.role_id = r.id 
    WHERE m.user_id = auth.uid() AND r.name = 'administrateur'
  )
);

-- Politiques pour membres_roles
CREATE POLICY "Utilisateurs peuvent voir les rôles des membres" 
ON public.membres_roles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Administrateurs peuvent gérer les rôles" 
ON public.membres_roles FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.membres m 
    JOIN public.membres_roles mr ON m.id = mr.membre_id 
    JOIN public.roles r ON mr.role_id = r.id 
    WHERE m.user_id = auth.uid() AND r.name = 'administrateur'
  )
);

-- Politiques pour les types de cotisations
CREATE POLICY "Tous peuvent voir les types de cotisations" 
ON public.cotisations_types FOR SELECT 
TO authenticated 
USING (true);

-- Politiques pour les cotisations
CREATE POLICY "Membres peuvent voir leurs cotisations et trésoriers toutes les cotisations" 
ON public.cotisations FOR SELECT 
TO authenticated 
USING (
  membre_id IN (SELECT id FROM public.membres WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.membres m 
    JOIN public.membres_roles mr ON m.id = mr.membre_id 
    JOIN public.roles r ON mr.role_id = r.id 
    WHERE m.user_id = auth.uid() AND r.name IN ('administrateur', 'tresorier', 'commissaire_comptes')
  )
);

CREATE POLICY "Trésoriers peuvent ajouter des cotisations" 
ON public.cotisations FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.membres m 
    JOIN public.membres_roles mr ON m.id = mr.membre_id 
    JOIN public.roles r ON mr.role_id = r.id 
    WHERE m.user_id = auth.uid() AND r.name IN ('administrateur', 'tresorier', 'commissaire_comptes')
  )
);

-- Politiques pour Phoenix
CREATE POLICY "Tous peuvent voir les adhérents Phoenix" 
ON public.phoenix_adherents FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Tous peuvent voir les présences Phoenix" 
ON public.phoenix_presences FOR SELECT 
TO authenticated 
USING (true);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at sur membres
CREATE TRIGGER update_membres_updated_at
  BEFORE UPDATE ON public.membres
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();