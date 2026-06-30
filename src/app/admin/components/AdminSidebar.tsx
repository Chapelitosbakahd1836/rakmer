import Link from 'next/link';
import { Home, Users, Calendar, Ticket, Megaphone, Settings, LayoutGrid } from 'lucide-react';
import LogoutButton from './LogoutButton';

export default function AdminSidebar() {
  const links = [
    { name: 'Dashboard',      href: '/admin',                  icon: Home },
    { name: 'Sessões',        href: '/admin/eventos',          icon: Calendar },
    { name: 'Leads',          href: '/admin/leads',            icon: LayoutGrid },
    { name: 'Clientes',       href: '/admin/clientes',         icon: Users },
    { name: 'Ingressos',      href: '/admin/ingressos',        icon: Ticket },
    { name: 'Remarketing',    href: '/admin/remarketing',      icon: Megaphone },
    { name: 'Configurações',  href: '/admin/configuracoes',    icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col min-h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="h-16 flex flex-col justify-center px-6 border-b border-slate-800 font-bold text-xl uppercase tracking-wider text-rose-500">
        Admin Panel
      </div>
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group"
            >
              <Icon className="w-5 h-5 mr-3 text-slate-500 group-hover:text-rose-400" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <LogoutButton />
    </div>
  );
}
