'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, CheckCircle2, Clock, Download } from 'lucide-react'

interface Pedido {
  id: string
  status: string
  canal: string
  total: number
  nome_cliente: string
  email_cliente: string
  whatsapp_cliente: string
  created_at: string
  codigo?: string
  espetaculo: { nome: string; data_hora: string } | null
  itens: { quantidade: number; tipo: string; setor: { nome: string } | null }[]
}

export default function IngressosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro]   = useState<'todos' | 'pago' | 'pendente'>('todos')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('pedidos')
      .select(`
        id, status, canal, total, nome_cliente, email_cliente, whatsapp_cliente, created_at, codigo,
        espetaculo:espetaculos(nome, data_hora),
        itens:pedido_itens(quantidade, tipo, setor:setores(nome))
      `)
      .order('created_at', { ascending: false })
      .limit(500)
    setPedidos((data as unknown as Pedido[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const filtered = pedidos.filter(p => filtro === 'todos' || p.status === filtro)
  const pagos    = pedidos.filter(p => p.status === 'pago')
  const pendentes = pedidos.filter(p => p.status === 'pendente')
  const receita  = pagos.reduce((s, p) => s + Number(p.total), 0)
  const totalIngressosPagos = pagos.reduce((s, p) => s + (p.itens?.reduce((a, i) => a + i.quantidade, 0) ?? 0), 0)

  function downloadCSV() {
    const rows = filtered.map(p => ({
      Codigo: p.codigo ?? p.id.slice(0, 8),
      Status: p.status,
      Cliente: p.nome_cliente,
      WhatsApp: p.whatsapp_cliente,
      Email: p.email_cliente,
      Espetaculo: p.espetaculo?.nome ?? '',
      Data_Show: p.espetaculo?.data_hora ? fmtDate(p.espetaculo.data_hora) : '',
      Canal: p.canal,
      Total: p.total,
      Data_Compra: fmtDate(p.created_at),
      Ingressos: p.itens?.reduce((a, i) => a + i.quantidade, 0) ?? 0,
    }))
    const cols = ['Codigo', 'Status', 'Cliente', 'WhatsApp', 'Email', 'Espetaculo', 'Data_Show', 'Canal', 'Total', 'Data_Compra', 'Ingressos']
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [cols.join(';'), ...rows.map(r => cols.map(c => escape((r as Record<string, unknown>)[c])).join(';'))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ingressos.csv'
    a.click()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ingressos</h1>
          <p className="text-slate-400 text-sm mt-0.5">Todos os pedidos do sistema</p>
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-1.5 text-xs bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-lg transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="w-9 h-9 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center mb-3">
            <Ticket className="w-5 h-5 text-pink-400" />
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Pedidos pagos</p>
          <p className="text-2xl font-bold text-pink-400 mt-1">{pagos.length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="w-9 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Ingressos emitidos</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{totalIngressosPagos}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="w-9 h-9 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mb-3">
            <span className="text-green-400 font-bold text-sm">R$</span>
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Receita total</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{fmt(receita)}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="w-9 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{pendentes.length}</p>
        </div>
      </div>

      {/* Filter + Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-1 px-4 py-3 border-b border-slate-700">
          {(['todos', 'pago', 'pendente'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f
                  ? 'bg-pink-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 opacity-60">
                {f === 'todos' ? pedidos.length : f === 'pago' ? pagos.length : pendentes.length}
              </span>
            </button>
          ))}
          <button onClick={load} className="ml-auto text-xs text-slate-400 hover:text-pink-400 transition-colors">↻</button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Carregando...</div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Ticket className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/50">
                  {['Status', 'Código', 'Cliente', 'Espetáculo', 'Qtd', 'Canal', 'Total', 'Data'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(p => {
                  const qtd = p.itens?.reduce((a, i) => a + i.quantidade, 0) ?? 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === 'pago'
                            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                            : p.status === 'cancelado'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {p.status === 'pago' ? 'Pago' : p.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                        {p.codigo ?? p.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-200 font-medium truncate max-w-[140px]">{p.nome_cliente || '—'}</p>
                        {p.whatsapp_cliente && (
                          <a href={`https://wa.me/55${p.whatsapp_cliente.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs text-green-400 hover:underline">
                            {p.whatsapp_cliente}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-200 truncate max-w-[160px]">{p.espetaculo?.nome ?? '—'}</p>
                        {p.espetaculo?.data_hora && (
                          <p className="text-xs text-slate-500">{fmtDate(p.espetaculo.data_hora)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-yellow-400 font-medium">{qtd}</td>
                      <td className="px-4 py-3">
                        <span className={p.canal === 'bilheteria' ? 'text-yellow-400' : 'text-pink-400'}>
                          {p.canal === 'bilheteria' ? 'Bilheteria' : 'Online'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-green-400 font-bold">{fmt(p.total)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(p.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
