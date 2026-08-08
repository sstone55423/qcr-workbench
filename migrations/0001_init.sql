-- QCR Workbench v2 initial schema.
--
-- Mirrors the v1 local-vault entities (Project, Scenario, Treatment,
-- AuditEvent) but server-side in D1. IDs are client-generated UUID strings
-- (crypto.randomUUID) to match the existing frontend. FAIR estimates,
-- assumptions, tolerance, simulation summaries, and AI narratives are stored
-- as JSON text — the domain math in src/lib/qcr/ stays the source of truth and
-- runs unchanged over the parsed objects.
--
-- `owner_email` is the Cloudflare Access identity (Cf-Access-Authenticated-
-- User-Email); rows are scoped to it so a shared database still isolates users.

CREATE TABLE IF NOT EXISTS projects (
  id           TEXT PRIMARY KEY,
  owner_email  TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  tolerance    TEXT,                              -- JSON | null
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_email);

CREATE TABLE IF NOT EXISTS scenarios (
  id             TEXT PRIMARY KEY,
  project_id     TEXT NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  asset          TEXT,
  threat         TEXT,
  effect         TEXT,
  owner          TEXT,
  risk_statement TEXT,
  sample_id      TEXT,                            -- stable id for sample scenarios
  fair           TEXT NOT NULL,                   -- JSON: FAIR estimate model
  assumptions    TEXT,                            -- JSON | null
  simulation     TEXT,                            -- JSON summary+histogram | null (never the raw array)
  ai_narrative   TEXT,                            -- JSON | null (provenance-tracked)
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_scenarios_project ON scenarios(project_id);

CREATE TABLE IF NOT EXISTS treatments (
  id                        TEXT PRIMARY KEY,
  scenario_id               TEXT NOT NULL,
  name                      TEXT NOT NULL,
  annual_cost               REAL NOT NULL DEFAULT 0,
  frequency_reduction       REAL NOT NULL DEFAULT 0,
  vulnerability_reduction   REAL NOT NULL DEFAULT 0,
  primary_loss_reduction    REAL NOT NULL DEFAULT 0,
  secondary_loss_reduction  REAL NOT NULL DEFAULT 0,
  created_at                TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_treatments_scenario ON treatments(scenario_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   TEXT,
  owner_email  TEXT NOT NULL,
  category     TEXT NOT NULL,                     -- e.g. 'report', 'scenario', 'ai'
  message_key  TEXT NOT NULL,                     -- i18n key (language-neutral)
  params       TEXT,                              -- JSON | null
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_events(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_owner ON audit_events(owner_email);
