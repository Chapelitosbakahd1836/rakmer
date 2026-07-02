import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const fromDt = from
    ? new Date(from + 'T00:00:00')
    : (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()
  const toDt = to
    ? new Date(to + 'T23:59:59')
    : (() => { const d = new Date(); d.setHours(23,59,59,999); return d })()

  const supabase = db()

  const [pedidosRes, leadsRes, showsRes, ultimasRes] = await Promise.all([
    // Pedidos pagos no período
    supabase
      .from('pedidos')
      .select('id, total, canal')
      .eq('status', 'pago')
      .gte('created_at', fromDt.toISOString())
      .lte('created_at', toDt.toISOString()),

    // Novos leads com WhatsApp no período
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .not('whatsapp', 'is', null)
      .neq('whatsapp', '')
      .gte('created_at', fromDt.toISOString())
      .lte('created_at', toDt.toISOString()),

    // Próximos 5 shows publicados
    supabase
      .from('espetaculos')
      .select('id, nome, data_hora, cidade, lugares_total')
      .eq('status', 'publicado')
      .gt('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true })
      .limit(5),

    // Últimas 10 vendas (sempre, sem filtro de data)
    supabase
      .from('pedidos')
      .select(`
        id, nome_cliente, whatsapp_cliente, total, canal, created_at,
        espetaculo:espetaculos(nome),
        itens:pedido_itens(quantidade, tipo, setor:setores(nome))
      `)
      .eq('status', 'pago')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const pedidos = pedidosRes.data || []
  const receita = pedidos.reduce((s, p) => s + Number(p.total), 0)
  const ingressosOnline      = pedidos.filter(p => p.canal === 'online').length
  const ingressosBilheteria  = pedidos.filter(p => p.canal === 'bilheteria').length

  // Vendidos por show (ingressos, não pedidos)
  const shows = showsRes.data || []
  let showsComVendas = shows.map(s => ({ ...s, vendidos: 0 }))

  if (shows.length) {
    const { data: ped } = await supabase
      .from('pedidos')
      .select('id, espetaculo_id')
      .in('espetaculo_id', shows.map(s => s.id))
      .eq('status', 'pago')

    if (ped?.length) {
      const { data: itens } = await supabase
        .from('pedido_itens')
        .select('pedido_id, quantidade')
        .in('pedido_id', ped.map(p => p.id))

      const qtdPorPedido: Record<string, number> = {}
      itens?.forEach(i => { qtdPorPedido[i.pedido_id] = (qtdPorPedido[i.pedido_id] || 0) + i.quantidade })

      const qtdPorShow: Record<string, number> = {}
      ped.forEach(p => { qtdPorShow[p.espetaculo_id] = (qtdPorShow[p.espetaculo_id] || 0) + (qtdPorPedido[p.id] || 0) })

      showsComVendas = shows.map(s => ({ ...s, vendidos: qtdPorShow[s.id] || 0 }))
    }
  }

  return NextResponse.json({
    kpis: {
      receita,
      total: pedidos.length,
      ingressosOnline,
      ingressosBilheteria,
      novosLeads: leadsRes.count ?? 0,
    },
    shows: showsComVendas,
    ultimasVendas: ultimasRes.data || [],
  }, { headers: { 'Cache-Control': 'no-store' } })
}
