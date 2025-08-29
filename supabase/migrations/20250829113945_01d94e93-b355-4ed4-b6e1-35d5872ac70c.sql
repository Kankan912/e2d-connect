-- Créer un trigger pour la création automatique des profils membres
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.membres (user_id, nom, prenom, email, telephone, statut, est_membre_e2d)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telephone', ''),
    'actif',
    true
  );
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insérer les données par défaut sans ON CONFLICT car pas de contraintes uniques
DO $$
BEGIN
  -- Types de cotisations
  IF NOT EXISTS (SELECT 1 FROM cotisations_types WHERE nom = 'Cotisation mensuelle') THEN
    INSERT INTO cotisations_types (nom, description, montant_defaut, obligatoire) VALUES
    ('Cotisation mensuelle', 'Cotisation mensuelle obligatoire', 5000, true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM cotisations_types WHERE nom = 'Cotisation annuelle') THEN
    INSERT INTO cotisations_types (nom, description, montant_defaut, obligatoire) VALUES
    ('Cotisation annuelle', 'Cotisation annuelle', 50000, true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM cotisations_types WHERE nom = 'Fonds de solidarité') THEN
    INSERT INTO cotisations_types (nom, description, montant_defaut, obligatoire) VALUES
    ('Fonds de solidarité', 'Contribution au fonds de solidarité', 2000, false);
  END IF;
  
  -- Types d'aides
  IF NOT EXISTS (SELECT 1 FROM aides_types WHERE nom = 'Aide médicale') THEN
    INSERT INTO aides_types (nom, description, montant_defaut, mode_repartition) VALUES
    ('Aide médicale', 'Aide pour frais médicaux', 25000, 'equitable');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM aides_types WHERE nom = 'Aide funéraire') THEN
    INSERT INTO aides_types (nom, description, montant_defaut, mode_repartition) VALUES
    ('Aide funéraire', 'Aide en cas de décès', 50000, 'equitable');
  END IF;
  
  -- Types de sanctions
  IF NOT EXISTS (SELECT 1 FROM sanctions_types WHERE nom = 'Retard réunion') THEN
    INSERT INTO sanctions_types (nom, description, montant, categorie) VALUES
    ('Retard réunion', 'Retard à une réunion', 1000, 'discipline');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM sanctions_types WHERE nom = 'Absence non justifiée') THEN
    INSERT INTO sanctions_types (nom, description, montant, categorie) VALUES
    ('Absence non justifiée', 'Absence sans justification', 2000, 'discipline');
  END IF;
END $$;

-- Corriger les RLS policies avec des fonctions security definer pour éviter la récursion infinie
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT r.name 
  FROM membres m
  JOIN membres_roles mr ON m.id = mr.membre_id
  JOIN roles r ON mr.role_id = r.id
  WHERE m.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Corriger les policies des membres
DROP POLICY IF EXISTS "Utilisateurs peuvent ajouter des membres" ON public.membres;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur profil" ON public.membres;

CREATE POLICY "Utilisateurs peuvent ajouter des membres"
ON public.membres
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Utilisateurs peuvent modifier leur profil"
ON public.membres
FOR UPDATE
USING (user_id = auth.uid() OR public.get_current_user_role() = 'administrateur');