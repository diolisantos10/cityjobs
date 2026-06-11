import type { Niche, ContractType, ApplicationMethod, JobStatus } from '@prisma/client';

export const NICHE_OPTIONS: { value: Niche; label: string }[] = [
  { value: 'VAREJO', label: 'Varejo' },
  { value: 'SAUDE', label: 'Saúde' },
  { value: 'ESCRITORIO', label: 'Escritório' },
  { value: 'RESTAURANTE', label: 'Restaurante' },
  { value: 'LOGISTICA', label: 'Logística' },
];

// Uppercase labels with accents for story copy header
export const NICHE_STORY_LABELS: Record<Niche, string> = {
  VAREJO: 'VAREJO',
  SAUDE: 'SAÚDE',
  ESCRITORIO: 'ESCRITÓRIO',
  RESTAURANTE: 'RESTAURANTE',
  LOGISTICA: 'LOGÍSTICA',
};

export const NICHE_LABELS: Record<Niche, string> = Object.fromEntries(
  NICHE_OPTIONS.map((n) => [n.value, n.label])
) as Record<Niche, string>;

export const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: 'CLT', label: 'CLT' },
  { value: 'PJ', label: 'PJ' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'TEMPORARIO', label: 'Temporário' },
  { value: 'ESTAGIO', label: 'Estágio' },
  { value: 'OUTRO', label: 'Outro' },
];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = Object.fromEntries(
  CONTRACT_TYPE_OPTIONS.map((c) => [c.value, c.label])
) as Record<ContractType, string>;

export const APPLICATION_METHOD_OPTIONS: { value: ApplicationMethod; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'LINK', label: 'Link' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'OTHER', label: 'Outro' },
];

export const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Rascunho',
  AWAITING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  IN_REVIEW: 'Em revisão',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Arquivada',
};

export const VALID_PLAN_DAYS = [1, 3, 7] as const;

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
