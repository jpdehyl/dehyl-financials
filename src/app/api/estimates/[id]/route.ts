import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/estimates/[id] - Get a specific estimate
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { data: estimate, error } = await supabase
      .from("estimates")
      .select(`
        *,
        line_items:estimate_line_items(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Estimate not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching estimate:", error);
      return NextResponse.json(
        { error: "Failed to fetch estimate" },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedEstimate = {
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
    };

    return NextResponse.json({ estimate: transformedEstimate });
  } catch (error) {
    console.error("Error in GET /api/estimates/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/estimates/[id] - Update an estimate
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, status, notes, lineItems } = body;

    // Update the estimate
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "sent") updateData.sent_date = new Date().toISOString();
      if (status === "approved") updateData.approved_date = new Date().toISOString();
    }
    if (notes !== undefined) updateData.notes = notes;

    const { error: updateError } = await supabase
      .from("estimates")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating estimate:", updateError);
      return NextResponse.json(
        { error: "Failed to update estimate" },
        { status: 500 }
      );
    }

    // Update line items if provided
    if (lineItems !== undefined) {
      // Delete existing line items
      await supabase
        .from("estimate_line_items")
        .delete()
        .eq("estimate_id", id);

      // Insert new line items
      if (lineItems.length > 0) {
        const lineItemsToInsert = lineItems.map((item: {
          category: string;
          description: string;
          quantity: number;
          unit: string;
          unitPrice: number;
          sortOrder?: number;
          notes?: string;
        }, index: number) => ({
          estimate_id: id,
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
        }
      }
    }

    // Fetch and return updated estimate
    const { data: updatedEstimate } = await supabase
      .from("estimates")
      .select(`
        *,
        line_items:estimate_line_items(*)
      `)
      .eq("id", id)
      .single();

    return NextResponse.json({
      success: true,
      estimate: updatedEstimate,
    });
  } catch (error) {
    console.error("Error in PUT /api/estimates/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id] - Delete an estimate
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    // Line items are deleted automatically via CASCADE
    const { error } = await supabase
      .from("estimates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting estimate:", error);
      return NextResponse.json(
        { error: "Failed to delete estimate" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/estimates/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
