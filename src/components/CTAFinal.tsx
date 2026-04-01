'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function CTAFinal() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      className="py-24 px-4 sm:px-6 lg:px-8 text-center"
      style={{
        background: 'linear-gradient(135deg, #E63946 0%, #a01a24 50%, #E63946 100%)',
        backgroundSize: '200% 200%',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="text-6xl mb-6 animate-float">🎪</div>
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-4">
            Não perca essa experiência!
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Momentos mágicos em família que duram para sempre.
            <br className="hidden sm:block" />
            Garanta os seus ingressos agora com poucos cliques.
          </p>
          <Link
            href="/comprar"
            className="inline-block px-10 py-4 rounded-full text-xl font-bold transition-all duration-200 hover:scale-105 shadow-2xl"
            style={{ backgroundColor: 'white', color: '#E63946' }}
          >
            🎪 Comprar Ingresso Agora
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
