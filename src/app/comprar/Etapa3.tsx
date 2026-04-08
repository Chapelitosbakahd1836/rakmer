'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { criarCheckoutSession } from '@/app/actions/checkout'
import type { FunilData } from './FunilCompra'

interface TipoIngresso {
  id: string
  espetaculo_id: string
  nome: string
  preco: number
  preco_original: number | null
  descricao: string | null
  lugares_disponiveis: number
  lugares_total: number
}

function formatPrice(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calcDesconto(original: number, atual: number): number {
  return Math.round(((original - atual) / original) * 100)
}

interface Props {
  data: FunilData
  onBack: () => void
}

export default function Etapa3({ data, onBack }: Props) {
  const [tipos, setTipos] = useState<TipoIngresso[]>([])
  const [loadingTipos, setLoadingTipos] = useState(true)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    data.tipo_ingresso_id ? `${data.tipo_ingresso_id}-${data.meia_entrada ? 'meia' : 'inteira'}` : null
  )
  const [quantidade, setQuantidade] = useState(data.quantidade || 1)
  const [saving, setSaving] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!data.espetaculo_id) return
    supabase
      .from('tipos_ingresso')
      .select('*')
      .eq('espetaculo_id', data.espetaculo_id)
      .order('preco', { ascending: true })
      .then(({ data: rows }) => {
        const list = rows || []
        setTipos(list)
        if (list.length > 0 && !selectedOptionId) {
          setSelectedOptionId(`${list[0].id}-inteira`)
        }
        setLoadingTipos(false)
      })
  }, [data.espetaculo_id, selectedOptionId])

  const options = useMemo(() => {
    const list: Array<TipoIngresso & { optionId: string; isMeia: boolean; displayPreco: number; label: string }> = []
    tipos.forEach((t) => {
      list.push({
        ...t,
        optionId: `${t.id}-inteira`,
        isMeia: false,
        label: `${t.nome} (Full Price)`,
        displayPreco: t.preco,
      })
      list.push({
        ...t,
        optionId: `${t.id}-meia`,
        isMeia: true,
        label: `${t.nome} (Half Price)`,
        displayPreco: t.preco / 2,
      })
    })
    return list
  }, [tipos])

  const selectedOption = options.find((o) => o.optionId === selectedOptionId)
  const maxQtd = selectedOption ? Math.min(10, selectedOption.lugares_disponiveis) : 1
  const total = selectedOption ? selectedOption.displayPreco * quantidade : 0

  async function handleCheckout() {
    if (!selectedOption || !data.lead_id) return
    setSaving(true)
    setError(null)
    setStatusText('Saving your selection...')

    try {
      await supabase
        .from('leads')
        .update({
          tipo_ingresso_id: selectedOption.id,
          quantidade,
          funil_step: 3,
          funil_step_nome: 'lugar_escolhido',
        })
        .eq('id', data.lead_id)

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_TRACKING
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: 'funil_step3_completo',
            lead_id: data.lead_id,
            tipo_ingresso_id: selectedOption.id,
            quantidade,
            valor_total: total,
          }),
        }).catch(() => {})
      }

      setStatusText('Preparing your secure checkout...')

      const result = await criarCheckoutSession({
        lead_id: data.lead_id,
        espetaculo_id: data.espetaculo_id!,
        tipo_ingresso_id: selectedOption.id,
        tipo_nome: selectedOption.nome,
        quantidade,
        preco_unitario: selectedOption.displayPreco,
        nome: data.nome,
        email: data.email,
        whatsapp: data.whatsapp,
        espetaculo_nome: data.espetaculo_nome || '',
        meia_entrada: selectedOption.isMeia,
      })

      if (result.error) {
        throw new Error(result.error)
      }
      if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error('Checkout URL not returned')
      }
    } catch {
      setError('Error creating checkout. Please try again.')
      setSaving(false)
      setStatusText('')
    }
  }

  return (
    <div
      className="relative h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Side curtain decorations */}
      <div
        className="absolute top-0 left-0 w-6 h-full opacity-25 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(180deg, #7a0000 0px, #7a0000 28px, #b01a24 28px, #b01a24 56px)',
        }}
      />
      <div
        className="absolute top-0 right-0 w-6 h-full opacity-25 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(180deg, #7a0000 0px, #7a0000 28px, #b01a24 28px, #b01a24 56px)',
        }}
      />

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-xl mx-auto px-4 py-8 pb-4">
          <div className="text-center mb-7">
            <div className="text-5xl mb-3">🎪</div>
            <h2 className="font-playfair font-bold text-2xl sm:text-3xl text-white mb-1">
              Where do you want to <span style={{ color: '#FFD700' }}>sit?</span>
            </h2>
            {data.espetaculo_nome && (
              <p className="text-white/45 text-sm">{data.espetaculo_nome}</p>
            )}
          </div>

          {loadingTipos ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                />
              ))}
            </div>
          ) : tipos.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <p>No ticket types available for this show.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((tipo) => {
                const isSelected = selectedOptionId === tipo.optionId
                const pct = tipo.preco_original
                  ? calcDesconto(tipo.preco_original, tipo.preco)
                  : null
                const ocupPct =
                  tipo.lugares_total > 0
                    ? ((tipo.lugares_total - tipo.lugares_disponiveis) / tipo.lugares_total) * 100
                    : 0
                const quase = tipo.lugares_total > 0 && tipo.lugares_disponiveis < tipo.lugares_total * 0.2

                return (
                  <motion.button
                    key={tipo.optionId}
                    onClick={() => {
                      setSelectedOptionId(tipo.optionId)
                      setQuantidade(1)
                    }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full text-left p-5 rounded-xl transition-all duration-200"
                    style={{
                      backgroundColor: isSelected
                        ? 'rgba(255,215,0,0.1)'
                        : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isSelected ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: isSelected ? '0 0 20px rgba(255,215,0,0.15)' : 'none',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-xl">{tipo.label}</h3>
                          {pct && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: '#FFD700' }}
                            >
                              -{pct}%
                            </span>
                          )}
                          {quase && (
                            <span
                              className="text-xs font-bold animate-pulse"
                              style={{ color: '#FF4F7B' }}
                            >
                              🔥 ALMOST SOLD OUT
                            </span>
                          )}
                        </div>
                        {tipo.descricao && (
                          <p className="text-white/45 text-sm mb-2">{tipo.descricao}</p>
                        )}
                        <div className="flex items-center gap-2">
                          {tipo.preco_original && (
                            <span className="text-white/30 text-sm line-through">
                              {formatPrice(tipo.isMeia ? tipo.preco_original / 2 : tipo.preco_original)}
                            </span>
                          )}
                          <span className="font-bold text-2xl" style={{ color: '#FFD700' }}>
                            {formatPrice(tipo.displayPreco)}
                          </span>
                          <span className="text-white/35 text-xs">/ per person</span>
                        </div>
                      </div>

                      {/* Quantity selector */}
                      {isSelected && (
                        <div
                          className="flex items-center gap-1 rounded-lg p-1 shrink-0"
                          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                            disabled={quantidade <= 1}
                          >
                            −
                          </button>
                          <span className="w-7 text-center font-bold text-white text-lg">
                            {quantidade}
                          </span>
                          <button
                            onClick={() => setQuantidade((q) => Math.min(maxQtd, q + 1))}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                            disabled={quantidade >= maxQtd}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Availability bar */}
                    <div className="mt-3">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${ocupPct}%`,
                            backgroundColor: quase ? '#FF4F7B' : '#22c55e',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/25 mt-1">
                        <span>{tipo.lugares_disponiveis} available</span>
                        {isSelected && (
                          <span>max. {maxQtd} per order</span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          {error && (
            <p className="text-center text-sm mt-4" style={{ color: '#ff6b75' }}>
              ⚠ {error}
            </p>
          )}
        </div>
      </div>

      {/* Bottom summary + CTA */}
      {selectedOption && (
        <div
          className="relative z-10 p-4 border-t flex-shrink-0"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="max-w-xl mx-auto">
            {/* Summary row */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/55 text-sm">
                {selectedOption.label} × {quantidade}
              </div>
              <div className="font-bold text-2xl text-white">{formatPrice(total)}</div>
            </div>

            {/* Urgency */}
            <p className="text-xs text-center mb-3" style={{ color: '#FFD700' }}>
              ⚡ Reservation valid for 15 minutes after starting payment
            </p>

            <button
              onClick={handleCheckout}
              disabled={saving}
              className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#FFD700', boxShadow: '0 0 28px rgba(255,215,0,0.4)' }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {statusText || 'Please wait...'}
                </span>
              ) : (
                `🔒 Continue to Payment — ${formatPrice(total)}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
