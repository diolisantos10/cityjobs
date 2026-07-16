import type { JobPostInput } from './validation';

/**
 * Deterministic trust/risk heuristics computed at submission time.
 * These do NOT block submission — they flag the job for admin attention.
 * The result is stored in JobPost.trustFlags (JSON) and surfaced in admin.
 */

export interface TrustFlag {
  code: string;
  label: string;
  severity: 'info' | 'warning' | 'high';
}

export interface TrustResult {
  flags: TrustFlag[];
  score: number; // 0 = clean, higher = riskier
}

// Words that commonly signal scams / low-quality postings in local job ads.
const SUSPICIOUS_TERMS = [
  'ganhe dinheiro',
  'renda extra garantida',
  'trabalhe de casa',
  'seja seu proprio chefe',
  'seja seu próprio chefe',
  'sem experiencia e ganhe',
  'sem experiência e ganhe',
  'lucro garantido',
  'investimento inicial',
  'taxa de cadastro',
  'deposito',
  'depósito',
  'pix adiantado',
  'marketing multinivel',
  'marketing multinível',
  'ganhos ilimitados',
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Extract the largest number found in a salary string (handles "R$ 2.500", "2500", "2.000 a 2.500").
function extractSalaryValue(salary: string): number | null {
  const cleaned = salary.replace(/r\$/gi, ' ');
  const matches = cleaned.match(/\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?|\d+/g);
  if (!matches) return null;

  const values = matches
    .map((m) => {
      const normalizedNum = m.replace(/[.\s]/g, '').replace(',', '.');
      return parseFloat(normalizedNum);
    })
    .filter((n) => !Number.isNaN(n));

  if (values.length === 0) return null;
  return Math.max(...values);
}

const MINIMUM_REASONABLE_SALARY = 400; // below this, likely a typo or bad data
const HIGH_SALARY_THRESHOLD = 30000; // above this for local jobs, worth a look

export function analyzeTrust(data: JobPostInput): TrustResult {
  const flags: TrustFlag[] = [];

  const haystack = normalize(
    [data.roleTitle, data.companyName, data.benefits ?? '', data.salary].join(' ')
  );

  // 1. Suspicious scam-like terms
  const matchedTerms = SUSPICIOUS_TERMS.filter((term) => haystack.includes(normalize(term)));
  if (matchedTerms.length > 0) {
    flags.push({
      code: 'suspicious_terms',
      label: `Termos suspeitos: ${matchedTerms.join(', ')}`,
      severity: 'high',
    });
  }

  // 2. Salary sanity checks
  const salaryValue = extractSalaryValue(data.salary);
  if (salaryValue === null) {
    flags.push({
      code: 'salary_unparseable',
      label: 'Salário informado sem valor numérico claro',
      severity: 'warning',
    });
  } else if (salaryValue < MINIMUM_REASONABLE_SALARY) {
    flags.push({
      code: 'salary_too_low',
      label: `Salário muito baixo (R$ ${salaryValue}) — verificar`,
      severity: 'warning',
    });
  } else if (salaryValue > HIGH_SALARY_THRESHOLD) {
    flags.push({
      code: 'salary_too_high',
      label: `Salário incomum para vaga local (R$ ${salaryValue}) — verificar`,
      severity: 'info',
    });
  }

  // 3. Company name looks generic / low-trust
  const companyNormalized = normalize(data.companyName).trim();
  if (companyNormalized.length < 3) {
    flags.push({
      code: 'company_too_short',
      label: 'Nome da empresa muito curto',
      severity: 'warning',
    });
  }
  if (/^(empresa|confidencial|sigiloso|a definir)$/i.test(companyNormalized)) {
    flags.push({
      code: 'company_generic',
      label: 'Nome da empresa genérico/oculto',
      severity: 'high',
    });
  }

  // 4. No CNPJ provided (info only — CNPJ is optional but adds trust)
  if (!data.cnpj || data.cnpj.trim() === '') {
    flags.push({
      code: 'no_cnpj',
      label: 'Sem CNPJ informado',
      severity: 'info',
    });
  }

  const severityWeight = { info: 1, warning: 3, high: 6 };
  const score = flags.reduce((sum, f) => sum + severityWeight[f.severity], 0);

  return { flags, score };
}
