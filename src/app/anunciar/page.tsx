import { getActivePlans } from '@/lib/plans';
import { JobForm } from '@/components/JobForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Anunciar vaga — CityJobs SP',
};

export default async function AnunciarPage() {
  const plans = await getActivePlans();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Anunciar vaga</h1>
      <p className="mt-2 text-gray-600">
        Preencha os dados da vaga. Após o envio você recebe o link de pagamento do plano escolhido.
      </p>
      <p className="mt-2 text-sm font-medium text-brand-700">
        Vagas passam por validação antes da publicação.
      </p>

      <div className="mt-8">
        <JobForm
          plans={plans.map((p) => ({
            id: p.id,
            days: p.days,
            label: p.label,
            priceInCents: p.priceInCents,
          }))}
        />
      </div>
    </div>
  );
}
