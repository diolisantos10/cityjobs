import { NextResponse } from 'next/server';
import { mpConfigured, getPayment } from '@/lib/mercadopago';
import { applyPaymentToJob } from '@/lib/paymentSync';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Mercado Pago webhook (IPN / Webhooks v2).
 *
 * MP notifies asynchronously — essential for PIX, where the payment is created
 * as `pending` and only becomes `approved` once the customer actually pays.
 * We look the payment up by id (never trust the payload's status blindly) and
 * sync the JobPost via its external_reference (= jobId).
 *
 * Configure the URL in the MP panel:
 *   https://<domínio>/api/payments/webhook
 */
export async function POST(req: Request) {
  if (!mpConfigured()) {
    // Acknowledge so MP doesn't retry forever while unconfigured.
    return NextResponse.json({ received: true });
  }

  let payload: any = null;
  try {
    payload = await req.json();
  } catch {
    // MP sometimes sends query-string style; fall through to URL params below.
  }

  const url = new URL(req.url);
  const type = payload?.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const paymentId =
    payload?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id');

  // We only care about payment notifications.
  if (type && !String(type).includes('payment')) {
    return NextResponse.json({ received: true, ignored: true });
  }
  if (!paymentId) {
    return NextResponse.json({ received: true, ignored: 'no payment id' });
  }

  try {
    const payment = await getPayment(String(paymentId));
    if (payment.externalReference) {
      await applyPaymentToJob({
        jobId: payment.externalReference,
        mpPaymentId: String(paymentId),
        status: payment.status,
        statusDetail: payment.statusDetail,
      });
      logger.info(`[webhook] pagamento ${paymentId} → ${payment.status} (vaga ${payment.externalReference})`);
    }
  } catch (err) {
    logger.error(`[webhook] falha ao processar pagamento ${paymentId}`, err);
    // 200 anyway: a 5xx makes MP retry; we've logged it and can reconcile later.
  }

  return NextResponse.json({ received: true });
}
