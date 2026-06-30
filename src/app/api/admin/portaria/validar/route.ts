import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { codigo } = await req.json()

  if (!codigo || !String(codigo).startsWith('RAKMER:')) {
    return Response.json({ valido: false, mensagem: 'QR code inválido' })
  }

  const pedidoId = String(codigo).replace('RAKMER:', '').trim()

  if (!pedidoId || pedidoId.length < 10) {
    return Response.json({ valido: false, mensagem: 'Código corrompido' })
  }

  const db = adminSupabase()

  const { data: pedido, error } = await db
    .from('pedidos')
    .select(`
      id,
      nome_cliente,
      whatsapp_cliente,
      total,
      status,
      entrada_em,
      espetaculo:espetaculos(nome, data_hora, cidade),
      itens:pedido_itens(quantidade, tipo, setor:setores(nome))
    `)
    .eq('id', pedidoId)
    .single()

  if (error || !pedido) {
    return Response.json({ valido: false, mensagem: 'Ingresso não encontrado no sistema' })
  }

  if (pedido.entrada_em) {
    const hora = new Date(pedido.entrada_em).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return Response.json({
      valido: false,
      jaEntrou: true,
      mensagem: `⚠ Este ingresso já foi utilizado às ${hora}`,
      pedido,
    })
  }

  // Marca entrada
  await db
    .from('pedidos')
    .update({ entrada_em: new Date().toISOString() })
    .eq('id', pedidoId)

  return Response.json({
    valido: true,
    mensagem: '✓ Ingresso válido — pode entrar!',
    pedido,
  })
}
