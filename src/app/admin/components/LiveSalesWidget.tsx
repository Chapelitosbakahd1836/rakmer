// @ts-nocheck
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaleEvent {
  id: string;
  preco_pago: number;
  status: string;
  created_at: string;
  cliente: { nome: string };
  espetaculo: { nome: string };
  tipo: { nome: string };
}

export default function LiveSalesWidget() {
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchSales = async () => {
      const { data } = await supabase
        .from('ingressos')
        .select(`
          id, preco_pago, status, created_at,
          cliente: clientes(nome),
          espetaculo: espetaculos(nome),
          tipo: tipos_ingresso(nome)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setSales(data as any[]);
      setLoading(false);
    };
    
    fetchSales();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('realtime-vendas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ingressos' },
        async (payload) => {
          // Precisamos buscar os dados agregados para esse novo id
          const { data } = await supabase
            .from('ingressos')
            .select(`
              id, preco_pago, status, created_at,
              cliente: clientes(nome),
              espetaculo: espetaculos(nome),
              tipo: tipos_ingresso(nome)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setSales(prev => [data as any, ...prev].slice(0, 10)); // Keep top 10
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 min-h-[400px] animate-pulse"></div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-2"></span>
          Últimas Vendas Ao Vivo
        </h2>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase bg-slate-50 text-slate-500 rounded-t-lg">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl-lg">Cliente</th>
              <th className="px-4 py-3 font-semibold">Espetáculo</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold text-right">Valor</th>
              <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Tempo</th>
            </tr>
          </thead>
          <tbody>
            {!sales.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Nenhuma venda registrada ainda.</td>
              </tr>
            )}
            
            {sales.map((sale) => {
              const clientName = sale.cliente?.nome || 'Desconhecido';
              const initial = clientName.charAt(0).toUpperCase();
              
              return (
                <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                        {initial}
                      </div>
                      <span className="font-medium text-slate-800 line-clamp-1">{clientName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 line-clamp-1 mt-2.5 inline-block">{sale.espetaculo?.nome || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-xs font-semibold uppercase tracking-wider">
                      {sale.tipo?.nome || 'Padrão'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 whitespace-nowrap">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.preco_pago || 0)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap text-xs text-slate-400">
                    {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true, locale: ptBR })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
