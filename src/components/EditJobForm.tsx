'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateJobFields, type EditJobState } from '@/actions/jobs';
import {
  NICHE_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  APPLICATION_METHOD_OPTIONS,
} from '@/lib/constants';
import type {
  ApplicationMethod,
  ContractType,
  JobPost,
  Niche,
} from '@prisma/client';

const initialState: EditJobState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar alterações'}
    </button>
  );
}

function FieldError({ errors, field }: { errors?: Record<string, string>; field: string }) {
  if (!errors?.[field]) return null;
  return <p className="field-error">{errors[field]}</p>;
}

export function EditJobForm({ job }: { job: JobPost }) {
  const [state, formAction] = useFormState(updateJobFields, initialState);
  const [applicationMethod, setApplicationMethod] = useState<ApplicationMethod>(
    job.applicationMethod
  );
  const [open, setOpen] = useState(false);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Editar vaga</h2>
        <button type="button" className="btn-secondary text-xs" onClick={() => setOpen((o) => !o)}>
          {open ? 'Fechar' : 'Editar campos'}
        </button>
      </div>

      {!open ? (
        <p className="mt-2 text-sm text-gray-500">
          Corrija os dados da vaga. A story copy é regenerada automaticamente ao salvar.
        </p>
      ) : (
        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="jobId" value={job.id} />

          {state.message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                state.success
                  ? 'border border-brand-200 bg-brand-50 text-brand-800'
                  : 'border border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {state.message}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Empresa</label>
              <input name="companyName" className="input" defaultValue={job.companyName} />
              <FieldError errors={state.errors} field="companyName" />
            </div>
            <div>
              <label className="label">CNPJ</label>
              <input name="cnpj" className="input" defaultValue={job.cnpj ?? ''} />
            </div>
          </div>

          <div>
            <label className="label">Cargo</label>
            <input name="roleTitle" className="input" defaultValue={job.roleTitle} />
            <FieldError errors={state.errors} field="roleTitle" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nicho</label>
              <select name="niche" className="input" defaultValue={job.niche as Niche}>
                {NICHE_OPTIONS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Contrato</label>
              <select
                name="contractType"
                className="input"
                defaultValue={job.contractType as ContractType}
              >
                {CONTRACT_TYPE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Bairro</label>
              <input name="neighborhood" className="input" defaultValue={job.neighborhood} />
              <FieldError errors={state.errors} field="neighborhood" />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input name="city" className="input" defaultValue={job.city} />
            </div>
          </div>

          <div>
            <label className="label">Salário</label>
            <input name="salary" className="input" defaultValue={job.salary} />
            <FieldError errors={state.errors} field="salary" />
          </div>

          <div>
            <label className="label">Benefícios</label>
            <textarea name="benefits" rows={2} className="input" defaultValue={job.benefits ?? ''} />
          </div>

          <div>
            <label className="label">Forma de candidatura</label>
            <select
              name="applicationMethod"
              className="input"
              value={applicationMethod}
              onChange={(e) => setApplicationMethod(e.target.value as ApplicationMethod)}
            >
              {APPLICATION_METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {applicationMethod === 'WHATSAPP' && (
            <div>
              <label className="label">WhatsApp para candidatura</label>
              <input
                name="applicationWhatsapp"
                className="input"
                defaultValue={job.applicationWhatsapp ?? ''}
              />
            </div>
          )}

          {applicationMethod === 'LINK' && (
            <div>
              <label className="label">Link para candidatura</label>
              <input
                name="applicationLink"
                className="input"
                defaultValue={job.applicationLink ?? ''}
              />
            </div>
          )}

          <SaveButton />
        </form>
      )}
    </div>
  );
}
