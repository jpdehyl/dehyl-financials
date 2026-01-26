import { NextResponse } from "next/server";
import { driveClient } from "@/lib/google-drive/client";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  let syncLogId: string | null = null;

  try {
    // Log sync start
    const { data: syncLog } = await supabase
      .from("sync_log")
      .insert({
        source: "google_drive_estimates",
        status: "started",
      })
      .select("id")
      .single();
    syncLogId = syncLog?.id || null;

    // Get tokens from Supabase
    const { data: tokenData, error: tokenError } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("provider", "google")
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Google Drive not connected. Please connect in Settings." },
        { status: 401 }
      );
    }

    // Initialize Drive client with stored tokens
    driveClient.setTokens({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(tokenData.expires_at),
    });

    // Get all projects from the database
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, drive_id, code");

    if (projectsError || !projects) {
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    let scanned = 0;
    let withEstimates = 0;
    let withoutEstimates = 0;

    // Scan each project folder for estimates
    for (const project of projects) {
      if (!project.drive_id) continue;

      scanned++;

      try {
        // Check for estimate in the project folder
        const hasEstimate = await driveClient.hasEstimateFolder(project.drive_id);

        if (hasEstimate) {
          withEstimates++;
          // Update the project with the estimate drive ID
          await supabase
            .from("projects")
            .update({ estimate_drive_id: project.drive_id })
            .eq("id", project.id);
        } else {
          withoutEstimates++;
          // Clear estimate if it no longer exists
          await supabase
            .from("projects")
            .update({ estimate_drive_id: null })
            .eq("id", project.id);
        }
      } catch (err) {
        console.error(`Error scanning project ${project.code}:`, err);
        withoutEstimates++;
      }
    }

    // Update sync log with success
    if (syncLogId) {
      await supabase
        .from("sync_log")
        .update({
          status: "completed",
          records_synced: withEstimates,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLogId);
    }

    return NextResponse.json({
      success: true,
      scanned,
      withEstimates,
      withoutEstimates,
    });
  } catch (error) {
    console.error("Estimates sync error:", error);

    // Log failed sync
    if (syncLogId) {
      await supabase
        .from("sync_log")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLogId);
    }

    return NextResponse.json(
      { error: "Failed to sync estimates" },
      { status: 500 }
    );
  }
}
