'use client'

import { useState, useTransition } from 'react'
import {
  salvarConfigs,
  salvarTemplate,
  excluirTemplate,
  gerarShows,
  cancelarEspetaculo,
  publicarEspetaculo,
  buscarShowsGerados,
  type TemplateIngresso,
  type ShowGerado,
} from '@/app/actions/configuracoes'

// ─── Types ────────────────────────────────────────────────────

interface Props {
  initialConfigs: Record<string, string>
  initialTemplates: TemplateIngresso[]
  initialShows: ShowGerado[]
}

type Tab = 'geral' | 'programacao' | 'ingressos' | 'shows'

// ─── Helpers ─────────────────────────────────────────────────

function parseHorarios(str: string): string[] {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function formatDateBR(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const todayISO = new Date().toISOString().slice(0, 10)

// ─── Toast simples ────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl text-white transition-all ${
        type === 'ok' ? 'bg-green-600' : 'bg-rose-600'
      }`}
    >
      {type === 'ok' ? '✓' : '⚠'} {msg}
    </div>
  )
}

// ─── Seção Geral ─────────────────────────────────────────────

function SecaoGeral({
  configs,
  onChange,
}: {
  configs: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Nome da Cidade
        </label>
        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base"
          value={configs['cidade'] || ''}
          onChange={(e) => onChange('cidade', e.target.value)}
          placeholder="Ex: Pompéia-SP"
        />
        <p className="text-xs text-slate-400 mt-1">
          Aparece no título da página inicial e em todo o funil de compra.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Nome do Espetáculo
        </label>
        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base"
          value={configs['nome_espetaculo'] || ''}
          onChange={(e) => onChange('nome_espetaculo', e.target.value)}
          placeholder="Ex: Grande Espetáculo Circo Rakmer"
        />
        <p className="text-xs text-slate-400 mt-1">
          Usado como nome dos espetáculos gerados automaticamente.
        </p>
      </div>
    </div>
  )
}

// ─── Seção Programação ────────────────────────────────────────

function SecaoProgramacao({
  configs,
  onChange,
  onGerar,
}: {
  configs: Record<string, string>
  onChange: (key: string, val: string) => void
  onGerar: () => void
}) {
  const [resultado, setResultado] = useState<{ criados: number; ignorados: number; erros: string[] } | null>(null)
  const [gerando, startGerar] = useTransition()

  const handleGerar = () => {
    setResultado(null)
    startGerar(async () => {
      const horariosSemana = parseHorarios(configs['horarios_semana'] || '20:30')
      const horariosFds = parseHorarios(configs['horarios_fds'] || '18:00,20:30')
      const blackout = parseHorarios(configs['blackout_dates'] || '')

      const res = await gerarShows({
        dataInicio: configs['data_inicio'] || todayISO,
        dataFim: configs['data_fim'] || todayISO,
        horariosSemana,
        horariosFds,
        blackoutDates: blackout,
      })
      setResultado(res)
      onGerar()
    })
  }

  return (
    <div className="space-y-6">
      {/* Período */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Período dos Shows
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Data de início</label>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
              value={configs['data_inicio'] || todayISO}
              min={todayISO}
              onChange={(e) => onChange('data_inicio', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Data de fim</label>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
              value={configs['data_fim'] || todayISO}
              min={configs['data_inicio'] || todayISO}
              onChange={(e) => onChange('data_fim', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Horários semana */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Horários — Segunda a Sexta
        </label>
        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base"
          value={configs['horarios_semana'] || '20:30'}
          onChange={(e) => onChange('horarios_semana', e.target.value)}
          placeholder="20:30"
        />
        <p className="text-xs text-slate-400 mt-1">
          Separe múltiplos horários com vírgula. Ex: <code>20:30</code>
        </p>
      </div>

      {/* Horários fim de semana */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Horários — Sábado, Domingo e Feriados
        </label>
        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base"
          value={configs['horarios_fds'] || '18:00,20:30'}
          onChange={(e) => onChange('horarios_fds', e.target.value)}
          placeholder="18:00,20:30"
        />
        <p className="text-xs text-slate-400 mt-1">
          Ex: <code>18:00,20:30</code>
        </p>
      </div>

      {/* Dias sem show */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Dias sem Show (Blackout)
        </label>
        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base"
          value={configs['blackout_dates'] || ''}
          onChange={(e) => onChange('blackout_dates', e.target.value)}
          placeholder="2026-05-01,2026-06-19"
        />
        <p className="text-xs text-slate-400 mt-1">
          Datas no formato <code>AAAA-MM-DD</code>, separadas por vírgula.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500 mb-3">
          O sistema irá criar um espetáculo para cada dia/horário no período, usando os templates de ingresso ativos. Dias que já têm espetáculo cadastrado serão ignorados.
        </p>
        <button
          onClick={handleGerar}
          disabled={gerando}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-black text-base transition-all disabled:opacity-50"
          style={{ backgroundColor: '#FFD700', boxShadow: '0 0 16px rgba(255,215,0,0.4)' }}
        >
          {gerando ? '⏳ Gerando shows...' : '🎪 Gerar Shows'}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div
          className={`rounded-xl p-4 text-sm ${
            resultado.erros.length > 0
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}
        >
          <p className="font-bold mb-1">
            ✓ {resultado.criados} shows criados · {resultado.ignorados} ignorados (já existiam)
          </p>
          {resultado.erros.map((e, i) => (
            <p key={i} className="text-xs mt-1">⚠ {e}</p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Seção Ingressos ──────────────────────────────────────────

function SecaoIngressos({
  templates,
  onUpdate,
}: {
  templates: TemplateIngresso[]
  onUpdate: (templates: TemplateIngresso[]) => void
}) {
  const [editando, setEditando] = useState<TemplateIngresso | null>(null)
  const [isPending, start] = useTransition()
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const novoTemplate = (): TemplateIngresso => ({
    nome: '',
    preco: 0,
    preco_original: null,
    descricao: null,
    lugares_total: 100,
    ativo: true,
  })

  const handleSalvar = () => {
    if (!editando) return
    start(async () => {
      try {
        const id = await salvarTemplate(editando)
        const updated = editando.id
          ? templates.map((t) => (t.id === id ? { ...editando, id } : t))
          : [...templates, { ...editando, id }]
        onUpdate(updated)
        setEditando(null)
        showToast('Template salvo!', 'ok')
      } catch {
        showToast('Erro ao salvar template.', 'err')
      }
    })
  }

  const handleExcluir = (id: string) => {
    start(async () => {
      try {
        await excluirTemplate(id)
        onUpdate(templates.filter((t) => t.id !== id))
        showToast('Template removido.', 'ok')
      } catch {
        showToast('Erro ao remover.', 'err')
      }
    })
  }

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Templates são usados ao gerar novos shows. Cada show terá um tipo de ingresso por template ativo.
        </p>
        <button
          onClick={() => setEditando(novoTemplate())}
          className="flex-shrink-0 ml-4 px-4 py-2 rounded-xl text-sm font-bold text-black"
          style={{ backgroundColor: '#FFD700' }}
        >
          + Novo
        </button>
      </div>

      {/* Lista de templates */}
      <div className="space-y-3">
        {templates.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">Nenhum template cadastrado.</p>
        )}
        {templates.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-opacity ${
              t.ativo ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800">{t.nome}</span>
                {!t.ativo && (
                  <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                    Inativo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-sm font-bold text-rose-600">
                  R$ {t.preco.toFixed(2).replace('.', ',')}
                </span>
                {t.preco_original && (
                  <span className="text-xs text-slate-400 line-through">
                    R$ {t.preco_original.toFixed(2).replace('.', ',')}
                  </span>
                )}
                <span className="text-xs text-slate-400">{t.lugares_total} lugares</span>
              </div>
              {t.descricao && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{t.descricao}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setEditando({ ...t })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => t.id && handleExcluir(t.id)}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edição */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditando(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-800">
              {editando.id ? 'Editar Template' : 'Novo Template'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nome</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                value={editando.nome}
                onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                placeholder="Ex: Pista, VIP, Meia-entrada..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                  value={editando.preco}
                  onChange={(e) => setEditando({ ...editando, preco: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Preço original (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                  value={editando.preco_original ?? ''}
                  placeholder="0,00"
                  onChange={(e) =>
                    setEditando({
                      ...editando,
                      preco_original: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Lugares disponíveis por show
              </label>
              <input
                type="number"
                min="1"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                value={editando.lugares_total}
                onChange={(e) =>
                  setEditando({ ...editando, lugares_total: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Descrição (opcional)
              </label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                value={editando.descricao ?? ''}
                onChange={(e) =>
                  setEditando({ ...editando, descricao: e.target.value || null })
                }
                placeholder="Ex: Assento numerado + brinde"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={editando.ativo}
                onChange={(e) => setEditando({ ...editando, ativo: e.target.checked })}
                className="w-4 h-4 accent-rose-500"
              />
              <label htmlFor="ativo" className="text-sm text-slate-700">
                Ativo (usado ao gerar novos shows)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditando(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={isPending || !editando.nome || editando.preco <= 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50"
                style={{ backgroundColor: '#FFD700' }}
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Seção Shows ──────────────────────────────────────────────

function SecaoShows({
  shows,
  onUpdate,
}: {
  shows: ShowGerado[]
  onUpdate: (shows: ShowGerado[]) => void
}) {
  const [isPending, start] = useTransition()
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'publicado' | 'cancelado'>('publicado')

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleCancelar = (id: string) => {
    start(async () => {
      const res = await cancelarEspetaculo(id)
      if (res.error) {
        showToast(res.error, 'err')
      } else {
        const updated = await buscarShowsGerados()
        onUpdate(updated)
        showToast('Show cancelado.', 'ok')
      }
    })
  }

  const handlePublicar = (id: string) => {
    start(async () => {
      await publicarEspetaculo(id)
      const updated = await buscarShowsGerados()
      onUpdate(updated)
      showToast('Show publicado.', 'ok')
    })
  }

  const agora = new Date()
  const filtrados = shows.filter((s) => {
    if (filtro === 'todos') return true
    return s.status === filtro
  })

  const futuros = filtrados.filter((s) => new Date(s.data_hora) >= agora)
  const passados = filtrados.filter((s) => new Date(s.data_hora) < agora)

  const ShowCard = ({ s }: { s: ShowGerado }) => {
    const isPast = new Date(s.data_hora) < agora
    const isCanceled = s.status === 'cancelado'
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-opacity ${
          isCanceled || isPast ? 'opacity-50 bg-slate-50' : 'bg-white'
        } border-slate-200`}
      >
        {/* Date block */}
        <div className="flex-shrink-0 w-14 text-center">
          <div className="font-bold text-slate-800 text-base leading-none">
            {new Date(s.data_hora).getDate().toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-400 uppercase">
            {new Date(s.data_hora).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
          </div>
          <div className="text-xs font-semibold text-rose-500 mt-0.5">
            {formatTime(s.data_hora)}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700 text-xs">{s.cidade}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                isCanceled
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {isCanceled ? 'Cancelado' : 'Publicado'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span>🎫 {s.vendidos} vendidos</span>
            <span>💺 {s.lugares_disponiveis} disponíveis</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          {isCanceled ? (
            <button
              onClick={() => handlePublicar(s.id)}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              Publicar
            </button>
          ) : (
            <button
              onClick={() => handleCancelar(s.id)}
              disabled={isPending || s.vendidos > 0}
              title={s.vendidos > 0 ? 'Tem ingressos vendidos' : ''}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Filtros */}
      <div className="flex gap-2">
        {(['publicado', 'cancelado', 'todos'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              filtro === f
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f === 'publicado' ? 'Ativos' : f === 'cancelado' ? 'Cancelados' : 'Todos'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {filtrados.length} shows
        </span>
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-slate-400 py-8 text-sm">
          Nenhum show encontrado. Use a aba Programação para gerar shows.
        </p>
      )}

      {futuros.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Próximos ({futuros.length})
          </p>
          <div className="space-y-2">
            {futuros.map((s) => <ShowCard key={s.id} s={s} />)}
          </div>
        </div>
      )}

      {passados.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">
            Passados ({passados.length})
          </p>
          <div className="space-y-2">
            {passados.slice(0, 20).map((s) => <ShowCard key={s.id} s={s} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────

export default function ConfiguracoesClient({ initialConfigs, initialTemplates, initialShows }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('geral')
  const [configs, setConfigs] = useState(initialConfigs)
  const [templates, setTemplates] = useState(initialTemplates)
  const [shows, setShows] = useState(initialShows)
  const [saving, startSave] = useTransition()
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSalvar = () => {
    startSave(async () => {
      try {
        await salvarConfigs(configs)
        showToast('Configurações salvas!', 'ok')
      } catch {
        showToast('Erro ao salvar.', 'err')
      }
    })
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'geral', label: 'Geral', icon: '⚙️' },
    { id: 'programacao', label: 'Programação', icon: '📅' },
    { id: 'ingressos', label: 'Ingressos', icon: '🎫' },
    { id: 'shows', label: 'Shows', icon: '🎪' },
  ]

  const needsSave = activeTab === 'geral' || activeTab === 'programacao'

  return (
    <div className="max-w-2xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1 text-sm">Gerencie cidade, horários, shows e ingressos.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="text-base">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6"
        style={{ minHeight: '400px' }}
      >
        {activeTab === 'geral' && (
          <SecaoGeral
            configs={configs}
            onChange={(k, v) => setConfigs((prev) => ({ ...prev, [k]: v }))}
          />
        )}

        {activeTab === 'programacao' && (
          <SecaoProgramacao
            configs={configs}
            onChange={(k, v) => setConfigs((prev) => ({ ...prev, [k]: v }))}
            onGerar={async () => {
              const updated = await buscarShowsGerados()
              setShows(updated)
            }}
          />
        )}

        {activeTab === 'ingressos' && (
          <SecaoIngressos templates={templates} onUpdate={setTemplates} />
        )}

        {activeTab === 'shows' && (
          <SecaoShows shows={shows} onUpdate={setShows} />
        )}
      </div>

      {/* Save button — only for Geral and Programação */}
      {needsSave && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSalvar}
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold text-black text-sm transition-all disabled:opacity-50 hover:scale-[1.02]"
            style={{ backgroundColor: '#FFD700', boxShadow: '0 0 16px rgba(255,215,0,0.35)' }}
          >
            {saving ? '⏳ Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      )}
    </div>
  )
}
