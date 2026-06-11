import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLAN_DEFAULTS = [
  {
    days: 1,
    label: '1 dia',
    priceInCents: 2900,
    paymentLink: 'https://mpago.li/1q7LgWX',
  },
  {
    days: 3,
    label: '3 dias',
    priceInCents: 4900,
    paymentLink: 'https://mpago.li/1TqHkoe',
  },
  {
    days: 7,
    label: '7 dias (destaque)',
    priceInCents: 7900,
    paymentLink: 'https://mpago.li/23cDcPh',
  },
];

async function main() {
  for (const plan of PLAN_DEFAULTS) {
    await prisma.planConfig.upsert({
      where: { days: plan.days },
      update: {},
      create: { ...plan, active: true },
    });
    console.log(`PlanConfig seeded: ${plan.label} — R$ ${(plan.priceInCents / 100).toFixed(2)}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
