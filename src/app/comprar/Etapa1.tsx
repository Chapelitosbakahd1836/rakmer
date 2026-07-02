'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import type { FunilData } from './FunilCompra'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().optional().refine(
    v => !v || v.replace(/\D/g, '').length >= 10,
    'WhatsApp inválido — use o formato (11) 99999-9999'
  ),
})

type Errors = { nome?: string; whatsapp?: string }

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const CONFETTI_COLORS = ['#FFD700', '#FF4F7B', '#4ade80', '#60a5fa', '#ffffff', '#f97316']

const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i * 41 + 13) % 100}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  width: 6 + (i % 3) * 3,
  height: 10 + (i % 4) * 4,
  delay: (i * 0.11) % 2.2,
  duration: 2.6 + (i % 5) * 0.5,
  drift: ((i * 29) % 120) - 60,
  spin: 360 + ((i * 47) % 540),
  round: i % 4 === 0,
}))

function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {CONFETTI.map((c) => (
        <motion.div
          key={c.id}
          className="absolute top-0"
          style={{
            left: c.left,
            width: c.round ? c.width : c.width,
            height: c.round ? c.width : c.height,
            backgroundColor: c.color,
            borderRadius: c.round ? '50%' : '2px',
          }}
          initial={{ y: '-8vh', x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: '110vh',
            x: c.drift,
            rotate: c.spin,
            opacity: [1, 1, 0.9, 0.4],
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: 1.2,
          }}
        />
      ))}
    </div>
  )
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

interface Props {
  data: FunilData
  onDone: (updates: Partial<FunilData>) => void
}

export default function Etapa1({ data, onDone }: Props) {
  const [nome, setNome] = useState(data.nome)
  const [whatsapp, setWhatsapp] = useState(data.whatsapp)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = schema.safeParse({ nome, whatsapp: whatsapp || undefined })
    if (!result.success) {
      const fieldErrors: Errors = {}
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof Errors
        if (!fieldErrors[field]) fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setLoading(true)

    let leadId = generateUUID()
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          id: leadId,
          nome,
          whatsapp: whatsapp || null,
          session_id: data.session_id,
          utm_source: data.utm_source,
          utm_medium: data.utm_medium,
          utm_campaign: data.utm_campaign,
          funil_step: 1,
          funil_step_nome: 'dados_preenchidos',
          status: 'novo',
        })
      if (error) throw error
    } catch (err) {
      console.error('[Etapa1] Supabase save failed, using local fallback:', err)
      leadId = 'local_' + leadId
    }

    sessionStorage.setItem('lead_id', leadId)

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_TRACKING
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento: 'funil_step1_completo', session_id: data.session_id, lead_id: leadId }),
      }).catch(() => {})
    }

    setLoading(false)
    onDone({ nome, whatsapp, lead_id: leadId })
  }

  function handleSkip() {
    onDone({ nome: 'Visitante', whatsapp: '', lead_id: null })
  }

  const inputStyle = (hasError: boolean) => ({
    backgroundColor: 'rgba(0,0,0,0.35)',
    border: `1.5px solid ${hasError ? '#FF4F7B' : 'rgba(255,255,255,0.2)'}`,
    transition: 'border-color 0.2s',
  })

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <Confetti />

      <motion.div
        className="relative w-full max-w-md rounded-3xl overflow-hidden my-4"
        style={{
          background: 'linear-gradient(160deg, #3a1025 0%, #4a1530 60%, #2a0a18 100%)',
          border: '1.5px solid rgba(255,215,0,0.35)',
          boxShadow: '0 0 60px rgba(255,215,0,0.15), 0 24px 60px rgba(0,0,0,0.6)',
        }}
        initial={{ y: 48, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 48, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30, delay: 0.15 }}
      >
        {/* Faixa dourada de destaque */}
        <div
          className="px-6 py-4 text-center"
          style={{
            background: 'linear-gradient(90deg, rgba(255,215,0,0.16) 0%, rgba(255,215,0,0.28) 50%, rgba(255,215,0,0.16) 100%)',
            borderBottom: '1px solid rgba(255,215,0,0.25)',
          }}
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.08, 1] }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="text-4xl mb-1"
          >
            🎁
          </motion.div>
          <p className="font-playfair font-bold text-white text-xl leading-snug">
            Você acaba de ganhar{' '}
            <span style={{ color: '#FFD700' }}>descontos e promoções exclusivas!</span>
          </p>
        </div>

        <div className="px-6 py-5">
          <p className="text-center text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Diga como podemos te chamar para liberar suas ofertas 👇
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/70">
                Nome <span style={{ color: '#FFD700' }}>*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  if (errors.nome) setErrors(p => ({ ...p, nome: undefined }))
                }}
                placeholder="Como você se chama?"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/25 outline-none"
                style={inputStyle(!!errors.nome)}
                autoComplete="name"
              />
              {errors.nome && (
                <p className="text-xs mt-1.5 ml-1" style={{ color: '#ff8fa0' }}>⚠ {errors.nome}</p>
              )}
            </div>

            {/* WhatsApp — opcional */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/70">
                WhatsApp <span className="text-white/40 font-normal">(opcional)</span>
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={inputStyle(!!errors.whatsapp)}
              >
                <div className="flex items-center gap-1.5 pl-4 pr-3 border-r border-white/10 shrink-0">
                  <span className="text-lg leading-none">🇧🇷</span>
                  <span className="text-white/40 text-sm">+55</span>
                </div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(formatPhone(e.target.value))
                    if (errors.whatsapp) setErrors(p => ({ ...p, whatsapp: undefined }))
                  }}
                  placeholder="(11) 99999-9999"
                  className="flex-1 px-3 py-3.5 bg-transparent text-white placeholder-white/25 outline-none"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              {errors.whatsapp ? (
                <p className="text-xs mt-1.5 ml-1" style={{ color: '#ff8fa0' }}>⚠ {errors.whatsapp}</p>
              ) : (
                <p className="text-xs mt-1.5 ml-1" style={{ color: 'rgba(255,215,0,0.7)' }}>
                  ✦ Receba os descontos e novidades em primeira mão
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                backgroundColor: '#FFD700',
                boxShadow: loading ? 'none' : '0 0 28px rgba(255,215,0,0.45)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="black" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Salvando...
                </span>
              ) : '🎟️ Quero meus descontos →'}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-xs py-1.5 transition-colors hover:text-white/50"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Continuar sem desconto
            </button>

            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              🔒 Seus dados estão protegidos e não serão compartilhados
            </p>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}
