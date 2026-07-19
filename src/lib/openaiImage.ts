import type { Niche } from '@prisma/client';
import type { DesignBrief } from './designAgent';
import logger from './logger';

/**
 * Geração de FUNDO por IA (OpenAI gpt-image-1).
 *
 * A IA cria só o **fundo visual** (sem texto — modelos de imagem erram texto).
 * O texto nítido (cargo, salário, empresa) é sobreposto pelo motor de design.
 * Resultado: visual de IA + texto perfeito.
 */

const NICHE_THEME: Record<Niche, string> = {
  VAREJO: 'varejo, loja, vendas, ambiente comercial moderno',
  SAUDE: 'saúde, clínica, bem-estar, ambiente limpo e acolhedor',
  ESCRITORIO: 'escritório corporativo moderno, produtividade',
  RESTAURANTE: 'gastronomia, cozinha profissional, restaurante',
  LOGISTICA: 'logística, transporte, armazém, entregas',
};

export function openaiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function buildPrompt(niche: Niche, brief: DesignBrief): string {
  const theme = NICHE_THEME[niche];
  const style = brief.style?.trim() || 'moderno e profissional';
  const colors = brief.colors?.trim();
  return [
    `Fundo abstrato profissional para um story vertical (9:16) de vaga de emprego.`,
    `Tema: ${theme}.`,
    `Estilo: ${style}.`,
    colors ? `Paleta de cores: ${colors}.` : `Paleta de cores moderna e vibrante.`,
    `Composição com bastante espaço livre para sobrepor texto depois.`,
    `Alta qualidade, gradientes suaves, formas geométricas sutis.`,
    `MUITO IMPORTANTE: sem nenhum texto, sem palavras, sem letras, sem números, sem logotipos.`,
  ].join(' ');
}

/**
 * Gera o fundo (PNG bytes, ~1024x1536). Retorna null se a chave não estiver
 * configurada ou em caso de erro (o motor cai no gradiente padrão).
 */
export async function generateStoryBackground(niche: Niche, brief: DesignBrief): Promise<Buffer | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: buildPrompt(niche, brief),
        size: '1024x1536',
        quality: 'medium',
        n: 1,
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      logger.error(`[openai] geração falhou: ${json.error?.message || res.status}`);
      return null;
    }
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) return null;
    return Buffer.from(b64, 'base64');
  } catch (err) {
    logger.error(`[openai] erro: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}
