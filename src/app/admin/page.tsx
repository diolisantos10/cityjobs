import Link from 'next/link';
import type { JobStatus, Niche, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/StatusBadge';
import {
  formatDate,
  formatPrice,
  NICHE_LABELS,
  NICHE_OPTIONS,
  STATUS_LABELS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

const STATUS_VALUES = Object.keys(STATUS_LABELS) as JobStatus[];
const NICHE_VALUES = NICHE_OPTIONS.map((n) => n.value);

interface SearchParams {
  status?: string;
  niche?: string;
  city?: string;
}

export default async function AdminDashboard({ searchParams }: { searchParams: SearchParams }) {
  const where: Prisma.JobPostWhereInput = {};
  if (searchParams.status && STATUS_VALUES.includes(searchParams.status as JobStatus)) {
    where.status = searchParams.status as JobStatus;
  }
  if (searchParams.niche && NICHE_VALUES.includes(searchParams.niche as Niche)) {
    where.niche = searchParams.niche as Niche;
  }
  if (searchParams.city) {
    where.city = { contains: searchParams.city, mode: 'insensitive' };
  }

  const [jobs, total, awaitingPayment, paid, approved, published] = await Promise.all([
    prisma.jobPost.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.jobPost.count(),
    prisma.jobPost.count({ where: { status: 'AWAITING_PAYMENT' } }),
    prisma.jobPost.count({ where: { status: 'PAID' } }),
    prisma.jobPost.count({ where: { status: 'APPROVED' } }),
    prisma.jobPost.count({ where: { status: 'PUBLISHED' } }),
  ]);

  const kpis = [
    { label: 'Total de vagas', value: total },
    { label: 'Aguardando pagamento', value: awaitingPayment },
    { label: 'Pagas', value: paid },
    { label: 'Aprovadas', value: approved },
    { label: 'Publicadas', value: published },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Painel de vagas</h1>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card py-4 text-center">
            <p className="text-2xl font-extrabold text-brand-700">{kpi.value}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="get" className="card mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" className="input w-44" defaultValue={searchParams.status ?? ''}>
            <option value="">Todos</option>
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="niche" className="label">
            Nicho
          </label>
          <select id="niche" name="niche" className="input w-40" defaultValue={searchParams.niche ?? ''}>
            <option value="">Todos</option>
            {NICHE_OPTIONS.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="label">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            className="input w-40"
            placeholder="Mogi das Cruzes"
            defaultValue={searchParams.city ?? ''}
          />
        </div>
        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          Limpar
        </Link>
      </form>

      {/* Table */}
      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Criada</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Bairro</th>
              <th className="px-4 py-3">Nicho</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma vaga encontrada.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {formatDate(job.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium">{job.companyName}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/jobs/${job.id}`} className="font-medium text-brand-700 hover:underline">
                    {job.roleTitle}
                  </Link>
                </td>
                <td className="px-4 py-3">{job.neighborhood}</td>
                <td className="px-4 py-3">{NICHE_LABELS[job.niche]}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {job.selectedPlanDays} {job.selectedPlanDays === 1 ? 'dia' : 'dias'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatPrice(job.priceInCents)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3">
                  <a
                    href={job.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-700 hover:underline"
                  >
                    Link
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
