import { notFound } from 'next/navigation'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import ConfirmacaoClient from './ConfirmacaoClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

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
  const { sessionId } = params

  // Fetch Stripe session
  let stripeSession: Stripe.Checkout.Session
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    notFound()
  }

  if (stripeSession.payment_status !== 'paid') {
    notFound()
  }

  const meta = stripeSession.metadata ?? {}
  const db = adminSupabase()

  // Fetch ingressos with espetaculo info
  const ingressoIds = meta.ingresso_ids ? meta.ingresso_ids.split(',').filter(Boolean) : []

  let ingressos: Array<{
    id: string
    preco_pago: number
    espetaculo: { nome: string; data_hora: string; cidade: string } | null
  }> = []

  if (ingressoIds.length > 0) {
    const { data } = await db
      .from('ingressos')
      .select('id, preco_pago, espetaculo:espetaculos(nome, data_hora, cidade)')
      .in('id', ingressoIds)

    ingressos = (data as any) ?? []
  }

  // Fetch lead for customer info (name, whatsapp)
  let leadNome = stripeSession.customer_details?.name ?? ''
  let leadWhatsapp = meta.whatsapp ?? ''

  if (meta.lead_id && !meta.lead_id.startsWith('local_')) {
    const { data: lead } = await db
      .from('leads')
      .select('nome, whatsapp')
      .eq('id', meta.lead_id)
      .maybeSingle()
    if (lead) {
      leadNome = lead.nome || leadNome
      leadWhatsapp = lead.whatsapp || leadWhatsapp
    }
  }

  // Fetch upcoming events for upsell
  const now = new Date().toISOString()
  const { data: proximosEventos } = await db
    .from('espetaculos')
    .select('id, slug, nome, data_hora, cidade, preco_minimo, lugares_disponiveis')
    .eq('status', 'publicado')
    .gte('data_hora', now)
    .order('data_hora', { ascending: true })
    .limit(3)

  const espetaculo = ingressos[0]?.espetaculo ?? null

  return (
    <ConfirmacaoClient
      stripeSessionId={sessionId}
      quantidade={ingressos.length || Number(meta.quantidade ?? 1)}
      valorTotal={(stripeSession.amount_total ?? 0) / 100}
      nome={leadNome}
      whatsapp={leadWhatsapp}
      email={stripeSession.customer_details?.email ?? ''}
      espetaculo={espetaculo}
      proximosEventos={proximosEventos ?? []}
    />
  )
}
