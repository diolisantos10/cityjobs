/**
 * Agendador in-process de auto-publicação.
 *
 * Roda dentro do próprio servidor Next (Railway mantém 1 processo persistente),
 * checando a cada 5 min se há Stories agendados prontos para publicar. Não
 * depende de cron externo. O endpoint /api/cron/publish continua disponível
 * como gatilho manual/externo (backup).
 *
 * Observação: com múltiplas réplicas seria preciso um lock; hoje roda 1 réplica.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.DISABLE_SCHEDULER === 'true') return;

  const INTERVAL_MS = 5 * 60 * 1000;

  const tick = async () => {
    const origin = process.env.APP_URL;
    if (!origin) return; // sem URL pública, não há como a Meta buscar a imagem
    try {
      const { publishDueJobs } = await import('./src/lib/autoPublish');
      await publishDueJobs(origin);
    } catch (err) {
      console.error('[scheduler] erro no tick:', err instanceof Error ? err.message : err);
    }
  };

  // Renova os tokens do Instagram 1x/dia (estende +60 dias — "paga e esquece").
  const refreshTokens = async () => {
    try {
      const { refreshRegionTokens } = await import('./src/lib/tokenRefresh');
      await refreshRegionTokens();
    } catch (err) {
      console.error('[scheduler] erro ao renovar tokens:', err instanceof Error ? err.message : err);
    }
  };

  // Primeira execução após 60s (dá tempo do app subir), depois a cada 5 min.
  setTimeout(() => {
    tick();
    setInterval(tick, INTERVAL_MS);
  }, 60 * 1000);

  // Renova tokens 5 min após subir e depois a cada 24h.
  setTimeout(() => {
    refreshTokens();
    setInterval(refreshTokens, 24 * 60 * 60 * 1000);
  }, 5 * 60 * 1000);

  console.log('[scheduler] auto-publicação (5 min) + renovação de token (24h) iniciadas.');
}
