import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface TokenMetadata {
  companyName?: string;
  email?: string;
  name?: string;
}

export async function GET() {
  const supabase = await createClient();

  // Get OAuth tokens
  const { data: tokens } = await supabase
    .from("oauth_tokens")
    .select("provider, metadata, updated_at");

  // Get last sync times
  const { data: qbSync } = await supabase
    .from("sync_log")
    .select("completed_at")
    .eq("source", "quickbooks")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  const { data: driveSync } = await supabase
    .from("sync_log")
    .select("completed_at")
    .eq("source", "google_drive")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  const qbToken = tokens?.find((t) => t.provider === "quickbooks");
  const googleToken = tokens?.find((t) => t.provider === "google");

  const qbMetadata = qbToken?.metadata as TokenMetadata | null;
  const googleMetadata = googleToken?.metadata as TokenMetadata | null;

  return NextResponse.json({
    quickbooks: {
      connected: !!qbToken,
      companyName: qbMetadata?.companyName,
      lastSyncedAt: qbSync?.completed_at || null,
    },
    googleDrive: {
      connected: !!googleToken,
      email: googleMetadata?.email,
      lastSyncedAt: driveSync?.completed_at || null,
    },
  });
}
