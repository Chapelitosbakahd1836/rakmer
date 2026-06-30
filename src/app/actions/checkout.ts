'use server'

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

interface CheckoutInput {
  lead_id: string
  espetaculo_id: string
  tipo_ingresso_id: string
  tipo_nome: string
  quantidade: number
  preco_unitario: number
  nome: string
  email: string
  whatsapp: string
  espetaculo_nome: string
  meia_entrada?: boolean
}

export async function criarCheckoutSession(
  input: CheckoutInput
): Promise<{ url: string | null; error?: string }> {
  const db = adminSupabase()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // 1. Verify availability
  const { data: tipo } = await db
    .from('tipos_ingresso')
    .select('lugares_disponiveis, preco')
    .eq('id', input.tipo_ingresso_id)
    .single()

  if (!tipo || tipo.lugares_disponiveis < input.quantidade) {
    return { url: null, error: 'Ingressos insuficientes. Por favor, escolha outra quantidade.' }
  }

  // 2. Upsert cliente
  let clienteId: string | null = null
  const { data: existing } = await db
    .from('clientes')
    .select('id')
    .eq('email', input.email)
    .maybeSingle()

  if (existing) {
    clienteId = existing.id
    await db.from('clientes').update({ nome: input.nome, whatsapp: input.whatsapp }).eq('id', clienteId)
  } else {
    const { data: novo } = await db
      .from('clientes')
      .insert({ nome: input.nome, email: input.email, whatsapp: input.whatsapp })
      .select('id')
      .single()
    clienteId = novo?.id ?? null
  }

  const finalPreco = input.meia_entrada ? tipo.preco / 2 : tipo.preco

  // 3. Create pending ingressos
  const ingressosPayload = Array.from({ length: input.quantidade }, () => ({
    lead_id: input.lead_id.startsWith('local_') ? null : input.lead_id,
    espetaculo_id: input.espetaculo_id,
    tipo_ingresso_id: input.tipo_ingresso_id,
    cliente_id: clienteId,
    status: 'pendente',
    preco_pago: finalPreco,
  }))

  const { data: ingressosCriados } = await db
    .from('ingressos')
    .insert(ingressosPayload)
    .select('id')

  const ingressoIds = (ingressosCriados ?? []).map((r: { id: string }) => r.id).join(',')

  // 4. Create Stripe session (30 min expiry)
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'pix'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
    payment_method_options: {
      card: { installments: { enabled: true } },
      pix: { expires_after_seconds: 1800 },
    },
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: `${input.tipo_nome}${input.meia_entrada ? ' (Meia Entrada)' : ''} — ${input.espetaculo_nome}`,
            description: `Ingresso para ${input.espetaculo_nome}. Enviado pelo WhatsApp após confirmação.`,
          },
          unit_amount: Math.round(finalPreco * 100),
        },
        quantity: input.quantidade,
      },
    ],
    mode: 'payment',
    customer_email: input.email,
    expires_at: expiresAt,
    success_url: `${baseUrl}/confirmacao/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/comprar?cancelado=true&lead=${input.lead_id}`,
    metadata: {
      lead_id: input.lead_id,
      espetaculo_id: input.espetaculo_id,
      tipo_ingresso_id: input.tipo_ingresso_id,
      quantidade: String(input.quantidade),
      ingresso_ids: ingressoIds,
      cliente_id: clienteId ?? '',
      whatsapp: input.whatsapp,
    },
    locale: 'pt-BR',
  })

  // 5. Update ingressos with stripe_session_id
  if (ingressosCriados && ingressosCriados.length > 0) {
    await db
      .from('ingressos')
      .update({ stripe_session_id: session.id })
      .in('id', ingressosCriados.map((r: { id: string }) => r.id))
  }

  // 6. Update lead
  if (!input.lead_id.startsWith('local_')) {
    await db
      .from('leads')
      .update({
        stripe_session_id: session.id,
        status: 'checkout_iniciado',
        funil_step: 4,
        funil_step_nome: 'checkout_iniciado',
      })
      .eq('id', input.lead_id)
  }

  // 7. Fire tracking webhook (fire-and-forget)
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_TRACKING
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento: 'checkout_criado',
        lead_id: input.lead_id,
        stripe_session_id: session.id,
        valor_total: finalPreco * input.quantidade,
      }),
    }).catch(() => {})
  }

  return { url: session.url }
}
