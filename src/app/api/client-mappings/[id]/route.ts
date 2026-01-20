import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/client-mappings/[id]
 * Returns a single client mapping
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("client_mappings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Client mapping not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mapping: {
        id: data.id,
        code: data.code,
        displayName: data.display_name,
        qbCustomerName: data.qb_customer_name,
        aliases: data.aliases || [],
      },
    });
  } catch (error) {
    console.error("Error fetching client mapping:", error);
    return NextResponse.json(
      { error: "Failed to fetch client mapping" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/client-mappings/[id]
 * Updates a client mapping
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { code, displayName, qbCustomerName, aliases } = body;

    if (!code || !displayName) {
      return NextResponse.json(
        { error: "Code and display name are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("client_mappings")
      .update({
        code: code.toUpperCase(),
        display_name: displayName,
        qb_customer_name: qbCustomerName || null,
        aliases: aliases || [],
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A mapping with this code already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      mapping: {
        id: data.id,
        code: data.code,
        displayName: data.display_name,
        qbCustomerName: data.qb_customer_name,
        aliases: data.aliases || [],
      },
    });
  } catch (error) {
    console.error("Error updating client mapping:", error);
    return NextResponse.json(
      { error: "Failed to update client mapping" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client-mappings/[id]
 * Deletes a client mapping
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("client_mappings")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Client mapping deleted",
    });
  } catch (error) {
    console.error("Error deleting client mapping:", error);
    return NextResponse.json(
      { error: "Failed to delete client mapping" },
      { status: 500 }
    );
  }
}
