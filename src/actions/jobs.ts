'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  jobPostSchema,
  updateStatusSchema,
  moderationNotesSchema,
  editJobSchema,
} from '@/lib/validation';
import { generateStoryCopy } from '@/lib/storyCopy';
import { requireAdmin } from '@/lib/adminAuth';
import { findOrCreateCompany } from '@/lib/company';
import { analyzeTrust } from '@/lib/trust';
import { checkRateLimit } from '@/lib/rateLimit';

export interface JobFormState {
  errors?: Record<string, string>;
  message?: string;
}

export async function createJobPost(
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = jobPostSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.');
      if (!errors[field]) errors[field] = issue.message;
    }
    return { errors, message: 'Corrija os campos destacados e envie novamente.' };
  }

  // Basic anti-spam: cap submissions per client window.
  if (!checkRateLimit('createJobPost')) {
    return { message: 'Muitas submissões em pouco tempo. Aguarde um instante e tente novamente.' };
  }

  const data = parsed.data;

  const plan = await prisma.planConfig.findFirst({
    where: { days: data.selectedPlanDays, active: true },
  });

  if (!plan) {
    return { message: 'Plano selecionado não está disponível. Atualize a página e tente novamente.' };
  }

  const storyCopy = generateStoryCopy({
    niche: data.niche,
    roleTitle: data.roleTitle,
    companyName: data.companyName,
    neighborhood: data.neighborhood,
    city: data.city,
    salary: data.salary,
    benefits: data.benefits || null,
    applicationMethod: data.applicationMethod,
  });

  const companyId = await findOrCreateCompany({ name: data.companyName, cnpj: data.cnpj || null });
  const trust = analyzeTrust(data);

  const job = await prisma.jobPost.create({
    data: {
      companyId,
      companyName: data.companyName,
      cnpj: data.cnpj || null,
      roleTitle: data.roleTitle,
      niche: data.niche,
      neighborhood: data.neighborhood,
      city: data.city,
      contractType: data.contractType,
      salary: data.salary,
      benefits: data.benefits || null,
      applicationMethod: data.applicationMethod,
      applicationWhatsapp: data.applicationWhatsapp || null,
      applicationLink: data.applicationLink || null,
      selectedPlanDays: plan.days,
      priceInCents: plan.priceInCents,
      paymentLink: plan.paymentLink,
      status: 'AWAITING_PAYMENT',
      storyCopy,
      trustFlags: trust as unknown as object,
    },
  });

  redirect(`/vagas/${job.id}/confirmacao`);
}

export async function updateJobStatus(formData: FormData): Promise<void> {
  requireAdmin();

  const parsed = updateStatusSchema.safeParse({
    jobId: formData.get('jobId'),
    status: formData.get('status'),
  });

  if (!parsed.success) {
    throw new Error('Dados inválidos para atualização de status');
  }

  await prisma.jobPost.update({
    where: { id: parsed.data.jobId },
    data: { status: parsed.data.status },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/jobs/${parsed.data.jobId}`);
}

export interface EditJobState {
  errors?: Record<string, string>;
  message?: string;
  success?: boolean;
}

export async function updateJobFields(
  _prevState: EditJobState,
  formData: FormData
): Promise<EditJobState> {
  requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = editJobSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.');
      if (!errors[field]) errors[field] = issue.message;
    }
    return { errors, message: 'Corrija os campos destacados.' };
  }

  const data = parsed.data;

  // Regenerate story copy from the edited content.
  const storyCopy = generateStoryCopy({
    niche: data.niche,
    roleTitle: data.roleTitle,
    companyName: data.companyName,
    neighborhood: data.neighborhood,
    city: data.city,
    salary: data.salary,
    benefits: data.benefits || null,
    applicationMethod: data.applicationMethod,
  });

  await prisma.jobPost.update({
    where: { id: data.jobId },
    data: {
      companyName: data.companyName,
      cnpj: data.cnpj || null,
      roleTitle: data.roleTitle,
      niche: data.niche,
      neighborhood: data.neighborhood,
      city: data.city,
      contractType: data.contractType,
      salary: data.salary,
      benefits: data.benefits || null,
      applicationMethod: data.applicationMethod,
      applicationWhatsapp: data.applicationWhatsapp || null,
      applicationLink: data.applicationLink || null,
      storyCopy,
    },
  });

  revalidatePath(`/admin/jobs/${data.jobId}`);
  revalidatePath('/admin');
  return { success: true, message: 'Vaga atualizada e story copy regenerada.' };
}

export async function updateModerationNotes(formData: FormData): Promise<void> {
  requireAdmin();

  const parsed = moderationNotesSchema.safeParse({
    jobId: formData.get('jobId'),
    moderationNotes: formData.get('moderationNotes') ?? '',
  });

  if (!parsed.success) {
    throw new Error('Notas de moderação inválidas');
  }

  await prisma.jobPost.update({
    where: { id: parsed.data.jobId },
    data: { moderationNotes: parsed.data.moderationNotes || null },
  });

  revalidatePath(`/admin/jobs/${parsed.data.jobId}`);
}
