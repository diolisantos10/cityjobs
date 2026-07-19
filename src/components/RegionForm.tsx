'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateRegion, type RegionFormState } from '@/actions/regions';

interface RegionData {
  id: string;
  name: string;
  slug: string;
  instagramHandle: string;
  igUserId: string | null;
  hasToken: boolean;
  active: boolean;
  isDefault: boolean;
}

const initial: RegionFormState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Salvando e testando…' : 'Salvar credenciais'}
    </button>
  );
}

export function RegionForm({ region }: { region: RegionData }) {
  const [state, action] = useFormState(updateRegion, initial);
  const configured = Boolean(region.igUserId && region.hasToken);

  return (
    <form action={action} className="card">
      <input type="hidden" name="regionId" value={region.id} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {region.name} {region.isDefault && <span className="text-xs text-gray-400">(padrão)</span>}
        </h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            configured ? 'bg-brand-100 text-brand-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {configured ? 'Auto-publicação ligada' : 'Manual (sem credenciais)'}
        </span>
      </div>

      {state.message && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            state.ok ? 'border border-brand-200 bg-brand-50 text-brand-800' : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome da região</label>
          <input name="name" className="input" defaultValue={region.name} />
        </div>
        <div>
          <label className="label">@ do Instagram</label>
          <input name="instagramHandle" className="input" defaultValue={region.instagramHandle} />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Instagram Business Account ID</label>
        <input
          name="igUserId"
          className="input"
          defaultValue={region.igUserId ?? ''}
          placeholder="1784xxxxxxxxxxx"
        />
      </div>

      <div className="mt-4">
        <label className="label">
          Access Token {region.hasToken && <span className="text-xs text-brand-700">(já salvo — preencha só p/ trocar)</span>}
        </label>
        <input
          name="igAccessToken"
          type="password"
          className="input"
          placeholder={region.hasToken ? '•••••••• (deixe vazio para manter)' : 'EAAB...'}
        />
        <p className="field-error !text-gray-500">
          Por segurança o token não é exibido. Deixe vazio para manter o atual; cole um novo para trocar.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={region.active} className="h-4 w-4 accent-brand-600" />
          Região ativa
        </label>
        <SaveButton />
      </div>
    </form>
  );
}
