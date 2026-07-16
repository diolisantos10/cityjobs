import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTrust } from '../src/lib/trust';
import type { JobPostInput } from '../src/lib/validation';

function job(overrides: Partial<JobPostInput> = {}): JobPostInput {
  return {
    companyName: 'Padaria do João',
    cnpj: '12.345.678/0001-90',
    roleTitle: 'Atendente',
    niche: 'VAREJO',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    contractType: 'CLT',
    salary: 'R$ 1.800',
    benefits: 'VT, VR',
    applicationMethod: 'WHATSAPP',
    applicationWhatsapp: '11999999999',
    applicationLink: '',
    selectedPlanDays: 3,
    confirmation: 'on',
    ...overrides,
  } as JobPostInput;
}

test('clean job with CNPJ has zero risk', () => {
  const result = analyzeTrust(job());
  assert.equal(result.score, 0);
  assert.equal(result.flags.length, 0);
});

test('flags suspicious scam terms as high severity', () => {
  const result = analyzeTrust(job({ benefits: 'Ganhe dinheiro rápido, lucro garantido' }));
  const flag = result.flags.find((f) => f.code === 'suspicious_terms');
  assert.ok(flag);
  assert.equal(flag!.severity, 'high');
});

test('flags missing CNPJ as info', () => {
  const result = analyzeTrust(job({ cnpj: '' }));
  assert.ok(result.flags.some((f) => f.code === 'no_cnpj' && f.severity === 'info'));
});

test('flags unparseable salary', () => {
  const result = analyzeTrust(job({ salary: 'a combinar' }));
  assert.ok(result.flags.some((f) => f.code === 'salary_unparseable'));
});

test('flags generic/hidden company name', () => {
  const result = analyzeTrust(job({ companyName: 'Confidencial', cnpj: '' }));
  assert.ok(result.flags.some((f) => f.code === 'company_generic'));
});

test('flags unusually high salary for local jobs', () => {
  const result = analyzeTrust(job({ salary: 'R$ 45.000' }));
  assert.ok(result.flags.some((f) => f.code === 'salary_too_high'));
});

test('score increases with severity', () => {
  const clean = analyzeTrust(job());
  const risky = analyzeTrust(
    job({ companyName: 'Confidencial', cnpj: '', benefits: 'lucro garantido' })
  );
  assert.ok(risky.score > clean.score);
});
