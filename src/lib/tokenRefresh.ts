import { prisma } from './prisma';
import { refreshLongLivedToken } from './instagram';
import logger from './logger';

/**
 * Renova os tokens do Instagram de todas as regiões ativas, estendendo +60 dias.
 *
 * Rodado 1x/dia pelo agendador. Para a região padrão que usa o token do ambiente
 * (IG_ACCESS_TOKEN), o token renovado é gravado em region.igAccessToken — a partir
 * daí o banco passa a ser a fonte e o ciclo se auto-sustenta ("paga e esquece").
 *
 * Tokens curtos/de teste não são renováveis: a chamada falha e é só logada, sem
 * quebrar nada (segue usando o token atual).
 */
export async function refreshRegionTokens(): Promise<{ refreshed: number; failed: number }> {
  const regions = await prisma.region.findMany({ where: { active: true } });
  let refreshed = 0;
  let failed = 0;

  for (const region of regions) {
    const current = region.igAccessToken || process.env.IG_ACCESS_TOKEN || null;
    if (!current) continue;

    const result = await refreshLongLivedToken(current);
    if (result?.accessToken) {
      await prisma.region.update({
        where: { id: region.id },
        data: { igAccessToken: result.accessToken },
      });
      refreshed++;
      const days = Math.round(result.expiresIn / 86400);
      logger.info(`[tokenRefresh] região ${region.slug}: token renovado (~${days} dias).`);
    } else {
      failed++;
    }
  }

  if (refreshed || failed) {
    logger.info(`[tokenRefresh] renovados=${refreshed} falhas=${failed}`);
  }
  return { refreshed, failed };
}
