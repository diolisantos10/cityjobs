import { prisma } from './prisma';
import { resolveIgCreds, publishStory } from './instagram';
import { getOrCreateBackground } from './artBackground';
import logger from './logger';

/**
 * Pré-gera o fundo IA (WE_CREATE) e cacheia como Asset ANTES de mandar a Meta
 * buscar a imagem. Sem isso, o 1º acesso ao /api/publish-image dispara a geração
 * OpenAI (~20s) durante o fetch da Meta, que dá timeout e recusa a mídia
 * ("Only photo or video can be accepted as media type").
 */
async function warmStoryImage(jobId: string): Promise<void> {
  const job = await prisma.jobPost.findUnique({ where: { id: jobId }, include: { assets: true } });
  if (job?.artMode === 'WE_CREATE') {
    await getOrCreateBackground(job).catch(() => null);
  }
}

export interface PublishRunResult {
  published: string[];
  skippedNoCreds: string[];
  failed: { id: string; error: string }[];
  eligible: number;
}

/**
 * Publica automaticamente as vagas APROVADAS cujo horário agendado já chegou,
 * usando as credenciais do Instagram da região de cada vaga. Vagas de regiões
 * sem credenciais ficam para publicação manual (central de publicação).
 *
 * @param origin URL pública do app (para a Meta buscar a imagem JPEG)
 */
export async function publishDueJobs(origin: string, now = new Date()): Promise<PublishRunResult> {
  const jobs = await prisma.jobPost.findMany({
    where: {
      status: 'APPROVED',
      publishedAt: null,
      scheduledFor: { lte: now },
    },
    include: { region: true },
    orderBy: { scheduledFor: 'asc' },
    take: 20, // respeita folga do limite da Meta (~25/dia)
  });

  const result: PublishRunResult = { published: [], skippedNoCreds: [], failed: [], eligible: jobs.length };

  for (const job of jobs) {
    const creds = job.region ? resolveIgCreds(job.region) : resolveIgCreds({ igUserId: null, igAccessToken: null });
    if (!creds) {
      result.skippedNoCreds.push(job.id);
      continue;
    }
    try {
      await warmStoryImage(job.id); // gera/cacheia o fundo IA antes da Meta buscar
      const imageUrl = `${origin}/api/publish-image/${job.id}`;
      await publishStory(creds, imageUrl);
      await prisma.jobPost.update({
        where: { id: job.id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });
      result.published.push(job.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro';
      logger.error(`[autoPublish] falha ao publicar vaga ${job.id}: ${msg}`);
      result.failed.push({ id: job.id, error: msg });
    }
  }

  if (result.published.length || result.failed.length) {
    logger.info(
      `[autoPublish] publicadas=${result.published.length} falhas=${result.failed.length} sem_creds=${result.skippedNoCreds.length}`
    );
  }
  return result;
}
