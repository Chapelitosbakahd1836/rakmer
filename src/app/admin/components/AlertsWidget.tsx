// @ts-nocheck
"use client";

import { useDashboard } from '../hooks/useDashboard';
import { AlertCircle, Clock, Star, PlayCircle } from 'lucide-react';

export default function AlertsWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 min-h-[300px] animate-pulse"></div>;
  }

  const { alerts } = data || {};

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
      <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4">Avisos e Oportunidades</h2>
      
      <div className="space-y-4">
        {/* Alerta Leads Atrasados */}
        {alerts?.leadsAtrasados > 0 ? (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start">
            <div className="bg-rose-100 p-2 rounded-lg text-rose-600 mr-3">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-800">Leads sem resposta</h4>
              <p className="text-sm text-rose-600 mt-0.5">Existem {alerts.leadsAtrasados} leads há mais de 2h parados no funil sem follow-up.</p>
              <button className="mt-2 text-xs font-semibold px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 transition">Atuar Agora</button>
            </div>
          </div>
        ) : (
             <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center text-slate-500">
                <Clock className="w-5 h-5 mr-3 opacity-50" />
                <span className="text-sm">Nenhum lead travado no funil atual.</span>
             </div>
        )}

        {/* Alerta Ocupação Crítica */}
        {alerts?.criiticos > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600 mr-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-800">Baixa ocupação</h4>
              <p className="text-sm text-amber-700 mt-0.5">{alerts.criiticos} espetáculo(s) próximo(s) com menos de 30% vendidos.</p>
              <button className="mt-2 text-xs font-semibold px-3 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 transition flex items-center">
                 <PlayCircle className="w-3 h-3 mr-1" /> Criar Kampanha SMS
              </button>
            </div>
          </div>
        )}

        {/* VIP Clientes */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start opacity-70 cursor-not-allowed">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3">
              <Star className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-blue-800">Clientes VIP Ausentes</h4>
              <p className="text-sm text-blue-600 mt-0.5">Módulo de recorrência será ativado em breve.</p>
            </div>
          </div>
      </div>
    </div>
  );
}
