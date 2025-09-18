-- Phase 4: Infrastructure complète pour fiches membres et trésorerie

-- Table pour opérations du fond de caisse
CREATE TABLE public.fond_caisse_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_operation DATE NOT NULL DEFAULT CURRENT_DATE,
  type_operation VARCHAR NOT NULL CHECK (type_operation IN ('entree', 'sortie')),
  montant NUMERIC NOT NULL CHECK (montant > 0),
  libelle TEXT NOT NULL,
  beneficiaire_id UUID,
  operateur_id UUID NOT NULL,
  justificatif_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour clôtures journalières du fond de caisse
CREATE TABLE public.fond_caisse_clotures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_cloture DATE NOT NULL UNIQUE,
  solde_ouverture NUMERIC NOT NULL DEFAULT 0,
  total_entrees NUMERIC NOT NULL DEFAULT 0,
  total_sorties NUMERIC NOT NULL DEFAULT 0,
  solde_theorique NUMERIC NOT NULL DEFAULT 0,
  solde_reel NUMERIC NOT NULL DEFAULT 0,
  ecart NUMERIC GENERATED ALWAYS AS (solde_reel - solde_theorique) STORED,
  cloture_par UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour historique des activités membres
CREATE TABLE public.activites_membres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id UUID NOT NULL,
  type_activite VARCHAR NOT NULL,
  description TEXT NOT NULL,
  montant NUMERIC,
  reference_id UUID,
  reference_table VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour campagnes de notifications
CREATE TABLE public.notifications_campagnes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR NOT NULL,
  description TEXT,
  type_campagne VARCHAR NOT NULL CHECK (type_campagne IN ('rappel_cotisation', 'reunion', 'echeance_pret', 'custom')),
  destinataires JSONB NOT NULL DEFAULT '[]',
  template_sujet TEXT NOT NULL,
  template_contenu TEXT NOT NULL,
  date_envoi_prevue TIMESTAMP WITH TIME ZONE,
  date_envoi_reelle TIMESTAMP WITH TIME ZONE,
  statut VARCHAR NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'programme', 'envoye', 'annule')),
  nb_destinataires INTEGER DEFAULT 0,
  nb_envoyes INTEGER DEFAULT 0,
  nb_erreurs INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour tracking des envois individuels
CREATE TABLE public.notifications_envois (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campagne_id UUID NOT NULL REFERENCES notifications_campagnes(id) ON DELETE CASCADE,
  membre_id UUID NOT NULL,
  canal VARCHAR NOT NULL CHECK (canal IN ('email', 'sms', 'push')),
  statut VARCHAR NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'envoye', 'lu', 'erreur')),
  date_envoi TIMESTAMP WITH TIME ZONE,
  date_lecture TIMESTAMP WITH TIME ZONE,
  erreur_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.fond_caisse_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fond_caisse_clotures ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.activites_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_envois ENABLE ROW LEVEL SECURITY;

