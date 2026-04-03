import { createClient } from '@supabase/supabase-js'
import HomeClient from '@/components/HomeClient'

async function getCidade(): Promise<string> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await db
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'cidade')
      .single()
    return data?.valor || process.env.NEXT_PUBLIC_CIDADE || 'Pompéia-SP'
  } catch {
    return process.env.NEXT_PUBLIC_CIDADE || 'Pompéia-SP'
  }
}

export default async function HomePage() {
  const cidade = await getCidade()
  return <HomeClient cidade={cidade} />
}
