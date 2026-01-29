-- Migration: Daily Logs for Field Operations
-- Procore-style daily field reports

-- ===========================================
-- DAILY_LOGS Table
-- Main daily log record per project per day
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  
  -- Work summary
  work_summary TEXT,
  areas_worked TEXT[],
  
  -- Weather
  weather TEXT,
  weather_impact TEXT,
  temperature_high INTEGER,
  temperature_low INTEGER,
  
  -- Hours summary
  total_hours DECIMAL(6,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT, -- Not visible to clients
  
  -- Safety
  safety_meeting_held BOOLEAN DEFAULT false,
  incidents_reported BOOLEAN DEFAULT false,
  incident_details TEXT,
  
  -- Tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  source TEXT DEFAULT 'web', -- web, mobile, whatsapp
  source_message_id TEXT,
  
  -- Metadata
  created_by TEXT, -- user identifier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  
  -- One log per project per day
  CONSTRAINT unique_project_date UNIQUE (project_id, log_date)
);

-- ===========================================
-- DAILY_LOG_CREW Table
-- Crew hours for each daily log
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_log_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  
  -- Worker info
  worker_name TEXT NOT NULL,
  worker_type TEXT, -- employee, subcontractor
  company TEXT, -- For subcontractors
  
  -- Time
  hours_worked DECIMAL(4,2) NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Role/task
  role TEXT, -- superintendent, foreman, laborer, driver
  task_description TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- DAILY_LOG_MATERIALS Table
-- Materials used/delivered
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_log_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT, -- bags, sheets, cubic yards, etc.
  supplier TEXT,
  delivery_ticket TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- DAILY_LOG_EQUIPMENT Table
-- Equipment used on site
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_log_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  
  equipment_name TEXT NOT NULL,
  hours_used DECIMAL(4,2),
  rental_company TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- DAILY_LOG_VISITORS Table
-- Site visitors log
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_log_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  
  visitor_name TEXT NOT NULL,
  company TEXT,
  purpose TEXT,
  time_in TIME,
  time_out TIME,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_daily_logs_project ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project_date ON daily_logs(project_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_log_crew_log ON daily_log_crew(daily_log_id);

-- ===========================================
-- Update trigger
-- ===========================================
CREATE OR REPLACE FUNCTION update_daily_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_daily_logs_updated_at ON daily_logs;
CREATE TRIGGER trigger_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_logs_updated_at();

-- ===========================================
-- Auto-calculate total hours
-- ===========================================
CREATE OR REPLACE FUNCTION update_daily_log_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_logs
  SET total_hours = (
    SELECT COALESCE(SUM(hours_worked), 0)
    FROM daily_log_crew
    WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
  )
  WHERE id = COALESCE(NEW.daily_log_id, OLD.daily_log_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_total_hours ON daily_log_crew;
CREATE TRIGGER trigger_update_total_hours
  AFTER INSERT OR UPDATE OR DELETE ON daily_log_crew
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_log_total_hours();

-- ===========================================
-- RLS (Allow all for now)
-- ===========================================
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all daily_logs" ON daily_logs FOR ALL USING (true);
CREATE POLICY "Allow all daily_log_crew" ON daily_log_crew FOR ALL USING (true);
CREATE POLICY "Allow all daily_log_materials" ON daily_log_materials FOR ALL USING (true);
CREATE POLICY "Allow all daily_log_equipment" ON daily_log_equipment FOR ALL USING (true);
CREATE POLICY "Allow all daily_log_visitors" ON daily_log_visitors FOR ALL USING (true);

-- ===========================================
-- Comments
-- ===========================================
COMMENT ON TABLE daily_logs IS 'Daily field reports for each project';
COMMENT ON TABLE daily_log_crew IS 'Crew hours and assignments for daily logs';
COMMENT ON TABLE daily_log_materials IS 'Materials used or delivered';
COMMENT ON TABLE daily_log_equipment IS 'Equipment used on site';
COMMENT ON TABLE daily_log_visitors IS 'Site visitor log';
