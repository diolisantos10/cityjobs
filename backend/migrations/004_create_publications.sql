-- Migration 004: Create publications schedule table
CREATE TYPE publication_status AS ENUM (
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled',
  'manual_required'
);

CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id),

  -- Schedule
  scheduled_for TIMESTAMPTZ NOT NULL,
  sequence_order INTEGER DEFAULT 1,  -- 1st, 2nd, 3rd post in a package

  -- Instagram
  instagram_media_id VARCHAR(255),
  instagram_permalink VARCHAR(500),
  story_copy TEXT,
  art_url TEXT,

  -- Status
  status publication_status DEFAULT 'scheduled',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,

  -- Manual override
  manual_notes TEXT,
  approved_by VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publications_job_id ON publications(job_id);
CREATE INDEX idx_publications_scheduled_for ON publications(scheduled_for);
CREATE INDEX idx_publications_status ON publications(status);
