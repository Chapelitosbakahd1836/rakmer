'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import Etapa1 from './Etapa1'
import Etapa2 from './Etapa2'
import Etapa3 from './Etapa3'
import useAbandonTracking from '@/hooks/useAbandonTracking'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Deterministic dots — same pattern as hero
const DOTS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 7) % 100}%`,
  top: `${(i * 53 + 11) % 100}%`,
  size: (i % 3) * 1.5 + 1.2,
  delay: (i * 0.19) % 5,
  duration: 2 + (i % 4) * 0.8,
}))

const STEP_LABELS = [
  { num: 1, label: 'Seus Dados', icon: '🎭' },
  { num: 2, label: 'Escolha a Data', icon: '📅' },
  { num: 3, label: 'Ingresso', icon: '🎪' },
  { num: 4, label: 'Pagamento', icon: '💳' },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '70%' : '-70%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-70%' : '70%',
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  }),
}

export type Step = 1 | 2 | 3

export interface FunilData {
  session_id: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  nome: string
  email: string
  whatsapp: string
  lead_id: string | null
  espetaculo_id: string | null
  espetaculo_nome: string | null
  espetaculo_data: string | null
  tipo_ingresso_id: string | null
  tipo_nome: string | null
  quantidade: number
  preco_unitario: number
}

function ProgressBar({ currentStep }: { currentStep: Step }) {
  return (
    <div
      className="relative z-10 px-4 py-4 sm:py-5 flex-shrink-0"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-lg mx-auto">
        <div className="flex items-center">
          {STEP_LABELS.map((s, i) => {
            const isCompleted = currentStep > s.num
            const isActive = currentStep === s.num

            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      backgroundColor: isCompleted
                        ? '#FFD700'
                        : isActive
                        ? '#E63946'
                        : 'rgba(255,255,255,0.12)',
                      color: isCompleted ? '#000' : isActive ? 'white' : 'rgba(255,255,255,0.35)',
                      transform: isActive ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: isActive
                        ? '0 0 14px rgba(230,57,70,0.6)'
                        : isCompleted
                        ? '0 0 10px rgba(255,215,0,0.4)'
                        : 'none',
                    }}
                  >
                    {isCompleted ? '✓' : s.icon}
                  </div>
                  <span
                    className="text-xs mt-1 hidden sm:block whitespace-nowrap transition-colors duration-300"
                    style={{
                      color: isActive ? '#FFD700' : isCompleted ? '#FFD700' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2 transition-all duration-500"
                    style={{
                      backgroundColor: currentStep > s.num
                        ? '#FFD700'
                        : 'rgba(255,255,255,0.12)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="text-center mt-2 sm:hidden">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Etapa {currentStep} de 4
          </span>
        </div>
      </div>
    </div>
  )
}

function RecoveryModal({ onContinue, onClose }: { onContinue: () => void; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #3a1025 0%, #4a1530 100%)',
          border: '1.5px solid rgba(255,215,0,0.25)',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
        }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="text-5xl mb-3">🎪</div>
        <h2 className="font-playfair font-bold text-white text-xl mb-2">
          Seu ingresso ainda está disponível!
        </h2>
        <p className="text-white/55 text-sm mb-5">
          Você não finalizou o pagamento. Os ingressos têm alta demanda — garanta o seu agora!
        </p>
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-xl font-bold text-white text-base mb-3 transition-all hover:scale-[1.02]"
          style={{ backgroundColor: '#E63946', boxShadow: '0 0 20px rgba(230,57,70,0.35)' }}
        >
          🔒 Retomar Compra
        </button>
        <button
          onClick={onClose}
          className="text-white/30 text-sm hover:text-white/50 transition-colors"
        >
          Continuar sem finalizar
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function FunilCompra() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)
  const [showRecovery, setShowRecovery] = useState(false)

  const [data, setData] = useState<FunilData>({
    session_id: '',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    nome: '',
    email: '',
    whatsapp: '',
    lead_id: null,
    espetaculo_id: null,
    espetaculo_nome: null,
    espetaculo_data: null,
    tipo_ingresso_id: null,
    tipo_nome: null,
    quantidade: 1,
    preco_unitario: 0,
  })

  useEffect(() => {
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = generateUUID()
      sessionStorage.setItem('session_id', sessionId)
    }
    const eventoSlug = searchParams.get('evento')
    const cancelado = searchParams.get('cancelado')
    const leadParam = searchParams.get('lead')

    setData((prev) => ({
      ...prev,
      session_id: sessionId!,
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
      espetaculo_id: eventoSlug ? `slug:${eventoSlug}` : null,
      lead_id: leadParam || prev.lead_id,
    }))

    if (cancelado === 'true') {
      setShowRecovery(true)
      // Clean up URL without losing state
      const url = new URL(window.location.href)
      url.searchParams.delete('cancelado')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const goNext = useCallback((updates?: Partial<FunilData>) => {
    if (updates) setData((prev) => ({ ...prev, ...updates }))
    setDirection(1)
    setStep((prev) => (Math.min(prev + 1, 3) as Step))
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setStep((prev) => (Math.max(prev - 1, 1) as Step))
  }, [])

  useAbandonTracking({
    lead_id: data.lead_id,
    step,
    nome: data.nome,
    whatsapp: data.whatsapp,
    espetaculo_nome: data.espetaculo_nome,
    preco_total: data.preco_unitario * data.quantidade,
  })

  return (
    <div
      className="flex flex-col overflow-hidden relative"
      style={{ minHeight: '100dvh' }}
    >
      <AnimatePresence>
        {showRecovery && (
          <RecoveryModal
            onContinue={() => {
              setShowRecovery(false)
              // Go to step 3 if we have a lead, otherwise step 1
              if (data.lead_id) setStep(3)
            }}
            onClose={() => setShowRecovery(false)}
          />
        )}
      </AnimatePresence>
      {/* Pink background — same as hero */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(135deg, #2a0a18 0%, #4a1530 35%, #3a1025 65%, #2a0a18 100%)',
        }}
      />

      {/* Yellow twinkling dots */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {DOTS.map((dot) => (
          <div
            key={dot.id}
            className="absolute rounded-full"
            style={{
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              backgroundColor: '#FFD700',
              animation: `twinkle ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <ProgressBar currentStep={step} />

      {/* Back button */}
      {step > 1 && (
        <button
          onClick={goBack}
          className="absolute top-[5.5rem] left-4 sm:left-8 z-30 flex items-center gap-1.5 hover:text-white transition-colors text-sm py-1"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          ← Voltar
        </button>
      )}

      {/* Steps */}
      <div className="flex-1 relative overflow-hidden z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            {step === 1 && <Etapa1 data={data} onNext={goNext} />}
            {step === 2 && <Etapa2 data={data} onNext={goNext} onBack={goBack} />}
            {step === 3 && <Etapa3 data={data} onBack={goBack} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
