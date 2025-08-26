-- Add missing foreign key constraints to fix table relationships

-- Add foreign keys for aides table
ALTER TABLE public.aides 
ADD CONSTRAINT fk_aides_beneficiaire 
FOREIGN KEY (beneficiaire_id) REFERENCES public.membres(id);

ALTER TABLE public.aides 
ADD CONSTRAINT fk_aides_type_aide 
FOREIGN KEY (type_aide_id) REFERENCES public.aides_types(id);

-- Add foreign key for epargnes table
ALTER TABLE public.epargnes 
ADD CONSTRAINT fk_epargnes_membre 
FOREIGN KEY (membre_id) REFERENCES public.membres(id);

-- Add foreign key for prets table
ALTER TABLE public.prets 
ADD CONSTRAINT fk_prets_membre 
FOREIGN KEY (membre_id) REFERENCES public.membres(id);

-- Add foreign key for reunions table
ALTER TABLE public.reunions 
ADD CONSTRAINT fk_reunions_lieu_membre 
FOREIGN KEY (lieu_membre_id) REFERENCES public.membres(id);

-- Add foreign keys for sanctions table
ALTER TABLE public.sanctions 
ADD CONSTRAINT fk_sanctions_membre 
FOREIGN KEY (membre_id) REFERENCES public.membres(id);

ALTER TABLE public.sanctions 
ADD CONSTRAINT fk_sanctions_type 
FOREIGN KEY (type_sanction_id) REFERENCES public.sanctions_types(id);