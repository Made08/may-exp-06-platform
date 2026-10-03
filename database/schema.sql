-- ============================================================================
-- MAY-EXP-06 · DDL idempotente (PostgreSQL 16 / Neon) — aislamiento multitenant
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE var_role AS ENUM
  ('INDEPENDENT','DEPENDENT','COVARIATE','IDENTIFIER','DERIVED','EVIDENCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('RESEARCH_ADMIN','RESEARCHER','ORGANIZATION_ADMIN','DATA_CONTRIBUTOR','VIEWER','AUDITOR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS experiment_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  version TEXT NOT NULL, protocol_version TEXT NOT NULL,
  configuration JSONB NOT NULL, preregistration JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, version));

CREATE TABLE IF NOT EXISTS research_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  code TEXT NOT NULL, statement TEXT NOT NULL,
  UNIQUE (experiment_id, code));

CREATE TABLE IF NOT EXISTS hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  code TEXT NOT NULL, statement TEXT NOT NULL,
  htype TEXT NOT NULL CHECK (htype IN ('H0','H1')),
  is_confirmatory BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (experiment_id, code));

CREATE TABLE IF NOT EXISTS variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL, scientific_role var_role NOT NULL,
  data_type TEXT NOT NULL, unit TEXT, definition TEXT,
  allowed_min DOUBLE PRECISION, allowed_max DOUBLE PRECISION,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (experiment_id, name));

CREATE TABLE IF NOT EXISTS metric_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  code TEXT NOT NULL, name TEXT NOT NULL, formula TEXT NOT NULL,
  unit TEXT, is_primary BOOLEAN NOT NULL DEFAULT TRUE, definition_source TEXT NOT NULL,
  UNIQUE (experiment_id, code));

CREATE TABLE IF NOT EXISTS acceptance_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  hypothesis_id UUID REFERENCES hypotheses(id) ON DELETE CASCADE,
  metric_code TEXT NOT NULL, operator TEXT NOT NULL,
  threshold DOUBLE PRECISION,          -- NULL ⇒ PENDIENTE_DE_DEFINICION
  threshold_source TEXT NOT NULL, description TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  code TEXT NOT NULL, statement TEXT NOT NULL,
  UNIQUE (experiment_id, code));

CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  data_mode TEXT NOT NULL CHECK (data_mode IN ('REAL','SYNTHETIC','MIXED')),
  source TEXT NOT NULL, schema_version TEXT NOT NULL, protocol_version TEXT NOT NULL,
  checksum TEXT NOT NULL, record_count INT NOT NULL DEFAULT 0,
  valid_records INT NOT NULL DEFAULT 0, invalid_records INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'RAW' CHECK (status IN ('RAW','VALIDATED','ANALYZED','REJECTED')),
  quality JSONB, uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS dataset_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  filename TEXT NOT NULL, checksum TEXT NOT NULL, size_bytes BIGINT NOT NULL,
  raw_content BYTEA, uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS dataset_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  source TEXT NOT NULL, data JSONB NOT NULL,
  is_valid BOOLEAN NOT NULL, validation_errors JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS processing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  experiment_id UUID NOT NULL REFERENCES experiments(id),
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','COMPLETED','FAILED')),
  protocol_version TEXT NOT NULL, schema_version TEXT NOT NULL, algorithm_version TEXT NOT NULL,
  configuration JSONB, dataset_hash TEXT, analysis_hash TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(), finished_at TIMESTAMPTZ, error TEXT);

CREATE TABLE IF NOT EXISTS processing_run_datasets (
  run_id UUID NOT NULL REFERENCES processing_runs(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES datasets(id),
  PRIMARY KEY (run_id, dataset_id));

CREATE TABLE IF NOT EXISTS metric_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES processing_runs(id) ON DELETE CASCADE,
  metric_code TEXT NOT NULL, arm TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL, ci_low DOUBLE PRECISION, ci_high DOUBLE PRECISION, n INT NOT NULL);

CREATE TABLE IF NOT EXISTS statistical_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES processing_runs(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL, comparison JSONB NOT NULL,
  statistic DOUBLE PRECISION, p_value DOUBLE PRECISION,
  effect_size DOUBLE PRECISION, effect_type TEXT,
  ci_low DOUBLE PRECISION, ci_high DOUBLE PRECISION, method TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS hypothesis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES processing_runs(id) ON DELETE CASCADE,
  hypothesis_id UUID NOT NULL REFERENCES hypotheses(id),
  status TEXT NOT NULL,
  statistical_criterion TEXT NOT NULL, practical_criterion TEXT NOT NULL,
  robustness_criterion TEXT NOT NULL, traceability_criterion TEXT NOT NULL, notes TEXT);

CREATE TABLE IF NOT EXISTS claim_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES processing_runs(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES claims(id),
  status TEXT NOT NULL, rationale TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES processing_runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('INGESTION','VALIDATION','RESULT','MANIFEST')),
  content JSONB NOT NULL, checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  mode TEXT NOT NULL CHECK (mode IN ('LAST_RUN','CUMULATIVE')),
  run_scope JSONB NOT NULL, content JSONB NOT NULL,
  dataset_hash TEXT, analysis_hash TEXT, report_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  event TEXT NOT NULL, entity_type TEXT, entity_id TEXT, metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  policy_version TEXT NOT NULL, accepted BOOLEAN NOT NULL, ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE INDEX IF NOT EXISTS idx_datasets_org ON datasets(organization_id);
CREATE INDEX IF NOT EXISTS idx_records_dataset ON dataset_records(dataset_id);
CREATE INDEX IF NOT EXISTS idx_runs_org ON processing_runs(organization_id, started_at);
CREATE INDEX IF NOT EXISTS idx_metric_run ON metric_results(run_id);
CREATE INDEX IF NOT EXISTS idx_stats_run ON statistical_results(run_id);
CREATE INDEX IF NOT EXISTS idx_evidence_run ON evidence(run_id);
