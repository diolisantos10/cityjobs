import { prisma } from './prisma';
import { generateStoryBackground, openaiConfigured } from './openaiImage';
import type { Niche, JobPost, Asset } from '@prisma/client';
import type { DesignBrief } from './designAgent';

/**
 * Retorna o fundo IA da vaga (bytes PNG), gerando e salvando na primeira vez.
 * Cacheia via Asset(AI_BG) — não regenera a cada render. Retorna null se a
 * OpenAI não estiver configurada ou se a geração falhar (cai no gradiente).
 */
export async function getOrCreateBackground(
  job: Pick<JobPost, 'id' | 'niche' | 'designBrief'> & { assets?: Asset[] }
): Promise<Buffer | null> {
  const cached = job.assets?.find((a) => a.kind === 'AI_BG')
    ?? (await prisma.asset.findFirst({ where: { jobId: job.id, kind: 'AI_BG' } }));
  if (cached) return Buffer.from(cached.data);

  if (!openaiConfigured()) return null;

  const brief = (job.designBrief ?? {}) as DesignBrief;
  const bytes = await generateStoryBackground(job.niche as Niche, brief);
  if (!bytes) return null;

  await prisma.asset.create({
    data: { jobId: job.id, kind: 'AI_BG', mime: 'image/png', data: bytes },
  });
  return bytes;
}

/** Força regenerar (apaga o fundo atual e cria um novo). */
export async function regenerateBackground(
  job: Pick<JobPost, 'id' | 'niche' | 'designBrief'>
): Promise<Buffer | null> {
  await prisma.asset.deleteMany({ where: { jobId: job.id, kind: 'AI_BG' } });
  return getOrCreateBackground(job);
}
