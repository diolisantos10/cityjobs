/**
 * NicheClassifier
 * Classifies job postings into predefined niches using keyword matching
 * with confidence scoring. A Claude API call can enhance this in production.
 */

const NICHE_KEYWORDS = {
  varejo: {
    primary: ['vendedor', 'venda', 'atendente', 'caixa', 'loja', 'balconista', 'estoquista',
              'reposição', 'pdv', 'varejo', 'comércio', 'promotor', 'merchandising'],
    secondary: ['cliente', 'produto', 'shopping', 'moda', 'roupas', 'calçados', 'boutique'],
  },
  saude: {
    primary: ['enfermeiro', 'técnico de enfermagem', 'cuidador', 'farmácia', 'farmacêutico',
              'clínica', 'hospital', 'médico', 'dentista', 'fisioterapeuta', 'nutricionista',
              'psicólogo', 'saúde', 'consultório', 'recepcionista de clínica'],
    secondary: ['cuidado', 'paciente', 'tratamento', 'wellness', 'estética'],
  },
  escritorio: {
    primary: ['administrativo', 'assistente administrativo', 'recepcionista', 'secretária',
              'analista', 'coordenador', 'gerente', 'financeiro', 'contábil', 'rh',
              'recursos humanos', 'ti', 'desenvolvedor', 'programador', 'marketing',
              'designer', 'copywriter'],
    secondary: ['escritório', 'office', 'corporativo', 'home office', 'remoto', 'híbrido'],
  },
  restaurante: {
    primary: ['garçom', 'garçonete', 'cozinheiro', 'auxiliar de cozinha', 'chef', 'sous chef',
              'cumim', 'barman', 'bartender', 'padeiro', 'confeiteiro', 'pizzaiolo',
              'restaurante', 'lanchonete', 'delivery', 'motoboy de delivery'],
    secondary: ['cozinha', 'alimentos', 'buffet', 'café', 'bar', 'alimentação'],
  },
  logistica: {
    primary: ['motorista', 'entregador', 'motoboy', 'auxiliar de logística', 'operador de empilhadeira',
              'ajudante de carga', 'separador', 'conferente', 'expedição', 'armazém',
              'estoque', 'almoxarife', 'operador logístico'],
    secondary: ['transporte', 'frota', 'caminhão', 'van', 'clt motorista', 'supply chain'],
  },
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function scoreText(text, keywords) {
  const normalized = normalizeText(text);
  let score = 0;
  for (const kw of keywords) {
    if (normalized.includes(normalizeText(kw))) {
      score++;
    }
  }
  return score;
}

/**
 * @param {Object} job - { title, description, requirements }
 * @returns {{ niche: string, confidence: number, tags: string[] }}
 */
function classifyNiche(job) {
  const text = `${job.title} ${job.description} ${job.requirements || ''}`;

  const scores = {};
  const matchedTags = {};

  for (const [niche, { primary, secondary }] of Object.entries(NICHE_KEYWORDS)) {
    const primaryScore = scoreText(text, primary) * 2;
    const secondaryScore = scoreText(text, secondary);
    scores[niche] = primaryScore + secondaryScore;

    // Collect matched tags
    const tags = [];
    for (const kw of [...primary, ...secondary]) {
      if (normalizeText(text).includes(normalizeText(kw))) {
        tags.push(kw);
      }
    }
    matchedTags[niche] = tags;
  }

  const sortedNiches = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [bestNiche, bestScore] = sortedNiches[0];

  if (bestScore === 0) {
    return { niche: 'outros', confidence: 0, tags: [] };
  }

  const totalScore = sortedNiches.reduce((sum, [, s]) => sum + s, 0);
  const confidence = Math.round((bestScore / totalScore) * 100);

  return {
    niche: bestNiche,
    confidence,
    tags: matchedTags[bestNiche].slice(0, 5),
  };
}

module.exports = { classifyNiche };
