/**
 * Import Historical Data from Google Drive
 *
 * This script fetches folder structures from Google Drive and imports them
 * into Supabase as bids and projects.
 *
 * Usage: npm run import:history
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { GoogleDriveClient } from "../src/lib/google-drive/client";

// Folder IDs to scan
const FOLDER_CONFIG = {
  bids: {
    active: "1-1hwF_RdO_0Ew3oGx7f7i6UMmc4TP91f",      // Bids Active → submitted
    closed: "1O-jcjcUIvDj01soqufbMpo2ArwVYf4OK",      // Bids Closed (won) → won
    nogo: "1KdA_IhMM8WbCXbwfRpRFtrpdsHpOc4oa",        // Bids No-go (lost) → lost
    onhold: "13EpGMNSzhW79v2oAV_J1ofpZ7CbUq7Bg",      // Bids On-hold (draft) → draft
  },
  projects: {
    active: "1qRGYL7NylTEkjjvoZStyjPWJyWR9fI6n",      // Projects Active → active
    closed: "12mqpQMBs_AuXtq40CMMYVdsHHgFsUmlG",      // Projects Closed → closed
  },
};

// Status mapping based on source folder
const BID_STATUS_MAP: Record<string, string> = {
  active: "submitted",
  closed: "won",
  nogo: "lost",
  onhold: "draft",
};

const PROJECT_STATUS_MAP: Record<string, string> = {
  active: "active",
  closed: "closed",
};

// Client code mappings
const CLIENT_CODE_MAPPINGS: Record<string, string> = {
  CD: "Certified Demolition",
  ADR: "ADR Construction",
  "R&S": "Russell and Sons",
  Russell: "Russell and Sons",
  "Russell & Sons": "Russell and Sons",
  Snowdon: "Snowdon Construction",
  Snowden: "Snowdon Construction",
  Soma: "Soma Construction",
  SOMA: "Soma Construction",
  Tannen: "Tannen Construction",
  ROMA: "ROMA Construction",
};

interface ParsedFolder {
  code: string;
  clientCode: string;
  clientName: string;
  description: string;
  rawName: string;
}

/**
 * Parse folder name using multiple regex patterns
 * Supports:
 * - YYMMXXX - Client - Name (e.g., 2601007 - CD - Landmark Terrace)
 * - YY-MM-XXX - Client - Name (e.g., 25-06-009 - Russell & Sons - Project)
 * - YYMM-XXX - Client - Name (e.g., 2512-005 - ROMA - Project)
 */
function parseFolderName(name: string): ParsedFolder | null {
  // Pattern 1: YYMMXXX - Client - Name
  const pattern1 = /^(\d{7})\s*-\s*([^-]+)\s*-\s*(.+)$/;

  // Pattern 2: YY-MM-XXX - Client - Name
  const pattern2 = /^(\d{2})-(\d{2})-(\d{3})\s*-\s*([^-]+)\s*-\s*(.+)$/;

  // Pattern 3: YYMM-XXX - Client - Name
  const pattern3 = /^(\d{4})-(\d{3})\s*-\s*([^-]+)\s*-\s*(.+)$/;

  let match = name.match(pattern1);
  if (match) {
    const clientCode = match[2].trim();
    return {
      code: match[1],
      clientCode,
      clientName: resolveClientName(clientCode),
      description: match[3].trim(),
      rawName: name,
    };
  }

  match = name.match(pattern2);
  if (match) {
    const code = `${match[1]}${match[2]}${match[3]}`;
    const clientCode = match[4].trim();
    return {
      code,
      clientCode,
      clientName: resolveClientName(clientCode),
      description: match[5].trim(),
      rawName: name,
    };
  }

  match = name.match(pattern3);
  if (match) {
    const code = `${match[1]}${match[2]}`;
    const clientCode = match[3].trim();
    return {
      code,
      clientCode,
      clientName: resolveClientName(clientCode),
      description: match[4].trim(),
      rawName: name,
    };
  }

  return null;
}

/**
 * Resolve client code to full name
 */
function resolveClientName(code: string): string {
  return CLIENT_CODE_MAPPINGS[code] || code;
}

/**
 * Main import function
 */
