'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

const schema = z.object({
  id: z.string().min(1),
  priceInCents: z.coerce.number().int().min(0, 'Preço inválido'),
  active: z.coerce.boolean(),
});

export async function updateArtPrice(formData: FormData): Promise<void> {
  requireAdmin();

  const priceReais = String(formData.get('priceReais') ?? '').replace(',', '.');
  const parsed = schema.safeParse({
    id: formData.get('id'),
    priceInCents: Math.round(parseFloat(priceReais) * 100),
    active: formData.get('active') === 'on',
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  await prisma.artPriceConfig.update({
    where: { id: parsed.data.id },
    data: { priceInCents: parsed.data.priceInCents, active: parsed.data.active },
  });

  revalidatePath('/admin/art-prices');
  revalidatePath('/anunciar');
}
