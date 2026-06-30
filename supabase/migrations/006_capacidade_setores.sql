-- ============================================================
-- Migration 006 — Capacidade de ingressos por setor (global,
-- vale para todos os dias/shows) + colunas que faltavam em
-- "pedidos" (nome_cliente, email_cliente, whatsapp_cliente, total)
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── Setores: capacidade definida uma única vez, aplicada a todo show ──────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'setores' AND column_name = 'capacidade'
  ) THEN
    ALTER TABLE setores ADD COLUMN IF NOT EXISTS capacidade_total integer;
    UPDATE setores SET capacidade_total = capacidade WHERE capacidade_total IS NULL;
    ALTER TABLE setores DROP COLUMN capacidade;
  END IF;
END $$;

ALTER TABLE setores ADD COLUMN IF NOT EXISTS capacidade_total integer NOT NULL DEFAULT 100;
ALTER TABLE setores ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE setores ADD COLUMN IF NOT EXISTS cor text;
ALTER TABLE setores ADD COLUMN IF NOT EXISTS icone text;

-- ── Pedidos: colunas usadas pelo funil/bilheteria/portaria que faltavam ───
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nome_cliente     text NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS email_cliente    text NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_cliente text NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS total            numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) NOT NULL DEFAULT 0;

-- ── View: disponibilidade real por sessão ──────────────────────────────────
-- A capacidade do setor é global (definida 1x pelo admin), mas as vagas
-- ocupadas são calculadas por sessão (espetaculo_id), então o mesmo setor
-- tem disponibilidade independente em cada dia/horário de show.
CREATE OR REPLACE VIEW setor_disponibilidade AS
SELECT
  e.id            AS espetaculo_id,
  s.id            AS id,
  s.nome,
  s.descricao,
  s.preco_inteira,
  s.preco_meia,
  s.capacidade_total,
  s.cor,
  s.icone,
  s.ordem,
  s.ativo,
  COALESCE(v.vendidos, 0)                                    AS vendidos,
  GREATEST(0, s.capacidade_total - COALESCE(v.vendidos, 0))  AS capacidade_disponivel
FROM espetaculos e
CROSS JOIN setores s
LEFT JOIN (
  SELECT p.espetaculo_id, pi.setor_id, SUM(pi.quantidade) AS vendidos
  FROM pedido_itens pi
  JOIN pedidos p ON p.id = pi.pedido_id
  WHERE p.status IN ('pago', 'pendente')
  GROUP BY p.espetaculo_id, pi.setor_id
) v ON v.espetaculo_id = e.id AND v.setor_id = s.id;
