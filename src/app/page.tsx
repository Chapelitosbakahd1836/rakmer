import { Suspense } from 'react'
import TrackingInit from '@/components/TrackingInit'
import HeroSection from '@/components/HeroSection'

const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_SUPORTE}?text=Oi!%20Quero%20saber%20sobre%20os%20espet%C3%A1culos`

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <TrackingInit />
      </Suspense>
      <main>
        <HeroSection whatsappUrl={whatsappUrl} />
      </main>
    </>
  )
}
