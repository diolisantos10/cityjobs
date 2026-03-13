-- Migration 002: Create jobs table
CREATE TYPE job_status AS ENUM (
  'pending_payment',
  'payment_approved',
  'under_review',
  'approved',
  'rejected',
  'published',
  'completed',
  'cancelled'
);

CREATE TYPE job_niche AS ENUM (
  'varejo',
  'saude',
  'escritorio',
  'restaurante',
  'logistica',
  'outros'
);

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'blocked');

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Job details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  benefits TEXT,
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_display VARCHAR(100),    -- e.g. "R$ 2.000 - R$ 2.500"
  contract_type VARCHAR(50),      -- CLT, PJ, Estágio, Freelance
  work_model VARCHAR(50),         -- Presencial, Híbrido, Remoto
  location VARCHAR(255),
  neighborhood VARCHAR(100),

  -- Classification
  niche job_niche,
  niche_confidence DECIMAL(5,2),  -- 0-100%
  niche_tags TEXT[],

  -- Status & Risk
  status job_status DEFAULT 'pending_payment',
  risk_level risk_level DEFAULT 'low',
  risk_score DECIMAL(5,2),        -- 0-100
  risk_flags JSONB DEFAULT '[]',
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Generated content
  story_copy TEXT,
  story_copy_generated_at TIMESTAMPTZ,
  art_url TEXT,
  art_generated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_niche ON jobs(niche);
CREATE INDEX idx_jobs_risk_level ON jobs(risk_level);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
