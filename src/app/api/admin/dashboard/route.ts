// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const startOfToday = getStartOfToday();
  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const startOf30DaysAgo = thirtyDaysAgoDate.toISOString();

  try {
    // 1. Visitantes Hoje (page_views)
    const { count: visitantes } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday);

    // 2. Leads Hoje
    const { data: leadsHojeData } = await supabase
      .from('leads')
      .select('id, funil_step, stripe_session_id')
      .gte('created_at', startOfToday);

    const leadsCount = leadsHojeData?.length || 0;

    // Barras do funil
    let dadosPreenchidos = 0, dataEscolhida = 0, lugarEscolhido = 0, checkoutIniciado = 0;
    leadsHojeData?.forEach(lead => {
      if (lead.funil_step >= 1) dadosPreenchidos++;
      if (lead.funil_step >= 2) dataEscolhida++;
      if (lead.funil_step >= 3) lugarEscolhido++;
      if (lead.stripe_session_id) checkoutIniciado++;
    });

    // 3. Ingressos Hoje — status 'pago' (correto conforme schema)
    const { data: ingressosHoje } = await supabase
      .from('ingressos')
      .select('id, preco_pago, status')
      .gte('created_at', startOfToday)
      .eq('status', 'pago');

    const comprasHoje = ingressosHoje?.length || 0;
    const receitaHoje = ingressosHoje?.reduce((acc, cur) => acc + (Number(cur.preco_pago) || 0), 0) || 0;

    // Receita Ontem
    const startOfYesterday = new Date(new Date(startOfToday).getTime() - 86400000).toISOString();
    const { data: ingressosOntem } = await supabase
      .from('ingressos')
      .select('preco_pago')
      .gte('created_at', startOfYesterday)
      .lt('created_at', startOfToday)
      .eq('status', 'pago');
    const receitaOntem = ingressosOntem?.reduce((acc, cur) => acc + (Number(cur.preco_pago) || 0), 0) || 0;
    let perceReceita = receitaOntem === 0 ? (receitaHoje > 0 ? 100 : 0) : ((receitaHoje - receitaOntem) / receitaOntem) * 100;

    // 4. Mensagens WhatsApp hoje — conta via atividades_cliente ou followups no leads
    const { count: whatsappsHoje } = await supabase
      .from('atividades_cliente')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday)
      .ilike('tipo', '%whatsapp%');

    // 5. Origem dos Leads (Pizza)
    const { data: utmData } = await supabase
      .from('leads')
      .select('utm_source');

    const originMap: Record<string, number> = {};
    utmData?.forEach(row => {
      let source = row.utm_source?.trim().toLowerCase() || 'organico';
      if (!source || source === 'null') source = 'organico';
      originMap[source] = (originMap[source] || 0) + 1;
    });
    const originPieData = Object.entries(originMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 6. Vendas por Dia (Últimos 30 dias)
    const { data: ingressos30d } = await supabase
      .from('ingressos')
      .select('created_at, preco_pago')
      .gte('created_at', startOf30DaysAgo)
      .eq('status', 'pago');

    const salesByDayMap: Record<string, { vendas: number; receita: number }> = {};
    ingressos30d?.forEach(ing => {
      const dateStr = ing.created_at.split('T')[0];
      if (!salesByDayMap[dateStr]) salesByDayMap[dateStr] = { vendas: 0, receita: 0 };
      salesByDayMap[dateStr].vendas++;
      salesByDayMap[dateStr].receita += Number(ing.preco_pago) || 0;
    });

    const salesChartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      salesChartData.push({
        date: str,
        vendas: salesByDayMap[str]?.vendas || 0,
        receita: salesByDayMap[str]?.receita || 0,
      });
    }

    // 7. Próximos 5 espetáculos (sem join em 'eventos', direto em espetaculos)
    const { data: espetaculos } = await supabase
      .from('espetaculos')
      .select('id, nome, data_hora, cidade, lugares_total, lugares_disponiveis, status')
      .gt('data_hora', new Date().toISOString())
      .in('status', ['publicado'])
      .order('data_hora', { ascending: true })
      .limit(5);

    // 8. Alertas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { count: leadsAtrasados } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("pago","perdido")')
      .lt('created_at', twoHoursAgo)
      .or(`ultimo_followup_at.is.null,ultimo_followup_at.lt.${twoHoursAgo}`);

    const criticosCount = espetaculos?.filter(
      (e: any) => e.lugares_total > 0 && ((e.lugares_total - e.lugares_disponiveis) / e.lugares_total) < 0.3
    ).length || 0;

    // 9. Todos os espetáculos para filtro do CRM
    const { data: todosEspetaculos } = await supabase
      .from('espetaculos')
      .select('id, nome, data_hora')
      .order('data_hora', { ascending: false })
      .limit(20);

    return NextResponse.json({
      funnel: { visitantes: visitantes || 0, dadosPreenchidos, dataEscolhida, lugarEscolhido, checkoutIniciado, compras: comprasHoje },
      kpis: { receita: receitaHoje, perceReceita, ingressos: comprasHoje, leads: leadsCount, whatsapps: whatsappsHoje || 0 },
      pie: originPieData,
      salesLine: salesChartData,
      espetaculos: espetaculos || [],
      todosEspetaculos: todosEspetaculos || [],
      alerts: { leadsAtrasados: leadsAtrasados || 0, criiticos: criticosCount, vipInativos: 0 }
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
