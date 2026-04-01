import AdminSidebar from './components/AdminSidebar';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <AdminSidebar />
      <div className="ml-64 flex-1 flex flex-col">
        {/* The children inside here will be the active page (Dashboard, etc) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
