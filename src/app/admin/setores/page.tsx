'use client'

import { useState, useEffect } from 'react'
import { Armchair, Plus, X, Pencil } from 'lucide-react'

interface Setor {
  id: string
  nome: string
  descricao: string | null
  preco_inteira: number
  preco_meia: number
  capacidade_total: number
  cor: string | null
  icone: string | null
  ordem: number
  ativo: boolean
}

type FormState = {
  nome: string
  descricao: string
  preco_inteira: string
  preco_meia: string
  capacidade_total: string
  icone: string
  ordem: string
}

const EMPTY_FORM: FormState = {
  nome: '', descricao: '', preco_inteira: '', preco_meia: '',
  capacidade_total: '', icone: '', ordem: '0',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SetoresAdminPage() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNovo, setShowNovo] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/setores')
    const json = await res.json()
    setSetores(json.setores || [])
    setLoading(false)
  }

  function startEdit(s: Setor) {
    setEditingId(s.id)
    setShowNovo(false)
    setForm({
      nome: s.nome, descricao: s.descricao || '',
      preco_inteira: String(s.preco_inteira), preco_meia: String(s.preco_meia),
      capacidade_total: String(s.capacidade_total), icone: s.icone || '', ordem: String(s.ordem),
    })
  }

  function startNovo() {
    setShowNovo(true)
    setEditingId(null)
    setForm({ ...EMPTY_FORM, ordem: String(setores.length) })
  }

  function cancelForm() {
    setEditingId(null); setShowNovo(false); setForm(EMPTY_FORM); setError('')
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.preco_inteira || !form.preco_meia || !form.capacidade_total) {
      setError('Preencha nome, preços e capacidade.')
      return
    }
    setSaving(true); setError('')
    const payload = {
      nome: form.nome.trim(), descricao: form.descricao.trim(),
      preco_inteira: Number(form.preco_inteira), preco_meia: Number(form.preco_meia),
      capacidade_total: Number(form.capacidade_total), icone: form.icone.trim(),
      ordem: Number(form.ordem) || 0,
    }
    try {
      const res = await fetch(
        editingId ? `/api/admin/setores/${editingId}` : '/api/admin/setores',
        { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.erro || 'Erro ao salvar')
      cancelForm(); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
    setSaving(false)
  }

  async function toggleAtivo(s: Setor) {
    await fetch(`/api/admin/setores/${s.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !s.ativo }),
    })
    load()
  }

  const formOpen = showNovo || editingId !== null
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-600 bg-slate-900 text-slate-200 text-sm focus:outline-none focus:border-pink-500 placeholder-slate-600'
  const labelCls = 'text-xs font-semibold text-slate-400 mb-1.5 block'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Armchair className="w-5 h-5 text-pink-400" /> Setores e Capacidade
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Defina preços e capacidade uma vez — vale para todos os shows automaticamente.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-700 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {setores.map(s => (
            <div
              key={s.id}
              className={`bg-slate-900 rounded-2xl border p-4 flex items-center justify-between gap-4 transition-opacity ${
                s.ativo ? 'border-slate-700' : 'border-slate-700 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{s.icone || '🎟️'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white">{s.nome}</p>
                    {!s.ativo && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">Inativo</span>
                    )}
                  </div>
                  {s.descricao && <p className="text-sm text-slate-400">{s.descricao}</p>}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fmt(s.preco_inteira)} inteira · {fmt(s.preco_meia)} meia · {s.capacidade_total} lugares/sessão
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(s)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-pink-400 transition-colors" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleAtivo(s)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    s.ativo ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                  }`}
                >
                  {s.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}

          {setores.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Armchair className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum setor cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {formOpen ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{editingId ? 'Editar setor' : 'Novo setor'}</h3>
            <button onClick={cancelForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nome</label>
              <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Arquibancada" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Descrição (opcional)</label>
              <input type="text" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Vista lateral, acesso geral" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Preço inteira (R$)</label>
              <input type="number" step="0.01" value={form.preco_inteira} onChange={e => setForm(f => ({ ...f, preco_inteira: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Preço meia (R$)</label>
              <input type="number" step="0.01" value={form.preco_meia} onChange={e => setForm(f => ({ ...f, preco_meia: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Capacidade por sessão</label>
              <input type="number" value={form.capacidade_total} onChange={e => setForm(f => ({ ...f, capacidade_total: e.target.value }))} placeholder="Ex: 400" className={inputCls} />
              <p className="text-xs text-slate-500 mt-1">Vale para cada show automaticamente.</p>
            </div>
            <div>
              <label className={labelCls}>Ícone (emoji)</label>
              <input type="text" value={form.icone} onChange={e => setForm(f => ({ ...f, icone: e.target.value }))} placeholder="🪑" maxLength={4} className={inputCls} />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">⚠ {error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSalvar} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors disabled:opacity-60">
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar setor'}
            </button>
            <button onClick={cancelForm} className="px-5 py-2.5 rounded-xl bg-slate-700 text-slate-200 font-semibold hover:bg-slate-600 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startNovo}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-700 text-slate-500 font-semibold hover:border-pink-500 hover:text-pink-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Adicionar novo setor
        </button>
      )}
    </div>
  )
}
