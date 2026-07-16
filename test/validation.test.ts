import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jobPostSchema } from '../src/lib/validation';

function validBase(overrides: Record<string, unknown> = {}) {
  return {
    companyName: 'Padaria do João',
    cnpj: '',
    roleTitle: 'Atendente de Balcão',
    niche: 'VAREJO',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    contractType: 'CLT',
    salary: 'R$ 1.800',
    benefits: 'VT, VR',
    applicationMethod: 'WHATSAPP',
    applicationWhatsapp: '11999999999',
    applicationLink: '',
    selectedPlanDays: '3',
    confirmation: 'on',
    ...overrides,
  };
}

test('accepts a valid submission', () => {
  const result = jobPostSchema.safeParse(validBase());
  assert.ok(result.success);
});

test('rejects missing salary', () => {
  const result = jobPostSchema.safeParse(validBase({ salary: '' }));
  assert.ok(!result.success);
});

test('rejects missing company name', () => {
  const result = jobPostSchema.safeParse(validBase({ companyName: '' }));
  assert.ok(!result.success);
});

test('rejects generic role titles', () => {
  for (const title of ['vaga', 'trabalho', 'oportunidade', 'diversas vagas']) {
    const result = jobPostSchema.safeParse(validBase({ roleTitle: title }));
    assert.ok(!result.success, `"${title}" should be rejected`);
  }
});

test('requires WhatsApp when application method is WHATSAPP', () => {
  const result = jobPostSchema.safeParse(
    validBase({ applicationMethod: 'WHATSAPP', applicationWhatsapp: '' })
  );
  assert.ok(!result.success);
});

test('requires link when application method is LINK', () => {
  const result = jobPostSchema.safeParse(
    validBase({ applicationMethod: 'LINK', applicationWhatsapp: '', applicationLink: '' })
  );
  assert.ok(!result.success);
});

test('rejects invalid plan days', () => {
  const result = jobPostSchema.safeParse(validBase({ selectedPlanDays: '5' }));
  assert.ok(!result.success);
});

test('requires the truthfulness confirmation checkbox', () => {
  const result = jobPostSchema.safeParse(validBase({ confirmation: undefined }));
  assert.ok(!result.success);
});

test('accepts all three valid plan durations', () => {
  for (const days of ['1', '3', '7']) {
    const result = jobPostSchema.safeParse(validBase({ selectedPlanDays: days }));
    assert.ok(result.success, `plan ${days} should be valid`);
  }
});
