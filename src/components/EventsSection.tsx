import type { Evento } from '@/lib/types'
import EventCard from './EventCard'

interface EventsSectionProps {
  eventos: Evento[]
}

export default function EventsSection({ eventos }: EventsSectionProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0d0408' }}>
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#E63946' }}>
            Espetáculos
          </span>
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl text-white mt-2 mb-4">
            Próximos Espetáculos
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Escolha a data e garanta sua experiência inesquecível
          </p>
        </div>

        {eventos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento, index) => (
              <EventCard key={evento.id} evento={evento} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-white/40">
            <div className="text-6xl mb-4">🎪</div>
            <p className="text-lg">Novos espetáculos em breve!</p>
            <p className="text-sm mt-2">
              Fale conosco pelo WhatsApp para saber das próximas datas.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
