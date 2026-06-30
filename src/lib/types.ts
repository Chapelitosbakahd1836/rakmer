export interface Evento {
  id: string
  slug: string
  nome: string
  data_hora: string
  cidade: string
  preco_minimo: number
  imagem_url: string | null
  lugares_disponiveis: number
  lugares_total: number
  status: string
}
