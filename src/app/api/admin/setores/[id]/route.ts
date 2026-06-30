import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { nome, descricao, preco_inteira, preco_meia, capacidade_total, cor, icone, ordem, ativo } = body

  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome
  if (descricao !== undefined) updates.descricao = descricao || null
  if (preco_inteira !== undefined) updates.preco_inteira = preco_inteira
  if (preco_meia !== undefined) updates.preco_meia = preco_meia
  if (capacidade_total !== undefined) updates.capacidade_total = capacidade_total
  if (cor !== undefined) updates.cor = cor || null
  if (icone !== undefined) updates.icone = icone || null
  if (ordem !== undefined) updates.ordem = ordem
  if (ativo !== undefined) updates.ativo = ativo

  const db = adminSupabase()
  const { data, error } = await db
    .from('setores')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return Response.json({ erro: error.message }, { status: 500 })
  return Response.json({ setor: data })
}
