-- Créer la table notifications_templates
CREATE TABLE notifications_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR NOT NULL UNIQUE,
  nom VARCHAR NOT NULL,
  categorie VARCHAR NOT NULL,
  description TEXT,
  template_sujet TEXT NOT NULL,
  template_contenu TEXT NOT NULL,
  email_expediteur VARCHAR,
  variables_disponibles JSONB DEFAULT '[]'::jsonb,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX idx_templates_code ON notifications_templates(code);
CREATE INDEX idx_templates_categorie ON notifications_templates(categorie);

-- Trigger pour updated_at
CREATE TRIGGER update_notifications_templates_updated_at
  BEFORE UPDATE ON notifications_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE notifications_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gèrent templates" 
  ON notifications_templates
  FOR ALL 
  USING (has_role('administrateur'));

CREATE POLICY "Tous voient templates actifs" 
  ON notifications_templates
  FOR SELECT 
  USING (actif = true OR has_role('administrateur'));

-- Insérer les templates par défaut
INSERT INTO notifications_templates (code, nom, categorie, template_sujet, template_contenu, variables_disponibles) VALUES
('creation_compte', 'Création de compte utilisateur', 'Compte utilisateur',
 'Bienvenue sur E2D - Vos identifiants de connexion',
 'Bonjour {{nom}} {{prenom}},

Votre compte E2D a été créé avec succès par un administrateur.

🔐 Vos identifiants de connexion :
- Email : {{email}}
- Mot de passe temporaire : {{password}}

🌐 Lien de connexion : {{app_url}}

⚠️ Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.

Cordialement,
L''équipe E2D',
 '["nom", "prenom", "email", "password", "app_url"]'::jsonb),

('rappel_cotisation', 'Rappel de Cotisation', 'Trésorerie',
 'Rappel - Cotisation en attente',
 'Bonjour {{nom_membre}},

Nous vous rappelons que votre cotisation de {{montant}} FCFA est en attente depuis {{nb_jours}} jours.

Type de cotisation : {{type_cotisation}}

Merci de régulariser votre situation.

Cordialement,
L''équipe E2D',
 '["nom_membre", "montant", "nb_jours", "type_cotisation"]'::jsonb),

('reunion_convocation', 'Convocation Réunion', 'Réunion',
 'Convocation - Réunion du {{date_reunion}}',
 'Bonjour {{nom_membre}},

Vous êtes convoqué(e) à la réunion qui se déroulera le {{date_reunion}} à {{heure_reunion}} au {{lieu_reunion}}.

📋 Ordre du jour :
{{ordre_du_jour}}

Votre présence est requise.

Cordialement,
Le Secrétaire Général',
 '["nom_membre", "date_reunion", "heure_reunion", "lieu_reunion", "ordre_du_jour"]'::jsonb),

('pret_echeance', 'Échéance de Prêt', 'Trésorerie',
 'Rappel - Échéance de prêt',
 'Bonjour {{nom_membre}},

Nous vous rappelons que l''échéance de votre prêt de {{montant_pret}} FCFA arrive le {{date_echeance}}.

💰 Montant à rembourser : {{montant_total}} FCFA

Merci de prévoir le remboursement.

Cordialement,
Le Trésorier',
 '["nom_membre", "montant_pret", "date_echeance", "montant_total", "taux_interet"]'::jsonb),

('sanction_notification', 'Notification de Sanction', 'Trésorerie',
 'Notification - Sanction appliquée',
 'Bonjour {{nom_membre}},

Une sanction de {{montant_sanction}} FCFA vous a été appliquée pour le motif suivant :
{{motif_sanction}}

Date d''application : {{date_sanction}}

Merci de régulariser cette situation.

Cordialement,
Le Censeur',
 '["nom_membre", "montant_sanction", "motif_sanction", "date_sanction"]'::jsonb),

('epargne_rappel', 'Rappel d''Épargne', 'Trésorerie',
 'Rappel - Épargne mensuelle',
 'Bonjour {{nom_membre}},

N''oubliez pas de constituer votre épargne mensuelle.

💵 Votre épargne actuelle : {{montant_epargne_actuel}} FCFA
🎯 Objectif : {{objectif_epargne}} FCFA

Merci de votre engagement.

Cordialement,
Le Trésorier',
 '["nom_membre", "montant_epargne_actuel", "objectif_epargne"]'::jsonb);