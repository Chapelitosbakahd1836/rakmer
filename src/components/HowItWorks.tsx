'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STEPS = [
  {
    icon: '📝',
    title: 'Informe seus dados',
    description: 'Preencha seu nome, e-mail e número de WhatsApp com segurança.',
  },
  {
    icon: '📅',
    title: 'Escolha seu dia',
    description: 'Selecione o espetáculo e a quantidade de ingressos desejada.',
  },
  {
    icon: '🎟️',
    title: 'Pague e receba no WhatsApp',
    description: 'PIX ou cartão. Ingresso enviado imediatamente pelo WhatsApp!',
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: '#0d0408' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: '#E63946' }}
          >
            Simples e rápido
          </span>
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl text-white mt-2">
            Como Funciona?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-14 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.25, ease: 'easeOut' }}
              className="flex flex-col items-center text-center"
            >
              {/* Step number + icon */}
              <div className="relative mb-5">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #2d0815, #1a0510)',
                    border: '2px solid rgba(230,57,70,0.4)',
                  }}
                >
                  {step.icon}
                </div>
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: '#E63946' }}
                >
                  {i + 1}
                </div>
              </div>
              <h3 className="font-playfair font-bold text-xl text-white mb-3">
                {step.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
