import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const db = adminSupabase()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata ?? {}
    const ingressoIds = meta.ingresso_ids ? meta.ingresso_ids.split(',').filter(Boolean) : []

    // Confirm ingressos
    if (ingressoIds.length > 0) {
      await db
        .from('ingressos')
        .update({ status: 'pago', pago_em: new Date().toISOString() })
        .in('id', ingressoIds)
    }

    // Update lead
    if (meta.lead_id && !meta.lead_id.startsWith('local_')) {
      await db
        .from('leads')
        .update({
          status: 'pago',
          funil_step: 4,
          funil_step_nome: 'pagamento_confirmado',
          pago_em: new Date().toISOString(),
        })
        .eq('id', meta.lead_id)
    }

    // Fire N8N webhook for confirmação (sends WhatsApp message, etc.)
    const webhookCompra = process.env.N8N_WEBHOOK_COMPRA_CONFIRMADA
    if (webhookCompra) {
      fetch(webhookCompra, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'compra_confirmada',
          stripe_session_id: session.id,
          lead_id: meta.lead_id,
          cliente_id: meta.cliente_id,
          espetaculo_id: meta.espetaculo_id,
          tipo_ingresso_id: meta.tipo_ingresso_id,
          quantidade: Number(meta.quantidade ?? 1),
          whatsapp: meta.whatsapp,
          valor_total: (session.amount_total ?? 0) / 100,
          ingresso_ids: ingressoIds,
        }),
      }).catch(() => {})
    }

    // Fire tracking webhook
    const webhookTracking = process.env.NEXT_PUBLIC_N8N_WEBHOOK_TRACKING
    if (webhookTracking) {
      fetch(webhookTracking, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'pagamento_confirmado',
          lead_id: meta.lead_id,
          stripe_session_id: session.id,
          valor_total: (session.amount_total ?? 0) / 100,
        }),
      }).catch(() => {})
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata ?? {}
    const ingressoIds = meta.ingresso_ids ? meta.ingresso_ids.split(',').filter(Boolean) : []

    // Cancel pending ingressos
    if (ingressoIds.length > 0) {
      await db
        .from('ingressos')
        .update({ status: 'cancelado' })
        .in('id', ingressoIds)
        .eq('status', 'pendente')
    }

    // Update lead
    if (meta.lead_id && !meta.lead_id.startsWith('local_')) {
      await db
        .from('leads')
        .update({ status: 'abandonou', funil_step_nome: 'checkout_expirado' })
        .eq('id', meta.lead_id)
    }

    // Fire abandono webhook
    const webhookAbandono = process.env.NEXT_PUBLIC_N8N_WEBHOOK_ABANDONO
    if (webhookAbandono) {
      fetch(webhookAbandono, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'checkout_expirado',
          lead_id: meta.lead_id,
          stripe_session_id: session.id,
          whatsapp: meta.whatsapp,
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ received: true })
}
