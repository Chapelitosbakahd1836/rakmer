'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface ValidationResult {
  valido: boolean
  jaEntrou?: boolean
  mensagem: string
  pedido?: {
    nome_cliente: string
    total: number
    espetaculo: { nome: string; data_hora: string; cidade: string } | null
    itens: Array<{ quantidade: number; tipo: string; setor: { nome: string } | null }>
  }
}

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function PortariaPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [totalEntradas, setTotalEntradas] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .not('entrada_em', 'is', null)
      .gte('entrada_em', today.toISOString())
    setTotalEntradas(count || 0)
  }

  async function startCamera() {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      scanningRef.current = true
      requestAnimationFrame(scan)
    } catch {
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }

  function stopCamera() {
    scanningRef.current = false
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  const scan = useCallback(async () => {
    if (!scanningRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scan)
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) { requestAnimationFrame(scan); return }
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const jsQR = (await import('jsqr')).default
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code?.data?.startsWith('RAKMER:')) {
      scanningRef.current = false
      await validate(code.data)
    } else {
      requestAnimationFrame(scan)
    }
  }, [])

  async function validate(qrData: string) {
    setValidating(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/portaria/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: qrData }),
      })
      const data: ValidationResult = await res.json()
      setResult(data)
      if (data.valido) loadStats()
    } catch {
      setResult({ valido: false, mensagem: 'Erro de conexão. Tente novamente.' })
    }
    setValidating(false)
    // Reativa scan após 5s
    setTimeout(() => {
      setResult(null)
      if (cameraActive) {
        scanningRef.current = true
        requestAnimationFrame(scan)
      }
    }, 5000)
  }

  async function handleManualValidate() {
    if (!manualCode.trim()) return
    const qrData = manualCode.trim().startsWith('RAKMER:')
      ? manualCode.trim()
      : `RAKMER:${manualCode.trim()}`
    setManualCode('')
    await validate(qrData)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
        <div>
          <h1 className="font-bold text-white text-lg">🎪 Portaria</h1>
          <p className="text-slate-400 text-xs">
            {totalEntradas} entrada{totalEntradas !== 1 ? 's' : ''} hoje
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Sair
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start p-4 gap-4">
        {/* Camera area */}
        <div
          className="relative w-full max-w-sm rounded-2xl overflow-hidden flex-shrink-0"
          style={{ aspectRatio: '1/1', backgroundColor: '#0a0a0a', border: '2px solid #334155' }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ display: cameraActive ? 'block' : 'none' }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="text-6xl">📷</div>
              <p className="text-slate-300 text-sm">
                Aponte a câmera para o QR code do ingresso
              </p>
              {cameraError && (
                <p className="text-red-400 text-xs">{cameraError}</p>
              )}
              <button
                onClick={startCamera}
                className="px-6 py-3 rounded-xl font-bold text-black text-base"
                style={{ backgroundColor: '#FFD700' }}
              >
                Ativar Câmera
              </button>
            </div>
          )}

          {/* Scanning overlay */}
          {cameraActive && !validating && !result && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="w-48 h-48 rounded-2xl"
                style={{ border: '3px solid rgba(255,215,0,0.7)', boxShadow: '0 0 0 2000px rgba(0,0,0,0.4)' }}
              />
            </div>
          )}

          {/* Validating */}
          {validating && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white font-semibold">Validando...</p>
              </div>
            </div>
          )}

          {/* Result overlay */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-4"
                style={{ backgroundColor: result.valido ? 'rgba(16,185,129,0.95)' : 'rgba(220,38,38,0.95)' }}
              >
                <div className="text-6xl mb-3">{result.valido ? '✅' : '❌'}</div>
                <p className="font-bold text-white text-xl text-center mb-2">
                  {result.mensagem}
                </p>
                {result.pedido && (
                  <div className="text-white/80 text-sm text-center space-y-1 mt-2">
                    <p className="font-semibold text-white">{result.pedido.nome_cliente}</p>
                    {result.pedido.espetaculo && (
                      <p>{result.pedido.espetaculo.nome}</p>
                    )}
                    {result.pedido.itens?.[0] && (
                      <p>
                        {result.pedido.itens[0].setor?.nome} —{' '}
                        {result.pedido.itens[0].tipo === 'meia' ? 'Meia' : 'Inteira'} ×{' '}
                        {result.pedido.itens[0].quantidade}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-white/50 text-xs mt-4">Próximo scan em 5 segundos...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stop camera */}
        {cameraActive && !result && (
          <button
            onClick={stopCamera}
            className="text-slate-400 text-sm hover:text-white transition-colors"
          >
            Parar câmera
          </button>
        )}

        {/* Manual input */}
        <div className="w-full max-w-sm">
          <p className="text-slate-500 text-xs mb-2 text-center uppercase tracking-wider">
            Ou insira o código manualmente
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualValidate()}
              placeholder="ID do pedido ou RKM-XXXX-XXXX"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400"
            />
            <button
              onClick={handleManualValidate}
              disabled={!manualCode.trim() || validating}
              className="px-4 py-3 rounded-xl font-bold text-black text-sm disabled:opacity-40"
              style={{ backgroundColor: '#FFD700' }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
