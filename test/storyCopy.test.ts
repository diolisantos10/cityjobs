import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateStoryCopy } from '../src/lib/storyCopy';

test('generates copy in the exact spec format', () => {
  const copy = generateStoryCopy({
    niche: 'ESCRITORIO',
    roleTitle: 'Auxiliar Administrativo',
    companyName: 'Empresa XPTO',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    salary: 'R$ 3.000',
    benefits: 'VT, VR',
    applicationMethod: 'WHATSAPP',
  });

  assert.equal(
    copy,
    ['[ESCRITÓRIO]', 'Auxiliar Administrativo', 'Empresa XPTO', '📍 Pinheiros – São Paulo', '💰 R$ 3.000 + VT, VR', '👉 Candidate-se pelo WhatsApp'].join('\n')
  );
});

test('salary is always visible even without benefits', () => {
  const copy = generateStoryCopy({
    niche: 'VAREJO',
    roleTitle: 'Vendedor',
    companyName: 'Loja Central',
    neighborhood: 'Sé',
    city: 'São Paulo',
    salary: 'R$ 1.800',
    benefits: null,
    applicationMethod: 'LINK',
  });

  assert.match(copy, /💰 R\$ 1\.800/);
  assert.ok(!copy.includes(' + '), 'should not append a benefits separator when there are none');
  assert.match(copy, /👉 Candidate-se pelo link/);
});

test('niche header is uppercase with accents', () => {
  const copy = generateStoryCopy({
    niche: 'SAUDE',
    roleTitle: 'Técnico de Enfermagem',
    companyName: 'Clínica Vida',
    neighborhood: 'Moema',
    city: 'São Paulo',
    salary: 'R$ 2.500',
    applicationMethod: 'EMAIL',
  });

  assert.ok(copy.startsWith('[SAÚDE]'));
  assert.match(copy, /👉 Candidate-se por e-mail/);
});

test('long benefits are truncated to keep the story concise', () => {
  const copy = generateStoryCopy({
    niche: 'LOGISTICA',
    roleTitle: 'Motorista',
    companyName: 'Transporta SP',
    neighborhood: 'Barra Funda',
    city: 'São Paulo',
    salary: 'R$ 3.200',
    benefits: 'Vale transporte, vale refeição, plano de saúde, plano odontológico, seguro de vida, cesta básica',
    applicationMethod: 'OTHER',
  });

  const salaryLine = copy.split('\n').find((l) => l.startsWith('💰'))!;
  assert.ok(salaryLine.length <= 80, 'salary+benefits line should stay concise');
  assert.ok(salaryLine.includes('…'), 'long benefits should be truncated with an ellipsis');
});
