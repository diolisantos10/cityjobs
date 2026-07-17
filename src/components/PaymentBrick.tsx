'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

const SDK_SRC = 'https://sdk.mercadopago.com/js/v2';

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('sdk load error')));
      return;
    }
    const s = document.createElement('script');
    s.src = SDK_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('sdk load error'));
    document.body.appendChild(s);
  });
}

interface PixData {
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

export function PaymentBrick({
  jobId,
  amount,
  publicKey,
}: {
  jobId: string;
  amount: number;
  publicKey: string;
}) {
  const router = useRouter();
  const brickRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadSdk();
        if (cancelled || !window.MercadoPago) return;

        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        const bricks = mp.bricks();
        brickRef.current = await bricks.create('payment', 'paymentBrick_container', {
          initialization: { amount },
          customization: {
            visual: { style: { theme: 'default' } },
            paymentMethods: {
              creditCard: 'all',
              bankTransfer: 'all', // PIX
            },
          },
          callbacks: {
            onReady: () => setLoading(false),
            onError: () => setError('Não foi possível carregar o pagamento. Recarregue a página.'),
            onSubmit: ({ formData }: { formData: unknown }) => submit(formData),
          },
        });
      } catch {
        if (!cancelled) setError('Falha ao carregar o Mercado Pago. Verifique sua conexão.');
      }
    }

    init();
    return () => {
      cancelled = true;
      if (brickRef.current?.unmount) brickRef.current.unmount();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(formData: unknown): Promise<void> {
    return fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, formData }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no pagamento.');

        if (data.status === 'approved') {
          router.push(`/vagas/${jobId}?pago=1`);
          return;
        }
        if (data.pix?.qrCodeBase64 || data.pix?.qrCode) {
          setPix(data.pix as PixData);
          return;
        }
        if (data.status === 'rejected') {
          throw new Error('Pagamento recusado. Tente outro cartão ou método.');
        }
        // in_process / pending sem PIX → acompanha pelo status
        router.push(`/vagas/${jobId}`);
      })
      .catch((e: Error) => {
        setError(e.message);
        throw e;
      });
  }

  function copyPix() {
    if (!pix?.qrCode) return;
    navigator.clipboard.writeText(pix.qrCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ─── PIX QR screen ─────────────────────────────────────────────────────────
  if (pix) {
    return (
      <div className="card text-center">
        <h2 className="text-lg font-bold">Pague com PIX</h2>
        <p className="mt-1 text-sm text-gray-600">
          Escaneie o QR code no app do seu banco. O status atualiza automaticamente após o pagamento.
        </p>
        {pix.qrCodeBase64 && (
          <img
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR code PIX"
            className="mx-auto mt-4 h-56 w-56"
          />
        )}
        {pix.qrCode && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-gray-500">PIX copia e cola</p>
            <textarea
              readOnly
              value={pix.qrCode}
              className="input h-20 text-xs"
              onFocus={(e) => e.target.select()}
            />
            <button onClick={copyPix} className="btn-secondary mt-2 w-full">
              {copied ? 'Copiado! ✓' : 'Copiar código PIX'}
            </button>
          </div>
        )}
        <button
          onClick={() => router.push(`/vagas/${jobId}`)}
          className="btn-primary mt-4 w-full"
        >
          Já paguei — acompanhar status
        </button>
      </div>
    );
  }

  // ─── Brick ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && !error && (
        <div className="mb-3 text-center text-sm text-gray-500">Carregando pagamento…</div>
      )}
      <div id="paymentBrick_container" />
    </div>
  );
}
