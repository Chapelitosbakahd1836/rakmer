// @ts-nocheck
"use client";

import { useDashboard } from '../hooks/useDashboard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FunnelWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 min-h-[400px] animate-pulse"></div>
    );
  }

  const { funnel } = data || {};
  const max = funnel?.visitantes || 1;

  // Montando os dados para o gráfico progressivo
  const funnelData = [
    { name: 'Visitantes no site', value: funnel?.visitantes || 0, percent: 100 },
    { name: 'Dados preenchidos', value: funnel?.dadosPreenchidos || 0, percent: ((funnel?.dadosPreenchidos || 0) / max) * 100 },
    { name: 'Data escolhida', value: funnel?.dataEscolhida || 0, percent: ((funnel?.dataEscolhida || 0) / max) * 100 },
    { name: 'Lugar escolhido', value: funnel?.lugarEscolhido || 0, percent: ((funnel?.lugarEscolhido || 0) / max) * 100 },
    { name: 'Checkout iniciado', value: funnel?.checkoutIniciado || 0, percent: ((funnel?.checkoutIniciado || 0) / max) * 100 },
    { name: 'Compras realizadas', value: funnel?.compras || 0, percent: ((funnel?.compras || 0) / max) * 100 },
  ];

  const overallConversion = ((funnel?.compras || 0) / (funnel?.visitantes || 1) * 100).toFixed(1);

  // Paleta de gradiente simulação ou cores
  const colors = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#10b981'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg shadow-xl">
          <p className="font-medium text-sm mb-1">{data.name}</p>
          <p className="text-xl font-bold">{data.value} <span className="text-slate-400 text-sm font-normal">leads</span></p>
          <p className="text-emerald-400 text-sm font-semibold mt-1">
            {data.percent.toFixed(1)}% <span className="text-slate-400 font-normal">do topo</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Funil de Conversão</h2>
          <p className="text-slate-500 text-sm mt-1">Acompanhamento de acessos até a finalização (Hoje)</p>
        </div>
        <button className="text-sm px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-lg transition-colors border border-slate-200">
          Ver histórico
        </button>
      </div>

      <div className="flex-1 w-full min-h-[250px] relative z-10 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={funnelData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barSize={32}
          >
            <XAxis type="number" hide domain={[0, max]} />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
              width={140}
            />
            <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
            
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between z-10">
        <div className="text-slate-600 text-sm font-medium">
          Taxa de conversão geral
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-base font-bold shadow-sm">
          {overallConversion}%
        </div>
      </div>
    </div>
  );
}
