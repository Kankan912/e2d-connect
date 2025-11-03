-- ============================================
-- TABLES CMS POUR SITE VITRINE E2D
-- ============================================

-- Table : cms_hero_slides (carousel page d'accueil)
CREATE TABLE IF NOT EXISTS public.cms_hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300),
  background_image TEXT NOT NULL,
  cta_text VARCHAR(100),
  cta_link VARCHAR(200),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : cms_pages (contenu des pages dynamiques)
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : cms_sections (sections de contenu par page)
CREATE TABLE IF NOT EXISTS public.cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  subtitle VARCHAR(300),
  content TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : cms_gallery (photos galerie)
CREATE TABLE IF NOT EXISTS public.cms_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_name VARCHAR(100) NOT NULL,
  title VARCHAR(200),
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : cms_events (événements)
CREATE TABLE IF NOT EXISTS public.cms_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(200),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : cms_partners (partenaires)
CREATE TABLE IF NOT EXISTS public.cms_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  logo_url TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : cms_settings (paramètres globaux)
CREATE TABLE IF NOT EXISTS public.cms_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  label VARCHAR(200),
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : demandes_adhesion (formulaire adhésion)
CREATE TABLE IF NOT EXISTS public.demandes_adhesion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  telephone VARCHAR(20),
  type_adhesion VARCHAR(50) NOT NULL, -- 'e2d', 'phoenix', 'les_deux'
  motivation TEXT,
  statut VARCHAR(20) DEFAULT 'en_attente', -- 'en_attente', 'approuve', 'refuse'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : messages_contact (formulaire contact)
CREATE TABLE IF NOT EXISTS public.messages_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  telephone VARCHAR(20),
  objet VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  statut VARCHAR(20) DEFAULT 'nouveau', -- 'nouveau', 'lu', 'traite'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_cms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cms_hero_slides_updated_at
  BEFORE UPDATE ON public.cms_hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_cms_sections_updated_at
  BEFORE UPDATE ON public.cms_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_cms_events_updated_at
  BEFORE UPDATE ON public.cms_events
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_cms_settings_updated_at
  BEFORE UPDATE ON public.cms_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- cms_hero_slides
ALTER TABLE public.cms_hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hero slides"
  ON public.cms_hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage hero slides"
  ON public.cms_hero_slides FOR ALL
  USING (auth.role() = 'authenticated');

-- cms_pages
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view pages"
  ON public.cms_pages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage pages"
  ON public.cms_pages FOR ALL
  USING (auth.role() = 'authenticated');

-- cms_sections
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active sections"
  ON public.cms_sections FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage sections"
  ON public.cms_sections FOR ALL
  USING (auth.role() = 'authenticated');

-- cms_gallery
ALTER TABLE public.cms_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active gallery"
  ON public.cms_gallery FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage gallery"
  ON public.cms_gallery FOR ALL
  USING (auth.role() = 'authenticated');

-- cms_events
ALTER TABLE public.cms_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active events"
  ON public.cms_events FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage events"
  ON public.cms_events FOR ALL
  USING (auth.role() = 'authenticated');

-- cms_partners
ALTER TABLE public.cms_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active partners"
  ON public.cms_partners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage partners"
  ON public.cms_partners FOR ALL
  USING (auth.role() = 'authenticated');

-- cms_settings
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view settings"
  ON public.cms_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage settings"
  ON public.cms_settings FOR ALL
  USING (auth.role() = 'authenticated');

-- demandes_adhesion
ALTER TABLE public.demandes_adhesion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit adhesion request"
  ON public.demandes_adhesion FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view adhesion requests"
  ON public.demandes_adhesion FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update adhesion requests"
  ON public.demandes_adhesion FOR UPDATE
  USING (auth.role() = 'authenticated');

-- messages_contact
ALTER TABLE public.messages_contact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact message"
  ON public.messages_contact FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view contact messages"
  ON public.messages_contact FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contact messages"
  ON public.messages_contact FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Paramètres par défaut
INSERT INTO public.cms_settings (key, value, label, description) VALUES
  ('site_title', 'Association E2D Connect', 'Titre du site', 'Titre principal du site'),
  ('site_tagline', 'Ensemble pour Demain', 'Slogan', 'Slogan de l''association'),
  ('contact_email', 'contact@e2d-connect.fr', 'Email de contact', 'Email principal'),
  ('contact_phone', '+33 1 23 45 67 89', 'Téléphone', 'Numéro de téléphone'),
  ('contact_address', '123 Rue de la République, 75001 Paris', 'Adresse', 'Adresse physique'),
  ('facebook_url', 'https://facebook.com/e2d', 'Facebook', 'URL page Facebook'),
  ('twitter_url', 'https://twitter.com/e2d', 'Twitter', 'URL compte Twitter'),
  ('instagram_url', 'https://instagram.com/e2d', 'Instagram', 'URL compte Instagram'),
  ('linkedin_url', 'https://linkedin.com/company/e2d', 'LinkedIn', 'URL page LinkedIn')
ON CONFLICT (key) DO NOTHING;

-- Pages de base
INSERT INTO public.cms_pages (page_key, title, content, meta_description) VALUES
  ('about', 'À propos de nous', '<p>L''Association E2D Connect est une organisation dédiée à l''entraide et au développement communautaire.</p><p>Fondée en 2014, nous rassemblons des membres passionnés autour de projets solidaires.</p>', 'Découvrez l''Association E2D Connect, ses valeurs et sa mission'),
  ('activities', 'Nos Activités', '<p>E2D Connect propose diverses activités pour ses membres :</p><ul><li>Tontine E2D</li><li>Épargne collective</li><li>Prêts entre membres</li><li>Phoenix Football Club</li></ul>', 'Les activités et services proposés par E2D Connect'),
  ('legal', 'Mentions Légales', '<p>Association E2D Connect<br/>Siège social : 123 Rue de la République, 75001 Paris<br/>Email : contact@e2d-connect.fr</p>', 'Mentions légales de l''association E2D Connect')
ON CONFLICT (page_key) DO NOTHING;

-- Sections de la page activités
INSERT INTO public.cms_sections (page_key, title, subtitle, content, order_index, is_active) VALUES
  ('activities', 'Tontine E2D', 'Système d''épargne solidaire', 'Notre tontine permet à chaque membre de cotiser mensuellement et de bénéficier d''un tour pour recevoir l''ensemble des cotisations.', 1, true),
  ('activities', 'Épargne Collective', 'Constituez votre épargne', 'Déposez vos économies en toute sécurité et bénéficiez d''intérêts attractifs pour préparer vos projets futurs.', 2, true),
  ('activities', 'Prêts Entre Membres', 'Accédez au crédit facilement', 'Besoin d''un coup de pouce financier ? Notre système de prêts vous permet d''emprunter à des conditions avantageuses.', 3, true),
  ('activities', 'Phoenix Football', 'Notre équipe de football', 'Rejoignez le Phoenix Football Club, notre équipe de football amateur qui participe à des tournois locaux.', 4, true)
ON CONFLICT DO NOTHING;