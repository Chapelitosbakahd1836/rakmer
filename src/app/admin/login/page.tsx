'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tent } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
              <Tent className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Login</h1>
            <p className="text-slate-400 mt-2 text-sm">Acesso restrito à equipe Rakmer</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                placeholder="admin@rakmer.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 disabled:text-rose-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
