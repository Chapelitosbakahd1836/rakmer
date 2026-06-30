-- ============================================================
-- Circo Rakmer — Schema completo (001 + 002 + 003 + 004)
-- Cole tudo de uma vez no Supabase SQL Editor
-- ============================================================

-- ── Page views ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz DEFAULT now()
);

-- ── Espetáculos (sessões de show) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS espetaculos (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text    UNIQUE NOT NULL,
  nome                text    NOT NULL,
  data_hora           timestamptz NOT NULL,
  cidade              text    NOT NULL,
  preco_minimo        numeric(10,2) NOT NULL DEFAULT 0,
  imagem_url          text,
  lugares_total       integer NOT NULL DEFAULT 100,
  lugares_disponiveis integer NOT NULL DEFAULT 100,
  status              text    NOT NULL DEFAULT 'rascunho',
  created_at          timestamptz DEFAULT now()
);

-- ── Tipos de ingresso (legado — mantido para compatibilidade) ─────────────
CREATE TABLE IF NOT EXISTS tipos_ingresso (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  espetaculo_id       uuid    NOT NULL REFERENCES espetaculos(id) ON DELETE CASCADE,
  nome                text    NOT NULL,
  preco               numeric(10,2) NOT NULL,
  preco_original      numeric(10,2),
  descricao           text,
  lugares_total       integer NOT NULL DEFAULT 100,
  lugares_disponiveis integer NOT NULL DEFAULT 100,
  created_at          timestamptz DEFAULT now()
);

-- ── Leads (funil de compra) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       text,
  nome             text,
  email            text,
  whatsapp         text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  espetaculo_id    uuid REFERENCES espetaculos(id),
  tipo_ingresso_id uuid REFERENCES tipos_ingresso(id),
  quantidade       integer DEFAULT 1,
  funil_step       integer DEFAULT 1,
  funil_step_nome  text    DEFAULT 'inicio',
  status           text    DEFAULT 'novo',
  stripe_session_id text,
  pago_em          timestamptz,
  followup_count   integer NOT NULL DEFAULT 0,
  ultimo_followup_at timestamptz,
  funil_abandonado_em timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── Clientes (compradores confirmados) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  email      text UNIQUE NOT NULL,
  whatsapp   text,
  created_at timestamptz DEFAULT now()
);

-- ── Ingressos ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingressos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid REFERENCES leads(id),
  espetaculo_id    uuid REFERENCES espetaculos(id),
  tipo_ingresso_id uuid REFERENCES tipos_ingresso(id),
  cliente_id       uuid REFERENCES clientes(id),
  status           text NOT NULL DEFAULT 'pendente',
  preco_pago       numeric(10,2),
  stripe_session_id text,
  pago_em          timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- ── Configurações (chave-valor) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave        text UNIQUE NOT NULL,
  valor        text NOT NULL DEFAULT '',
  atualizado_em timestamptz DEFAULT now()
);

-- ── Templates de ingresso ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates_ingresso (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           text    NOT NULL,
  preco          numeric(10,2) NOT NULL,
  preco_original numeric(10,2),
  descricao      text,
  lugares_total  integer NOT NULL DEFAULT 100,
  ativo          boolean DEFAULT true,
  criado_em      timestamptz DEFAULT now()
);

-- ── Log de atividades ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atividades_cliente (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  lead_id    uuid REFERENCES leads(id) ON DELETE SET NULL,
  tipo       text NOT NULL,
  detalhes   text,
  created_at timestamptz DEFAULT now()
);

-- ── Setores do venue (globais) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS setores (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text    NOT NULL,
  preco_inteira numeric(10,2) NOT NULL,
  preco_meia    numeric(10,2) NOT NULL,
  capacidade    integer NOT NULL DEFAULT 100,
  ordem         integer NOT NULL DEFAULT 0,
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz DEFAULT now()
);

