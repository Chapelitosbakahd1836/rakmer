'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { FunilData } from './FunilCompra'

function formatPrice(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(str: string | null) {
  if (!str) return null
  const d = new Date(str)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  data: FunilData
  onBack: () => void
}

export default function Etapa4({ data, onBack }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = data.preco_unitario * data.quantidade
  const dateFormatted = formatDate(data.espetaculo_data)

  async function handleConfirmar() {
    setLoading(true)
    setError(null)

    try {
      // Criar pedido
      const { data: pedido, error: pedidoErr } = await supabase
        .from('pedidos')
        .insert({
          lead_id: data.lead_id && !data.lead_id.startsWith('local_') ? data.lead_id : null,
          espetaculo_id: data.espetaculo_id,
          nome_cliente: data.nome,
          email_cliente: data.email || '',
          whatsapp_cliente: data.whatsapp || '',
          status: 'pendente',
          total,
        })
        .select('id')
        .single()

      if (pedidoErr || !pedido) throw pedidoErr || new Error('Erro ao criar pedido')

      // Criar item do pedido
      if (data.tipo_ingresso_id) {
        await supabase.from('pedido_itens').insert({
          pedido_id: pedido.id,
          setor_id: data.tipo_ingresso_id,
          tipo: data.meia_entrada ? 'meia' : 'inteira',
          quantidade: data.quantidade,
          preco_unitario: data.preco_unitario,
          subtotal: total,
        })
      }

      // Atualizar lead
      if (data.lead_id && !data.lead_id.startsWith('local_')) {
        await supabase
          .from('leads')
          .update({ funil_step: 4, funil_step_nome: 'pedido_criado', status: 'quente' })
          .eq('id', data.lead_id)
      }

      router.push(`/confirmacao/${pedido.id}`)
    } catch (err: unknown) {
      console.error('[Etapa4] Erro ao criar pedido:', err)
      setError('Não foi possível confirmar o pedido. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">📋</div>
              <h2 className="font-playfair font-bold text-2xl sm:text-3xl text-white mb-1">
                Resumo do <span style={{ color: '#FFD700' }}>Pedido</span>
              </h2>
              <p className="text-white/45 text-sm">Confira os detalhes antes de confirmar</p>
            </div>

            {/* Ticket card */}
            <div
              className="rounded-2xl overflow-hidden mb-6"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1.5px solid rgba(255,215,0,0.25)',
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-4"
                style={{ background: 'rgba(255,215,0,0.08)', borderBottom: '1px solid rgba(255,215,0,0.15)' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FFD700' }}>
                  🎪 Circo Rakmer
                </p>
                <p className="font-playfair font-bold text-white text-lg mt-1">
                  {data.espetaculo_nome || 'Espetáculo'}
                </p>
              </div>

              {/* Details */}
              <div className="px-5 py-5 space-y-4">
                {dateFormatted && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider">Data e Horário</p>
                      <p className="text-white font-semibold text-sm mt-0.5">{dateFormatted}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🪑</span>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Setor</p>
                    <p className="text-white font-semibold text-sm mt-0.5">
                      {data.tipo_nome} — {data.meia_entrada ? 'Meia Entrada' : 'Inteira'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎟️</span>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Ingressos</p>
                    <p className="text-white font-semibold text-sm mt-0.5">
                      {data.quantidade}× {formatPrice(data.preco_unitario)} cada
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Nome</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{data.nome}</p>
                  </div>
                </div>
              </div>

              {/* Dashed divider */}
              <div className="px-5">
                <div style={{ borderTop: '1.5px dashed rgba(255,255,255,0.12)' }} />
              </div>

              {/* Total */}
              <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-white/50 text-sm font-medium">Total</p>
                <p className="font-bold text-3xl" style={{ color: '#FFD700' }}>
                  {formatPrice(total)}
                </p>
              </div>
            </div>

            {error && (
              <p className="text-center text-sm mb-4" style={{ color: '#ff6b75' }}>
                ⚠ {error}
              </p>
            )}

            <p className="text-center text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              🔒 Pagamento via Pix — rápido e seguro
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="relative z-10 p-4 border-t flex-shrink-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-xl mx-auto space-y-3">
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FFD700', boxShadow: '0 0 28px rgba(255,215,0,0.4)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="black" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Confirmando...
              </span>
            ) : (
              `🔒 Confirmar e Ir para Pagamento — ${formatPrice(total)}`
            )}
          </button>
          <button
            onClick={onBack}
            className="w-full text-center text-sm py-2 transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            ← Voltar e alterar ingresso
          </button>
        </div>
      </div>
    </div>
  )
}
