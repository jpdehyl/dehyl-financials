import { NextRequest, NextResponse } from "next/server";
import {
  getProjectById,
  getInvoicesByProjectId,
  getBillsByProjectId,
} from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // In production, this would fetch data from Supabase
  const project = getProjectById(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const invoices = getInvoicesByProjectId(id);
  const bills = getBillsByProjectId(id);

  return NextResponse.json({
    project,
    invoices,
    bills,
  });
}