-- ── Pedidos (Mercado Pago Pix) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid    REFERENCES leads(id),
  espetaculo_id    uuid    REFERENCES espetaculos(id),
  valor_total      numeric(10,2) NOT NULL DEFAULT 0,
  status           text    NOT NULL DEFAULT 'pendente'
                           CHECK (status IN ('pendente','pago','cancelado','expirado')),
  origem           text    NOT NULL DEFAULT 'site'
                           CHECK (origem IN ('site','bilheteria')),
  mp_payment_id    text,
  mp_preference_id text,
  pix_copia_cola   text,
  pix_qr_base64    text,
  expira_em        timestamptz,
  pago_em          timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── Itens do pedido ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_itens (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id      uuid    NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  setor_id       uuid    NOT NULL REFERENCES setores(id),
  tipo           text    NOT NULL CHECK (tipo IN ('inteira','meia')),
  quantidade     integer NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  preco_unitario numeric(10,2) NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- ── Eventos do funil (analytics) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos_funil (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    uuid REFERENCES leads(id) ON DELETE SET NULL,
  session_id text,
  tipo       text NOT NULL,
  metadata   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ── Colunas adicionais em leads ───────────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS consentimento    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consentimento_em timestamptz,
  ADD COLUMN IF NOT EXISTS utm              jsonb       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pedido_id        uuid        REFERENCES pedidos(id);

-- ── Colunas adicionais em ingressos ──────────────────────────────────────
ALTER TABLE ingressos
  ADD COLUMN IF NOT EXISTS pedido_id    uuid REFERENCES pedidos(id),
  ADD COLUMN IF NOT EXISTS setor_id     uuid REFERENCES setores(id),
  ADD COLUMN IF NOT EXISTS codigo_qr    text UNIQUE,
  ADD COLUMN IF NOT EXISTS tipo         text CHECK (tipo IN ('inteira','meia')),
  ADD COLUMN IF NOT EXISTS validado_em  timestamptz,
  ADD COLUMN IF NOT EXISTS validado_por text;

-- ── Funções e Triggers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pedidos_updated_at ON pedidos;
CREATE TRIGGER pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION gerar_codigo_ingresso()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text := 'RKM-';
  i     int;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    IF i = 4 THEN code := code || '-'; END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_codigo_ingresso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo_qr IS NULL THEN
    LOOP
      NEW.codigo_qr := gerar_codigo_ingresso();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM ingressos WHERE codigo_qr = NEW.codigo_qr
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_codigo_ingresso ON ingressos;
CREATE TRIGGER trigger_codigo_ingresso
  BEFORE INSERT ON ingressos
  FOR EACH ROW EXECUTE FUNCTION set_codigo_ingresso();

CREATE OR REPLACE FUNCTION confirmar_pedido(p_pedido_id uuid)
RETURNS void AS $$
DECLARE
  item      RECORD;
  i         int;
  p_lead_id uuid;
  p_esp_id  uuid;
BEGIN
  SELECT lead_id, espetaculo_id
  INTO p_lead_id, p_esp_id
  FROM pedidos
  WHERE id = p_pedido_id AND status = 'pendente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido % não encontrado ou já processado', p_pedido_id;
  END IF;

  UPDATE pedidos
  SET status = 'pago', pago_em = now()
  WHERE id = p_pedido_id;

  FOR item IN
    SELECT setor_id, tipo, quantidade, preco_unitario
    FROM pedido_itens
    WHERE pedido_id = p_pedido_id
  LOOP
    UPDATE espetaculos
    SET lugares_disponiveis = GREATEST(0, lugares_disponiveis - item.quantidade)
    WHERE id = p_esp_id;

    FOR i IN 1..item.quantidade LOOP
      INSERT INTO ingressos (
        pedido_id, lead_id, espetaculo_id, setor_id,
        tipo, status, preco_pago
      ) VALUES (
        p_pedido_id, p_lead_id, p_esp_id, item.setor_id,
        item.tipo, 'valido', item.preco_unitario
      );
    END LOOP;
  END LOOP;

  UPDATE leads
  SET
    status          = 'pago',
    pago_em         = now(),
    funil_step      = 7,
    funil_step_nome = 'pago',
    pedido_id       = p_pedido_id
  WHERE id = p_lead_id;

  INSERT INTO eventos_funil (lead_id, tipo, metadata)
  VALUES (p_lead_id, 'pago', jsonb_build_object('pedido_id', p_pedido_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validar_ingresso(
  p_codigo_qr text,
  p_operador  text DEFAULT 'portaria'
)
RETURNS jsonb AS $$
DECLARE
  ing RECORD;
BEGIN
  SELECT i.id, i.status, i.validado_em, i.tipo,
         s.nome AS setor_nome, e.data_hora
  INTO ing
  FROM ingressos i
  LEFT JOIN setores s    ON s.id = i.setor_id
  LEFT JOIN espetaculos e ON e.id = i.espetaculo_id
  WHERE i.codigo_qr = p_codigo_qr;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('resultado','invalido','mensagem','Ingresso não encontrado');
  END IF;

  IF ing.status = 'utilizado' THEN
    RETURN jsonb_build_object(
      'resultado','ja_utilizado',
      'mensagem','Ingresso já utilizado',
      'validado_em', ing.validado_em
    );
  END IF;

  UPDATE ingressos
  SET status = 'utilizado', validado_em = now(), validado_por = p_operador
  WHERE id = ing.id;

  RETURN jsonb_build_object(
    'resultado','valido',
    'mensagem','Entrada autorizada',
    'tipo', ing.tipo,
    'setor', ing.setor_nome,
    'data_hora', ing.data_hora
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE page_views      ENABLE ROW LEVEL SECURITY;
ALTER TABLE espetaculos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_ingresso  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingressos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_ingresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE setores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_funil   ENABLE ROW LEVEL SECURITY;

-- Leitura pública
DROP POLICY IF EXISTS "espetaculos_public_read"   ON espetaculos;
DROP POLICY IF EXISTS "tipos_ingresso_public_read" ON tipos_ingresso;
DROP POLICY IF EXISTS "configuracoes_public_read"  ON configuracoes;
DROP POLICY IF EXISTS "setores_public_read"        ON setores;
DROP POLICY IF EXISTS "ingressos_public_read"      ON ingressos;
CREATE POLICY "espetaculos_public_read"    ON espetaculos    FOR SELECT USING (true);
CREATE POLICY "tipos_ingresso_public_read" ON tipos_ingresso FOR SELECT USING (true);
CREATE POLICY "configuracoes_public_read"  ON configuracoes  FOR SELECT USING (true);
CREATE POLICY "setores_public_read"        ON setores        FOR SELECT USING (true);
CREATE POLICY "ingressos_public_read"      ON ingressos      FOR SELECT USING (true);

-- Inserção/atualização pública (funil)
DROP POLICY IF EXISTS "leads_public_insert"      ON leads;
DROP POLICY IF EXISTS "leads_public_update"      ON leads;
DROP POLICY IF EXISTS "page_views_public_insert" ON page_views;
DROP POLICY IF EXISTS "pedidos_public_insert"    ON pedidos;
DROP POLICY IF EXISTS "pedidos_public_select"    ON pedidos;
DROP POLICY IF EXISTS "pedido_itens_public_insert" ON pedido_itens;
DROP POLICY IF EXISTS "pedido_itens_public_select" ON pedido_itens;
DROP POLICY IF EXISTS "eventos_funil_public_insert" ON eventos_funil;
CREATE POLICY "leads_public_insert"        ON leads        FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_public_update"        ON leads        FOR UPDATE USING (true);
CREATE POLICY "page_views_public_insert"   ON page_views   FOR INSERT WITH CHECK (true);
CREATE POLICY "pedidos_public_insert"      ON pedidos      FOR INSERT WITH CHECK (true);
CREATE POLICY "pedidos_public_select"      ON pedidos      FOR SELECT USING (true);
CREATE POLICY "pedido_itens_public_insert" ON pedido_itens FOR INSERT WITH CHECK (true);
CREATE POLICY "pedido_itens_public_select" ON pedido_itens FOR SELECT USING (true);
CREATE POLICY "eventos_funil_public_insert" ON eventos_funil FOR INSERT WITH CHECK (true);

-- Apenas service_role (server-side)
DROP POLICY IF EXISTS "clientes_service_only"      ON clientes;
DROP POLICY IF EXISTS "atividades_service_only"    ON atividades_cliente;
DROP POLICY IF EXISTS "configuracoes_service_write" ON configuracoes;
DROP POLICY IF EXISTS "templates_service_all"      ON templates_ingresso;
DROP POLICY IF EXISTS "setores_service_write"      ON setores;
DROP POLICY IF EXISTS "pedidos_service_update"     ON pedidos;
DROP POLICY IF EXISTS "eventos_funil_service_read" ON eventos_funil;
CREATE POLICY "clientes_service_only"       ON clientes           USING (auth.role() = 'service_role');
CREATE POLICY "atividades_service_only"     ON atividades_cliente USING (auth.role() = 'service_role');
CREATE POLICY "configuracoes_service_write" ON configuracoes      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "templates_service_all"       ON templates_ingresso FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "setores_service_write"       ON setores            FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "pedidos_service_update"      ON pedidos            FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "eventos_funil_service_read"  ON eventos_funil      FOR SELECT USING (auth.role() = 'service_role');

-- ── Dados de exemplo ──────────────────────────────────────────────────────

INSERT INTO configuracoes (chave, valor) VALUES
  ('cidade',              'Manaus'),
  ('estado',              'AM'),
  ('nome_espetaculo',     'Grande Espetáculo Circo Rakmer'),
  ('horarios_semana',     '20:00'),
  ('horarios_fds',        '15:00,20:00'),
  ('blackout_dates',      ''),
  ('localizacao_texto',   'Av. Djalma Batista, 3000 — Manaus, AM'),
  ('localizacao_maps_url','https://maps.google.com/?q=Circo+Rakmer+Manaus'),
  ('whatsapp_suporte',    '5592991234567'),
  ('imagem_setores_url',  '')
ON CONFLICT (chave) DO NOTHING;

INSERT INTO setores (nome, preco_inteira, preco_meia, capacidade, ordem) VALUES
  ('Arquibancada',  30.00, 15.00, 400, 1),
  ('Cadeira',       60.00, 30.00, 250, 2),
  ('Camarote',     100.00, 50.00,  80, 3)
ON CONFLICT DO NOTHING;

INSERT INTO espetaculos (slug, nome, data_hora, cidade, preco_minimo, lugares_total, lugares_disponiveis, status)
VALUES
  ('manaus-jul-05-n', 'Grande Espetáculo Circo Rakmer', '2026-07-05 20:00:00-04', 'Manaus', 30.00, 730, 730, 'publicado'),
  ('manaus-jul-06-t', 'Grande Espetáculo Circo Rakmer', '2026-07-06 15:00:00-04', 'Manaus', 30.00, 730, 643, 'publicado'),
  ('manaus-jul-06-n', 'Grande Espetáculo Circo Rakmer', '2026-07-06 20:00:00-04', 'Manaus', 30.00, 730, 201, 'publicado'),
  ('manaus-jul-07-n', 'Grande Espetáculo Circo Rakmer', '2026-07-07 20:00:00-04', 'Manaus', 30.00, 730,  89, 'publicado'),
  ('manaus-jul-12-t', 'Grande Espetáculo Circo Rakmer', '2026-07-12 15:00:00-04', 'Manaus', 30.00, 730, 730, 'publicado'),
  ('manaus-jul-12-n', 'Grande Espetáculo Circo Rakmer', '2026-07-12 20:00:00-04', 'Manaus', 30.00, 730, 455, 'publicado'),
  ('manaus-jul-13-t', 'Grande Espetáculo Circo Rakmer', '2026-07-13 15:00:00-04', 'Manaus', 30.00, 730, 730, 'publicado'),
  ('manaus-jul-13-n', 'Grande Espetáculo Circo Rakmer', '2026-07-13 20:00:00-04', 'Manaus', 30.00, 730, 112, 'publicado')
ON CONFLICT (slug) DO NOTHING;
