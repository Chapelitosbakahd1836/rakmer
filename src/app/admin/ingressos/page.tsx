// @ts-nocheck
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Ticket, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default async function IngressosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: ingressos, error } = await supabase
    .from('ingressos')
    .select(`
      id, status, preco_pago, pago_em, created_at, stripe_session_id,
      cliente:clientes(nome, email, whatsapp),
      espetaculo:espetaculos(nome, data_hora),
      tipo:tipos_ingresso(nome)
    `)
    .order('created_at', { ascending: false })
    .limit(300);

  const statusInfo: Record<string, { label: string; icon: any; color: string }> = {
    pago:      { label: 'Pago',      icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    pendente:  { label: 'Pendente',  icon: Clock,        color: 'text-amber-600 bg-amber-50 border-amber-200' },
    cancelado: { label: 'Cancelado', icon: XCircle,      color: 'text-red-600 bg-red-50 border-red-200' },
    usado:     { label: 'Usado',     icon: CheckCircle2, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  };

  const totals = {
    pago: ingressos?.filter(i => i.status === 'pago').length || 0,
    receita: ingressos?.filter(i => i.status === 'pago').reduce((acc, i) => acc + Number(i.preco_pago || 0), 0) || 0,
    pendente: ingressos?.filter(i => i.status === 'pendente').length || 0,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ingressos</h1>
        <p className="text-slate-500 mt-1">Todos os ingressos emitidos pelo sistema</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Ingressos Pagos</p>
          <p className="text-3xl font-extrabold text-emerald-600">{totals.pago}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Receita Total</p>
          <p className="text-3xl font-extrabold text-slate-800">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.receita)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Pendentes</p>
          <p className="text-3xl font-extrabold text-amber-500">{totals.pendente}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          Erro: {error.message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {!ingressos?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Ticket className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum ingresso emitido ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Espetáculo</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-right">Valor</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {ingressos.map((ing: any) => {
                  const st = statusInfo[ing.status] || statusInfo['pendente'];
                  const Icon = st.icon;
                  return (
                    <tr key={ing.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${st.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">{ing.cliente?.nome || '—'}</p>
                          <p className="text-xs text-slate-400">{ing.cliente?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-700">{ing.espetaculo?.nome || '—'}</p>
                          {ing.espetaculo?.data_hora && (
                            <p className="text-xs text-slate-400">
                              {new Date(ing.espetaculo.data_hora).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-xs font-semibold rounded">
                          {ing.tipo?.nome || 'Padrão'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ing.preco_pago || 0)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(ing.pago_em || ing.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
