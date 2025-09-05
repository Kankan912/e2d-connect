
-- 1) Clés étrangères sur reunion_beneficiaires (sécurité et intégrité référentielle)
DO $$
BEGIN
  ALTER TABLE public.reunion_beneficiaires
    ADD CONSTRAINT reunion_beneficiaires_reunion_id_fkey
    FOREIGN KEY (reunion_id) REFERENCES public.reunions(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.reunion_beneficiaires
    ADD CONSTRAINT reunion_beneficiaires_membre_id_fkey
    FOREIGN KEY (membre_id) REFERENCES public.membres(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

-- 2) Index pour performances
CREATE INDEX IF NOT EXISTS idx_reunion_beneficiaires_reunion_id ON public.reunion_beneficiaires(reunion_id);
CREATE INDEX IF NOT EXISTS idx_reunion_beneficiaires_membre_id ON public.reunion_beneficiaires(membre_id);
CREATE INDEX IF NOT EXISTS idx_reunion_beneficiaires_date_prevue ON public.reunion_beneficiaires(date_benefice_prevue);

-- 3) Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS set_updated_at_reunion_beneficiaires ON public.reunion_beneficiaires;
CREATE TRIGGER set_updated_at_reunion_beneficiaires
BEFORE UPDATE ON public.reunion_beneficiaires
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Paramétrage notifications: unicité par type + valeur par défaut "reunion_benefice"
DO $$
BEGIN
  ALTER TABLE public.notifications_config
    ADD CONSTRAINT notifications_config_type_unique UNIQUE (type_notification);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

INSERT INTO public.notifications_config (type_notification, delai_jours, actif, template_sujet, template_contenu)
VALUES (
  'reunion_benefice',
  7,
  true,
  'Rappel de bénéfice prévu',
  'Bonjour {{prenom}},\n\nVous êtes bénéficiaire d''un versement prévu le {{date_benefice}} d''un montant de {{montant}} FCFA lors de la réunion {{sujet_reunion}}.\nLieu/date de la réunion: {{date_reunion}}.\n\nCordialement.'
)
ON CONFLICT (type_notification) DO NOTHING;
