import { prisma } from './prisma';
import { nextPeakSlot } from './publishing';

/**
 * Applies a Mercado Pago payment outcome to a JobPost.
 *
 * - approved  → status PAID (enters moderation queue), paidAt stamped
 * - rejected  → stays AWAITING_PAYMENT (so the employer can retry), status recorded
 * - pending / in_process (typical for PIX before the customer pays) → stays
 *   AWAITING_PAYMENT until the webhook confirms.
 *
 * Never downgrades a job that already moved past payment (idempotent + safe to
 * call from both the process route and the webhook).
 */
export async function applyPaymentToJob(params: {
  jobId: string;
  mpPaymentId: string;
  status: string;
  statusDetail: string;
}): Promise<void> {
  const job = await prisma.jobPost.findUnique({ where: { id: params.jobId } });
  if (!job) return;

  const approved = params.status === 'approved';

  // Don't move a job backwards once it's paid or already in the pipeline.
  const alreadyProcessed = ['PAID', 'IN_REVIEW', 'APPROVED', 'PUBLISHED'].includes(job.status);

  // Auto-aprova apenas vagas bem limpas (risco <= 1, ex: só "sem CNPJ") →
  // publicação automática. Qualquer sinal de risco (warning/high) fica em PAID
  // para revisão humana — proteção da marca no lançamento. Limiar ajustável.
  const riskScore = (job.trustFlags as { score?: number } | null)?.score ?? 0;
  const newStatus = riskScore <= 1 ? 'APPROVED' : 'PAID';

  await prisma.jobPost.update({
    where: { id: params.jobId },
    data: {
      mpPaymentId: params.mpPaymentId,
      mpStatus: params.status,
      mpStatusDetail: params.statusDetail,
      ...(approved && !alreadyProcessed
        ? {
            status: newStatus,
            paidAt: new Date(),
            // Sugere um horário de pico assim que o pagamento entra.
            ...(job.scheduledFor ? {} : { scheduledFor: nextPeakSlot() }),
          }
        : {}),
    },
  });
}
