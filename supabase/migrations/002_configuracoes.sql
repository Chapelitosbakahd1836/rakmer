-- ============================================================
-- Migração 002 — Configurações e Templates de Ingresso
-- Execute no Supabase SQL Editor
-- ============================================================

-- Configurações globais (chave-valor)
CREATE TABLE IF NOT EXISTS configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor text NOT NULL DEFAULT '',
  atualizado_em timestamptz DEFAULT now()
);

-- Templates de ingresso reutilizáveis
CREATE TABLE IF NOT EXISTS templates_ingresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  preco numeric(10,2) NOT NULL,
  preco_original numeric(10,2),
  descricao text,
  lugares_total integer NOT NULL DEFAULT 100,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_ingresso ENABLE ROW LEVEL SECURITY;

-- Leitura pública em configuracoes (hero page busca a cidade)
CREATE POLICY "configuracoes_public_read" ON configuracoes FOR SELECT USING (true);

-- Escrita apenas service_role (server actions admin)
CREATE POLICY "configuracoes_service_write" ON configuracoes
  FOR ALL USING (auth.role() = 'service_role');

-- Templates: service_role tudo
CREATE POLICY "templates_service_all" ON templates_ingresso
  FOR ALL USING (auth.role() = 'service_role');

-- Valores padrão
INSERT INTO configuracoes (chave, valor) VALUES
  ('cidade', 'Pompéia-SP'),
  ('nome_espetaculo', 'Grande Espetáculo Circo Rakmer'),
  ('horarios_semana', '20:30'),
  ('horarios_fds', '18:00,20:30'),
  ('blackout_dates', '')
ON CONFLICT (chave) DO NOTHING;

-- Templates padrão
INSERT INTO templates_ingresso (nome, preco, preco_original, descricao, lugares_total) VALUES
  ('Pista', 45.00, NULL, 'Acesso geral ao espetáculo', 150),
  ('VIP', 89.00, 120.00, 'Assento numerado + brinde exclusivo', 50)
ON CONFLICT DO NOTHING;
