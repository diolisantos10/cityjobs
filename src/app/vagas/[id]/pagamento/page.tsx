import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mpConfigured, mpPublicKey } from '@/lib/mercadopago';
import { PaymentBrick } from '@/components/PaymentBrick';
import { formatPrice } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Pagamento — CityJobs SP' };

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const job = await prisma.jobPost.findUnique({ where: { id: params.id } });
  if (!job) notFound();

  // Already paid/processed — send them to the status page.
  if (job.status !== 'AWAITING_PAYMENT') {
    redirect(`/vagas/${job.id}`);
  }

  const publicKey = mpPublicKey();
  const ready = mpConfigured() && publicKey;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold tracking-tight">Pagamento</h1>
      <p className="mt-1 text-sm text-gray-600">
        {job.roleTitle} — {job.companyName}
      </p>

      <div className="card mt-4 flex items-center justify-between border-brand-100 bg-brand-50">
        <div>
          <p className="text-sm text-brand-800/80">
            Plano de {job.selectedPlanDays} {job.selectedPlanDays === 1 ? 'dia' : 'dias'}
          </p>
          <p className="text-lg font-bold text-brand-800">Pague com cartão ou PIX</p>
        </div>
        <p className="text-2xl font-extrabold text-brand-700">{formatPrice(job.priceInCents)}</p>
      </div>

      {ready ? (
        <div className="mt-6">
          <PaymentBrick
            jobId={job.id}
            amount={job.priceInCents / 100}
            publicKey={publicKey!}
          />
        </div>
      ) : (
        <div className="card mt-6 border-amber-200 bg-amber-50">
          <h2 className="font-bold text-amber-800">Pagamento em configuração</h2>
          <p className="mt-2 text-sm text-amber-800/90">
            O pagamento online ainda não está ativo. Defina as credenciais do Mercado Pago
            (<code className="font-mono">MERCADOPAGO_ACCESS_TOKEN</code> e{' '}
            <code className="font-mono">NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY</code>) para habilitar
            esta tela.
          </p>
          {job.paymentLink && (
            <a
              href={job.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-4 w-full"
            >
              Pagar pelo link (alternativa)
            </a>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href={`/vagas/${job.id}`} className="text-sm text-brand-700 hover:underline">
          Acompanhar status da vaga
        </Link>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        🔒 Pagamento processado com segurança pelo Mercado Pago. Seus dados de cartão não passam
        pelos servidores do CityJobs.
      </p>
    </div>
  );
}
