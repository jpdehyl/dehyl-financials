-- ===========================================
-- Estimates & Line Items Schema
-- ===========================================

-- Estimates table
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_amount DECIMAL(12,2) DEFAULT 0,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'imported')),
  drive_file_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  sent_date DATE,
  approved_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimate line items table
CREATE TABLE estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('labor', 'materials', 'equipment', 'subcontractors', 'permits', 'other')),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'each',
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_estimates_project_id ON estimates(project_id);
CREATE INDEX idx_estimate_line_items_estimate_id ON estimate_line_items(estimate_id);
CREATE INDEX idx_estimate_line_items_category ON estimate_line_items(category);

-- Trigger to update estimate total when line items change
CREATE OR REPLACE FUNCTION update_estimate_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE estimates
  SET total_amount = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM estimate_line_items
    WHERE estimate_id = COALESCE(NEW.estimate_id, OLD.estimate_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.estimate_id, OLD.estimate_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_estimate_total
AFTER INSERT OR UPDATE OR DELETE ON estimate_line_items
FOR EACH ROW
EXECUTE FUNCTION update_estimate_total();

-- Trigger to update estimates.updated_at on change
CREATE OR REPLACE FUNCTION update_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_estimates_updated_at
BEFORE UPDATE ON estimates
FOR EACH ROW
EXECUTE FUNCTION update_estimates_updated_at();

-- Enable RLS
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now - single user app)
CREATE POLICY "Allow all for estimates" ON estimates FOR ALL USING (true);
CREATE POLICY "Allow all for estimate_line_items" ON estimate_line_items FOR ALL USING (true);
