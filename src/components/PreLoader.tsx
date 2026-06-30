'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PreLoaderProps {
  onComplete: () => void
}

export default function PreLoader({ onComplete }: PreLoaderProps) {
  const [videoEnded, setVideoEnded] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Show skip button after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  // Handle the fade-out after the video ends
  useEffect(() => {
    if (videoEnded) {
      const timer = setTimeout(() => {
        onComplete()
      }, 800) // Duration of the fade-out
      return () => clearTimeout(timer)
    }
  }, [videoEnded, onComplete])

  const handleSkip = () => {
    setVideoEnded(true)
  }

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#B33257]"
    >
      {/* Content Container */}
      <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
        {!isVideoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#B33257] z-[60]">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        <div className="relative w-full max-w-4xl aspect-video overflow-hidden">
          {/* The video with transparent gradient edges */}
          <div 
            className="w-full h-full relative"
            style={{
              maskImage: 'radial-gradient(circle at center, black 45%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 45%, transparent 95%)',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onCanPlayThrough={() => setIsVideoLoaded(true)}
              onEnded={() => setVideoEnded(true)}
              className="w-full h-full object-contain"
            >
              <source src="/intro.mp4" type="video/mp4" />
              Seu navegador não suporta vídeos.
            </video>
          </div>
        </div>

        {/* Brand Text */}
        <div className="mt-6 text-center space-y-2">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isVideoLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
            className="text-white text-4xl sm:text-5xl font-playfair font-bold tracking-tight drop-shadow-lg"
          >
            Circo <span className="text-[#FFD700]">Rakmer</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isVideoLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
            className="text-white/80 text-sm tracking-[0.3em] font-medium uppercase"
          >
            O Espetáculo Vai Começar
          </motion.p>
        </div>
      </div>

      {/* Skip Button */}
      <AnimatePresence>
        {showSkip && !videoEnded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="absolute bottom-10 right-10 z-[100] px-6 py-2 rounded-full bg-black/10 border border-white/20 text-white hover:bg-black/20 transition-all text-xs font-semibold backdrop-blur-md uppercase tracking-wider"
          >
            Pular intro
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

