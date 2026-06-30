'use server'

import { createClient } from '@supabase/supabase-js'

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Configs gerais ───────────────────────────────────────────

export async function buscarConfigs(): Promise<Record<string, string>> {
  const db = adminDb()
  const { data } = await db.from('configuracoes').select('chave, valor')
  const result: Record<string, string> = {}
  ;(data || []).forEach((r: { chave: string; valor: string }) => {
    result[r.chave] = r.valor
  })
  return result
}

export async function salvarConfig(chave: string, valor: string): Promise<void> {
  const db = adminDb()
  await db
    .from('configuracoes')
    .upsert({ chave, valor, atualizado_em: new Date().toISOString() }, { onConflict: 'chave' })
}

export async function salvarConfigs(configs: Record<string, string>): Promise<void> {
  const db = adminDb()
  const rows = Object.entries(configs).map(([chave, valor]) => ({
    chave,
    valor,
    atualizado_em: new Date().toISOString(),
  }))
  await db.from('configuracoes').upsert(rows, { onConflict: 'chave' })
}

// ─── Templates de ingresso ────────────────────────────────────

export interface TemplateIngresso {
  id?: string
  nome: string
  preco: number
  preco_original: number | null
  descricao: string | null
  lugares_total: number
  ativo: boolean
}

export async function buscarTemplates(): Promise<TemplateIngresso[]> {
  const db = adminDb()
  const { data } = await db
    .from('templates_ingresso')
    .select('*')
    .order('criado_em', { ascending: true })
  return (data || []) as TemplateIngresso[]
}

export async function salvarTemplate(t: TemplateIngresso): Promise<string> {
  const db = adminDb()
  const payload = {
    nome: t.nome,
    preco: t.preco,
    preco_original: t.preco_original,
    descricao: t.descricao,
    lugares_total: t.lugares_total,
    ativo: t.ativo,
  }
  if (t.id) {
    await db.from('templates_ingresso').update(payload).eq('id', t.id)
    return t.id
  } else {
    const { data } = await db
      .from('templates_ingresso')
      .insert(payload)
      .select('id')
      .single()
    return data!.id
  }
}

export async function excluirTemplate(id: string): Promise<void> {
  const db = adminDb()
  await db.from('templates_ingresso').delete().eq('id', id)
}

// ─── Gerar shows ─────────────────────────────────────────────

export interface GerarShowsParams {
  dataInicio: string   // 'YYYY-MM-DD'
  dataFim: string      // 'YYYY-MM-DD'
  horariosSemana: string[]   // ['20:30']
  horariosFds: string[]      // ['18:00','20:30']
  blackoutDates: string[]    // ['2026-05-01']
}

