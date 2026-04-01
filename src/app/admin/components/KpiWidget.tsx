// @ts-nocheck
"use client";

import { useDashboard } from '../hooks/useDashboard';
import { BadgeDollarSign, Ticket, Users, MessageCircle } from 'lucide-react';

export default function KpiWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white animate-pulse rounded-xl border border-slate-200"></div>)}
      </div>
    );
  }

  const { kpis } = data || {};
  
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Card 1: Receita */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">Receita Hoje</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatMoney(kpis?.receita)}</h3>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
            <BadgeDollarSign size={24} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
           <span className={`font-semibold ${kpis?.perceReceita >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {kpis?.perceReceita > 0 ? '+' : ''}{(kpis?.perceReceita || 0).toFixed(1)}%
           </span>
           <span className="text-slate-400 ml-2">vs ontem</span>
        </div>
      </div>

      {/* Card 2: Ingressos */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">Ingressos Vendidos</p>
            <h3 className="text-2xl font-bold text-slate-800">{kpis?.ingressos || 0}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
            <Ticket size={24} />
          </div>
        </div>
      </div>

      {/* Card 3: Novos Leads */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">Novos Leads</p>
            <h3 className="text-2xl font-bold text-slate-800">{kpis?.leads || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Card 4: WhatsApp */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">Mensagens WhatsApp</p>
            <h3 className="text-2xl font-bold text-slate-800">{kpis?.whatsapps || 0}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
            <MessageCircle size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
