-- Fix infinite recursion in RLS policies by creating security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT r.name 
  FROM membres m
  JOIN membres_roles mr ON m.id = mr.membre_id  
  JOIN roles r ON mr.role_id = r.id
  WHERE m.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop and recreate problematic policies
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur profil" ON public.membres;
DROP POLICY IF EXISTS "Administrateurs peuvent tout faire sur les membres" ON public.membres;

-- Create new policies using the security definer function
CREATE POLICY "Utilisateurs peuvent modifier leur profil" 
ON public.membres 
FOR UPDATE 
USING (user_id = auth.uid() OR get_current_user_role() = 'administrateur');

CREATE POLICY "Administrateurs peuvent tout faire sur les membres" 
ON public.membres 
FOR ALL 
USING (get_current_user_role() = 'administrateur');