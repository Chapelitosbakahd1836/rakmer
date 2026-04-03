// @ts-nocheck
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tent, Calendar, MapPin, Users } from 'lucide-react';

export default async function EventosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: espetaculos, error } = await supabase
    .from('espetaculos')
    .select(`
      id, nome, data_hora, cidade, status,
      lugares_total, lugares_disponiveis, preco_minimo,
      tipos_ingresso(id, nome, preco, lugares_total, lugares_disponiveis)
    `)
    .order('data_hora', { ascending: true });

  const statusLabel: Record<string, { label: string; color: string }> = {
    publicado: { label: 'Publicado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rascunho:  { label: 'Rascunho',  color: 'bg-slate-100 text-slate-600 border-slate-200' },
    encerrado: { label: 'Encerrado', color: 'bg-rose-100 text-rose-600 border-rose-200' },
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Espetáculos</h1>
        <p className="text-slate-500 mt-1">Gerencie as datas e a ocupação dos espetáculos</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          Erro ao carregar espetáculos: {error.message}
        </div>
      )}

      {!espetaculos?.length ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-20 text-slate-400">
          <Tent className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhum espetáculo cadastrado</p>
          <p className="text-sm mt-1">Execute o schema SQL para cadastrar os espetáculos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {espetaculos.map((show: any) => {
            const dateObj = new Date(show.data_hora);
            const vendidos = show.lugares_total - show.lugares_disponiveis;
            const occupancy = show.lugares_total > 0 ? (vendidos / show.lugares_total) * 100 : 0;
            const st = statusLabel[show.status] || statusLabel['rascunho'];

            let barColor = 'bg-emerald-500';
            if (occupancy > 80) barColor = 'bg-rose-500';
            else if (occupancy > 50) barColor = 'bg-amber-400';

            return (
              <div key={show.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{show.nome}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {show.cidade}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium flex items-center gap-1"><Users className="w-3 h-3" /> Ocupação</span>
                    <span className="font-bold text-slate-700">{vendidos} / {show.lugares_total} lugares</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(occupancy, 100)}%` }} />
                  </div>
                  <p className="text-right text-xs font-bold mt-1" style={{ color: occupancy > 80 ? '#e11d48' : occupancy > 50 ? '#f59e0b' : '#10b981' }}>
                    {occupancy.toFixed(1)}% vendido
                  </p>
                </div>

                {show.tipos_ingresso?.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipos de Ingresso</p>
                    <div className="space-y-2">
                      {show.tipos_ingresso.map((ti: any) => (
                        <div key={ti.id} className="flex justify-between items-center text-sm">
                          <span className="text-slate-700 font-medium">{ti.nome}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 text-xs">{ti.lugares_total - ti.lugares_disponiveis}/{ti.lugares_total}</span>
                            <span className="font-bold text-slate-800">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ti.preco)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
