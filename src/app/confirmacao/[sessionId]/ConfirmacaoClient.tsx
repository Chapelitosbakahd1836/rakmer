'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Espetaculo {
  nome: string
  data_hora: string
  cidade: string
}

interface ProximoEvento {
  id: string
  slug: string
  nome: string
  data_hora: string
  cidade: string
  preco_minimo: number
  lugares_disponiveis: number
}

interface Props {
  stripeSessionId: string
  quantidade: number
  valorTotal: number
  nome: string
  whatsapp: string
  email: string
  espetaculo: Espetaculo | null
  proximosEventos: ProximoEvento[]
}

// Deterministic confetti pieces
const CONFETTI = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 7) % 100}%`,
  color: ['#FFD700', '#E63946', '#ffffff', '#ff69b4', '#00d4aa'][i % 5],
  size: (i % 3) * 4 + 6,
  delay: (i * 0.08) % 2,
  duration: 2 + (i % 4) * 0.5,
  rotation: (i * 47) % 360,
}))

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    full: d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    iso: d.toISOString(),
  }
}

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function maskWhatsapp(wa: string) {
  const digits = wa.replace(/\D/g, '')
  if (digits.length < 8) return wa
  return digits.slice(0, 4) + '****' + digits.slice(-4)
}

function generateIcs(espetaculo: Espetaculo, quantidade: number): string {
  const { iso } = formatDate(espetaculo.data_hora)
  const start = iso.replace(/[-:]/g, '').split('.')[0] + 'Z'
  const endDate = new Date(new Date(espetaculo.data_hora).getTime() + 2 * 60 * 60 * 1000)
  const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const uid = `${Date.now()}@circurakmer.com`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Circo Rakmer//PT',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:🎪 ${espetaculo.nome} — Circo Rakmer`,
    `DESCRIPTION:${quantidade} ingresso(s) para ${espetaculo.nome}. Apresente o QR code na entrada.`,
    `LOCATION:${espetaculo.cidade}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export default function ConfirmacaoClient({
  stripeSessionId,
  quantidade,
  valorTotal,
  nome,
  whatsapp,
  email,
  espetaculo,
  proximosEventos,
}: Props) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(true)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(t)
  }, [])

  function handleShare() {
    const text = `🎪 Comprei meu ingresso para o Circo Rakmer! ${espetaculo ? `${espetaculo.nome} em ${espetaculo.cidade}` : ''}`
    const url = window.location.href

    if (navigator.share) {
      navigator.share({ title: 'Meu Ingresso — Circo Rakmer', text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        setShareStatus('copied')
        setTimeout(() => setShareStatus('idle'), 2500)
      })
    }
  }

  function handleDownloadIcs() {
    if (!espetaculo) return
    const content = generateIcs(espetaculo, quantidade)
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'circo-rakmer.ics'
    link.click()
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    `RAKMER-${stripeSessionId.slice(-12).toUpperCase()}`
  )}&size=200x200&bgcolor=ffffff&color=1a0010&margin=12`

  const dateInfo = espetaculo ? formatDate(espetaculo.data_hora) : null

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2a0a18 0%, #4a1530 35%, #3a1025 65%, #2a0a18 100%)',
      }}
    >
      {/* Confetti burst */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {CONFETTI.map((c) => (
            <motion.div
              key={c.id}
              className="absolute rounded-sm"
              style={{
                left: c.left,
                top: '-10px',
                width: c.size,
                height: c.size * 0.5,
                backgroundColor: c.color,
                rotate: c.rotation,
              }}
              animate={{
                y: ['0vh', '110vh'],
                rotate: [c.rotation, c.rotation + 720],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: c.duration,
                delay: c.delay,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-lg mx-auto w-full px-4 py-10">
        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-center mb-8"
        >
          <div className="text-7xl mb-4">🎪</div>
          <h1 className="font-playfair font-bold text-3xl sm:text-4xl text-white mb-2">
            Pagamento <span style={{ color: '#FFD700' }}>Confirmado!</span>
          </h1>
          <p className="text-white/60 text-base">
            Olá {nome.split(' ')[0]}! Seu ingresso está garantido.
          </p>
          {whatsapp && (
            <p className="text-white/40 text-sm mt-1">
              📲 Enviamos pelo WhatsApp {maskWhatsapp(whatsapp)}
            </p>
          )}
        </motion.div>

        {/* Ticket card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(255,215,0,0.3)',
            boxShadow: '0 0 40px rgba(255,215,0,0.08)',
          }}
        >
          {/* Ticket top */}
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {espetaculo && (
                  <>
                    <h2 className="font-bold text-white text-xl leading-tight mb-1">
                      {espetaculo.nome}
                    </h2>
                    <p className="text-white/50 text-sm">{espetaculo.cidade}</p>
                    {dateInfo && (
                      <p className="font-bold mt-2" style={{ color: '#FFD700' }}>
                        {dateInfo.full} às {dateInfo.time}h
                      </p>
                    )}
                  </>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-white/50 text-sm">{quantidade}x ingresso(s)</span>
                  <span className="font-bold text-white text-lg">{formatPrice(valorTotal)}</span>
                </div>
              </div>

              {/* QR Code */}
              <div
                className="rounded-xl overflow-hidden shrink-0 p-1"
                style={{ backgroundColor: 'white' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR Code do ingresso" width={80} height={80} />
              </div>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="px-6 py-4">
            <div
              className="border-t"
              style={{
                borderTopStyle: 'dashed',
                borderTopColor: 'rgba(255,255,255,0.15)',
              }}
            />
          </div>

          {/* QR code large */}
          <div className="px-6 pb-6 flex flex-col items-center gap-3">
            <div className="rounded-2xl overflow-hidden p-3" style={{ backgroundColor: 'white' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR Code do ingresso" width={160} height={160} />
            </div>
            <p className="text-white/30 text-xs text-center">
              Apresente este QR code na entrada
            </p>
            <p className="text-white/20 text-xs font-mono">
              #{stripeSessionId.slice(-12).toUpperCase()}
            </p>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex flex-col gap-3 mb-8"
        >
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: '#E63946', boxShadow: '0 0 20px rgba(230,57,70,0.3)' }}
          >
            {shareStatus === 'copied' ? '✓ Link copiado!' : '📤 Compartilhar Ingresso'}
          </button>

          {espetaculo && (
            <button
              onClick={handleDownloadIcs}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:bg-white/10"
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              📅 Adicionar ao Calendário
            </button>
          )}
        </motion.div>

        {/* Upsell — upcoming events */}
        {proximosEventos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <h3 className="font-playfair font-bold text-white text-xl mb-4 text-center">
              Próximas <span style={{ color: '#FFD700' }}>Apresentações</span>
            </h3>
            <div className="space-y-3">
              {proximosEventos.map((ev) => {
                const d = new Date(ev.data_hora)
                return (
                  <button
                    key={ev.id}
                    onClick={() => router.push(`/comprar?evento=${ev.slug}`)}
                    className="w-full p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white text-sm">{ev.nome}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} •{' '}
                          {ev.cidade}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm" style={{ color: '#FFD700' }}>
                          {formatPrice(ev.preco_minimo)}
                        </p>
                        <p className="text-white/30 text-xs">{ev.lugares_disponiveis} vagas</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <p className="text-center text-white/30 text-xs mt-4">
              Leve mais amigos para o circo! 🎪
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
