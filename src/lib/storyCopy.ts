import type { ApplicationMethod, Niche } from '@prisma/client';
import { NICHE_STORY_LABELS } from './constants';

/**
 * Deterministic Instagram Story copy generation (no AI for v1).
 *
 * Format:
 *   [NICHO]
 *   Cargo
 *   Empresa
 *   📍 Bairro – Cidade
 *   💰 Salário + benefícios
 *   👉 Candidate-se
 *
 * Rules: salary always visible, company always visible, niche uppercase, concise.
 */

const CTA_BY_METHOD: Record<ApplicationMethod, string> = {
  WHATSAPP: '👉 Candidate-se pelo WhatsApp',
  LINK: '👉 Candidate-se pelo link',
  EMAIL: '👉 Candidate-se por e-mail',
  OTHER: '👉 Candidate-se',
};

const BENEFITS_MAX_LENGTH = 60;

function shortenBenefits(benefits: string): string {
  const compact = benefits.replace(/\s*\n+\s*/g, ', ').replace(/\s+/g, ' ').trim();
  if (compact.length <= BENEFITS_MAX_LENGTH) return compact;
  return `${compact.slice(0, BENEFITS_MAX_LENGTH - 1).trimEnd()}…`;
}

export interface StoryCopyInput {
  niche: Niche;
  roleTitle: string;
  companyName: string;
  neighborhood: string;
  city: string;
  salary: string;
  benefits?: string | null;
  applicationMethod: ApplicationMethod;
}

export function generateStoryCopy(input: StoryCopyInput): string {
  const salaryLine = input.benefits?.trim()
    ? `💰 ${input.salary.trim()} + ${shortenBenefits(input.benefits)}`
    : `💰 ${input.salary.trim()}`;

  return [
    `[${NICHE_STORY_LABELS[input.niche]}]`,
    input.roleTitle.trim(),
    input.companyName.trim(),
    `📍 ${input.neighborhood.trim()} – ${input.city.trim()}`,
    salaryLine,
    CTA_BY_METHOD[input.applicationMethod],
  ].join('\n');
}
