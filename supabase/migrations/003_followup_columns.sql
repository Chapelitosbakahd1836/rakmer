-- ============================================================
-- Migration 003: colunas de follow-up + atividades_cliente
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- ============================================================

-- Colunas de follow-up no leads (necessárias para n8n funcionar)
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS followup_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS funil_abandonado_em timestamptz;

-- Tabela de log de atividades (WhatsApp, emails, etc)
CREATE TABLE IF NOT EXISTS atividades_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  tipo text NOT NULL, -- 'whatsapp_followup', 'whatsapp_ingresso', 'email', etc
  detalhes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE atividades_cliente ENABLE ROW LEVEL SECURITY;

-- Permite service_role ler/escrever atividades (n8n usa service_role via postgres direct)
CREATE POLICY IF NOT EXISTS "atividades_service_only" ON atividades_cliente
  USING (auth.role() = 'service_role');
