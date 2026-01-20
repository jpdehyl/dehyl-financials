-- DeHyl Project Financial System
-- Bids Table Migration
-- Created: 2026-01-19

-- ===========================================
-- Bids Table
-- ===========================================
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_code TEXT,
  client_name TEXT,
  description TEXT,
  submitted_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'won', 'lost', 'no-bid')),
  estimated_value DECIMAL(12,2),
  actual_value DECIMAL(12,2),
  drive_folder_id TEXT,
  converted_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_client_code ON bids(client_code);
CREATE INDEX idx_bids_submitted_date ON bids(submitted_date DESC);
CREATE INDEX idx_bids_converted_project ON bids(converted_project_id);

-- ===========================================
-- Updated At Trigger
-- ===========================================
CREATE TRIGGER update_bids_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Row Level Security
-- ===========================================
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for bids" ON bids FOR ALL USING (true);
