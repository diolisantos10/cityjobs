import { prisma } from './prisma';
import { resolveIgCreds, publishStory } from './instagram';
import logger from './logger';

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
