import KpiWidget from './components/KpiWidget';
import FunnelWidget from './components/FunnelWidget';
import OriginPieWidget from './components/OriginPieWidget';
import SalesChartWidget from './components/SalesChartWidget';
import UpcomingShowsWidget from './components/UpcomingShowsWidget';
import LiveSalesWidget from './components/LiveSalesWidget';
import AlertsWidget from './components/AlertsWidget';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const adminName = user.email || "Admin"; // No futuro pode vir do auth

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Boa tarde, {adminName}!
        </h1>
        <p className="text-slate-500 mt-1">Aqui está o resumo do Circo de hoje.</p>
      </header>

      {/* 4 Cards de KPI */}
      <KpiWidget />

      {/* Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Funil - Ocupa 2 colunas na grid grande */}
        <div className="xl:col-span-2">
          <FunnelWidget />
        </div>
        
        {/* Origem */}
        <div className="xl:col-span-1">
          <OriginPieWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de Vendas 30d */}
        <div className="xl:col-span-2">
          <SalesChartWidget />
        </div>
        
        {/* Alertas */}
        <div className="xl:col-span-1">
          <AlertsWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Próximos Espetáculos */}
        <UpcomingShowsWidget />
        
        {/* Vendas Ao Vivo */}
        <LiveSalesWidget />
      </div>
    </div>
  );
}
