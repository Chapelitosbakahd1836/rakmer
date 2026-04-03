// @ts-nocheck
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, Phone, Mail, Ticket } from 'lucide-react';

export default async function ClientesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select(`
      id, nome, email, whatsapp, created_at,
      ingressos(count)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clientes</h1>
        <p className="text-slate-500 mt-1">Compradores confirmados do Circo Rakmer</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          Erro ao carregar clientes: {error.message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-700">{clientes?.length || 0} clientes registrados</span>
        </div>

        {!clientes?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum cliente ainda</p>
            <p className="text-sm mt-1">Clientes aparecem após a primeira compra confirmada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Nome</th>
                  <th className="px-6 py-3 font-semibold">E-mail</th>
                  <th className="px-6 py-3 font-semibold">WhatsApp</th>
                  <th className="px-6 py-3 font-semibold text-center">Ingressos</th>
                  <th className="px-6 py-3 font-semibold">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c: any) => {
                  const initial = (c.nome || 'C').charAt(0).toUpperCase();
                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold mr-3 text-sm flex-shrink-0">
                            {initial}
                          </div>
                          <span className="font-medium text-slate-800">{c.nome || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{c.email || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.whatsapp ? (
                          <a
                            href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            {c.whatsapp}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-xs font-semibold">
                          <Ticket className="w-3 h-3" />
                          {c.ingressos?.[0]?.count ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
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