async function importHistory() {
  console.log("=== DeHyl Historical Data Import ===\n");

  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch Google OAuth tokens from Supabase
  console.log("Fetching Google OAuth tokens...");
  const { data: tokenData, error: tokenError } = await supabase
    .from("oauth_tokens")
    .select("*")
    .eq("provider", "google")
    .single();

  if (tokenError || !tokenData) {
    console.error("Failed to fetch Google OAuth tokens:", tokenError);
    console.error("Please connect Google Drive in the Settings page first.");
    process.exit(1);
  }

  // Initialize Google Drive client
  const driveClient = new GoogleDriveClient();
  driveClient.setTokens({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: new Date(tokenData.expires_at),
  });

  // Stats tracking
  const stats = {
    bids: { processed: 0, imported: 0, skipped: 0, errors: 0 },
    projects: { processed: 0, imported: 0, skipped: 0, errors: 0 },
  };

  // Import Bids
  console.log("\n--- Importing Bids ---\n");
  for (const [folderType, folderId] of Object.entries(FOLDER_CONFIG.bids)) {
    const status = BID_STATUS_MAP[folderType];
    console.log(`Fetching ${folderType} bids (status: ${status})...`);

    try {
      const folders = await driveClient.listProjectFolders(folderId);
      console.log(`  Found ${folders.length} folders`);

      for (const folder of folders) {
        stats.bids.processed++;
        const parsed = parseFolderName(folder.name);

        if (!parsed) {
          console.log(`  ⚠ Skipped (unparseable): ${folder.name}`);
          stats.bids.skipped++;
          continue;
        }

        const bidData = {
          name: folder.name,
          client_code: parsed.clientCode,
          client_name: parsed.clientName,
          description: parsed.description,
          status,
          drive_folder_id: folder.id,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("bids")
          .upsert(bidData, {
            onConflict: "drive_folder_id",
            ignoreDuplicates: false
          });

        if (error) {
          console.log(`  ✗ Error: ${folder.name} - ${error.message}`);
          stats.bids.errors++;
        } else {
          console.log(`  ✓ Imported: ${parsed.code} - ${parsed.clientCode} - ${parsed.description}`);
          stats.bids.imported++;
        }
      }
    } catch (error) {
      console.error(`  Error fetching ${folderType} bids:`, error);
    }
  }

  // Import Projects
  console.log("\n--- Importing Projects ---\n");
  for (const [folderType, folderId] of Object.entries(FOLDER_CONFIG.projects)) {
    const status = PROJECT_STATUS_MAP[folderType];
    console.log(`Fetching ${folderType} projects (status: ${status})...`);

    try {
      const folders = await driveClient.listProjectFolders(folderId);
      console.log(`  Found ${folders.length} folders`);

      for (const folder of folders) {
        stats.projects.processed++;
        const parsed = parseFolderName(folder.name);

        if (!parsed) {
          console.log(`  ⚠ Skipped (unparseable): ${folder.name}`);
          stats.projects.skipped++;
          continue;
        }

        const projectData = {
          drive_id: folder.id,
          code: parsed.code,
          client_code: parsed.clientCode,
          client_name: parsed.clientName,
          description: parsed.description,
          status,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("projects")
          .upsert(projectData, {
            onConflict: "drive_id",
            ignoreDuplicates: false
          });

        if (error) {
          console.log(`  ✗ Error: ${folder.name} - ${error.message}`);
          stats.projects.errors++;
        } else {
          console.log(`  ✓ Imported: ${parsed.code} - ${parsed.clientCode} - ${parsed.description}`);
          stats.projects.imported++;
        }
      }
    } catch (error) {
      console.error(`  Error fetching ${folderType} projects:`, error);
    }
  }

  // Print summary
  console.log("\n=== Import Summary ===\n");
  console.log("Bids:");
  console.log(`  Processed: ${stats.bids.processed}`);
  console.log(`  Imported:  ${stats.bids.imported}`);
  console.log(`  Skipped:   ${stats.bids.skipped}`);
  console.log(`  Errors:    ${stats.bids.errors}`);
  console.log("\nProjects:");
  console.log(`  Processed: ${stats.projects.processed}`);
  console.log(`  Imported:  ${stats.projects.imported}`);
  console.log(`  Skipped:   ${stats.projects.skipped}`);
  console.log(`  Errors:    ${stats.projects.errors}`);
  console.log("\n=== Import Complete ===");
}

// Run the import
importHistory().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
