'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import type { Evento } from '@/lib/types'

interface UrgencySectionProps {
  totalFamilias: number
  proximoEvento: Evento | null
}

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start || target === 0) return
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, start])
  return count
}

export default function UrgencySection({ totalFamilias, proximoEvento }: UrgencySectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const count = useCountUp(totalFamilias, 2000, isInView)

  const lugaresRestantes = proximoEvento?.lugares_disponiveis ?? 0
  const lugaresTotal = proximoEvento?.lugares_total ?? 1
  const ocupacaoPercent = Math.round(((lugaresTotal - lugaresRestantes) / lugaresTotal) * 100)

  return (
    <section
      ref={ref}
      className="py-16 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg, #0d0408 0%, #1a0510 50%, #0d0408 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Families counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-yellow-500/30 mb-6"
            style={{ backgroundColor: 'rgba(255, 215, 0, 0.05)' }}
          >
            <span className="text-3xl">🎟️</span>
            <div>
              <div className="text-4xl sm:text-5xl font-bold font-playfair" style={{ color: '#FFD700' }}>
                {count.toLocaleString('pt-BR')}
              </div>
              <div className="text-white/70 text-sm mt-1">
                famílias com ingressos garantidos
              </div>
            </div>
          </div>
        </motion.div>

        {/* Próximo evento urgency */}
        {proximoEvento && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl p-6 border"
            style={{ backgroundColor: '#1a0810', borderColor: 'rgba(230, 57, 70, 0.3)' }}
          >
            <h3 className="font-playfair font-bold text-xl text-white mb-4 text-center">
              {proximoEvento.nome}
            </h3>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-white/60 mb-2">
                <span>Ocupação atual</span>
                <span className="font-semibold">{ocupacaoPercent}% ocupado</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#E63946' }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${ocupacaoPercent}%` } : {}}
                  transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Warning text */}
            <motion.p
              className="text-center font-bold text-base"
              style={{ color: '#E63946' }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ⏰ Restam apenas{' '}
              <span className="text-white">{lugaresRestantes} lugares</span>{' '}
              para este espetáculo!
            </motion.p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
