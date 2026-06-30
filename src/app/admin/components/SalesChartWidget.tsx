// @ts-nocheck
"use client";

import { useDashboard } from '../hooks/useDashboard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesChartWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 min-h-[300px] animate-pulse"></div>;
  }

  const { salesLine } = data || {};

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
      <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-2">Vendas nos Últimos 30 Dias</h2>
      <div className="flex-1 w-full min-h-[200px] mt-2 -ml-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={salesLine}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => {
                const parts = val.split('-');
                return `${parts[2]}/${parts[1]}`;
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip 
               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
               labelFormatter={(val) => `Dia: ${val}`}
            />
            <Area type="monotone" dataKey="vendas" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
