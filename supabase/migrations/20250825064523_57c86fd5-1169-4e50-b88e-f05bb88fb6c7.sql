-- Tables pour la gestion des prêts
CREATE TABLE public.prets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id UUID NOT NULL,
  montant NUMERIC NOT NULL,
  date_pret DATE NOT NULL DEFAULT CURRENT_DATE,
  echeance DATE NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_cours',
  taux_interet NUMERIC DEFAULT 5.0,
  reconductions INTEGER DEFAULT 0,
  justificatif_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les épargnes
CREATE TABLE public.epargnes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id UUID NOT NULL,
  montant NUMERIC NOT NULL,
  date_depot DATE NOT NULL DEFAULT CURRENT_DATE,
  exercice_id UUID,
  statut VARCHAR(20) NOT NULL DEFAULT 'actif',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les exercices/sessions
CREATE TABLE public.exercices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'actif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les types d'aides
CREATE TABLE public.aides_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  montant_defaut NUMERIC,
  mode_repartition VARCHAR(50) NOT NULL DEFAULT 'equitable',
  delai_remboursement INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les aides
CREATE TABLE public.aides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_aide_id UUID NOT NULL,
  beneficiaire_id UUID NOT NULL,
  montant NUMERIC NOT NULL,
  date_allocation DATE NOT NULL DEFAULT CURRENT_DATE,
  justificatif_url TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'alloue',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les types de sanctions
CREATE TABLE public.sanctions_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  montant NUMERIC NOT NULL,
  categorie VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les sanctions
CREATE TABLE public.sanctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_sanction_id UUID NOT NULL,
  membre_id UUID NOT NULL,
  montant NUMERIC NOT NULL,
  date_sanction DATE NOT NULL DEFAULT CURRENT_DATE,
  statut VARCHAR(20) NOT NULL DEFAULT 'impaye',
  motif TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les réunions
CREATE TABLE public.reunions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_reunion TIMESTAMP WITH TIME ZONE NOT NULL,
  lieu_membre_id UUID,
  lieu_description TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'planifie',
  ordre_du_jour TEXT,
  compte_rendu_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les rapports de séances
CREATE TABLE public.rapports_seances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reunion_id UUID NOT NULL,
  sujet VARCHAR(200) NOT NULL,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour Sport E2D (différent de Phoenix)
CREATE TABLE public.sport_e2d_activites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_activite DATE NOT NULL,
  lieu VARCHAR(100),
  participants_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les dépenses Sport E2D
CREATE TABLE public.sport_e2d_depenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  montant NUMERIC NOT NULL,
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  justificatif_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les recettes Sport E2D
CREATE TABLE public.sport_e2d_recettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  montant NUMERIC NOT NULL,
  date_recette DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'historique des connexions
CREATE TABLE public.historique_connexion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  date_connexion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  statut VARCHAR(20) NOT NULL DEFAULT 'reussi',
  user_agent TEXT
);

-- Table pour les fichiers joints
CREATE TABLE public.fichiers_joint (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_fichier VARCHAR(255) NOT NULL,
  url_fichier TEXT NOT NULL,
  type_mime VARCHAR(100),
  taille_fichier BIGINT,
  entite_type VARCHAR(50) NOT NULL,
  entite_id UUID NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur toutes les nouvelles tables
ALTER TABLE public.prets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epargnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aides_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reunions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports_seances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_e2d_activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_e2d_depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_e2d_recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historique_connexion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichiers_joint ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les prêts
CREATE POLICY "Membres peuvent voir leurs prêts et trésoriers tous les prêts"
ON public.prets FOR SELECT
USING (
  membre_id IN (SELECT id FROM membres WHERE user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'tresorier', 'commissaire_comptes')
  )
);

CREATE POLICY "Trésoriers peuvent ajouter des prêts"
ON public.prets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'tresorier')
  )
);

CREATE POLICY "Trésoriers peuvent modifier les prêts"
ON public.prets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'tresorier')
  )
);

-- Politiques RLS pour les épargnes
CREATE POLICY "Membres peuvent voir leurs épargnes et trésoriers toutes"
ON public.epargnes FOR SELECT
USING (
  membre_id IN (SELECT id FROM membres WHERE user_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'tresorier', 'commissaire_comptes')
  )
);

CREATE POLICY "Trésoriers peuvent gérer les épargnes"
ON public.epargnes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'tresorier')
  )
);

-- Politiques pour les exercices
CREATE POLICY "Tous peuvent voir les exercices"
ON public.exercices FOR SELECT
USING (true);

CREATE POLICY "Administrateurs peuvent gérer les exercices"
ON public.exercices FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name = 'administrateur'
  )
);

-- Politiques pour les types d'aides
CREATE POLICY "Tous peuvent voir les types d'aides"
ON public.aides_types FOR SELECT
USING (true);

