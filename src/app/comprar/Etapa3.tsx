'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { FunilData } from './FunilCompra'

interface Setor {
  id: string
  nome: string
  descricao: string | null
  preco_inteira: number
  preco_meia: number
  capacidade_total: number
  capacidade_disponivel: number
  cor: string | null
  icone: string | null
  ordem: number
  ativo: boolean
}

function formatPrice(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  data: FunilData
  onNext: (updates: Partial<FunilData>) => void
  onBack: () => void
}

const ICONS: Record<string, string> = {
  Arquibancada: '🪑',
  Cadeira: '💺',
  Camarote: '⭐',
}

export default function Etapa3({ data, onNext, onBack }: Props) {
  const [setores, setSetores] = useState<Setor[]>([])
  const [loading, setLoading] = useState(true)
  const [setorId, setSetorId] = useState<string | null>(data.tipo_ingresso_id)
  const [isMeia, setIsMeia] = useState(data.meia_entrada ?? false)
  const [quantidade, setQuantidade] = useState(data.quantidade || 1)

  useEffect(() => {
    supabase
      .from('setores')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .then(({ data: rows }) => {
        setSetores(rows || [])
        if (rows && rows.length > 0 && !setorId) {
          setSetorId(rows[0].id)
        }
        setLoading(false)
      })
  }, [])

  const setor = setores.find((s) => s.id === setorId)
  const preco = setor ? (isMeia ? setor.preco_meia : setor.preco_inteira) : 0
  const total = preco * quantidade
  const maxQtd = setor ? Math.min(10, setor.capacidade_disponivel || 10) : 1
  const disponiveis = setor?.capacidade_disponivel ?? 0
  const totalCap = setor?.capacidade_total ?? 0
  const pctVendido = totalCap > 0 ? ((totalCap - disponiveis) / totalCap) * 100 : 0
  const quaseEsgotado = totalCap > 0 && disponiveis < totalCap * 0.2

  function handleContinuar() {
    if (!setor) return
    onNext({
      tipo_ingresso_id: setor.id,
      tipo_nome: setor.nome,
      meia_entrada: isMeia,
      quantidade,
      preco_unitario: preco,
    })
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Curtain side decoration */}
      {['left', 'right'].map((side) => (
        <div
          key={side}
          className={`absolute top-0 ${side}-0 w-5 h-full opacity-20 pointer-events-none`}
          style={{
            background:
              'repeating-linear-gradient(180deg, #7a0000 0px, #7a0000 28px, #b01a24 28px, #b01a24 56px)',
          }}
        />
      ))}

      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="text-center mb-7">
            <div className="text-5xl mb-3">🎪</div>
            <h2 className="font-playfair font-bold text-2xl sm:text-3xl text-white mb-1">
              Onde você quer <span style={{ color: '#FFD700' }}>sentar?</span>
            </h2>
            {data.espetaculo_nome && (
              <p className="text-white/45 text-sm">{data.espetaculo_nome}</p>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          ) : (
            <>
              {/* Setor cards */}
              <div className="space-y-3 mb-6">
                {setores.map((s) => {
                  const isSelected = setorId === s.id
                  const icon = s.icone || ICONS[s.nome] || '🎟️'
                  const capPct = s.capacidade_total > 0
                    ? ((s.capacidade_total - s.capacidade_disponivel) / s.capacidade_total) * 100
                    : 0
                  const quase = s.capacidade_total > 0 && s.capacidade_disponivel < s.capacidade_total * 0.2

                  return (
                    <motion.button
                      key={s.id}
                      onClick={() => { setSetorId(s.id); setQuantidade(1) }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full text-left p-5 rounded-2xl transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${isSelected ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: isSelected ? '0 0 20px rgba(255,215,0,0.15)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-3xl">{icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-white text-lg">{s.nome}</h3>
                              {quase && (
                                <span className="text-xs font-bold animate-pulse" style={{ color: '#FF4F7B' }}>
                                  🔥 Quase esgotado
                                </span>
                              )}
                            </div>
                            {s.descricao && (
                              <p className="text-white/40 text-xs mt-0.5">{s.descricao}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-xl" style={{ color: '#FFD700' }}>
                            {formatPrice(s.preco_inteira)}
                          </p>
                          <p className="text-white/35 text-xs">inteira</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${capPct}%`, backgroundColor: quase ? '#FF4F7B' : '#22c55e' }}
                          />
                        </div>
                        <p className="text-right text-xs text-white/25 mt-1">
                          {s.capacidade_disponivel} vagas disponíveis
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Meia entrada */}
              {setor && (
                <div className="mb-6">
                  <p className="text-white/50 text-xs mb-2 font-semibold uppercase tracking-wider">
                    Tipo de ingresso
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Inteira', desc: 'Preço cheio', v: false, price: setor.preco_inteira },
                      { label: 'Meia Entrada', desc: 'Documento obrigatório', v: true, price: setor.preco_meia },
                    ].map(({ label, desc, v, price }) => (
                      <button
                        key={String(v)}
                        onClick={() => setIsMeia(v)}
                        className="p-4 rounded-xl transition-all text-left"
                        style={{
                          backgroundColor: isMeia === v ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
                          border: `2px solid ${isMeia === v ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        <p className="font-bold text-white text-sm">{label}</p>
                        <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                        <p className="font-bold mt-2" style={{ color: '#FFD700' }}>
                          {formatPrice(price)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantidade */}
              {setor && (
                <div className="mb-2">
                  <p className="text-white/50 text-xs mb-2 font-semibold uppercase tracking-wider">
                    Quantidade
                  </p>
                  <div
                    className="flex items-center gap-4 rounded-xl px-5 py-4 justify-between"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                  >
                    <button
                      onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                      disabled={quantidade <= 1}
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-2xl text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                      −
                    </button>
                    <span className="font-bold text-white text-2xl w-8 text-center">{quantidade}</span>
                    <button
                      onClick={() => setQuantidade((q) => Math.min(maxQtd, q + 1))}
                      disabled={quantidade >= maxQtd}
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-2xl text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {quaseEsgotado && (
                    <p className="text-xs mt-2 text-center" style={{ color: '#FF4F7B' }}>
                      ⚠ Restam apenas {disponiveis} vagas neste setor
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      {setor && (
        <div
          className="relative z-10 p-4 border-t flex-shrink-0"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/55 text-sm">
                {setor.nome} {isMeia ? '(Meia)' : '(Inteira)'} × {quantidade}
              </div>
              <div className="font-bold text-2xl text-white">{formatPrice(total)}</div>
            </div>
            <p className="text-xs text-center mb-3" style={{ color: '#FFD700' }}>
              ⚡ Reserva válida por 15 minutos após iniciar o pagamento
            </p>
            <button
              onClick={handleContinuar}
              className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: '#FFD700', boxShadow: '0 0 28px rgba(255,215,0,0.4)' }}
            >
              Continuar → {formatPrice(total)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
