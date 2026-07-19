'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { checkIgCredentials } from '@/lib/instagram';

export interface RegionFormState {
  ok?: boolean;
  message?: string;
}

const schema = z.object({
  regionId: z.string().min(1),
  name: z.string().trim().min(2),
  instagramHandle: z.string().trim().min(2),
  igUserId: z.string().trim().optional().or(z.literal('')),
  igAccessToken: z.string().trim().optional().or(z.literal('')),
  active: z.coerce.boolean(),
});

export async function updateRegion(
  _prev: RegionFormState,
  formData: FormData
): Promise<RegionFormState> {
  requireAdmin();

  const parsed = schema.safeParse({
    regionId: formData.get('regionId'),
    name: formData.get('name'),
    instagramHandle: formData.get('instagramHandle'),
    igUserId: formData.get('igUserId'),
    igAccessToken: formData.get('igAccessToken'),
    active: formData.get('active') === 'on',
  });
  if (!parsed.success) return { ok: false, message: 'Dados inválidos.' };

  const d = parsed.data;

  // Token em branco = mantém o atual (não sobrescreve/apaga sem querer).
  const current = await prisma.region.findUnique({
    where: { id: d.regionId },
    select: { igAccessToken: true },
  });
  const token = d.igAccessToken ? d.igAccessToken : (current?.igAccessToken ?? null);

  await prisma.region.update({
    where: { id: d.regionId },
    data: {
      name: d.name,
      instagramHandle: d.instagramHandle,
      igUserId: d.igUserId || null,
      igAccessToken: token,
      active: d.active,
    },
  });

  revalidatePath('/admin/regioes');
  revalidatePath('/admin/agenda');

  // Valida as credenciais (sem publicar nada) para dar feedback imediato.
  if (d.igUserId && token) {
    const check = await checkIgCredentials({ igUserId: d.igUserId, igAccessToken: token });
    if (check.ok) {
      return { ok: true, message: `Salvo ✓ Conectado ao Instagram: @${check.username}` };
    }
    return { ok: false, message: `Salvo, mas as credenciais falharam: ${check.error}` };
  }

  return { ok: true, message: 'Salvo. (Sem credenciais do Instagram — publicação manual.)' };
}
