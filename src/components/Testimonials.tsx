'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TESTIMONIALS = [
  {
    name: 'Ana Paula Silva',
    avatar: '👩',
    stars: 5,
    text: 'Experiência incrível! Meus filhos adoraram cada momento. As acrobacias são impressionantes e o circo é muito organizado.',
  },
  {
    name: 'Carlos Mendes',
    avatar: '👨',
    stars: 5,
    text: 'Comprei o ingresso pelo WhatsApp e foi super fácil. Recebi na hora! O espetáculo superou todas as expectativas da família.',
  },
  {
    name: 'Fernanda Costa',
    avatar: '👩‍🦱',
    stars: 5,
    text: 'Fomos em família e foi mágico! Os palhaços são muito engraçados. Já estamos planejando voltar no próximo espetáculo!',
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ color: '#FFD700' }}>★</span>
      ))}
    </div>
  )
}

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (paused) return
    timerRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 4500)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [current, paused])

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg, #0d0408 0%, #120609 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: '#E63946' }}
          >
            Depoimentos
          </span>
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl text-white mt-2">
            O que as famílias dizem
          </h2>
        </div>

        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: '#1a0810', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-5xl mb-4">{TESTIMONIALS[current].avatar}</div>
              <StarRating count={TESTIMONIALS[current].stars} />
              <p className="text-white/80 text-lg leading-relaxed my-4 max-w-2xl mx-auto">
                "{TESTIMONIALS[current].text}"
              </p>
              <p className="font-semibold text-white">{TESTIMONIALS[current].name}</p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === current ? '#E63946' : 'rgba(255,255,255,0.2)',
                  transform: i === current ? 'scale(1.4)' : 'scale(1)',
                }}
                aria-label={`Depoimento ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
