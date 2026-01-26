import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RevenueMonth {
  month: string;
  label: string;
  invoiced: number;
  collected: number;
  outstanding: number;
}

interface RevenueResponse {
  months: RevenueMonth[];
  totals: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const monthsParam = searchParams.get("months");
  const numMonths = monthsParam ? parseInt(monthsParam, 10) : 12;

  // Calculate the date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - numMonths);

  // Fetch invoices within the date range
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, amount, balance, issue_date")
    .gte("issue_date", startDate.toISOString().split("T")[0])
    .lte("issue_date", endDate.toISOString().split("T")[0]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no invoices, return empty response with message
  if (!invoices || invoices.length === 0) {
    return NextResponse.json({
      months: [],
      totals: {
        totalInvoiced: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      },
      message: "No invoice data yet. Sync QuickBooks to see revenue trends.",
    });
  }

  // Group invoices by month
  const monthlyData = new Map<string, { invoiced: number; collected: number; outstanding: number }>();

  for (const invoice of invoices) {
    const issueDate = new Date(invoice.issue_date);
    const monthKey = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, "0")}`;

    const amount = Number(invoice.amount) || 0;
    const balance = Number(invoice.balance) || 0;
    const collected = amount - balance;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { invoiced: 0, collected: 0, outstanding: 0 });
    }

    const current = monthlyData.get(monthKey)!;
    current.invoiced += amount;
    current.collected += collected;
    current.outstanding += balance;
  }

  // Convert to sorted array with labels
  const sortedMonths = Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      return {
        month: monthKey,
        label,
        invoiced: Math.round(data.invoiced * 100) / 100,
        collected: Math.round(data.collected * 100) / 100,
        outstanding: Math.round(data.outstanding * 100) / 100,
      };
    });

  // Calculate totals
  const totals = sortedMonths.reduce(
    (acc, month) => ({
      totalInvoiced: acc.totalInvoiced + month.invoiced,
      totalCollected: acc.totalCollected + month.collected,
      totalOutstanding: acc.totalOutstanding + month.outstanding,
    }),
    { totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0 }
  );

  const response: RevenueResponse = {
    months: sortedMonths,
    totals: {
      totalInvoiced: Math.round(totals.totalInvoiced * 100) / 100,
      totalCollected: Math.round(totals.totalCollected * 100) / 100,
      totalOutstanding: Math.round(totals.totalOutstanding * 100) / 100,
    },
  };

  return NextResponse.json(response);
}
