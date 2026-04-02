'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const WORDS = ['A', 'Magia', 'do', 'Circo', 'Ao', 'Vivo']

// Deterministic yellow dots (no hydration mismatch)
const DOTS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 7) % 100}%`,
  top: `${(i * 53 + 11) % 100}%`,
  size: (i % 3) * 1.5 + 1.2,
  delay: (i * 0.19) % 5,
  duration: 2 + (i % 4) * 0.8,
}))

interface HeroSectionProps {
  whatsappUrl: string
}

export default function HeroSection({ whatsappUrl }: HeroSectionProps) {
  const router = useRouter()
  const [curtaining, setCurtaining] = useState(false)

  function handleBuyClick(e: React.MouseEvent) {
    e.preventDefault()
    setCurtaining(true)
    setTimeout(() => router.push('/comprar'), 1200)
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Pink background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(135deg, #2a0a18 0%, #4a1530 35%, #3a1025 65%, #2a0a18 100%)',
        }}
      />

      {/* Soft radial glow */}
      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,100,150,0.35) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(230,57,70,0.2) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 70%, rgba(180,50,100,0.2) 0%, transparent 60%)
          `,
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
              opacity: 0.75,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">

        {/* Logo Circo Rakmer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex justify-center mb-4"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/logo-rakmer.png"
              alt="Circo Rakmer"
              width={420}
              height={263}
              priority
              className="w-64 sm:w-80 md:w-96 lg:w-[420px] h-auto drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 24px rgba(255,200,0,0.35))' }}
            />
          </motion.div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: 'rgba(230,57,70,0.2)',
            border: '1px solid rgba(230,57,70,0.5)',
            color: '#ff8fa0',
          }}
        >
          <span className="animate-bounce">📍</span>
          Pompéia-SP • Curta temporada!!!
        </motion.div>

        {/* Title — word by word */}
        <h1 className="font-playfair font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
          {WORDS.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.3em] last:mr-0"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.14, duration: 0.45, ease: 'easeOut' }}
              style={word === 'Circo' ? { color: '#E63946' } : {}}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.6 }}
          className="text-lg sm:text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto"
        >
          Emoção, humor e acrobacias para toda a família
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={handleBuyClick}
            className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-bold text-white shadow-2xl transition-all duration-200 hover:scale-105 text-center"
            style={{ backgroundColor: '#E63946', boxShadow: '0 0 30px rgba(230,57,70,0.45)' }}
          >
            🎪 Garantir Meu Ingresso Agora
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-full text-base font-semibold text-white/90 border border-white/20 hover:border-white/50 hover:bg-white/10 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Fale pelo WhatsApp
          </a>
        </motion.div>
      </div>

      {/* Curtain overlay — closes on buy click */}
      <AnimatePresence>
        {curtaining && (
          <>
            <motion.div
              className="fixed inset-y-0 left-0 w-1/2 z-50 border-r border-white/5"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #7a0000 0px, #7a0000 24px, #a01520 24px, #a01520 48px)',
                boxShadow: 'inset -20px 0 50px rgba(0,0,0,0.5)'
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div
              className="fixed inset-y-0 right-0 w-1/2 z-50 border-l border-white/5"
              style={{
                background:
                  'repeating-linear-gradient(270deg, #7a0000 0px, #7a0000 24px, #a01520 24px, #a01520 48px)',
                boxShadow: 'inset 20px 0 50px rgba(0,0,0,0.5)'
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <p className="font-playfair text-2xl font-bold text-white/90 tracking-widest drop-shadow-lg">
                🎪 Preparando seu ingresso...
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
