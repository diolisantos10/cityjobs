import logger from './logger';

/**
 * Publicação de Stories via API oficial da Meta.
 * Usa a "Instagram API with Instagram Login" (graph.instagram.com), que publica
 * Stories e NÃO exige página do Facebook. Permissão: instagram_business_content_publish.
 * Fluxo (3 passos): cria container (media_type=STORIES, image_url) → aguarda
 * FINISHED → publica. Cada região usa suas próprias credenciais.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
 */

const GRAPH = 'https://graph.instagram.com/v20.0';

export interface IgCredentials {
  igUserId: string;
  igAccessToken: string;
}

export function igConfigured(region: {
  igUserId: string | null;
  igAccessToken: string | null;
}): region is { igUserId: string; igAccessToken: string } {
  return Boolean(region.igUserId && region.igAccessToken);
}

async function graphPost(path: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`${GRAPH}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'POST' });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API erro (${res.status})`);
  }
  return json;
}

async function graphGet(path: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`${GRAPH}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API erro (${res.status})`);
  }
  return json;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Publica um Story (imagem JPEG pública) na conta da região.
 * @returns id da mídia publicada
 */
export async function publishStory(creds: IgCredentials, imageUrl: string): Promise<string> {
  // 1. Cria o container de mídia (Story)
  const container = await graphPost(`${creds.igUserId}/media`, {
    media_type: 'STORIES',
    image_url: imageUrl,
    access_token: creds.igAccessToken,
  });
  const creationId = container.id as string;
  logger.info(`[instagram] container criado: ${creationId}`);

  // 2. Aguarda o container ficar FINISHED (o Meta baixa/processa a imagem)
  for (let i = 0; i < 15; i++) {
    const status = await graphGet(creationId, {
      fields: 'status_code',
      access_token: creds.igAccessToken,
    });
    if (status.status_code === 'FINISHED') break;
    if (status.status_code === 'ERROR') throw new Error('Meta rejeitou a mídia (ERROR).');
    await sleep(2000);
  }

  // 3. Publica
  const published = await graphPost(`${creds.igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: creds.igAccessToken,
  });
  logger.info(`[instagram] Story publicado: ${published.id}`);
  return published.id as string;
}

/** Valida o token/conta sem publicar nada (para o admin conferir a config). */
export async function checkIgCredentials(creds: IgCredentials): Promise<{ ok: boolean; username?: string; error?: string }> {
  try {
    const me = await graphGet(creds.igUserId, {
      fields: 'username',
      access_token: creds.igAccessToken,
    });
    return { ok: true, username: me.username };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'erro' };
  }
}

/**
 * Descobre o Instagram User ID a partir do token (graph.instagram.com/me).
 * Assim o operador precisa colar só o token; o ID é resolvido sozinho.
 */
export async function resolveIgUserId(accessToken: string): Promise<string | null> {
  try {
    const me = await graphGet('me', { fields: 'user_id,username', access_token: accessToken });
    return (me.user_id || me.id) ? String(me.user_id || me.id) : null;
  } catch {
    return null;
  }
}
