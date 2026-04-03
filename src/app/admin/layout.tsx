import AdminLayoutShell from './components/AdminLayoutShell'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
