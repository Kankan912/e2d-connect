-- Ajouter un trigger pour créer automatiquement un profil membre lors de l'inscription
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

-- Trigger pour créer automatiquement le profil membre
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Créer les types de cotisations par défaut s'ils n'existent pas
INSERT INTO cotisations_types (nom, description, montant_defaut, obligatoire) VALUES
('Cotisation mensuelle', 'Cotisation mensuelle obligatoire', 5000, true),
('Cotisation annuelle', 'Cotisation annuelle', 50000, true),
('Fonds de solidarité', 'Contribution au fonds de solidarité', 2000, false),
('Événements spéciaux', 'Cotisation pour événements spéciaux', 10000, false)
ON CONFLICT (nom) DO NOTHING;

-- Créer les types d'aides par défaut
INSERT INTO aides_types (nom, description, montant_defaut, mode_repartition) VALUES
('Aide médicale', 'Aide pour frais médicaux', 25000, 'equitable'),
('Aide funéraire', 'Aide en cas de décès', 50000, 'equitable'),
('Aide naissance', 'Aide pour naissance', 15000, 'equitable'),
('Aide scolarité', 'Aide pour frais de scolarité', 20000, 'equitable')
ON CONFLICT (nom) DO NOTHING;

-- Créer les types de sanctions par défaut
INSERT INTO sanctions_types (nom, description, montant, categorie) VALUES
('Retard réunion', 'Retard à une réunion', 1000, 'discipline'),
('Absence non justifiée', 'Absence sans justification', 2000, 'discipline'),
('Manquement grave', 'Comportement inapproprié', 5000, 'discipline'),
('Non respect règlement', 'Non respect du règlement intérieur', 3000, 'discipline')
ON CONFLICT (nom) DO NOTHING;

-- Corriger les RLS policies pour permettre l'insertion avec user_id
DROP POLICY IF EXISTS "Utilisateurs peuvent ajouter des membres" ON public.membres;
CREATE POLICY "Utilisateurs peuvent ajouter des membres"
ON public.membres
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur profil" ON public.membres;
CREATE POLICY "Utilisateurs peuvent modifier leur profil"
ON public.membres
FOR UPDATE
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM ((membres m
    JOIN membres_roles mr ON ((m.id = mr.membre_id)))
    JOIN roles r ON ((mr.role_id = r.id)))
  WHERE ((m.user_id = auth.uid()) AND ((r.name)::text = 'administrateur'::text))
));