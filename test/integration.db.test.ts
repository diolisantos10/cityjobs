import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Integration tests that exercise the real database layer.
 * These require a reachable PostgreSQL and a generated Prisma client.
 *
 * Run with:  DATABASE_URL=postgresql://... npm run test:integration
 *
 * When DATABASE_URL is not set, the whole suite is skipped so the pure
 * unit suite (`npm test`) stays DB-free and CI-friendly.
 */

const HAS_DB = Boolean(process.env.DATABASE_URL);
const suite = HAS_DB ? test : test.skip;

// Dynamic imports so the file doesn't blow up when the client isn't generated.
let prisma: any;
let findOrCreateCompany: any;
let generateStoryCopy: any;
let analyzeTrust: any;

const MARKER = `itest_${process.pid}`;

before(async () => {
  if (!HAS_DB) return;
  ({ prisma } = await import('../src/lib/prisma'));
  ({ findOrCreateCompany } = await import('../src/lib/company'));
  ({ generateStoryCopy } = await import('../src/lib/storyCopy'));
  ({ analyzeTrust } = await import('../src/lib/trust'));
});

after(async () => {
  if (!HAS_DB || !prisma) return;
  // Clean up anything this run created.
  await prisma.jobPost.deleteMany({ where: { companyName: { startsWith: MARKER } } });
  await prisma.company.deleteMany({ where: { name: { startsWith: MARKER } } });
  await prisma.$disconnect();
});

suite('findOrCreateCompany dedupes by CNPJ regardless of formatting', async () => {
  const name = `${MARKER}_dedupe`;
  const id1 = await findOrCreateCompany({ name, cnpj: '12.345.678/0001-90' });
  const id2 = await findOrCreateCompany({ name, cnpj: '12345678000190' });
  assert.equal(id1, id2, 'same CNPJ (different formatting) should resolve to one company');
});

suite('findOrCreateCompany dedupes by name when no CNPJ', async () => {
  const name = `${MARKER}_noCnpj`;
  const id1 = await findOrCreateCompany({ name, cnpj: null });
  const id2 = await findOrCreateCompany({ name, cnpj: '' });
  assert.equal(id1, id2);
});

suite('a submission persists plan price, payment link, story copy and trust flags', async () => {
  const companyName = `${MARKER}_submit`;
  const plan = await prisma.planConfig.findFirst({ where: { days: 1, active: true } });
  assert.ok(plan, 'seed must provide a 1-day plan');

  const jobInput = {
    companyName,
    cnpj: '11.222.333/0001-44',
    roleTitle: 'Auxiliar de Cozinha',
    niche: 'RESTAURANTE' as const,
    neighborhood: 'Vila Mariana',
    city: 'São Paulo',
    contractType: 'CLT' as const,
    salary: 'R$ 2.100',
    benefits: 'VT, VR',
    applicationMethod: 'WHATSAPP' as const,
    applicationWhatsapp: '11988887777',
    applicationLink: '',
    selectedPlanDays: 1,
    confirmation: 'on' as const,
  };

  const companyId = await findOrCreateCompany({ name: companyName, cnpj: jobInput.cnpj });
  const storyCopy = generateStoryCopy({ ...jobInput, benefits: jobInput.benefits });
  const trust = analyzeTrust(jobInput);

  const job = await prisma.jobPost.create({
    data: {
      companyId,
      companyName: jobInput.companyName,
      cnpj: jobInput.cnpj,
      roleTitle: jobInput.roleTitle,
      niche: jobInput.niche,
      neighborhood: jobInput.neighborhood,
      city: jobInput.city,
      contractType: jobInput.contractType,
      salary: jobInput.salary,
      benefits: jobInput.benefits,
      applicationMethod: jobInput.applicationMethod,
      applicationWhatsapp: jobInput.applicationWhatsapp,
      selectedPlanDays: plan.days,
      priceInCents: plan.priceInCents,
      paymentLink: plan.paymentLink,
      status: 'AWAITING_PAYMENT',
      storyCopy,
      trustFlags: trust,
    },
  });

  assert.equal(job.priceInCents, plan.priceInCents);
  assert.equal(job.paymentLink, plan.paymentLink);
  assert.equal(job.status, 'AWAITING_PAYMENT');
  assert.ok(job.companyId, 'job should be linked to a company');
  assert.ok(job.storyCopy?.startsWith('[RESTAURANTE]'));
  assert.match(job.storyCopy!, /💰 R\$ 2\.100 \+ VT, VR/);
});
