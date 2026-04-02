'use client'

import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TrackingInit from '@/components/TrackingInit'
import HeroSection from '@/components/HeroSection'
import PreLoader from '@/components/PreLoader'

const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_SUPORTE}?text=Oi!%20Quero%20saber%20sobre%20os%20espet%C3%A1culos`

export default function HomePage() {
  const [loading, setLoading] = useState(true)

  return (
    <>
      <AnimatePresence mode="wait">
        {loading ? (
          <PreLoader key="preloader" onComplete={() => setLoading(false)} />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Suspense fallback={null}>
              <TrackingInit />
            </Suspense>
            <main>
              <HeroSection whatsappUrl={whatsappUrl} />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
