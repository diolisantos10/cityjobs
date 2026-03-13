/**
 * RiskAnalysis
 * Analyzes job postings for fraud signals, missing required fields,
 * and suspicious patterns before publication.
 *
 * RULES (hard blocks):
 *  - No salary information → blocked
 *  - No company name → blocked
 *  - Known fraud patterns → blocked
 *
 * Scoring: 0-100 (higher = riskier)
 *  - 0-30   → low
 *  - 31-60  → medium
 *  - 61-80  → high
 *  - 81-100 → blocked
 */

const FRAUD_KEYWORDS = [
  'ganhe dinheiro fácil', 'trabalhe em casa sem sair', 'renda extra garantida',
  'pirâmide', 'marketing multinível', 'mlm', 'investimento garantido',
  'sem experiência e ganhe muito', 'depósito antecipado', 'pague para trabalhar',
  'taxa de cadastro', 'kit inicial obrigatório', 'faça seu próprio horário sem limite',
  'vaga urgente para qualquer pessoa', 'não precisa de experiência e salário alto',
];

const SUSPICIOUS_KEYWORDS = [
  'renda extra', 'trabalhe em casa', 'ganhe de ', 'comissão alta',
  'sem experiência', 'qualquer pessoa pode', 'alta remuneração',
  'oportunidade única', 'não perca', 'vagas limitadas hoje',
];

const MISSING_SALARY_PHRASES = ['a combinar', 'a definir', 'sigiloso'];

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function containsAny(text, keywords) {
  const norm = normalizeText(text);
  return keywords.filter(kw => norm.includes(normalizeText(kw)));
}

/**
 * @param {Object} job
 * @param {Object} company
 * @returns {{ risk_level: string, risk_score: number, risk_flags: string[], blocked: boolean }}
 */
function analyzeRisk(job, company) {
  const flags = [];
  let score = 0;
  let blocked = false;

  const fullText = `${job.title} ${job.description} ${job.requirements || ''} ${job.benefits || ''}`;

  // ─── Hard blocks ───────────────────────────────────────────────────────────

  // No salary at all
  const hasSalary = job.salary_min || job.salary_max || job.salary_display;
  const salaryDisplay = normalizeText(job.salary_display || '');
  const hiddenSalary = MISSING_SALARY_PHRASES.some(p => salaryDisplay.includes(p));

  if (!hasSalary || hiddenSalary) {
    flags.push('missing_salary');
    score += 50;
    blocked = true;
  }

  // No company name
  if (!company || !company.name || company.name.trim().length < 3) {
    flags.push('missing_company');
    score += 50;
    blocked = true;
  }

  // Known fraud patterns
  const fraudMatches = containsAny(fullText, FRAUD_KEYWORDS);
  if (fraudMatches.length > 0) {
    flags.push(`fraud_keywords: ${fraudMatches.join(', ')}`);
    score += 60;
    blocked = true;
  }

  // ─── Soft signals ──────────────────────────────────────────────────────────

  // Suspicious keywords
  const suspiciousMatches = containsAny(fullText, SUSPICIOUS_KEYWORDS);
  if (suspiciousMatches.length >= 2) {
    flags.push(`suspicious_keywords: ${suspiciousMatches.join(', ')}`);
    score += 20;
  }

  // Unrealistically high salary for simple jobs
  if (job.salary_min && job.salary_min > 20000) {
    flags.push('unusually_high_salary');
    score += 15;
  }

  // Very short description (lazy or fake)
  if (job.description && job.description.length < 80) {
    flags.push('description_too_short');
    score += 10;
  }

  // Excessive caps or exclamation marks
  const capsRatio = (job.description || '').replace(/[^A-Z]/g, '').length /
                    Math.max((job.description || '').replace(/[^a-zA-Z]/g, '').length, 1);
  if (capsRatio > 0.4) {
    flags.push('excessive_caps');
    score += 10;
  }

  // No requirements listed
  if (!job.requirements || job.requirements.trim().length < 10) {
    flags.push('no_requirements');
    score += 5;
  }

  // No contact / location
  if (!job.location && !job.neighborhood) {
    flags.push('no_location');
    score += 10;
  }

  // ─── Determine risk level ──────────────────────────────────────────────────

  const clampedScore = Math.min(score, 100);
  let risk_level;

  if (blocked || clampedScore >= 81) {
    risk_level = 'blocked';
    blocked = true;
  } else if (clampedScore >= 61) {
    risk_level = 'high';
  } else if (clampedScore >= 31) {
    risk_level = 'medium';
  } else {
    risk_level = 'low';
  }

  return {
    risk_level,
    risk_score: clampedScore,
    risk_flags: flags,
    blocked,
  };
}

module.exports = { analyzeRisk };
