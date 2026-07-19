import type { JobPost, Asset } from '@prisma/client';

// Horários de pico (BRT, UTC-3). Stories rendem mais nesses horários.
const PEAK_HOURS_BRT = [8, 12, 18];
const BRT_OFFSET = 3;

/** Próximo horário de pico (em UTC) a partir de `from`. */
export function nextPeakSlot(from: Date = new Date()): Date {
  const d = new Date(from.getTime() + 30 * 60 * 1000); // +30 min de folga
  const brtHourNow = (d.getUTCHours() - BRT_OFFSET + 24) % 24;

  for (const peak of PEAK_HOURS_BRT) {
    if (peak > brtHourNow) {
      const slot = new Date(d);
      slot.setUTCHours((peak + BRT_OFFSET) % 24, 0, 0, 0);
      return slot;
    }
  }
  // Todos os picos de hoje passaram → primeiro pico de amanhã.
  const t = new Date(d);
  t.setUTCDate(t.getUTCDate() + 1);
  t.setUTCHours((PEAK_HOURS_BRT[0] + BRT_OFFSET) % 24, 0, 0, 0);
  return t;
}

/**
 * Resolve a URL da arte final de uma vaga para publicação:
 * - WE_CREATE  → arte gerada pelo agente (variação 1)
 * - SELF_UPLOAD → arte enviada pelo cliente
 * - fallback   → gerador básico de story
 */
export function jobArtUrl(job: Pick<JobPost, 'id' | 'artMode'>, assets: Pick<Asset, 'id' | 'kind'>[]): string {
  if (job.artMode === 'WE_CREATE') return `/api/design/${job.id}/1`;
  if (job.artMode === 'SELF_UPLOAD') {
    const art = assets.find((a) => a.kind === 'ART');
    if (art) return `/api/assets/${art.id}`;
  }
  return `/api/story-art/${job.id}`;
}

/** Converte um Date para o formato aceito pelo input datetime-local (hora BRT). */
export function toDatetimeLocalBRT(date: Date | null): string {
  if (!date) return '';
  const brt = new Date(date.getTime() - BRT_OFFSET * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 16);
}

/** Interpreta o valor de um input datetime-local (assumido BRT) como Date UTC. */
export function fromDatetimeLocalBRT(value: string): Date | null {
  if (!value) return null;
  const asUtc = new Date(`${value}:00Z`); // trata o valor como se fosse UTC…
  return new Date(asUtc.getTime() + BRT_OFFSET * 60 * 60 * 1000); // …e soma o offset BRT
}
