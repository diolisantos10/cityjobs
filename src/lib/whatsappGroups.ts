import type { Niche, JobPost } from '@prisma/client';
import { CONTRACT_TYPE_LABELS } from './constants';

/**
 * Roteamento de vagas para os grupos de WhatsApp da comunidade da região.
 *
 * Estrutura no WhatsApp: Comunidade = REGIÃO, Grupos = clusters de setor/cargo.
 * Aqui mapeamos o nicho da vaga (e, quando o nicho é genérico, palavras-chave do
 * cargo) para o grupo certo e geramos uma mensagem pronta pra colar no grupo.
 */

export interface WhatsAppGroup {
  key: string;
  /** Nome exato do grupo no WhatsApp (mantenha idêntico ao criado). */
  name: string;
  emoji: string;
  hashtag: string;
}

export const WHATSAPP_GROUPS = {
  GASTRONOMIA: { key: 'GASTRONOMIA', name: 'Gastronomia — Cozinha, Garçom, Chapeiro', emoji: '🍽️', hashtag: '#Gastronomia' },
  TRANSPORTE: { key: 'TRANSPORTE', name: 'Transporte — Motoboy, Motorista', emoji: '🛵', hashtag: '#Transporte' },
  VAREJO: { key: 'VAREJO', name: 'Varejo — Loja, Caixa, Estoque', emoji: '🛍️', hashtag: '#Varejo' },
  SAUDE: { key: 'SAUDE', name: 'Saúde — Clínicas, Hospitais', emoji: '🏥', hashtag: '#Saúde' },
  ADMINISTRATIVO: { key: 'ADMINISTRATIVO', name: 'Administrativo — Recepção, Financeiro', emoji: '🗂️', hashtag: '#Administrativo' },
  BELEZA: { key: 'BELEZA', name: 'Beleza — Salão, Estética, Spa', emoji: '💇', hashtag: '#Beleza' },
  SERVICOS_GERAIS: { key: 'SERVICOS_GERAIS', name: 'Serviços Gerais — Limpeza, Porteiro', emoji: '🧹', hashtag: '#ServiçosGerais' },
} as const satisfies Record<string, WhatsAppGroup>;

export type WhatsAppGroupKey = keyof typeof WHATSAPP_GROUPS;

/** Mapa base: nicho → grupo. */
const NICHE_TO_GROUP: Record<Niche, WhatsAppGroupKey> = {
  RESTAURANTE: 'GASTRONOMIA',
  LOGISTICA: 'TRANSPORTE',
  VAREJO: 'VAREJO',
  SAUDE: 'SAUDE',
  ESCRITORIO: 'ADMINISTRATIVO',
};

/**
 * Refino por palavra-chave do cargo: como os nichos são grossos, alguns cargos
 * pertencem melhor a grupos que não têm nicho próprio (Beleza, Serviços Gerais).
 * Verificado ANTES do mapa de nicho.
 */
const ROLE_KEYWORD_OVERRIDES: { group: WhatsAppGroupKey; keywords: string[] }[] = [
  { group: 'BELEZA', keywords: ['cabelei', 'manicure', 'pedicure', 'esteti', 'salao', 'maquiad', 'depilad', 'barbeir', 'spa', 'massag', 'sobrancelh', 'design de sobr'] },
  { group: 'SERVICOS_GERAIS', keywords: ['limpeza', 'faxin', 'porteir', 'zelador', 'servente', 'copeir', 'jardineir', 'auxiliar de servicos', 'servicos gerais', 'lavador'] },
  { group: 'TRANSPORTE', keywords: ['motoboy', 'motorista', 'entregad', 'motofret', 'carreteir'] },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Descobre o grupo de destino a partir do nicho + cargo. */
export function resolveGroup(input: { niche: Niche; roleTitle: string }): WhatsAppGroup {
  const role = normalize(input.roleTitle);
  for (const rule of ROLE_KEYWORD_OVERRIDES) {
    if (rule.keywords.some((k) => role.includes(k))) return WHATSAPP_GROUPS[rule.group];
  }
  return WHATSAPP_GROUPS[NICHE_TO_GROUP[input.niche]];
}

/** Gera uma hashtag limpa (sem espaços nem pontuação, mantendo acentos). */
function hashtag(s: string): string {
  const cleaned = s.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, '');
  return `#${cleaned}`;
}

/** Monta um link wa.me a partir de um número BR (adiciona 55 quando necessário). */
function waLink(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `wa.me/${withCountry}`;
}

type MessageJob = Pick<
  JobPost,
  | 'niche'
  | 'roleTitle'
  | 'companyName'
  | 'neighborhood'
  | 'city'
  | 'contractType'
  | 'salary'
  | 'benefits'
  | 'applicationMethod'
  | 'applicationWhatsapp'
  | 'applicationLink'
>;

function applyLine(job: MessageJob): string {
  switch (job.applicationMethod) {
    case 'WHATSAPP':
      return job.applicationWhatsapp
        ? `✅ *Chamar no WhatsApp:* ${waLink(job.applicationWhatsapp)}`
        : '✅ *Candidate-se pelo WhatsApp*';
    case 'LINK':
      return job.applicationLink
        ? `✅ *Candidate-se:* ${job.applicationLink}`
        : '✅ *Candidate-se pelo link*';
    case 'EMAIL':
      return job.applicationLink
        ? `✅ *Envie seu currículo:* ${job.applicationLink}`
        : '✅ *Candidate-se por e-mail*';
    default:
      return '✅ *Candidate-se pela vaga*';
  }
}

export interface GroupMessage {
  group: WhatsAppGroup;
  /** Texto pronto pra colar no grupo (formatação WhatsApp com *negrito*). */
  message: string;
}

/**
 * Gera a mensagem pronta da vaga para o grupo de WhatsApp certo.
 * Formato pensado pra grupo (mais info que o Story, com contato e hashtags).
 */
export function generateGroupMessage(job: MessageJob): GroupMessage {
  const group = resolveGroup({ niche: job.niche, roleTitle: job.roleTitle });
  const cityTag = hashtag(job.city);
  const roleTag = hashtag(job.roleTitle);

  const salaryLine = job.benefits?.trim()
    ? `💰 ${job.salary.trim()}  ·  ${job.benefits.replace(/\s*\n+\s*/g, ', ').trim()}`
    : `💰 ${job.salary.trim()}`;

  const lines = [
    `${group.emoji} *VAGA — ${group.name.split(' — ')[0]}*`,
    '',
    `👉 *${job.roleTitle.trim()}*`,
    `🏢 ${job.companyName.trim()}`,
    `📍 ${job.neighborhood.trim()} – ${job.city.trim()}`,
    `💼 ${CONTRACT_TYPE_LABELS[job.contractType]}`,
    salaryLine,
    '',
    applyLine(job),
    '',
    `${group.hashtag} ${cityTag} ${roleTag}`,
    '',
    '📲 Vagas novas todo dia. Ative as notificações e fique de olho!',
  ];

  return { group, message: lines.join('\n') };
}
