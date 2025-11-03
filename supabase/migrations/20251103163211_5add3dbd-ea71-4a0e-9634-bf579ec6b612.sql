-- Table d'audit des permissions
CREATE TABLE IF NOT EXISTS public.permissions_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL DEFAULT 'role_permissions',
  record_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  
  -- Données avant/après modification
  old_data JSONB,
  new_data JSONB,
  
  -- Métadonnées
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_permissions_audit_user ON public.permissions_audit(user_id);
CREATE INDEX idx_permissions_audit_created ON public.permissions_audit(created_at DESC);
CREATE INDEX idx_permissions_audit_action ON public.permissions_audit(action);

-- Fonction trigger pour INSERT
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction trigger pour UPDATE
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction trigger pour DELETE
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher triggers
CREATE TRIGGER trg_permission_insert_audit
  AFTER INSERT ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_insert();

CREATE TRIGGER trg_permission_update_audit
  AFTER UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_update();

CREATE TRIGGER trg_permission_delete_audit
  AFTER DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_delete();

-- RLS Policies
ALTER TABLE public.permissions_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins lisent audit permissions"
  ON public.permissions_audit FOR SELECT
  USING (has_role('administrateur'));
