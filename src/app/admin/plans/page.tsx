import { getAllPlans } from '@/lib/plans';
import { updatePlanConfig } from '@/actions/plans';
import { formatPrice } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Planos — Admin CityJobs SP',
};

export default async function AdminPlansPage() {
  const plans = await getAllPlans();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Configuração de planos</h1>
      <p className="mt-2 text-sm text-gray-600">
        Cada vaga enviada recebe automaticamente o preço e o link de pagamento do plano escolhido,
        com os valores configurados aqui.
      </p>

      <div className="mt-6 space-y-4">
        {plans.map((plan) => (
          <form key={plan.id} action={updatePlanConfig} className="card">
            <input type="hidden" name="planId" value={plan.id} />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{plan.label}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  plan.active ? 'bg-brand-100 text-brand-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {plan.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`price-${plan.id}`} className="label">
                  Preço (R$) — atual: {formatPrice(plan.priceInCents)}
                </label>
                <input
                  id={`price-${plan.id}`}
                  name="priceReais"
                  type="number"
                  step="0.01"
                  min="1"
                  className="input"
                  defaultValue={(plan.priceInCents / 100).toFixed(2)}
                  required
                />
              </div>
              <div>
                <label htmlFor={`link-${plan.id}`} className="label">
                  Link de pagamento
                </label>
                <input
                  id={`link-${plan.id}`}
                  name="paymentLink"
                  type="url"
                  className="input"
                  defaultValue={plan.paymentLink}
                  required
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={plan.active}
                  className="h-4 w-4 accent-brand-600"
                />
                Plano ativo
              </label>
              <button type="submit" className="btn-primary">
                Salvar plano
              </button>
            </div>
          </form>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Alterações afetam apenas vagas enviadas a partir de agora. Vagas existentes mantêm o preço
        e o link registrados no momento do envio.
      </p>
    </div>
  );
}
