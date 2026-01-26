import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Extract project code from text (format: 7 digits starting with 2, e.g., 2601007)
function extractProjectCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(/\b(2[0-9]{6})\b/);
  return match ? match[1] : null;
}

export async function POST() {
  const supabase = await createClient();

  try {
    // Get all projects for code mapping
    const { data: projects, error: projError } = await supabase
      .from("projects")
      .select("id, code");

    if (projError) {
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    const projectCodeMap = new Map(
      (projects || []).map((p) => [p.code, p.id])
    );

    // Get all invoices
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("id, memo, project_id");

    if (invError) {
      return NextResponse.json(
        { error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    // Get all bills
    const { data: bills, error: billError } = await supabase
      .from("bills")
      .select("id, memo, project_id");

    if (billError) {
      return NextResponse.json(
        { error: "Failed to fetch bills" },
        { status: 500 }
      );
    }

    let invoicesMatched = 0;
    let invoicesCleared = 0;
    let billsMatched = 0;
    let billsCleared = 0;

    // Match invoices
    for (const inv of invoices || []) {
      const code = extractProjectCode(inv.memo);
      const newProjectId = code ? projectCodeMap.get(code) || null : null;

      // Only update if different
      if (newProjectId !== inv.project_id) {
        const { error } = await supabase
          .from("invoices")
          .update({ 
            project_id: newProjectId,
            match_confidence: newProjectId ? "high" : null
          })
          .eq("id", inv.id);

        if (!error) {
          if (newProjectId) {
            invoicesMatched++;
          } else if (inv.project_id) {
            invoicesCleared++;
          }
        }
      }
    }

    // Match bills
    for (const bill of bills || []) {
      const code = extractProjectCode(bill.memo);
      const newProjectId = code ? projectCodeMap.get(code) || null : null;

      // Only update if different
      if (newProjectId !== bill.project_id) {
        const { error } = await supabase
          .from("bills")
          .update({ project_id: newProjectId })
          .eq("id", bill.id);

        if (!error) {
          if (newProjectId) {
            billsMatched++;
          } else if (bill.project_id) {
            billsCleared++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      invoices: {
        total: invoices?.length || 0,
        matched: invoicesMatched,
        cleared: invoicesCleared,
      },
      bills: {
        total: bills?.length || 0,
        matched: billsMatched,
        cleared: billsCleared,
      },
    });
  } catch (error) {
    console.error("Match invoices error:", error);
    return NextResponse.json(
      { error: "Failed to match invoices" },
      { status: 500 }
    );
  }
}
