// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Função para retornar a meia noite local de hoje
const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    // Calcular as barras do funil
    let dadosPreenchidos = 0;
    let dataEscolhida = 0;
    let lugarEscolhido = 0;
    let checkoutIniciado = 0;

    leadsHojeData?.forEach(lead => {
      // Step 1 ou superior = Dados preenchidos (já inseriu Lead Base)
      if (lead.funil_step >= 1) dadosPreenchidos++;
      if (lead.funil_step >= 2) dataEscolhida++;
      if (lead.funil_step >= 3) lugarEscolhido++;
      if (lead.stripe_session_id) checkoutIniciado++;
    });

    // 3. Ingressos Hoje
    const { data: ingressosHoje } = await supabase
      .from('ingressos')
      .select('id, preco_pago, status')
      .gte('created_at', startOfToday)
      .eq('status', 'confirmado');
      
    const comprasHoje = ingressosHoje?.length || 0;
    const receitaHoje = ingressosHoje?.reduce((acc, current) => acc + (Number(current.preco_pago) || 0), 0) || 0;

    // Calcular receita de ontem para o "(+X% vs ontem)"
    const startOfYesterday = new Date(new Date(startOfToday).getTime() - 24 * 60 * 60 * 1000).toISOString();
    const endOfYesterday = startOfToday;
    const { data: ingressosOntem } = await supabase
      .from('ingressos')
      .select('preco_pago')
      .gte('created_at', startOfYesterday)
      .lt('created_at', endOfYesterday)
      .eq('status', 'confirmado');
    const receitaOntem = ingressosOntem?.reduce((acc, curr) => acc + (Number(curr.preco_pago) || 0), 0) || 0;
    let perceReceita = 0;
    if (receitaOntem === 0) {
      perceReceita = receitaHoje > 0 ? 100 : 0;
    } else {
      perceReceita = ((receitaHoje - receitaOntem) / receitaOntem) * 100;
    }

    // 4. Atendimentos WhatsApp Hoje
    const { count: whatsappsHoje } = await supabase
      .from('atividades_cliente')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday)
      .ilike('tipo', '%whatsapp%');

    // 5. Origem dos Clientes (Pizza) - Utiliza todos os leads para compor algo significativo ou últimos 30 dias
    const { data: utmData } = await supabase
      .from('leads')
      .select('utm_source');
      
    const originMap: Record<string, number> = {};
    utmData?.forEach(row => {
      let source = row.utm_source ? row.utm_source.trim().toLowerCase() : 'organico';
      if (!source || source === 'null') source = 'organico';
      originMap[source] = (originMap[source] || 0) + 1;
    });

    const originPieData = Object.entries(originMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // 6. Vendas por Dia (Últimos 30 dias)
    const { data: ingressos30d } = await supabase
      .from('ingressos')
      .select('created_at')
      .gte('created_at', startOf30DaysAgo)
      .eq('status', 'confirmado');

    const salesByDayMap: Record<string, number> = {};
    ingressos30d?.forEach(ing => {
      const dateStr = ing.created_at.split('T')[0]; // YYYY-MM-DD
      salesByDayMap[dateStr] = (salesByDayMap[dateStr] || 0) + 1;
    });
    // Fill missing days
    const salesChartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      salesChartData.push({ date: str, vendas: salesByDayMap[str] || 0 });
    }

    // 7. Próximos 5 espetáculos
    const { data: espetaculos } = await supabase
      .from('espetaculos')
      .select(`
        id, nome, data_hora, lugares_total, lugares_disponiveis, status,
        evento: eventos (nome)
      `)
      .gt('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true })
      .limit(5);

    // 8. Alertas
    // a. Leads > 2h sem follow up
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { count: leadsAtrasados } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'finalizada') // assumindo status finalizado
      .lt('created_at', twoHoursAgo)
      .or(`ultimo_followup_at.is.null,ultimo_followup_at.lt.${twoHoursAgo}`);
      
    // b. Espetáculos Críticos (<30%)
    const criticosCount = espetaculos?.filter(
      (e: any) => e.lugares_disponiveis > 0 && e.lugares_total > 0 && (e.lugares_disponiveis / e.lugares_total) > 0.7 
      // disponíveis > 70% significa ocupados < 30%. Espera, a formula é ocupação:
      // ocupação = (total - disponíveis) / total
      // se ocupacao < 30%, (total - disp) / total < 0.3 => disp / total > 0.7
    ).length || 0;

    // Return the compound dashboard state
    return NextResponse.json({
      funnel: {
        visitantes: visitantes || 0,
        dadosPreenchidos,
        dataEscolhida,
        lugarEscolhido,
        checkoutIniciado,
        compras: comprasHoje
      },
      kpis: {
        receita: receitaHoje,
        perceReceita,
        ingressos: comprasHoje,
        leads: leadsCount,
        whatsapps: whatsappsHoje || 0
      },
      pie: originPieData,
      salesLine: salesChartData,
      espetaculos: espetaculos || [],
      alerts: {
        leadsAtrasados: leadsAtrasados || 0,
        criiticos: criticosCount,
        vipInativos: 0 // Placeholder para complexidade de VIP Inativos sem RPC
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
