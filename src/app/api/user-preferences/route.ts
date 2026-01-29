import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/user-preferences
 * Get user's dashboard preferences
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "default";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned (not an error for us)
    return NextResponse.json(
      { error: "Failed to fetch preferences", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    preferences: data || null,
    userId,
  });
}

/**
 * POST /api/user-preferences
 * Save user's dashboard preferences
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = "default", dashboardJson, presetKey } = body;

    if (!dashboardJson && !presetKey) {
      return NextResponse.json(
        { error: "Either dashboardJson or presetKey is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Upsert (insert or update) the preferences
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          dashboard_json: dashboardJson || null,
          preset_key: presetKey || "executive",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save preferences", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/user-preferences
 * Reset user's dashboard preferences to default
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "default";

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_preferences")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete preferences", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Preferences reset to default",
  });
}
