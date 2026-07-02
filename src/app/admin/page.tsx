'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Ticket, Smartphone, Store, Users, Calendar, TrendingUp } from 'lucide-react'

interface KpiData {
  receita: number
  total: number
  ingressosOnline: number
  ingressosBilheteria: number
  novosLeads: number
}

interface Show {
  id: string
  nome: string
  data_hora: string
  cidade: string
  vendidos: number
  lugares_total: number
}

interface Venda {
  id: string
  nome_cliente: string
  whatsapp_cliente: string
  total: number
  canal: string
  created_at: string
  espetaculo: { nome: string } | null
  itens: { quantidade: number; tipo: string; setor: { nome: string } | null }[]
}

interface DashData {
  kpis: KpiData
  shows: Show[]
  ultimasVendas: Venda[]
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const [from, setFrom] = useState(today())
  const [to, setTo]     = useState(today())
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/dashboard?from=${from}&to=${to}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { load() }, [load])

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const kpis = data?.kpis

  return (
    <div className="space-y-8">
      {/* Header + date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Visão geral de vendas e leads</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex-wrap">
          <Calendar className="w-4 h-4 text-pink-400" />
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="bg-transparent text-slate-200 text-sm focus:outline-none"
          />
          <span className="text-slate-500 text-sm">até</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="bg-transparent text-slate-200 text-sm focus:outline-none"
          />
          <button
            onClick={load}
            className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Receita"
          value={loading ? '...' : fmt(kpis?.receita ?? 0)}
          accent="pink"
          span
        />
        <KpiCard
          icon={<Ticket className="w-5 h-5" />}
          label="Ingressos vendidos"
          value={loading ? '...' : String(kpis?.total ?? 0)}
          accent="yellow"
        />
        <KpiCard
          icon={<Smartphone className="w-5 h-5" />}
          label="Venda online"
          value={loading ? '...' : String(kpis?.ingressosOnline ?? 0)}
          accent="yellow"
        />
        <KpiCard
          icon={<Store className="w-5 h-5" />}
          label="Bilheteria"
          value={loading ? '...' : String(kpis?.ingressosBilheteria ?? 0)}
          accent="yellow"
        />
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label="Novos leads"
          value={loading ? '...' : String(kpis?.novosLeads ?? 0)}
          accent="yellow"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximos shows */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <h2 className="font-semibold text-white text-sm">Próximos Espetáculos</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-1/2" />
                  </div>
                ))
              : (data?.shows.length ?? 0) === 0
              ? <p className="px-5 py-8 text-slate-500 text-sm text-center">Nenhum show publicado</p>
              : data?.shows.map(s => {
                  const pct = s.lugares_total ? Math.round((s.vendidos / s.lugares_total) * 100) : 0
                  return (
                    <div key={s.id} className="px-5 py-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{s.nome}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{fmtDate(s.data_hora)} · {s.cidade}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-yellow-400 font-bold text-sm">{s.vendidos}</span>
                          {s.lugares_total ? <span className="text-slate-500 text-xs">/{s.lugares_total}</span> : null}
                        </div>
                      </div>
                      {s.lugares_total ? (
                        <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-yellow-400 rounded-full transition-all"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* Últimas vendas */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h2 className="font-semibold text-white text-sm">Últimas Vendas</h2>
            </div>
            <button onClick={load} className="text-xs text-slate-400 hover:text-pink-400 transition-colors">
              ↻ Atualizar
            </button>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-1/3" />
                  </div>
                ))
              : (data?.ultimasVendas.length ?? 0) === 0
              ? <p className="px-5 py-8 text-slate-500 text-sm text-center">Nenhuma venda registrada</p>
              : data?.ultimasVendas.map(v => {
                  const totalQtd = v.itens?.reduce((s, i) => s + i.quantidade, 0) ?? 0
                  return (
                    <div key={v.id} className="px-5 py-3 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{v.nome_cliente || 'Cliente'}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {v.espetaculo?.nome} · {totalQtd} ingresso{totalQtd !== 1 ? 's' : ''} ·{' '}
                            <span className={v.canal === 'bilheteria' ? 'text-yellow-400' : 'text-pink-400'}>
                              {v.canal === 'bilheteria' ? 'Bilheteria' : 'Online'}
                            </span>
                          </p>
                          <p className="text-slate-500 text-xs">{fmtDate(v.created_at)}</p>
                        </div>
                        <span className="text-green-400 font-bold text-sm shrink-0">{fmt(v.total)}</span>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon, label, value, accent, span
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'pink' | 'yellow'
  span?: boolean
}) {
  const color = accent === 'pink'
    ? 'text-pink-400 bg-pink-500/10 border-pink-500/20'
    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-5 ${span ? 'col-span-2 lg:col-span-1' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color} border`}>
        {icon}
      </div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent === 'pink' ? 'text-pink-400' : 'text-yellow-400'}`}>{value}</p>
    </div>
  )
}
