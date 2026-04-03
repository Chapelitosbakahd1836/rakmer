import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buscarConfigs, buscarTemplates, buscarShowsGerados } from '@/app/actions/configuracoes'
import ConfiguracoesClient from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [configs, templates, shows] = await Promise.all([
    buscarConfigs(),
    buscarTemplates(),
    buscarShowsGerados(),
  ])

  return (
    <ConfiguracoesClient
      initialConfigs={configs}
      initialTemplates={templates}
      initialShows={shows}
    />
  )
}
