-- DeHyl Project Financial System
-- Initial Database Schema
-- Created: 2026-01-19

-- Note: Using gen_random_uuid() which is built into Supabase/PostgreSQL 13+

-- ===========================================
-- Projects Table (cached from Google Drive)
-- ===========================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  client_code TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  estimate_amount DECIMAL(12,2),
  estimate_drive_id TEXT,
  has_pbs BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Invoices Table (cached from QuickBooks)
-- ===========================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qb_id TEXT UNIQUE NOT NULL,
  invoice_number TEXT,
  client_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  issue_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  match_confidence TEXT CHECK (match_confidence IN ('high', 'medium', 'low')),
  memo TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Bills Table (cached from QuickBooks)
-- ===========================================
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qb_id TEXT UNIQUE NOT NULL,
  vendor_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  bill_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  memo TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Client Mappings Table
-- ===========================================
CREATE TABLE client_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  qb_customer_name TEXT,
  display_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}'
);

-- ===========================================
-- OAuth Tokens Table
-- ===========================================
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  realm_id TEXT, -- QuickBooks company ID
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider)
);

-- ===========================================
-- Sync Log Table
-- ===========================================
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ===========================================
-- Insert Default Client Mappings
-- ===========================================
INSERT INTO client_mappings (code, qb_customer_name, display_name, aliases) VALUES
  ('CD', 'Certified Demolition Inc.', 'Certified Demolition', ARRAY['CertDemo', 'Cert Demolition']),
  ('ADR', 'ADR Construction', 'ADR Construction', ARRAY['ADR']),
  ('R&S', 'Russell & Sons Enterprises Inc.', 'Russell & Sons', ARRAY['Russell', 'R&S Enterprises']);

-- ===========================================
-- Create Indexes for Performance
-- ===========================================
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_client_code ON projects(client_code);

CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_client_name ON invoices(client_name);

CREATE INDEX idx_bills_project ON bills(project_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);

CREATE INDEX idx_sync_log_source ON sync_log(source);
CREATE INDEX idx_sync_log_started_at ON sync_log(started_at DESC);

-- ===========================================
-- Updated At Trigger Function
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Row Level Security (RLS)
-- For future multi-user support
-- ===========================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (single user)
-- These policies can be refined for multi-user access later
CREATE POLICY "Allow all for projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all for bills" ON bills FOR ALL USING (true);
CREATE POLICY "Allow all for client_mappings" ON client_mappings FOR ALL USING (true);
CREATE POLICY "Allow all for oauth_tokens" ON oauth_tokens FOR ALL USING (true);
CREATE POLICY "Allow all for sync_log" ON sync_log FOR ALL USING (true);
