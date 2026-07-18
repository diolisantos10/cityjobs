import { prisma } from './prisma';

// Defaults editáveis no /admin. Valores iniciais — o admin ajusta depois.
export const ART_PRICE_DEFAULTS = [
  { designCount: 1, label: '1 arte', priceInCents: 3900 },
  { designCount: 2, label: '2 artes', priceInCents: 6900 },
];

export async function ensureArtPriceConfigs() {
  const count = await prisma.artPriceConfig.count();
  if (count >= ART_PRICE_DEFAULTS.length) return;
  for (const cfg of ART_PRICE_DEFAULTS) {
    await prisma.artPriceConfig.upsert({
      where: { designCount: cfg.designCount },
      update: {},
      create: { ...cfg, active: true },
    });
  }
}

export async function getActiveArtPrices() {
  await ensureArtPriceConfigs();
  return prisma.artPriceConfig.findMany({
    where: { active: true },
    orderBy: { designCount: 'asc' },
  });
}

export async function getAllArtPrices() {
  await ensureArtPriceConfigs();
  return prisma.artPriceConfig.findMany({ orderBy: { designCount: 'asc' } });
}

/** Preço (em centavos) do add-on de criação para uma quantidade de designs. */
export async function artPriceForCount(designCount: number): Promise<number> {
  const cfg = await prisma.artPriceConfig.findFirst({
    where: { designCount, active: true },
  });
  return cfg?.priceInCents ?? 0;
}
