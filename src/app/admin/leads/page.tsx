// @ts-nocheck
'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import KanbanBoard from './components/KanbanBoard';
import { Search, Filter, Calendar, MapPin } from 'lucide-react';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function LeadsPage() {
  const [dateStr, setDateStr] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter') setSearch(searchInput);
  };

  const params = new URLSearchParams();
  if (dateStr !== 'all') params.set('date', dateStr);
  if (eventFilter !== 'all') params.set('event', eventFilter);
  if (originFilter !== 'all') params.set('origin', originFilter);
  if (search) params.set('search', search);

  const { data: leads, error, isLoading } = useSWR(`/api/admin/leads?${params.toString()}`, fetcher);
  const { data: dashData } = useSWR('/api/admin/dashboard', fetcher);
  const espetaculos = dashData?.todosEspetaculos || [];
  const originOptions = ['Site', 'WhatsApp', 'Google', 'Instagram', 'Facebook', 'TikTok'];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-6 bg-slate-50 overflow-hidden">
      <div className="flex flex-col gap-4 mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Pipeline de Leads — CRM</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
            <Calendar size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm w-full outline-none text-slate-700" value={dateStr} onChange={e => setDateStr(e.target.value)}>
              <option value="all">Todo o Período</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
            </select>
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
            <MapPin size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm w-full outline-none text-slate-700" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
              <option value="all">Todos os Espetáculos</option>
              {espetaculos.map((e: any) => (
                <option key={e.id} value={e.id}>{e.nome} — {new Date(e.data_hora).toLocaleDateString('pt-BR')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
            <Filter size={16} className="text-slate-400" />
            <select className="bg-transparent text-sm w-full outline-none text-slate-700" value={originFilter} onChange={e => setOriginFilter(e.target.value)}>
              <option value="all">Todas as Origens</option>
              {originOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Buscar Nome, Email..." className="bg-transparent text-sm w-full outline-none text-slate-700" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearch} />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading && <div className="flex items-center justify-center h-full text-slate-400">Carregando CRM...</div>}
        {error && <div className="flex items-center justify-center h-full text-red-400">Falha ao carregar leads</div>}
        {!isLoading && !error && leads && <KanbanBoard initialLeads={leads} />}
      </div>
    </div>
  );
}
