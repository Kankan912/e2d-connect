-- Fix search_path pour les fonctions trigger d'audit
DROP FUNCTION IF EXISTS log_permission_insert CASCADE;
DROP FUNCTION IF EXISTS log_permission_update CASCADE;
DROP FUNCTION IF EXISTS log_permission_delete CASCADE;

-- Fonction trigger pour INSERT avec search_path
CREATE OR REPLACE FUNCTION log_permission_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.permissions_audit (
    action,
    record_id,
    user_id,
    new_data
  ) VALUES (
    'INSERT',
    NEW.id,
    auth.uid(),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction trigger pour UPDATE avec search_path
CREATE OR REPLACE FUNCTION log_permission_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.permissions_audit (
    action,
    record_id,
    user_id,
    old_data,
    new_data
  ) VALUES (
    'UPDATE',
    NEW.id,
    auth.uid(),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction trigger pour DELETE avec search_path
CREATE OR REPLACE FUNCTION log_permission_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.permissions_audit (
    action,
    record_id,
    user_id,
    old_data
  ) VALUES (
    'DELETE',
    OLD.id,
    auth.uid(),
    to_jsonb(OLD)
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Réattacher triggers
DROP TRIGGER IF EXISTS trg_permission_insert_audit ON public.role_permissions;
DROP TRIGGER IF EXISTS trg_permission_update_audit ON public.role_permissions;
DROP TRIGGER IF EXISTS trg_permission_delete_audit ON public.role_permissions;

CREATE TRIGGER trg_permission_insert_audit
  AFTER INSERT ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_insert();

CREATE TRIGGER trg_permission_update_audit
  AFTER UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_update();

CREATE TRIGGER trg_permission_delete_audit
  AFTER DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_delete();
