import { MercadoPagoConfig, Payment } from 'mercadopago';

/**
 * Mercado Pago (Checkout Transparente / Bricks) server integration.
 *
 * Credentials come from the environment — they live in the user's Mercado Pago
 * account and are never committed:
 *   MERCADOPAGO_ACCESS_TOKEN          (backend, secret)
 *   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY (frontend, public)
 *
 * When the access token is absent the app degrades gracefully: the payment
 * screen shows a "configure credentials" notice instead of crashing.
 */

export function mpConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

export function mpPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || null;
}

function client(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  return new MercadoPagoConfig({ accessToken });
}

export interface CreatePaymentInput {
  jobId: string;
  amountReais: number; // transaction_amount is in the account currency (BRL), NOT cents
  description: string;
  payerEmail: string;
  // From the Bricks onSubmit formData:
  token?: string;
  paymentMethodId: string; // e.g. "master", "visa", "pix"
  installments?: number;
  issuerId?: string;
  identification?: { type: string; number: string };
}

export interface CreatePaymentResult {
  id: string;
  status: string; // approved | pending | in_process | rejected
  statusDetail: string;
  // For PIX: the QR code payload + base64 image to render inline.
  pix?: {
    qrCode: string | null;
    qrCodeBase64: string | null;
    ticketUrl: string | null;
  };
}

/**
 * Idempotency key derived from the job so retries for the same job don't
 * double-charge. A caller passing a fresh attempt should vary this.
 */
export async function createPayment(
  input: CreatePaymentInput,
  idempotencyKey: string
): Promise<CreatePaymentResult> {
  const payment = new Payment(client());

  const body: Record<string, unknown> = {
    transaction_amount: Number(input.amountReais.toFixed(2)),
    description: input.description,
    payment_method_id: input.paymentMethodId,
    external_reference: input.jobId,
    notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || undefined,
    payer: {
      email: input.payerEmail,
      ...(input.identification ? { identification: input.identification } : {}),
    },
  };

  // Card payments carry a tokenized card + installments; PIX does not.
  if (input.token) body.token = input.token;
  if (input.installments) body.installments = input.installments;
  if (input.issuerId) body.issuer_id = input.issuerId;

  const res = await payment.create({
    body,
    requestOptions: { idempotencyKey },
  });

  const tx = res.point_of_interaction?.transaction_data;

  return {
    id: String(res.id),
    status: res.status ?? 'unknown',
    statusDetail: res.status_detail ?? '',
    pix: tx
      ? {
          qrCode: tx.qr_code ?? null,
          qrCodeBase64: tx.qr_code_base64 ?? null,
          ticketUrl: tx.ticket_url ?? null,
        }
      : undefined,
  };
}

export async function getPayment(id: string): Promise<{ status: string; statusDetail: string; externalReference: string | null }> {
  const payment = new Payment(client());
  const res = await payment.get({ id });
  return {
    status: res.status ?? 'unknown',
    statusDetail: res.status_detail ?? '',
    externalReference: res.external_reference ?? null,
  };
}
