-- ============================================================
-- Migration 007 — Fixes e código legível em pedidos
-- Execute no Supabase SQL Editor
-- ============================================================

-- Código legível por pedido (tipo RKM-A1B2-C3D4)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo text UNIQUE;

-- Função de geração do código
CREATE OR REPLACE FUNCTION gerar_codigo_pedido()
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

-- Trigger: auto-preenche codigo na criação se não veio preenchido
CREATE OR REPLACE FUNCTION set_codigo_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    LOOP
      NEW.codigo := gerar_codigo_pedido();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM pedidos WHERE codigo = NEW.codigo
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_codigo_pedido ON pedidos;
CREATE TRIGGER trigger_codigo_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_codigo_pedido();

-- Preencher pedidos existentes que ficaram sem código
DO $$
DECLARE
  rec RECORD;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
BEGIN
  FOR rec IN SELECT id FROM pedidos WHERE codigo IS NULL LOOP
    LOOP
      code := 'RKM-';
      FOR i IN 1..8 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        IF i = 4 THEN code := code || '-'; END IF;
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM pedidos WHERE codigo = code);
    END LOOP;
    UPDATE pedidos SET codigo = code WHERE id = rec.id;
  END LOOP;
END $$;

-- Garantir que RLS permite leitura do código pelo anon (já coberto pela policy existente)
-- pedidos_public_select já existe: FOR SELECT USING (true)

-- Coluna utm_source em leads para rastrear origem (pode já existir via 000)
-- Apenas garante que existe
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;

-- View para admin: pedidos com código
CREATE OR REPLACE VIEW pedidos_admin AS
SELECT
  p.*,
  e.nome  AS espetaculo_nome,
  e.data_hora AS espetaculo_data_hora
FROM pedidos p
LEFT JOIN espetaculos e ON e.id = p.espetaculo_id;
