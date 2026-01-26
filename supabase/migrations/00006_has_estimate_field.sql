-- DeHyl Project Financial System
-- Add has_estimate boolean field to projects table
-- Created: 2026-01-24

-- Add has_estimate field to track whether a project has an estimate file/folder
-- This is separate from estimate_amount (which tracks the dollar value)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS has_estimate BOOLEAN DEFAULT false;

-- Backfill has_estimate based on existing estimate_drive_id values
UPDATE projects SET has_estimate = true WHERE estimate_drive_id IS NOT NULL;

-- Create index for filtering by estimate status
CREATE INDEX IF NOT EXISTS idx_projects_has_estimate ON projects(has_estimate);
