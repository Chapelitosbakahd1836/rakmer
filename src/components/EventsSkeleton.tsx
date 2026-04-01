export default function EventsSkeleton() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0d0408' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="h-4 w-24 rounded mx-auto mb-3 animate-pulse" style={{ backgroundColor: '#2a1015' }} />
          <div className="h-10 w-72 rounded mx-auto mb-3 animate-pulse" style={{ backgroundColor: '#2a1015' }} />
          <div className="h-6 w-48 rounded mx-auto animate-pulse" style={{ backgroundColor: '#2a1015' }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ backgroundColor: '#1a0810' }}>
              <div className="h-48" style={{ backgroundColor: '#2a1015' }} />
              <div className="p-5 space-y-3">
                <div className="h-5 rounded" style={{ backgroundColor: '#2a1015' }} />
                <div className="h-4 w-3/4 rounded" style={{ backgroundColor: '#2a1015' }} />
                <div className="h-4 w-1/2 rounded" style={{ backgroundColor: '#2a1015' }} />
                <div className="h-11 rounded-xl mt-4" style={{ backgroundColor: '#3a1020' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
