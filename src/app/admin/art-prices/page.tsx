import { getAllArtPrices } from '@/lib/artPricing';
import { updateArtPrice } from '@/actions/artPrices';
import { formatPrice } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Preço de arte — Admin CityJobs SP' };

export default async function AdminArtPricesPage() {
  const prices = await getAllArtPrices();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Preço da criação de arte</h1>
      <p className="mt-2 text-sm text-gray-600">
        Valor adicional cobrado quando o cliente escolhe que o CityJobs crie a arte. Somado ao
        plano no checkout.
      </p>

      <div className="mt-6 space-y-4">
        {prices.map((p) => (
          <form key={p.id} action={updateArtPrice} className="card">
            <input type="hidden" name="id" value={p.id} />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{p.label}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  p.active ? 'bg-brand-100 text-brand-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {p.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="mt-4">
              <label htmlFor={`price-${p.id}`} className="label">
                Preço (R$) — atual: {formatPrice(p.priceInCents)}
              </label>
              <input
                id={`price-${p.id}`}
                name="priceReais"
                type="number"
                step="0.01"
                min="0"
                className="input"
                defaultValue={(p.priceInCents / 100).toFixed(2)}
                required
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={p.active}
                  className="h-4 w-4 accent-brand-600"
                />
                Ativo
              </label>
              <button type="submit" className="btn-primary">
                Salvar
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
