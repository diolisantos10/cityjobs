import { getAllRegions } from '@/lib/regions';
import { RegionForm } from '@/components/RegionForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Regiões — Admin CityJobs SP' };

export default async function AdminRegionsPage() {
  const regions = await getAllRegions();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Regiões</h1>
      <p className="mt-2 text-sm text-gray-600">
        Cada região tem seu Instagram. Cole aqui as credenciais da API da Meta para ligar a
        <strong> auto-publicação de Stories</strong>. Sem credenciais, as vagas da região ficam na
        central de publicação para postagem manual.
      </p>

      <div className="mt-6 space-y-5">
        {regions.map((r) => (
          <RegionForm
            key={r.id}
            region={{
              id: r.id,
              name: r.name,
              slug: r.slug,
              instagramHandle: r.instagramHandle,
              igUserId: r.igUserId,
              hasToken: Boolean(r.igAccessToken),
              active: r.active,
              isDefault: r.isDefault,
            }}
          />
        ))}
      </div>

      <div className="card mt-6 border-blue-100 bg-blue-50">
        <h2 className="font-bold text-blue-900">Como obter as credenciais</h2>
        <ol className="mt-2 list-decimal pl-5 text-sm text-blue-900/90">
          <li>@cityjobs.sp precisa ser conta <strong>Business/Profissional</strong> vinculada a uma página do Facebook.</li>
          <li>Em <strong>developers.facebook.com</strong>, crie um app e adicione o produto <em>Instagram Graph API</em>.</li>
          <li>Gere um <strong>Access Token</strong> de longa duração com as permissões <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>pages_show_list</code>.</li>
          <li>Pegue o <strong>Instagram Business Account ID</strong> (via <code>/me/accounts</code> → <code>instagram_business_account</code>).</li>
          <li>Cole os dois campos acima e salve — o sistema testa a conexão na hora.</li>
        </ol>
      </div>
    </div>
  );
}
