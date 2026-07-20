import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveGroup, generateGroupMessage } from '../src/lib/whatsappGroups';

test('nicho mapeia para o grupo certo', () => {
  assert.equal(resolveGroup({ niche: 'RESTAURANTE', roleTitle: 'Cozinheiro' }).key, 'GASTRONOMIA');
  assert.equal(resolveGroup({ niche: 'LOGISTICA', roleTitle: 'Ajudante' }).key, 'TRANSPORTE');
  assert.equal(resolveGroup({ niche: 'VAREJO', roleTitle: 'Vendedor' }).key, 'VAREJO');
  assert.equal(resolveGroup({ niche: 'SAUDE', roleTitle: 'Recepcionista' }).key, 'SAUDE');
  assert.equal(resolveGroup({ niche: 'ESCRITORIO', roleTitle: 'Assistente' }).key, 'ADMINISTRATIVO');
});

test('palavra-chave do cargo sobrepõe o nicho (Beleza / Serviços Gerais / Transporte)', () => {
  // cargo de beleza cadastrado como VAREJO cai em Beleza
  assert.equal(resolveGroup({ niche: 'VAREJO', roleTitle: 'Cabeleireiro(a)' }).key, 'BELEZA');
  // limpeza cadastrada como ESCRITORIO cai em Serviços Gerais
  assert.equal(resolveGroup({ niche: 'ESCRITORIO', roleTitle: 'Auxiliar de Limpeza' }).key, 'SERVICOS_GERAIS');
  // motoboy cadastrado como RESTAURANTE cai em Transporte
  assert.equal(resolveGroup({ niche: 'RESTAURANTE', roleTitle: 'Motoboy' }).key, 'TRANSPORTE');
});

test('mensagem do grupo inclui cargo, local, salário e link wa.me', () => {
  const { group, message } = generateGroupMessage({
    niche: 'RESTAURANTE',
    roleTitle: 'Auxiliar de Cozinha',
    companyName: 'Sabor Paulista',
    neighborhood: 'Centro',
    city: 'Mogi das Cruzes',
    contractType: 'CLT',
    salary: 'R$ 2.100',
    benefits: 'VT, VR',
    applicationMethod: 'WHATSAPP',
    applicationWhatsapp: '11 98888-7777',
    applicationLink: null,
  });
  assert.equal(group.key, 'GASTRONOMIA');
  assert.match(message, /Auxiliar de Cozinha/);
  assert.match(message, /Mogi das Cruzes/);
  assert.match(message, /R\$ 2\.100/);
  assert.match(message, /wa\.me\/5511988887777/); // adiciona DDI 55
  assert.match(message, /#Gastronomia/);
});

test('hashtag limpa pontuação do cargo', () => {
  const { message } = generateGroupMessage({
    niche: 'VAREJO',
    roleTitle: 'Cabeleireiro(a)',
    companyName: 'Studio Bella',
    neighborhood: 'Centro',
    city: 'Suzano',
    contractType: 'CLT',
    salary: 'R$ 1.800',
    benefits: null,
    applicationMethod: 'WHATSAPP',
    applicationWhatsapp: '11988887777',
    applicationLink: null,
  });
  assert.match(message, /#Cabeleireiroa\b/); // sem parênteses
  assert.doesNotMatch(message, /#Cabeleireiro\(a\)/);
});
