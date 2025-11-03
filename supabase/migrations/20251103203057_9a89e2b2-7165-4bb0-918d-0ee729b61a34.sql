-- Ajouter policy DELETE pour épargnes (administrateur et trésorier)
CREATE POLICY "Trésoriers peuvent supprimer les épargnes" 
ON public.epargnes 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM membres m
    JOIN membres_roles mr ON m.id = mr.membre_id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid() 
      AND r.name IN ('administrateur', 'tresorier')
  )
);

-- Ajouter index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_epargnes_statut ON public.epargnes(statut);