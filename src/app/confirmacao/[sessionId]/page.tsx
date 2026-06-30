import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ConfirmacaoClient from './ConfirmacaoClient'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface Props {
  params: { sessionId: string }
}

export default async function ConfirmacaoPage({ params }: Props) {
  const { sessionId: pedidoId } = params
  const db = adminSupabase()

  const { data: pedido, error } = await db
    .from('pedidos')
    .select(`
      id,
      nome_cliente,
      whatsapp_cliente,
      email_cliente,
      total,
      status,
      espetaculo:espetaculos(nome, data_hora, cidade),
      itens:pedido_itens(quantidade, preco_unitario, tipo, setor:setores(nome))
    `)
    .eq('id', pedidoId)
    .single()

  if (error || !pedido) notFound()

  const espetaculo = (Array.isArray(pedido.espetaculo)
    ? pedido.espetaculo[0]
    : pedido.espetaculo) as { nome: string; data_hora: string; cidade: string } | null

  const itens = Array.isArray(pedido.itens) ? pedido.itens : []
  const item = itens[0] as { quantidade: number; preco_unitario: number; tipo: string; setor: unknown } | undefined
  const quantidade = item?.quantidade ?? 1
  const setorNome = (item?.setor as { nome: string } | null | undefined)?.nome ?? ''
  const tipo = item?.tipo ?? 'inteira'

  const now = new Date().toISOString()
  const { data: proximosEventos } = await db
    .from('espetaculos')
    .select('id, slug, nome, data_hora, cidade, preco_minimo, lugares_disponiveis')
    .eq('status', 'publicado')
    .gte('data_hora', now)
    .neq('id', espetaculo ? (pedido as any).espetaculo_id : '')
    .order('data_hora', { ascending: true })
    .limit(3)

  return (
    <ConfirmacaoClient
      pedidoId={pedidoId}
      quantidade={quantidade}
      valorTotal={pedido.total}
      nome={pedido.nome_cliente}
      whatsapp={pedido.whatsapp_cliente}
      setorNome={setorNome}
      tipo={tipo}
      espetaculo={espetaculo}
      proximosEventos={proximosEventos ?? []}
    />
  )
}
