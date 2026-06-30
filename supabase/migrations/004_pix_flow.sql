-- ============================================================
-- Migration 004 — Setores + Pedidos Pix + Ingressos com QR
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── Setores do venue (globais — valem para todos os espetáculos) ──────────
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

-- ── Pedidos (substitui Stripe — agora é Mercado Pago Pix) ────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid    REFERENCES leads(id),
  espetaculo_id    uuid    REFERENCES espetaculos(id),
  valor_total      numeric(10,2) NOT NULL DEFAULT 0,
  status           text    NOT NULL DEFAULT 'pendente'
                           CHECK (status IN ('pendente','pago','cancelado','expirado')),
  origem           text    NOT NULL DEFAULT 'site'
                           CHECK (origem IN ('site','bilheteria')),
  -- Mercado Pago
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
  -- 'home_view' | 'quiz_start' | 'dados_preenchidos' | 'data_escolhida'
  -- | 'setor_escolhido' | 'checkout_iniciado' | 'pix_gerado' | 'pago' | 'abandonado'
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
  ADD COLUMN IF NOT EXISTS pedido_id    uuid    REFERENCES pedidos(id),
  ADD COLUMN IF NOT EXISTS setor_id     uuid    REFERENCES setores(id),
  ADD COLUMN IF NOT EXISTS codigo_qr    text    UNIQUE,
  ADD COLUMN IF NOT EXISTS tipo         text    CHECK (tipo IN ('inteira','meia')),
  ADD COLUMN IF NOT EXISTS validado_em  timestamptz,
  ADD COLUMN IF NOT EXISTS validado_por text;

-- ── updated_at automático em pedidos ─────────────────────────────────────
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

-- ── Gerador de código legível de ingresso (ex: RKM-ABCD-1234) ────────────
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

-- Trigger: gera codigo_qr automaticamente ao inserir ingresso
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

-- ── Função principal: confirma pagamento e gera ingressos ────────────────
-- Chamada pelo webhook do Mercado Pago (server-side com service_role)
CREATE OR REPLACE FUNCTION confirmar_pedido(p_pedido_id uuid)
RETURNS void AS $$
DECLARE
  item      RECORD;
  i         int;
  p_lead_id uuid;
  p_esp_id  uuid;
