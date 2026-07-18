import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { updateJobStatus, updateModerationNotes } from '@/actions/jobs';
import { StatusBadge } from '@/components/StatusBadge';
import { TrustFlagsPanel } from '@/components/TrustFlagsPanel';
import { EditJobForm } from '@/components/EditJobForm';
import {
  formatDate,
  formatPrice,
  NICHE_LABELS,
  CONTRACT_TYPE_LABELS,
  APPLICATION_METHOD_OPTIONS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

const ACTION_BUTTONS: { status: JobStatus; label: string; style: string }[] = [
  { status: 'PAID', label: 'Marcar como paga', style: 'bg-blue-600 hover:bg-blue-700' },
  { status: 'APPROVED', label: 'Aprovar', style: 'bg-brand-600 hover:bg-brand-700' },
  { status: 'REJECTED', label: 'Rejeitar', style: 'bg-red-600 hover:bg-red-700' },
  { status: 'PUBLISHED', label: 'Marcar como publicada', style: 'bg-violet-600 hover:bg-violet-700' },
  { status: 'ARCHIVED', label: 'Arquivar', style: 'bg-gray-500 hover:bg-gray-600' },
];

export default async function AdminJobDetail({ params }: { params: { id: string } }) {
  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    include: { assets: true },
  });
  if (!job) notFound();

  const methodLabel =
    APPLICATION_METHOD_OPTIONS.find((m) => m.value === job.applicationMethod)?.label ??
    job.applicationMethod;

  const brief = (job.designBrief ?? null) as
    | { useLogo?: boolean; style?: string | null; colors?: string | null; notes?: string | null }
    | null;
  const artAsset = job.assets.find((a) => a.kind === 'ART');
  const logoAsset = job.assets.find((a) => a.kind === 'LOGO');

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm text-brand-700 hover:underline">
        ← Voltar ao painel
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{job.roleTitle}</h1>
          <p className="text-gray-600">{job.companyName}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Job info */}
      <div className="card mt-6">
        <h2 className="font-bold">Informações da vaga</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Criada em</dt>
            <dd className="font-medium">{formatDate(job.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">CNPJ</dt>
            <dd className="font-medium">{job.cnpj || '—'}</dd>
          </div>
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
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Benefícios</dt>
            <dd className="font-medium">{job.benefits || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Candidatura</dt>
            <dd className="font-medium">{methodLabel}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Contato da candidatura</dt>
            <dd className="font-medium">
              {job.applicationWhatsapp || job.applicationLink || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Plano</dt>
            <dd className="font-medium">
              {job.selectedPlanDays} {job.selectedPlanDays === 1 ? 'dia' : 'dias'} —{' '}
              {formatPrice(job.priceInCents)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Link de pagamento</dt>
            <dd>
              <a
                href={job.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-700 hover:underline"
              >
                Abrir link
              </a>
            </dd>
          </div>
        </dl>
      </div>

      {/* Story copy */}
      <div className="card mt-4">
        <h2 className="font-bold">Story copy gerada</h2>
        {job.storyCopy ? (
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-900 p-4 font-sans text-sm leading-relaxed text-gray-100">
            {job.storyCopy}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Nenhuma copy gerada.</p>
        )}
      </div>

      {/* Arte do Story (escolha do cliente) */}
      <div className="card mt-4">
        <h2 className="font-bold">Arte do Story</h2>
        {job.artMode === 'WE_CREATE' ? (
          <div className="mt-3 space-y-3 text-sm">
            <p>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                CityJobs cria a arte
              </span>{' '}
              <span className="text-gray-600">
                {job.artDesignCount} arte{job.artDesignCount === 1 ? '' : 's'} —{' '}
                {formatPrice(job.artPriceInCents)}
              </span>
            </p>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="font-semibold">Briefing de design</p>
              <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Usar logo</dt>
                  <dd>{brief?.useLogo ? 'Sim' : 'Não'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Estilo</dt>
                  <dd>{brief?.style || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Cores</dt>
                  <dd>{brief?.colors || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Observações</dt>
                  <dd>{brief?.notes || '—'}</dd>
                </div>
              </dl>
              {logoAsset && (
                <div className="mt-3">
                  <p className="text-gray-500">Logo enviado:</p>
                  <img
                    src={`/api/assets/${logoAsset.id}`}
                    alt="Logo do cliente"
                    className="mt-1 max-h-32 rounded border border-gray-200 bg-white p-2"
                  />
                </div>
              )}
            </div>
          </div>
        ) : job.artMode === 'SELF_UPLOAD' ? (
          <div className="mt-3 text-sm">
            <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
              Cliente enviou a arte
            </span>
            {artAsset ? (
              <a href={`/api/assets/${artAsset.id}`} target="_blank" rel="noopener noreferrer">
                <img
                  src={`/api/assets/${artAsset.id}`}
                  alt="Arte enviada pelo cliente"
                  className="mt-3 w-full max-w-[320px] rounded-lg border border-gray-200"
                />
              </a>
            ) : (
              <p className="mt-2 text-gray-500">Nenhuma arte anexada.</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Não informado.</p>
        )}

        <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
          Plano {formatPrice(job.planPriceInCents)} + Arte {formatPrice(job.artPriceInCents)} ={' '}
          <span className="font-semibold text-gray-700">Total {formatPrice(job.priceInCents)}</span>
        </p>
      </div>

      {/* Trust analysis */}
      <div className="mt-4">
        <TrustFlagsPanel trustFlags={job.trustFlags} />
      </div>

      {/* Story art preview */}
      <div className="card mt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Arte do Story (preview)</h2>
          <a
            href={`/api/story-art/${job.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-700 hover:underline"
          >
            Abrir imagem
          </a>
        </div>
        <img
          src={`/api/story-art/${job.id}`}
          alt="Preview da arte do story"
          className="mt-3 w-full max-w-[320px] rounded-lg border border-gray-200"
        />
      </div>

      {/* Actions */}
      <div className="card mt-4">
        <h2 className="font-bold">Ações</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTION_BUTTONS.map((action) => (
            <form key={action.status} action={updateJobStatus}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="status" value={action.status} />
              <button
                type="submit"
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${action.style}`}
                disabled={job.status === action.status}
              >
                {action.label}
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Moderation notes */}
      <form action={updateModerationNotes} className="card mt-4">
        <h2 className="font-bold">Notas de moderação</h2>
        <input type="hidden" name="jobId" value={job.id} />
        <textarea
          name="moderationNotes"
          rows={4}
          className="input mt-3"
          defaultValue={job.moderationNotes ?? ''}
          placeholder="Observações internas sobre a validação desta vaga…"
        />
        <button type="submit" className="btn-primary mt-3">
          Salvar notas
        </button>
      </form>

      {/* Edit job fields */}
      <div className="mt-4">
        <EditJobForm job={job} />
      </div>
    </div>
  );
}
