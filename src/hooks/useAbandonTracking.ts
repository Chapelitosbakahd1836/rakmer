import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface AbandonData {
  lead_id: string | null
  step: number
  nome: string
  whatsapp: string
  espetaculo_nome: string | null
  preco_total: number
}

const STEP_NAMES: Record<number, string> = {
  1: 'dados_preenchidos',
  2: 'data_escolhida',
  3: 'lugar_escolhido',
}

export default function useAbandonTracking(data: AbandonData) {
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    function sendAbandon() {
      const { lead_id, step, nome, whatsapp, espetaculo_nome, preco_total } =
        dataRef.current
      if (!lead_id) return

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_ABANDONO
      const payload = JSON.stringify({
        lead_id,
        funil_step: step,
        funil_step_nome: STEP_NAMES[step] ?? 'desconhecido',
        nome,
        whatsapp,
        ...(step >= 2 && espetaculo_nome ? { evento_nome: espetaculo_nome } : {}),
        ...(step >= 3 && preco_total > 0 ? { valor_estimado: preco_total } : {}),
      })

      if (webhookUrl && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          webhookUrl,
          new Blob([payload], { type: 'application/json' })
        )
      }

      supabase
        .from('leads')
        .update({ funil_abandonado_em: new Date().toISOString() })
        .eq('id', lead_id)
        .eq('status', 'novo')
        .then(() => {})
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') sendAbandon()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', sendAbandon)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('beforeunload', sendAbandon)
    }
  }, [])
}
