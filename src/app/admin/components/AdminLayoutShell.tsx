'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, Tent, Ticket, Megaphone, Settings, Menu, X, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ReactNode } from 'react'

const links = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Leads', href: '/admin/leads', icon: Users },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Eventos', href: '/admin/eventos', icon: Tent },
  { name: 'Ingressos', href: '/admin/ingressos', icon: Ticket },
  { name: 'Remarketing', href: '/admin/remarketing', icon: Megaphone },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
      {links.map((link) => {
        const Icon = link.icon
        const isActive = link.href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(link.href)
        return (
          <Link
            key={link.name}
            href={link.href}
            onClick={onClose}
            className={`flex items-center px-5 py-3.5 text-sm font-medium transition-colors group ${
              isActive
                ? 'bg-rose-600/20 text-white border-r-2 border-rose-500'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-500 group-hover:text-rose-400'}`} />
            <span>{link.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 flex-shrink-0">
        <span className="font-bold text-lg uppercase tracking-wider text-rose-500">🎪 Admin</span>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <NavLinks onClose={onClose} />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center px-5 py-4 text-sm text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors border-t border-slate-800 flex-shrink-0"
      >
        <LogOut className="w-4 h-4 mr-3" />
        Sair do Sistema
      </button>
    </div>
  )
}

export default function AdminLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Login page: render without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed left-0 top-0 bottom-0 border-r border-slate-800 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setDrawerOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 h-14 flex items-center gap-3 px-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-rose-500 uppercase tracking-wider text-sm">🎪 Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
