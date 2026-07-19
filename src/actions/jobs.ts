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
import { artPriceForCount } from '@/lib/artPricing';
import { fromDatetimeLocalBRT } from '@/lib/publishing';
import { getDefaultRegion } from '@/lib/regions';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'];

async function readUpload(file: FormDataEntryValue | null): Promise<{ mime: string; data: Buffer } | null | 'invalid'> {
  if (!file || typeof file === 'string') return null;
  const f = file as File;
  if (f.size === 0) return null;
  if (f.size > MAX_UPLOAD_BYTES || !ALLOWED_IMAGE_MIME.includes(f.type)) return 'invalid';
  return { mime: f.type, data: Buffer.from(await f.arrayBuffer()) };
}

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

  // ─── Arte do Story: preço + uploads ────────────────────────────────────────
  const weCreate = data.artMode === 'WE_CREATE';
  const artDesignCount = weCreate ? Number(data.artDesignCount) : null;
  const artPriceInCents = weCreate ? await artPriceForCount(artDesignCount as number) : 0;

  // Read uploads (art required when the client sends their own; logo optional).
  const artUpload = await readUpload(formData.get('artFile'));
  const logoUpload = await readUpload(formData.get('logoFile'));

  if (artUpload === 'invalid' || logoUpload === 'invalid') {
    return { errors: { artFile: 'Envie uma imagem PNG/JPG/WebP de até 5 MB.' }, message: 'Arquivo inválido.' };
  }
  if (data.artMode === 'SELF_UPLOAD' && !artUpload) {
    return { errors: { artFile: 'Envie a arte do seu story.' }, message: 'Falta a arte do story.' };
  }

  const designBrief = weCreate
    ? {
        useLogo: data.designUseLogo === 'on',
        style: data.designStyle || null,
        colors: data.designColors || null,
        notes: data.designNotes || null,
      }
    : null;

  const totalPriceInCents = plan.priceInCents + artPriceInCents;

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
  const region = await getDefaultRegion();

  const job = await prisma.jobPost.create({
    data: {
      companyId,
      regionId: region?.id ?? null,
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
      planPriceInCents: plan.priceInCents,
      artMode: data.artMode,
      artDesignCount,
      artPriceInCents,
      designBrief: designBrief as unknown as object,
      priceInCents: totalPriceInCents,
      paymentLink: plan.paymentLink,
      status: 'AWAITING_PAYMENT',
      storyCopy,
      trustFlags: trust as unknown as object,
    },
  });

  // Persist uploads linked to the job (types already narrowed past 'invalid').
  const assets = [];
  if (artUpload)
    assets.push({ jobId: job.id, kind: 'ART' as const, mime: artUpload.mime, data: artUpload.data });
  if (logoUpload)
    assets.push({ jobId: job.id, kind: 'LOGO' as const, mime: logoUpload.mime, data: logoUpload.data });
  if (assets.length) await prisma.asset.createMany({ data: assets });

  redirect(`/vagas/${job.id}/confirmacao`);
}

export async function updateSchedule(formData: FormData): Promise<void> {
  requireAdmin();
  const jobId = String(formData.get('jobId') ?? '');
  const when = fromDatetimeLocalBRT(String(formData.get('scheduledFor') ?? ''));
  if (!jobId) throw new Error('jobId ausente');
  await prisma.jobPost.update({ where: { id: jobId }, data: { scheduledFor: when } });
  revalidatePath('/admin/agenda');
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function markPublished(formData: FormData): Promise<void> {
  requireAdmin();
  const jobId = String(formData.get('jobId') ?? '');
  if (!jobId) throw new Error('jobId ausente');
  await prisma.jobPost.update({
    where: { id: jobId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
  revalidatePath('/admin/agenda');
  revalidatePath('/admin');
  revalidatePath(`/admin/jobs/${jobId}`);
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
