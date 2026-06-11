'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { planConfigSchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/adminAuth';
import { ensurePlanConfigs } from '@/lib/plans';

export async function updatePlanConfig(formData: FormData): Promise<void> {
  requireAdmin();

  // Price arrives in reais from the form; convert to cents.
  const priceReais = String(formData.get('priceReais') ?? '').replace(',', '.');
  const priceInCents = Math.round(parseFloat(priceReais) * 100);

  const parsed = planConfigSchema.safeParse({
    planId: formData.get('planId'),
    priceInCents,
    paymentLink: formData.get('paymentLink'),
    active: formData.get('active') === 'on',
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados do plano inválidos');
  }

  await prisma.planConfig.update({
    where: { id: parsed.data.planId },
    data: {
      priceInCents: parsed.data.priceInCents,
      paymentLink: parsed.data.paymentLink,
      active: parsed.data.active,
    },
  });

  revalidatePath('/admin/plans');
  revalidatePath('/anunciar');
}

export async function seedPlanConfigs(): Promise<void> {
  requireAdmin();
  await ensurePlanConfigs();
  revalidatePath('/admin/plans');
}
