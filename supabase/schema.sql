-- ============================================================
-- Circo Rakmer — Schema completo
-- Execute no Supabase SQL Editor
-- ============================================================

-- Page views (tracking)
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz DEFAULT now()
);

-- Espetáculos
CREATE TABLE IF NOT EXISTS espetaculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  data_hora timestamptz NOT NULL,
  cidade text NOT NULL,
  preco_minimo numeric(10,2) NOT NULL DEFAULT 0,
  imagem_url text,
  lugares_total integer NOT NULL DEFAULT 100,
  lugares_disponiveis integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'rascunho', -- 'rascunho' | 'publicado' | 'encerrado'
  created_at timestamptz DEFAULT now()
);

-- Tipos de ingresso por espetáculo
CREATE TABLE IF NOT EXISTS tipos_ingresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  espetaculo_id uuid NOT NULL REFERENCES espetaculos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  preco numeric(10,2) NOT NULL,
  preco_original numeric(10,2),
  descricao text,
  lugares_total integer NOT NULL DEFAULT 100,
  lugares_disponiveis integer NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Leads (funil de compra)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  nome text,
  email text,
  whatsapp text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  espetaculo_id uuid REFERENCES espetaculos(id),
  tipo_ingresso_id uuid REFERENCES tipos_ingresso(id),
  quantidade integer DEFAULT 1,
  funil_step integer DEFAULT 1,
  funil_step_nome text DEFAULT 'inicio',
  status text DEFAULT 'novo', -- 'novo' | 'checkout_iniciado' | 'pago' | 'abandonou'
  stripe_session_id text,
  pago_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clientes (compradores confirmados)
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  whatsapp text,
  created_at timestamptz DEFAULT now()
);

-- Ingressos
CREATE TABLE IF NOT EXISTS ingressos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  espetaculo_id uuid REFERENCES espetaculos(id),
  tipo_ingresso_id uuid REFERENCES tipos_ingresso(id),
  cliente_id uuid REFERENCES clientes(id),
  status text NOT NULL DEFAULT 'pendente', -- 'pendente' | 'pago' | 'cancelado' | 'usado'
  preco_pago numeric(10,2),
  stripe_session_id text,
  pago_em timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS — desabilita para simplificar (ajuste em produção)
-- ============================================================
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE espetaculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_ingresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingressos ENABLE ROW LEVEL SECURITY;

-- Permite leitura pública em espetáculos e tipos_ingresso (funil precisa)
CREATE POLICY "espetaculos_public_read" ON espetaculos FOR SELECT USING (true);
CREATE POLICY "tipos_ingresso_public_read" ON tipos_ingresso FOR SELECT USING (true);

-- Permite inserção pública em leads e page_views (anon key do frontend)
CREATE POLICY "leads_public_insert" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_public_update" ON leads FOR UPDATE USING (true);
CREATE POLICY "page_views_public_insert" ON page_views FOR INSERT WITH CHECK (true);

-- clientes e ingressos: apenas service role (server-side)
CREATE POLICY "clientes_service_only" ON clientes USING (auth.role() = 'service_role');
CREATE POLICY "ingressos_service_only" ON ingressos USING (auth.role() = 'service_role');

-- ============================================================
-- Espetáculo de exemplo para testar
-- ============================================================
INSERT INTO espetaculos (slug, nome, data_hora, cidade, preco_minimo, lugares_total, lugares_disponiveis, status)
VALUES
  ('pompeia-abr-05', 'Grande Espetáculo Circo Rakmer', '2026-04-05 19:00:00-03', 'Pompéia-SP', 45.00, 200, 200, 'publicado'),
  ('pompeia-abr-12', 'Grande Espetáculo Circo Rakmer', '2026-04-12 19:00:00-03', 'Pompéia-SP', 45.00, 200, 187, 'publicado'),
  ('pompeia-abr-19', 'Grande Espetáculo Circo Rakmer', '2026-04-19 16:00:00-03', 'Pompéia-SP', 45.00, 200, 38, 'publicado')
ON CONFLICT (slug) DO NOTHING;

-- Tipos de ingresso para cada espetáculo
INSERT INTO tipos_ingresso (espetaculo_id, nome, preco, preco_original, descricao, lugares_total, lugares_disponiveis)
SELECT
  id,
  'Pista',
  45.00,
  NULL,
  'Acesso geral ao espetáculo',
  150,
  150
FROM espetaculos WHERE slug IN ('pompeia-abr-05','pompeia-abr-12','pompeia-abr-19')
ON CONFLICT DO NOTHING;

INSERT INTO tipos_ingresso (espetaculo_id, nome, preco, preco_original, descricao, lugares_total, lugares_disponiveis)
SELECT
  id,
  'VIP',
  89.00,
  120.00,
  'Assento numerado na frente + brinde exclusivo',
  50,
  50
FROM espetaculos WHERE slug IN ('pompeia-abr-05','pompeia-abr-12','pompeia-abr-19')
ON CONFLICT DO NOTHING;
