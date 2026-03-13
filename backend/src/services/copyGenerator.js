/**
 * CopyGenerator
 * Generates Instagram Story copy for job postings.
 * Uses Claude API (Anthropic) for production-quality copy.
 * Falls back to a template engine if API is unavailable.
 */

const Anthropic = require('@anthropic-ai/sdk').default;

const NICHE_EMOJIS = {
  varejo: '🛍️',
  saude: '💊',
  escritorio: '💼',
  restaurante: '🍴',
  logistica: '🚚',
  outros: '📋',
};

const NICHE_HASHTAGS = {
  varejo:      '#vagasvarejo #vendas #atendimento',
  saude:       '#vagassaude #saude #clinica',
  escritorio:  '#vagasadmin #escritorio #corporativo',
  restaurante: '#vagasrestaurante #gastronomia #cozinha',
  logistica:   '#vagaslogistica #motorista #entrega',
  outros:      '#vagas #emprego',
};

function formatSalary(job) {
  if (job.salary_display) return job.salary_display;
  if (job.salary_min && job.salary_max) {
    return `R$ ${job.salary_min.toLocaleString('pt-BR')} – R$ ${job.salary_max.toLocaleString('pt-BR')}`;
  }
  if (job.salary_min) return `A partir de R$ ${job.salary_min.toLocaleString('pt-BR')}`;
  return null;
}

/**
 * Generate copy using Claude API
 */
async function generateWithClaude(job, company) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const salary = formatSalary(job);
  const prompt = `Você é redator de conteúdo para o Instagram @cityjobs.sp, perfil de vagas de emprego em São Paulo.
Crie um texto para Instagram Story (máximo 220 caracteres visíveis + emojis) para a vaga abaixo.
Seja direto, entusiasmado, use emojis relevantes. Inclua cargo, empresa, salário e como se candidatar.
Termine com: "Curta e salve! 👆 Link na bio"

VAGA:
Cargo: ${job.title}
Empresa: ${company.name}
Salário: ${salary || 'não informado'}
Local: ${job.neighborhood || job.location || 'São Paulo/SP'}
Tipo: ${job.contract_type || 'CLT'}
Modelo: ${job.work_model || 'Presencial'}
Nicho: ${job.niche || 'outros'}

Retorne APENAS o texto do story, sem explicações.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].text.trim();
}

/**
 * Template fallback
 */
function generateFromTemplate(job, company) {
  const emoji = NICHE_EMOJIS[job.niche] || '📋';
  const salary = formatSalary(job);
  const location = job.neighborhood || job.location || 'São Paulo/SP';
  const hashtags = NICHE_HASHTAGS[job.niche] || NICHE_HASHTAGS.outros;

  return [
    `${emoji} VAGA ABERTA!`,
    ``,
    `🏢 ${company.name}`,
    `💼 ${job.title}`,
    salary ? `💰 ${salary}` : '',
    `📍 ${location}`,
    `📄 ${job.contract_type || 'CLT'} | ${job.work_model || 'Presencial'}`,
    ``,
    `✅ Curta e salve! 👆 Link na bio`,
    ``,
    `#vagas #emprego #saopaulosp ${hashtags}`,
  ].filter(line => line !== null && line !== undefined).join('\n');
}

/**
 * Main export
 * @param {Object} job
 * @param {Object} company
 * @returns {Promise<string>}
 */
async function generateStoryCopy(job, company) {
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      return await generateWithClaude(job, company);
    }
  } catch (err) {
    console.warn('[CopyGenerator] Claude API failed, using template:', err.message);
  }
  return generateFromTemplate(job, company);
}

module.exports = { generateStoryCopy };
