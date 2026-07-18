import type { Niche } from '@prisma/client';
import { NICHE_STORY_LABELS } from './constants';

/**
 * Design agent (Fase 2).
 *
 * Takes the client's design brief (anamnese) + the job data and produces a
 * DESIGN SPEC — palette, layout style, and the exact text lines — which the
 * renderer turns into a polished 1080×1920 story. The composition is code-
 * driven so text always renders crisp (image-generation models garble text).
 *
 * Deterministic core; an AI-copy hook can enrich the headline/CTA later when
 * ANTHROPIC_API_KEY is configured (see enrichCopyWithAI, unused by default).
 */

export interface DesignBrief {
  useLogo?: boolean;
  style?: string | null;
  colors?: string | null;
  notes?: string | null;
}

export interface DesignJob {
  niche: Niche;
  roleTitle: string;
  companyName: string;
  neighborhood: string;
  city: string;
  salary: string;
  benefits?: string | null;
  applicationMethod: 'WHATSAPP' | 'LINK' | 'EMAIL' | 'OTHER';
}

export type LayoutStyle = 'bold' | 'clean' | 'modern';

export interface Palette {
  bg: string;
  bgAccent: string; // secondary background tone
  accent: string; // bright highlight
  text: string;
  textMuted: string;
  onAccent: string; // text over the accent color
}

export interface DesignSpec {
  layout: LayoutStyle;
  palette: Palette;
  nicheLabel: string;
  role: string;
  company: string;
  location: string;
  salaryLine: string;
  cta: string;
}

// ─── Color parsing (nomes PT → hex) ──────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  vermelho: '#DC2626',
  laranja: '#EA580C',
  amarelo: '#F59E0B',
  dourado: '#D4A017',
  verde: '#16A34A',
  'verde escuro': '#166534',
  azul: '#2563EB',
  'azul escuro': '#1E3A8A',
  'azul claro': '#38BDF8',
  ciano: '#06B6D4',
  roxo: '#7C3AED',
  violeta: '#7C3AED',
  rosa: '#DB2777',
  pink: '#DB2777',
  marrom: '#92400E',
  preto: '#111827',
  cinza: '#4B5563',
  branco: '#FFFFFF',
};

const NICHE_ACCENT: Record<Niche, string> = {
  VAREJO: '#E11D48',
  SAUDE: '#0EA5E9',
  ESCRITORIO: '#4F46E5',
  RESTAURANTE: '#EA580C',
  LOGISTICA: '#0D9488',
};

function normalize(v: string): string {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Extract up to two brand colors from the free-text brief. */
function parseColors(colors: string | null | undefined): string[] {
  if (!colors) return [];
  const norm = normalize(colors);
  const found: string[] = [];
  // longer names first ("azul escuro" before "azul")
  const names = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (norm.includes(normalize(name)) && !found.includes(COLOR_MAP[name])) {
      found.push(COLOR_MAP[name]);
    }
    if (found.length >= 2) break;
  }
  return found;
}

function pickLayout(style: string | null | undefined, variant: number): LayoutStyle {
  const s = normalize(style || '');
  if (/clean|limpo|minimal|simples|elegante/.test(s)) return 'clean';
  if (/moderno|modern|tech|gradiente/.test(s)) return 'modern';
  if (/chamativ|forte|bold|vibrante|colorid/.test(s)) return 'bold';
  // sem dica → alterna por variante
  return variant % 2 === 0 ? 'clean' : 'bold';
}

// Darken a hex color toward black by a factor (0..1).
function darken(hex: string, factor: number): string {
  const n = hex.replace('#', '');
  const r = Math.round(parseInt(n.slice(0, 2), 16) * (1 - factor));
  const g = Math.round(parseInt(n.slice(2, 4), 16) * (1 - factor));
  const b = Math.round(parseInt(n.slice(4, 6), 16) * (1 - factor));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function buildPalette(job: DesignJob, brief: DesignBrief, layout: LayoutStyle): Palette {
  const colors = parseColors(brief.colors);
  const primary = colors[0] && colors[0] !== '#FFFFFF' ? colors[0] : NICHE_ACCENT[job.niche];
  const secondary = colors[1] && colors[1] !== '#FFFFFF' ? colors[1] : primary;

  if (layout === 'clean') {
    return {
      bg: '#FFFFFF',
      bgAccent: '#F3F4F6',
      accent: primary,
      text: '#111827',
      textMuted: '#6B7280',
      onAccent: '#FFFFFF',
    };
  }
  // bold / modern → fundo escuro derivado da cor da marca
  const bg = darken(primary, 0.82);
  return {
    bg,
    bgAccent: darken(primary, 0.7),
    accent: secondary,
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.75)',
    onAccent: '#FFFFFF',
  };
}

const CTA_BY_METHOD: Record<DesignJob['applicationMethod'], string> = {
  WHATSAPP: 'Candidate-se pelo WhatsApp',
  LINK: 'Candidate-se pelo link',
  EMAIL: 'Candidate-se por e-mail',
  OTHER: 'Candidate-se',
};

function salaryLine(job: DesignJob): string {
  const b = job.benefits?.trim();
  const s = job.salary.trim();
  if (!b) return s;
  const compact = b.replace(/\s*\n+\s*/g, ', ').replace(/\s+/g, ' ');
  const line = `${s} + ${compact}`;
  return line.length > 46 ? `${line.slice(0, 45).trimEnd()}…` : line;
}

/** Build the deterministic design spec for a given variant (1-based). */
export function buildDesignSpec(job: DesignJob, brief: DesignBrief, variant = 1): DesignSpec {
  const layout = pickLayout(brief.style, variant);
  const palette = buildPalette(job, brief, layout);
  return {
    layout,
    palette,
    nicheLabel: NICHE_STORY_LABELS[job.niche],
    role: job.roleTitle.trim(),
    company: job.companyName.trim(),
    location: `${job.neighborhood.trim()} – ${job.city.trim()}`,
    salaryLine: salaryLine(job),
    cta: CTA_BY_METHOD[job.applicationMethod],
  };
}
