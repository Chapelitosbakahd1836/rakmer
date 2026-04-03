'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { FunilData } from './FunilCompra'
import type { Evento } from '@/lib/types'

const WA_ESPERA = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_SUPORTE}?text=Oi!%20Quero%20entrar%20na%20lista%20de%20espera%20para%20o%20pr%C3%B3ximo%20espet%C3%A1culo`

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface Props {
  data: FunilData
  onNext: (updates: Partial<FunilData>) => void
  onBack: () => void
}

export default function Etapa2({ data, onNext, onBack: _onBack }: Props) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loadingEventos, setLoadingEventos] = useState(true)
  const [selected, setSelected] = useState<string | null>(
    data.espetaculo_id?.startsWith('slug:') ? null : data.espetaculo_id
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

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

      // Auto-select from URL slug
      if (data.espetaculo_id?.startsWith('slug:')) {
        const slug = data.espetaculo_id.replace('slug:', '')
        const match = list.find((e) => e.slug === slug)
        if (match) {
          setSelected(match.id)
          const d = new Date(match.data_hora)
          setSelectedDay(getDayKey(d))
          setViewMonth({ year: d.getFullYear(), month: d.getMonth() })
        }
      } else if (data.espetaculo_id && list.length > 0) {
        const match = list.find((e) => e.id === data.espetaculo_id)
        if (match) {
          const d = new Date(match.data_hora)
          setSelectedDay(getDayKey(d))
          setViewMonth({ year: d.getFullYear(), month: d.getMonth() })
        }
      }

      // If no events this month, jump to first event's month
      if (list.length > 0) {
        const now2 = new Date()
        const hasThisMonth = list.some((e) => {
          const d = new Date(e.data_hora)
          return d.getFullYear() === now2.getFullYear() && d.getMonth() === now2.getMonth()
        })
        if (!hasThisMonth) {
          const first = new Date(list[0].data_hora)
          setViewMonth({ year: first.getFullYear(), month: first.getMonth() })
        }
      }

      setLoadingEventos(false)
    }
    loadEventos()
  }, [data.espetaculo_id])

  // Map: YYYY-MM-DD → list of eventos
  const eventsByDay = useMemo(() => {
    const map = new Map<string, Evento[]>()
    eventos.forEach((ev) => {
      const key = getDayKey(new Date(ev.data_hora))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    })
    return map
  }, [eventos])

  const dayEvents = selectedDay ? (eventsByDay.get(selectedDay) || []) : []

  async function handleNext() {
    if (!selected) return
    const ev = eventos.find((e) => e.id === selected)
    if (!ev) return

    setSaving(true)
    setError(null)
    try {
      // Only update DB if we have a real lead_id (not local fallback)
      if (data.lead_id && !data.lead_id.startsWith('local_')) {
        const { error: dbErr } = await supabase
          .from('leads')
          .update({
            espetaculo_id: selected,
            funil_step: 2,
            funil_step_nome: 'data_escolhida',
          })
          .eq('id', data.lead_id)

        if (dbErr) throw dbErr
      }

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_TRACKING
      if (webhookUrl && data.lead_id) {
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

  // Calendar math
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { year, month } = viewMonth
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = getDayKey(today)

  const canGoPrev =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth())

  function prevMonth() {
    setViewMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    )
    setSelectedDay(null)
  }

  function nextMonth() {
    setViewMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    )
    setSelectedDay(null)
  }

  function handleDayClick(day: number) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayDate = new Date(year, month, day)
    dayDate.setHours(0, 0, 0, 0)
    if (dayDate < today) return
    const evs = eventsByDay.get(key) || []
    if (evs.length === 0) return

    setSelectedDay(key)
    // Auto-select if only one event
    if (evs.length === 1) {
      setSelected(evs[0].id)
    } else {
      setSelected(null)
    }
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-8 pb-4">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">📅</div>
            <h2 className="font-playfair font-bold text-2xl sm:text-3xl text-white mb-3">
              Quando você quer{' '}
              <span style={{ color: '#FFD700' }}>viver essa magia?</span>
            </h2>

            {/* Schedule info banner */}
            <div
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: 'rgba(255,215,0,0.07)',
                border: '1px solid rgba(255,215,0,0.22)',
              }}
            >
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                🎭 <span style={{ color: '#FFD700' }}>Segunda a Sexta</span> — espetáculos às <strong className="text-white">20:30</strong>
              </p>
              <p className="text-sm font-medium leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                🎪 <span style={{ color: '#FFD700' }}>Sábado, Domingo e Feriados</span> — às <strong className="text-white">18:00</strong> e <strong className="text-white">20:30</strong>
              </p>
            </div>
          </div>

          {loadingEventos ? (
            <div
              className="h-80 rounded-2xl animate-pulse"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            />
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
            <>
              {/* Calendar card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* Month navigation */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <button
                    onClick={prevMonth}
                    disabled={!canGoPrev}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-20 hover:bg-white/10"
                  >
                    <span className="text-white text-xl leading-none">‹</span>
                  </button>
                  <span className="font-semibold text-white">
                    {MONTHS_PT[month]} {year}
                  </span>
                  <button
                    onClick={nextMonth}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
                  >
                    <span className="text-white text-xl leading-none">›</span>
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 px-3 pt-4 pb-1">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="flex justify-center">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        {w}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1 px-3 pb-4">
                  {/* Empty offset cells */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const dayDate = new Date(year, month, day)
                    dayDate.setHours(0, 0, 0, 0)
                    const isPast = dayDate < today
                    const isToday = key === todayKey
                    const hasEvents = eventsByDay.has(key)
                    const isSelectedDay = selectedDay === key
                    const dayEvs = eventsByDay.get(key) || []
                    const almostFull = dayEvs.some(
                      (e) =>
                        e.lugares_total > 0 &&
                        e.lugares_disponiveis < e.lugares_total * 0.2
                    )

                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        disabled={isPast || !hasEvents}
                        className="relative flex flex-col items-center justify-center rounded-xl aspect-square transition-all duration-150"
                        style={{
                          opacity: isPast ? 0.2 : !hasEvents ? 0.4 : 1,
                          backgroundColor: isSelectedDay
                            ? 'rgba(255,215,0,0.3)'
                            : hasEvents && !isPast
                            ? 'rgba(255,215,0,0.16)'
                            : 'transparent',
                          border: isSelectedDay
                            ? '2px solid #FFD700'
                            : hasEvents && !isPast
                            ? '1.5px solid rgba(255,215,0,0.55)'
                            : isToday
                            ? '1.5px solid rgba(255,255,255,0.25)'
                            : '1.5px solid transparent',
                          cursor: isPast || !hasEvents ? 'default' : 'pointer',
                          boxShadow: isSelectedDay
                            ? '0 0 20px rgba(255,215,0,0.35)'
                            : hasEvents && !isPast
                            ? '0 0 8px rgba(255,215,0,0.12)'
                            : 'none',
                        }}
                      >
                        <span
                          className="text-sm leading-none"
                          style={{
                            fontWeight: isToday || isSelectedDay ? 800 : hasEvents ? 700 : 400,
                            color: isSelectedDay
                              ? '#FFD700'
                              : hasEvents && !isPast
                              ? '#FFFFFF'
                              : isPast
                              ? 'rgba(255,255,255,0.3)'
                              : 'rgba(255,255,255,0.35)',
                          }}
                        >
                          {day}
                        </span>

                        {/* Dots indicating shows */}
                        {hasEvents && !isPast && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvs.slice(0, 2).map((_, di) => (
                              <div
                                key={di}
                                className="w-1 h-1 rounded-full"
                                style={{
                                  backgroundColor: almostFull ? '#FF4F7B' : '#FFD700',
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Red dot for almost-full */}
                        {almostFull && !isPast && (
                          <div
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#FF4F7B', boxShadow: '0 0 4px #FF4F7B' }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mt-3 px-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor: 'rgba(255,215,0,0.12)',
                      border: '1.5px solid rgba(255,215,0,0.4)',
                    }}
                  />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Show disponível
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#FF4F7B', boxShadow: '0 0 4px #FF4F7B' }}
                  />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Esgotando
                  </span>
                </div>
              </div>

              {/* Time picker — appears when a day is clicked */}
              <AnimatePresence>
                {selectedDay && dayEvents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="mt-5"
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      Escolha o horário:
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {dayEvents.map((ev) => {
                        const time = new Date(ev.data_hora).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        const isSelected = selected === ev.id
                        const quaseEsgotado =
                          ev.lugares_total > 0 &&
                          ev.lugares_disponiveis < ev.lugares_total * 0.2

                        return (
                          <button
                            key={ev.id}
                            onClick={() => setSelected(ev.id)}
                            className="flex flex-col items-center px-6 py-4 rounded-xl transition-all duration-150 hover:scale-[1.02]"
                            style={{
                              backgroundColor: isSelected
                                ? 'rgba(255,215,0,0.15)'
                                : 'rgba(255,255,255,0.06)',
                              border: `2px solid ${isSelected ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                              boxShadow: isSelected
                                ? '0 0 16px rgba(255,215,0,0.22)'
                                : 'none',
                            }}
                          >
                            <span
                              className="font-bold text-2xl"
                              style={{ color: isSelected ? '#FFD700' : 'white' }}
                            >
                              {time}h
                            </span>
                            <span
                              className="text-xs mt-1"
                              style={{ color: quaseEsgotado ? '#FF4F7B' : 'rgba(255,255,255,0.35)' }}
                            >
                              {quaseEsgotado
                                ? '🔥 Esgotando!'
                                : `${ev.lugares_disponiveis} disponíveis`}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
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
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleNext}
              disabled={!selected || saving}
              className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#FFD700', boxShadow: '0 0 24px rgba(255,215,0,0.35)' }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="3"
                      strokeOpacity="0.25"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
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
