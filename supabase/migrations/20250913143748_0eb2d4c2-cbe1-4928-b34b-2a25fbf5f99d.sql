-- Add foreign key constraint between match_presences and membres
ALTER TABLE match_presences 
ADD CONSTRAINT fk_match_presences_membre_id 
FOREIGN KEY (membre_id) REFERENCES membres(id) ON DELETE CASCADE;