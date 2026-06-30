'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import type { Evento } from '@/lib/types'

const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgMH/8QAIRAAAQQCAgMBAAAAAAAAAAAAAQIDBAUREiExBkH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aoy8v9I2vbNb0jTNfhsrHXrOxhW3lgt4ZJpJWjhjJZnjjZmCopJJAA4HFcUUUB//Z'

interface EventCardProps {
  evento: Evento
  index: number
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function EventCard({ evento, index }: EventCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const ocupacaoPercent =
    evento.lugares_total > 0
      ? ((evento.lugares_total - evento.lugares_disponiveis) / evento.lugares_total) * 100
      : 0
  const quaseEsgotado =
    evento.lugares_total > 0 && evento.lugares_disponiveis < evento.lugares_total * 0.2

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className="group rounded-2xl overflow-hidden border border-white/10 hover:border-red-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/20 hover:-translate-y-1"
      style={{ backgroundColor: '#1a0810' }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-900">
        {evento.imagem_url ? (
          <Image
            src={evento.imagem_url}
            alt={evento.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{
              background:
                'linear-gradient(135deg, #1a0510 0%, #2d0815 50%, #1a0510 100%)',
            }}
          >
            🎪
          </div>
        )}
        {/* Quase esgotado badge */}
        {quaseEsgotado && (
          <div className="absolute top-3 left-3">
            <span
              className="px-2 py-1 rounded-full text-xs font-bold text-white animate-pulse"
              style={{ backgroundColor: '#E63946' }}
            >
              🔥 QUASE ESGOTADO
            </span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-playfair font-bold text-lg text-white mb-2 line-clamp-2">
          {evento.nome}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>📅</span>
            <span>{formatDate(evento.data_hora)} às {formatTime(evento.data_hora)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>📍</span>
            <span>{evento.cidade}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#FFD700' }}>
            <span>🎟️</span>
            <span>A partir de {formatPrice(evento.preco_minimo)}</span>
          </div>
        </div>

        {/* Occupation bar */}
        {evento.lugares_total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>{evento.lugares_disponiveis} lugares disponíveis</span>
              <span>{Math.round(ocupacaoPercent)}% ocupado</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${ocupacaoPercent}%`,
                  backgroundColor: quaseEsgotado ? '#E63946' : '#22c55e',
                }}
              />
            </div>
          </div>
        )}

        <Link
          href={`/comprar?evento=${evento.slug}`}
          className="block w-full text-center py-3 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          style={{ backgroundColor: '#E63946' }}
        >
          Comprar Ingresso
        </Link>
      </div>
    </motion.div>
  )
}
