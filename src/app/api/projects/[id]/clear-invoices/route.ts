import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/projects/[id]/clear-invoices - Clear all invoice assignments for a project
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // Clear invoice assignments
    const { error: invError } = await supabase
      .from("invoices")
      .update({ project_id: null, match_confidence: null })
      .eq("project_id", id);

    if (invError) {
      console.error("Failed to clear invoices:", invError);
    }

    // Clear bill assignments
    const { error: billError } = await supabase
      .from("bills")
      .update({ project_id: null })
      .eq("project_id", id);

    if (billError) {
      console.error("Failed to clear bills:", billError);
    }

    return NextResponse.json({
      success: true,
      message: "Invoices and bills cleared from project"
    });
  } catch (error) {
    console.error("Clear invoices error:", error);
    return NextResponse.json(
      { error: "Failed to clear invoices" },
      { status: 500 }
    );
  }
}
