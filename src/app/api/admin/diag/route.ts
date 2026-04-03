// Endpoint de diagnóstico — acesse /api/admin/diag para ver o status do banco
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const checks: Record<string, any> = {};

  // 1. Contar leads totais
  const { count: totalLeads, error: e1 } = await supabase
    .from('leads').select('*', { count: 'exact', head: true });
  checks.totalLeads = e1 ? `ERRO: ${e1.message}` : totalLeads;

  // 2. Últimos 5 leads
  const { data: recentLeads, error: e2 } = await supabase
    .from('leads')
    .select('id, nome, email, whatsapp, funil_step, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  checks.recentLeads = e2 ? `ERRO: ${e2.message}` : recentLeads;

  // 3. Verificar se coluna followup_count existe
  const { data: colCheck, error: e3 } = await supabase
    .from('leads')
    .select('followup_count')
    .limit(1);
  checks.followupColumnExists = e3 ? `ERRO: ${e3.message}` : 'OK';

  // 4. Contar ingressos
  const { count: totalIngressos, error: e4 } = await supabase
    .from('ingressos').select('*', { count: 'exact', head: true });
  checks.totalIngressos = e4 ? `ERRO: ${e4.message}` : totalIngressos;

  // 5. Contar clientes
  const { count: totalClientes, error: e5 } = await supabase
    .from('clientes').select('*', { count: 'exact', head: true });
  checks.totalClientes = e5 ? `ERRO: ${e5.message}` : totalClientes;

  // 6. Contar espetáculos
  const { count: totalEspetaculos, error: e6 } = await supabase
    .from('espetaculos').select('*', { count: 'exact', head: true });
  checks.totalEspetaculos = e6 ? `ERRO: ${e6.message}` : totalEspetaculos;

  // 7. Testar INSERT de lead de teste (e depois delete)
  const testId = '00000000-0000-4000-0000-000000000001';
  await supabase.from('leads').delete().eq('id', testId); // limpa se existir
  const { data: insertTest, error: e7 } = await supabase
    .from('leads')
    .insert({ id: testId, nome: 'TESTE_DIAG', email: 'diag@test.com', whatsapp: '(11) 99999-9999', funil_step: 1, status: 'novo' })
    .select('id')
    .single();
  checks.insertTest = e7 ? `FALHOU: ${e7.message}` : 'OK — INSERT funciona';
  if (insertTest) await supabase.from('leads').delete().eq('id', testId);

  return NextResponse.json({ 
    timestamp: new Date().toISOString(),
    checks 
  }, { headers: { 'Cache-Control': 'no-store' } });
}
