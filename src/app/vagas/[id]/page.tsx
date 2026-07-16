import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/StatusBadge';
import {
  formatDate,
  formatPrice,
  NICHE_LABELS,
  CONTRACT_TYPE_LABELS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Status da vaga — CityJobs SP',
};

// Plain-language explanation of each status for the employer.
const STATUS_EXPLANATION: Record<JobStatus, string> = {
  DRAFT: 'Sua vaga foi salva como rascunho.',
  AWAITING_PAYMENT: 'Estamos aguardando a confirmação do pagamento para iniciar a validação.',
  PAID: 'Pagamento recebido! Sua vaga entrou na fila de validação.',
  IN_REVIEW: 'Nossa equipe está validando as informações da vaga.',
  APPROVED: 'Vaga aprovada! Será publicada nos stories do CityJobs SP em breve.',
  REJECTED: 'Esta vaga não passou na validação. Veja as observações ou fale com a gente.',
  PUBLISHED: 'Sua vaga está publicada nos stories do CityJobs SP. 🎉',
  ARCHIVED: 'Esta vaga foi arquivada.',
};

export default async function JobStatusPage({ params }: { params: { id: string } }) {
  const job = await prisma.jobPost.findUnique({ where: { id: params.id } });
  if (!job) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Status da sua vaga</h1>
      <p className="mt-1 text-sm text-gray-500">
        Guarde este link para acompanhar sua vaga a qualquer momento.
      </p>

      {/* Status */}
      <div className="card mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{job.roleTitle}</h2>
            <p className="text-sm text-gray-600">{job.companyName}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          {STATUS_EXPLANATION[job.status]}
        </p>
        {job.status === 'REJECTED' && job.moderationNotes && (
          <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <span className="font-semibold">Observações: </span>
            {job.moderationNotes}
          </p>
        )}
      </div>

      {/* Payment reminder while awaiting */}
      {job.status === 'AWAITING_PAYMENT' && (
        <div className="card mt-4 border-brand-100 bg-brand-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-800/80">
                Plano de {job.selectedPlanDays} {job.selectedPlanDays === 1 ? 'dia' : 'dias'}
              </p>
              <p className="text-lg font-bold text-brand-800">{formatPrice(job.priceInCents)}</p>
            </div>
            <a
              href={job.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Pagar agora
            </a>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="card mt-4">
        <h2 className="font-bold">Resumo</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Enviada em</dt>
            <dd className="font-medium">{formatDate(job.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Nicho</dt>
            <dd className="font-medium">{NICHE_LABELS[job.niche]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Local</dt>
            <dd className="font-medium">
              {job.neighborhood} – {job.city}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Contrato</dt>
            <dd className="font-medium">{CONTRACT_TYPE_LABELS[job.contractType]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Salário</dt>
            <dd className="font-medium">{job.salary}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 text-center">
        <Link href="/anunciar" className="text-sm text-brand-700 hover:underline">
          Anunciar outra vaga
        </Link>
      </div>
    </div>
  );
}
