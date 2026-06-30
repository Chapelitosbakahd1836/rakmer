'use client';

import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left p-6 border-t border-slate-800 text-sm flex items-center text-slate-500 hover:text-rose-400 transition-colors"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sair do Sistema
    </button>
  );
}
