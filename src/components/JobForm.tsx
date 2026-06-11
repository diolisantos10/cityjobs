'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createJobPost, type JobFormState } from '@/actions/jobs';
import {
  NICHE_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  APPLICATION_METHOD_OPTIONS,
  formatPrice,
} from '@/lib/constants';

interface PlanOption {
  id: string;
  days: number;
  label: string;
  priceInCents: number;
}

const initialState: JobFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full py-3 text-base" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar vaga e ir para pagamento'}
    </button>
  );
}

function FieldError({ errors, field }: { errors?: Record<string, string>; field: string }) {
  if (!errors?.[field]) return null;
  return <p className="field-error">{errors[field]}</p>;
}

export function JobForm({ plans }: { plans: PlanOption[] }) {
  const [state, formAction] = useFormState(createJobPost, initialState);
  const [applicationMethod, setApplicationMethod] = useState('WHATSAPP');

  return (
    <form action={formAction} className="space-y-8">
      {state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Company */}
      <fieldset className="card space-y-4">
        <legend className="px-1 text-base font-bold">Empresa</legend>

        <div>
          <label htmlFor="companyName" className="label">
            Nome da empresa *
          </label>
          <input
            id="companyName"
            name="companyName"
            className="input"
            placeholder="Ex: Mercado Bom Preço"
            required
          />
          <FieldError errors={state.errors} field="companyName" />
        </div>

        <div>
          <label htmlFor="cnpj" className="label">
            CNPJ (opcional)
          </label>
          <input id="cnpj" name="cnpj" className="input" placeholder="00.000.000/0001-00" />
        </div>
      </fieldset>

      {/* Job */}
      <fieldset className="card space-y-4">
        <legend className="px-1 text-base font-bold">Vaga</legend>

        <div>
          <label htmlFor="roleTitle" className="label">
            Cargo *
          </label>
          <input
            id="roleTitle"
            name="roleTitle"
            className="input"
            placeholder="Ex: Auxiliar Administrativo"
            required
          />
          <FieldError errors={state.errors} field="roleTitle" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="niche" className="label">
              Nicho *
            </label>
            <select id="niche" name="niche" className="input" required defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {NICHE_OPTIONS.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
            <FieldError errors={state.errors} field="niche" />
          </div>

          <div>
            <label htmlFor="contractType" className="label">
              Tipo de contrato *
            </label>
            <select id="contractType" name="contractType" className="input" required defaultValue="CLT">
              {CONTRACT_TYPE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <FieldError errors={state.errors} field="contractType" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="neighborhood" className="label">
              Bairro *
            </label>
            <input
              id="neighborhood"
              name="neighborhood"
              className="input"
              placeholder="Ex: Pinheiros"
              required
            />
            <FieldError errors={state.errors} field="neighborhood" />
          </div>

          <div>
            <label htmlFor="city" className="label">
              Cidade *
            </label>
            <input id="city" name="city" className="input" defaultValue="São Paulo" required />
            <FieldError errors={state.errors} field="city" />
          </div>
        </div>

        <div>
          <label htmlFor="salary" className="label">
            Salário * <span className="font-normal text-gray-500">(vagas sem salário não são publicadas)</span>
          </label>
          <input
            id="salary"
            name="salary"
            className="input"
            placeholder="Ex: R$ 2.500 ou R$ 2.000 a R$ 2.500"
            required
          />
          <FieldError errors={state.errors} field="salary" />
        </div>

        <div>
          <label htmlFor="benefits" className="label">
            Benefícios
          </label>
          <textarea
            id="benefits"
            name="benefits"
            rows={2}
            className="input"
            placeholder="Ex: VT, VR, plano de saúde"
          />
        </div>
      </fieldset>

      {/* Application */}
      <fieldset className="card space-y-4">
        <legend className="px-1 text-base font-bold">Candidatura</legend>

        <div>
          <label htmlFor="applicationMethod" className="label">
            Como o candidato se candidata? *
          </label>
          <select
            id="applicationMethod"
            name="applicationMethod"
            className="input"
            value={applicationMethod}
            onChange={(e) => setApplicationMethod(e.target.value)}
            required
          >
            {APPLICATION_METHOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors} field="applicationMethod" />
        </div>

        {applicationMethod === 'WHATSAPP' && (
          <div>
            <label htmlFor="applicationWhatsapp" className="label">
              WhatsApp para candidatura *
            </label>
            <input
              id="applicationWhatsapp"
              name="applicationWhatsapp"
              className="input"
              placeholder="(11) 99999-9999"
            />
            <FieldError errors={state.errors} field="applicationWhatsapp" />
          </div>
        )}

        {applicationMethod === 'LINK' && (
          <div>
            <label htmlFor="applicationLink" className="label">
              Link para candidatura *
            </label>
            <input
              id="applicationLink"
              name="applicationLink"
              className="input"
              placeholder="https://…"
            />
            <FieldError errors={state.errors} field="applicationLink" />
          </div>
        )}
      </fieldset>

      {/* Plan */}
      <fieldset className="card space-y-3">
        <legend className="px-1 text-base font-bold">Plano de publicação</legend>

        {plans.map((plan, index) => (
          <label
            key={plan.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
          >
            <input
              type="radio"
              name="selectedPlanDays"
              value={plan.days}
              defaultChecked={index === 0}
              className="h-4 w-4 accent-brand-600"
              required
            />
            <span className="flex-1 font-medium">{plan.label}</span>
            <span className="font-bold text-brand-700">{formatPrice(plan.priceInCents)}</span>
          </label>
        ))}
        <FieldError errors={state.errors} field="selectedPlanDays" />
      </fieldset>

      {/* Confirmation */}
      <div className="card">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="confirmation"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            required
          />
          <span>
            Confirmo que as informações acima são verdadeiras e que a vaga é real.
            <span className="mt-1 block text-xs text-gray-500">
              Golpes ou informações falsas resultam em banimento permanente.
            </span>
          </span>
        </label>
        <FieldError errors={state.errors} field="confirmation" />
      </div>

      <SubmitButton />
    </form>
  );
}
