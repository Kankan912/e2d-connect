-- Corriger les relations manquantes dans la Phase 4

-- Ajouter les contraintes de clé étrangère manquantes
ALTER TABLE public.fond_caisse_operations
ADD CONSTRAINT fk_fond_caisse_operations_beneficiaire 
FOREIGN KEY (beneficiaire_id) REFERENCES public.membres(id);

ALTER TABLE public.fond_caisse_operations
ADD CONSTRAINT fk_fond_caisse_operations_operateur 
FOREIGN KEY (operateur_id) REFERENCES public.membres(id);

ALTER TABLE public.fond_caisse_clotures
ADD CONSTRAINT fk_fond_caisse_clotures_cloture_par 
FOREIGN KEY (cloture_par) REFERENCES public.membres(id);

ALTER TABLE public.activites_membres
ADD CONSTRAINT fk_activites_membres_membre 
FOREIGN KEY (membre_id) REFERENCES public.membres(id);

ALTER TABLE public.notifications_campagnes
ADD CONSTRAINT fk_notifications_campagnes_created_by 
FOREIGN KEY (created_by) REFERENCES public.membres(id);

ALTER TABLE public.notifications_envois
ADD CONSTRAINT fk_notifications_envois_membre 
FOREIGN KEY (membre_id) REFERENCES public.membres(id);