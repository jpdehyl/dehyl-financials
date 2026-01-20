import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/estimates - Get all estimates or filter by project
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  try {
    let query = supabase
      .from("estimates")
      .select(`
        *,
        line_items:estimate_line_items(*)
      `)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching estimates:", error);
      return NextResponse.json(
        { error: "Failed to fetch estimates" },
        { status: 500 }
      );
    }

    // Transform snake_case to camelCase
    const estimates = data?.map((estimate) => ({
      id: estimate.id,
      projectId: estimate.project_id,
      name: estimate.name,
      description: estimate.description,
      totalAmount: estimate.total_amount,
      source: estimate.source,
      driveFileId: estimate.drive_file_id,
      status: estimate.status,
      sentDate: estimate.sent_date,
      approvedDate: estimate.approved_date,
      notes: estimate.notes,
      createdAt: estimate.created_at,
      updatedAt: estimate.updated_at,
      lineItems: estimate.line_items?.map((item: Record<string, unknown>) => ({
        id: item.id,
        estimateId: item.estimate_id,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        sortOrder: item.sort_order,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) || [],
    }));

    return NextResponse.json({ estimates });
  } catch (error) {
    console.error("Error in GET /api/estimates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/estimates - Create a new estimate
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { projectId, name, description, status, lineItems } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Estimate name is required" },
        { status: 400 }
      );
    }

    // Create the estimate
    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .insert({
        project_id: projectId || null,
        name,
        description: description || null,
        source: "manual",
        status: status || "draft",
      })
      .select()
      .single();

    if (estimateError) {
      console.error("Error creating estimate:", estimateError);
      return NextResponse.json(
        { error: "Failed to create estimate" },
        { status: 500 }
      );
    }

    // Insert line items if provided
    if (lineItems && lineItems.length > 0) {
      const lineItemsToInsert = lineItems.map((item: {
        category: string;
        description: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        sortOrder?: number;
        notes?: string;
      }, index: number) => ({
        estimate_id: estimate.id,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        sort_order: item.sortOrder ?? index,
        notes: item.notes || null,
      }));

      const { error: lineItemsError } = await supabase
        .from("estimate_line_items")
        .insert(lineItemsToInsert);

      if (lineItemsError) {
        console.error("Error inserting line items:", lineItemsError);
        // Don't fail the whole request, estimate was created
      }
    }

    // Fetch the complete estimate with line items
    const { data: completeEstimate } = await supabase
      .from("estimates")
      .select(`
        *,
        line_items:estimate_line_items(*)
      `)
      .eq("id", estimate.id)
      .single();

    return NextResponse.json({
      success: true,
      estimate: completeEstimate,
    });
  } catch (error) {
    console.error("Error in POST /api/estimates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
