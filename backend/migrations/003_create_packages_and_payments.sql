-- Migration 003: Create packages and payments tables
CREATE TYPE package_type AS ENUM (
  'single_story',
  'multi_story_same_day',
  'multi_day_story',
  'highlight_7d'
);

CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type package_type UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,   -- stored in centavos to avoid float issues
  story_count INTEGER NOT NULL,
  days_span INTEGER,              -- for multi_day_story
  includes_highlight BOOLEAN DEFAULT FALSE,
  highlight_days INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default packages
INSERT INTO packages (type, name, description, price_cents, story_count, days_span, includes_highlight, highlight_days) VALUES
  ('single_story',        'Story Único',         '1 publicação no Stories do @cityjobs.sp',                    4900,  1, 1,    FALSE, NULL),
  ('multi_story_same_day','Stories do Dia',      '3 publicações no mesmo dia para máxima visibilidade',        9900,  3, 1,    FALSE, NULL),
  ('multi_day_story',     'Campanha Semanal',    '1 Story por dia durante 7 dias consecutivos',               24900,  7, 7,    FALSE, NULL),
  ('highlight_7d',        'Destaque Premium',    'Story + destaque fixo no perfil por 7 dias',                39900,  1, 7,    TRUE,  7);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'approved',
  'failed',
  'refunded',
  'disputed'
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id),

  -- Stripe
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),

  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status payment_status DEFAULT 'pending',

  -- Timestamps
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
