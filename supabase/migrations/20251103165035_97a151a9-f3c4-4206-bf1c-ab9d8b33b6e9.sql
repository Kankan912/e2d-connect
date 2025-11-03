-- Fix: Attach audit triggers to role_permissions table
-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trg_permission_insert_audit ON public.role_permissions;
DROP TRIGGER IF EXISTS trg_permission_update_audit ON public.role_permissions;
DROP TRIGGER IF EXISTS trg_permission_delete_audit ON public.role_permissions;

-- Create triggers to log all changes to role_permissions
CREATE TRIGGER trg_permission_insert_audit
  AFTER INSERT ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_insert();

CREATE TRIGGER trg_permission_update_audit
  AFTER UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_update();

CREATE TRIGGER trg_permission_delete_audit
  AFTER DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_delete();