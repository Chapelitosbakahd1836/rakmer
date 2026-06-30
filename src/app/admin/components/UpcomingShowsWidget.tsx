// @ts-nocheck
"use client";

import { useDashboard } from '../hooks/useDashboard';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function UpcomingShowsWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 min-h-[300px] animate-pulse"></div>;
  }

  const { espetaculos } = data || {};

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
      <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4">Próximos Espetáculos</h2>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {(!espetaculos || espetaculos.length === 0) && (
          <div className="text-slate-500 text-sm text-center py-6">Nenhum espetáculo futuro agendado.</div>
        )}
        
        {espetaculos?.map((show: any) => {
          const dateObj = new Date(show.data_hora);
          const isSoldOut = show.lugares_disponiveis <= 0;
          const occupancyPercent = ((show.lugares_total - show.lugares_disponiveis) / (show.lugares_total || 1)) * 100;
          
          let progColor = 'bg-emerald-500';
          if (occupancyPercent > 70) progColor = 'bg-rose-500';
          else if (occupancyPercent > 30) progColor = 'bg-amber-400';

          return (
            <div key={show.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-slate-800 line-clamp-1">{show.evento?.nome || show.nome}</h4>
                  <div className="flex items-center text-xs text-slate-500 mt-1 space-x-3">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {dateObj.toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                {isSoldOut ? (
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] uppercase font-bold rounded">Esgotado</span>
                ) : (
                  <a href={`/admin/eventos/${show.id}`} className="text-xs text-blue-600 font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Gerenciar</a>
                )}
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium tracking-wide">Ocupação</span>
                  <span className="font-bold text-slate-700">{show.lugares_total - show.lugares_disponiveis} / {show.lugares_total}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${progColor} transition-all duration-500`} style={{ width: `${occupancyPercent}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
