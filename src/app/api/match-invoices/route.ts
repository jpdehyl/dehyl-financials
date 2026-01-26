import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Extract project code from text (format: 7 digits starting with 2, e.g., 2601007)
function extractProjectCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(/\b(2[0-9]{6})\b/);
  return match ? match[1] : null;
}

// Normalize text for fuzzy matching
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Check if memo contains project description keywords
function findProjectByDescription(
  memo: string | null | undefined,
  projects: Array<{ id: string; code: string; description: string | null }>
): { projectId: string; confidence: 'medium' | 'low' } | null {
  if (!memo) return null;
  
  const normalizedMemo = normalize(memo);
  
  for (const project of projects) {
    if (!project.description) continue;
    
    const normalizedDesc = normalize(project.description);
    const keywords = normalizedDesc.split(' ').filter(w => w.length > 3);
    
    // Count how many significant keywords match
    let matchCount = 0;
    for (const keyword of keywords) {
      if (normalizedMemo.includes(keyword)) {
        matchCount++;
      }
    }
    
    // If most keywords match, consider it a match
    if (keywords.length > 0 && matchCount >= Math.ceil(keywords.length * 0.6)) {
      return { 
        projectId: project.id, 
        confidence: matchCount === keywords.length ? 'medium' : 'low' 
      };
    }
  }
  
  return null;
}

export async function POST() {
  const supabase = await createClient();

  try {
    // Get all projects with description for matching
    const { data: projects, error: projError } = await supabase
      .from("projects")
      .select("id, code, description");

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
      .select("id, memo, project_id, client_name");

    if (invError) {
      return NextResponse.json(
        { error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    // Get all bills
    const { data: bills, error: billError } = await supabase
      .from("bills")
      .select("id, memo, project_id, vendor_name");

    if (billError) {
      return NextResponse.json(
        { error: "Failed to fetch bills" },
        { status: 500 }
      );
    }

    let invoicesMatchedHigh = 0;
    let invoicesMatchedMedium = 0;
    let invoicesCleared = 0;
    let billsMatchedHigh = 0;
    let billsMatchedMedium = 0;
    let billsCleared = 0;

    // Match invoices
    for (const inv of invoices || []) {
      // Try matching by project code first (high confidence)
      const code = extractProjectCode(inv.memo);
      let newProjectId = code ? projectCodeMap.get(code) || null : null;
      let confidence: 'high' | 'medium' | 'low' | null = newProjectId ? 'high' : null;
      
      // If no code match, try description matching
      if (!newProjectId) {
        const searchText = [inv.memo, inv.client_name].filter(Boolean).join(' ');
        const descMatch = findProjectByDescription(searchText, projects || []);
        if (descMatch) {
          newProjectId = descMatch.projectId;
          confidence = descMatch.confidence;
        }
      }

      // Only update if different
      if (newProjectId !== inv.project_id) {
        const { error } = await supabase
          .from("invoices")
          .update({ 
            project_id: newProjectId,
            match_confidence: confidence
          })
          .eq("id", inv.id);

        if (!error) {
          if (newProjectId) {
            if (confidence === 'high') invoicesMatchedHigh++;
            else invoicesMatchedMedium++;
          } else if (inv.project_id) {
            invoicesCleared++;
          }
        }
      }
    }

    // Match bills
    for (const bill of bills || []) {
      // Try matching by project code first (high confidence)
      const code = extractProjectCode(bill.memo);
      let newProjectId = code ? projectCodeMap.get(code) || null : null;
      let confidence: 'high' | 'medium' | 'low' | null = newProjectId ? 'high' : null;
      
      // If no code match, try description matching
      if (!newProjectId) {
        const searchText = [bill.memo, bill.vendor_name].filter(Boolean).join(' ');
        const descMatch = findProjectByDescription(searchText, projects || []);
        if (descMatch) {
          newProjectId = descMatch.projectId;
          confidence = descMatch.confidence;
        }
      }

      // Only update if different
      if (newProjectId !== bill.project_id) {
        const { error } = await supabase
          .from("bills")
          .update({ project_id: newProjectId })
          .eq("id", bill.id);

        if (!error) {
          if (newProjectId) {
            if (confidence === 'high') billsMatchedHigh++;
            else billsMatchedMedium++;
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
        matchedByCode: invoicesMatchedHigh,
        matchedByDescription: invoicesMatchedMedium,
        cleared: invoicesCleared,
      },
      bills: {
        total: bills?.length || 0,
        matchedByCode: billsMatchedHigh,
        matchedByDescription: billsMatchedMedium,
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
