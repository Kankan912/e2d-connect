-- Table adhesions
CREATE TABLE IF NOT EXISTS public.adhesions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  telephone VARCHAR(50) NOT NULL,
  type_adhesion VARCHAR(20) NOT NULL CHECK (type_adhesion IN ('e2d', 'phoenix', 'both')),
  montant_paye DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table payment_configs
CREATE TABLE IF NOT EXISTS public.payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table messages_contact
CREATE TABLE IF NOT EXISTS public.messages_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  telephone VARCHAR(50),
  objet VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies pour adhesions
ALTER TABLE public.adhesions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert adhesions" ON public.adhesions;
CREATE POLICY "Public can insert adhesions" ON public.adhesions 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can view adhesions" ON public.adhesions;
CREATE POLICY "Authenticated can view adhesions" ON public.adhesions 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can update adhesions" ON public.adhesions;
CREATE POLICY "Authenticated can update adhesions" ON public.adhesions 
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies pour payment_configs
ALTER TABLE public.payment_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active configs" ON public.payment_configs;
CREATE POLICY "Public can read active configs" ON public.payment_configs 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated manage configs" ON public.payment_configs;
CREATE POLICY "Authenticated manage configs" ON public.payment_configs 
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies pour messages_contact
ALTER TABLE public.messages_contact ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert messages" ON public.messages_contact;
CREATE POLICY "Public can insert messages" ON public.messages_contact 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can view messages" ON public.messages_contact;
CREATE POLICY "Authenticated can view messages" ON public.messages_contact 
  FOR SELECT USING (auth.role() = 'authenticated');