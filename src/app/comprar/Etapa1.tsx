'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import type { FunilData } from './FunilCompra'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().min(14, 'WhatsApp inválido — use o formato (11) 99999-9999'),
})

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
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
  onNext: (updates: Partial<FunilData>) => void
}

export default function Etapa1({ data, onNext }: Props) {
  const [nome, setNome] = useState(data.nome)
  const [email, setEmail] = useState(data.email)
  const [whatsapp, setWhatsapp] = useState(data.whatsapp)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [curtainsOpen, setCurtainsOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCurtainsOpen(true), 250)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = schema.safeParse({ nome, email, whatsapp })
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

    // Try to save to Supabase — if it fails, use a local UUID and continue anyway
    let leadId: string
    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          nome,
          email,
          whatsapp,
          session_id: data.session_id,
          utm_source: data.utm_source,
          utm_medium: data.utm_medium,
          utm_campaign: data.utm_campaign,
          funil_step: 1,
          funil_step_nome: 'dados_preenchidos',
          status: 'novo',
        })
        .select('id')
        .single()

      if (error) throw error
      leadId = lead.id
    } catch (err) {
      console.error('[Etapa1] Supabase save failed, using local fallback:', err)
      leadId = 'local_' + generateUUID()
    }

    sessionStorage.setItem('lead_id', leadId)

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_TRACKING
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'funil_step1_completo',
          session_id: data.session_id,
          lead_id: leadId,
        }),
      }).catch(() => {})
    }

    setLoading(false)
    onNext({ nome, email, whatsapp, lead_id: leadId })
  }

  const inputStyle = (hasError: boolean) => ({
    backgroundColor: 'rgba(0,0,0,0.3)',
    border: `1.5px solid ${hasError ? '#E63946' : 'rgba(255,255,255,0.2)'}`,
    transition: 'border-color 0.2s',
  })

  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden px-4 py-8">
      {/* Spotlight glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 500px 600px at 50% -60px, rgba(255,215,0,0.08) 0%, transparent 65%)',
          animation: 'spotlight 4s ease-in-out infinite',
        }}
      />

      {/* Circus curtains opening animation */}
      <AnimatePresence>
        {!curtainsOpen && (
          <>
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 z-20"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #7a0000 0px, #7a0000 22px, #b01a24 22px, #b01a24 44px)',
              }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-1/2 z-20"
              style={{
                background:
                  'repeating-linear-gradient(270deg, #7a0000 0px, #7a0000 22px, #b01a24 22px, #b01a24 44px)',
              }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: curtainsOpen ? 1 : 0, y: curtainsOpen ? 0 : 24 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-5xl mb-3"
          >
            🎟️
          </motion.div>
          <h1 className="font-playfair font-bold text-3xl sm:text-4xl text-white mb-2">
            Informe seus dados
          </h1>
          <p className="text-sm font-medium" style={{ color: '#FFD700' }}>
            Receba descontos e seus ingressos pelo WhatsApp
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-white/70">
              Nome completo <span style={{ color: '#FFD700' }}>*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                if (errors.nome) setErrors((p) => ({ ...p, nome: undefined }))
              }}
              placeholder="Como você se chama?"
              className="w-full px-4 py-4 rounded-xl text-white placeholder-white/25 outline-none"
              style={inputStyle(!!errors.nome)}
              autoComplete="name"
            />
            {errors.nome && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: '#ff8fa0' }}>
                ⚠ {errors.nome}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-white/70">
              E-mail <span style={{ color: '#FFD700' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
              }}
              placeholder="seu@email.com"
              className="w-full px-4 py-4 rounded-xl text-white placeholder-white/25 outline-none"
              style={inputStyle(!!errors.email)}
              autoComplete="email"
              inputMode="email"
            />
            {errors.email && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: '#ff8fa0' }}>
                ⚠ {errors.email}
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-white/70">
              WhatsApp
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
                  if (errors.whatsapp) setErrors((p) => ({ ...p, whatsapp: undefined }))
                }}
                placeholder="(11) 99999-9999"
                className="flex-1 px-3 py-4 bg-transparent text-white placeholder-white/25 outline-none"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            {errors.whatsapp && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: '#ff8fa0' }}>
                ⚠ {errors.whatsapp}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            style={{
              backgroundColor: '#E63946',
              boxShadow: loading ? 'none' : '0 0 28px rgba(230,57,70,0.4)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Salvando...
              </span>
            ) : (
              'Próximo →'
            )}
          </button>

          <p className="text-center text-xs pt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            🔒 Dados protegidos com criptografia SSL
          </p>
        </form>
      </motion.div>
    </div>
  )
}
