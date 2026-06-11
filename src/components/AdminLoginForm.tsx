'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { adminLogin, type AdminLoginState } from '@/actions/admin';

const initialState: AdminLoginState = {};

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useFormState(adminLogin, initialState);

  return (
    <form action={formAction} className="card mx-auto mt-12 max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Acesso administrativo</h1>
      <p className="text-sm text-gray-600">Informe a senha de administrador para continuar.</p>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="secret" className="label">
          Senha
        </label>
        <input id="secret" name="secret" type="password" className="input" required autoFocus />
      </div>

      <LoginButton />
    </form>
  );
}
