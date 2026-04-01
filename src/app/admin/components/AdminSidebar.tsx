import Link from 'next/link';
import { Home, Users, Tent, Ticket, Megaphone, Settings } from 'lucide-react';

export default function AdminSidebar() {
  const links = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Leads', href: '/admin/leads', icon: Users },
    { name: 'Eventos', href: '/admin/eventos', icon: Tent },
    { name: 'Ingressos', href: '/admin/ingressos', icon: Ticket },
    { name: 'Remarketing', href: '/admin/remarketing', icon: Megaphone },
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
      <div className="p-6 border-t border-slate-800 text-sm flex items-center text-slate-500 cursor-pointer hover:text-white transition-colors">
        <Settings className="w-4 h-4 mr-2" />
        Configurações
      </div>
    </div>
  );
}
