import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const db = adminSupabase()
  const { data, error } = await db
    .from('setores')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) return Response.json({ erro: error.message }, { status: 500 })
  return Response.json({ setores: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome, descricao, preco_inteira, preco_meia, capacidade_total, cor, icone, ordem } = body

  if (!nome || preco_inteira == null || preco_meia == null || capacidade_total == null) {
    return Response.json({ erro: 'Preencha nome, preços e capacidade.' }, { status: 400 })
  }

  const db = adminSupabase()
  const { data, error } = await db
    .from('setores')
    .insert({
      nome,
      descricao: descricao || null,
      preco_inteira,
      preco_meia,
      capacidade_total,
      cor: cor || null,
      icone: icone || null,
      ordem: ordem ?? 0,
    })
    .select('*')
    .single()

  if (error) return Response.json({ erro: error.message }, { status: 500 })
  return Response.json({ setor: data })
}
