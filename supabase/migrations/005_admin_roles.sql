-- Tabela de papéis dos usuários admin
CREATE TABLE IF NOT EXISTS perfis_usuario (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'portaria'
                   CHECK (role IN ('admin', 'portaria', 'bilheteria')),
  nome        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE perfis_usuario ENABLE ROW LEVEL SECURITY;

-- Usuário lê apenas o próprio perfil
CREATE POLICY "read_own_profile" ON perfis_usuario
  FOR SELECT USING (auth.uid() = user_id);

-- Service role acesso total (para API routes)
CREATE POLICY "service_role_all" ON perfis_usuario
  USING (true) WITH CHECK (true);

-- Coluna para rastrear entrada na portaria
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entrada_em TIMESTAMPTZ;

-- Canal de venda (online pelo funil ou presencial na bilheteria) + forma de pagamento
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS canal TEXT NOT NULL DEFAULT 'online'
  CHECK (canal IN ('online', 'bilheteria'));
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;

-- ================================================================
-- APÓS criar os usuários no Supabase Dashboard Authentication → Users,
-- execute o INSERT abaixo substituindo o email pelo UUID correto:
--
-- INSERT INTO perfis_usuario (user_id, role, nome)
-- VALUES
--   ('<UUID do halistercirco1@gmail.com>', 'admin', 'Halister'),
--   ('<UUID do usuario bilheteria>',       'bilheteria', 'Bilheteria'),
--   ('<UUID do usuario portaria>',         'portaria', 'Portaria');
-- ================================================================
