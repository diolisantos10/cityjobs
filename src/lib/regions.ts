import { prisma } from './prisma';

// Auto-seed defensivo caso o banco esteja vazio (além do seed da migration).
export async function ensureDefaultRegion() {
  const count = await prisma.region.count();
  if (count > 0) return;
  await prisma.region.create({
    data: {
      name: 'São Paulo e Grande São Paulo',
      slug: 'sp',
      instagramHandle: '@cityjobs.sp',
      active: true,
      isDefault: true,
    },
  });
}

/** Região padrão para atribuir a novas vagas (por enquanto uma só). */
export async function getDefaultRegion() {
  await ensureDefaultRegion();
  return (
    (await prisma.region.findFirst({ where: { isDefault: true, active: true } })) ??
    (await prisma.region.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } }))
  );
}

export async function getAllRegions() {
  await ensureDefaultRegion();
  return prisma.region.findMany({ orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] });
}

/** A região tem credenciais da Meta configuradas? */
export function regionCanAutoPublish(region: { igUserId: string | null; igAccessToken: string | null }): boolean {
  return Boolean(region.igUserId && region.igAccessToken);
}
