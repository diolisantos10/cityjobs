import type { TrustFlag, TrustResult } from '@/lib/trust';

const SEVERITY_STYLES: Record<TrustFlag['severity'], string> = {
  info: 'bg-gray-100 text-gray-700',
  warning: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

const SEVERITY_LABELS: Record<TrustFlag['severity'], string> = {
  info: 'Info',
  warning: 'Atenção',
  high: 'Alto',
};

function parseTrust(raw: unknown): TrustResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<TrustResult>;
  if (!Array.isArray(value.flags)) return null;
  return { flags: value.flags, score: typeof value.score === 'number' ? value.score : 0 };
}

export function TrustFlagsPanel({ trustFlags }: { trustFlags: unknown }) {
  const trust = parseTrust(trustFlags);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Análise de confiança</h2>
        {trust && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              trust.score === 0
                ? 'bg-brand-100 text-brand-800'
                : trust.score >= 6
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
            }`}
          >
            Risco: {trust.score}
          </span>
        )}
      </div>

      {!trust || trust.flags.length === 0 ? (
        <p className="mt-2 text-sm text-brand-700">Nenhum sinal de risco detectado.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {trust.flags.map((flag, i) => (
            <li key={`${flag.code}-${i}`} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 rounded px-1.5 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[flag.severity]}`}
              >
                {SEVERITY_LABELS[flag.severity]}
              </span>
              <span className="text-gray-700">{flag.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
