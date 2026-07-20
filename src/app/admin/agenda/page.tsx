import Link from 'next/link';
import type { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { updateSchedule, markPublished, publishDueNow, autoScheduleQueue } from '@/actions/jobs';
import { StatusBadge } from '@/components/StatusBadge';
import { CopyButton } from '@/components/CopyButton';
import { jobArtUrl, toDatetimeLocalBRT } from '@/lib/publishing';
import { generateGroupMessage } from '@/lib/whatsappGroups';
import { formatDate, NICHE_LABELS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Agenda — Admin CityJobs SP' };

// Fila de publicação: vagas pagas/aprovadas ainda não publicadas.
const QUEUE_STATUSES: JobStatus[] = ['PAID', 'IN_REVIEW', 'APPROVED'];

export default async function AdminAgendaPage() {
  const jobs = await prisma.jobPost.findMany({
    where: { status: { in: QUEUE_STATUSES } },
    include: { assets: true },
    orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'asc' }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Central de publicação</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Vagas aprovadas com credenciais da região configuradas são publicadas
            automaticamente no horário agendado. As demais ficam aqui com arte + copy prontos pra
            publicação manual. Picos: 8h, 12h e 18h.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={autoScheduleQueue}>
            <button type="submit" className="btn-secondary text-sm">
              📅 Agendar fila nos picos
            </button>
          </form>
          <form action={publishDueNow}>
            <button type="submit" className="btn-primary text-sm">
              ⚡ Publicar agendados agora
            </button>
          </form>
        </div>
      </div>

      {jobs.length === 0 ? (
        <p className="mt-8 text-gray-500">Nenhuma vaga na fila. 🎉</p>
      ) : (
        <div className="mt-6 space-y-5">
          {jobs.map((job) => {
            const artUrl = jobArtUrl(job, job.assets);
            const groupShare = generateGroupMessage(job);
            return (
              <div key={job.id} className="card flex flex-col gap-4 sm:flex-row">
                {/* Arte */}
                <a
                  href={artUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <img
                    src={artUrl}
                    alt="Arte da vaga"
                    className="w-full rounded-lg border border-gray-200 sm:w-[130px]"
                  />
                  <span className="mt-1 block text-center text-xs text-brand-700">
                    Abrir / baixar
                  </span>
                </a>

                {/* Conteúdo */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="font-bold text-brand-700 hover:underline"
                      >
                        {job.roleTitle}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {job.companyName} · {NICHE_LABELS[job.niche]} · {job.selectedPlanDays}{' '}
                        {job.selectedPlanDays === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  {/* Copy */}
                  {job.storyCopy && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Copy do story</span>
                        <CopyButton text={job.storyCopy} />
                      </div>
                      <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-sans text-xs leading-relaxed text-gray-700">
                        {job.storyCopy}
                      </pre>
                    </div>
                  )}

                  {/* WhatsApp: grupo certo + mensagem pronta */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        WhatsApp → <span className="text-green-700">{groupShare.group.name}</span>
                      </span>
                      <CopyButton text={groupShare.message} label="Copiar p/ grupo" />
                    </div>
                    <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-green-50 p-3 font-sans text-xs leading-relaxed text-gray-700">
                      {groupShare.message}
                    </pre>
                  </div>

                  {/* Agenda + publicar */}
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <form action={updateSchedule} className="flex items-end gap-2">
                      <input type="hidden" name="jobId" value={job.id} />
                      <div>
                        <label className="label text-xs">Agendar para</label>
                        <input
                          type="datetime-local"
                          name="scheduledFor"
                          defaultValue={toDatetimeLocalBRT(job.scheduledFor)}
                          className="input py-1.5 text-sm"
                        />
                      </div>
                      <button type="submit" className="btn-secondary text-xs">
                        Salvar horário
                      </button>
                    </form>

                    <form action={markPublished}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <button type="submit" className="btn-primary text-sm">
                        ✓ Marcar como publicada
                      </button>
                    </form>
                  </div>
                  {job.scheduledFor && (
                    <p className="mt-2 text-xs text-gray-500">
                      Sugerido: {formatDate(job.scheduledFor)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
