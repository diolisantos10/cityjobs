import Link from 'next/link';
import { adminConfigured, isAdmin } from '@/lib/adminAuth';
import { adminLogout } from '@/actions/admin';
import { AdminLoginForm } from '@/components/AdminLoginForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — CityJobs SP',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!adminConfigured()) {
    return (
      <div className="card mx-auto mt-12 max-w-md border-amber-200 bg-amber-50">
        <h1 className="text-lg font-bold text-amber-800">Configuração necessária</h1>
        <p className="mt-2 text-sm text-amber-800/90">
          A variável de ambiente <code className="font-mono font-semibold">ADMIN_SECRET</code> não
          está configurada. Defina-a no ambiente (Railway → Variables ou arquivo{' '}
          <code className="font-mono">.env</code>) para habilitar o painel administrativo.
        </p>
      </div>
    );
  }

  if (!isAdmin()) {
    return <AdminLoginForm />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/admin" className="text-brand-700 hover:underline">
            Vagas
          </Link>
          <Link href="/admin/plans" className="text-brand-700 hover:underline">
            Planos
          </Link>
        </nav>
        <form action={adminLogout}>
          <button type="submit" className="btn-secondary text-xs">
            Sair
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
