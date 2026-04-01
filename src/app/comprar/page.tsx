import { Suspense } from 'react'
import FunilCompra from './FunilCompra'

function LoadingFunil() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#1D3557' }}
    >
      <div className="text-center">
        <div className="text-6xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>
          🎪
        </div>
        <p className="text-white/50 text-sm">Preparando o espetáculo...</p>
      </div>
    </div>
  )
}

export default function ComprarPage() {
  return (
    <Suspense fallback={<LoadingFunil />}>
      <FunilCompra />
    </Suspense>
  )
}