BEGIN
  -- Busca dados do pedido
  SELECT lead_id, espetaculo_id
  INTO p_lead_id, p_esp_id
  FROM pedidos
  WHERE id = p_pedido_id AND status = 'pendente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido % não encontrado ou já processado', p_pedido_id;
  END IF;

  -- Marca pedido como pago
  UPDATE pedidos
  SET status = 'pago', pago_em = now()
  WHERE id = p_pedido_id;

  -- Processa cada item
  FOR item IN
    SELECT setor_id, tipo, quantidade, preco_unitario
    FROM pedido_itens
    WHERE pedido_id = p_pedido_id
  LOOP
    -- Desconta vagas do espetáculo
    UPDATE espetaculos
    SET lugares_disponiveis = GREATEST(0, lugares_disponiveis - item.quantidade)
    WHERE id = p_esp_id;

    -- Gera um ingresso por pessoa
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

  -- Atualiza lead para pago
  UPDATE leads
  SET
    status         = 'pago',
    pago_em        = now(),
    funil_step     = 7,
    funil_step_nome = 'pago',
    pedido_id      = p_pedido_id
  WHERE id = p_lead_id;

  -- Registra evento no funil
  INSERT INTO eventos_funil (lead_id, tipo, metadata)
  VALUES (p_lead_id, 'pago', jsonb_build_object('pedido_id', p_pedido_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Função: validar ingresso na portaria ──────────────────────────────────
CREATE OR REPLACE FUNCTION validar_ingresso(
  p_codigo_qr   text,
  p_operador    text DEFAULT 'portaria'
)
RETURNS jsonb AS $$
DECLARE
  ing RECORD;
BEGIN
  SELECT i.id, i.status, i.validado_em, i.tipo, i.setor_id,
         s.nome AS setor_nome, e.data_hora
  INTO ing
  FROM ingressos i
  LEFT JOIN setores s ON s.id = i.setor_id
  LEFT JOIN espetaculos e ON e.id = i.espetaculo_id
  WHERE i.codigo_qr = p_codigo_qr;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'resultado', 'invalido',
      'mensagem', 'Ingresso não encontrado'
    );
  END IF;

  IF ing.status = 'utilizado' THEN
    RETURN jsonb_build_object(
      'resultado',    'ja_utilizado',
      'mensagem',     'Ingresso já utilizado',
      'validado_em',  ing.validado_em
    );
  END IF;

  -- Marca como utilizado
  UPDATE ingressos
  SET status = 'utilizado', validado_em = now(), validado_por = p_operador
  WHERE id = ing.id;

  RETURN jsonb_build_object(
    'resultado',   'valido',
    'mensagem',    'Entrada autorizada',
    'tipo',        ing.tipo,
    'setor',       ing.setor_nome,
    'data_hora',   ing.data_hora
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS das novas tabelas ─────────────────────────────────────────────────
ALTER TABLE setores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_funil ENABLE ROW LEVEL SECURITY;

-- Setores: leitura pública, escrita apenas service_role
DROP POLICY IF EXISTS "setores_public_read"   ON setores;
DROP POLICY IF EXISTS "setores_service_write" ON setores;
CREATE POLICY "setores_public_read"   ON setores FOR SELECT USING (true);
CREATE POLICY "setores_service_write" ON setores FOR ALL   USING (auth.role() = 'service_role');

-- Pedidos: público cria e lê o próprio; service_role atualiza
DROP POLICY IF EXISTS "pedidos_public_insert"  ON pedidos;
DROP POLICY IF EXISTS "pedidos_public_select"  ON pedidos;
DROP POLICY IF EXISTS "pedidos_service_update" ON pedidos;
CREATE POLICY "pedidos_public_insert"  ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "pedidos_public_select"  ON pedidos FOR SELECT USING (true);
CREATE POLICY "pedidos_service_update" ON pedidos FOR UPDATE USING (auth.role() = 'service_role');

-- Pedido itens: público insere (no ato da compra), service lê
DROP POLICY IF EXISTS "pedido_itens_public_insert" ON pedido_itens;
DROP POLICY IF EXISTS "pedido_itens_public_select" ON pedido_itens;
CREATE POLICY "pedido_itens_public_insert" ON pedido_itens FOR INSERT WITH CHECK (true);
CREATE POLICY "pedido_itens_public_select" ON pedido_itens FOR SELECT USING (true);

-- Eventos funil: público insere, admin lê
DROP POLICY IF EXISTS "eventos_funil_public_insert" ON eventos_funil;
DROP POLICY IF EXISTS "eventos_funil_service_read"  ON eventos_funil;
CREATE POLICY "eventos_funil_public_insert" ON eventos_funil FOR INSERT WITH CHECK (true);
CREATE POLICY "eventos_funil_service_read"  ON eventos_funil FOR SELECT
  USING (auth.role() = 'service_role');

-- Ingressos: leitura pública do próprio código (para tela de confirmação)
DROP POLICY IF EXISTS "ingressos_public_read" ON ingressos;
CREATE POLICY "ingressos_public_read" ON ingressos FOR SELECT USING (true);

-- ── Dados de exemplo: setores ─────────────────────────────────────────────
INSERT INTO setores (nome, preco_inteira, preco_meia, capacidade, ordem) VALUES
  ('Arquibancada',  30.00, 15.00, 400, 1),
  ('Cadeira',       60.00, 30.00, 250, 2),
  ('Camarote',     100.00, 50.00,  80, 3)
ON CONFLICT DO NOTHING;

-- Configurações adicionais do circo
INSERT INTO configuracoes (chave, valor) VALUES
  ('estado',              'AM'),
  ('localizacao_texto',   'Av. Djalma Batista, 3000 — Manaus, AM'),
  ('localizacao_maps_url','https://maps.google.com/?q=Circo+Rakmer+Manaus'),
  ('whatsapp_suporte',    '5592991234567'),
  ('imagem_setores_url',  '')
ON CONFLICT (chave) DO NOTHING;

-- Espetáculos de exemplo com datas futuras (Manaus, julho 2026)
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