-- Policies pour fond de caisse
CREATE POLICY "Trésoriers peuvent gérer opérations fond de caisse" 
ON public.fond_caisse_operations 
FOR ALL 
USING (has_role('administrateur') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

CREATE POLICY "Tous peuvent voir opérations fond de caisse" 
ON public.fond_caisse_operations 
FOR SELECT 
USING (true);

CREATE POLICY "Trésoriers peuvent gérer clôtures fond de caisse" 
ON public.fond_caisse_clotures 
FOR ALL 
USING (has_role('administrateur') OR has_role('tresorier'))
WITH CHECK (has_role('administrateur') OR has_role('tresorier'));

CREATE POLICY "Tous peuvent voir clôtures fond de caisse" 
ON public.fond_caisse_clotures 
FOR SELECT 
USING (true);

-- Policies pour activités membres
CREATE POLICY "Membres voient leurs activités, admins toutes" 
ON public.activites_membres 
FOR SELECT 
USING (
  membre_id IN (SELECT id FROM membres WHERE user_id = auth.uid()) OR 
  has_role('administrateur') OR has_role('tresorier') OR has_role('commissaire_comptes')
);

CREATE POLICY "Système peut ajouter activités" 
ON public.activites_membres 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policies pour notifications
CREATE POLICY "Admins et secrétaires gèrent campagnes" 
ON public.notifications_campagnes 
FOR ALL 
USING (has_role('administrateur') OR has_role('secretaire_general'))
WITH CHECK (has_role('administrateur') OR has_role('secretaire_general'));

CREATE POLICY "Tous voient campagnes" 
ON public.notifications_campagnes 
FOR SELECT 
USING (true);

CREATE POLICY "Système gère envois notifications" 
ON public.notifications_envois 
FOR ALL 
USING (has_role('administrateur') OR has_role('secretaire_general'))
WITH CHECK (has_role('administrateur') OR has_role('secretaire_general'));

CREATE POLICY "Membres voient leurs envois" 
ON public.notifications_envois 
FOR SELECT 
USING (
  membre_id IN (SELECT id FROM membres WHERE user_id = auth.uid()) OR 
  has_role('administrateur') OR has_role('secretaire_general')
);

-- Triggers pour updated_at
CREATE TRIGGER update_fond_caisse_operations_updated_at
BEFORE UPDATE ON public.fond_caisse_operations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_campagnes_updated_at
BEFORE UPDATE ON public.notifications_campagnes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour enregistrer automatiquement les activités
CREATE OR REPLACE FUNCTION public.log_membre_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log pour cotisations
  IF TG_TABLE_NAME = 'cotisations' THEN
    INSERT INTO public.activites_membres (membre_id, type_activite, description, montant, reference_id, reference_table)
    VALUES (
      NEW.membre_id,
      'cotisation',
      'Cotisation payée: ' || COALESCE((SELECT nom FROM cotisations_types WHERE id = NEW.type_cotisation_id), 'Non spécifié'),
      NEW.montant,
      NEW.id,
      'cotisations'
    );
  END IF;
  
  -- Log pour épargnes
  IF TG_TABLE_NAME = 'epargnes' THEN
    INSERT INTO public.activites_membres (membre_id, type_activite, description, montant, reference_id, reference_table)
    VALUES (
      NEW.membre_id,
      'epargne',
      'Dépôt d''épargne effectué',
      NEW.montant,
      NEW.id,
      'epargnes'
    );
  END IF;
  
  -- Log pour prêts
  IF TG_TABLE_NAME = 'prets' THEN
    INSERT INTO public.activites_membres (membre_id, type_activite, description, montant, reference_id, reference_table)
    VALUES (
      NEW.membre_id,
      'pret',
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Prêt accordé'
        ELSE 'Prêt mis à jour'
      END,
      NEW.montant,
      NEW.id,
      'prets'
    );
  END IF;
  
  -- Log pour sanctions
  IF TG_TABLE_NAME = 'sanctions' THEN
    INSERT INTO public.activites_membres (membre_id, type_activite, description, montant, reference_id, reference_table)
    VALUES (
      NEW.membre_id,
      'sanction',
      'Sanction appliquée: ' || COALESCE(NEW.motif, 'Non spécifié'),
      NEW.montant,
      NEW.id,
      'sanctions'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Créer les triggers pour logging automatique
CREATE TRIGGER log_cotisation_activity
AFTER INSERT OR UPDATE ON public.cotisations
FOR EACH ROW
EXECUTE FUNCTION public.log_membre_activity();

CREATE TRIGGER log_epargne_activity
AFTER INSERT OR UPDATE ON public.epargnes
FOR EACH ROW
EXECUTE FUNCTION public.log_membre_activity();

CREATE TRIGGER log_pret_activity
AFTER INSERT OR UPDATE ON public.prets
FOR EACH ROW
EXECUTE FUNCTION public.log_membre_activity();

CREATE TRIGGER log_sanction_activity
AFTER INSERT OR UPDATE ON public.sanctions
FOR EACH ROW
EXECUTE FUNCTION public.log_membre_activity();

-- Créer bucket pour photos membres
INSERT INTO storage.buckets (id, name, public) VALUES ('membre-photos', 'membre-photos', true);

-- Policies pour storage bucket photos
CREATE POLICY "Tous peuvent voir les photos membres" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'membre-photos');

CREATE POLICY "Utilisateurs peuvent uploader des photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'membre-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Propriétaires et admins peuvent modifier les photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'membre-photos' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role('administrateur'))
);

CREATE POLICY "Propriétaires et admins peuvent supprimer les photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'membre-photos' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role('administrateur'))
);

-- Activer Realtime sur les nouvelles tables critiques
ALTER TABLE public.fond_caisse_operations REPLICA IDENTITY FULL;
ALTER TABLE public.fond_caisse_clotures REPLICA IDENTITY FULL;
ALTER TABLE public.activites_membres REPLICA IDENTITY FULL;
ALTER TABLE public.notifications_campagnes REPLICA IDENTITY FULL;
ALTER TABLE public.notifications_envois REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.fond_caisse_operations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fond_caisse_clotures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activites_membres;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_campagnes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_envois;