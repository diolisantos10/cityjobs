import Link from 'next/link';
import { getActivePlans } from '@/lib/plans';
import { formatPrice, NICHE_OPTIONS } from '@/lib/constants';
import { ComingSoon } from '@/components/ComingSoon';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Pre-launch: show the "Em breve" splash. Flip COMING_SOON to launch — no code change.
  if (process.env.COMING_SOON === 'true') {
    return <ComingSoon />;
  }

  const plans = await getActivePlans();

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="pt-6 text-center">
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Publique sua vaga local com salário aberto
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
          Vagas do <strong>Alto Tietê</strong> — Mogi, Suzano, Itaquá e região. Envie os dados,
          pague o plano e aguarde validação para publicação nos stories do CityJobs.
        </p>
        <div className="mt-8">
          <Link href="/anunciar" className="btn-primary px-8 py-3 text-base">
            Anunciar vaga
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-700">
          <span>✓ Vagas reais</span>
          <span>✓ Salário aberto</span>
          <span>✓ Candidatura rápida</span>
        </div>
      </section>

      {/* Niches */}
      <section>
        <h2 className="text-center text-xl font-bold text-gray-900">Nichos atendidos</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {NICHE_OPTIONS.map((niche) => (
            <span
              key={niche.value}
              className="rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-800"
            >
              {niche.label}
            </span>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section>
        <h2 className="text-center text-xl font-bold text-gray-900">Planos de publicação</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card flex flex-col items-center text-center ${
                plan.days === 7 ? 'border-brand-600 ring-1 ring-brand-600' : ''
              }`}
            >
              {plan.days === 7 && (
                <span className="mb-2 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white">
                  Destaque
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.label}</h3>
              <p className="mt-2 text-3xl font-extrabold text-brand-700">
                {formatPrice(plan.priceInCents)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {plan.days === 1 && 'Publicação por 1 dia nos stories'}
                {plan.days === 3 && 'Publicação por 3 dias nos stories'}
                {plan.days === 7 && '7 dias com destaque no perfil'}
              </p>
              <Link href="/anunciar" className="btn-primary mt-4 w-full">
                Anunciar
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-xl font-bold text-gray-900">Como funciona</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { step: '1', title: 'Envie a vaga', desc: 'Formulário rápido com salário obrigatório' },
            { step: '2', title: 'Pague o plano', desc: 'Link de pagamento direto, sem burocracia' },
            { step: '3', title: 'Validação', desc: 'Toda vaga é revisada antes de publicar' },
            { step: '4', title: 'Publicação', desc: 'Sua vaga nos stories do CityJobs SP' },
          ].map((item) => (
            <div key={item.step} className="card text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                {item.step}
              </div>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="card border-brand-100 bg-brand-50 text-center">
        <h2 className="text-lg font-bold text-brand-800">Curadoria paga, não mural aberto</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-brand-800/80">
          Toda vaga exige salário visível e empresa identificada. Vagas passam por validação antes
          da publicação. Golpes ou informações falsas resultam em banimento permanente.
        </p>
      </section>
    </div>
  );
}
