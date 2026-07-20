'use client';

import { useState } from 'react';

/**
 * Bloco "Enviar pro grupo do WhatsApp": mostra o grupo de destino e a mensagem
 * pronta, com botão de copiar (fluxo semi-automático, sem risco de ban).
 */
export function WhatsAppShare({ groupName, message }: { groupName: string; message: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // fallback silencioso — o textarea abaixo permite copiar manual
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="card mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Enviar pro grupo do WhatsApp</h2>
        <button
          onClick={copy}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          {copied ? '✓ Copiado!' : 'Copiar mensagem'}
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Grupo de destino:{' '}
        <span className="rounded bg-green-100 px-2 py-0.5 font-semibold text-green-800">
          {groupName}
        </span>
      </p>
      <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-900 p-4 font-sans text-sm leading-relaxed text-gray-100">
        {message}
      </pre>
    </div>
  );
}