export interface GerarShowsResult {
  criados: number
  ignorados: number
  erros: string[]
}

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function gerarShows(params: GerarShowsParams): Promise<GerarShowsResult> {
  const db = adminDb()

  // Busca configs e templates ativos
  const configs = await buscarConfigs()
  const cidade = configs['cidade'] || 'Cidade'
  const nomeEspetaculo = configs['nome_espetaculo'] || 'Espetáculo'
  const cidadeSlug = toSlug(cidade)

  const templates = await buscarTemplates()
  const templatesAtivos = templates.filter((t) => t.ativo)

  if (templatesAtivos.length === 0) {
    return { criados: 0, ignorados: 0, erros: ['Nenhum template de ingresso ativo. Crie ao menos um na aba Ingressos.'] }
  }

  const lugaresTotal = templatesAtivos.reduce((sum, t) => sum + t.lugares_total, 0)
  const precoMinimo = Math.min(...templatesAtivos.map((t) => t.preco))

  const start = new Date(params.dataInicio + 'T00:00:00')
  const end = new Date(params.dataFim + 'T00:00:00')

  if (start > end) {
    return { criados: 0, ignorados: 0, erros: ['Data de início deve ser anterior à data de fim.'] }
  }

  let criados = 0
  let ignorados = 0
  const erros: string[] = []

  const blackoutSet = new Set(params.blackoutDates.map((d) => d.trim()).filter(Boolean))

  const current = new Date(start)
  while (current <= end) {
    const dateKey = current.toISOString().slice(0, 10) // 'YYYY-MM-DD'

    if (blackoutSet.has(dateKey)) {
      current.setDate(current.getDate() + 1)
      continue
    }

    const dow = current.getDay() // 0=Dom, 6=Sab
    const isWeekend = dow === 0 || dow === 6
    const horarios = isWeekend ? params.horariosFds : params.horariosSemana

    for (const hora of horarios) {
      const [h, m] = hora.split(':').map(Number)
      const dataHora = new Date(current)
      dataHora.setHours(h, m, 0, 0)

      const slug = `${cidadeSlug}-${dateKey}-${hora.replace(':', '')}`

      // Verifica se já existe
      const { data: existing } = await db
        .from('espetaculos')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existing) {
        ignorados++
        continue
      }

      // Cria espetáculo
      const { data: espetaculo, error: espErr } = await db
        .from('espetaculos')
        .insert({
          slug,
          nome: nomeEspetaculo,
          data_hora: dataHora.toISOString(),
          cidade,
          preco_minimo: precoMinimo,
          lugares_total: lugaresTotal,
          lugares_disponiveis: lugaresTotal,
          status: 'publicado',
        })
        .select('id')
        .single()

      if (espErr || !espetaculo) {
        erros.push(`Erro ao criar show ${slug}: ${espErr?.message}`)
        continue
      }

      // Cria tipos_ingresso a partir dos templates ativos
      const tiposPayload = templatesAtivos.map((t) => ({
        espetaculo_id: espetaculo.id,
        nome: t.nome,
        preco: t.preco,
        preco_original: t.preco_original,
        descricao: t.descricao,
        lugares_total: t.lugares_total,
        lugares_disponiveis: t.lugares_total,
      }))

      const { error: tiposErr } = await db.from('tipos_ingresso').insert(tiposPayload)
      if (tiposErr) {
        erros.push(`Erro ao criar tipos para ${slug}: ${tiposErr.message}`)
      }

      criados++
    }

    current.setDate(current.getDate() + 1)
  }

  return { criados, ignorados, erros }
}

// ─── Shows gerados ────────────────────────────────────────────

export interface ShowGerado {
  id: string
  slug: string
  nome: string
  data_hora: string
  cidade: string
  lugares_total: number
  lugares_disponiveis: number
  status: string
  vendidos: number
}

export async function buscarShowsGerados(): Promise<ShowGerado[]> {
  const db = adminDb()

  // Busca espetáculos com contagem de ingressos pagos
  const { data: espetaculos } = await db
    .from('espetaculos')
    .select('id, slug, nome, data_hora, cidade, lugares_total, lugares_disponiveis, status')
    .order('data_hora', { ascending: true })

  if (!espetaculos || espetaculos.length === 0) return []

  // Busca contagem de ingressos pagos por espetáculo
  const { data: ingressosCounts } = await db
    .from('ingressos')
    .select('espetaculo_id')
    .eq('status', 'pago')

  const countMap = new Map<string, number>()
  ;(ingressosCounts || []).forEach((i: { espetaculo_id: string }) => {
    countMap.set(i.espetaculo_id, (countMap.get(i.espetaculo_id) || 0) + 1)
  })

  return espetaculos.map((e: any) => ({
    ...e,
    vendidos: countMap.get(e.id) || 0,
  }))
}

export async function cancelarEspetaculo(id: string): Promise<{ error?: string }> {
  const db = adminDb()

  // Verifica se tem ingressos pagos
  const { data: pagos } = await db
    .from('ingressos')
    .select('id')
    .eq('espetaculo_id', id)
    .eq('status', 'pago')

  if (pagos && pagos.length > 0) {
    return { error: `Este show tem ${pagos.length} ingresso(s) pago(s) e não pode ser cancelado.` }
  }

  await db
    .from('espetaculos')
    .update({ status: 'cancelado' })
    .eq('id', id)

  return {}
}

export async function publicarEspetaculo(id: string): Promise<void> {
  const db = adminDb()
  await db.from('espetaculos').update({ status: 'publicado' }).eq('id', id)
}
