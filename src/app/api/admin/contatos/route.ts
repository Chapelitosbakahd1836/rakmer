import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = db()

  const [pedidosRes, leadsRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, nome_cliente, email_cliente, whatsapp_cliente, total, canal, created_at, espetaculo_id, espetaculo:espetaculos(nome)')
      .eq('status', 'pago')
      .order('created_at', { ascending: false }),

    supabase
      .from('leads')
      .select('id, nome, email, whatsapp, canal, created_at')
      .not('whatsapp', 'is', null)
      .neq('whatsapp', '')
      .order('created_at', { ascending: false }),
  ])

  const pedidos = pedidosRes.data || []
  const leads   = leadsRes.data || []

  const compradorWas = new Set(pedidos.map(p => p.whatsapp_cliente?.replace(/\D/g, '')).filter(Boolean))

  const leadsQueCompraram   = leads.filter(l => compradorWas.has(l.whatsapp?.replace(/\D/g, '')))
  const leadsNaoCompraram   = leads.filter(l => !compradorWas.has(l.whatsapp?.replace(/\D/g, '')))
  const compraramSemContato = pedidos.filter(p => !p.whatsapp_cliente)

  const canalCount: Record<string, number> = {}
  pedidos.forEach(p => { canalCount[p.canal || 'desconhecido'] = (canalCount[p.canal || 'desconhecido'] || 0) + 1 })

  return NextResponse.json({
    stats: {
      totalCompradores:       pedidos.length,
      leadsComWa:             leads.length,
      leadsQueCompraram:      leadsQueCompraram.length,
      leadsNaoCompraram:      leadsNaoCompraram.length,
      compraramSemContato:    compraramSemContato.length,
    },
    canalCount,
    compradores:          pedidos,
    leadsQueCompraram,
    leadsNaoCompraram,
    compraramSemContato,
    todosLeads:           leads,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const target = searchParams.get('target')
  const supabase = db()

  if (target === 'leads') {
    await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'target inválido' }, { status: 400 })
}