CREATE POLICY "Administrateurs peuvent gérer les types d'aides"
ON public.aides_types FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name = 'administrateur'
  )
);

-- Politiques pour les aides
CREATE POLICY "Tous peuvent voir les aides"
ON public.aides FOR SELECT
USING (true);

CREATE POLICY "Trésoriers peuvent gérer les aides"
ON public.aides FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'tresorier')
  )
);

-- Politiques pour les types de sanctions
CREATE POLICY "Tous peuvent voir les types de sanctions"
ON public.sanctions_types FOR SELECT
USING (true);

CREATE POLICY "Censeurs peuvent gérer les types de sanctions"
ON public.sanctions_types FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'censeur')
  )
);

-- Politiques pour les sanctions
CREATE POLICY "Tous peuvent voir les sanctions"
ON public.sanctions FOR SELECT
USING (true);

CREATE POLICY "Censeurs peuvent gérer les sanctions"
ON public.sanctions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'censeur')
  )
);

-- Politiques pour les réunions
CREATE POLICY "Tous peuvent voir les réunions"
ON public.reunions FOR SELECT
USING (true);

CREATE POLICY "Secrétaires peuvent gérer les réunions"
ON public.reunions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'secretaire_general')
  )
);

-- Politiques pour les rapports de séances
CREATE POLICY "Tous peuvent voir les rapports de séances"
ON public.rapports_seances FOR SELECT
USING (true);

CREATE POLICY "Secrétaires peuvent gérer les rapports"
ON public.rapports_seances FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'secretaire_general')
  )
);

-- Politiques pour Sport E2D
CREATE POLICY "Tous peuvent voir les activités Sport E2D"
ON public.sport_e2d_activites FOR SELECT
USING (true);

CREATE POLICY "Responsables sportifs peuvent gérer Sport E2D"
ON public.sport_e2d_activites FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'responsable_sportif')
  )
);

-- Politiques similaires pour les dépenses et recettes Sport E2D
CREATE POLICY "Tous peuvent voir les dépenses Sport E2D"
ON public.sport_e2d_depenses FOR SELECT
USING (true);

CREATE POLICY "Responsables peuvent gérer les dépenses Sport E2D"
ON public.sport_e2d_depenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'responsable_sportif', 'tresorier')
  )
);

CREATE POLICY "Tous peuvent voir les recettes Sport E2D"
ON public.sport_e2d_recettes FOR SELECT
USING (true);

CREATE POLICY "Responsables peuvent gérer les recettes Sport E2D"
ON public.sport_e2d_recettes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name IN ('administrateur', 'responsable_sportif', 'tresorier')
  )
);

-- Politiques pour l'historique des connexions
CREATE POLICY "Administrateurs peuvent voir l'historique des connexions"
ON public.historique_connexion FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
    AND r.name = 'administrateur'
  )
);

-- Politiques pour les fichiers joints
CREATE POLICY "Utilisateurs peuvent voir les fichiers joints"
ON public.fichiers_joint FOR SELECT
USING (true);

CREATE POLICY "Utilisateurs peuvent ajouter des fichiers joints"
ON public.fichiers_joint FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers pour updated_at
CREATE TRIGGER update_prets_updated_at
  BEFORE UPDATE ON public.prets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epargnes_updated_at
  BEFORE UPDATE ON public.epargnes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les rôles manquants s'ils n'existent pas
INSERT INTO public.roles (name, description) VALUES 
('censeur', 'Censeur de l''association'),
('secretaire_general', 'Secrétaire général'),
('responsable_sportif', 'Responsable des activités sportives'),
('adherent_phoenix', 'Adhérent Phoenix uniquement')
ON CONFLICT (name) DO NOTHING;

-- Insérer quelques types d'aides par défaut
INSERT INTO public.aides_types (nom, montant_defaut, mode_repartition, description) VALUES 
('Aide maladie', 50000, 'reliquat', 'Aide pour hospitalisation'),
('Aide mariage', 100000, 'equitable', 'Aide pour mariage'),
('Aide décès', 150000, 'equitable', 'Aide pour décès')
ON CONFLICT DO NOTHING;

-- Insérer quelques types de sanctions par défaut
INSERT INTO public.sanctions_types (nom, montant, categorie, description) VALUES 
('Retard réunion', 1000, 'reunion', 'Retard à une réunion'),
('Absence réunion', 2000, 'reunion', 'Absence non justifiée à une réunion'),
('Carton jaune sport', 500, 'sport', 'Carton jaune lors d''une activité sportive'),
('Carton rouge sport', 2000, 'sport', 'Carton rouge lors d''une activité sportive'),
('Échec cotisation', 1500, 'financiere', 'Non-paiement des cotisations')
ON CONFLICT DO NOTHING;