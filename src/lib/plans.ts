import { prisma } from './prisma';

export const PLAN_DEFAULTS = [
  { days: 1, label: '1 dia', priceInCents: 2900, paymentLink: 'https://mpago.li/1q7LgWX' },
  { days: 3, label: '3 dias', priceInCents: 4900, paymentLink: 'https://mpago.li/1TqHkoe' },
  { days: 7, label: '7 dias (destaque)', priceInCents: 7900, paymentLink: 'https://mpago.li/23cDcPh' },
];

/**
 * Ensures the 3 default plans exist (auto-seed safety net for fresh databases).
 * Never overwrites values edited by the admin.
 */
export async function ensurePlanConfigs() {
  const count = await prisma.planConfig.count();
  if (count >= PLAN_DEFAULTS.length) return;

  for (const plan of PLAN_DEFAULTS) {
    await prisma.planConfig.upsert({
      where: { days: plan.days },
      update: {},
      create: { ...plan, active: true },
    });
  }
}

export async function getActivePlans() {
  await ensurePlanConfigs();
  return prisma.planConfig.findMany({
    where: { active: true },
    orderBy: { days: 'asc' },
  });
}

export async function getAllPlans() {
  await ensurePlanConfigs();
  return prisma.planConfig.findMany({ orderBy: { days: 'asc' } });
}
