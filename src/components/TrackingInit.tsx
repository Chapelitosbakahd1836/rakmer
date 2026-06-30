'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function TrackingInit() {
  const searchParams = useSearchParams()

  useEffect(() => {
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = generateUUID()
      sessionStorage.setItem('session_id', sessionId)
    }

    supabase.from('page_views').insert({
      session_id: sessionId,
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
    }).then(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
