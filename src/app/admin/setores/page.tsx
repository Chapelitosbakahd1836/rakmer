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
  nome: '',
  descricao: '',
  preco_inteira: '',
  preco_meia: '',
  capacidade_total: '',
  icone: '',
  ordem: '0',
}

function formatPrice(v: number) {
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

  useEffect(() => {
    load()
  }, [])

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
      nome: s.nome,
      descricao: s.descricao || '',
      preco_inteira: String(s.preco_inteira),
      preco_meia: String(s.preco_meia),
      capacidade_total: String(s.capacidade_total),
      icone: s.icone || '',
      ordem: String(s.ordem),
    })
  }

  function startNovo() {
    setShowNovo(true)
    setEditingId(null)
    setForm({ ...EMPTY_FORM, ordem: String(setores.length) })
  }

  function cancelForm() {
    setEditingId(null)
    setShowNovo(false)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.preco_inteira || !form.preco_meia || !form.capacidade_total) {
      setError('Preencha nome, preços e capacidade.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      preco_inteira: Number(form.preco_inteira),
      preco_meia: Number(form.preco_meia),
      capacidade_total: Number(form.capacidade_total),
      icone: form.icone.trim(),
      ordem: Number(form.ordem) || 0,
    }

    try {
      const res = await fetch(
        editingId ? `/api/admin/setores/${editingId}` : '/api/admin/setores',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.erro || 'Erro ao salvar')

      cancelForm()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
    setSaving(false)
  }

  async function toggleAtivo(s: Setor) {
    await fetch(`/api/admin/setores/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !s.ativo }),
    })
    load()
  }

  const formOpen = showNovo || editingId !== null

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Armchair className="w-7 h-7 text-rose-500" />
          Setores e Capacidade
        </h1>
        <p className="text-slate-500 mt-1">
          Defina os tipos de ingresso, preços e capacidade uma única vez — vale automaticamente para todos os dias e shows.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {setores.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-2xl border p-5 flex items-center justify-between gap-4 ${
                s.ativo ? 'border-slate-100' : 'border-slate-100 opacity-50'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-3xl shrink-0">{s.icone || '🎟️'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900">{s.nome}</p>
                    {!s.ativo && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                        Inativo
                      </span>
                    )}
                  </div>
                  {s.descricao && <p className="text-sm text-slate-500">{s.descricao}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatPrice(s.preco_inteira)} inteira · {formatPrice(s.preco_meia)} meia · {s.capacidade_total} lugares por sessão
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEdit(s)}
                  className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleAtivo(s)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                    s.ativo
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {s.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}

          {setores.length === 0 && (
            <div className="text-center py-14 text-slate-400">
              <Armchair className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum setor cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {formOpen ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">{editingId ? 'Editar setor' : 'Novo setor'}</h2>
            <button onClick={cancelForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Arquibancada"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Descrição (opcional)</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Vista lateral, acesso geral"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Preço inteira (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.preco_inteira}
                onChange={(e) => setForm((f) => ({ ...f, preco_inteira: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Preço meia (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.preco_meia}
                onChange={(e) => setForm((f) => ({ ...f, preco_meia: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Capacidade por sessão
              </label>
              <input
                type="number"
                value={form.capacidade_total}
                onChange={(e) => setForm((f) => ({ ...f, capacidade_total: e.target.value }))}
                placeholder="Ex: 400"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400"
              />
              <p className="text-xs text-slate-400 mt-1">Vale para cada dia/horário de show automaticamente.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ícone (emoji)</label>
              <input
                type="text"
                value={form.icone}
                onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))}
                placeholder="🪑"
                maxLength={4}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">⚠ {error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSalvar}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar setor'}
            </button>
            <button
              onClick={cancelForm}
              className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startNovo}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-semibold hover:border-rose-300 hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar novo setor
        </button>
      )}
    </div>
  )
}
