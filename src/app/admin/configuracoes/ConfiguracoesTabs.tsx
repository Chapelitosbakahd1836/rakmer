'use client'

import { useState } from 'react'
import { Settings, Calendar, Armchair } from 'lucide-react'
import ConfiguracoesClient from './ConfiguracoesClient'
import EventosContent from '../eventos/page'
import SetoresContent from '../setores/page'
import type { TemplateIngresso, ShowGerado } from '@/app/actions/configuracoes'

type Tab = 'geral' | 'sessoes' | 'setores'

interface Props {
  initialConfigs: Record<string, string>
  initialTemplates: TemplateIngresso[]
  initialShows: ShowGerado[]
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'geral',   label: 'Geral',   icon: <Settings className="w-4 h-4" /> },
  { key: 'sessoes', label: 'Sessões', icon: <Calendar className="w-4 h-4" /> },
  { key: 'setores', label: 'Setores', icon: <Armchair className="w-4 h-4" /> },
]

export default function ConfiguracoesTabs({ initialConfigs, initialTemplates, initialShows }: Props) {
  const [tab, setTab] = useState<Tab>('geral')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 text-sm mt-0.5">Geral, sessões e setores de ingresso</p>
      </div>

      {/* Outer tab bar */}
      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-2xl p-1.5 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-pink-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'geral'   && <ConfiguracoesClient initialConfigs={initialConfigs} initialTemplates={initialTemplates} initialShows={initialShows} />}
      {tab === 'sessoes' && <EventosContent />}
      {tab === 'setores' && <SetoresContent />}
    </div>
  )
}
