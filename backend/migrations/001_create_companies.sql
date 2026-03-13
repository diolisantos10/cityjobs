-- Migration 001: Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(500),
  instagram_handle VARCHAR(100),
  address TEXT,
  neighborhood VARCHAR(100),
  city VARCHAR(100) DEFAULT 'São Paulo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_cnpj ON companies(cnpj);
