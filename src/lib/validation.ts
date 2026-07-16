import { z } from 'zod';

// Obviously generic/suspicious role titles. Matched against the full
// normalized title, not as substrings, to stay practical.
const GENERIC_TITLES = new Set([
  'vaga',
  'vagas',
  'trabalho',
  'emprego',
  'oportunidade',
  'oportunidades',
  'diversas vagas',
  'varias vagas',
  'várias vagas',
  'vaga de emprego',
]);

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export const jobPostSchema = z
  .object({
    companyName: z
      .string({ required_error: 'Nome da empresa é obrigatório' })
      .trim()
      .min(2, 'Nome da empresa é obrigatório'),
    cnpj: z.string().trim().optional().or(z.literal('')),
    roleTitle: z
      .string({ required_error: 'Cargo é obrigatório' })
      .trim()
      .min(3, 'Cargo deve ter pelo menos 3 caracteres')
      .refine((title) => !GENERIC_TITLES.has(normalize(title)), {
        message: 'Informe o cargo específico da vaga (ex: "Auxiliar Administrativo"), não um título genérico.',
      }),
    niche: z.enum(['VAREJO', 'SAUDE', 'ESCRITORIO', 'RESTAURANTE', 'LOGISTICA'], {
      errorMap: () => ({ message: 'Selecione o nicho da vaga' }),
    }),
    neighborhood: z
      .string({ required_error: 'Bairro é obrigatório' })
      .trim()
      .min(2, 'Bairro é obrigatório'),
    city: z.string().trim().min(2).default('São Paulo'),
    contractType: z.enum(['CLT', 'PJ', 'FREELANCER', 'TEMPORARIO', 'ESTAGIO', 'OUTRO'], {
      errorMap: () => ({ message: 'Selecione o tipo de contrato' }),
    }),
    salary: z
      .string({ required_error: 'Salário é obrigatório' })
      .trim()
      .min(2, 'Salário é obrigatório — vagas sem salário não são publicadas'),
    benefits: z.string().trim().optional().or(z.literal('')),
    applicationMethod: z.enum(['WHATSAPP', 'LINK', 'EMAIL', 'OTHER'], {
      errorMap: () => ({ message: 'Selecione a forma de candidatura' }),
    }),
    applicationWhatsapp: z.string().trim().optional().or(z.literal('')),
    applicationLink: z.string().trim().optional().or(z.literal('')),
    selectedPlanDays: z.coerce
      .number({ invalid_type_error: 'Selecione um plano' })
      .refine((days) => [1, 3, 7].includes(days), { message: 'Plano inválido' }),
    confirmation: z.literal('on', {
      errorMap: () => ({ message: 'Você precisa confirmar que a vaga é real' }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.applicationMethod === 'WHATSAPP' && !data.applicationWhatsapp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applicationWhatsapp'],
        message: 'Informe o WhatsApp para candidatura',
      });
    }
    if (data.applicationMethod === 'LINK' && !data.applicationLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applicationLink'],
        message: 'Informe o link para candidatura',
      });
    }
  });

export type JobPostInput = z.infer<typeof jobPostSchema>;

export const updateStatusSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum([
    'DRAFT',
    'AWAITING_PAYMENT',
    'PAID',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'PUBLISHED',
    'ARCHIVED',
  ]),
});

export const moderationNotesSchema = z.object({
  jobId: z.string().min(1),
  moderationNotes: z.string().trim().max(2000),
});

export const planConfigSchema = z.object({
  planId: z.string().min(1),
  priceInCents: z.coerce.number().int().min(100, 'Preço mínimo de R$ 1,00'),
  paymentLink: z.string().trim().url('Informe um link de pagamento válido'),
  active: z.coerce.boolean(),
});

// Admin edit of job content fields (no plan/payment/confirmation).
export const editJobSchema = z.object({
  jobId: z.string().min(1),
  companyName: z.string().trim().min(2, 'Nome da empresa é obrigatório'),
  cnpj: z.string().trim().optional().or(z.literal('')),
  roleTitle: z.string().trim().min(3, 'Cargo deve ter pelo menos 3 caracteres'),
  niche: z.enum(['VAREJO', 'SAUDE', 'ESCRITORIO', 'RESTAURANTE', 'LOGISTICA']),
  neighborhood: z.string().trim().min(2, 'Bairro é obrigatório'),
  city: z.string().trim().min(2),
  contractType: z.enum(['CLT', 'PJ', 'FREELANCER', 'TEMPORARIO', 'ESTAGIO', 'OUTRO']),
  salary: z.string().trim().min(2, 'Salário é obrigatório'),
  benefits: z.string().trim().optional().or(z.literal('')),
  applicationMethod: z.enum(['WHATSAPP', 'LINK', 'EMAIL', 'OTHER']),
  applicationWhatsapp: z.string().trim().optional().or(z.literal('')),
  applicationLink: z.string().trim().optional().or(z.literal('')),
});
