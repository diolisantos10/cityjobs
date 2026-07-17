import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { mpConfigured, createPayment } from '@/lib/mercadopago';
import { applyPaymentToJob } from '@/lib/paymentSync';
import { checkRateLimit } from '@/lib/rateLimit';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Shape of the Bricks onSubmit formData we rely on.
const bodySchema = z.object({
  jobId: z.string().min(1),
  formData: z.object({
    token: z.string().optional(),
    payment_method_id: z.string().min(1),
    issuer_id: z.union([z.string(), z.number()]).optional(),
    installments: z.number().optional(),
    payer: z.object({
      email: z.string().email(),
      identification: z
        .object({ type: z.string(), number: z.string() })
        .partial()
        .optional(),
    }),
  }),
});

export async function POST(req: Request) {
  if (!mpConfigured()) {
    return NextResponse.json(
      { error: 'Pagamento indisponível no momento. Tente novamente mais tarde.' },
      { status: 503 }
    );
  }

  if (!checkRateLimit('payment')) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um instante.' }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados de pagamento inválidos.' }, { status: 422 });
  }
  const { jobId, formData } = parsed.data;

  const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 });
  }
  if (job.status !== 'AWAITING_PAYMENT') {
    // Already paid/processed — surface the current state instead of charging again.
    return NextResponse.json({ status: job.mpStatus ?? 'approved', alreadyProcessed: true });
  }

  const identification =
    formData.payer.identification?.type && formData.payer.identification?.number
      ? { type: formData.payer.identification.type, number: formData.payer.identification.number }
      : undefined;

  try {
    const result = await createPayment(
      {
        jobId,
        amountReais: job.priceInCents / 100,
        description: `CityJobs — ${job.roleTitle} (${job.selectedPlanDays} ${
          job.selectedPlanDays === 1 ? 'dia' : 'dias'
        })`,
        payerEmail: formData.payer.email,
        token: formData.token,
        paymentMethodId: formData.payment_method_id,
        installments: formData.installments,
        issuerId: formData.issuer_id != null ? String(formData.issuer_id) : undefined,
        identification,
      },
      // Idempotency: one in-flight charge per job.
      `job-${jobId}`
    );

    await applyPaymentToJob({
      jobId,
      mpPaymentId: result.id,
      status: result.status,
      statusDetail: result.statusDetail,
    });

    return NextResponse.json({
      status: result.status,
      statusDetail: result.statusDetail,
      pix: result.pix ?? null,
      jobId,
    });
  } catch (err) {
    logger.error('[payments/process] falha ao criar pagamento', err);
    return NextResponse.json(
      { error: 'Não foi possível processar o pagamento. Verifique os dados e tente novamente.' },
      { status: 502 }
    );
  }
}
