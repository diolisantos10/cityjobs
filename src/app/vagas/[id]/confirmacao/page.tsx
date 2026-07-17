import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/StatusBadge';
import {
  formatPrice,
  NICHE_LABELS,
  CONTRACT_TYPE_LABELS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Confirmação — CityJobs SP',
};

export default async function ConfirmacaoPage({ params }: { params: { id: string } }) {
  const job = await prisma.jobPost.findUnique({ where: { id: params.id } });
  if (!job) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <div className="text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Vaga recebida!</h1>
        <p className="mt-2 text-gray-600">
          Agora finalize o pagamento do plano para a vaga entrar na fila de validação.
        </p>
      </div>

      {/* Summary */}
      <div className="card mt-8 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{job.roleTitle}</h2>
            <p className="text-sm text-gray-600">{job.companyName}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-sm">
          <div>
            <dt className="text-gray-500">Nicho</dt>
            <dd className="font-medium">{NICHE_LABELS[job.niche]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Contrato</dt>
            <dd className="font-medium">{CONTRACT_TYPE_LABELS[job.contractType]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Local</dt>
            <dd className="font-medium">
              {job.neighborhood} – {job.city}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Salário</dt>
            <dd className="font-medium">{job.salary}</dd>
          </div>
        </dl>
      </div>

      {/* Plan + payment */}
      <div className="card mt-4 border-brand-100 bg-brand-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-800/80">Plano selecionado</p>
            <p className="text-lg font-bold text-brand-800">
              {job.selectedPlanDays} {job.selectedPlanDays === 1 ? 'dia' : 'dias'}
            </p>
          </div>
          <p className="text-2xl font-extrabold text-brand-700">{formatPrice(job.priceInCents)}</p>
        </div>

        <a href={`/vagas/${job.id}/pagamento`} className="btn-primary mt-4 w-full py-3 text-base">
          Pagar com cartão ou PIX
        </a>

        <p className="mt-3 text-center text-xs text-brand-800/70">
          Status: Aguardando pagamento. Após a confirmação, a vaga entra em validação e será
          publicada nos stories do CityJobs SP.
        </p>
      </div>

      <div className="mt-6 text-center">
        <a href={`/vagas/${job.id}`} className="btn-secondary">
          Acompanhar status da vaga
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        Guarde este link para acompanhar sua vaga. Em caso de dúvida, fale com a gente pelo
        Instagram @cityjobs.sp.
      </p>
    </div>
  );
}
