-- DeHyl Project Financial System
-- Add proper unique constraint on bids.drive_folder_id for upsert support
-- Created: 2026-01-24

-- Drop the partial unique index if it exists (it doesn't work with ON CONFLICT)
DROP INDEX IF EXISTS idx_bids_drive_folder_id;

-- Add a proper UNIQUE constraint on drive_folder_id
-- Note: PostgreSQL allows multiple NULL values with UNIQUE constraints
ALTER TABLE bids ADD CONSTRAINT bids_drive_folder_id_unique UNIQUE (drive_folder_id);
