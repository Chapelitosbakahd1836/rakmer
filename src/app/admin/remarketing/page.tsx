'use client';
// @ts-nocheck
import { useState } from 'react';
import useSWR from 'swr';
import { Megaphone, Send, Users, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RemarketingPage() {
  const { data: dashData } = useSWR('/api/admin/dashboard', fetcher);
  const [sending, setSending] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const N8N_WEBHOOK = 'https://n8n.vendaiads.cloud/webhook/m1Q8le_Hi0Xe5vMLDK9Dj';

  const campanhas = [
    {
      id: 'followup1',
      titulo: 'Follow-up de Abandono (1ª mensagem)',
      descricao: 'Dispara para leads com funil_abandonado_em preenchido e followup_count = 0.',
      icon: Clock,
      color: 'rose',
      alvo: dashData?.alerts?.leadsAtrasados || 0,
      auto: true,
    },
    {
      id: 'followup2',
      titulo: 'Re-engajamento (2ª mensagem)',
      descricao: 'Para leads que receberam o 1º follow-up há mais de 24h e não compraram.',
      icon: AlertCircle,
      color: 'amber',
      alvo: '—',
      auto: true,
    },
    {
      id: 'followup3',
      titulo: 'Última Chamada (3ª mensagem)',
      descricao: 'Últimos indecisos — urgência de esgotamento de lugares.',
      icon: Megaphone,
      color: 'blue',
      alvo: '—',
      auto: true,
    },
  ];

  async function dispararManual(campId: string) {
    setSending(campId);
    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual', campanha: campId }),
      });
      if (res.ok) {
        setResults(prev => ({ ...prev, [campId]: 'success' }));
      } else {
        setResults(prev => ({ ...prev, [campId]: 'error' }));
      }
    } catch {
      setResults(prev => ({ ...prev, [campId]: 'error' }));
    } finally {
      setSending(null);
    }
  }

  const colorMap: Record<string, { bg: string; text: string; border: string; btn: string }> = {
    rose:  { bg: 'bg-rose-50',  text: 'text-rose-600',  border: 'border-rose-100',  btn: 'bg-rose-600 hover:bg-rose-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', btn: 'bg-amber-500 hover:bg-amber-600' },
    blue:  { bg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-100',  btn: 'bg-blue-600 hover:bg-blue-700' },
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Remarketing</h1>
        <p className="text-slate-500 mt-1">Gerencie e dispare campanhas de follow-up via WhatsApp (Evolution API)</p>
      </header>

      {/* Status automático */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-emerald-800">Automação Ativa</h3>
          <p className="text-sm text-emerald-700 mt-0.5">
            O n8n está rodando automaticamente a cada <strong>15 minutos</strong>, enviando mensagens para todos os leads qualificados.
            Leads atrasados detectados: <strong>{dashData?.alerts?.leadsAtrasados ?? '...'}</strong>
          </p>
        </div>
      </div>

      {/* Campanhas */}
      <div className="space-y-4">
        {campanhas.map((camp) => {
          const c = colorMap[camp.color];
          const Icon = camp.icon;
          const status = results[camp.id];
          const isLoading = sending === camp.id;

          return (
            <div key={camp.id} className={`bg-white border rounded-2xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow ${c.border}`}>
              <div className={`${c.bg} ${c.text} p-4 rounded-xl flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800">{camp.titulo}</h3>
                  {camp.auto && (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold uppercase">Auto</span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{camp.descricao}</p>
                {camp.alvo !== '—' && (
                  <p className="text-xs mt-2 flex items-center gap-1 text-slate-400">
                    <Users className="w-3 h-3" /> {camp.alvo} leads qualificados agora
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  onClick={() => dispararManual(camp.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-2 ${c.btn} text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isLoading ? 'Disparando...' : 'Disparar Agora'}
                </button>
                {status === 'success' && (
                  <span className="text-xs text-emerald-600 font-semibold">✓ Disparo enviado ao n8n</span>
                )}
                {status === 'error' && (
                  <span className="text-xs text-red-500 font-semibold">✗ Falha — verifique o webhook</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-500">
        <p className="font-semibold text-slate-700 mb-1">ℹ️ Como funciona</p>
        <p>O n8n verifica os leads qualificados automaticamente a cada 15 minutos. Ao clicar em "Disparar Agora", você envia um trigger manual ao webhook do n8n para que ele execute imediatamente. As mensagens são enviadas via <strong>Evolution API</strong> para a instância <code className="bg-slate-100 px-1 rounded">rakmer-v6</code>.</p>
      </div>
    </div>
  );
}
