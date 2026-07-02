'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, MapPin, Users, Plus, Pencil, Trash2, X, Check, Clock } from 'lucide-react'

interface Espetaculo {
  id: string
  nome: string
  data_hora: string
  cidade: string
  status: string
  lugares_total: number
  lugares_disponiveis: number
  preco_minimo: number
  slug: string
}

const STATUS_OPTS = [
  { value: 'publicado', label: 'Publicado', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20', ringClass: 'ring-green-500' },
  { value: 'rascunho',  label: 'Rascunho',  badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', ringClass: 'ring-slate-400' },
  { value: 'encerrado', label: 'Encerrado', badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20',   ringClass: 'ring-red-400' },
]

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function buildSlug(cidade: string, dataHora: string) {
  const d = new Date(dataHora)
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${slugify(cidade)}-${meses[d.getMonth()]}-${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}h`
}

const EMPTY_FORM = {
  nome: 'Grande Espetáculo Circo Rakmer', data: '', hora: '20:00',
  cidade: 'Manaus', lugares_total: 730, preco_minimo: 30, status: 'publicado',
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-600 bg-slate-900 text-slate-200 text-sm focus:outline-none focus:border-pink-500'
const labelCls = 'text-xs font-semibold text-slate-400 mb-1 block'

export default function EventosPage() {
  const supabase = createClient()
  const [shows, setShows] = useState<Espetaculo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Espetaculo | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('espetaculos').select('*').order('data_hora', { ascending: true })
    setShows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true)
  }

  function openEdit(s: Espetaculo) {
    const d = new Date(s.data_hora)
    const pad = (n: number) => String(n).padStart(2, '0')
    setEditing(s)
    setForm({
      nome: s.nome, data: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
      hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`, cidade: s.cidade,
      lugares_total: s.lugares_total, preco_minimo: s.preco_minimo, status: s.status,
    })
    setError(''); setModalOpen(true)
  }

  async function handleSave() {
    if (!form.data || !form.hora) { setError('Preencha data e hora.'); return }
    setSaving(true); setError('')
    const dataHora = `${form.data}T${form.hora}:00`
    const slug = buildSlug(form.cidade, dataHora)

    if (editing) {
      const { error: e } = await supabase.from('espetaculos').update({
        nome: form.nome, data_hora: dataHora, cidade: form.cidade,
        lugares_total: Number(form.lugares_total), preco_minimo: Number(form.preco_minimo), status: form.status,
      }).eq('id', editing.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from('espetaculos').insert({
        slug: slug + '-' + Math.random().toString(36).slice(2,6),
        nome: form.nome, data_hora: dataHora, cidade: form.cidade,
        lugares_total: Number(form.lugares_total), lugares_disponiveis: Number(form.lugares_total),
        preco_minimo: Number(form.preco_minimo), status: form.status,
      })
      if (e) { setError(e.message); setSaving(false); return }
    }

    setSaving(false); setModalOpen(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta sessão? Esta ação não pode ser desfeita.')) return
    setDeleting(id)
    await supabase.from('espetaculos').delete().eq('id', id)
    setDeleting(null); load()
  }

  async function toggleStatus(s: Espetaculo) {
    const next = s.status === 'publicado' ? 'rascunho' : 'publicado'
    await supabase.from('espetaculos').update({ status: next }).eq('id', s.id)
    load()
  }

  const statusMap = Object.fromEntries(STATUS_OPTS.map(o => [o.value, o]))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Sessões</h2>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie as datas e horários dos espetáculos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nova Sessão
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-36 rounded-2xl bg-slate-700 animate-pulse" />)}
        </div>
      ) : shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Calendar className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Nenhuma sessão cadastrada</p>
          <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700">
            Criar primeira sessão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {shows.map(s => {
            const d = new Date(s.data_hora)
            const vendidos = s.lugares_total - s.lugares_disponiveis
            const pct = s.lugares_total > 0 ? (vendidos / s.lugares_total) * 100 : 0
            const st = statusMap[s.status] || statusMap['rascunho']
            const barColor = pct > 80 ? 'from-red-500 to-red-400' : pct > 50 ? 'from-yellow-500 to-yellow-400' : 'from-pink-500 to-yellow-400'

            return (
              <div key={s.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">
                        {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 text-xs">
                        <MapPin className="w-3 h-3" /> {s.cidade}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <button
                      onClick={() => toggleStatus(s)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${st.badgeClass}`}
                    >
                      {st.label}
                    </button>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-pink-400 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Ocupação</span>
                    <span className="font-bold text-slate-300">{vendidos} / {s.lugares_total}</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="text-right text-xs font-bold mt-1 text-slate-400">{pct.toFixed(0)}% vendido</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar Sessão' : 'Nova Sessão'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Data *</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Horário *</label>
                  <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input type="text" value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Capacidade total</label>
                  <input type="number" value={form.lugares_total} onChange={e => setForm(f => ({ ...f, lugares_total: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <div className="flex gap-2">
                  {STATUS_OPTS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setForm(f => ({ ...f, status: o.value }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        form.status === o.value
                          ? o.badgeClass + ' ring-1 ' + o.ringClass
                          : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-400">⚠ {error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                ) : <Check className="w-4 h-4" />}
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar sessão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
