// @ts-nocheck
"use client";

import { useDashboard } from '../hooks/useDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#e11d48', '#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#64748b'];

export default function OriginPieWidget() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 min-h-[300px] animate-pulse"></div>;
  }

  const { pie } = data || {};

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Origem dos Leads</h2>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pie}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {pie?.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} leads`, 'Total']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
