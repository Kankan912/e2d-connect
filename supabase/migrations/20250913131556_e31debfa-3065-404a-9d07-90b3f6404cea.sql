-- Add foreign key relationship for match_presences to membres
ALTER TABLE public.match_presences 
ADD CONSTRAINT fk_match_presences_membre 
FOREIGN KEY (membre_id) REFERENCES public.membres(id) ON DELETE CASCADE;