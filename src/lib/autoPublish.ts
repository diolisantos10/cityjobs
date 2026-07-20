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
/** Conta Stories publicados por conta (igUserId) desde `since`, para o teto diário. */
async function countPublishedByAccount(since: Date): Promise<Map<string, number>> {
  const recent = await prisma.jobPost.findMany({
    where: { status: 'PUBLISHED', publishedAt: { gte: since } },
    select: { region: { select: { igUserId: true, igAccessToken: true } } },
  });
  const counts = new Map<string, number>();
  for (const j of recent) {
    const creds = resolveIgCreds(j.region ?? { igUserId: null, igAccessToken: null });
    if (!creds) continue;
    counts.set(creds.igUserId, (counts.get(creds.igUserId) ?? 0) + 1);
  }
  return counts;
}

async function warmStoryImage(jobId: string): Promise<void> {
  const job = await prisma.jobPost.findUnique({ where: { id: jobId }, include: { assets: true } });
  if (job?.artMode === 'WE_CREATE') {
    await getOrCreateBackground(job).catch(() => null);
  }
}

export interface PublishRunResult {
  published: string[];
  skippedNoCreds: string[];
  skippedDailyCap: string[];
  failed: { id: string; error: string }[];
  eligible: number;
}

/**
 * Teto de Stories por conta a cada 24h. A API de conteúdo da Meta permite ~25
 * posts/24h; mantemos folga e evitamos parecer spam na fase de aquecimento.
 */
const DAILY_CAP_PER_ACCOUNT = 18;

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

  const result: PublishRunResult = {
    published: [],
    skippedNoCreds: [],
    skippedDailyCap: [],
    failed: [],
    eligible: jobs.length,
  };

  // Quantos Stories cada conta (igUserId) já publicou nas últimas 24h.
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const publishedToday = await countPublishedByAccount(since);

  for (const job of jobs) {
    const creds = job.region ? resolveIgCreds(job.region) : resolveIgCreds({ igUserId: null, igAccessToken: null });
    if (!creds) {
      result.skippedNoCreds.push(job.id);
      continue;
    }
    // Respeita o teto diário por conta.
    const count = publishedToday.get(creds.igUserId) ?? 0;
    if (count >= DAILY_CAP_PER_ACCOUNT) {
      result.skippedDailyCap.push(job.id);
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
      publishedToday.set(creds.igUserId, count + 1); // atualiza o teto no mesmo run
      result.published.push(job.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro';
      logger.error(`[autoPublish] falha ao publicar vaga ${job.id}: ${msg}`);
      result.failed.push({ id: job.id, error: msg });
    }
  }

  if (result.published.length || result.failed.length || result.skippedDailyCap.length) {
    logger.info(
      `[autoPublish] publicadas=${result.published.length} falhas=${result.failed.length} sem_creds=${result.skippedNoCreds.length} teto_diario=${result.skippedDailyCap.length}`
    );
  }
  return result;
}
