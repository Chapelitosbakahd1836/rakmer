'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { FunilData } from './FunilCompra'
import type { Evento } from '@/lib/types'

const WA_ESPERA = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_SUPORTE}?text=Oi!%20Quero%20entrar%20na%20lista%20de%20espera%20para%20o%20pr%C3%B3ximo%20espet%C3%A1culo`

function TwinklingStars() {
  const [stars] = useState(() =>
    Array.from({ length: 0 }, (_, i) => ({  // dots already on FunilCompra bg
      id: i,
      left: `${(i * 37 + 7) % 100}%`,
      top: `${(i * 53 + 11) % 100}%`,
      size: (i % 3) + 1.5,
      delay: (i * 0.13) % 4,
      duration: 1.5 + (i % 3) * 0.8,
    }))
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function groupByMonth(eventos: Evento[]): Array<{ month: string; events: Evento[] }> {
  const map = new Map<string, Evento[]>()
  eventos.forEach((ev) => {
    const d = new Date(ev.data_hora)
    const key = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  })
  return Array.from(map.entries()).map(([month, events]) => ({ month, events }))
}

function parseDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    day: d.getDate().toString().padStart(2, '0'),
    weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
    month: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

interface Props {
  data: FunilData
  onNext: (updates: Partial<FunilData>) => void
  onBack: () => void
}

export default function Etapa2({ data, onNext, onBack }: Props) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loadingEventos, setLoadingEventos] = useState(true)
  const [selected, setSelected] = useState<string | null>(
    data.espetaculo_id?.startsWith('slug:') ? null : data.espetaculo_id
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEventos() {
      const now = new Date().toISOString()
      const { data: rows } = await supabase
        .from('espetaculos')
        .select('*')
        .eq('status', 'publicado')
        .gte('data_hora', now)
        .order('data_hora', { ascending: true })

      const list = rows || []
      setEventos(list)

      if (data.espetaculo_id?.startsWith('slug:')) {
        const slug = data.espetaculo_id.replace('slug:', '')
        const match = list.find((e) => e.slug === slug)
        if (match) setSelected(match.id)
      }

      setLoadingEventos(false)
    }
    loadEventos()
  }, [data.espetaculo_id])

  async function handleNext() {
    if (!selected || !data.lead_id) return
    const ev = eventos.find((e) => e.id === selected)
    if (!ev) return

    setSaving(true)
    setError(null)
    try {
      const { error: dbErr } = await supabase
        .from('leads')
        .update({
          espetaculo_id: selected,
          funil_step: 2,
          funil_step_nome: 'data_escolhida',
        })
        .eq('id', data.lead_id)

      if (dbErr) throw dbErr

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_TRACKING
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: 'funil_step2_completo',
            lead_id: data.lead_id,
            espetaculo_id: selected,
          }),
        }).catch(() => {})
      }

      onNext({
        espetaculo_id: selected,
        espetaculo_nome: ev.nome,
        espetaculo_data: ev.data_hora,
      })
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const grouped = groupByMonth(eventos)

  return (
    <div
      className="relative h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: 'transparent' }}
    >
      <TwinklingStars />

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 py-8 pb-4">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">📅</div>
            <h2 className="font-playfair font-bold text-2xl sm:text-3xl text-white mb-1">
              Quando você quer{' '}
              <span style={{ color: '#FFD700' }}>viver essa magia?</span>
            </h2>
            <p className="text-white/45 text-sm">Selecione o dia do espetáculo</p>
          </div>

          {loadingEventos ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                />
              ))}
            </div>
          ) : eventos.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-5xl mb-4">🎪</div>
              <p className="text-white/70 text-lg mb-1">Nenhum espetáculo disponível</p>
              <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
                Novas datas em breve! Entre na lista de espera e avisamos assim que abrir.
              </p>
              <a
                href={WA_ESPERA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                📲 Entrar na lista de espera
              </a>
            </div>
          ) : (
            grouped.map(({ month, events }) => (
              <div key={month} className="mb-7">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-3 capitalize">
                  {month}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {events.map((ev) => {
                    const { day, weekday, month: mon, time } = parseDate(ev.data_hora)
                    const isSelected = selected === ev.id
                    const ocupPct =
                      ev.lugares_total > 0
                        ? ((ev.lugares_total - ev.lugares_disponiveis) / ev.lugares_total) * 100
                        : 0
                    const quaseEsgotado =
                      ev.lugares_total > 0 && ev.lugares_disponiveis < ev.lugares_total * 0.2

                    return (
                      <motion.button
                        key={ev.id}
                        onClick={() => setSelected(ev.id)}
                        whileTap={{ scale: 0.96 }}
                        className="relative p-4 rounded-xl text-left transition-all duration-200"
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(255,215,0,0.12)'
                            : 'rgba(255,255,255,0.05)',
                          border: `2px solid ${isSelected ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: isSelected ? '0 0 18px rgba(255,215,0,0.2)' : 'none',
                        }}
                      >
                        {isSelected && (
                          <div
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                            style={{ backgroundColor: '#FFD700', color: '#000' }}
                          >
                            ✓
                          </div>
                        )}
                        {quaseEsgotado && !isSelected && (
                          <div className="mb-1.5">
                            <span
                              className="text-xs font-bold animate-pulse"
                              style={{ color: '#E63946' }}
                            >
                              🔥 ESGOTANDO
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="text-2xl font-bold text-white leading-none">{day}</div>
                          <div className="text-xs text-white/50 mt-0.5">
                            {weekday} · {mon}
                          </div>
                          <div
                            className="text-sm font-bold mt-2"
                            style={{ color: '#FFD700' }}
                          >
                            {time}h
                          </div>
                          <div className="text-xs text-white/35 mt-0.5">{ev.cidade}</div>
                        </div>

                        <div className="mt-3">
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${ocupPct}%`,
                                backgroundColor: quaseEsgotado ? '#E63946' : '#FFD700',
                              }}
                            />
                          </div>
                          <div className="text-xs text-white/25 mt-1">
                            {ev.lugares_disponiveis} disponíveis
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          {error && (
            <p className="text-center text-sm mt-4" style={{ color: '#ff6b75' }}>
              ⚠ {error}
            </p>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      {eventos.length > 0 && (
        <div
          className="relative z-10 p-4 border-t flex-shrink-0"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleNext}
              disabled={!selected || saving}
              className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#E63946' }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Salvando...
                </span>
              ) : selected ? (
                'Próximo →'
              ) : (
                'Selecione uma data acima'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
