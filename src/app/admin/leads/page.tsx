'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Phone, ShoppingBag, UserX, Download, Trash2, AlertTriangle } from 'lucide-react'

interface Stats {
  totalCompradores: number
  leadsComWa: number
  leadsQueCompraram: number
  leadsNaoCompraram: number
  compraramSemContato: number
}

interface Comprador {
  id: string
  nome_cliente: string
  email_cliente: string
  whatsapp_cliente: string
  total: number
  canal: string
  created_at: string
  espetaculo: { nome: string } | null
}

interface Lead {
  id: string
  nome: string
  email: string
  whatsapp: string
  canal: string
  created_at: string
}

interface ContatosData {
  stats: Stats
  canalCount: Record<string, number>
  compradores: Comprador[]
  leadsQueCompraram: Lead[]
  leadsNaoCompraram: Lead[]
  compraramSemContato: Comprador[]
  todosLeads: Lead[]
}

type TabKey = 'compradores' | 'leadsCompraram' | 'leadsNao' | 'semContato'

export default function ContatosPage() {
  const [data, setData]       = useState<ContatosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<TabKey>('compradores')
  const [confirm, setConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/contatos')
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  function toCSV(rows: Record<string, unknown>[], cols: string[]) {
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [cols.join(';'), ...rows.map(r => cols.map(c => escape(r[c])).join(';'))]
    return lines.join('\n')
  }

  function download(csv: string, name: string) {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
  }

  function downloadCompradores() {
    if (!data) return
    const csv = toCSV(data.compradores.map(c => ({
      Nome: c.nome_cliente,
      Email: c.email_cliente,
      WhatsApp: c.whatsapp_cliente,
      Espetaculo: c.espetaculo?.nome ?? '',
      Canal: c.canal,
      Total: c.total,
      Data: fmtDate(c.created_at),
    })), ['Nome', 'Email', 'WhatsApp', 'Espetaculo', 'Canal', 'Total', 'Data'])
    download(csv, 'compradores.csv')
  }

  function downloadLeads() {
    if (!data) return
    const csv = toCSV(data.todosLeads.map(l => ({
      Nome: l.nome,
      Email: l.email,
      WhatsApp: l.whatsapp,
      Canal: l.canal,
      Data: fmtDate(l.created_at),
    })), ['Nome', 'Email', 'WhatsApp', 'Canal', 'Data'])
    download(csv, 'leads.csv')
  }

  async function clearLeads() {
    setClearing(true)
    try {
      await fetch('/api/admin/contatos?target=leads', { method: 'DELETE' })
      await load()
    } finally {
      setClearing(false)
      setConfirm(false)
    }
  }

  const stats = data?.stats

  const TABS: { key: TabKey; label: string; count: number | undefined }[] = [
    { key: 'compradores',    label: 'Compradores',       count: stats?.totalCompradores },
    { key: 'leadsCompraram', label: 'Lead + Comprou',    count: stats?.leadsQueCompraram },
    { key: 'leadsNao',       label: 'Lead sem compra',   count: stats?.leadsNaoCompraram },
    { key: 'semContato',     label: 'Comprou sem contato', count: stats?.compraramSemContato },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contatos</h1>
          <p className="text-slate-400 text-sm mt-0.5">Compradores, leads e contatos captados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadLeads} className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Leads CSV
          </button>
          <button onClick={downloadCompradores} className="flex items-center gap-1.5 text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Compradores CSV
          </button>
          <button onClick={() => setConfirm(true)} className="flex items-center gap-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-3 py-2 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" /> Limpar leads
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<ShoppingBag className="w-5 h-5" />} label="Compradores" value={stats?.totalCompradores} loading={loading} accent="pink" />
        <StatCard icon={<Phone className="w-5 h-5" />} label="Leads com WhatsApp" value={stats?.leadsComWa} loading={loading} accent="yellow" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Lead + Comprou" value={stats?.leadsQueCompraram} loading={loading} accent="yellow" />
        <StatCard icon={<UserX className="w-5 h-5" />} label="Lead sem compra" value={stats?.leadsNaoCompraram} loading={loading} accent="yellow" />
      </div>

      {/* Canal breakdown */}
      {data?.canalCount && Object.keys(data.canalCount).length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Origem das vendas</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.canalCount).map(([canal, n]) => (
              <span key={canal} className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs text-pink-300 font-medium">
                {canal}: {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-700">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t.key
                  ? 'text-pink-400 border-pink-500 bg-pink-500/5'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-pink-500/20 text-pink-300' : 'bg-slate-700 text-slate-400'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {tab === 'compradores' && (
            <ContatoTable
              loading={loading}
              rows={data?.compradores ?? []}
              cols={['Nome', 'WhatsApp', 'Espetáculo', 'Canal', 'Total', 'Data']}
              render={r => {
                const c = r as Comprador
                return [
                  c.nome_cliente || '—',
                  c.whatsapp_cliente
                    ? <a href={`https://wa.me/55${c.whatsapp_cliente.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">{c.whatsapp_cliente}</a>
                    : <span className="text-slate-500">Não informado</span>,
                  c.espetaculo?.nome ?? '—',
                  <span className={c.canal === 'bilheteria' ? 'text-yellow-400' : 'text-pink-400'}>{c.canal || '—'}</span>,
                  <span className="text-green-400 font-medium">{fmt(c.total)}</span>,
                  fmtDate(c.created_at),
                ]
              }}
            />
          )}
          {tab === 'leadsCompraram' && (
            <ContatoTable
              loading={loading}
              rows={data?.leadsQueCompraram ?? []}
              cols={['Nome', 'WhatsApp', 'Canal', 'Data']}
              render={r => {
                const l = r as Lead
                return [
                  l.nome || '—',
                  <a href={`https://wa.me/55${l.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">{l.whatsapp}</a>,
                  l.canal || '—',
                  fmtDate(l.created_at),
                ]
              }}
            />
          )}
          {tab === 'leadsNao' && (
            <ContatoTable
              loading={loading}
              rows={data?.leadsNaoCompraram ?? []}
              cols={['Nome', 'WhatsApp', 'Canal', 'Data']}
              render={r => {
                const l = r as Lead
                return [
                  l.nome || '—',
                  <a href={`https://wa.me/55${l.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">{l.whatsapp}</a>,
                  l.canal || '—',
                  fmtDate(l.created_at),
                ]
              }}
            />
          )}
          {tab === 'semContato' && (
            <ContatoTable
              loading={loading}
              rows={data?.compraramSemContato ?? []}
              cols={['Nome', 'Email', 'Espetáculo', 'Canal', 'Total', 'Data']}
              render={r => {
                const c = r as Comprador
                return [
                  c.nome_cliente || '—',
                  c.email_cliente || '—',
                  c.espetaculo?.nome ?? '—',
                  c.canal || '—',
                  <span className="text-green-400 font-medium">{fmt(c.total)}</span>,
                  fmtDate(c.created_at),
                ]
              }}
            />
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-semibold">Limpar todos os leads?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Isso vai apagar todos os contatos de leads captados no funil. <strong className="text-white">Os compradores não serão afetados.</strong> Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600 transition-colors">
                Cancelar
              </button>
              <button onClick={clearLeads} disabled={clearing} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60 transition-colors">
                {clearing ? 'Limpando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, loading, accent }: {
  icon: React.ReactNode
  label: string
  value: number | undefined
  loading: boolean
  accent: 'pink' | 'yellow'
}) {
  const color = accent === 'pink'
    ? 'text-pink-400 bg-pink-500/10 border-pink-500/20'
    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color} border`}>{icon}</div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent === 'pink' ? 'text-pink-400' : 'text-yellow-400'}`}>
        {loading ? '...' : (value ?? 0)}
      </p>
    </div>
  )
}

function ContatoTable({ loading, rows, cols, render }: {
  loading: boolean
  rows: unknown[]
  cols: string[]
  render: (row: unknown) => React.ReactNode[]
}) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Carregando...</div>
    )
  }
  if (!rows.length) {
    return <div className="p-8 text-center text-slate-500 text-sm">Nenhum registro encontrado</div>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-900/50">
          {cols.map(c => (
            <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-700/50">
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-slate-700/20 transition-colors">
            {render(row).map((cell, j) => (
              <td key={j} className="px-4 py-3 text-slate-200 whitespace-nowrap">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
