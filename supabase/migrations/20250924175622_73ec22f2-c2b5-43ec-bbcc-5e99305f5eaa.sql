-- Corriger les politiques storage pour membre-photos

-- S'assurer que le bucket membre-photos est public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'membre-photos';

-- Supprimer les politiques existantes pour les recréer
DROP POLICY IF EXISTS "Photos membres publiques en lecture" ON storage.objects;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent uploader photos" ON storage.objects;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent modifier photos" ON storage.objects;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent supprimer photos" ON storage.objects;

-- Politique pour permettre à tout le monde de voir les photos (lecture)
CREATE POLICY "Photos membres publiques en lecture"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'membre-photos');

-- Politique pour permettre aux utilisateurs authentifiés d'uploader des photos
CREATE POLICY "Utilisateurs authentifiés peuvent uploader photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'membre-photos');

-- Politique pour permettre aux utilisateurs authentifiés de modifier les photos
CREATE POLICY "Utilisateurs authentifiés peuvent modifier photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'membre-photos');

-- Politique pour permettre aux utilisateurs authentifiés de supprimer des photos
CREATE POLICY "Utilisateurs authentifiés peuvent supprimer photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'membre-photos');